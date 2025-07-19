// js/characters/RacerCat.js - Classe do gato corredor CORRIGIDA
import { catData } from '../data/GameData.js';

export class RacerCat {
    constructor(options) {
        this.character = options.character || 'rambim';
        this.playerNumber = options.playerNumber || 1;
        this.isAI = options.isAI || false;
        
        this.model = this.createCatModel();
        
        this.speed = 0;
        this.maxSpeed = this.getBaseMaxSpeed();
        this.acceleration = this.getBaseAcceleration();
        this.handling = this.getBaseHandling();
        
        this.finished = false;
        
        this.animationState = {
            running: false,
            tailWag: 0,
            legAngle: 0,
            blinkTimer: 0,
            blinkDuration: 0.1,
            timeTillNextBlink: Math.random() * 3 + 2 // 2-5 segundos até próximo piscar
        };
        
        this.parts = {};

        // Sistema de salto
        this.isJumping = false;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.canJump = true;
        this.jumpPower = 8; // Força do salto
        this.gravity = -20; // Gravidade
        
        console.log(`🐱 Gato ${this.playerNumber} (${this.character}) criado - Vel.Max: ${this.maxSpeed}, Acel: ${this.acceleration}`);
    }
    
    // Cria o modelo 3D do gato, com corpo, cabeça, cauda, orelhas e pernas.
    createCatModel() {
        const group = new THREE.Group();
        
        // Initialize parts object at the beginning
        this.parts = {
            body: null,
            head: null,
            leftEar: null,
            rightEar: null,
            tail: null,
            leftEyeWhite: null,
            leftEyePupil: null,
            rightEyeWhite: null,
            rightEyePupil: null,
            legs: []
        };
        
        // Selecionar textura correta para cada personagem
        const loader = new THREE.TextureLoader();
        const textureMap = {
            rambim: 'rambas.jpeg',
            faisca: 'faísca.jpeg',
            mickey: 'mickey.jpeg',
            blackie: 'blackie.jpg'
        };
        const textureFile = textureMap[this.character] || 'rambam.jpeg';
        const catTexture = loader.load('assets/texturas/' + textureFile,
            () => { console.log('✅ Textura carregada:', textureFile); },
            undefined,
            (err) => { console.warn('❌ Erro ao carregar textura:', textureFile, err); }
        );
        
        // ESCALA REDUZIDA - gatos menores
        const scale = 0.6; // ⬅️ REDUZIR TAMANHO DOS GATOS para 60%
        
        // Obter cor do gato
        const color = this.getCharacterColor();
        // Material com textura SEM tingimento de cor
        const texturedMaterial = new THREE.MeshStandardMaterial({ 
            map: catTexture,
            color: 0xffffff, // cor neutra, mostra a textura original
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Corpo
        const bodyGeometry = new THREE.SphereGeometry(1 * scale, 16, 16);
        const body = new THREE.Mesh(bodyGeometry, texturedMaterial);
        body.scale.set(1, 0.8, 1.2);
        body.castShadow = true;
        group.add(body);
        
        // Cabeça
        const headGeometry = new THREE.SphereGeometry(0.6 * scale, 16, 16);
        const head = new THREE.Mesh(headGeometry, texturedMaterial);
        head.position.set(0, 0.5 * scale, 0.8 * scale);
        head.castShadow = true;
        group.add(head);
        
        // Orelhas
        const earGeometry = new THREE.ConeGeometry(0.25 * scale, 0.5 * scale, 8);
        const earMaterial = new THREE.MeshStandardMaterial({
            map: catTexture,
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        // Orelha esquerda
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.3 * scale, 0.9 * scale, 0.6 * scale);
        leftEar.rotation.x = -Math.PI / 6; // Inclinar para frente
        leftEar.rotation.z = Math.PI / 6; // Inclinar para fora
        leftEar.castShadow = true;
        group.add(leftEar);
        
        // Orelha direita
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.3 * scale, 0.9 * scale, 0.6 * scale);
        rightEar.rotation.x = -Math.PI / 6; // Inclinar para frente
        rightEar.rotation.z = -Math.PI / 6; // Inclinar para fora
        rightEar.castShadow = true;
        group.add(rightEar);

        // Olhos
        const eyeGeometry = new THREE.SphereGeometry(0.12 * scale, 16, 16);
        const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1,
            emissive: 0xffffff,
            emissiveIntensity: 0.2 // Adiciona um leve brilho
        });
        const eyePupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.1,
            metalness: 0.1,
            emissive: 0x000000,
            emissiveIntensity: 0.1
        });

        // Olho esquerdo
        const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        leftEyeWhite.position.set(-0.25 * scale, 0.6 * scale, 1.2 * scale); // Ajustado Z para frente
        leftEyeWhite.scale.set(1, 1, 0.3); // Achatar mais o olho
        group.add(leftEyeWhite);

        const leftEyePupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 * scale, 16, 16), // Pupila um pouco maior
            eyePupilMaterial
        );
        leftEyePupil.position.set(-0.25 * scale, 0.6 * scale, 1.25 * scale); // Ligeiramente à frente do branco
        leftEyePupil.scale.set(0.8, 1.2, 0.3); // Pupila mais oval
        group.add(leftEyePupil);

        // Olho direito
        const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        rightEyeWhite.position.set(0.25 * scale, 0.6 * scale, 1.2 * scale); // Ajustado Z para frente
        rightEyeWhite.scale.set(1, 1, 0.3); // Achatar mais o olho
        group.add(rightEyeWhite);

        const rightEyePupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 * scale, 16, 16), // Pupila um pouco maior
            eyePupilMaterial
        );
        rightEyePupil.position.set(0.25 * scale, 0.6 * scale, 1.25 * scale); // Ligeiramente à frente do branco
        rightEyePupil.scale.set(0.8, 1.2, 0.3); // Pupila mais oval
        group.add(rightEyePupil);

        // Adicionar olhos e pupilas ao objeto parts para animação
        this.parts.leftEyeWhite = leftEyeWhite;
        this.parts.leftEyePupil = leftEyePupil;
        this.parts.rightEyeWhite = rightEyeWhite;
        this.parts.rightEyePupil = rightEyePupil;
        
        // Rabo
        const tailGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.05 * scale, 1.5 * scale, 8);
        const tail = new THREE.Mesh(tailGeometry, texturedMaterial);
        tail.position.set(0, 0.5 * scale, -1 * scale);
        tail.rotation.x = Math.PI / 4;
        tail.castShadow = true;
        group.add(tail);
        
        // Acessar partes para animação
        this.parts = {
            body,
            head,
            leftEar,
            rightEar,
            tail,
            leftEyeWhite,
            leftEyePupil,
            rightEyeWhite,
            rightEyePupil,
            legs: this.parts.legs
        };
        
        // Adicionar pernas
        this.addLegs(group, texturedMaterial, scale);
        
        // Adicionar indicador de jogador
        this.addPlayerIndicator(group, scale);
        
        return group;
    }
    
    // Adiciona as pernas ao modelo do gato.
    addLegs(group, material, scale) {
        const legGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.1 * scale, 0.8 * scale, 8);
        this.parts.legs = [];
        
        // Posições das pernas
        const legPositions = [
            { x: 0.5 * scale, z: 0.5 * scale },  
            { x: -0.5 * scale, z: 0.5 * scale }, 
            { x: 0.5 * scale, z: -0.5 * scale },  
            { x: -0.5 * scale, z: -0.5 * scale }  
        ];
        
        legPositions.forEach((pos, index) => {
            const leg = new THREE.Mesh(legGeometry, material);
            leg.position.set(pos.x, -0.3 * scale, pos.z);
            leg.castShadow = true;
            
            this.parts.legs.push(leg);
            group.add(leg);
        });
    }
    
    // Adiciona o indicador visual (P1/P2) acima do gato.
    addPlayerIndicator(group, scale) {
        // Criar canvas para texto
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        // Fundo circular
        context.fillStyle = this.playerNumber === 1 ? 'blue' : 'red';
        context.beginPath();
        context.arc(64, 64, 48, 0, Math.PI * 2);
        context.fill();
        
        // Texto P1/P2
        context.font = 'bold 80px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`P${this.playerNumber}`, 64, 62);
        
        // Criar sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1 * scale, 1 * scale, 1 * scale); // ⬅️ ESCALA REDUZIDA
        sprite.position.set(0, 1.5 * scale, 0);
        
        group.add(sprite);
    }
    
    getCharacterColor() {
        const colors = {
            rambim: 0xff4500,
            faisca: 0xffd700,
            blackie: 0x2f2f2f,
            mickey: 0xA0522D
        };
        return colors[this.character] || 0x666666;
    }
    
    // Devolve a velocidade máxima base do gato, conforme os dados do personagem.
    getBaseMaxSpeed() {
        const cat = catData[this.character];
        return cat ? 7 + (cat.speed * 1.5) : 12;
    }
    
    // Devolve a aceleração base do gato, conforme os dados do personagem.
    getBaseAcceleration() {
        const cat = catData[this.character];
        return cat ? 3 + (cat.acceleration * 1) : 7;
    }
    
    // Devolve a manobrabilidade base do gato, conforme os dados do personagem.
    getBaseHandling() {
        const cat = catData[this.character];
        return cat ? 2 + (cat.handling * 0.5) : 4;
    }
    
    getSpeed() {
        return this.speed;
    }

    // Faz o gato saltar, se possível (não estiver já a saltar ou em cooldown).
    jump() {
        if (!this.canJump || this.isJumping) return;
        this.isJumping = true;
        this.canJump = false;
        this.jumpVelocity = this.jumpPower;
        // Se tem super salto do power-up
        if (this.canSuperJump) {
            this.jumpVelocity = this.jumpPower * 1.5;
        }
        console.log(`🦘 Gato ${this.playerNumber} saltou! jumpVelocity=${this.jumpVelocity}, jumpPower=${this.jumpPower}, superJump=${!!this.canSuperJump}`);
    }
    
    // Atualiza o estado do salto (altura, gravidade, aterragem).
    updateJump(deltaTime) {
        if (this.isJumping) {
            // Aplicar velocidade vertical
            this.jumpHeight += this.jumpVelocity * deltaTime;
            this.jumpVelocity += this.gravity * deltaTime;
            
            // Atualizar posição Y do modelo
            this.model.position.y = this.jumpHeight;
            
            // Aterrar
            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.model.position.y = 0;
                this.isJumping = false;
                
                // Cooldown de 0.5 segundos antes de poder saltar novamente
                setTimeout(() => {
                    this.canJump = true;
                }, 500);
            }
        }
    }
    
    // 🚗 CORRIGIDO - Acelerar com debug
    accelerate(deltaTime) {
        const oldSpeed = this.speed;
        this.speed += this.acceleration * deltaTime;
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        
        // Debug apenas se mudou significativamente
        if (Math.abs(this.speed - oldSpeed) > 0.1) {
            console.log(`🚗 Gato ${this.playerNumber} acelerando: ${oldSpeed.toFixed(2)} → ${this.speed.toFixed(2)}`);
        }
    }
    
    brake(deltaTime) {
        this.speed -= this.acceleration * 1.5 * deltaTime;
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }
    }
    
    decelerate(deltaTime) {
        if (this.speed > 0) {
            this.speed -= this.acceleration * 0.5 * deltaTime;
            if (this.speed < 0) this.speed = 0;
        } else if (this.speed < 0) {
            this.speed += this.acceleration * 0.5 * deltaTime;
            if (this.speed > 0) this.speed = 0;
        }
    }
    
    // 🎮 CORRIGIDO - Movimento com debug e verificação de colisão
    move(distance) {
        if (Math.abs(distance) < 0.001) return true; // Movimento muito pequeno
        
        const oldPosition = this.model.position.clone();
        
        // Calcular direção do movimento
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y);
        
        // Calcular nova posição
        const newPosition = oldPosition.clone().add(direction.multiplyScalar(distance));
        
        // Verificar colisão com pista se disponível
        if (window.gameManager && window.gameManager.trackManager && window.gameManager.trackManager.checkTrackBounds) {
            const boundsCheck = window.gameManager.trackManager.checkTrackBounds(newPosition);
            
            if (boundsCheck.isOutOfBounds) {
                console.log(`🚧 Gato ${this.playerNumber} saiu da pista! Corrigindo posição.`);
                
                // Corrigir posição para o limite da pista
                const correctedPos = boundsCheck.correctedPosition;
                correctedPos.y = oldPosition.y; // Manter altura
                
                this.model.position.copy(correctedPos);
                this.speed *= 0.5; // Penalidade de velocidade
                
                this.createBorderCollisionEffect();
                return false;
            }
        }
        
        // Movimento normal
        this.model.position.copy(newPosition);
        
        // Debug apenas para movimentos significativos
        if (Math.abs(distance) > 0.01) {
            console.log(`🎮 Gato ${this.playerNumber} moveu ${distance.toFixed(3)} unidades para (${newPosition.x.toFixed(2)}, ${newPosition.z.toFixed(2)})`);
        }
        
        return true;
    }
    
    // 🔄 CORRIGIDO - Rotação com debug
    rotate(angle) {
        if (Math.abs(angle) < 0.001) return; // Rotação muito pequena
        const handlingMultiplier = this.handling / 3;
        const effectiveAngle = -angle * handlingMultiplier;
        const oldRotation = this.model.rotation.y;
        this.model.rotation.y += effectiveAngle;
        // Debug apenas para rotações significativas
        if (Math.abs(effectiveAngle) > 0.01) {
            console.log(`🔄 Gato ${this.playerNumber} rotacionou ${(effectiveAngle * 180 / Math.PI).toFixed(1)}°`);
        }
    }
    
    // ✨ Efeito visual quando bate na borda
    createBorderCollisionEffect() {
        const particleCount = 8;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0x8B4513, // Cor de terra
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Posição inicial atrás do gato
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.2;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 0.5,
                Math.sin(angle) * radius
            );
            
            // Dados para animação
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    Math.random() * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                timer: 1.0
            };
            
            particles.add(particle);
        }
        
        // Adicionar ao modelo do gato
        this.model.add(particles);
        
        // Animar partículas
        const animateParticles = () => {
            let allDone = true;
            
            particles.children.forEach(particle => {
                const data = particle.userData;
                
                if (data.timer > 0) {
                    particle.position.add(data.velocity);
                    data.velocity.y -= 0.001; // Gravidade
                    data.timer -= 0.02;
                    
                    // Diminuir tamanho
                    const scale = data.timer;
                    particle.scale.set(scale, scale, scale);
                    particle.material.opacity = data.timer;
                    
                    allDone = false;
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            } else {
                this.model.remove(particles);
            }
        };
        
        animateParticles();
    }
    
    // Atualiza as animações do gato (corrida, cauda, pernas, cabeça, salto).
    updateAnimation(deltaTime) {
        // Atualizar salto
        this.updateJump(deltaTime);

        if (Math.abs(this.speed) > 0.5) {
            this.animationState.running = true;
            
            const animSpeed = Math.abs(this.speed) / 5;
            
            this.animationState.legAngle += animSpeed * 10 * deltaTime;
            
            if (this.parts.legs) {
                this.parts.legs[0].rotation.x = Math.sin(this.animationState.legAngle) * 0.5;
                this.parts.legs[3].rotation.x = Math.sin(this.animationState.legAngle) * 0.5;
                this.parts.legs[1].rotation.x = Math.sin(this.animationState.legAngle + Math.PI) * 0.5;
                this.parts.legs[2].rotation.x = Math.sin(this.animationState.legAngle + Math.PI) * 0.5;
            }
            
            this.animationState.tailWag += animSpeed * 15 * deltaTime;
            if (this.parts.tail) {
                this.parts.tail.rotation.z = Math.sin(this.animationState.tailWag) * 0.3;
            }
            
            if (this.parts.head) {
                this.parts.head.position.y = 0.5 + Math.sin(this.animationState.legAngle * 2) * 0.05;
            }
        } else {
            this.animationState.running = false;
            
            if (this.parts.legs) {
                this.parts.legs.forEach(leg => {
                    leg.rotation.x = 0;
                });
            }
            
            this.animationState.tailWag += 3 * deltaTime;
            if (this.parts.tail) {
                this.parts.tail.rotation.z = Math.sin(this.animationState.tailWag) * 0.1;
            }
        }

        // Animação dos olhos
        this.updateEyeAnimation(deltaTime);
    }

    updateEyeAnimation(deltaTime) {
        // Early return if model or parts are not ready
        if (!this.model || !this.parts.leftEyePupil || !this.parts.rightEyePupil) {
            return;
        }

        // Get scale once to avoid repeated property access
        const modelScale = {
            x: this.model.scale.x || 1,
            y: this.model.scale.y || 1
        };

        // Piscar
        this.animationState.blinkTimer -= deltaTime;
        
        if (this.animationState.blinkTimer <= 0) {
            // Começar novo ciclo de piscar
            if (this.parts.leftEyeWhite.scale.y === 1) {
                // Fechar os olhos
                this.parts.leftEyeWhite.scale.y = 0.1;
                this.parts.rightEyeWhite.scale.y = 0.1;
                this.parts.leftEyePupil.scale.y = 0.1;
                this.parts.rightEyePupil.scale.y = 0.1;
                this.animationState.blinkTimer = this.animationState.blinkDuration;
            } else {
                // Abrir os olhos
                this.parts.leftEyeWhite.scale.y = 1;
                this.parts.rightEyeWhite.scale.y = 1;
                this.parts.leftEyePupil.scale.y = 1.5;
                this.parts.rightEyePupil.scale.y = 1.5;
                this.animationState.blinkTimer = this.animationState.timeTillNextBlink;
                // Definir próximo intervalo aleatório
                this.animationState.timeTillNextBlink = Math.random() * 3 + 2;
            }
        }

        // Movimento dos olhos durante a corrida
        if (this.speed > 0) {
            const eyeMovement = Math.sin(Date.now() * 0.005) * 0.05;
            
            // Mover pupilas horizontalmente
            this.parts.leftEyePupil.position.x = (-0.25 + eyeMovement) * modelScale.x;
            this.parts.rightEyePupil.position.x = (0.25 + eyeMovement) * modelScale.x;
            
            // Mover pupilas verticalmente baseado na velocidade
            const verticalMovement = Math.max(0, (this.speed / this.maxSpeed) * 0.05);
            this.parts.leftEyePupil.position.y = (0.6 - verticalMovement) * modelScale.y;
            this.parts.rightEyePupil.position.y = (0.6 - verticalMovement) * modelScale.y;
        }
    }
}