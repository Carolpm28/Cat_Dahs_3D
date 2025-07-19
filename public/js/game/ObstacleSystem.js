// js/game/ObstacleSystem.js - Sistema de obstáculos equilibrado para Cat Dash 3D
export class ObstacleSystem {
    constructor(trackManager) {
        this.trackManager = trackManager;
        this.obstacles = [];
        
        // Tipos de obstáculos
        this.obstacleTypes = {
            BOX: {
                name: 'Caixa de Papelão',
                color: 0x8B6F47,
                size: { width: 2, height: 1.5, depth: 2 },
                jumpable: true
            },
            VASE: {
                name: 'Vaso',
                color: 0x4169E1,
                size: { radius: 0.8, height: 2 },
                jumpable: true,
                breakable: true
            },
            BOOKS: {
                name: 'Pilha de Livros',
                color: 0x8B4513,
                size: { width: 2.5, height: 1, depth: 1.5 },
                jumpable: true
            },
            TOY_MOUSE: {
                name: 'Rato de Brinquedo',
                color: 0x808080,
                size: { width: 1, height: 0.5, depth: 1.5 },
                jumpable: true,
                bonus: true
            },
            WATER_BOWL: {
                name: 'Tigela de Água',
                color: 0x00CED1,
                size: { radius: 1.2, height: 0.8 },
                jumpable: false,
                slowdown: true
            },
            SLIPPERS: {
                name: 'Chinelos',
                color: 0xFF69B4,
                size: { width: 1.5, height: 0.3, depth: 2.5 },
                jumpable: true
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🚧 Sistema de Obstáculos iniciado!');
        this.createObstacles();
    }
    
    createObstacles() {
        if (!this.trackManager.trackPath) return;
        
        // Criar 15-20 obstáculos ao longo da pista
        const numObstacles = 15 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < numObstacles; i++) {
            // Distribuir obstáculos mas evitar o início
            const t = 0.1 + (i / numObstacles) * 0.85;
            const position = this.trackManager.getPositionOnTrack(t);
            const direction = this.trackManager.getDirectionOnTrack(t);
            
            // Escolher tipo aleatório
            const types = Object.keys(this.obstacleTypes);
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            // Posição lateral aleatória na pista
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            const lateralOffset = (Math.random() - 0.5) * this.trackManager.trackWidth * 0.6;
            position.add(perpendicular.multiplyScalar(lateralOffset));
            
            this.createObstacle(position, randomType, direction);
        }
        
        console.log(`🚧 ${numObstacles} obstáculos criados!`);
    }
    
    createObstacle(position, type, direction) {
        const obstacleData = this.obstacleTypes[type];
        const group = new THREE.Group();
        
        let obstacle;
        
        switch (type) {
            case 'BOX':
                obstacle = this.createBox(obstacleData);
                break;
            case 'VASE':
                obstacle = this.createVase(obstacleData);
                break;
            case 'BOOKS':
                obstacle = this.createBooks(obstacleData);
                break;
            case 'TOY_MOUSE':
                obstacle = this.createToyMouse(obstacleData);
                break;
            case 'WATER_BOWL':
                obstacle = this.createWaterBowl(obstacleData);
                break;
            case 'SLIPPERS':
                obstacle = this.createSlippers(obstacleData);
                break;
        }
        
        group.add(obstacle);
        
        // Posicionar e orientar
        group.position.copy(position);
        group.position.y = 0;
        
        // Rotação aleatória ou alinhada com a pista
        if (type === 'SLIPPERS' || type === 'BOOKS') {
            const angle = Math.atan2(direction.x, direction.z);
            group.rotation.y = angle + (Math.random() - 0.5) * 0.5;
        } else {
            group.rotation.y = Math.random() * Math.PI * 2;
        }
        
        // Dados do obstáculo
        group.userData = {
            type: type,
            jumpable: obstacleData.jumpable,
            breakable: obstacleData.breakable || false,
            slowdown: obstacleData.slowdown || false,
            bonus: obstacleData.bonus || false,
            broken: false
        };
        
        // Adicionar à cena
        window.scene.add(group);
        this.obstacles.push(group);
    }
    
    createBox(data) {
        const group = new THREE.Group();
        
        // Caixa principal
        const geometry = new THREE.BoxGeometry(data.size.width, data.size.height, data.size.depth);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8
        });
        const box = new THREE.Mesh(geometry, material);
        box.position.y = data.size.height / 2;
        box.castShadow = true;
        box.receiveShadow = true;
        
