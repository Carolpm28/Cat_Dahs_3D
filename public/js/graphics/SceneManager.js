// js/graphics/SceneManager.js - Gerenciador da cena 3D

export class SceneManager {
    // Construtor da classe SceneManager. (Pode ser usado para inicializações futuras)
    constructor() {}

    // Inicializa o Three.js, cria a cena, renderer e chama setupLighting.
    async initThreeJS() {
        console.log('Inicializando Three.js...');
        
        window.scene = new THREE.Scene();
        window.scene.background = new THREE.Color(0x111133);
        
        window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        window.camera.position.z = 15;
        window.camera.position.y = 3;
        
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            throw new Error('Canvas não encontrado!');
        }
        
        window.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        window.renderer.setSize(window.innerWidth, window.innerHeight);
        window.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Habilitar sombras
        window.renderer.shadowMap.enabled = true;
        window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.setupLighting();
        this.createDecorations();
        
        console.log('Three.js inicializado com sucesso');
    }
    
    // Configura as luzes principais da cena (ambiente e direcional).
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        window.scene.add(ambientLight);
    }
    
    // Cria decorações visuais na cena (grelha e estrelas).
    createDecorations() {
        const gridHelper = new THREE.GridHelper(100, 50, 0xff66c4, 0x7366ff);
        gridHelper.position.y = -5;
        window.scene.add(gridHelper);
        
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
        });
        
        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = THREE.MathUtils.randFloatSpread(100);
            const y = THREE.MathUtils.randFloatSpread(100);
            const z = THREE.MathUtils.randFloatSpread(100);
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        window.scene.add(stars);
    }
    
    // Inicializa a cena do jogo, limpando elementos antigos e configurando luzes e fundo.
    async initGameScene() {
        console.log('Inicializando cena do jogo...');
        
        // Limpar cena
        const elementsToKeep = [];
        window.scene.children.forEach(child => {
            if (child.type !== 'AmbientLight') {
                elementsToKeep.push(child);
            }
        });
        
        elementsToKeep.forEach(element => {
            window.scene.remove(element);
        });
        
        // Configurar cena
        window.scene.background = new THREE.Color(0x87CEEB);
        
        // Adicionar luzes se não existirem
        if (!window.scene.children.find(child => child.type === 'AmbientLight')) {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            window.scene.add(ambientLight);
        }
    }
}