// js/ui/TrackSelectionManager.js - Gerenciador de seleção de pistas
export class TrackSelectionManager {
    setupTrackSelection() {
        this.setupTrackOptions();
        this.setupLapSelection();
    }

    setupTrackOptions() {
        const trackOptions = document.querySelectorAll('.track-option');
        
        trackOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Ignorar se a pista estiver bloqueada
                if (option.classList.contains('locked')) {
                    return;
                }
                
                // Remover seleção anterior
                trackOptions.forEach(opt => {
                    opt.removeAttribute('data-selected');
                    opt.style.transform = 'scale(1)';
                    opt.style.boxShadow = '';
                });
                
                // Adicionar seleção atual
                option.setAttribute('data-selected', 'true');
                option.style.transform = 'scale(1.05)';
                option.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
                
                // Atualizar estado do jogo
                window.gameManager.gameState.selectedTrack = option.dataset.track;
                console.log('Pista selecionada:', window.gameManager.gameState.selectedTrack);
            });
            
            // Efeitos de hover apenas para pistas não bloqueadas
            option.addEventListener('mouseenter', () => {
                if (!option.classList.contains('locked') && !option.hasAttribute('data-selected')) {
                    option.style.transform = 'scale(1.02)';
                }
            });
            
            option.addEventListener('mouseleave', () => {
                if (!option.classList.contains('locked') && !option.hasAttribute('data-selected')) {
                    option.style.transform = 'scale(1)';
                }
            });
        });
    }

    setupLapSelection() {
        const lapButtons = document.querySelectorAll('.lap-button');
        
        // Definir valor padrão de 10 voltas se não houver seleção
        if (!window.gameManager.gameState.lapCount) {
            window.gameManager.gameState.lapCount = 10;
        }
        
        lapButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover seleção anterior
                lapButtons.forEach(btn => btn.classList.remove('selected'));
                
                // Adicionar seleção atual
                button.classList.add('selected');
                
                // Atualizar estado do jogo
                window.gameManager.gameState.lapCount = parseInt(button.dataset.laps);
                console.log('Número de voltas selecionado:', window.gameManager.gameState.lapCount);
            });
        });
    }
}