        // Fita adesiva
        const tapeGeometry = new THREE.BoxGeometry(data.size.width + 0.1, 0.1, 0.2);
        const tapeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFE4B5 });
        
        const tape1 = new THREE.Mesh(tapeGeometry, tapeMaterial);
        tape1.position.y = data.size.height;
        tape1.position.z = 0;
        
        const tape2 = new THREE.Mesh(tapeGeometry, tapeMaterial);
        tape2.position.y = data.size.height;
        tape2.rotation.y = Math.PI / 2;
        
        group.add(box, tape1, tape2);
        return group;
    }
    
    createVase(data) {
        const group = new THREE.Group();
        
        // Base do vaso
        const vaseGeometry = new THREE.CylinderGeometry(
            data.size.radius * 0.7,
            data.size.radius,
            data.size.height,
            16
        );
        const vaseMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.3,
            metalness: 0.2
        });
        const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
        vase.position.y = data.size.height / 2;
        vase.castShadow = true;
        vase.receiveShadow = true;
        
        // Decoração
        const ringGeometry = new THREE.TorusGeometry(data.size.radius * 0.8, 0.05, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = data.size.height * 0.7;
        ring.rotation.x = Math.PI / 2;
        
        group.add(vase, ring);
        return group;
    }
    
    createBooks(data) {
        const group = new THREE.Group();
        const bookColors = [0x8B4513, 0x2F4F4F, 0x8B0000, 0x191970];
        
        // Criar 3-4 livros empilhados
        const numBooks = 3 + Math.floor(Math.random() * 2);
        let currentHeight = 0;
        
        for (let i = 0; i < numBooks; i++) {
            const bookHeight = 0.2 + Math.random() * 0.2;
            const bookGeometry = new THREE.BoxGeometry(
                data.size.width * (0.8 + Math.random() * 0.2),
                bookHeight,
                data.size.depth * (0.8 + Math.random() * 0.2)
            );
            const bookMaterial = new THREE.MeshStandardMaterial({
                color: bookColors[i % bookColors.length],
                roughness: 0.7
            });
            const book = new THREE.Mesh(bookGeometry, bookMaterial);
            book.position.y = currentHeight + bookHeight / 2;
            book.rotation.y = (Math.random() - 0.5) * 0.2;
            book.castShadow = true;
            book.receiveShadow = true;
            
            currentHeight += bookHeight;
            group.add(book);
        }
        
        return group;
    }
    
    createToyMouse(data) {
        const group = new THREE.Group();
        
        // Corpo do rato
        const bodyGeometry = new THREE.SphereGeometry(data.size.width / 2, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.z = 1.5;
        body.position.y = data.size.height / 2;
        body.castShadow = true;
        
        // Orelhas
        const earGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const earMaterial = new THREE.MeshStandardMaterial({ color: 0xFFC0CB });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.3, data.size.height, -0.2);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.3, data.size.height, -0.2);
        
        // Rabo
        const tailGeometry = new THREE.CylinderGeometry(0.05, 0.1, 1, 8);
        const tailMaterial = new THREE.MeshStandardMaterial({ color: data.color });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, data.size.height / 2, 0.8);
        tail.rotation.x = Math.PI / 4;
        
        group.add(body, leftEar, rightEar, tail);
        return group;
    }
    
    createWaterBowl(data) {
        const group = new THREE.Group();
        
        // Tigela
        const bowlGeometry = new THREE.CylinderGeometry(
            data.size.radius,
            data.size.radius * 0.7,
            data.size.height,
            16
        );
        const bowlMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF6347,
            roughness: 0.3
        });
        const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
        bowl.position.y = data.size.height / 2;
        bowl.castShadow = true;
        bowl.receiveShadow = true;
        
        // Água
        const waterGeometry = new THREE.CylinderGeometry(
            data.size.radius * 0.9,
            data.size.radius * 0.65,
            data.size.height * 0.7,
            16
        );
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.5
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = data.size.height / 2;
        
        group.add(bowl, water);
        return group;
    }
    
    createSlippers(data) {
        const group = new THREE.Group();
        
        // Criar dois chinelos
        for (let i = 0; i < 2; i++) {
            const slipperGroup = new THREE.Group();
            
            // Base do chinelo
            const baseGeometry = new THREE.BoxGeometry(
                data.size.width,
                data.size.height,
                data.size.depth
            );
            const baseMaterial = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.8
            });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = data.size.height / 2;
            
            // Tira
            const strapGeometry = new THREE.BoxGeometry(
                data.size.width * 0.8,
                data.size.height * 2,
                0.3
            );
            const strapMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                roughness: 0.9
            });
            const strap = new THREE.Mesh(strapGeometry, strapMaterial);
            strap.position.set(0, data.size.height, -data.size.depth * 0.3);
            
            slipperGroup.add(base, strap);
            slipperGroup.position.x = i === 0 ? -1 : 1;
            slipperGroup.rotation.y = i === 0 ? 0.2 : -0.2;
            slipperGroup.castShadow = true;
            
            group.add(slipperGroup);
        }
        
        return group;
    }
    
    // 🔧 SISTEMA DE COLISÃO EQUILIBRADO - Agora mais justo para ambos
    checkCollisions(player) {
        const playerPos = player.model.position;
        const playerRadius = 1.2; // ⬇️ REDUZIDO: Igual para todos
        
        // Se o jogador tem escudo, não verifica colisões
        if (player.hasShield) {
            return;
        }

        this.obstacles.forEach(obstacle => {
            if (obstacle.userData.broken) return;
            const distance = playerPos.distanceTo(obstacle.position);
            const collisionRadius = 1.5; // ⬇️ REDUZIDO: Igual para todos
            
            // Colisão detectada
            if (distance < playerRadius + collisionRadius) {
                console.log(`🚨 Colisão detectada! Jogador: ${player.isAI ? 'IA' : 'Humano'} | Distância: ${distance.toFixed(2)} | Objeto: ${obstacle.userData.type}`);
                
                // Se o gato está a saltar e o obstáculo é saltável
                if (player.isJumping && player.jumpHeight > 0.5 && obstacle.userData.jumpable) {
                    if (obstacle.userData.bonus) {
                        console.log('🎯 Bónus! Saltou sobre o rato de brinquedo!');
                        player.speed *= 1.2; // ⚖️ BÓNUS IGUAL para todos
                    }
                    return;
                }
                
                // PARAR O MOVIMENTO IMEDIATAMENTE
                this.stopPlayerMovement(player);
                
                // Colisão com obstáculo
                this.handleCollision(player, obstacle);
            }
        });
    }

    stopPlayerMovement(player) {
        // Parar movimento completamente
        player.speed = 0;
        player.velocity = 0;
        
        // ⚖️ STUN IGUAL PARA TODOS: 700ms
        player.isStunned = true;
        player.stunnedUntil = Date.now() + 700;
        console.log(` ${player.isAI ? 'IA' : 'Jogador'} stunned por 700ms`);
    }


    handleCollision(player, obstacle) {
        const data = obstacle.userData;
        
        // Cooldown para evitar spam de colisões (aplicado a todos)
        if (!player.lastCollisionTime) {
            player.lastCollisionTime = 0;
        }
        
        const now = Date.now();
        if (now - player.lastCollisionTime < 400) {
            return; // Cooldown de 0.4 segundos para todos
        }
        player.lastCollisionTime = now;
        
        // Verificar escudo (funciona igual para todos)
        if (player.hasShield) {
            // Apenas ignora a penalização, não destrói o obstáculo
            console.log('🛡️ Escudo ativo! Jogador atravessou obstáculo sem penalização.');
            return;
        }
        
        // 🎯 PENALIZAÇÕES EQUILIBRADAS - Mais próximas entre humano e IA
        if (data.slowdown) {
            // Tigela de água - penalização moderada
            const slowdownFactor = player.isAI ? 0.75 : 0.7; // IA: 25% redução, Humano: 30%
            player.speed *= slowdownFactor;
            console.log(`💦 ${player.isAI ? 'IA' : 'Jogador'} molhado! Redução: ${Math.round((1-slowdownFactor)*100)}%`);
            this.createSplashEffect(obstacle.position);
            
        } else if (data.breakable && !data.broken) {
            // Vaso quebrável
            data.broken = true;
            const breakPenalty = player.isAI ? 0.8 : 0.75; // IA: 20% redução, Humano: 25%
            player.speed *= breakPenalty;
            console.log(`💥 ${player.isAI ? 'IA' : 'Jogador'} quebrou vaso! Redução: ${Math.round((1-breakPenalty)*100)}%`);
            this.breakVase(obstacle);
            
        } else {
            // Obstáculo normal
            const normalPenalty = player.isAI ? 0.85 : 0.8; // IA: 15% redução, Humano: 20%
            player.speed *= normalPenalty;
            console.log(`💥 ${player.isAI ? 'IA' : 'Jogador'} bateu em obstáculo! Redução: ${Math.round((1-normalPenalty)*100)}%`);
            this.createImpactEffect(obstacle.position);
        }
        
        // Sistema de empurrão para ajudar a sair (aplicado a todos)
        const pushDirection = new THREE.Vector3()
            .subVectors(player.model.position, obstacle.position)
            .normalize()
            .multiplyScalar(player.isAI ? 0.4 : 0.3); // IA recebe empurrão ligeiramente maior
        
        player.model.position.add(pushDirection);
        
        // 🕐 RECUPERAÇÃO EQUILIBRADA - Tempos similares
        const recoveryTime = player.isAI ? 700 : 800; // IA: 0.7s, Humano: 0.8s
        const recoverySpeed = player.maxSpeed * (player.isAI ? 0.85 : 0.8);
        
        setTimeout(() => {
            if (player.speed < recoverySpeed) {
                player.speed = recoverySpeed;
                console.log(`✅ ${player.isAI ? 'IA' : 'Jogador'} recuperou velocidade após ${recoveryTime}ms`);
            }
        }, recoveryTime);
    }
    
    createSplashEffect(position) {
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const dropGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const dropMaterial = new THREE.MeshBasicMaterial({
                color: 0x00CED1,
                transparent: true,
                opacity: 0.8
            });
            const drop = new THREE.Mesh(dropGeometry, dropMaterial);
            
            drop.position.copy(position);
            drop.position.y += 0.5;
            
            drop.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.2
            );
            
            particles.add(drop);
        }
        
        window.scene.add(particles);
        
        // Animar gotas
        const animateDrops = () => {
            let allDone = true;
            
            particles.children.forEach(drop => {
                drop.position.add(drop.userData.velocity);
                drop.userData.velocity.y -= 0.01; // Gravidade
                drop.material.opacity -= 0.02;
                
                if (drop.material.opacity > 0) {
                    allDone = false;
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateDrops);
            } else {
                window.scene.remove(particles);
            }
        };
        
        animateDrops();
    }
    
    breakVase(obstacle) {
        // Criar fragmentos
        const fragments = new THREE.Group();
        const numFragments = 8;
        
        for (let i = 0; i < numFragments; i++) {
            const fragmentGeometry = new THREE.TetrahedronGeometry(0.3);
            const fragmentMaterial = new THREE.MeshStandardMaterial({
                color: 0x4169E1,
                roughness: 0.3
            });
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            
            fragment.position.copy(obstacle.position);
            fragment.position.y += 1;
            
            fragment.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.4,
                (Math.random() - 0.5) * 0.3
            );
            fragment.userData.rotationSpeed = new THREE.Vector3(
                Math.random() * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            );
            
            fragments.add(fragment);
        }
        
        window.scene.add(fragments);
        
        // Esconder vaso original
        obstacle.visible = false;
        
        // Animar fragmentos
        const animateFragments = () => {
            let allDone = true;
            
            fragments.children.forEach(fragment => {
                fragment.position.add(fragment.userData.velocity);
                fragment.userData.velocity.y -= 0.01;
                fragment.rotation.x += fragment.userData.rotationSpeed.x;
                fragment.rotation.y += fragment.userData.rotationSpeed.y;
                fragment.rotation.z += fragment.userData.rotationSpeed.z;
                
                if (fragment.position.y > -2) {
                    allDone = false;
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateFragments);
            } else {
                window.scene.remove(fragments);
            }
        };
        
        animateFragments();
    }
    
    createImpactEffect(position) {
        // Estrelas de impacto
        const starsGroup = new THREE.Group();
        
        for (let i = 0; i < 5; i++) {
            const starGeometry = new THREE.ConeGeometry(0.2, 0.4, 5);
            const starMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                transparent: true
            });
            const star = new THREE.Mesh(starGeometry, starMaterial);
            
            const angle = (Math.PI * 2 * i) / 5;
            star.position.copy(position);
            star.position.x += Math.cos(angle) * 0.5;
            star.position.y += 1;
            star.position.z += Math.sin(angle) * 0.5;
            star.rotation.z = angle;
            
            starsGroup.add(star);
        }
        
        window.scene.add(starsGroup);
        
        // Animar
        const animateStars = () => {
            starsGroup.children.forEach((star, i) => {
                const angle = (Math.PI * 2 * i) / 5;
                star.position.x += Math.cos(angle) * 0.05;
                star.position.z += Math.sin(angle) * 0.05;
                star.material.opacity -= 0.05;
            });
            
            if (starsGroup.children[0].material.opacity > 0) {
                requestAnimationFrame(animateStars);
            } else {
                window.scene.remove(starsGroup);
            }
        };
        
        animateStars();
    }
    
    destroyObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
            window.scene.remove(obstacle);
            this.createImpactEffect(obstacle.position);
        }
    }
    
    // Limpar sistema
    dispose() {
        this.obstacles.forEach(obstacle => {
            window.scene.remove(obstacle);
        });
        this.obstacles = [];
    }
}