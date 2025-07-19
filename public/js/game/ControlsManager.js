// js/game/ControlsManager.js - Gerenciador de controles do jogo
export class ControlsManager {
    constructor() {
        this.gameControlsActive = false;
        this.keyHandler = null;
        this.instructionsElement = null;
    }
    
    // Adiciona os controlos do jogo (teclado) e mostra instruções temporárias.
    addGameControls() {
        this.gameControlsActive = true;
        
        this.keyHandler = (event) => {
            if (!this.gameControlsActive) return;
            
            if (event.key === 'Escape') {
                if (!window.gameManager.activeRaceSystem || !window.gameManager.activeRaceSystem.raceStarted) {
                    this.removeGameControls();
                    window.gameManager.resetGame();
                }
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
        this.showInstructions();
    }
    
    // Remove os controlos do jogo (teclado) e esconde instruções.
    removeGameControls() {
        this.gameControlsActive = false;
        
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        
        this.hideInstructions();
    }
    
    // Mostra as instruções dos controlos no ecrã durante alguns segundos.
    showInstructions() {
        if (!this.instructionsElement) {
            this.createInstructionsElement();
        }
        
        this.instructionsElement.style.display = 'block';
        
        setTimeout(() => {
            this.hideInstructions();
        }, 5000);
    }
    
    hideInstructions() {
        if (this.instructionsElement) {
            this.instructionsElement.style.display = 'none';
        }
    }
    
    // Cria o elemento DOM com as instruções dos controlos.
    createInstructionsElement() {
        const instructions = document.createElement('div');
        instructions.className = 'game-instructions';
        instructions.style.position = 'absolute';
        instructions.style.bottom = '10px';
        instructions.style.left = '10px';
        instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        instructions.style.color = 'white';
        instructions.style.padding = '15px';
        instructions.style.borderRadius = '5px';
        instructions.style.fontFamily = 'Fredoka, Arial, sans-serif';
        instructions.style.zIndex = '1000';
        
        instructions.innerHTML = `
            <h3>Controles:</h3>
            <p>Player 1: Setas para mover</p>
            <p>Player 2: WASD para mover</p>
            <p>C: Alternar câmera</p>
            <p>ESC: Voltar ao menu</p>
            <br>
            <p><strong>Complete 2 voltas para vencer!</strong></p>
        `;
        
        document.body.appendChild(instructions);
        this.instructionsElement = instructions;
    }
}