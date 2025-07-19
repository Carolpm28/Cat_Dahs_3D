// js/game/GameManager.js - Gerenciador principal do jogo
import { TrackManager } from '../track/TrackManager.js';
import { RaceSystem } from '../race/RaceSystem.js';
import { ControlsManager } from './ControlsManager.js';
import { HelpScreen } from '../ui/HelpScreen.js';

export class GameManager {
    constructor() {
        this.gameState = {
            player1Character: null,
            player2Character: null,
            isSinglePlayer: false,
            selectedTrack: null,
            trackSize: 50
        };
        
        this.trackManager = new TrackManager();
        this.activeRaceSystem = null;
        this.controlsManager = new ControlsManager();
        this.helpScreen = new HelpScreen();
        this.menuAudio = null;
    }
    
    async startGame() {
        window.cameraP2 = undefined;
        console.log('Iniciando jogo...');
        window.domManager.showGameContainer();
        
        // Parar música do menu
        if (this.menuAudio) {
            this.menuAudio.pause();
            this.menuAudio.currentTime = 0;
        }
        
        window.domManager.showLoading('Preparando jogo...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        window.domManager.hideLoading();
        await this.initGameScene();
        
        this.activeRaceSystem = this.initRace();
    }
    
    async initGameScene() {
        console.log('Inicializando cena do jogo...');
        
        // Inicializar cena através do SceneManager
        await window.sceneManager.initGameScene();
        
        // Carregar pista
        await this.loadTrack();
    }
    
    async loadTrack() {    
        const selectedTrackId = this.gameState.selectedTrack || 'pista1';
        console.log('Carregando pista:', selectedTrackId);
            
        try {
            await this.trackManager.loadTrack(selectedTrackId);
            this.controlsManager.addGameControls();
        } catch (error) {
            console.error('Erro no carregamento da pista:', error);
            this.controlsManager.addGameControls();
        }
    }
    
    initRace() {
        console.log('📍 Iniciando sistema de corrida...');
        const raceSystem = new RaceSystem(this.gameState, this.trackManager);
        raceSystem.initRace();
        return raceSystem;
    }
    
    resetGame() {
        // Parar músicas
        if (window.raceSystem) {
            if (window.raceSystem.raceAudio) {
                window.raceSystem.raceAudio.pause();
                window.raceSystem.raceAudio.currentTime = 0;
            }
            if (window.raceSystem.victoryAudio) {
                window.raceSystem.victoryAudio.pause();
                window.raceSystem.victoryAudio.currentTime = 0;
            }
        }

        window.cameraP2 = undefined;
        if (window.renderer) {
            window.renderer.setScissorTest(false);
            window.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        }
        if (this.activeRaceSystem) {
            this.activeRaceSystem.resetRace();
            this.activeRaceSystem = null;
        }
        
        this.controlsManager.removeGameControls();
        window.domManager.showStartScreen();
    }

    showHelp(onBack) {
        this.helpScreen.show(onBack);
    }

    hideHelp() {
        this.helpScreen.hide();
    }

    showMenuMusic() {
        console.log('🎵 Tentando tocar música do menu...');
        
        // Tocar música do menu se não estiver tocando
        let volume = 0.5;
        if (localStorage.getItem('catdash_music_volume')) {
            volume = parseFloat(localStorage.getItem('catdash_music_volume'));
            console.log('Volume carregado:', volume);
        }

        try {
            if (!this.menuAudio) {
                console.log('Criando novo objeto de áudio...');
                this.menuAudio = new Audio('assets/mix_inicio_cat_dash.mp3');
                this.menuAudio.loop = true;
                this.menuAudio.volume = volume;
                
                // Adicionar listeners para debug
                this.menuAudio.addEventListener('play', () => console.log('🎵 Música iniciou!'));
                this.menuAudio.addEventListener('error', (e) => console.error('❌ Erro ao tocar música:', e));
                this.menuAudio.addEventListener('canplay', () => console.log('✅ Música pronta para tocar'));
            }

            if (this.menuAudio.paused) {
                console.log('Tentando tocar música...');
                this.menuAudio.volume = volume;
                this.menuAudio.play().then(() => {
                    console.log('🎵 Música do menu tocando com sucesso!');
                }).catch((error) => {
                    console.warn('⚠️ Não foi possível tocar a música automaticamente:', error);
                    console.log('💡 Dica: Interaja com a página (clique/tecla) para permitir o áudio');
                });
            } else {
                console.log('Música já está tocando');
            }
        } catch (error) {
            console.error('❌ Erro ao configurar música:', error);
        }
    }

    showSettingsPopup() {
        // Preferências salvas
        const getPref = (key, def) => {
            const v = localStorage.getItem(key);
            return v !== null ? (v === 'true' ? true : v === 'false' ? false : parseFloat(v)) : def;
        };
        let ambient = getPref('catdash_light_ambient', 0.4);
        let point = getPref('catdash_light_point', 1.0);
        let neon = getPref('catdash_light_neon', 2.5);
        let neonMode = getPref('catdash_light_neon_mode', false);
        let directional = getPref('catdash_light_directional', 0.7); // Valor padrão para luz solar

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
                // Desabilitar sliders
                ambientSlider.disabled = true;
                pointSlider.disabled = true;
                directionalSlider.disabled = true;

                // Configurar valores fixos para modo neon
                ambientSlider.value = 0.15; // Reduzido de 0.25 para 0.15 para ficar mais escuro
                pointSlider.value = 0;
                directionalSlider.value = 0;
                ambientValue.textContent = '0.15';
                pointValue.textContent = '0.00';
                directionalValue.textContent = '0.00';

                // Aplicar valores imediatamente
                ambientLights.forEach(light => light.intensity = 0.15);
                pointLights.forEach(light => light.intensity = 0);
                directionalLights.forEach(light => light.intensity = 0);

                // Ativar luzes neon com intensidade alta
                if (neonLights.length > 0) {
                    neonLights.forEach(light => {
                        light.intensity = 3.5; // Aumentado para 3.5 para mais brilho
                        light.distance = 35;
                        light.decay = 2;
                        light.penumbra = 0.2;
                    });
                }

                // Salvar os valores do modo neon
                localStorage.setItem('catdash_light_ambient', '0.15');
                localStorage.setItem('catdash_light_point', '0');
                localStorage.setItem('catdash_light_directional', '0');
                localStorage.setItem('catdash_light_neon', '3.5');
            } else {
                // Reabilitar sliders
                ambientSlider.disabled = false;
                pointSlider.disabled = false;
                directionalSlider.disabled = false;

                // Restaurar valores salvos ou usar padrões
                const savedAmbient = localStorage.getItem('catdash_light_ambient') || 0.4;
                const savedPoint = localStorage.getItem('catdash_light_point') || 1.0;
                const savedDirectional = localStorage.getItem('catdash_light_directional') || 0.7;

                ambientSlider.value = savedAmbient;
                pointSlider.value = savedPoint;
                directionalSlider.value = savedDirectional;
                ambientValue.textContent = parseFloat(savedAmbient).toFixed(2);
                pointValue.textContent = parseFloat(savedPoint).toFixed(2);
                directionalValue.textContent = parseFloat(savedDirectional).toFixed(2);

                // Aplicar valores imediatamente
                ambientLights.forEach(light => light.intensity = parseFloat(savedAmbient));
                pointLights.forEach(light => light.intensity = parseFloat(savedPoint));
                directionalLights.forEach(light => light.intensity = parseFloat(savedDirectional));

                // Desativar luzes neon
                if (neonLights.length > 0) {
                    neonLights.forEach(light => {
                        light.intensity = 0;
                    });
                }
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
        } else if (this.menuAudio) {
            currentVolume = this.menuAudio.volume;
        }
        slider.value = currentVolume;
        valueSpan.textContent = Math.round(currentVolume * 100) + '%';

        slider.addEventListener('input', () => {
            const volume = parseFloat(slider.value);
            valueSpan.textContent = Math.round(volume * 100) + '%';
            localStorage.setItem('catdash_music_volume', volume);
            
            // Atualizar volume de todas as músicas
            if (this.menuAudio) this.menuAudio.volume = volume;
            if (window.raceSystem) {
                if (window.raceSystem.raceAudio) window.raceSystem.raceAudio.volume = volume;
                if (window.raceSystem.victoryAudio) window.raceSystem.victoryAudio.volume = volume;
            }
        });

        // Botão voltar
        const backBtn = box.querySelector('#settings-back-btn');
        backBtn.onclick = () => {
            document.body.removeChild(settingsPopup);
        };
    }

    setupTrackSelection() {
        const trackOptions = document.querySelectorAll('.track-option');
        const lapButtons = document.querySelectorAll('.lap-button');
        
        // Seleção de voltas
        lapButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover seleção anterior
                lapButtons.forEach(btn => btn.classList.remove('selected'));
                // Adicionar seleção atual
                button.classList.add('selected');
                // Salvar número de voltas
                this.gameState.lapCount = parseInt(button.dataset.laps);
                console.log('Número de voltas selecionado:', this.gameState.lapCount);
            });
        });

        trackOptions.forEach(option => {
            if (option.classList.contains('locked')) return; // Ignorar pistas bloqueadas
            
            option.addEventListener('click', () => {
                // Remover seleção anterior
                trackOptions.forEach(opt => opt.removeAttribute('data-selected'));
                
                // Adicionar seleção atual
                option.setAttribute('data-selected', 'true');
                
                // Salvar pista selecionada
                this.gameState.selectedTrack = option.dataset.track;
            });
        });
    }
}