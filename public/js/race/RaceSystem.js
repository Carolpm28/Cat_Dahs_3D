// js/race/RaceSystem.js - Sistema de corrida com 10 voltas e sistema de posições corrigido
import { RacerCat } from '../characters/RacerCat.js';
import { CameraController } from '../graphics/CameraController.js';
import { catData } from '../data/GameData.js';
import { PowerUpSystem } from '../game/PowerUpSystem.js';
import { ObstacleSystem } from '../game/ObstacleSystem.js';

export class RaceSystem {
    // Construtor da classe RaceSystem. Inicializa o sistema de corrida, jogadores, estado da corrida e sistemas auxiliares.
    constructor(gameState, trackManager) {
        console.log('DEBUG: RaceSystem constructor - gameState:', gameState);
        this.gameState = gameState;
        this.trackManager = trackManager;
        this.players = [];
        this.raceStarted = false;
        this.raceFinished = false;
        this.countdownStarted = false;
        this.raceTime = 0;
        this.lastUpdateTime = 0;
        this.countdown = 3;
        this.lapCount = this.gameState.lapCount || 10; // Usar número de voltas selecionado ou 10 como padrão
        this.lapProgress = new Map();
        this.winner = null;
        this.finishTime = 0;
        this.raceResults = [];
        this.isPaused = false;
        this.pausePopup = null;
        this._raceLoopActive = true;
        this._raceLoopRunning = false;
        this._openedHelpFromPause = false;

        // Sistema de obstáculos
        this.obstacleSystem = null;
        
        // Sistema de power-ups
        this.powerUpSystem = null;
        
        // Sistema de câmera
        this.cameraController = null;
        
        // UI Elements
        this.countdownPlane = null;
        this.hudElement = null;
        this.victoryScreen = null;
        
        // Sistema de controles
        this.keys = {
            arrowup: false,
            arrowdown: false,
            arrowleft: false,
            arrowright: false,
            w: false,
            a: false,
            s: false,
            d: false,
            c: false,
            cPressed: false,
            ' ': false,  // Tecla espaço
            spacePressed: false,
            q: false,
            qPressed: false,
            v: false 
        };
        
        this.controlsActive = false;
        this.raceAudio = null;
    }
    
    // Inicializa a corrida: cria jogadores, posiciona-os, configura câmaras e sistemas de power-ups/obstáculos.
    async initRace() {
        console.log('📍 RaceSystem.initRace - Iniciando corrida com 10 voltas...');
        
        this.createPlayers();
        this.positionPlayersAtStart();
        this.initProgressTracking();
        this.setupCamera();
        this.startCountdown();
        // Inicializar sistema de power-ups
        this.powerUpSystem = new PowerUpSystem(this.trackManager);
        // Inicializar sistema de obstáculos
        this.obstacleSystem = new ObstacleSystem(this.trackManager);
        // Aplicar preferências de luzes do utilizador
        setTimeout(() => {
            // Função utilitária para buscar luzes
            const findLight = (type) => {
                let found = window.scene.children.find(obj => obj.type === type);
                if (!found && window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
                    const houseWorld = window.scene.getObjectByName('HouseWorld');
                    found = houseWorld.children.find(obj => obj.type === type);
                }
                return found;
            };
            const ambientLight = findLight('AmbientLight');
            const pointLight = findLight('PointLight');
            let neonLights = [];
            if (window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
                const houseWorld = window.scene.getObjectByName('HouseWorld');
                neonLights = houseWorld.children.filter(obj => obj.type === 'SpotLight');
            }
            // Ler preferências
            const getPref = (key, def) => {
                const v = localStorage.getItem(key);
                return v !== null ? (v === 'true' ? true : v === 'false' ? false : parseFloat(v)) : def;
            };
            const ambient = getPref('catdash_light_ambient', 0.4);
            const point = getPref('catdash_light_point', 1.0);
            const neon = getPref('catdash_light_neon', 2.5);
            const neonMode = getPref('catdash_light_neon_mode', false);
            if (ambientLight) ambientLight.intensity = ambient;
            if (pointLight) pointLight.intensity = point;
            if (neonLights.length > 0) {
                neonLights.forEach(light => light.intensity = neonMode ? neon : 0);
            }
            // Se modo neon ativo, ajustar luz ambiente e principal
            if (neonMode) {
                if (ambientLight) ambientLight.intensity = 0.25;
                if (pointLight) pointLight.intensity = 0;
            }
        }, 500);
    }
    
    // Método simplificado para calcular distância até linha de chegada
    getDistanceToFinish(player) {
        const startPos = this.trackManager.trackData.startPosition;
        const playerPos = player.model.position;
        
        // Calcular distância euclidiana até linha de partida/chegada
        const distance = playerPos.distanceTo(startPos);
        return distance;
    }
    
    // Método para verificar se jogador cruzou linha de chegada
    checkLapCompletion(player) {
        const progress = this.lapProgress.get(player);
        const startPos = this.trackManager.trackData.startPosition;
        const playerPos = player.model.position;
        
        // Distância até linha de chegada
        const distanceToStart = playerPos.distanceTo(startPos);
        
        // Se estava longe da linha (>50 unidades) e agora está perto (<10 unidades)
        if (progress.lastDistanceToStart > 50 && distanceToStart < 10) {
            progress.currentLap++;
            console.log(`🏁 ${player.isAI ? 'IA' : `Jogador ${player.playerNumber}`} completou volta ${progress.currentLap - 1}!`);
        }
        
        progress.lastDistanceToStart = distanceToStart;
    }
    
    // Método para calcular progresso aproximado na pista
    calculateTrackProgress(player) {
        const startPos = this.trackManager.trackData.startPosition;
        const playerPos = player.model.position;
        
        // Usar ângulo para determinar progresso aproximado
        const dx = playerPos.x - startPos.x;
        const dz = playerPos.z - startPos.z;
        let angle = Math.atan2(dz, dx);
        
        // Normalizar ângulo para 0-1
        if (angle < 0) angle += Math.PI * 2;
        const progress = angle / (Math.PI * 2);
        
        return Math.max(0, Math.min(1, progress));
    }
    
    // Inicializa o tracking do progresso de cada jogador (voltas, progresso, etc).
    initProgressTracking() {
        this.players.forEach((player, index) => {
            console.log(`🔧 Inicializando progresso para P${player.playerNumber} (${player.isAI ? 'IA' : 'HUMANO'})`);
            
            // Calcular distância inicial à linha de partida
            const startPos = this.trackManager.trackData.startPosition;
            const initialDistance = player.model.position.distanceTo(startPos);
            
            this.lapProgress.set(player, {
                currentLap: 1,        // 🔧 TODOS começam na volta 1
                trackProgress: 0,     // 🔧 TODOS começam no progresso 0
                lastRealProgress: 0,
                lastDistanceToStart: initialDistance, // Usar distância real inicial
                lastTrackProgress: 0,  // Adicionar este campo
                finished: false,
                finishTime: 0,
                totalProgress: 1.0,   // volta 1 + progresso 0 = 1.0
                lastFinishCross: 0
            });
            
            console.log(`✅ P${player.playerNumber} inicializado:`, {
                volta: 1,
                progresso: 0,
                distanciaInicial: initialDistance.toFixed(2)
            });
        });
        
        console.log('✅ Sistema de progresso inicializado para', this.players.length, 'jogadores - TODOS na volta 1');
    }
    
    // Configura as câmaras para single ou multiplayer (split-screen).
    setupCamera() {
        // Forçar modo single player se só tiver um jogador
        if (this.players.length === 1) {
            this.gameState.isSinglePlayer = true;
        }
        
        console.log('DEBUG: setupCamera - players.length:', this.players.length, 'isSinglePlayer:', this.gameState.isSinglePlayer);
        
        if (this.players.length > 1 && !this.gameState.isSinglePlayer) {
            console.log('DEBUG: Configurando câmeras para modo multiplayer');
            window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            window.cameraP2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.cameraControllerP1 = new CameraController(window.camera, this.players[0]);
            this.cameraControllerP2 = new CameraController(window.cameraP2, this.players[1]);
            
            // Posições iniciais - Agora atrás dos jogadores
            const offsetP1 = this.players[0].model.position.clone();
            offsetP1.y += 4; // Altura
            offsetP1.z += 10; // Distância para trás
            window.camera.position.copy(offsetP1);
            window.camera.lookAt(this.players[0].model.position);
            
            const offsetP2 = this.players[1].model.position.clone();
            offsetP2.y += 4; // Altura
            offsetP2.z += 10; // Distância para trás
            window.cameraP2.position.copy(offsetP2);
            window.cameraP2.lookAt(this.players[1].model.position);
            
        } else {
            console.log('DEBUG: Configurando câmera para modo single player');
            // Garantir que não há câmera P2
            window.cameraP2 = undefined;
            
            // Criar nova câmera se necessário
            if (!window.camera) {
            window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            }
            
            // CRIAR O CAMERA CONTROLLER CORRETAMENTE
            this.cameraController = new CameraController(window.camera, this.players[0]);
            console.log('DEBUG: cameraController criado:', !!this.cameraController, 'modo:', this.cameraController?.cameraMode);
            
            // Posição inicial - Agora atrás do jogador
            const offset = this.players[0].model.position.clone();
            offset.y += 3.5; // Altura
            offset.z += 10; // Distância para trás
            window.camera.position.copy(offset);
            window.camera.lookAt(this.players[0].model.position);
        }
    }
    
    
    // Cria os jogadores (Player 1, Player 2 ou IA) conforme o modo de jogo.
    createPlayers() {
        this.players = [];
        
        console.log('🔧 DEBUG createPlayers:', {
            isSinglePlayer: this.gameState.isSinglePlayer,
            player1Character: this.gameState.player1Character,
            player2Character: this.gameState.player2Character
        });
        
        // Player 1 - SEMPRE humano
        const player1 = new RacerCat({
            character: this.gameState.player1Character || 'rambim',
            playerNumber: 1,
            isAI: false  // ⭐ SEMPRE HUMANO
        });
        this.players.push(player1);
        console.log('📍 Jogador 1 criado: HUMANO -', this.gameState.player1Character || 'rambim');
        
        // Player 2 - Humano OU IA dependendo do modo
        if (!this.gameState.isSinglePlayer && this.gameState.player2Character) {
            // 🎯 MODO 2 JOGADORES - P2 é HUMANO
            const player2 = new RacerCat({
                character: this.gameState.player2Character,
                playerNumber: 2,
                isAI: false  // ⭐ HUMANO no modo 2 jogadores
            });
            this.players.push(player2);
            console.log('📍 Jogador 2 criado: HUMANO -', this.gameState.player2Character);
        } else {
            // MODO 1 JOGADOR - P2 é IA
            this.gameState.isSinglePlayer = true;
            const aiCharacter = this.getRandomAICat();
            const aiCat = new RacerCat({
                character: aiCharacter,
                playerNumber: 2,
                isAI: true  // ⭐ IA no modo 1 jogador
            });
            this.players.push(aiCat);
            console.log('📍 IA criada:', aiCharacter);
        }
        
        // DEBUG FINAL
        console.log('🎮 Estado final dos jogadores:');
        this.players.forEach((player, index) => {
            console.log(`  P${index + 1}: ${player.isAI ? 'IA' : 'HUMANO'} (${player.character})`);
        });
    }
    // Escolhe um gato aleatório para a IA, evitando duplicados com os jogadores humanos.
    getRandomAICat() {
        const availableCats = Object.keys(catData).filter(cat => 
            cat !== this.gameState.player1Character && cat !== this.gameState.player2Character);
        
        const randomIndex = Math.floor(Math.random() * availableCats.length);
        return availableCats[randomIndex];
    }
    
