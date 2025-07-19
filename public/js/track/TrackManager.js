// js/track/TrackManager.js - Corrida DENTRO da casa real
import { HouseDecorations } from './HouseDecorations.js';


export class TrackManager {
    constructor() {
        this.currentTrack = null;
        this.trackPath = null;
        this.checkpoints = [];
        this.trackData = null;
        this.trackBounds = [];
        this.trackWidth = 6;
        
        // Sistema de mundo da casa
        this.houseWorld = null;
        this.backgroundElements = [];
        
    }
    
    loadTrack(trackName) {
        console.log('📍 TrackManager.loadTrack chamado:', trackName);
        
        // Limpar pista atual se existir
        if (this.currentTrack) {
            window.scene.remove(this.currentTrack);
            this.checkpoints = [];
            this.trackBounds = [];
        }
        
        // Limpar mundo anterior
        this.clearHouseWorld();
        
        // Criar grupo para a nova pista
        this.currentTrack = new THREE.Group();
        
        // Criar mundo baseado na pista
        this.createHouseWorld(trackName);
        
        // Criar pista DENTRO do mundo
        this.createTrackInsideHouse();
        
        // Adicionar à cena
        window.scene.add(this.currentTrack);
        console.log('📍 Pista criada DENTRO da casa!');
        
        return this.currentTrack;
    }
    
    // ================================
    // CRIAR MUNDO DA CASA REAL
    // ================================
    
    createHouseWorld(trackName) {
        console.log('🏠 Criando mundo da casa onde a corrida acontece...');
        
        // Grupo do mundo da casa
        this.houseWorld = new THREE.Group();
        this.houseWorld.name = 'HouseWorld';
        
        // Criar o chão da casa usando a imagem
        this.createHouseFloorFromImage();
        
        // Criar paredes 3D da casa
        this.createHouse3DWalls();
        
        // Adicionar móveis 3D dentro da casa
        this.addHouseFurniture();
        
        // Configurar iluminação da casa
        this.setupHouseLighting();
        
        // Aplicar decorações temáticas de gatos (SEM EMOJI)
        // const decorations = new HouseDecorations(this.houseWorld);
        // decorations.decorate();
        
        // Adicionar o mundo à cena
        window.scene.add(this.houseWorld);
        this.backgroundElements.push(this.houseWorld);
        
        // =============================
        // OBJETOS 3D EXTRAS (PRIMITIVAS)
        // =============================
        // 1. Lâmpada de Teto (Lustre)
        {
            const lampGroup = new THREE.Group();
            // Globo da lâmpada
            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(2, 32, 32),
                new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffff99, emissiveIntensity: 1.2, roughness: 0.4 })
            );
            bulb.position.set(0, 15.5, -46); // Ajustado para nova altura do teto
            lampGroup.add(bulb);
            // Haste
            const rod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 2.5, 16),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 })
            );
            rod.position.set(0, 17, -46); // Ajustado para nova altura do teto
            lampGroup.add(rod);
            // Ajustar posição do grupo
            lampGroup.position.set(0, 0, 0);
            this.houseWorld.add(lampGroup);
        }
        // 2. Cubo Decorativo (Caixa de Brinquedos)
        {
            const loader = new THREE.TextureLoader();
            loader.load('assets/textura_caixabrinquedos.webp', texture => {
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(3, 3, 3),
                    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.2 })
                );
                box.position.set(-47, 1.5, 35); // y = metade da altura (3/2 = 1.5)
                box.castShadow = true;
                box.receiveShadow = true;
                this.houseWorld.add(box);
            });
        }
        // 3. Cone de Tráfego com textura
        {
            const loader = new THREE.TextureLoader();
            loader.load('assets/textura_cone.png', texture => {
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(1.5, 4, 32),
                    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 })
                );
                cone.position.set(47, 2, 35); // y = metade da altura (4/2 = 2)
                cone.castShadow = true;
                cone.receiveShadow = true;
                this.houseWorld.add(cone);
            });
        }
        // =============================
        // FIM OBJETOS 3D EXTRAS
        // =============================
        
        // Configurar ambiente
        window.scene.background = new THREE.Color(0x87CEEB); // Céu azul
        
        console.log('🏠 Mundo da casa criado! Pista será colocada dentro.');
    }
    

    
    // Criar chão da casa usando a imagem como textura
