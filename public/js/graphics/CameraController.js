// js/graphics/CameraController.js - Sistema de câmera com debug melhorado
export class CameraController {
    constructor(camera, target) {
        console.log('📷 CameraController constructor - target:', !!target, 'camera:', !!camera);
        this.camera = camera;
        this.target = target;
        
        // Verificar se temos os parâmetros necessários
        if (!camera) {
            console.error('❌ CameraController: câmera não fornecida!');
            return;
        }
        
        if (!target) {
            console.error('❌ CameraController: target não fornecido!');
            return;
        }
        
        // Ajustes otimizados para cada modo de câmera
        this.cameraSettings = {
            follow: {
                offset: new THREE.Vector3(0, 4, -10),
                lookOffset: new THREE.Vector3(0, 0.5, 5),
                tilt: -0.2,
                lerpFactor: 0.2
            },
            overhead: {
                height: 14,
                tilt: -0.4,
                lerpFactor: 0.15
            },
            firstPerson: {
                offset: new THREE.Vector3(0, 1.2, 0.2),
                lookDistance: 10,
                lerpFactor: 0.25
            }
        };
        
        this.activeFollow = true;
        this.desiredPosition = new THREE.Vector3();
        this.desiredLookAt = new THREE.Vector3();
        this.currentRotation = new THREE.Euler(0, 0, 0);
        
        // Estado da câmera
        this.cameraMode = 'follow';
        this.availableModes = ['follow', 'overhead', 'firstPerson'];
        this.currentModeIndex = 0;
        
        // Sistema de transição
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.transitionDuration = 1.0; // 1 segundo
        this.transitionStartPosition = new THREE.Vector3();
        this.transitionStartRotation = new THREE.Euler();
        
        // Inicializar posição
        this.setInitialPosition();
        
        // Debug
        this.debugCounter = 0;
        console.log('✅ CameraController inicializado:', {
            mode: this.cameraMode,
            hasCamera: !!this.camera,
            hasTarget: !!this.target,
            targetPosition: this.target?.model?.position
        });
    }
    
    setInitialPosition() {
        if (!this.target || !this.target.model) {
            console.warn('⚠️ CameraController: target ou target.model não disponível para posição inicial');
            return;
        }
        
        const settings = this.cameraSettings.follow;
        const targetPos = this.target.model.position.clone();
        
        // Aplicar offset
        const offset = settings.offset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
        
        const finalPos = targetPos.add(offset);
        this.camera.position.copy(finalPos);
        
        // Aplicar inclinação
        this.camera.rotation.x = settings.tilt;
        this.camera.lookAt(this.target.model.position);
        
        console.log('📷 Posição inicial da câmera definida:', {
            position: this.camera.position,
            targetPosition: this.target.model.position,
            mode: this.cameraMode
        });
    }
    
    update(deltaTime = 0.016) {
        if (!this.camera || !this.target || !this.activeFollow) {
            return;
        }
        
        // Debug periódico
        this.debugCounter++;
        if (this.debugCounter % 120 === 0) { // A cada 2 segundos (60fps)
            console.log('📷 CameraController update:', {
                mode: this.cameraMode,
                isTransitioning: this.isTransitioning,
                targetPos: this.target.model?.position,
                cameraPos: this.camera.position
            });
        }
        
        // Atualizar transição se estiver ativa
        if (this.isTransitioning) {
            this.transitionProgress += 0.15;
            
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false;
                this.transitionProgress = 0;
            } else {
                const t = this.transitionProgress;
                const smoothT = t * t * (3 - 2 * t);
                
                // Calcular posição alvo baseada no modo atual
                const targetPos = this.calculateTargetPosition();
                const targetRot = this.calculateTargetRotation();
                
                // Interpolar
                this.camera.position.lerpVectors(this.transitionStartPosition, targetPos, smoothT);
                
                // Interpolar rotação
                this.camera.rotation.x = THREE.MathUtils.lerp(
                    this.transitionStartRotation.x, 
                    targetRot.x, 
                    smoothT
                );
                this.camera.rotation.y = THREE.MathUtils.lerp(
                    this.transitionStartRotation.y, 
                    targetRot.y, 
                    smoothT
                );
            }
            return;
        }
        