    // Posiciona os jogadores na linha de partida, com offset lateral.
    positionPlayersAtStart() {
        const startPos = this.trackManager.trackData.startPosition;
        const startDir = this.trackManager.trackData.startDirection;
        
        console.log('📍 Posicionando gatos na pista para 10 voltas');
        
        const angle = Math.atan2(startDir.z, startDir.x);
        
        // Posicionar cada jogador independentemente
        this.players.forEach((player, index) => {
            // Forward offset diferente para cada jogador
            const forwardOffset = index === 0 ? 0.5 : 2.0; // P1 mais para trás (1.0), P2 mantém 2.0
            const forwardX = startDir.x * forwardOffset;
            const forwardZ = startDir.z * forwardOffset;
            
            // Deslocamento lateral (usando vetor perpendicular fixo)
            const lateralOffset = index === 0 ? -4.5 : 0.8; // Mantido P1 em -4.5, P2 em 0.8
            // Usar direção perpendicular fixa (-z, x) para movimento lateral puro
            const lateralX = -startDir.z;
            const lateralZ = startDir.x;
            
            // Aplicar os deslocamentos separadamente
            player.model.position.x = startPos.x + forwardX + (lateralX * lateralOffset);
            player.model.position.z = startPos.z + forwardZ + (lateralZ * lateralOffset);
            player.model.position.y = 0;
            
            player.model.rotation.y = angle;
            window.scene.add(player.model);
            
            console.log(`🐱 Gato P${player.playerNumber} posicionado:`, {
                x: player.model.position.x.toFixed(2),
                z: player.model.position.z.toFixed(2),
                distânciaParaLinha: player.model.position.distanceTo(startPos).toFixed(2),
                deslocamentoLateral: lateralOffset,
                deslocamentoFrontal: forwardOffset
            });
        });
        
        // Verificação de posicionamento
        if (this.players.length >= 2) {
            const distP1ToStart = this.players[0].model.position.distanceTo(startPos);
            const distP2ToStart = this.players[1].model.position.distanceTo(startPos);
            console.log('✅ Verificação de distâncias:');
            console.log(`   P1 distância da linha: ${distP1ToStart.toFixed(2)}`);
            console.log(`   P2 distância da linha: ${distP2ToStart.toFixed(2)}`);
            console.log(`   Diferença: ${Math.abs(distP1ToStart - distP2ToStart).toFixed(2)}`);
        }
    }
    
    // Inicia a contagem decrescente antes do arranque da corrida.
    startCountdown() {
        this.countdownStarted = true;
        this.countdown = 3;
        
        this.createCountdownText();
        
        const countInterval = setInterval(() => {
            this.countdown--;
            this.updateCountdownText();
            console.log(`⏰ Contagem: ${this.countdown}`);
            
            if (this.countdown <= 0) {
                clearInterval(countInterval);
                // Aguardar 800ms após mostrar "GO!" antes de iniciar a corrida
                setTimeout(() => {
                this.startRace();
                }, 800);
            }
        }, 1000);
    }
    
    // Cria o texto/placa visual da contagem decrescente.
    createCountdownText() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;  // Reduzido pela metade
        canvas.height = 128; // Reduzido pela metade
        
        this.countdownCanvas = canvas;
        this.countdownContext = context;
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.transparent = true; // Habilitar transparência
        