createHouseFloorFromImage() {
    console.log('🖼️ Criando chão de madeira da casa...');
    
    // Criar textura de madeira procedural
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Cor base da madeira
    ctx.fillStyle = '#614117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Adicionar tábuas de madeira
    ctx.strokeStyle = '#A0826D';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    // Adicionar veios da madeira
    for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = `rgba(139, 90, 43, ${0.1 + Math.random() * 0.2})`;
        ctx.lineWidth = Math.random() * 3;
        ctx.beginPath();
        const startY = Math.random() * canvas.height;
        ctx.moveTo(0, startY);
        
        for (let x = 0; x < canvas.width; x += 10) {
            const y = startY + Math.sin(x * 0.02) * 20 + (Math.random() - 0.5) * 10;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    const floorTexture = new THREE.CanvasTexture(canvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 6);
    
    const floorGeometry = new THREE.PlaneGeometry(100, 80);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const houseFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    houseFloor.rotation.x = -Math.PI / 2;
    houseFloor.position.set(0, -0.5, 0);
    houseFloor.receiveShadow = true;
    
    this.houseWorld.add(houseFloor);
    
    console.log('🏠 Chão de madeira criado!');
}
    

    // Criar paredes 3D da casa - AJUSTADAS PARA ALTURA DO TETO
    createHouse3DWalls() {
        const wallHeight = 18; // ⬆️ AUMENTADO de 12 para 18
        const floorY = -0.5; // Posição Y do chão
        const ceilingY = floorY + wallHeight + 10; // Posição Y do teto (de setupHouseLighting)
        const actualWallHeight = ceilingY - floorY; // Altura real da parede até o teto
        const wallThickness = 1;
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5DEB3, // Bege claro
            roughness: 0.9,
            metalness: 0.1
        });
        
        console.log(`🏗️ Criando paredes com altura ${actualWallHeight} (do chão até o teto)`);
        
        // Parede de fundo (Norte) - DO CHÃO ATÉ O TETO
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(100, actualWallHeight, wallThickness),
            wallMaterial
        );
        backWall.position.set(0, floorY + actualWallHeight/2, -40);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.houseWorld.add(backWall);
        
        // Parede frontal (Sul) - DO CHÃO ATÉ O TETO
        const frontWall = new THREE.Mesh(
            new THREE.BoxGeometry(100, actualWallHeight, wallThickness),
            wallMaterial
        );
        frontWall.position.set(0, floorY + actualWallHeight/2, 40);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.houseWorld.add(frontWall);
        
        // Parede esquerda (Oeste) - DO CHÃO ATÉ O TETO
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, actualWallHeight, 80),
            wallMaterial
        );
        leftWall.position.set(-50, floorY + actualWallHeight/2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.houseWorld.add(leftWall);
        
        // Parede direita (Leste) - DO CHÃO ATÉ O TETO
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, actualWallHeight, 80),
            wallMaterial
        );
        rightWall.position.set(50, floorY + actualWallHeight/2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.houseWorld.add(rightWall);
        
        // Rodapés para melhor conexão visual com o chão
        const skirting = new THREE.MeshStandardMaterial({
            color: 0x8B6F47, // Castanho mais escuro
            roughness: 0.9
        });
        
        // Rodapé parede de fundo
        const backSkirting = new THREE.Mesh(
            new THREE.BoxGeometry(100, 0.5, wallThickness + 0.2),
            skirting
        );
        backSkirting.position.set(0, floorY + 0.25, -40);
        this.houseWorld.add(backSkirting);
        
        // Rodapé paredes frontais
        const frontSkirtingLeft = new THREE.Mesh(
            new THREE.BoxGeometry(35, 0.5, wallThickness + 0.2),
            skirting
        );
        frontSkirtingLeft.position.set(-32.5, floorY + 0.25, 40);
        this.houseWorld.add(frontSkirtingLeft);
        
        const frontSkirtingRight = new THREE.Mesh(
            new THREE.BoxGeometry(35, 0.5, wallThickness + 0.2),
            skirting
        );
        frontSkirtingRight.position.set(32.5, floorY + 0.25, 40);
        this.houseWorld.add(frontSkirtingRight);
        
        // Rodapé paredes laterais
        const leftSkirting = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness + 0.2, 0.5, 80),
            skirting
        );
        leftSkirting.position.set(-50, floorY + 0.25, 0);
        this.houseWorld.add(leftSkirting);
        
        const rightSkirting = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness + 0.2, 0.5, 80),
            skirting
        );
        rightSkirting.position.set(50, floorY + 0.25, 0);
        this.houseWorld.add(rightSkirting);
        
        // Teto da casa - POSICIONADO CORRETAMENTE
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 80),
            new THREE.MeshStandardMaterial({ 
                color: 0xF0F0F0, 
                side: THREE.DoubleSide,
                roughness: 0.9
            })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, ceilingY, 0); // ⬆️ AGORA USA A POSIÇÃO CORRETA DO TETO
        ceiling.receiveShadow = true;
        this.houseWorld.add(ceiling);

        // Adicionar janelas MUITO GRANDES com textura - AJUSTADAS PARA NOVA ALTURA
        const loader = new THREE.TextureLoader();
        loader.load('assets/janela.jpg', texture => {
            // Janela 1 - parede esquerda (Oeste) - MUITO MAIOR E CENTRALIZADA
            const window1 = new THREE.Mesh(
                new THREE.PlaneGeometry(18, 12), // AINDA MAIOR: era 12x8, agora 18x12
                new THREE.MeshStandardMaterial({ 
                    map: texture, 
                    transparent: true,
                    opacity: 0.9 // Ligeiramente transparente para efeito realista
                })
            );
            window1.position.set(-50 + 0.6, floorY + actualWallHeight/2, 0); // CENTRALIZADA NA PAREDE
            window1.rotation.y = Math.PI / 2;
            this.houseWorld.add(window1);

            // Janela 2 - parede de fundo (Norte) - MUITO MAIOR E CENTRALIZADA
            const window2 = new THREE.Mesh(
                new THREE.PlaneGeometry(18, 12), // AINDA MAIOR: era 12x8, agora 18x12
                new THREE.MeshStandardMaterial({ 
                    map: texture, 
                    transparent: true,
                    opacity: 0.9 // Ligeiramente transparente para efeito realista
                })
            );
            window2.position.set(0, floorY + actualWallHeight/2, -40 - 0.6); // CENTRALIZADA NA PAREDE
            this.houseWorld.add(window2);

            // JANELA EXTRA 3 - parede direita (Leste) para mais luz natural
            const window3 = new THREE.Mesh(
                new THREE.PlaneGeometry(18, 12),
                new THREE.MeshStandardMaterial({ 
                    map: texture, 
                    transparent: true,
                    opacity: 0.9
                })
            );
            window3.position.set(50 - 0.6, floorY + actualWallHeight/2, 0);
            window3.rotation.y = -Math.PI / 2;
            this.houseWorld.add(window3);
        });

        console.log(`✅ Paredes criadas com altura total de ${actualWallHeight} unidades (do chão ao teto)`);
    }
    
    // Adicionar móveis 3D dentro da casa
    addHouseFurniture() {
        // Sofá na sala
        this.createSofa(new THREE.Vector3(-30, 0, -25));
        
        // Mesa de centro
        this.createCoffeeTable(new THREE.Vector3(-25, 0, -15));
        
        // TV na parede
        this.createTV(new THREE.Vector3(0, 4, -39));
        
        // Estante de livros
        this.createBookshelf(new THREE.Vector3(-45, 0, -35));
        
        // Mesa de jantar
        this.createDiningTable(new THREE.Vector3(25, 0, -20));
        
        // Geladeira
        this.createRefrigerator(new THREE.Vector3(40, 0, -30));
        
        // Potes de comida de gato (onde a pista vai passar!)
        this.createCatFoodBowls(new THREE.Vector3(35, 0, 10));
        
        // Arranhador de gato
        this.createScratchingPost(new THREE.Vector3(-35, 0, 15));
        
        // Plantas
        this.createHousePlants();
    }
    
    // Móveis individuais
    createSofa(position) {
        const sofaGroup = new THREE.Group();
        
        // Base do sofá
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1.5, 3),
            new THREE.MeshStandardMaterial({ color: 0x4169E1, roughness: 0.8 }) // Azul
        );
        base.position.set(0, 0.75, 0);
        base.castShadow = true;
        sofaGroup.add(base);
        
        // Encosto
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2.5, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x4169E1, roughness: 0.8 })
        );
        back.position.set(0, 2, -1.25);
        back.castShadow = true;
        sofaGroup.add(back);
        
        // Braços
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1, roughness: 0.8 });
        
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 3), armMaterial);
        leftArm.position.set(-3.75, 2, 0);
        leftArm.castShadow = true;
        sofaGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 3), armMaterial);
        rightArm.position.set(3.75, 2, 0);
        rightArm.castShadow = true;
        sofaGroup.add(rightArm);
        
        sofaGroup.position.copy(position);
        this.houseWorld.add(sofaGroup);
    }
    
    createCoffeeTable(position) {
        const tableGroup = new THREE.Group();
        
        // Tampo
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.2, 2),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 })
        );
        top.position.set(0, 1, 0);
        top.castShadow = true;
        tableGroup.add(top);
        
        // Pernas
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        const legPositions = [[-1.5, 0.5, -0.8], [1.5, 0.5, -0.8], [-1.5, 0.5, 0.8], [1.5, 0.5, 0.8]];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), legMaterial);
            leg.position.set(...pos);
            leg.castShadow = true;
            tableGroup.add(leg);
        });
        
        tableGroup.position.copy(position);
        this.houseWorld.add(tableGroup);
    }
    
    createTV(position) {
        const tvGroup = new THREE.Group();
        
        // Tela
        const screen = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 })
        );
        screen.castShadow = true;
        tvGroup.add(screen);
        
        // Moldura
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 4.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x2F2F2F, roughness: 0.3 })
        );
        frame.position.z = -0.2;
        frame.castShadow = true;
        tvGroup.add(frame);
        
        tvGroup.position.copy(position);
        this.houseWorld.add(tvGroup);
    }
    
    createBookshelf(position) {
        const shelfGroup = new THREE.Group();
        
        // Estrutura principal
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(4, 8, 1),
            new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
        );
        frame.position.set(0, 4, 0);
        frame.castShadow = true;
        shelfGroup.add(frame);
        
        // Prateleiras
        for (let i = 0; i < 4; i++) {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(3.8, 0.2, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
            );
            shelf.position.set(0, 1 + i * 1.8, 0.1);
            shelf.castShadow = true;
            shelfGroup.add(shelf);
        }
        
        shelfGroup.position.copy(position);
        this.houseWorld.add(shelfGroup);
    }
    
    createDiningTable(position) {
        const tableGroup = new THREE.Group();
        
        // Tampo da mesa
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.3, 4),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 })
        );
        top.position.set(0, 2, 0);
        top.castShadow = true;
        tableGroup.add(top);
        
        // Pernas
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        const legPositions = [[-2.5, 1, -1.5], [2.5, 1, -1.5], [-2.5, 1, 1.5], [2.5, 1, 1.5]];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 0.3), legMaterial);
            leg.position.set(...pos);
            leg.castShadow = true;
            tableGroup.add(leg);
        });
        
        tableGroup.position.copy(position);
        this.houseWorld.add(tableGroup);
    }
    
    createRefrigerator(position) {
        const fridgeGroup = new THREE.Group();
        
        // Corpo
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(3, 8, 2.5),
            new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.3, metalness: 0.7 })
        );
        body.position.set(0, 4, 0);
        body.castShadow = true;
        fridgeGroup.add(body);
        
        fridgeGroup.position.copy(position);
        this.houseWorld.add(fridgeGroup);
    }
    
    createCatFoodBowls(position) {
        const bowlGroup = new THREE.Group();
        
        // Pote de água
        const waterBowl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.4, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0x4169E1, roughness: 0.2 })
        );
        waterBowl.position.set(-1, 0.1, 0);
        waterBowl.castShadow = true;
        bowlGroup.add(waterBowl);
        
        // Pote de ração
        const foodBowl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.4, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0xFF6347, roughness: 0.2 })
        );
        foodBowl.position.set(1, 0.1, 0);
        foodBowl.castShadow = true;
        bowlGroup.add(foodBowl);
        
        bowlGroup.position.copy(position);
        this.houseWorld.add(bowlGroup);
    }
    
    createScratchingPost(position) {
        const postGroup = new THREE.Group();
        
        // Base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
        );
        base.position.set(0, 0.15, 0);
        base.castShadow = true;
        postGroup.add(base);
        
        // Poste
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 3, 16),
            new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.9 })
        );
        post.position.set(0, 1.8, 0);
        post.castShadow = true;
        postGroup.add(post);
        
        postGroup.position.copy(position);
        this.houseWorld.add(postGroup);
    }
    
    createHousePlants() {
        const plantPositions = [
            new THREE.Vector3(-40, 0, 25),
            new THREE.Vector3(45, 0, 20),
            new THREE.Vector3(-20, 0, 35)
        ];
        
        plantPositions.forEach(pos => {
            const plantGroup = new THREE.Group();
            
            // Vaso
            const pot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.6, 1, 16),
                new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
            );
            pot.position.set(0, 0.5, 0);
            pot.castShadow = true;
            plantGroup.add(pot);
            
            // Planta
            const plant = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 })
            );
            plant.position.set(0, 2, 0);
            plant.castShadow = true;
            plantGroup.add(plant);
            
            plantGroup.position.copy(pos);
            this.houseWorld.add(plantGroup);
        });
    }

    
    // Configurar iluminação da casa
    setupHouseLighting() {
        // Carregar preferências salvas
        const getPref = (key, def) => {
            const v = localStorage.getItem(key);
            return v !== null ? (v === 'true' ? true : v === 'false' ? false : parseFloat(v)) : def;
        };

        // Obter valores salvos
        const ambientIntensity = getPref('catdash_light_ambient', 0.4);
        const pointIntensity = getPref('catdash_light_point', 0.5);
        const directionalIntensity = getPref('catdash_light_directional', 0.7);
        const neonMode = getPref('catdash_light_neon_mode', false);
        const neonIntensity = getPref('catdash_light_neon', neonMode ? 2.5 : 0);

        // Luz ambiente suave
        const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
        this.houseWorld.add(ambientLight);
        
        // Luz principal da sala
        const mainLight = new THREE.PointLight(0xffffff, pointIntensity, 50);
        mainLight.position.set(0, 15, 0);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.houseWorld.add(mainLight);

        // DirectionalLight da janela esquerda
        const dirLightLeft = new THREE.DirectionalLight(0xffffff, neonMode ? 0 : directionalIntensity);
        dirLightLeft.position.set(-60, 25, 0);
        dirLightLeft.target.position.set(0, 0, 0);
        dirLightLeft.castShadow = true;
        this.houseWorld.add(dirLightLeft);
        this.houseWorld.add(dirLightLeft.target);

        // DirectionalLight da janela direita
        const dirLightRight = new THREE.DirectionalLight(0xffffff, neonMode ? 0 : directionalIntensity);
        dirLightRight.position.set(60, 25, 0);
        dirLightRight.target.position.set(0, 0, 0);
        dirLightRight.castShadow = true;
        this.houseWorld.add(dirLightRight);
        this.houseWorld.add(dirLightRight.target);

        // Luzes neon coloridas
        this.neonLights = [];
        const neonConfigs = [
            // Luzes originais melhoradas
            { color: 0x00ffff, pos: [-30, 15, 0], intensity: neonIntensity * 2 },    // Azul neon
            { color: 0xff00ff, pos: [30, 15, 0], intensity: neonIntensity * 2 },     // Magenta neon
            { color: 0x00ff00, pos: [0, 15, -30], intensity: neonIntensity * 2 },    // Verde neon puro
            { color: 0xff00cc, pos: [0, 15, 30], intensity: neonIntensity * 2 },     // Rosa choque
            
            // Novas luzes nos cantos
            { color: 0xff0066, pos: [-45, 15, -35], intensity: neonIntensity * 1.8 },  // Vermelho neon intenso
            { color: 0x00ff99, pos: [45, 15, -35], intensity: neonIntensity * 1.8 },   // Verde água vibrante
            { color: 0xff3300, pos: [-45, 15, 35], intensity: neonIntensity * 1.8 },   // Laranja neon
            { color: 0x9933ff, pos: [45, 15, 35], intensity: neonIntensity * 1.8 },    // Roxo neon
            
            // Luzes centrais
            { color: 0xff0033, pos: [-20, 15, 0], intensity: neonIntensity * 1.8 },    // Vermelho vibrante
            { color: 0x00ffcc, pos: [20, 15, 0], intensity: neonIntensity * 1.8 },     // Turquesa neon
            { color: 0xff3399, pos: [0, 15, -20], intensity: neonIntensity * 1.8 },    // Rosa neon
            { color: 0x33ff33, pos: [0, 15, 20], intensity: neonIntensity * 1.8 },     // Verde limão
            
            // Luzes extras
            { color: 0xff00ff, pos: [-35, 15, -25], intensity: neonIntensity * 1.8 },  // Magenta extra
            { color: 0x00ffff, pos: [35, 15, -25], intensity: neonIntensity * 1.8 },   // Ciano extra
            { color: 0xffff00, pos: [-35, 15, 25], intensity: neonIntensity * 1.8 },   // Amarelo neon
            { color: 0x66ff33, pos: [35, 15, 25], intensity: neonIntensity * 1.8 }     // Verde neon
        ];

        neonConfigs.forEach(config => {
            // Criar luz neon
            const neonLight = new THREE.SpotLight(config.color, config.intensity);
            neonLight.position.set(...config.pos);
            neonLight.angle = Math.PI / 3;
            neonLight.penumbra = 0.5;
            neonLight.decay = 1.5;
            neonLight.distance = 50;
            this.houseWorld.add(neonLight);
            this.neonLights.push(neonLight);

            // Criar tubo neon visual
            const tubeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
            const tubeMaterial = new THREE.MeshStandardMaterial({
                color: config.color,
                emissive: config.color,
                emissiveIntensity: 5,
                transparent: true,
                opacity: 0.9
            });
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            tube.position.set(...config.pos);
            tube.rotation.x = Math.PI / 2;
            
            // Adicionar halo luminoso ao redor do tubo
            const haloGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8.4, 16);
            const haloMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const halo = new THREE.Mesh(haloGeometry, haloMaterial);
            halo.position.copy(tube.position);
            halo.rotation.copy(tube.rotation);
            
            this.houseWorld.add(tube);
            this.houseWorld.add(halo);
        });
    }
    
    // ================================
    // CRIAR PISTA DENTRO DA CASA
    // ================================
    
    createTrackInsideHouse() {
        console.log('🏁 Criando pista NO CHÃO dentro da casa...');
        
        // Criar caminho da pista que passa pelos móveis
        this.createHouseTrackPath();
        
        // Criar superfície da pista NO CHÃO (sem suportes)
        this.createSubtleTrackSurface();
        
        // Linhas da pista NO CHÃO
        this.createTrackLines();
        
        // Bordas NO CHÃO
        this.createSubtleBorders();
        
        // Limites para colisão
        this.createTrackBoundaries();
        
        // Linha de chegada NO CHÃO
        this.createStartFinishLine();
        
        console.log('🏁 Pista criada no nível do chão! Gatos correm diretamente sobre a imagem da casa.');
    }
    
    
    // Criar caminho que passa pelos móveis da casa
    createHouseTrackPath() {
        // Pista que vai pela casa, passando pelos móveis - NO NÍVEL DO CHÃO
        const trackPoints = [
            new THREE.Vector3(0, 0, 30),      // Início na entrada - NÍVEL 0
            new THREE.Vector3(-15, 0, 20),    // Curva para a sala - NÍVEL 0
            new THREE.Vector3(-30, 0, 0),     // Passa pelo sofá - NÍVEL 0
            new THREE.Vector3(-20, 0, -20),   // Volta pela TV - NÍVEL 0
            new THREE.Vector3(0, 0, -25),     // Centro da casa - NÍVEL 0
            new THREE.Vector3(20, 0, -15),    // Vai para a cozinha - NÍVEL 0
            new THREE.Vector3(30, 0, 5),      // Passa pela geladeira - NÍVEL 0
            new THREE.Vector3(25, 0, 25),     // Curva final - NÍVEL 0
            new THREE.Vector3(10, 0, 30),     // Reta final - NÍVEL 0
            new THREE.Vector3(0, 0, 30)       // Volta ao início - NÍVEL 0
        ];
        
        this.trackPath = new THREE.CatmullRomCurve3(trackPoints, true);
        this.trackWidth = 12; // tamanho da pista 
        
        this.trackData = {
            startPosition: trackPoints[0].clone(),
            startDirection: new THREE.Vector3(0, 0, -1),
            finishPosition: trackPoints[0].clone()
        };
        
        console.log('🏁 Caminho da pista LARGA criado no nível do chão para facilitar desvio de obstáculos');
        console.log('📍 Largura da pista: 12 unidades (mais espaço para manobras)');
        console.log('📍 Posição inicial:', this.trackData.startPosition);
    }
    
