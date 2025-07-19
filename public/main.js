// main.js - Arquivo principal de inicialização
import { GameManager } from './js/game/GameManager.js';
import { DOMManager } from './js/ui/DOMManager.js';
import { EventManager } from './js/ui/EventManager.js';
import { SceneManager } from './js/graphics/SceneManager.js';


// Variáveis globais
window.scene = null;
window.camera = null;
window.renderer = null;
window.animationFrame = null;
window.gameManager = null;

// Função chamada quando o DOM está pronto. Inicializa todos os sistemas principais do jogo.
document.addEventListener('DOMContentLoaded', function() {
    console.log('Documento carregado');
    
    // Inicializar gerenciadores
    window.domManager = new DOMManager();
    window.sceneManager = new SceneManager();
    window.eventManager = new EventManager();
    window.gameManager = new GameManager();
    
    // Inicializar Three.js
    initializeApplication();
});

// Função assíncrona que inicializa a aplicação, cena 3D, eventos e animação.
async function initializeApplication() {
    try {
        // Inicializar cena 3D
        await window.sceneManager.initThreeJS();

        
        // Configurar event listeners
        window.eventManager.setupEventListeners();
        
        // Iniciar loop de animação
        animate();
        
        console.log('Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
}

// Loop de animação principal do jogo. Renderiza a cena e gere split-screen se necessário.
function animate() {
    window.animationFrame = requestAnimationFrame(animate);
    
    if (window.renderer && window.scene && window.camera) {
        // Split-screen só se houver dois jogadores
        const isSplitScreen = (
            typeof window.cameraP2 !== 'undefined' &&
            window.cameraP2 !== null &&
            window.gameManager.activeRaceSystem &&
            window.gameManager.activeRaceSystem.players &&
            window.gameManager.activeRaceSystem.players.length === 2 &&
            window.gameManager.gameState &&
            window.gameManager.gameState.isSinglePlayer === false
        );
        if (isSplitScreen) {
            // Split-screen lado a lado
            const w = window.innerWidth;
            const h = window.innerHeight;
            window.renderer.setScissorTest(true);
            // Player 1 - esquerda
            window.renderer.setViewport(0, 0, w / 2, h);
            window.renderer.setScissor(0, 0, w / 2, h);
            window.renderer.render(window.scene, window.camera);
            // Player 2 - direita
            window.renderer.setViewport(w / 2, 0, w / 2, h);
            window.renderer.setScissor(w / 2, 0, w / 2, h);
            window.renderer.render(window.scene, window.cameraP2);
            window.renderer.setScissorTest(false);
        } else {
            window.renderer.render(window.scene, window.camera);
        }
    }
}

// Evento para ajustar a câmara e o renderer ao redimensionar a janela.
window.addEventListener('resize', () => {
    if (window.camera && window.renderer) {
        window.camera.aspect = window.innerWidth / window.innerHeight;
        window.camera.updateProjectionMatrix();
        window.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});