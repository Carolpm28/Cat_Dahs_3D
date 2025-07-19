// js/game/PowerUpSystem.js - Sistema de power-ups para Cat Dash 3D
export class PowerUpSystem {
    constructor(trackManager) {
        this.trackManager = trackManager;
        this.powerUps = [];
        this.activePowerUps = new Map(); // Jogador -> power-up ativo
        this.powerUpHUDs = new Map(); // Jogador -> HUD do power-up
        
        // Tipos de power-ups
        this.powerUpTypes = {
            SPEED_BOOST: {
                name: '⚡ Turbo',
                color: 0xffff00,
                duration: 3000,
                effect: 'speed',
                multiplier: 1.5,
                particles: 0xffff00
            },
            SHIELD: {
                name: '🛡️ Escudo',
                color: 0x00ffff,
                duration: 5000,
                effect: 'shield',
                particles: 0x00ffff
            },
            GHOST: {
                name: '👻 Fantasma',
                color: 0xff00ff,
                duration: 4000,
                effect: 'ghost',
                particles: 0xff00ff
            },
            MEGA_JUMP: {
                name: '🦘 Super Salto',
                color: 0x00ff00,
                duration: 2000,
                effect: 'jump',
                particles: 0x00ff00
            },
            CATNIP: {
                name: '🌿 Erva-gateira',
                color: 0x90ee90,
                duration: 3500,
                effect: 'chaos',
                multiplier: 1.3,
                particles: 0x90ee90
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('🎁 Sistema de Power-ups iniciado!');
        this.spawnPowerUps();
    }
    
    // Criar power-ups na pista
    spawnPowerUps() {
        if (!this.trackManager.trackPath) return;
        
        // Colocar 8-10 power-ups ao longo da pista
        const numPowerUps = 8 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numPowerUps; i++) {
            // Distribuir uniformemente ao longo da pista
            const t = (i + 0.5) / numPowerUps;
            const position = this.trackManager.getPositionOnTrack(t);
            
            // Escolher tipo aleatório
            const types = Object.keys(this.powerUpTypes);
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            this.createPowerUp(position, randomType);
        }
        
        console.log(`🎁 ${numPowerUps} power-ups criados na pista!`);
    }
    
    createPowerUp(position, type) {
        const powerUpData = this.powerUpTypes[type];
        const group = new THREE.Group();
        
        // Base do power-up (cubo com material mais elaborado)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhysicalMaterial({
            color: powerUpData.color,
            emissive: powerUpData.color,
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.2,
            transmission: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        
        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        group.add(cube);
        
        // Anel exterior com efeito de energia
        const ringGeometry = new THREE.TorusGeometry(0.8, 0.1, 16, 32);
        const ringMaterial = new THREE.MeshPhysicalMaterial({
            color: powerUpData.color,
            emissive: powerUpData.color,
            emissiveIntensity: 1.0,
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.5,
            clearcoat: 1.0
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        // Sistema de partículas mais elaborado
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 30;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color(powerUpData.color);
        const tempColor = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Posição em espiral
            const t = i / particleCount;
            const angle = t * Math.PI * 4;
            const radius = 1.2 + Math.sin(t * Math.PI * 2) * 0.3;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = t * 2 - 1;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Cor com variação
            tempColor.copy(color).multiplyScalar(0.8 + Math.random() * 0.4);
            colors[i * 3] = tempColor.r;
            colors[i * 3 + 1] = tempColor.g;
            colors[i * 3 + 2] = tempColor.b;
            
            // Tamanho variável
            sizes[i] = 0.1 + Math.random() * 0.1;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        group.add(particles);
        
        // Adicionar aura brilhante
        const auraGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: powerUpData.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        group.add(aura);
        
        // Posicionar power-up
        group.position.copy(position);
        group.position.y = 0.5;
        
        // Dados do power-up
        group.userData = {
            type: type,
            collected: false,
            particles: particles,
            ring: ring,
            cube: cube,
            aura: aura,
            originalScale: new THREE.Vector3(1, 1, 1)
        };
        
        // Adicionar à cena
        window.scene.add(group);
        this.powerUps.push(group);
    }
    
    // Atualizar power-ups (animação e colisão)
    update(players, deltaTime) {
        // Animar power-ups
        this.powerUps.forEach(powerUp => {
            if (!powerUp.userData.collected) {
                // Rotação suave do cubo
                powerUp.userData.cube.rotation.y += deltaTime * 1.5;
                powerUp.userData.cube.rotation.z += deltaTime;
                
                // Rotação do anel com velocidade variável
                powerUp.userData.ring.rotation.z += deltaTime * 2;
                
                // Movimento flutuante suave
                const time = Date.now() * 0.001;
                powerUp.position.y = 0.5 + Math.sin(time * 2) * 0.2;
                
                // Rotação das partículas
                powerUp.userData.particles.rotation.y += deltaTime * 0.5;
                
                // Pulsar aura
                const scale = 1 + Math.sin(time * 3) * 0.1;
                powerUp.userData.aura.scale.set(scale, scale, scale);
                
                // Verificar colisão com jogadores
                players.forEach(player => {
                    const distance = player.model.position.distanceTo(powerUp.position);
                    
                    if (distance < 2 && !powerUp.userData.collected) {
                        this.collectPowerUp(powerUp, player);
                    }
                });
            }
        });
        
        // Atualizar power-ups ativos
        this.updateActivePowerUps(deltaTime);
    }
    
    collectPowerUp(powerUp, player) {
        powerUp.userData.collected = true;
        const type = powerUp.userData.type;
        const powerUpData = this.powerUpTypes[type];
        
        console.log(`🎁 ${player.character} coletou ${powerUpData.name}!`);
        
        // Aplicar efeito
        this.applyPowerUp(player, type);
        
        // Efeito visual de coleta
        this.createCollectEffect(powerUp.position, powerUpData.color);
        
        // Remover power-up
        window.scene.remove(powerUp);
        const index = this.powerUps.indexOf(powerUp);
        if (index > -1) this.powerUps.splice(index, 1);
        
        // Respawn após 10 segundos
        setTimeout(() => {
            const t = Math.random();
            const position = this.trackManager.getPositionOnTrack(t);
            this.createPowerUp(position, type);
        }, 10000);
    }
    
    applyPowerUp(player, type) {
        const powerUpData = this.powerUpTypes[type];
        
        // Remover power-up anterior se existir
        if (this.activePowerUps.has(player)) {
            this.removePowerUp(player);
        }
        
        // Guardar power-up ativo
        this.activePowerUps.set(player, {
            type: type,
            startTime: Date.now(),
            duration: powerUpData.duration
        });

        // Criar ou atualizar HUD do power-up
        this.createPowerUpHUD(player, powerUpData);
        
        // Aplicar efeitos baseados no tipo
        switch (type) {
            case 'SPEED_BOOST':
                player.maxSpeed *= powerUpData.multiplier;
                player.acceleration *= powerUpData.multiplier;
                this.createSpeedEffect(player);
                break;
                
            case 'SHIELD':
                player.hasShield = true;
                this.createShieldEffect(player);
                break;
                
            case 'GHOST':
                player.isGhost = true;
                player.model.traverse(child => {
                    if (child.isMesh) {
                        child.material.transparent = true;
                        child.material.opacity = 0.5;
                    }
                });
                break;
                
            case 'MEGA_JUMP':
                player.canSuperJump = true;
                break;
                
            case 'CATNIP':
                player.maxSpeed *= powerUpData.multiplier;
                player.handling *= 0.7; // Mais difícil de controlar
                this.createCatnipEffect(player);
                break;
        }
        
        // Mostrar mensagem no HUD
        this.showPowerUpMessage(player, powerUpData.name);
    }
    
    removePowerUp(player) {
        const activePowerUp = this.activePowerUps.get(player);
        if (!activePowerUp) return;
        
        const type = activePowerUp.type;
        const powerUpData = this.powerUpTypes[type];
        
        // Remover efeitos
        switch (type) {
            case 'SPEED_BOOST':
                player.maxSpeed /= powerUpData.multiplier;
                player.acceleration /= powerUpData.multiplier;
                this.removeSpeedEffect(player);
                break;
                
            case 'SHIELD':
                player.hasShield = false;
                this.removeShieldEffect(player);
                break;
                
            case 'GHOST':
                player.isGhost = false;
                player.model.traverse(child => {
                    if (child.isMesh) {
                        child.material.opacity = 1;
                    }
                });
                break;
                
            case 'MEGA_JUMP':
                player.canSuperJump = false;
                break;
                
            case 'CATNIP':
                player.maxSpeed /= powerUpData.multiplier;
                player.handling /= 0.7;
                this.removeCatnipEffect(player);
                break;
        }
        
        // Remover HUD do power-up
        this.removePowerUpHUD(player);
        
        this.activePowerUps.delete(player);
    }
    
    updateActivePowerUps(deltaTime) {
        const now = Date.now();
        
        this.activePowerUps.forEach((powerUp, player) => {
            const elapsed = now - powerUp.startTime;
            const remaining = powerUp.duration - elapsed;
            
            // Atualizar HUD se existir
            const hud = this.powerUpHUDs.get(player);
            if (hud) {
                const progress = Math.max(0, remaining / powerUp.duration);
                hud.progressBar.style.width = `${progress * 100}%`;

                // Efeito de aviso quando estiver acabando (últimos 25%)
                if (progress < 0.25) {
                    // Piscar a barra e adicionar efeito de urgência
                    const flash = Math.sin(now * 0.01) > 0;
                    hud.progressBar.style.background = flash 
                        ? `linear-gradient(90deg, #ff0000aa, #ff0000ff)`
                        : `linear-gradient(90deg, ${hud.color}aa, ${hud.color}ff)`;
                    
                    // Tremer o container
                    if (flash) {
                        const shake = Math.random() * 2 - 1;
                        hud.container.style.transform = `translateX(${shake}px)`;
                    } else {
                        hud.container.style.transform = 'none';
                    }
                }
            }
            
            if (elapsed >= powerUp.duration) {
                this.removePowerUp(player);
            }
        });
    }
    
    // Efeitos visuais
    createCollectEffect(position, color) {
        // Explosão de partículas
        const particleCount = 40;
        const particles = new THREE.Group();
        
        // Criar geometria compartilhada
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        for (let i = 0; i < particleCount; i++) {
            const material = new THREE.MeshPhysicalMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, material);
            particle.userData.type = 'particle'; // Identificar tipo de mesh
            
            // Distribuição esférica
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;
            
            const velocity = 0.2 + Math.random() * 0.1;
            particle.userData.velocity = new THREE.Vector3(
                velocity * Math.cos(theta) * Math.sin(phi),
                velocity * Math.sin(theta) * Math.sin(phi),
                velocity * Math.cos(phi)
            );
            
            particle.position.copy(position);
            particles.add(particle);
        }
        
        // Onda de energia
        const waveGeometry = new THREE.RingGeometry(0, 0.1, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.userData.type = 'wave'; // Identificar tipo de mesh
        wave.position.copy(position);
        wave.rotation.x = -Math.PI / 2;
        particles.add(wave);
        
        // Flash de luz
        const light = new THREE.PointLight(color, 2, 4);
        light.position.copy(position);
        particles.add(light);
        
        window.scene.add(particles);
        
        // Animar o efeito
        const startTime = Date.now();
        const duration = 1000; // 1 segundo
        
        const animateEffect = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Animar partículas
                particles.children.forEach(child => {
                    if (child.isMesh) {
                        if (child.userData.type === 'particle') {
                            child.position.add(child.userData.velocity);
                            child.userData.velocity.y -= 0.01; // Gravidade
                            child.material.opacity = 1 - progress;
                            child.scale.multiplyScalar(0.98);
                        } else if (child.userData.type === 'wave') {
                            // Expandir onda
                            const scale = 1 + progress * 10;
                            child.scale.set(scale, scale, 1);
                            child.material.opacity = 1 - progress;
                        }
                    } else if (child.isLight) {
                        // Diminuir intensidade da luz
                        child.intensity = 2 * (1 - progress);
                    }
                });
                
                requestAnimationFrame(animateEffect);
            } else {
                window.scene.remove(particles);
            }
        };
        
        animateEffect();
    }
    
    createSpeedEffect(player) {
        const speedLines = new THREE.Group();
        speedLines.name = 'speedEffect';
        
        for (let i = 0; i < 10; i++) {
            const geometry = new THREE.BoxGeometry(0.05, 0.05, 2);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5
            });
            const line = new THREE.Mesh(geometry, material);
            
            const angle = (Math.PI * 2 * i) / 10;
            line.position.x = Math.cos(angle) * 1.5;
            line.position.y = Math.sin(angle) * 1.5;
            line.position.z = -1;
            
            speedLines.add(line);
        }
        
