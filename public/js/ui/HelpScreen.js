// js/ui/HelpScreen.js - Tela de ajuda fofa com explicação dos power-ups
export class HelpScreen {
    constructor() {
        this.helpScreen = null;
        this.powerUps = {
            SPEED_BOOST: {
                name: '⚡ Turbo',
                description: 'Aumenta a velocidade e aceleração do gato em 50% por 3 segundos!',
                color: '#ffff00',
                icon: '⚡'
            },
            SHIELD: {
                name: '🛡️ Escudo',
                description: 'Protege o gato de obstáculos e colisões por 5 segundos!',
                color: '#00ffff',
                icon: '🛡️'
            },
            GHOST: {
                name: '👻 Fantasma',
                description: 'O gato fica transparente e pode atravessar obstáculos por 4 segundos!',
                color: '#ff00ff',
                icon: '👻'
            },
            MEGA_JUMP: {
                name: '🦘 Super Salto',
                description: 'Permite que o gato salte 50% mais alto por 2 segundos!',
                color: '#00ff00',
                icon: '🦘'
            },
            CATNIP: {
                name: '🌿 Erva-gateira',
                description: 'Aumenta a velocidade em 30% mas torna o controle mais difícil por 3.5 segundos!',
                color: '#90ee90',
                icon: '🌿'
            }
        };
    }

    show(onBack) {
        // Criar container da tela de ajuda
        this.helpScreen = document.createElement('div');
        this.helpScreen.className = 'help-screen';
        this.helpScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Fredoka', Arial, sans-serif;
            animation: fadeIn 0.5s ease-in-out;
        `;

        // Estilos
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .help-content {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                border: 3px solid #ff66c4;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }
            .help-title {
                font-size: 48px;
                color: #fff;
                text-align: center;
                margin-bottom: 30px;
                text-shadow: 3px 3px 0px #ff66c4, 6px 6px 0px #7366ff;
            }
            .power-up-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                padding: 20px;
            }
            .power-up-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(5px);
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                border: 3px solid;
                transition: transform 0.3s;
                animation: float 3s infinite ease-in-out;
            }
            .power-up-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }
            .power-up-icon {
                font-size: 40px;
                text-align: center;
                margin-bottom: 10px;
            }
            .power-up-name {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 10px;
                color: #fff;
            }
            .power-up-description {
                font-size: 16px;
                color: #e0e0e0;
                text-align: center;
                line-height: 1.4;
            }
            .help-button {
                background: linear-gradient(135deg, #ff66c4, #7366ff);
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 20px;
                font-family: 'Fredoka', Arial, sans-serif;
                font-weight: bold;
                border-radius: 25px;
                cursor: pointer;
                margin-top: 30px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .help-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
            }
            .paw-decoration {
                position: absolute;
                font-size: 30px;
                animation: float 3s infinite ease-in-out;
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
            }
        `;
        document.head.appendChild(style);

        // Conteúdo da ajuda
        const helpContent = document.createElement('div');
        helpContent.className = 'help-content';
        
        helpContent.innerHTML = `
            <div class="help-title">🐱 Power-ups do Cat Dash! 🐱</div>
            <div class="power-up-grid">
                ${Object.entries(this.powerUps).map(([key, powerUp]) => `
                    <div class="power-up-card" style="border-color: ${powerUp.color}">
                        <div class="power-up-icon">${powerUp.icon}</div>
                        <div class="power-up-name">${powerUp.name}</div>
                        <div class="power-up-description">${powerUp.description}</div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center;">
                <button class="help-button" id="help-back-btn">
                    ← Voltar
                </button>
            </div>
        `;

        // Adicionar decorações de patas
        for (let i = 0; i < 8; i++) {
            const paw = document.createElement('div');
            paw.className = 'paw-decoration';
            paw.textContent = '🐾';
            paw.style.top = Math.random() * 80 + 10 + '%';
            paw.style.left = Math.random() * 80 + 10 + '%';
            paw.style.animationDelay = Math.random() * 2 + 's';
            helpContent.appendChild(paw);
        }

        this.helpScreen.appendChild(helpContent);
        document.body.appendChild(this.helpScreen);

        // Botão voltar
        const backBtn = this.helpScreen.querySelector('#help-back-btn');
        backBtn.onclick = () => {
            this.hide();
            if (typeof onBack === 'function') {
                onBack();
            } else {
                window.gameManager.hideHelp();
            }
        };

        const helpBtn = document.getElementById('help-button');
        if (!helpBtn) {
            // Criar botão de ajuda do zero se não existir
            const menuPanel = document.querySelector('#start-screen .menu-panel');
            if (menuPanel) {
                const newBtn = document.createElement('button');
                newBtn.id = 'help-button';
                newBtn.className = 'button help-button';
                newBtn.textContent = 'AJUDA';
                newBtn.onclick = () => window.gameManager.showHelp();
                menuPanel.appendChild(newBtn);
            }
        } else {
            // Garante que o texto é exatamente 'AJUDA' sem espaços extras
            helpBtn.textContent = 'AJUDA';
            helpBtn.className = 'button help-button';
        }
    }

    hide() {
        if (this.helpScreen) {
            document.body.removeChild(this.helpScreen);
            this.helpScreen = null;
        }
        // Restaurar botão de ajuda na tela inicial, se existir
        const helpBtn = document.getElementById('help-button');
        if (helpBtn) {
            // Garante que o texto é exatamente 'AJUDA' sem espaços extras
            helpBtn.textContent = 'AJUDA';
            helpBtn.className = 'button help-button';
        }
    }
} 