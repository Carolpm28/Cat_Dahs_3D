// js/track/HouseDecorations.js - Decorações fofas e simples para a casa dos gatos
export class HouseDecorations {
    constructor(houseWorld) {
        this.houseWorld = houseWorld;
        this.floorY = -0.5; // Altura do chão
        this.wallHeight = 12;
    }
    
    // Método principal para decorar a casa
    decorate() {
        console.log('🐱 Decorando a casa com tema fofo de gatos...');
        
        // Quadros nas paredes
        this.createCatPictures();
        
        // Pegadas de patas nas paredes
        this.createPawPrints();
        
        // Relógio de gato simples
        this.createSimpleCatClock();
        
        // Tapetes fofos
        this.createCuteCarpets();
        
        // Placa de boas-vindas
        this.createWelcomeSign();
        
        console.log('✨ Casa decorada com sucesso!');
    }
    
    // Quadros simples com gatos
    createCatPictures() {
        const pictures = [
            { pos: new THREE.Vector3(-20, this.floorY + 6, -39.5), emoji: '🐱', color: '#FFB6C1' },
            { pos: new THREE.Vector3(0, this.floorY + 6, -39.5), emoji: '😺', color: '#87CEEB' },
            { pos: new THREE.Vector3(20, this.floorY + 6, -39.5), emoji: '😸', color: '#98FB98' },
            { pos: new THREE.Vector3(-49.5, this.floorY + 6, 0), emoji: '😻', color: '#DDA0DD' },
            { pos: new THREE.Vector3(49.5, this.floorY + 6, 0), emoji: '🙀', color: '#F0E68C' }
        ];
        
        pictures.forEach(pic => {
            const frameGroup = new THREE.Group();
            
            // Moldura simples
            const frameGeometry = new THREE.BoxGeometry(2, 2, 0.1);
            const frameMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.8
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frameGroup.add(frame);
            
            // Canvas com emoji de gato
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            // Fundo colorido
            ctx.fillStyle = pic.color;
            ctx.fillRect(0, 0, 128, 128);
            
            // Emoji de gato
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pic.emoji, 64, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const pictureMaterial = new THREE.MeshBasicMaterial({ map: texture });
            const picture = new THREE.Mesh(
                new THREE.PlaneGeometry(1.8, 1.8),
                pictureMaterial
            );
            picture.position.z = 0.06;
            frameGroup.add(picture);
            
            frameGroup.position.copy(pic.pos);
            
            // Rotacionar se estiver na parede lateral
            if (Math.abs(pic.pos.x) > 40) {
                frameGroup.rotation.y = pic.pos.x > 0 ? -Math.PI / 2 : Math.PI / 2;
            }
            
            this.houseWorld.add(frameGroup);
        });
    }
    
    // Pegadas de patas simples
    createPawPrints() {
        const pawPositions = [
            { pos: new THREE.Vector3(-10, this.floorY + 3, -39.5), size: 0.3 },
            { pos: new THREE.Vector3(10, this.floorY + 3, -39.5), size: 0.3 },
            { pos: new THREE.Vector3(-30, this.floorY + 4, -39.5), size: 0.4 },
            { pos: new THREE.Vector3(30, this.floorY + 4, -39.5), size: 0.4 },
            { pos: new THREE.Vector3(0, this.floorY + 5, -39.5), size: 0.5 }
        ];
        
        pawPositions.forEach(paw => {
            const pawSprite = this.createPawSprite(paw.size);
            pawSprite.position.copy(paw.pos);
            pawSprite.position.z += 0.1;
            this.houseWorld.add(pawSprite);
        });
    }
    
    createPawSprite(size = 1) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐾', 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(size, size, 1);
        