        // Atualizar posição normal da câmera
        switch(this.cameraMode) {
            case 'follow':
                this.updateFollowCamera();
                break;
            case 'overhead':
                this.updateOverheadCamera();
                break;
            case 'firstPerson':
                this.updateFirstPersonCamera();
                break;
            default:
                console.warn('⚠️ Modo de câmera desconhecido:', this.cameraMode);
                this.cameraMode = 'follow';
                break;
        }
    }
    
    calculateTargetPosition() {
        const targetPos = this.target.model.position.clone();
        
        switch(this.cameraMode) {
            case 'follow':
                const followOffset = this.cameraSettings.follow.offset.clone();
                followOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
                return targetPos.add(followOffset);
                
            case 'overhead':
                return new THREE.Vector3(
                    targetPos.x,
                    targetPos.y + this.cameraSettings.overhead.height,
                    targetPos.z
                );
                
            case 'firstPerson':
                const fpOffset = this.cameraSettings.firstPerson.offset.clone();
                fpOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
                return targetPos.add(fpOffset);
                
            default:
                return targetPos;
        }
    }
    
    calculateTargetRotation() {
        switch(this.cameraMode) {
            case 'follow':
                return new THREE.Euler(
                    this.cameraSettings.follow.tilt,
                    this.target.model.rotation.y,
                    0
                );
                
            case 'overhead':
                return new THREE.Euler(-Math.PI / 2, 0, 0);
                
            case 'firstPerson':
                return new THREE.Euler(0, this.target.model.rotation.y, 0);
                
            default:
                return new THREE.Euler(0, 0, 0);
        }
    }
    
    updateFollowCamera() {
        const settings = this.cameraSettings.follow;
        const offset = settings.offset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
        
        this.desiredPosition = this.target.model.position.clone().add(offset);
        this.camera.position.lerp(this.desiredPosition, settings.lerpFactor);
        
        const lookOffset = settings.lookOffset.clone();
        lookOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
        this.desiredLookAt = this.target.model.position.clone().add(lookOffset);
        
        // Rotação suave
        const targetRotation = new THREE.Euler(settings.tilt, this.target.model.rotation.y, 0);
        this.currentRotation.x = THREE.MathUtils.lerp(this.currentRotation.x, targetRotation.x, settings.lerpFactor);
        this.currentRotation.y = THREE.MathUtils.lerp(this.currentRotation.y, targetRotation.y, settings.lerpFactor);
        this.camera.rotation.copy(this.currentRotation);
        
        this.camera.lookAt(this.desiredLookAt);
    }
    
    updateOverheadCamera() {
        const settings = this.cameraSettings.overhead;
        // Posição diretamente acima do jogador
        this.desiredPosition = new THREE.Vector3(
            this.target.model.position.x,
            this.target.model.position.y + settings.height,
            this.target.model.position.z
        );

        this.camera.position.lerp(this.desiredPosition, settings.lerpFactor);

        // Olhar diretamente para baixo (para o jogador)
        this.camera.lookAt(this.target.model.position);
    }
    
    updateFirstPersonCamera() {
        const settings = this.cameraSettings.firstPerson;
        const offset = settings.offset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
        
        this.desiredPosition = this.target.model.position.clone().add(offset);
        this.camera.position.lerp(this.desiredPosition, settings.lerpFactor);
        
        const lookDir = new THREE.Vector3(0, 0, settings.lookDistance);
        lookDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.target.model.rotation.y);
        this.desiredLookAt = this.camera.position.clone().add(lookDir);
        
        this.camera.lookAt(this.desiredLookAt);
    }
    
    switchCameraMode() {
        console.log('--- Objetos na cena ---');
        window.scene.traverse(obj => {
            if (obj.type === 'Mesh') {
                console.log('Mesh:', obj.name);
            }
        });
        console.log('-----------------------');
        
        console.log('📷 switchCameraMode chamado');
        console.log('📷 Estado atual:', {
            mode: this.cameraMode,
            isTransitioning: this.isTransitioning,
            hasTarget: !!this.target,
            hasCamera: !!this.camera
        });
        
        if (!this.target || !this.camera) {
            console.warn('⚠️ Não é possível mudar câmera - target ou camera em falta');
            return;
        }
        
        if (this.isTransitioning) {
            console.log('📷 Mudança ignorada - transição em andamento');
            return;
        }
        
        // Guardar estado atual para transição
        this.transitionStartPosition.copy(this.camera.position);
        this.transitionStartRotation.copy(this.camera.rotation);
        
        // Avançar para próximo modo
        this.currentModeIndex = (this.currentModeIndex + 1) % this.availableModes.length;
        const newMode = this.availableModes[this.currentModeIndex];
        const oldMode = this.cameraMode;
        
        this.cameraMode = newMode;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        const modeNames = {
            follow: 'Terceira Pessoa',
            overhead: 'Vista Aérea',
            firstPerson: 'Primeira Pessoa'
        };
        
        console.log(`📷 Mudança de câmera: ${modeNames[oldMode]} → ${modeNames[newMode]}`);
        
        // --- TETO TRANSPARENTE EM OVERHEAD ---
        // Procura o mesh mais alto (provável teto)
        let tetoMesh = null;
        let maxY = -Infinity;
        window.scene.traverse(obj => {
            if (obj.type === 'Mesh' && obj.material && obj.position.y > maxY) {
                maxY = obj.position.y;
                tetoMesh = obj;
            }
        });

        if (this.cameraMode === 'overhead' && tetoMesh) {
            tetoMesh.material.transparent = true;
            tetoMesh.material.opacity = 0.05;
            tetoMesh.material.needsUpdate = true;
        } else if (tetoMesh) {
            tetoMesh.material.transparent = false;
            tetoMesh.material.opacity = 1;
            tetoMesh.material.needsUpdate = true;
        }
        // --- FIM TETO TRANSPARENTE ---

        this.showCameraModeNotification(modeNames[newMode]);
    }
    
    showCameraModeNotification(modeName) {
        // Remover notificação anterior se existir
        const existingNotification = document.getElementById('camera-mode-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.id = 'camera-mode-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-family: 'Fredoka', Arial, sans-serif;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: cameraNotification 2s ease-in-out;
            border: 3px solid #ff66c4;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        
        notification.textContent = `📷 ${modeName}`;
        
        // Adicionar animação CSS
        if (!document.getElementById('camera-notification-style')) {
            const style = document.createElement('style');
            style.id = 'camera-notification-style';
            style.textContent = `
                @keyframes cameraNotification {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remover após animação
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
    }
    
    // Métodos úteis para debug e controle
    getCurrentMode() {
        return this.cameraMode;
    }
    
    setMode(mode) {
        if (this.availableModes.includes(mode) && mode !== this.cameraMode) {
            this.currentModeIndex = this.availableModes.indexOf(mode);
            this.cameraMode = mode;
            this.isTransitioning = true;
            this.transitionProgress = 0;
            this.transitionStartPosition.copy(this.camera.position);
            this.transitionStartRotation.copy(this.camera.rotation);
            console.log('📷 Modo forçado para:', mode);
        }
    }
    
    enableFollow() {
        this.activeFollow = true;
        console.log('📷 Seguimento ativado');
    }
    
    disableFollow() {
        this.activeFollow = false;
        console.log('📷 Seguimento desativado');
    }
}