        player.model.add(speedLines);
    }
    
    removeSpeedEffect(player) {
        const effect = player.model.getObjectByName('speedEffect');
        if (effect) player.model.remove(effect);
    }
    
    createShieldEffect(player) {
        const shieldGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.name = 'shieldEffect';
        player.model.add(shield);
    }
    
    removeShieldEffect(player) {
        const effect = player.model.getObjectByName('shieldEffect');
        if (effect) player.model.remove(effect);
    }
    
    createCatnipEffect(player) {
        // Estrelas girando à volta do gato
        const starsGroup = new THREE.Group();
        starsGroup.name = 'catnipEffect';
        
        for (let i = 0; i < 5; i++) {
            const starGeometry = new THREE.ConeGeometry(0.2, 0.4, 5);
            const starMaterial = new THREE.MeshBasicMaterial({
                color: 0x90ee90,
                emissive: 0x90ee90
            });
            const star = new THREE.Mesh(starGeometry, starMaterial);
            
            const angle = (Math.PI * 2 * i) / 5;
            star.position.x = Math.cos(angle) * 1.2;
            star.position.y = 2;
            star.position.z = Math.sin(angle) * 1.2;
            star.rotation.z = Math.PI;
            
            starsGroup.add(star);
        }
        
        player.model.add(starsGroup);
        
        // Animar estrelas
        const animateStars = () => {
            if (starsGroup.parent) {
                starsGroup.rotation.y += 0.1;
                requestAnimationFrame(animateStars);
            }
        };
        animateStars();
    }
    
    removeCatnipEffect(player) {
        const effect = player.model.getObjectByName('catnipEffect');
        if (effect) player.model.remove(effect);
    }
    
    showPowerUpMessage(player, powerUpName) {
        // Criar mensagem flutuante
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(powerUpName, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1);
        sprite.position.copy(player.model.position);
        sprite.position.y += 3;
        
        window.scene.add(sprite);
        
        // Animar mensagem
        const animateMessage = () => {
            sprite.position.y += 0.02;
            sprite.material.opacity -= 0.02;
            
            if (sprite.material.opacity > 0) {
                requestAnimationFrame(animateMessage);
            } else {
                window.scene.remove(sprite);
            }
        };
        
        setTimeout(animateMessage, 100);
    }
    
    //barra de progresso/HUD que mostra o tempo restante do power-up!
    createPowerUpHUD(player, powerUpData) {
        // Remover HUD anterior se existir
        this.removePowerUpHUD(player);

        // Criar container do HUD
        const hudContainer = document.createElement('div');
        
        // Definir posição baseada no número do jogador
        const isP1 = player.playerNumber === 1;
        const position = isP1 ? {
            left: '20px',
            top: '45%'  // Mais abaixo na tela
        } : {
            right: '20px',
            top: '45%'  // Mais abaixo na tela
        };

        hudContainer.style.cssText = `
            position: fixed;
            ${isP1 ? 'left: ' + position.left : 'right: ' + position.right};
            top: ${position.top};
            background: linear-gradient(45deg, 
                rgba(0,0,0,0.8), 
                ${isP1 ? 'rgba(0,0,255,0.2)' : 'rgba(255,0,0,0.2)'}
            );
            border: 2px solid ${this.rgbToHex(powerUpData.color)};
            border-radius: 10px;
            padding: 10px;
            color: white;
            font-family: 'Fredoka', Arial, sans-serif;
            font-size: 16px;
            z-index: 1000;
            min-width: 200px;
            box-shadow: 0 0 15px ${this.rgbToHex(powerUpData.color)}88;
            backdrop-filter: blur(5px);
            transition: transform 0.2s ease;
        `;

        // Nome do power-up com indicador de jogador
        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            font-weight: bold;
            text-shadow: 0 0 10px ${this.rgbToHex(powerUpData.color)};
        `;
        
        // Adicionar ícone do jogador
        const playerIcon = document.createElement('span');
        playerIcon.style.cssText = `
            background: ${isP1 ? '#4444ff' : '#ff4444'};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-shadow: none;
            box-shadow: 0 0 5px ${isP1 ? '#0000ff' : '#ff0000'};
        `;
        playerIcon.textContent = isP1 ? 'P1' : 'P2';
        
        nameDiv.appendChild(playerIcon);
        const powerUpName = document.createElement('span');
        powerUpName.textContent = powerUpData.name;
        nameDiv.appendChild(powerUpName);

        // Barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 100%;
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            overflow: hidden;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
        `;

        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
                ${this.rgbToHex(powerUpData.color)}aa,
                ${this.rgbToHex(powerUpData.color)}ff);
            border-radius: 4px;
            transition: width 0.1s linear;
            box-shadow: 0 0 10px ${this.rgbToHex(powerUpData.color)};
        `;

        progressContainer.appendChild(progressBar);
        hudContainer.appendChild(nameDiv);
        hudContainer.appendChild(progressContainer);
        document.body.appendChild(hudContainer);

        // Guardar referências do HUD
        this.powerUpHUDs.set(player, {
            container: hudContainer,
            progressBar: progressBar,
            startTime: Date.now(),
            duration: powerUpData.duration,
            color: this.rgbToHex(powerUpData.color)
        });
    }

    removePowerUpHUD(player) {
        const hud = this.powerUpHUDs.get(player);
        if (hud && hud.container && hud.container.parentNode) {
            hud.container.parentNode.removeChild(hud.container);
        }
        this.powerUpHUDs.delete(player);
    }

    rgbToHex(color) {
        // Converter número de cor THREE.js para string hex CSS
        return '#' + color.toString(16).padStart(6, '0');
    }
    
    // Limpar sistema
    dispose() {
        // Remover power-ups da cena
        this.powerUps.forEach(powerUp => {
            window.scene.remove(powerUp);
        });
        this.powerUps = [];
        
        // Limpar power-ups ativos e seus HUDs
        this.activePowerUps.forEach((powerUp, player) => {
            this.removePowerUp(player);
        });
        this.activePowerUps.clear();
        
        // Garantir que todos os HUDs sejam removidos
        this.powerUpHUDs.forEach((hud, player) => {
            this.removePowerUpHUD(player);
        });
        this.powerUpHUDs.clear();
    }
}