// Superfície sutil da pista (transparente)
createSubtleTrackSurface() {
    const points = this.trackPath.getPoints(400); // Mais pontos para maior suavidade
    
    // Criar segmentos da pista com maior sobreposição
    for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];
        
        const direction = new THREE.Vector3().subVectors(point2, point1).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        const distance = point1.distanceTo(point2);
        const halfWidth = this.trackWidth / 2;
        
        // Aumentar levemente o tamanho do segmento para garantir cobertura
        const trackGeometry = new THREE.PlaneGeometry(halfWidth * 2 + 0.2, distance + 0.2);
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 1.0,
            metalness: 0.0,
            transparent: false,
            side: THREE.DoubleSide,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        
        const trackSegment = new THREE.Mesh(trackGeometry, trackMaterial);
        
        const midPoint = point1.clone().add(point2).multiplyScalar(0.5);
        trackSegment.position.copy(midPoint);
        trackSegment.position.y = -0.476; // Ajustado para ficar próximo ao chão mas evitar z-fighting
        trackSegment.rotation.x = -Math.PI / 2;
        
        const angle = Math.atan2(direction.x, direction.z);
        trackSegment.rotation.z = angle;
        
        trackSegment.receiveShadow = true;
        
        this.currentTrack.add(trackSegment);
    }
}