        return sprite;
    }
    
    // Relógio simples de gato
    createSimpleCatClock() {
        const clockGroup = new THREE.Group();
        
        // Cara do gato (relógio)
        const faceGeometry = new THREE.CircleGeometry(1.2, 32);
        const faceMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.8
        });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        clockGroup.add(face);
        
        // Fundo branco do relógio
        const clockFaceGeometry = new THREE.CircleGeometry(1, 32);
        const clockFaceMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const clockFace = new THREE.Mesh(clockFaceGeometry, clockFaceMaterial);
        clockFace.position.z = 0.1;
        clockGroup.add(clockFace);
        
        // Orelhas
        const earGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
        const earMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.6, 0.9, 0);
        leftEar.rotation.z = 0.3;
        clockGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.6, 0.9, 0);
        rightEar.rotation.z = -0.3;
        clockGroup.add(rightEar);
        
        // Ponteiros simples
        const hourHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.5, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        hourHand.position.set(0, 0.25, 0.15);
        hourHand.rotation.z = -Math.PI / 6;
        clockGroup.add(hourHand);
        
        const minuteHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.7, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        minuteHand.position.set(0, 0.35, 0.15);
        minuteHand.rotation.z = Math.PI / 3;
        clockGroup.add(minuteHand);
        
        // Centro
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xFF69B4 })
        );
        center.position.z = 0.2;
        clockGroup.add(center);
        
        // Números (só 12, 3, 6, 9)
        const numbers = [
            { num: '12', x: 0, y: 0.7 },
            { num: '3', x: 0.7, y: 0 },
            { num: '6', x: 0, y: -0.7 },
            { num: '9', x: -0.7, y: 0 }
        ];
        
        numbers.forEach(n => {
            const numberSprite = this.createTextSprite(n.num, {
                fontSize: 24,
                color: '#000000'
            });
            numberSprite.position.set(n.x, n.y, 0.2);
            numberSprite.scale.set(0.4, 0.4, 1);
            clockGroup.add(numberSprite);
        });
        
        clockGroup.position.set(0, this.floorY + 8, -39.5);
        this.houseWorld.add(clockGroup);
    }
    
    createTextSprite(text, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = options.color || '#000000';
        ctx.font = `${options.fontSize || 32}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        return new THREE.Sprite(material);
    }
    
    // Tapetes fofos
    createCuteCarpets() {
        const carpets = [
            { pos: new THREE.Vector3(-25, this.floorY + 0.01, -15), color: 0xFF69B4, size: 3 },
            { pos: new THREE.Vector3(25, this.floorY + 0.01, -20), color: 0x87CEEB, size: 2.5 },
            { pos: new THREE.Vector3(0, this.floorY + 0.01, 10), color: 0x98FB98, size: 4 }
        ];
        
        carpets.forEach(carpet => {
            const carpetGroup = new THREE.Group();
            
            // Tapete circular
            const carpetGeometry = new THREE.CylinderGeometry(carpet.size, carpet.size, 0.05, 32);
            const carpetMaterial = new THREE.MeshStandardMaterial({
                color: carpet.color,
                roughness: 0.9
            });
            const carpetMesh = new THREE.Mesh(carpetGeometry, carpetMaterial);
            carpetMesh.receiveShadow = true;
            carpetGroup.add(carpetMesh);
            
            // Pata no centro
            const centerPaw = this.createPawSprite(0.8);
            centerPaw.position.y = 0.03;
            carpetGroup.add(centerPaw);
            
            // Patas ao redor
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const paw = this.createPawSprite(0.4);
                paw.position.set(
                    Math.cos(angle) * carpet.size * 0.7,
                    0.03,
                    Math.sin(angle) * carpet.size * 0.7
                );
                carpetGroup.add(paw);
            }
            
            carpetGroup.position.copy(carpet.pos);
            carpetGroup.rotation.y = Math.random() * Math.PI * 2;
            this.houseWorld.add(carpetGroup);
        });
    }

    
    // Placa de boas-vindas
    createWelcomeSign() {
        const signGroup = new THREE.Group();
        
        // Base da placa
        const signGeometry = new THREE.BoxGeometry(4, 2, 0.2);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.7
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        signGroup.add(sign);
        
        // Moldura
        const frameGeometry = new THREE.BoxGeometry(4.2, 2.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF69B4,
            roughness: 0.6
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = -0.06;
        signGroup.add(frame);
        
        // Texto
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Fundo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 512, 256);
        
        // Texto principal
        ctx.fillStyle = '#FF69B4';
        ctx.font = 'bold 60px Fredoka, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Bem-vindo à', 256, 100);
        ctx.fillText('Casa dos Gatos!', 256, 160);
        
        // Patas decorativas
        ctx.font = '40px Arial';
        ctx.fillText('🐾', 80, 50);
        ctx.fillText('🐾', 432, 50);
        ctx.fillText('🐾', 80, 206);
        ctx.fillText('🐾', 432, 206);
        
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const textMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(3.8, 1.8),
            textMaterial
        );
        textMesh.position.z = 0.11;
        signGroup.add(textMesh);
        
        // Posicionar na parede de entrada
        signGroup.position.set(0, this.floorY + 6, 39.5);
        signGroup.rotation.y = Math.PI; // Virar para dentro da casa
        
        this.houseWorld.add(signGroup);
    }
}