// js/ui/EventManager.js - Gerenciador de eventos de UI
import { CharacterManager } from './CharacterManager.js';
import { TrackSelectionManager } from './TrackSelectionManager.js';

export class EventManager {
    constructor() {
        this.characterManager = new CharacterManager();
        this.trackSelectionManager = new TrackSelectionManager();
    }
    
    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        this.setupStartScreenEvents();
        this.setupMainMenuEvents();
        this.setupCharacterSelectionEvents();
        this.setupTrackSelectionEvents();
        this.setupNavigationEvents();
        this.setupGameEvents();
    }
    
    setupStartScreenEvents() {
        window.domManager.helpButton.addEventListener('click', () => {
            console.log('Botão AJUDA clicado');
            window.gameManager.showHelp();
        });
    }
    
    setupMainMenuEvents() {
        window.domManager.playButton.addEventListener('click', () => {
            console.log('Botão JOGAR clicado');
            window.domManager.showMenuScreen();
        });
        
        window.domManager.onePlayerButton.addEventListener('click', () => {
            console.log('Botão 1 JOGADOR clicado');
            window.gameManager.gameState.isSinglePlayer = true;
            window.domManager.showSinglePlayerPanel();
        });
        
        window.domManager.twoPlayersButton.addEventListener('click', () => {
            console.log('Botão 2 JOGADORES clicado');
            window.gameManager.gameState.isSinglePlayer = false;
            window.domManager.showMultiPlayerPanel();
        });
    }
    
    setupNavigationEvents() {
        window.domManager.backButton.addEventListener('click', () => {
            console.log('Botão VOLTAR clicado');
            window.domManager.showStartScreen();
        });
        
        window.domManager.backToPlayerSelectionButton.addEventListener('click', () => {
            console.log('Botão VOLTAR da seleção clicado');
            window.domManager.showMenuScreen();
        });
        
        window.domManager.backFromMultiplayerButton.addEventListener('click', () => {
            console.log('Voltando do multiplayer para menu principal');
            window.domManager.showMenuScreen();
        });
        
        window.domManager.backToCharacterSelectionButton.addEventListener('click', () => {
            console.log('Voltando para seleção de personagem');
            if (window.gameManager.gameState.isSinglePlayer) {
                window.domManager.showSinglePlayerPanel();
            } else {
                window.domManager.showMultiPlayerPanel();
            }
        });
    }
    
    setupCharacterSelectionEvents() {
        window.domManager.singlePlayerSelectButton.addEventListener('click', () => {
            if (window.gameManager.gameState.player1Character) {
                console.log('Personagem selecionado:', window.gameManager.gameState.player1Character);
                window.domManager.showTrackSelectionPanel();
            } else {
                alert('Por favor, selecione um personagem primeiro!');
            }
        });
        
        window.domManager.multiPlayerSelectButton.addEventListener('click', () => {
            if (window.gameManager.gameState.player1Character && window.gameManager.gameState.player2Character) {
                console.log('Personagens selecionados P1:', window.gameManager.gameState.player1Character, 'P2:', window.gameManager.gameState.player2Character);
                window.domManager.showTrackSelectionPanel();
            } else {
                alert('Por favor, ambos os jogadores precisam selecionar um personagem!');
            }
        });
        
        this.characterManager.setupCharacterSelection();
    }
    
    setupTrackSelectionEvents() {
        window.domManager.trackSelectButton.addEventListener('click', async () => {
            if (window.gameManager.gameState.selectedTrack) {
                console.log('Iniciando jogo com pista:', window.gameManager.gameState.selectedTrack);
                await window.gameManager.startGame();
            } else {
                alert('Por favor, selecione uma pista primeiro!');
            }
        });
        
        this.trackSelectionManager.setupTrackSelection();
    }
    
    setupGameEvents() {
        // Implemente a lógica para configurar eventos do jogo
    }
}