// js/data/GameData.js - Dados dos personagens e pistas
// Dados dos gatos jogáveis: estatísticas, imagens e nomes.
export const catData = {
    rambim: {
      name: "Rambim",
      speed: 5,
      acceleration: 4,
      handling: 3,
      image: "assets/rambim.jpeg"
    },
    faisca: {
      name: "Faísca",
      speed: 4,
      acceleration: 5,
      handling: 4,
      image: "assets/faísca.jpeg"
    },
    blackie: {
      name: "Blackie",
      speed: 3,
      acceleration: 5,
      handling: 5,
      image: "assets/blackie.jpeg"
    },
    mickey: {
      name: "Mickey",
      speed: 4,
      acceleration: 3,
      handling: 4,
      image: "assets/mickey.jpeg"
    }
  };
  
  export const trackData = {
    pista1: {
      name: "Circuito da Casa",
      preview: "assets/pista1-preview.png",
      description: "Pista oval com curvas suaves",
      difficulty: "Fácil",
      length: "Médio"
    },
    pista2: {
      name: "Volta do Jardim", 
      preview: "assets/pista2-preview.jpg",
      description: "Corrida ao ar livre",
      difficulty: "Médio",
      length: "Longo"
    },
    pista3: {
      name: "Pista Turbo",
      preview: "assets/pista3-preview.jpg",
      description: "Desafio para veteranos",
      difficulty: "Difícil",
      length: "Curto"
    },
    pista4: {
      name: "Castelo dos Gatos",
      preview: "assets/pista4-preview.jpg", 
      description: "Aventura medieval",
      difficulty: "Médio",
      length: "Longo"
    }
  };

// Exporta o objeto catData para ser usado noutros módulos.