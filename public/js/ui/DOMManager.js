// js/ui/DOMManager.js - Gerenciador de elementos DOM
export class DOMManager {
    // Construtor da classe DOMManager. Inicializa referências aos elementos do DOM.
    constructor() {
        this.initializeElements();
    }
    
    // Inicializa as referências aos elementos das várias telas e botões do jogo.
    initializeElements() {
        // Telas
        this.startScreen = document.getElementById('start-screen');
        this.menuScreen = document.getElementById('menu-screen');
        this.singlePlayerPanel = document.getElementById('singlePlayerPanel');
        this.multiPlayerPanel = document.getElementById('multiPlayerPanel');
        this.trackSelectionPanel = document.getElementById('trackSelectionPanel');
        this.gameContainer = document.getElementById('game-container');
        this.loadingText = document.getElementById('loading-text');

        // Botões principais
        this.playButton = document.getElementById('play-button');
        this.onePlayerButton = document.getElementById('one-player-button');
        this.twoPlayersButton = document.getElementById('two-players-button');
        this.backButton = document.getElementById('back-button');
        this.singlePlayerSelectButton = document.getElementById('singlePlayerSelectButton');
        this.backToPlayerSelectionButton = document.getElementById('backToPlayerSelectionButton');
        this.multiPlayerSelectButton = document.getElementById('multiPlayerSelectButton');
        this.backFromMultiplayerButton = document.getElementById('backFromMultiplayerButton');
        this.trackSelectButton = document.getElementById('trackSelectButton');
        this.backToCharacterSelectionButton = document.getElementById('backToCharacterSelectionButton');
        this.helpButton = document.getElementById('help-button');
        this.settingsButton = document.getElementById('settings-button');
    }
    
    // Mostra apenas a tela recebida como argumento, escondendo as outras.
    showScreen(screenToShow) {
        console.log('Mudando para tela:', screenToShow.id);
        
        // Esconder todas as telas
        this.startScreen.classList.add('hidden');
        this.menuScreen.classList.add('hidden');
        this.singlePlayerPanel.classList.add('hidden');
        this.multiPlayerPanel.classList.add('hidden');
        this.trackSelectionPanel.classList.add('hidden');
        this.gameContainer.classList.add('hidden');
        
        // Mostrar tela desejada
        screenToShow.classList.remove('hidden');
    }
    
    // Métodos auxiliares para mostrar cada tela específica.
    showStartScreen() { this.showScreen(this.startScreen); if (window.gameManager) window.gameManager.showMenuMusic(); }
    showMenuScreen() { this.showScreen(this.menuScreen); if (window.gameManager) window.gameManager.showMenuMusic(); }
    showSinglePlayerPanel() { this.showScreen(this.singlePlayerPanel); if (window.gameManager) window.gameManager.showMenuMusic(); }
    showMultiPlayerPanel() { this.showScreen(this.multiPlayerPanel); if (window.gameManager) window.gameManager.showMenuMusic(); }
    showTrackSelectionPanel() { this.showScreen(this.trackSelectionPanel); if (window.gameManager) window.gameManager.showMenuMusic(); }
    showGameContainer() { this.showScreen(this.gameContainer); }
    
    // Controle de loading
    showLoading(text = 'Carregando...') {
        this.loadingText.classList.add('show');
        this.loadingText.textContent = text;
    }
    
    hideLoading() {
        this.loadingText.classList.remove('show');
    }

    // Adicionar método para mostrar popup de definições global
    showSettingsPopupGlobal() {
        if (window.gameManager && window.gameManager.activeRaceSystem && typeof window.gameManager.activeRaceSystem.showSettingsPopup === 'function') {
            window.gameManager.activeRaceSystem.showSettingsPopup();
        } else if (window.gameManager && typeof window.gameManager.showSettingsPopup === 'function') {
            window.gameManager.showSettingsPopup();
        } else {
            // Fallback: criar popup mínimo
            alert('Definições não disponíveis!');
        }
    }
}

// Adicionar event listener ao botão de definições na tela inicial
if (document.getElementById('settings-button')) {
    document.getElementById('settings-button').onclick = function() {
        if (window.domManager && typeof window.domManager.showSettingsPopupGlobal === 'function') {
            window.domManager.showSettingsPopupGlobal();
        }
    };
}