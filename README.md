# 🐱 Cat Dash 3D

Um jogo de corrida 3D divertido e colorido onde gatos competem em circuitos caseiros! Escolha o seu gato favorito e corra através dos móveis da casa ou no jardim.

## 📋 Sobre o Projeto

Cat Dash 3D é um jogo de corrida desenvolvido com Three.js que oferece uma experiência única de corrida com personagens felinos. O jogo suporta modo single-player e multiplayer local com split-screen, permitindo que dois jogadores compitam lado a lado.

## ✨ Características Principais

- 🎮 **Modo Single-Player e Multiplayer**: Jogue sozinho ou com um amigo no mesmo ecrã
- 🐈 **4 Personagens Únicos**: Cada gato tem características próprias de velocidade, aceleração e manobrabilidade
- 🏁 **Pistas Diversificadas**: Circuito da Casa e Volta do Jardim
- 🎵 **Música e Efeitos Sonoros**: Trilha sonora envolvente e efeitos de jogo
- 📊 **Sistema de Voltas Personalizável**: Escolha entre 3, 5, 10 ou 15 voltas
- 🎨 **Gráficos 3D Coloridos**: Interface amigável com visuais vibrantes
- 🖥️ **Split-Screen**: Tela dividida automática no modo multiplayer

## 🎯 Personagens Disponíveis

### Rambim
- **Velocidade**: ⭐⭐⭐⭐⭐ (100%)
- **Aceleração**: ⭐⭐⭐⭐ (80%)
- **Manobra**: ⭐⭐⭐ (60%)

### Faísca
- **Velocidade**: ⭐⭐⭐⭐ (80%)
- **Aceleração**: ⭐⭐⭐⭐⭐ (100%)
- **Manobra**: ⭐⭐⭐⭐ (80%)

### Blackie
- **Velocidade**: ⭐⭐⭐ (60%)
- **Aceleração**: ⭐⭐⭐⭐⭐ (100%)
- **Manobra**: ⭐⭐⭐⭐⭐ (100%)

### Mickey
- **Velocidade**: ⭐⭐⭐⭐ (80%)
- **Aceleração**: ⭐⭐⭐ (60%)
- **Manobra**: ⭐⭐⭐⭐ (80%)

## 🏎️ Pistas Disponíveis

### 🏠 Circuito da Casa
- **Comprimento**: Médio
- **Dificuldade**: Fácil
- **Descrição**: Uma corrida emocionante através dos móveis da casa

### 🌟 Volta do Jardim
- **Comprimento**: Longo
- **Dificuldade**: Médio
- **Descrição**: Corrida ao ar livre no jardim
- **Status**: Bloqueada (a desbloquear)

## 🛠️ Tecnologias Utilizadas

- **Three.js** (r128) - Motor gráfico 3D
- **Vite** - Build tool e servidor de desenvolvimento
- **JavaScript ES6+** - Linguagem principal
- **HTML5 Canvas** - Renderização
- **CSS3** - Estilização da interface

## 📁 Estrutura do Projeto

```
Cat_Dahs_3D/
├── public/
│   ├── assets/              # Recursos do jogo (imagens, sons, texturas)
│   ├── js/
│   │   ├── characters/      # Sistema de personagens
│   │   ├── data/            # Dados de configuração
│   │   ├── game/            # Lógica principal do jogo
│   │   ├── graphics/        # Gestão de gráficos e cena 3D
│   │   ├── race/            # Sistema de corrida
│   │   ├── track/           # Gestão de pistas
│   │   └── ui/              # Interface do utilizador
│   ├── index.html           # Página principal
│   ├── main.js              # Ponto de entrada da aplicação
│   └── styles.css           # Estilos globais
├── package.json             # Dependências do projeto
└── README.md                # Este ficheiro
```

## 🔧 Requisitos do Sistema

- **Node.js**: versão 14 ou superior
- **npm**: versão 6 ou superior
- **Navegador moderno** com suporte a WebGL

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/Carolpm28/Cat_Dahs_3D.git
cd Cat_Dahs_3D
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar em Modo de Desenvolvimento

```bash
npm run dev
```

O jogo estará disponível em `http://localhost:5173` (ou outra porta indicada no terminal).

## 🎮 Como Jogar

### Controlos

#### Single-Player / Player 1:
- **W** ou **Seta Cima**: Acelerar
- **S** ou **Seta Baixo**: Travar
- **A** ou **Seta Esquerda**: Virar à esquerda
- **D** ou **Seta Direita**: Virar à direita

#### Player 2 (Multiplayer):
- **I**: Acelerar
- **K**: Travar
- **J**: Virar à esquerda
- **L**: Virar à direita

### Passos para Iniciar uma Corrida

1. **Clique em "JOGAR"** no menu principal
2. **Selecione o modo**:
   - 1 JOGADOR: Modo single-player
   - 2 JOGADORES: Modo multiplayer com split-screen
3. **Escolha o seu gato**: Cada personagem tem estatísticas únicas
4. **Selecione a pista**: Escolha entre as pistas disponíveis
5. **Defina o número de voltas**: 3, 5, 10 ou 15 voltas
6. **Clique em "COMEÇAR CORRIDA"** e divirta-se!

## 📝 Licença

ISC License

---

© 2025 Cat Dash Studios