        const geometry = new THREE.PlaneGeometry(5, 2.5); // Reduzido pela metade
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.95
        });
        
        this.countdownPlane = new THREE.Mesh(geometry, material);
        this.countdownPlane.position.set(0, 4, -5); // Altura reduzida de 6 para 4
        this.countdownPlane.lookAt(window.camera.position);
        window.scene.add(this.countdownPlane);
        
        this.updateCountdownText();
    }
    
    // Atualiza o texto da contagem decrescente.
    updateCountdownText() {
        const context = this.countdownContext;
        const canvas = this.countdownCanvas;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Texto principal
        const text = this.countdown > 0 ? this.countdown.toString() : "GO!";
        context.font = 'bold 80px Fredoka, Arial, sans-serif'; // Fonte reduzida
        
        // Sombra suave
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 10;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        
        // Texto com cor
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        if (this.countdown > 0) {
            // Efeito de brilho rosa para números
            context.fillStyle = '#FF1493';
            context.globalAlpha = 0.3;
            context.fillText(text, canvas.width/2, canvas.height/2);
            context.fillText(text, canvas.width/2, canvas.height/2); // Duplo para mais brilho
            
            // Texto principal rosa
            context.globalAlpha = 1;
            context.fillStyle = '#FF69B4';
            context.fillText(text, canvas.width/2, canvas.height/2);
        } else {
            // Efeito de brilho verde para GO
            context.fillStyle = '#32CD32';
            context.globalAlpha = 0.3;
            context.fillText(text, canvas.width/2, canvas.height/2);
            context.fillText(text, canvas.width/2, canvas.height/2);
            
            // Texto principal verde
            context.globalAlpha = 1;
            context.fillStyle = '#50C878';
            context.fillText(text, canvas.width/2, canvas.height/2);
            
            // Pequenas patinhas
            context.font = '20px Arial';
            context.fillStyle = '#FF69B4';
            context.fillText('🐾', canvas.width/2 + 50, canvas.height/2);
        }
        
        this.countdownPlane.material.map.needsUpdate = true;
        
        // Animação suave de escala
        const scale = this.countdown > 0 ? 1 + Math.sin(Date.now() * 0.005) * 0.05 : 1;
        this.countdownPlane.scale.set(scale * 5, scale * 2.5, 1); // Escala reduzida
    }
    
    // Inicia a corrida após a contagem decrescente.
    startRace() {
        console.log('DEBUG: startRace chamado');
        this.raceStarted = true;
        this.lastUpdateTime = performance.now();
        this.isPaused = false;
        this.pausePopup = null;
        this._raceLoopActive = true;
        console.log('🏁 CORRIDA DE 10 VOLTAS INICIADA! Controles ativos.');
        setTimeout(() => {
            window.scene.remove(this.countdownPlane);
        }, 1500);
        this.setupPlayerControls();
        console.log('DEBUG: setupPlayerControls chamado');
        this.createHUD();
        this.startRaceLoop();
        // Iniciar áudio de fundo
        if (this.raceAudio) {
            this.raceAudio.pause();
            this.raceAudio.currentTime = 0;
        }
        let volume = 0.5;
        if (localStorage.getItem('catdash_music_volume')) {
            volume = parseFloat(localStorage.getItem('catdash_music_volume'));
        }
        this.raceAudio = new Audio('assets/mix_cat_dash.mp3');
        this.raceAudio.loop = true;
        this.raceAudio.volume = volume;
        this.raceAudio.play().catch(() => {});
        // Parar música do menu ao iniciar corrida
        if (window.gameManager && window.gameManager.menuAudio) {
            window.gameManager.menuAudio.pause();
            window.gameManager.menuAudio.currentTime = 0;
        }
    }
    
    // Configura os event listeners para os controlos dos jogadores.
    setupPlayerControls() {
        console.log('🎮 Configurando controles dos jogadores...');
        
        this.removeOldListeners();
        this.keydownHandler = (e) => {
            if (e.key === 'Escape') {
                if (this.raceStarted && !this.raceFinished) {
                    console.log('[PAUSE] ESC pressionado durante corrida');
                    this.pauseGame();
                }
                return;
            }
            if (this.isPaused) return;
            
            // Converter tecla para minúscula para WAD
            const key = e.key.toLowerCase();
            
            if (this.keys.hasOwnProperty(key) || key === 'v') {
                this.keys[key] = true;
                
                // Debug das teclas pressionadas
                if (['w', 'a', 's', 'd', 'v'].includes(key)) {
                    console.log(`🎮 P1 pressionou: ${key}`);
                }
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
                    console.log(`🎮 P2 pressionou: ${key}`);
                }
                
                if (key === 'c' && !this.keys.cPressed) {
                    this.keys.cPressed = true;
                    if (this.cameraController && this.gameState.isSinglePlayer) {
                        this.cameraController.switchCameraMode();
                    }
                }
            }
        };
        
        this.keyupHandler = (e) => {
            // Converter tecla para minúscula para WAD
            const key = e.key.toLowerCase();
            
            if (this.keys.hasOwnProperty(key) || key === 'v') {
                this.keys[key] = false;
                if (key === 'c') {
                    this.keys.cPressed = false;
                }
            }
        };
        
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
        this.controlsActive = true;
        console.log('✅ Controles ativados com sucesso!');
    }

    
    // Remove event listeners antigos dos controlos.
    removeOldListeners() {
        console.log('DEBUG: removeOldListeners chamado');
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.keyupHandler) {
            window.removeEventListener('keyup', this.keyupHandler);
        }
    }
    
    // Inicia o loop principal da corrida (animação e lógica frame a frame).
    startRaceLoop() {
        if (this._raceLoopRunning) return; // Não iniciar múltiplos loops
        this._raceLoopRunning = true;
        
        const raceLoop = () => {
            if (!this.raceStarted || this.raceFinished) { 
                this._raceLoopRunning = false; 
                return; 
            }
            if (this.isPaused) { 
                this._raceLoopRunning = false; 
                return; 
            }
            
            // ATUALIZAR CÂMERAS CORRETAMENTE
            if (this.players.length > 1 && !this.gameState.isSinglePlayer) {
                // Modo multiplayer - duas câmeras
                if (this.cameraControllerP1) {
                this.cameraControllerP1.update();
                }
                if (this.cameraControllerP2) {
                this.cameraControllerP2.update();
                }
            } else {
                // Modo single player - uma câmera com múltiplos modos
                if (this.cameraController) {
                this.cameraController.update();
            }
            }
            
            this.updateRace();
            requestAnimationFrame(raceLoop);
        };
        
        raceLoop();
        console.log('🔄 Loop de corrida iniciado');
    }
    
    
    // Atualiza o estado da corrida a cada frame (movimento, colisões, HUD, etc).
    updateRace() {
        if (!this.controlsActive) return;
        
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        
        this.raceTime += deltaTime;
        
        // PROCESSAR CADA JOGADOR
        this.players.forEach((player, index) => {
            if (player.isAI) {
                this.updateAI(player, deltaTime);
            } else {
                this.updatePlayerControls(player, deltaTime);
                this.updatePlayerProgress(player);
                
                // Verificar direção errada para cada jogador
                if (this.trackManager && this.lapProgress.has(player)) {
                    const trackDir = this.trackManager.getDirectionOnTrack(this.lapProgress.get(player).trackProgress);
                    const playerDir = new THREE.Vector3(0, 0, 1).applyEuler(player.model.rotation);
                    const wrongWay = playerDir.dot(trackDir) < 0;
                    this.showWrongWaySign(wrongWay, player);
                }
            }
            
            this.checkFinish(player);
        });

        // Atualizar power-ups
        if (this.powerUpSystem) {
            this.powerUpSystem.update(this.players, deltaTime);
        }
        
        // Verificar colisões com obstáculos
        if (this.obstacleSystem) {
            this.players.forEach(player => {
                this.obstacleSystem.checkCollisions(player);
            });
        }

        this.updateHUD();
    }

    // Atualiza os controlos e movimento de um jogador humano.
    updatePlayerControls(player, deltaTime) {
        const moveSpeed = player.getSpeed() * deltaTime;
        const rotateSpeed = 2.5 * deltaTime;
        let forward, backward, left, right, jump;
        
        // DEFINIR CONTROLES CORRETOS
        if (this.players.length > 1 && !this.gameState.isSinglePlayer) {
            // MODO 2 JOGADORES
            if (player.playerNumber === 1) {
                forward = this.keys.w;
                backward = this.keys.s;
                left = this.keys.a;
                right = this.keys.d;
                jump = this.keys.v; // Tecla V para pular
            } else {
                // P2 = Setas + Espaço
                forward = this.keys.arrowup;
                backward = this.keys.arrowdown;
                left = this.keys.arrowleft;
                right = this.keys.arrowright;
                jump = this.keys[' '];
            }
        } else {
            // MODO 1 JOGADOR
            if (player.playerNumber === 1) {
                // P1 = Setas + Espaço
                forward = this.keys.arrowup;
                backward = this.keys.arrowdown;
                left = this.keys.arrowleft;
                right = this.keys.arrowright;
                jump = this.keys[' '];
            }
        }
        
        // MOVIMENTO
        if (forward) {
            player.accelerate(deltaTime);
            player.move(moveSpeed);
        } else if (backward) {
            player.brake(deltaTime);
        } else {
            player.decelerate(deltaTime);
        }
        
        // ROTAÇÃO
        if (left) {
            player.rotate(-rotateSpeed);
        }
        if (right) {
            player.rotate(rotateSpeed);
        }
        
        // SALTO - CORRIGIDO
        if (jump) {
            player.jump();
            console.log(`🦘 P${player.playerNumber} saltou!`);
        }
        
        player.updateAnimation(deltaTime);
    }
    
    // Atualiza o movimento e progresso da IA (bot).
    updateAI(player, deltaTime) {
        // Se o jogo estiver pausado, não atualizar a IA
        if (this.isPaused) return;
        
        console.log(`🤖 updateAI chamado para P${player.playerNumber}`);
        
        const progress = this.lapProgress.get(player);
        const iaSpeed = 0.05; // Voltas por segundo
        
        // Garante que trackProgress está definido
        if (typeof progress.trackProgress !== 'number' || isNaN(progress.trackProgress)) {
            progress.trackProgress = 0;
        }
        
        // Incrementa o progresso da IA
        progress.trackProgress += iaSpeed * deltaTime;
        if (progress.trackProgress >= 1.0) {
            progress.trackProgress -= 1.0;
            progress.currentLap++;
            console.log(`🏁 IA completou volta ${progress.currentLap - 1}! Agora na volta ${progress.currentLap}`);
        }
        
        // Garante que está sempre entre 0 e 1
        progress.trackProgress = Math.max(0, Math.min(1, progress.trackProgress));
        
        // Forçar IA a ficar no centro da pista
        const nextPosition = this.trackManager.getPositionOnTrack(progress.trackProgress);
        player.model.position.copy(nextPosition);
        
        // Atualizar rotação
        const targetDirection = this.trackManager.getDirectionOnTrack(progress.trackProgress);
        const angle = Math.atan2(targetDirection.x, targetDirection.z);
        player.model.rotation.y = angle;
        
        // Velocidade base
        const baseSpeed = player.maxSpeed * 0.7;
        const minSpeed = 0.5;
        if (player.speed < minSpeed) {
            player.speed = minSpeed;
        } else if (player.speed < baseSpeed) {
            player.speed += deltaTime * 1.5;
            if (player.speed > baseSpeed) player.speed = baseSpeed;
        } else if (player.speed > baseSpeed) {
            player.speed = baseSpeed;
        }
        
        player.updateAnimation(deltaTime);
        progress.totalProgress = (progress.currentLap - 1) + progress.trackProgress;
        
        // Debug ocasional
        if (Math.random() < 0.02) {
            console.log(`🤖 IA P${player.playerNumber}: V${progress.currentLap} P${progress.trackProgress.toFixed(3)}`);
        }
    }
    
    debugPlayerPositions() {
        console.log('\n=== DEBUG POSIÇÕES ===');
        this.players.forEach((player, index) => {
            const progress = this.lapProgress.get(player);
            const realProgress = this.getRealTrackProgress(player);
            console.log(`P${index + 1} (${player.isAI ? 'IA' : 'Humano'}):`, {
                currentLap: progress.currentLap,
                trackProgress: progress.trackProgress,
                realProgress: realProgress,
                totalProgress: progress.totalProgress,
                position: player.model.position
            });
        });
        console.log('========================\n');
    }

    
    updatePlayerProgress(player) {
        const progress = this.lapProgress.get(player);
        if (!progress) {
            console.error(`❌ Progresso não encontrado para P${player.playerNumber}!`);
            return;
        }

        // 1. OBTER POSIÇÃO E PROGRESSO ATUAL
        const startPos = this.trackManager.trackData.startPosition;
        const currentDistance = player.model.position.distanceTo(startPos);
        const currentProgress = this.getRealTrackProgress(player);

        // 2. VERIFICAR DIREÇÃO DO MOVIMENTO
        const playerDir = new THREE.Vector3(0, 0, 1).applyEuler(player.model.rotation);
        const trackDir = this.trackManager.getDirectionOnTrack(currentProgress);
        const isCorrectDirection = playerDir.dot(trackDir) > 0;

        // 3. SISTEMA DE DETECÇÃO DE VOLTAS (NOVO E SIMPLIFICADO)
        if (isCorrectDirection) {
            // Condições para completar volta:
            // A. Jogador estava no final da volta (> 80%)
            // B. Jogador agora está no início da volta (< 20%)
            // C. Jogador está próximo à linha de chegada
            // D. Passou tempo mínimo desde última volta
            const isNearFinishLine = currentDistance < 20;
            const wasNearEnd = progress.lastTrackProgress > 0.80;
            const isNearStart = currentProgress < 0.20;
            const minTimePassed = (this.raceTime - (progress.lastLapTime || 0)) > 2;

            // Se todas as condições forem atendidas = VOLTA COMPLETA
            if (wasNearEnd && isNearStart && isNearFinishLine && minTimePassed) {
                // Incrementar volta
            progress.currentLap++;
                progress.lastLapTime = this.raceTime;

                // Log detalhado da volta
                console.log(`🏁 VOLTA ${progress.currentLap - 1} COMPLETA - P${player.playerNumber}:`, {
                    distancia: currentDistance.toFixed(1),
                    progressoAnterior: progress.lastTrackProgress.toFixed(3),
                    progressoAtual: currentProgress.toFixed(3),
                    tempo: (this.raceTime - (progress.lastLapTime || 0)).toFixed(1) + 's'
                });
            }

            // 4. ATUALIZAR PROGRESSO
        progress.trackProgress = currentProgress;

            // 5. CALCULAR PROGRESSO TOTAL (em número de voltas)
            const voltasCompletas = progress.currentLap - 1;
            progress.totalProgress = voltasCompletas + currentProgress;

            // Debug do estado atual
            console.log(`📊 Estado P${player.playerNumber}:`, {
                volta: progress.currentLap,
                voltasCompletas: voltasCompletas,
                progressoNaVolta: (currentProgress * 100).toFixed(1) + '%',
                progressoTotal: progress.totalProgress.toFixed(3),
                percentualCorrida: ((progress.totalProgress / this.lapCount) * 100).toFixed(1) + '%'
            });
        }

        // 6. ATUALIZAR VALORES PARA PRÓXIMA VERIFICAÇÃO
        progress.lastTrackProgress = currentProgress;
        progress.lastDistanceToStart = currentDistance;
    }


    // Verifica se o jogador terminou a corrida e processa o fim da corrida.
    checkFinish(player) {
        const progress = this.lapProgress.get(player);
        
        if (progress.currentLap > this.lapCount && !progress.finished) {
            progress.finished = true;
            progress.finishTime = this.raceTime;
            console.log(`🏆 ${player.isAI ? 'IA' : `Jogador ${player.playerNumber}`} terminou a corrida!`);
            
            // Se é o primeiro a terminar, é o vencedor!
            if (!this.winner) {
                this.winner = player;
                this.finishTime = this.raceTime;
                this.raceResults.push({
                    player: player,
                    character: player.character,
                    time: this.raceTime,
                    position: 1
                });
                
                // Parar a corrida e mostrar tela de vitória fofa
                this.raceFinished = true;
                this.controlsActive = false;
                
                console.log(`🎊 ${catData[player.character].name} venceu a corrida!`);
                
                // Mostrar tela de vitória mais rapidamente (500ms ao invés de 2000ms)
                setTimeout(() => {
                    this.showCuteVictoryScreen();
                }, 500);
            }
            
            // Mensagem tradicional também
            this.showFinishMessage(player);
            // Parar áudio de fundo ao terminar a corrida
            if (this.raceAudio) {
                this.raceAudio.pause();
                this.raceAudio.currentTime = 0;
            }
        }
    }
    
    // Mostra mensagem de fim de corrida
    showFinishMessage(player) {
        console.log(`🏁 ${player.isAI ? 'IA' : `Jogador ${player.playerNumber}`} terminou!`);
    }
    
    // Mostra a tela de vitória fofa quando alguém vence a corrida.
    showCuteVictoryScreen() {
        console.log('Mostrando tela de vitória/derrota!');
        
        // Parar música da corrida
        if (this.raceAudio) {
            this.raceAudio.pause();
            this.raceAudio.currentTime = 0;
        }

        const winner = this.winner;
        const winnerData = catData[winner.character];
        const isAIWin = winner.isAI && this.gameState.isSinglePlayer;

        // Tocar música de vitória/derrota
        try {
            // Criar e configurar o áudio
            const victoryAudio = new Audio(isAIWin ? 'assets/perdeu.mp3' : 'assets/ganhou.mp3');
            
            // Usar o mesmo volume das configurações
            let volume = 0.5;
            if (localStorage.getItem('catdash_music_volume')) {
                volume = parseFloat(localStorage.getItem('catdash_music_volume'));
            }
            victoryAudio.volume = volume;
            
            // Tocar o som
            victoryAudio.play().catch(() => console.log('Som não disponível'));
            
            // Guardar referência para poder controlar depois
            this.victoryAudio = victoryAudio;
        } catch (e) {
            console.log('Som não disponível');
        }

        // Criar container da tela
        this.victoryScreen = document.createElement('div');
        this.victoryScreen.className = 'victory-screen';
        this.victoryScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${isAIWin ? 
                'linear-gradient(45deg, #FFB6C1, #FFC0CB, #FFE4E1, #FFCCCB)' : 
                'linear-gradient(45deg, #FFB6C1, #FFC0CB, #FFE4E1, #FFCCCB)'};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Fredoka', Arial, sans-serif;
            animation: fadeIn 1s ease-in-out;
        `;
        
        // Efeito de entrada
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            @keyframes sparkle {
                0%, 100% { opacity: 1; transform: rotate(0deg) scale(1); }
                50% { opacity: 0.7; transform: rotate(180deg) scale(1.2); }
            }
            .victory-content {
                text-align: center;
                background: rgba(255, 255, 255, 0.9);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                border: 5px solid ${isAIWin ? '#FF69B4' : '#FF69B4'};
                max-width: 600px;
                position: relative;
                overflow: hidden;
            }
            .victory-crown {
                font-size: 80px;
                animation: bounce 2s infinite;
                margin-bottom: 20px;
            }
            .victory-title {
                font-size: 48px;
                color: ${isAIWin ? '#FF1493' : '#FF1493'};
                margin: 20px 0;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            .winner-info {
                background: linear-gradient(45deg, #FFE4E1, #FFF0F5);
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
                border: 3px solid ${isAIWin ? '#FF69B4' : '#FF69B4'};
            }
            .winner-character {
                font-size: 36px;
                color: ${isAIWin ? '#FF1493' : '#FF1493'};
                font-weight: bold;
                margin: 10px 0;
            }
            .race-stats {
                font-size: 20px;
                color: #8B008B;
                margin: 10px 0;
            }
            .paw-prints {
                position: absolute;
                font-size: 30px;
                animation: sparkle 3s infinite;
            }
            .victory-button {
                background: linear-gradient(45deg, #FF69B4, #FF1493);
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 20px;
                font-family: 'Fredoka', Arial, sans-serif;
                font-weight: bold;
                border-radius: 25px;
                cursor: pointer;
                margin: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .victory-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
            }
            .confetti {
                position: absolute;
                font-size: 25px;
                animation: confetti-fall 3s infinite linear;
            }
            @keyframes confetti-fall {
                0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
        
        // Conteúdo da vitória/derrota
        const victoryContent = document.createElement('div');
        victoryContent.className = 'victory-content';
        
        victoryContent.innerHTML = `
            <div class="victory-crown">${isAIWin ? '😿' : '👑'}</div>
            <div class="victory-title">${isAIWin ? 'DERROTA!' : 'CAMPEÃO!'}</div>
            
            <div class="winner-info">
                <div class="winner-character">${winnerData.name}</div>
                <div style="font-size: 60px; margin: 15px 0;"></div>
                <div class="race-stats">⏱Tempo: ${this.finishTime.toFixed(2)} segundos</div>
                <div class="race-stats">${this.lapCount} voltas completas</div>
                <div class="race-stats">${isAIWin ? 'O Bot venceu!' : `${winner.isAI ? 'IA' : `Jogador ${winner.playerNumber}`} venceu!`}</div>
            </div>
            
            <div style="font-size: 24px; color: #FF69B4; margin: 20px 0;">
                ${isAIWin ? 'Não foi desta vez... Tenta novamente!' : 'Parabéns! És	 o Rei/Rainha dos Gatos!'}
            </div>
            
            <div>
                <button class="victory-button" onclick="(() => {
                    if (window.raceSystem && window.raceSystem.victoryAudio) {
                        window.raceSystem.victoryAudio.pause();
                        window.raceSystem.victoryAudio.currentTime = 0;
                    }
                    window.gameManager.resetGame();
                })()">
                    Voltar ao Menu
                </button>
            </div>
        `;
        
        // Adicionar pegadas de gato decorativas
        for (let i = 0; i < 8; i++) {
            const paw = document.createElement('div');
            paw.className = 'paw-prints';
            paw.textContent = '🐾';
            paw.style.top = Math.random() * 80 + 10 + '%';
            paw.style.left = Math.random() * 80 + 10 + '%';
            paw.style.animationDelay = Math.random() * 2 + 's';
            victoryContent.appendChild(paw);
        }
        
        // Adicionar confetes (apenas na vitória) ou lágrimas (na derrota)
        for (let i = 0; i < 15; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            const emojis = isAIWin ? 
                ['💧', '😿', '😢', '💔', '😭'] :
                ['🎊', '🎉', '⭐', '✨', '🌟', '💫', '🎈'];
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            this.victoryScreen.appendChild(confetti);
        }
        
        // Substituir o emoji do gato por um canvas 3D com o modelo do gato vencedor
        const modelContainer = document.createElement('div');
        modelContainer.style.cssText = `width: 180px; height: 180px; margin: 0 auto;`;
        modelContainer.id = 'winner-3d-model';
        victoryContent.querySelector('.winner-info').replaceChild(modelContainer, victoryContent.querySelector('.winner-info').children[1]);
        
        this.victoryScreen.appendChild(victoryContent);
        document.body.appendChild(this.victoryScreen);
        
        // Criar cena 3D do gato vencedor
        setTimeout(() => { this.showWinner3DModel(modelContainer); }, 100);
        
        console.log(`🎊 Tela de ${isAIWin ? 'derrota' : 'vitória'} criada com sucesso!`);
    }

    // Adiciona o canvas 3D do gato vencedor a rodar
    showWinner3DModel(container) {
        // Limpar se já existir
        if (container.firstChild) container.innerHTML = '';
        // Criar renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        container.appendChild(renderer.domElement);
        // Cena e câmera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 100);
        camera.position.set(0, 1.2, 2.2);
        camera.lookAt(0, 0.5, 0);
        // Luz
        const light = new THREE.DirectionalLight(0xffffff, 1.2);
        light.position.set(2, 5, 5);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        // Modelo do gato vencedor
        const winner = this.winner;
        const catModel = winner.model.clone();
        catModel.position.set(0, 0, 0);
        catModel.rotation.set(0, 0, 0);
        scene.add(catModel);
        // Animação de rotação
        function animate() {
            catModel.rotation.y += 0.02;
            renderer.render(scene, camera);
            if (container.parentElement) requestAnimationFrame(animate);
        }
        animate();
    }
    
    // Cria e posiciona o HUD (informação de corrida) para cada jogador.
    createHUD() {
        // HUD Player 1 (esquerda)
        this.hudElement = document.createElement('div');
        this.hudElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 10px;
            width: 320px;
            max-width: 340px;
            background: linear-gradient(45deg, rgba(255, 182, 193, 0.9), rgba(255, 192, 203, 0.9));
            border-radius: 10px;
            border: 3px solid #FF69B4;
            z-index: 1000;
            color: #8B008B;
            padding: 15px;
            font-family: 'Fredoka', Arial, sans-serif;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        `;
        document.body.appendChild(this.hudElement);

        // Label P1
        if (this.players.length > 1 && this.gameState.isSinglePlayer === false) {
            this.labelP1 = document.createElement('div');
            this.labelP1.textContent = 'P1';
            this.labelP1.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                font-size: 32px;
                font-weight: bold;
                color: #fff;
                background: #ff66c4;
                border-radius: 10px;
                padding: 2px 18px;
                z-index: 1100;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                border: 2px solid #fff;
            `;
            document.body.appendChild(this.labelP1);
        }

        // HUD Player 2 (direita) se multiplayer
        if (this.players.length > 1 && this.gameState.isSinglePlayer === false) {
            this.hudElementP2 = document.createElement('div');
            this.hudElementP2.style.cssText = `
                position: fixed;
                top: 20px;
                right: 10px;
                width: 320px;
                max-width: 340px;
                background: linear-gradient(45deg, rgba(255, 182, 193, 0.9), rgba(255, 192, 203, 0.9));
                border-radius: 10px;
                border: 3px solid #FF69B4;
                z-index: 1000;
                color: #8B008B;
                padding: 15px;
                font-family: 'Fredoka', Arial, sans-serif;
                font-weight: bold;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(this.hudElementP2);
            // Label P2
            this.labelP2 = document.createElement('div');
            this.labelP2.textContent = 'P2';
            this.labelP2.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                font-size: 32px;
                font-weight: bold;
                color: #fff;
                background: #7366ff;
                border-radius: 10px;
                padding: 2px 18px;
                z-index: 1100;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                border: 2px solid #fff;
            `;
            document.body.appendChild(this.labelP2);
            // Barra divisória
            this.splitBar = document.createElement('div');
            this.splitBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 50vw;
                width: 0;
                height: 100vh;
                border-left: 4px solid #fff;
                box-shadow: 0 0 10px #ff66c4, 0 0 20px #7366ff;
                z-index: 1050;
                pointer-events: none;
            `;
            document.body.appendChild(this.splitBar);
        }
    }

    getRealTrackProgress(player) {
        try {
            const playerPos = player.model.position;
            const startPos = this.trackManager.trackData.startPosition;
            
            let bestProgress = 0;
            let minDistance = Infinity;
            
            // Testar pontos na pista
            for (let i = 0; i < 100; i++) { // Reduzido para 100 pontos para melhor performance
                const t = i / 100;
                const trackPoint = this.trackManager.getPositionOnTrack(t);
                const distance = playerPos.distanceTo(trackPoint);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    bestProgress = t;
                }
            }
            
            // Verificar se o progresso está correto comparando com posição visual
            console.log(`P${player.playerNumber} pos: (${playerPos.x.toFixed(1)}, ${playerPos.z.toFixed(1)}), progress: ${bestProgress.toFixed(3)}`);
            
            return bestProgress;
        } catch (error) {
            console.warn('Erro ao calcular progresso real:', error);
            return 0;
        }
    }

    getDistanceBasedProgress(player) {
        const startPos = this.trackManager.trackData.startPosition;
        const playerPos = player.model.position;
        
        // Calcular distância total percorrida desde a largada
        const totalDistance = playerPos.distanceTo(startPos);
        
        // Normalizar para um valor entre 0-1 baseado na distância da pista
        // Assumindo que uma volta completa tem aproximadamente 200 unidades
        const estimatedLapDistance = 200;
        const progress = Math.min(totalDistance / estimatedLapDistance, 0.99);
        
        return progress;
    }

    getSimpleProgress(player) {
        const playerPos = player.model.position;
        const startPos = this.trackManager.trackData.startPosition;
        
        // Usar coordenadas relativas para calcular progresso
        const dx = playerPos.x - startPos.x;
        const dz = playerPos.z - startPos.z;
        
        // Calcular ângulo e converter para progresso
        let angle = Math.atan2(dz, dx);
        if (angle < 0) angle += Math.PI * 2;
        
        const progress = angle / (Math.PI * 2);
        
        console.log(`P${player.playerNumber}: x=${playerPos.x.toFixed(1)}, z=${playerPos.z.toFixed(1)}, angle=${angle.toFixed(2)}, progress=${progress.toFixed(3)}`);
        
        return progress;
    }

    

    // Método simplificado para detectar volta completa
    detectLapCompletion(player) {
        const progress = this.lapProgress.get(player);
        const currentProgress = this.getRealTrackProgress(player);
        
        // Se progresso atual é baixo (0-0.1) e último progresso era alto (0.9-1.0)
        if (currentProgress < 0.1 && progress.lastRealProgress > 0.9) {
            progress.currentLap++;
            console.log(`🏁 Jogador ${player.playerNumber} completou volta ${progress.currentLap - 1}! Progresso: ${currentProgress.toFixed(3)}`);
        }
        
        progress.lastRealProgress = currentProgress;
        progress.trackProgress = currentProgress;
        
        return currentProgress;
    }

    // Sistema de ordenação com verificação cruzada
    getPlayerPositions() {
        if (this.players.length < 2) return [0];

        const p1Progress = this.lapProgress.get(this.players[0]);
        const p2Progress = this.lapProgress.get(this.players[1]);
        
        if (!p1Progress || !p2Progress) return [0, 1];

        // Debug detalhado
        console.log('\n🏁 === ANÁLISE DE POSIÇÕES ===');
        console.log('📊 Dados brutos:');
        console.log(`P1: Volta ${p1Progress.currentLap}, Progresso ${p1Progress.trackProgress.toFixed(3)}`);
        console.log(`P2: Volta ${p2Progress.currentLap}, Progresso ${p2Progress.trackProgress.toFixed(3)}`);
        console.log('\n🧮 Progresso total:');
        console.log(`P1: ${p1Progress.totalProgress.toFixed(3)} voltas (${p1Progress.currentLap - 1} + ${p1Progress.trackProgress.toFixed(3)})`);
        console.log(`P2: ${p2Progress.totalProgress.toFixed(3)} voltas (${p2Progress.currentLap - 1} + ${p2Progress.trackProgress.toFixed(3)})`);
        
        // Diferença entre os jogadores
        const difference = Math.abs(p1Progress.totalProgress - p2Progress.totalProgress);
        
        // Se a diferença for muito pequena, usar distância como desempate
        if (difference < 0.05) {
            const p1Dist = this.players[0].model.position.distanceTo(this.trackManager.trackData.startPosition);
            const p2Dist = this.players[1].model.position.distanceTo(this.trackManager.trackData.startPosition);
            
            // Se um jogador está próximo da linha e tem progresso baixo, ele está na frente
            if (p1Dist < 15 && p1Progress.trackProgress < 0.15 && p2Progress.trackProgress > 0.85) {
                return [0, 1];
            }
            if (p2Dist < 15 && p2Progress.trackProgress < 0.15 && p1Progress.trackProgress > 0.85) {
                return [1, 0];
            }
            
            console.log('\n🤝 DESEMPATE POR DISTÂNCIA:');
            console.log(`P1 dist: ${p1Dist.toFixed(1)}`);
            console.log(`P2 dist: ${p2Dist.toFixed(1)}`);
            
            const result = p1Dist < p2Dist ? [0, 1] : [1, 0];
            const leader = result[0] === 0 ? 'P1' : 'P2';
            console.log(`Vencedor do desempate: ${leader} (mais próximo da linha)`);
            return result;
        }
        
        // Caso normal: quem tem maior progresso total está na frente
        const result = p1Progress.totalProgress > p2Progress.totalProgress ? [0, 1] : [1, 0];
        const leader = result[0] === 0 ? 'P1' : 'P2';
        console.log(`\n🏆 RESULTADO: ${leader} na frente por ${difference.toFixed(3)} voltas`);
        
        return result;
    }




    
    
    // HUD mais simples e funcional
    updateHUD() {
        if (!this.hudElement || !this.players[0]) return;

         // DEBUG - adicione esta linha
            this.debugPlayerPositions();
        
        const player1Progress = this.lapProgress.get(this.players[0]);
        if (!player1Progress) return;
        
        // Obter posições
        const positionOrder = this.getPlayerPositions();
        
        const player1Position = positionOrder.indexOf(0) + 1;
        const player2Position = this.players.length > 1 ? positionOrder.indexOf(1) + 1 : 2;
        
        const debugInfo = this.controlsActive ? '🟢 ATIVO' : '🔴 INATIVO';
        const lapProgressPercent = Math.floor((player1Progress.trackProgress || 0) * 100);
        
        // Informações de posição para debug
        const p1Pos = this.players[0].model.position;
        const startPos = this.trackManager.trackData.startPosition;
        const p1Dist = p1Pos.distanceTo(startPos);
        
        // Legendas dos controlos
        let controlsLegend = '';
        if (this.players.length > 1 && !this.gameState.isSinglePlayer) {
            controlsLegend = `<div><strong>Player 1:</strong> WAD / V </div><div><strong>Player 2:</strong> Setas ↑←→ / Espaço</div>`;
        } else {
            controlsLegend = `<div><strong>Player 1:</strong> Setas ↑←→ / Espaço</div><div><strong>IA:</strong> 🤖 Automático</div>`;
        }
        this.hudElement.innerHTML = `
            <div style="font-size: 18px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 24px;">🏁</span>
                    <span style="margin-left: 8px;"><strong>Volta:</strong> ${player1Progress.currentLap}/${this.lapCount}</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 24px;">📍</span>
                    <span style="margin-left: 8px;"><strong>Progresso:</strong> ${lapProgressPercent}%</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 24px;">⏱️</span>
                    <span style="margin-left: 8px;"><strong>Tempo:</strong> ${Math.floor(this.raceTime)}s</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 24px;">🏆</span>
                    <span style="margin-left: 8px;"><strong>Posição:</strong> ${player1Position}º</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 24px;">🎮</span>
                    <span style="margin-left: 8px;"><strong>Controles:</strong> ${debugInfo}</span>
                </div>
                <div style="font-size: 10px; color: #000; background: rgba(255,255,0,0.8); padding: 3px; border-radius: 3px; margin: 2px 0;">
                    P1: Lap=${player1Progress.currentLap}, Track=${(player1Progress.trackProgress || 0).toFixed(3)}, Total=${(player1Progress.totalProgress || 0).toFixed(3)}
                    <br>Pos: (${p1Pos.x.toFixed(1)}, ${p1Pos.z.toFixed(1)}), Dist: ${p1Dist.toFixed(1)}
                </div>
                <hr style="margin: 10px 0; border: 1px solid #FF69B4;">
                <div style="font-size: 14px;">
                    ${controlsLegend}
                    <div><strong>Alterar perspetiva:</strong> C</div>
                </div>
            </div>
        `;
        
        // HUD Player 2 com debug similar
        if (this.players.length > 1 && this.hudElementP2 && !this.gameState.isSinglePlayer) {
            const player2Progress = this.lapProgress.get(this.players[1]);
            if (player2Progress) {
                const lapProgressPercent2 = Math.floor((player2Progress.trackProgress || 0) * 100);
                const p2Pos = this.players[1].model.position;
                const p2Dist = p2Pos.distanceTo(startPos);
                let controlsLegend2 = `<div><strong>Player 2:</strong> Setas ↑←→ / Espaço</div><div><strong>Player 1:</strong> WAD / V</div>`;
                this.hudElementP2.innerHTML = `
                    <div style="font-size: 18px;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 24px;">🏁</span>
                            <span style="margin-left: 8px;"><strong>Volta:</strong> ${player2Progress.currentLap}/${this.lapCount}</span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 24px;">📍</span>
                            <span style="margin-left: 8px;"><strong>Progresso:</strong> ${lapProgressPercent2}%</span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 24px;">⏱️</span>
                            <span style="margin-left: 8px;"><strong>Tempo:</strong> ${Math.floor(this.raceTime)}s</span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 24px;">🏆</span>
                            <span style="margin-left: 8px;"><strong>Posição:</strong> ${player2Position}º</span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 24px;">🎮</span>
                            <span style="margin-left: 8px;"><strong>Controles:</strong> ${debugInfo}</span>
                        </div>
                        <div style="font-size: 10px; color: #000; background: rgba(255,255,0,0.8); padding: 3px; border-radius: 3px; margin: 2px 0;">
                            P2: Lap=${player2Progress.currentLap}, Track=${(player2Progress.trackProgress || 0).toFixed(3)}, Total=${(player2Progress.totalProgress || 0).toFixed(3)}
                            <br>Pos: (${p2Pos.x.toFixed(1)}, ${p2Pos.z.toFixed(1)}), Dist: ${p2Dist.toFixed(1)}
                        </div>
                        <hr style="margin: 10px 0; border: 1px solid #FF69B4;">
                        <div style="font-size: 14px;">
                            ${controlsLegend2}
                            <div><strong>Alterar perspetiva:</strong>C</div>
                        </div>
                    </div>
                `;
            }
        }
    }
    
    // Reseta todos os elementos e estado da corrida, limpando a cena e o DOM.
    resetRace() {
        this.raceStarted = false;
        this.raceFinished = false;
        this.countdownStarted = false;
        this.raceTime = 0;
        this.controlsActive = false;
        this.winner = null;
        this.finishTime = 0;
        this.raceResults = [];
        this._raceLoopActive = false;
        this._raceLoopRunning = false;
        this.isPaused = false;
        this._openedHelpFromPause = false;
        
        // Clean up wrong way signs for all players
        this.players.forEach(player => {
            const signId = `wrong-way-sign-p${player.playerNumber}`;
            const sign = document.getElementById(signId);
            if (sign) {
                sign.remove();
            }
        });
        
        // Remove wrong way animation style if it exists
        const wrongWayStyle = document.getElementById('wrong-way-style');
        if (wrongWayStyle) {
            wrongWayStyle.remove();
        }
        
        // Parar todas as músicas
        if (this.raceAudio) {
            this.raceAudio.pause();
            this.raceAudio.currentTime = 0;
            this.raceAudio = null;
        }
        if (this.victoryAudio) {
            this.victoryAudio.pause();
            this.victoryAudio.currentTime = 0;
            this.victoryAudio = null;
        }
        
        this.removeOldListeners();
        
        // LIMPEZA DAS CÂMERAS
        this.cameraController = null;
        this.cameraControllerP1 = null;
        this.cameraControllerP2 = null;
        
        // Resto da limpeza...
        this.players.forEach(player => {
            if (player && player.model) window.scene.remove(player.model);
        });
        
        if (this.countdownPlane) window.scene.remove(this.countdownPlane);
        
        if (this.powerUpSystem && this.powerUpSystem.powerUps) {
            this.powerUpSystem.powerUps.forEach(powerUp => {
                window.scene.remove(powerUp);
            });
        }
        
        if (this.obstacleSystem && this.obstacleSystem.obstacles) {
            this.obstacleSystem.obstacles.forEach(obstacle => {
                window.scene.remove(obstacle);
            });
        }
        
        // Limpeza do DOM
        if (this.hudElement && document.body.contains(this.hudElement)) document.body.removeChild(this.hudElement);
        if (this.hudElementP2 && document.body.contains(this.hudElementP2)) document.body.removeChild(this.hudElementP2);
        if (this.victoryScreen && document.body.contains(this.victoryScreen)) document.body.removeChild(this.victoryScreen);
        if (this.pausePopup && document.body.contains(this.pausePopup)) document.body.removeChild(this.pausePopup);
        if (this.labelP1 && document.body.contains(this.labelP1)) document.body.removeChild(this.labelP1);
        if (this.labelP2 && document.body.contains(this.labelP2)) document.body.removeChild(this.labelP2);
        if (this.splitBar && document.body.contains(this.splitBar)) document.body.removeChild(this.splitBar);
        
        // Reset das variáveis
        this.hudElement = null;
        this.hudElementP2 = null;
        this.victoryScreen = null;
        this.pausePopup = null;
        this.labelP1 = null;
        this.labelP2 = null;
        this.splitBar = null;
        this.players = [];
        this.lapProgress.clear();
        
        if (this.powerUpSystem) {
            this.powerUpSystem.dispose();
            this.powerUpSystem = null;
        }
        
        if (this.obstacleSystem) {
            this.obstacleSystem.dispose();
            this.obstacleSystem = null;
        }
        
        //  Reset da câmera P2
        window.cameraP2 = undefined;
        
        console.log('🔄 Corrida resetada');
    }

    // Pausa a corrida e mostra o pop-up de pausa.
    pauseGame() {
        if (!this.raceStarted || this.raceFinished) {
            console.log('[PAUSE] Ignorado: não está em corrida.');
            return;
        }
        if (this.isPaused) {
            console.log('[PAUSE] Já está pausado, ignorando.');
            return;
        }
        
        this.isPaused = true;
        this.controlsActive = false;
        this._raceLoopRunning = false;
        
        // Pausar a música da corrida
        if (this.raceAudio) {
            this.raceAudio.pause();
        }
        
        console.log('[PAUSE] Jogo pausado, mostrando pop-up.');
        if (!this.pausePopup) this.showPausePopup();
    }
    
    // Retoma a corrida após pausa.
    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.controlsActive = true;
        
        // Retomar a música da corrida
        if (this.raceAudio) {
            this.raceAudio.play().catch(() => {});
        }
        
        if (this.pausePopup) {
            document.body.removeChild(this.pausePopup);
            this.pausePopup = null;
        }
        this.startRaceLoop();
    }
    
    // Mostra o pop-up de pausa com opções (continuar, desistir, ajuda, recomeçar).
    showPausePopup() {
        // Criar overlay
        this.pausePopup = document.createElement('div');
        this.pausePopup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(20, 20, 40, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 20000;
            font-family: 'Fredoka', Arial, sans-serif;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            border-radius: 20px;
            padding: 40px 60px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            border: 4px solid #ff66c4;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        box.innerHTML = `
            <div style="font-size: 36px; color: #fff; margin-bottom: 30px; text-shadow: 2px 2px 8px #7366ff;">
                <span style='font-size:32px;vertical-align:middle;'>⏸</span> Jogo em Pausa
            </div>
        `;
        // Botão Continuar
        const btnContinue = document.createElement('button');
        btnContinue.textContent = 'Continuar';
        btnContinue.style.cssText = `
            background: linear-gradient(135deg, #ff66c4, #7366ff);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 22px;
            font-family: 'Fredoka', Arial, sans-serif;
            font-weight: bold;
            border-radius: 25px;
            cursor: pointer;
            margin: 10px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        btnContinue.onclick = () => this.resumeGame();
        // Botão Começar de Novo
        const btnRestart = document.createElement('button');
        btnRestart.textContent = 'Começar de Novo';
        btnRestart.style.cssText = btnContinue.style.cssText + 'background: linear-gradient(135deg, #66ff99, #7366ff);';
        btnRestart.onclick = () => {
            if (this.pausePopup) {
                document.body.removeChild(this.pausePopup);
                this.pausePopup = null;
            }
            this.restartRace();
        };
        // Botão Desistir
        const btnQuit = document.createElement('button');
        btnQuit.textContent = 'Desistir';
        btnQuit.style.cssText = btnContinue.style.cssText + 'background: linear-gradient(135deg, #ff6666, #ff1493);';
        btnQuit.onclick = () => {
            if (this.pausePopup) {
                document.body.removeChild(this.pausePopup);
                this.pausePopup = null;
            }
            // Parar áudio de fundo ao desistir
            if (this.raceAudio) {
                this.raceAudio.pause();
                this.raceAudio.currentTime = 0;
            }
            window.gameManager.resetGame();
        };
        // Botão Ajuda
        const btnHelp = document.createElement('button');
        btnHelp.textContent = 'Ajuda';
        btnHelp.style.cssText = btnContinue.style.cssText + 'background: linear-gradient(135deg, #1a1a2e, #7366ff);';
        btnHelp.onclick = () => {
            this._openedHelpFromPause = true;
            if (this.pausePopup) {
                document.body.removeChild(this.pausePopup);
                this.pausePopup = null;
            }
            window.gameManager.showHelp(() => {
                // callback para voltar do help
                this.showPausePopup();
                this._openedHelpFromPause = false;
            });
        };
        // Botão Definições (substitui Luzes)
        const btnSettings = document.createElement('button');
        btnSettings.textContent = 'Definições';
        btnSettings.style.cssText = btnContinue.style.cssText + 'background: linear-gradient(135deg, #ffe066, #ff66c4);';
        btnSettings.onclick = () => {
            if (this.pausePopup) {
                document.body.removeChild(this.pausePopup);
                this.pausePopup = null;
            }
            this.showSettingsPopup();
        };
        // Adicionar botões na nova ordem
        box.appendChild(btnContinue);
        box.appendChild(btnRestart);
        box.appendChild(btnSettings);
        box.appendChild(btnHelp);
        box.appendChild(btnQuit);
        this.pausePopup.appendChild(box);
        document.body.appendChild(this.pausePopup);
    }

    // Reinicia a corrida do zero, após um pequeno delay para garantir limpeza.
    restartRace() {
        this.resetRace();
        if (this.pausePopup && document.body.contains(this.pausePopup)) {
            document.body.removeChild(this.pausePopup);
            this.pausePopup = null;
        }
        setTimeout(() => {
            this.initRace();
        }, 100);
    }

    // Adiciona ou remove o sinal de proibido pulsante
    showWrongWaySign(show, player) {
        const signId = `wrong-way-sign-p${player.playerNumber}`;
        let sign = document.getElementById(signId);
        
        if (show) {
            if (!sign) {
                sign = document.createElement('div');
                sign.id = signId;
                sign.innerHTML = `
                    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="90" cy="90" r="80" stroke="#FF3333" stroke-width="20" fill="none"/>
                      <line x1="45" y1="135" x2="135" y2="45" stroke="#FF3333" stroke-width="20" stroke-linecap="round"/>
                    </svg>
                `;

                // Posicionamento baseado no número do jogador e modo de jogo
                const isMultiplayer = this.players.length > 1 && !this.gameState.isSinglePlayer;
                const isP1 = player.playerNumber === 1;

                sign.style.cssText = `
                    position: fixed;
                    top: 50%;
                    ${isMultiplayer ? (isP1 ? 'left: 25%' : 'left: 75%') : 'left: 50%'};
                    transform: translate(-50%, -50%);
                    width: 180px;
                    height: 180px;
                    z-index: 10001;
                    pointer-events: none;
                    animation: pulseWrongWay 1s infinite;
                    background: none;
                `;
                document.body.appendChild(sign);

                // Adiciona a animação CSS se ainda não existir
                if (!document.getElementById('wrong-way-style')) {
                    const style = document.createElement('style');
                    style.id = 'wrong-way-style';
                    style.textContent = `
                        @keyframes pulseWrongWay {
                            0% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
                            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2);}
                            100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1);}
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        } else if (sign) {
            sign.remove();
        }
    }

    // Novo: Mostra painel para ligar/desligar luzes
    showLightsPopup() {
        // Criar overlay
        const lightsPopup = document.createElement('div');
        lightsPopup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(20, 20, 40, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 20001;
            font-family: 'Fredoka', Arial, sans-serif;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            background: linear-gradient(135deg, #ffe066, #ff66c4);
            border-radius: 20px;
            padding: 40px 60px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            border: 4px solid #ff66c4;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        // Procurar luzes na cena
        const findLight = (type) => {
            let lights = [];
            // Procurar na cena principal
            window.scene.children.forEach(obj => {
                if (obj.type === type) lights.push(obj);
            });
            // Procurar no HouseWorld
            if (window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
                const houseWorld = window.scene.getObjectByName('HouseWorld');
                houseWorld.children.forEach(obj => {
                    if (obj.type === type) lights.push(obj);
                });
            }
            return lights;
        };

        // Obter todas as luzes
        const ambientLights = findLight('AmbientLight');
        const pointLights = findLight('PointLight');
        const directionalLights = findLight('DirectionalLight');
        let neonLights = [];
        if (window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
            const houseWorld = window.scene.getObjectByName('HouseWorld');
            neonLights = houseWorld.children.filter(obj => obj.type === 'SpotLight');
        }
        // Ler preferências
        const getPref = (key, def) => {
            const v = localStorage.getItem(key);
            return v !== null ? (v === 'true' ? true : v === 'false' ? false : parseFloat(v)) : def;
        };
        let ambient = getPref('catdash_light_ambient', ambientLights.length > 0 ? ambientLights[0].intensity : 0.4);
        let point = getPref('catdash_light_point', pointLights.length > 0 ? pointLights[0].intensity : 1.0);
        let neon = getPref('catdash_light_neon', neonLights.length > 0 ? neonLights[0].intensity : 2.5);
        let neonMode = getPref('catdash_light_neon_mode', false);
        // HTML dos botões
        box.innerHTML = `
            <style>
            @keyframes lamp-blink {
                0%, 100% { color: #ffe066; filter: drop-shadow(0 0 8px #ffe06688); }
                50% { color: #fffbe6; filter: drop-shadow(0 0 18px #ffe066cc); }
            }
            .light-slider-label {
                font-size: 20px;
                display: flex;
                align-items: center;
                margin-bottom: 26px;
                gap: 18px;
                justify-content: flex-start;
                width: 100%;
                letter-spacing: 0.5px;
            }
            .light-slider {
                width: 160px;
                accent-color: #ff66c4;
                background: linear-gradient(90deg, #ffe066 0%, #ff66c4 100%);
                border-radius: 8px;
                height: 7px;
                outline: none;
                box-shadow: 0 2px 8px #ff66c488;
                transition: background 0.3s;
            }
            .light-slider::-webkit-slider-thumb {
                background: linear-gradient(135deg, #ffe066, #ff66c4);
                border-radius: 50%;
                width: 22px;
                height: 22px;
                border: 2px solid #ff66c4;
                box-shadow: 0 2px 12px #ff66c4cc, 0 0 0 4px #fffbe633;
                transition: box-shadow 0.2s;
            }
            .light-slider:active::-webkit-slider-thumb {
                box-shadow: 0 2px 18px #ff66c4, 0 0 0 8px #ffe06655;
            }
            .light-slider::-moz-range-thumb {
                background: linear-gradient(135deg, #ffe066, #ff66c4);
                border-radius: 50%;
                width: 22px;
                height: 22px;
                border: 2px solid #ff66c4;
                box-shadow: 0 2px 12px #ff66c4cc, 0 0 0 4px #fffbe633;
                transition: box-shadow 0.2s;
            }
            .light-slider:active::-moz-range-thumb {
                box-shadow: 0 2px 18px #ff66c4, 0 0 0 8px #ffe06655;
            }
            .light-slider-value {
                min-width: 36px;
                font-size: 20px;
                font-weight: bold;
                text-align: right;
                margin-left: 6px;
                color: #ffe066 !important;
                text-shadow: 0 0 8px #ffe06688;
            }
            .light-icon {
                font-size: 28px;
                margin-right: 6px;
                animation: lamp-blink 2.5s infinite;
                filter: drop-shadow(0 0 8px #ffe06688);
            }
            .light-icon-pink { color: #ff66c4; filter: drop-shadow(0 0 8px #ff66c4aa); }
            #lights-back-btn {
                background: linear-gradient(135deg, #ff66c4, #7366ff);
                color: white;
                border: none;
                padding: 14px 38px;
                font-size: 22px;
                font-family: 'Fredoka', Arial, sans-serif;
                font-weight: bold;
                border-radius: 20px;
                cursor: pointer;
                margin-top: 18px;
                box-shadow: 0 5px 15px #ff66c4aa;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            #lights-back-btn:hover {
                transform: translateY(-2px) scale(1.04);
                box-shadow: 0 7px 24px #7366ffcc;
                background: linear-gradient(135deg, #ffe066, #ff66c4);
                color: #333;
            }
            .neon-btn-on { background: linear-gradient(135deg, #00ffff, #ff66c4, #66ff66, #9966ff); color: #fff; box-shadow: 0 0 18px #00ffff99, 0 0 24px #ff66c499; }
            .neon-btn-off { background: linear-gradient(135deg, #ffe066, #ff66c4); color: #333; }
            </style>
            <div style="font-size: 36px; color: #333; margin-bottom: 36px; text-shadow: 2px 2px 8px #ffe066; display: flex; align-items: center; gap: 12px;">
                <span class="light-icon"></span>
                <span>Definições</span>
            </div>
            <div style="margin-bottom: 18px; width: 100%;">
                <div class="light-slider-label">
                    <span class="light-icon"></span>
                    Luz Ambiente (AmbientLight)
                    <input id="ambient-slider" class="light-slider" type="range" min="0" max="2" step="0.01" value="${ambient}">
                    <span id="ambient-light-value" class="light-slider-value">${ambient.toFixed(2)}</span>
                </div>
                <div class="light-slider-label">
                    <span class="light-icon light-icon-pink"></span>
                    Luz Principal da Sala (PointLight)
                    <input id="point-slider" class="light-slider" type="range" min="0" max="2" step="0.01" value="${point}">
                    <span id="point-light-value" class="light-slider-value">${point.toFixed(2)}</span>
                </div>
                <div class="light-slider-label">
                    <span class="light-icon" style="color:#00ffff; filter: drop-shadow(0 0 8px #00ffffaa);"></span>
                    Intensidade Neon
                    <input id="neon-slider" class="light-slider" type="range" min="0" max="5" step="0.01" value="${neon}">
                    <span id="neon-light-value" class="light-slider-value">${neon.toFixed(2)}</span>
                </div>
                <div class="light-slider-label">
                    <span class="light-icon" style="color:#00ffff; filter: drop-shadow(0 0 8px #00ffffaa);"></span>
                    <button id="neon-mode-btn" class="${neonMode ? 'neon-btn-on' : 'neon-btn-off'}" style="font-size:20px; padding:10px 32px; border-radius:16px; border:none; margin-left:12px; cursor:pointer; font-weight:bold;">Modo Neon: ${neonMode ? 'ON' : 'OFF'}</button>
                </div>
            </div>
            <button id="lights-back-btn">Voltar</button>
        `;
        lightsPopup.appendChild(box);
        document.body.appendChild(lightsPopup);
        // Referências aos valores
        const ambientValue = lightsPopup.querySelector('#ambient-light-value');
        const pointValue = lightsPopup.querySelector('#point-light-value');
        const ambientSlider = lightsPopup.querySelector('#ambient-slider');
        const pointSlider = lightsPopup.querySelector('#point-slider');
        const neonSlider = lightsPopup.querySelector('#neon-slider');
        const neonValue = lightsPopup.querySelector('#neon-light-value');
        const neonBtn = lightsPopup.querySelector('#neon-mode-btn');
        // Sliders para controlar intensidade
        if (ambientLights.length > 0 && ambientSlider) {
            ambientSlider.addEventListener('input', () => {
                ambientLights.forEach(light => light.intensity = parseFloat(ambientSlider.value));
                ambientValue.textContent = ambientLights[0].intensity.toFixed(2);
                localStorage.setItem('catdash_light_ambient', ambientSlider.value);
            });
            }
        if (pointLights.length > 0 && pointSlider) {
            pointSlider.addEventListener('input', () => {
                pointLights.forEach(light => light.intensity = parseFloat(pointSlider.value));
                pointValue.textContent = pointLights[0].intensity.toFixed(2);
                localStorage.setItem('catdash_light_point', pointSlider.value);
            });
        }
        if (neonSlider && neonLights.length > 0) {
            neonSlider.addEventListener('input', () => {
                neonLights.forEach(light => light.intensity = neonMode ? parseFloat(neonSlider.value) : 0);
                neonValue.textContent = parseFloat(neonSlider.value).toFixed(2);
                localStorage.setItem('catdash_light_neon', neonSlider.value);
            });
        }
        function setNeonMode(on) {
            neonMode = on;
            neonBtn.textContent = 'Modo Neon: ' + (on ? 'ON' : 'OFF');
            neonBtn.className = on ? 'neon-btn-on' : 'neon-btn-off';
            localStorage.setItem('catdash_light_neon_mode', on);
            updateSlidersForNeonMode(on);

            // Aplicar imediatamente
            const neonLights = [];
            if (window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
                const houseWorld = window.scene.getObjectByName('HouseWorld');
                neonLights.push(...houseWorld.children.filter(obj => obj.type === 'SpotLight'));
            }

            // Atualizar luzes neon
            if (neonLights.length > 0) {
                neonLights.forEach(light => light.intensity = on ? 2.5 : 0);
            }

            // Desligar todas as DirectionalLights quando o modo neon está ativo
            const directionalLights = findLight('DirectionalLight');
            directionalLights.forEach(light => {
                light.intensity = on ? 0 : parseFloat(directionalSlider.value);
            });

            // Salvar valores
            localStorage.setItem('catdash_light_neon', on ? 2.5 : 0);
        }
        neonBtn.onclick = () => setNeonMode(!neonMode);
        // Estado inicial
        setNeonMode(neonMode);
        // Botão voltar
        const backBtn = lightsPopup.querySelector('#lights-back-btn');
        backBtn.onclick = () => {
            document.body.removeChild(lightsPopup);
            this.showPausePopup();
        };
    }

    showSettingsPopup() {
        // Preferências salvas
        const getPref = (key, def) => {
            const v = localStorage.getItem(key);
            return v !== null ? (v === 'true' ? true : v === 'false' ? false : parseFloat(v)) : def;
        };

        // Procurar luzes na cena
        const findLight = (type) => {
            let lights = [];
            // Procurar na cena principal
            window.scene.children.forEach(obj => {
                if (obj.type === type) lights.push(obj);
            });
            // Procurar no HouseWorld
            if (window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
                const houseWorld = window.scene.getObjectByName('HouseWorld');
                houseWorld.children.forEach(obj => {
                    if (obj.type === type) lights.push(obj);
                });
            }
            return lights;
        };

        // Obter todas as luzes
        const ambientLights = findLight('AmbientLight');
        const pointLights = findLight('PointLight');
        const directionalLights = findLight('DirectionalLight');
        let neonLights = [];
        if (window.scene.getObjectByName && window.scene.getObjectByName('HouseWorld')) {
            const houseWorld = window.scene.getObjectByName('HouseWorld');
            neonLights = houseWorld.children.filter(obj => obj.type === 'SpotLight');
        }

        let ambient = getPref('catdash_light_ambient', ambientLights.length > 0 ? ambientLights[0].intensity : 0.4);
        let point = getPref('catdash_light_point', pointLights.length > 0 ? pointLights[0].intensity : 1.0);
        let neon = getPref('catdash_light_neon', 2.5);
        let neonMode = getPref('catdash_light_neon_mode', false);
        let directional = getPref('catdash_light_directional', directionalLights.length > 0 ? directionalLights[0].intensity : 1.0);

        // Criar overlay
        const settingsPopup = document.createElement('div');
        settingsPopup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(20, 20, 40, 0.85);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 20001;
            font-family: 'Fredoka', Arial, sans-serif;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            background: linear-gradient(135deg, #ffe066, #ff66c4);
            border-radius: 20px;
            padding: 40px 60px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            border: 4px solid #ff66c4;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        box.innerHTML = `
            <style>
            @keyframes lamp-blink {
                0%, 100% { color: #ffe066; filter: drop-shadow(0 0 8px #ffe06688); }
                50% { color: #fffbe6; filter: drop-shadow(0 0 18px #ffe066cc); }
            }
            .light-slider-label {
                font-size: 20px;
                display: flex;
                align-items: center;
                margin-bottom: 26px;
                gap: 18px;
                justify-content: flex-start;
                width: 100%;
                letter-spacing: 0.5px;
            }
            .light-slider {
                width: 160px;
                accent-color: #ff66c4;
                background: linear-gradient(90deg, #ffe066 0%, #ff66c4 100%);
                border-radius: 8px;
                height: 7px;
                outline: none;
                box-shadow: 0 2px 8px #ff66c488;
                transition: background 0.3s;
            }
            .light-slider::-webkit-slider-thumb {
                background: linear-gradient(135deg, #ffe066, #ff66c4);
                border-radius: 50%;
                width: 22px;
                height: 22px;
                border: 2px solid #ff66c4;
                box-shadow: 0 2px 12px #ff66c4cc, 0 0 0 4px #fffbe633;
                transition: box-shadow 0.2s;
            }
            .light-slider:active::-webkit-slider-thumb {
                box-shadow: 0 2px 18px #ff66c4, 0 0 0 8px #ffe06655;
            }
            .light-slider::-moz-range-thumb {
                background: linear-gradient(135deg, #ffe066, #ff66c4);
                border-radius: 50%;
                width: 22px;
                height: 22px;
                border: 2px solid #ff66c4;
                box-shadow: 0 2px 12px #ff66c4cc, 0 0 0 4px #fffbe633;
                transition: box-shadow 0.2s;
            }
            .light-slider:active::-moz-range-thumb {
                box-shadow: 0 2px 18px #ff66c4, 0 0 0 8px #ffe06655;
            }
            .light-slider-value {
                min-width: 36px;
                font-size: 20px;
                font-weight: bold;
                text-align: right;
                margin-left: 6px;
                color: #ffe066 !important;
                text-shadow: 0 0 8px #ffe06688;
            }
            .light-icon {
                font-size: 28px;
                margin-right: 6px;
                animation: lamp-blink 2.5s infinite;
                filter: drop-shadow(0 0 8px #ffe06688);
            }
            .light-icon-pink { color: #ff66c4; filter: drop-shadow(0 0 8px #ff66c4aa); }
            .neon-btn-on { background: linear-gradient(135deg, #00ffff, #ff66c4, #66ff66, #9966ff); color: #fff; box-shadow: 0 0 18px #00ffff99, 0 0 24px #ff66c499; }
            .neon-btn-off { background: linear-gradient(135deg, #ffe066, #ff66c4); color: #333; }
            #settings-back-btn {
                background: linear-gradient(135deg, #ff66c4, #7366ff);
                color: white;
                border: none;
                padding: 14px 38px;
                font-size: 22px;
                font-family: 'Fredoka', Arial, sans-serif;
                font-weight: bold;
                border-radius: 20px;
                cursor: pointer;
                margin-top: 18px;
                box-shadow: 0 5px 15px #ff66c4aa;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            #settings-back-btn:hover {
                transform: translateY(-2px) scale(1.04);
                box-shadow: 0 7px 24px #7366ffcc;
                background: linear-gradient(135deg, #ffe066, #ff66c4);
                color: #333;
            }
            </style>
            <div style="font-size: 36px; color: #333; margin-bottom: 36px; text-shadow: 2px 2px 8px #ffe066; display: flex; align-items: center; gap: 12px;">
                <span class="light-icon"></span>
                <span>Definições</span>
            </div>
            <div style="margin-bottom: 18px; width: 100%;">
                <div class="light-slider-label">
                    <span class="light-icon"></span>
                    Luz Ambiente (AmbientLight)
                    <input id="ambient-slider" class="light-slider" type="range" min="0" max="2" step="0.01" value="${ambient}">
                    <span id="ambient-light-value" class="light-slider-value">${ambient.toFixed(2)}</span>
                </div>
                <div class="light-slider-label">
                    <span class="light-icon light-icon-pink"></span>
                    Luz Principal da Sala (PointLight)
                    <input id="point-slider" class="light-slider" type="range" min="0" max="2" step="0.01" value="${point}">
                    <span id="point-light-value" class="light-slider-value">${point.toFixed(2)}</span>
                </div>
                <div class="light-slider-label">
                    <span class="light-icon" style="color:#ffdd00; filter: drop-shadow(0 0 8px #ffdd00aa);"></span>
                    Luz Solar (DirectionalLight)
                    <input id="directional-slider" class="light-slider" type="range" min="0" max="2" step="0.01" value="${directional}">
                    <span id="directional-light-value" class="light-slider-value">${directional.toFixed(2)}</span>
                </div>
                <div class="light-slider-label">
                    <span class="light-icon" style="color:#00ffff; filter: drop-shadow(0 0 8px #00ffffaa);"></span>
                    <button id="neon-mode-btn" class="${neonMode ? 'neon-btn-on' : 'neon-btn-off'}" style="font-size:20px; padding:10px 32px; border-radius:16px; border:none; margin-left:12px; cursor:pointer; font-weight:bold;">Modo Neon: ${neonMode ? 'ON' : 'OFF'}</button>
                </div>
            </div>
            <div class="light-slider-label" style="margin-bottom: 24px;">
                <span class="light-icon" style="color:#7366ff;"></span>
                Volume da Música
                <input id="music-volume-slider" class="light-slider" type="range" min="0" max="1" step="0.01">
                <span id="music-volume-value" class="light-slider-value"></span>
            </div>
            <button id="settings-back-btn">Voltar</button>
        `;

        settingsPopup.appendChild(box);
        document.body.appendChild(settingsPopup);

        // Sliders e botões
        const ambientSlider = box.querySelector('#ambient-slider');
        const ambientValue = box.querySelector('#ambient-light-value');
        const pointSlider = box.querySelector('#point-slider');
        const pointValue = box.querySelector('#point-light-value');
        const directionalSlider = box.querySelector('#directional-slider');
        const directionalValue = box.querySelector('#directional-light-value');
        const neonBtn = box.querySelector('#neon-mode-btn');

        // Função para atualizar sliders conforme modo neon
        function updateSlidersForNeonMode(on) {
            if (on) {
                ambientSlider.disabled = true;
                pointSlider.disabled = true;
                directionalSlider.disabled = true;
                ambientSlider.value = 0.25;
                pointSlider.value = 0;
                directionalSlider.value = 0;
                ambientValue.textContent = '0.25';
                pointValue.textContent = '0.00';
                directionalValue.textContent = '0.00';

                // Aplicar valores imediatamente
                ambientLights.forEach(light => light.intensity = 0.25);
                pointLights.forEach(light => light.intensity = 0);
                directionalLights.forEach(light => light.intensity = 0);
            } else {
                ambientSlider.disabled = false;
                pointSlider.disabled = false;
                directionalSlider.disabled = false;
                ambientSlider.value = localStorage.getItem('catdash_light_ambient') || 0.4;
                pointSlider.value = localStorage.getItem('catdash_light_point') || 1.0;
                directionalSlider.value = localStorage.getItem('catdash_light_directional') || 1.0;
                ambientValue.textContent = parseFloat(ambientSlider.value).toFixed(2);
                pointValue.textContent = parseFloat(pointSlider.value).toFixed(2);
                directionalValue.textContent = parseFloat(directionalSlider.value).toFixed(2);

                // Aplicar valores imediatamente
                ambientLights.forEach(light => light.intensity = parseFloat(ambientSlider.value));
                pointLights.forEach(light => light.intensity = parseFloat(pointSlider.value));
                directionalLights.forEach(light => light.intensity = parseFloat(directionalSlider.value));
            }
        }

        // Inicial
        updateSlidersForNeonMode(neonMode);

        // Sliders para controlar intensidade
        ambientSlider.addEventListener('input', () => {
            ambientLights.forEach(light => {
                light.intensity = parseFloat(ambientSlider.value);
            });
            ambientValue.textContent = parseFloat(ambientSlider.value).toFixed(2);
            localStorage.setItem('catdash_light_ambient', ambientSlider.value);
        });

        pointSlider.addEventListener('input', () => {
            pointLights.forEach(light => {
                light.intensity = parseFloat(pointSlider.value);
            });
            pointValue.textContent = parseFloat(pointSlider.value).toFixed(2);
            localStorage.setItem('catdash_light_point', pointSlider.value);
        });

        directionalSlider.addEventListener('input', () => {
            directionalLights.forEach(light => {
                light.intensity = parseFloat(directionalSlider.value);
            });
            directionalValue.textContent = parseFloat(directionalSlider.value).toFixed(2);
            localStorage.setItem('catdash_light_directional', directionalSlider.value);
        });

        function setNeonMode(on) {
            neonMode = on;
            neonBtn.textContent = 'Modo Neon: ' + (on ? 'ON' : 'OFF');
            neonBtn.className = on ? 'neon-btn-on' : 'neon-btn-off';
            localStorage.setItem('catdash_light_neon_mode', on);
            updateSlidersForNeonMode(on);

            // Atualizar luzes neon
            if (neonLights.length > 0) {
                neonLights.forEach(light => light.intensity = on ? 2.5 : 0);
            }

            // Desligar todas as DirectionalLights quando o modo neon está ativo
            directionalLights.forEach(light => {
                light.intensity = on ? 0 : parseFloat(directionalSlider.value);
            });

            // Salvar valores
            localStorage.setItem('catdash_light_neon', on ? 2.5 : 0);
        }

        neonBtn.onclick = () => setNeonMode(!neonMode);

        // Estado inicial
        setNeonMode(neonMode);

        // Slider de volume
        const slider = box.querySelector('#music-volume-slider');
        const valueSpan = box.querySelector('#music-volume-value');
        let currentVolume = 0.5;
        if (localStorage.getItem('catdash_music_volume')) {
            currentVolume = parseFloat(localStorage.getItem('catdash_music_volume'));
        } else if (this.raceAudio) {
            currentVolume = this.raceAudio.volume;
        }
        slider.value = currentVolume;
        valueSpan.textContent = Math.round(currentVolume * 100) + '%';

        slider.addEventListener('input', () => {
            const v = parseFloat(slider.value);
            valueSpan.textContent = Math.round(v * 100) + '%';
            if (window.gameManager && window.gameManager.menuAudio) window.gameManager.menuAudio.volume = v;
            if (this.raceAudio) this.raceAudio.volume = v;
            if (this.victoryAudio) this.victoryAudio.volume = v;
            localStorage.setItem('catdash_music_volume', v);
        });

        // Botão voltar
        box.querySelector('#settings-back-btn').onclick = () => {
            document.body.removeChild(settingsPopup);
            this.showPausePopup();
        };
    }
}