createTrackLines() {
    const points = this.trackPath.getPoints(150);
    
    for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];
        
        const direction = new THREE.Vector3().subVectors(point2, point1).normalize();
        const distance = point1.distanceTo(point2);
        
        // Linha central NO CHÃO - BRANCA CONTÍNUA
        const lineGeometry = new THREE.BoxGeometry(0.15, 0.03, distance);
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Branco
            emissive: 0xffffff, // Brilho branco
            emissiveIntensity: 0.1,
            roughness: 0.2,
            metalness: 0.1
        });
        
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        
        const midPoint = point1.clone().add(point2).multiplyScalar(0.5);
        line.position.copy(midPoint);
        line.position.y = -0.37; // ⬇️ LIGEIRAMENTE ACIMA DA SUPERFÍCIE DA PISTA
        
        const angle = Math.atan2(direction.x, direction.z);
        line.rotation.y = angle;
        line.receiveShadow = true;
        
        this.currentTrack.add(line);
    }
}
    

createSubtleBorders() {
    const points = this.trackPath.getPoints(80);
    
    for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];
        
        const direction = new THREE.Vector3().subVectors(point2, point1).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        const distance = point1.distanceTo(point2);
        const halfWidth = this.trackWidth / 2;
        
        // Bordas NO CHÃO - VERMELHAS
        const borderGeometry = new THREE.BoxGeometry(0.15, 0.4, distance);
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Vermelho vivo
            emissive: 0x330000, // Ligeiro brilho vermelho
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.2
        });
        
        // Borda esquerda NO CHÃO
        const leftBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        const leftPos = point1.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
        leftBorder.position.copy(leftPos.clone().add(point2.clone().add(perpendicular.clone().multiplyScalar(halfWidth))).multiplyScalar(0.5));
        leftBorder.position.y = -0.3; // ⬇️ NO NÍVEL DO CHÃO
        
        const angle = Math.atan2(direction.x, direction.z);
        leftBorder.rotation.y = angle;
        leftBorder.castShadow = true;
        leftBorder.receiveShadow = true;
        this.currentTrack.add(leftBorder);
        
        // Borda direita NO CHÃO
        const rightBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        const rightPos = point1.clone().add(perpendicular.clone().multiplyScalar(-halfWidth));
        rightBorder.position.copy(rightPos.clone().add(point2.clone().add(perpendicular.clone().multiplyScalar(-halfWidth))).multiplyScalar(0.5));
        rightBorder.position.y = -0.3; // ⬇️ NO NÍVEL DO CHÃO
        rightBorder.rotation.y = angle;
        rightBorder.castShadow = true;
        rightBorder.receiveShadow = true;
        this.currentTrack.add(rightBorder);
    }
}

    
    // ================================
    // SISTEMA ORIGINAL ADAPTADO
    // ================================
    
    // Limites para colisão (adaptado para a casa)
    createTrackBoundaries() {
        const points = this.trackPath.getPoints(50);
        this.trackBounds = [];
        
        for (let i = 0; i < points.length - 1; i++) {
            const point1 = points[i];
            const point2 = points[i + 1];
            
            const direction = new THREE.Vector3().subVectors(point2, point1).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            const halfWidth = this.trackWidth / 2 + 0.3;
            
            const leftBound = {
                start: point1.clone().add(perpendicular.clone().multiplyScalar(halfWidth)),
                end: point2.clone().add(perpendicular.clone().multiplyScalar(halfWidth))
            };
            
            const rightBound = {
                start: point1.clone().add(perpendicular.clone().multiplyScalar(-halfWidth)),
                end: point2.clone().add(perpendicular.clone().multiplyScalar(-halfWidth))
            };
            
            this.trackBounds.push(leftBound, rightBound);
        }
        
        console.log(`🚧 Criados ${this.trackBounds.length} limites de colisão na casa`);
    }
    
    // Linha de chegada na casa
    createStartFinishLine() {
        const startPoint = this.trackPath.getPointAt(0);
        const nextPoint = this.trackPath.getPointAt(0.01);
    
        const direction = new THREE.Vector3().subVectors(nextPoint, startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    
        // Primeiro, criar base preta sob a linha de chegada
        const baseGeometry = new THREE.PlaneGeometry(this.trackWidth, this.trackWidth / 2);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const baseTrack = new THREE.Mesh(baseGeometry, baseMaterial);
        baseTrack.position.copy(startPoint);
        baseTrack.position.y = -0.476;
        baseTrack.rotation.x = -Math.PI / 2;
        const angle = Math.atan2(direction.x, direction.z);
        baseTrack.rotation.z = angle;
        this.currentTrack.add(baseTrack);

        const squareSize = 0.3;
        const numSquares = Math.floor(this.trackWidth / squareSize);
    
        for (let i = -numSquares / 2; i < numSquares / 2; i++) {
            for (let j = -1; j <= 1; j++) {
                const isBlack = (i + j) % 2 === 0;
                const color = isBlack ? 0x000000 : 0xffffff;
    
                const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
                const squareMaterial = new THREE.MeshStandardMaterial({
                    color: color,
                    transparent: false,
                    side: THREE.DoubleSide
                });
    
                const square = new THREE.Mesh(squareGeometry, squareMaterial);
    
                const offset = perpendicular.clone().multiplyScalar(i * squareSize);
                const forward = direction.clone().multiplyScalar(j * squareSize * 0.5);
    
                const position = startPoint.clone().add(offset).add(forward);
    
                square.position.set(position.x, -0.36, position.z);
                square.rotation.x = -Math.PI / 2;
    
                this.currentTrack.add(square);
            }
        }
    
        console.log("🏁 Linha de chegada colocada corretamente no chão, cobrindo toda a largura da pista.");
    }
    
    // ================================
    // MÉTODOS DE UTILIDADE
    // ================================
    
    // Verificar limites (mesmo sistema)
    checkTrackBounds(position) {
        const trackPoint = this.getClosestPointOnTrack(position);
        const distanceFromTrack = position.distanceTo(trackPoint);
        
        if (distanceFromTrack > this.trackWidth / 2 + 0.2) {
            return {
                isOutOfBounds: true,
                correctedPosition: trackPoint,
                distanceFromTrack: distanceFromTrack
            };
        }
        
        return {
            isOutOfBounds: false,
            correctedPosition: position,
            distanceFromTrack: distanceFromTrack
        };
    }
    
    // Ponto mais próximo na pista
    getClosestPointOnTrack(position) {
        let closestPoint = null;
        let minDistance = Infinity;
        
        for (let t = 0; t <= 1; t += 0.01) {
            const trackPoint = this.trackPath.getPointAt(t);
            const distance = position.distanceTo(trackPoint);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = trackPoint.clone();
            }
        }
        
        return closestPoint;
    }
    
    // Métodos de utilidade originais
    getPositionOnTrack(t) {
        // Proteção: garantir que t é um número entre 0 e 1
        if (typeof t !== 'number' || isNaN(t)) t = 0;
        t = Math.max(0, Math.min(1, t));
        return this.trackPath.getPointAt(t);
    }
    
    getDirectionOnTrack(t) {
        return this.trackPath.getTangentAt(t);
    }
    
    // Limpar mundo da casa
    clearHouseWorld() {
        this.backgroundElements.forEach(element => {
            window.scene.remove(element);
        });
        this.backgroundElements = [];
        
        if (this.houseWorld) {
            window.scene.remove(this.houseWorld);
            this.houseWorld = null;
        }
        
        // Restaurar fundo padrão
        window.scene.background = new THREE.Color(0x111133);
        
        console.log('🧹 Mundo da casa limpo');
    }
    
    // Método para limpar tudo
    dispose() {
        this.clearHouseWorld();
        
        if (this.currentTrack) {
            window.scene.remove(this.currentTrack);
            this.currentTrack = null;
        }
        
        this.trackPath = null;
        this.checkpoints = [];
        this.trackData = null;
        this.trackBounds = [];
        
        console.log('🧹 TrackManager limpo completamente');
    }
    
    // Método de debug
    debugHouseWorld() {
        console.log('🔍 Debug House World:');
        console.log('- House world:', this.houseWorld);
        console.log('- Current track:', this.currentTrack);
        console.log('- Background elements:', this.backgroundElements.length);
        console.log('- Scene children:', window.scene.children.length);
        console.log('- Track path points:', this.trackPath ? this.trackPath.getPoints(10) : 'none');
        
        if (this.houseWorld) {
            console.log('- House world children:', this.houseWorld.children.length);
            this.houseWorld.children.forEach((child, index) => {
                console.log(`  - Child ${index}:`, child.type, child.position);
            });
        }
    }
}