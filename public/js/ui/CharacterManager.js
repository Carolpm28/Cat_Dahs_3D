// js/ui/CharacterManager.js - Gerenciador de seleção de personagens
import { catData } from '../data/GameData.js';

export class CharacterManager {
    constructor() {
        this.syncCharacterStats();
    }
    
    setupCharacterSelection() {
        const characterOptions = document.querySelectorAll('.character-option');
        
        characterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const player = option.dataset.player;
                
                if (!player) {
                    characterOptions.forEach(opt => {
                        if (!opt.dataset.player) {
                            opt.style.backgroundColor = '';
                        }
                    });
                    option.style.backgroundColor = 'rgba(144, 238, 144, 0.5)';
                    window.gameManager.gameState.player1Character = option.dataset.character;
                    this.updateCharacterPreview(window.gameManager.gameState.player1Character);
                } else {
                    document.querySelectorAll(`.character-option[data-player="${player}"]`).forEach(opt => {
                        opt.style.backgroundColor = '';
                    });
                    option.style.backgroundColor = 'rgba(144, 238, 144, 0.5)';
                    
                    if (player === "1") {
                        window.gameManager.gameState.player1Character = option.dataset.character;
                        this.updateCharacterPreview(window.gameManager.gameState.player1Character, "1");
                    } else {
                        window.gameManager.gameState.player2Character = option.dataset.character;
                        this.updateCharacterPreview(window.gameManager.gameState.player2Character, "2");
                    }
                }
            });
        });
    }
    
    updateCharacterPreview(characterName, playerNum = "") {
        const cat = catData[characterName];
        if (!cat) return;
        
        const idSuffix = playerNum ? `-p${playerNum}` : "";
        const featuredName = document.querySelector(`#featured-character${idSuffix} .featured-name`);
        const featuredImage = document.querySelector(`#featured-image${idSuffix}`);
        const speedBar = document.querySelector(`#speed-bar${idSuffix}`);
        const accelBar = document.querySelector(`#accel-bar${idSuffix}`);
        const handleBar = document.querySelector(`#handle-bar${idSuffix}`);
        
        if (featuredName) featuredName.textContent = cat.name;
        if (featuredImage) featuredImage.src = cat.image;
        
        if (speedBar) speedBar.style.setProperty('--stat-value', `${cat.speed * 20}%`);
        if (accelBar) accelBar.style.setProperty('--stat-value', `${cat.acceleration * 20}%`);
        if (handleBar) handleBar.style.setProperty('--stat-value', `${cat.handling * 20}%`);
    }
    
    syncCharacterStats() {
        const characterOptions = document.querySelectorAll('.character-option');
        
        characterOptions.forEach(option => {
            const characterName = option.dataset.character;
            const cat = catData[characterName];
            
            if (!cat) return;
            
            const statBars = option.querySelectorAll('.stat-bar');
            
            if (statBars.length >= 3) {
                statBars[0].style.setProperty('--stat-value', `${cat.speed * 20}%`);
                statBars[1].style.setProperty('--stat-value', `${cat.acceleration * 20}%`);
                statBars[2].style.setProperty('--stat-value', `${cat.handling * 20}%`);
            }
        });
    }
}