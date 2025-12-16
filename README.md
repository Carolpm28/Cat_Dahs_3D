# Cat Dash 3D - Racing Game

![Three.js](https://img.shields.io/badge/Three.js-r128-black)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF)
![License](https://img.shields.io/badge/license-ISC-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow)

**Cat Dash 3D** is a fun and colorful racing game where cats compete on homemade circuits! Choose your favorite cat and race through household furniture or across the garden.

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Characters](#characters)
- [Tracks](#tracks)
- [Technologies Used](#technologies-used)
- [Installation and Configuration](#installation-and-configuration)
- [How to Play](#how-to-play)

---

## About the Project

Cat Dash 3D is a racing game developed with **Three.js** that offers a unique racing experience with feline characters. The game supports single-player mode and local multiplayer with split-screen, allowing two players to compete side-by-side.

---

## Key Features

* **Single-Player and Multiplayer Modes:** Play alone or with a friend on the same screen (automatic split-screen).
* **4 Unique Characters:** Each cat has its own stats for speed, acceleration, and handling.
* **Diverse Tracks:** Race through the interior of a house or explore the garden.
* **Immersive Audio:** Engaging soundtrack and in-game sound effects.
* **Customization:** Choose between 3, 5, 10, or 15 laps per race.
* **3D Graphics:** User-friendly interface with vibrant and colorful visuals.

---

## Characters

Each character possesses unique attributes that influence racing strategy:

| Character | Speed | Acceleration | Handling |
| :--- | :--- | :--- | :--- |
| **Rambim** | ⭐⭐⭐⭐⭐ (100%) | ⭐⭐⭐⭐ (80%) | ⭐⭐⭐ (60%) |
| **Faísca** | ⭐⭐⭐⭐ (80%) | ⭐⭐⭐⭐⭐ (100%) | ⭐⭐⭐⭐ (80%) |
| **Blackie** | ⭐⭐⭐ (60%) | ⭐⭐⭐⭐⭐ (100%) | ⭐⭐⭐⭐⭐ (100%) |
| **Mickey** | ⭐⭐⭐⭐ (80%) | ⭐⭐⭐ (60%) | ⭐⭐⭐⭐ (80%) |

---

## Tracks

| Track | Difficulty | Length | Description |
| :--- | :--- | :--- | :--- |
| **House Circuit** | Easy | Medium | An exciting race through household furniture. |
| **Garden Loop** | Medium | Long | Outdoor racing. (Status: Locked/Unlockable) |

---

## Technologies Used

* **Three.js (r128):** Graphics engine for 3D rendering.
* **Vite:** Build tool and fast development server.
* **JavaScript ES6+:** Core game logic.
* **HTML5 Canvas:** Graphics rendering.
* **CSS3:** User interface styling.

---

## Project Structure

```
Cat_Dash_3D/
├── public/
│   ├── assets/              # Resources (images, sounds, textures)
│   ├── js/
│   │   ├── characters/      # Character system
│   │   ├── data/            # Configuration data
│   │   ├── game/            # Main logic
│   │   ├── graphics/        # 3D scene management
│   │   ├── race/            # Racing system
│   │   ├── track/           # Track management
│   │   └── ui/              # User interface
│   ├── index.html           # Main page
│   ├── main.js              # Entry point
│   └── styles.css           # Global styles
├── package.json             # Dependencies
└── README.md                # This file
```

---

## Installation and Configuration

### Prerequisites
* Node.js (v14+)
* npm (v6+)
* Modern browser with WebGL support

### 1. Installation

```bash
# Clone the repository
git clone [https://github.com/Carolpm28/Cat_Dahs_3D.git](https://github.com/Carolpm28/Cat_Dahs_3D.git)
cd Cat_Dahs_3D

# Install dependencies
npm install
```

### 2. Run

```bash
# Start in development mode
npm run dev
```

The game will be available at `http://localhost:5173` (or another port indicated in the terminal).

---

## How to Play

### Controls

| Action | Player 1 (Single/Multi) | Player 2 (Multiplayer) |
| :--- | :--- | :--- |
| **Accelerate** | `W` or `Up Arrow` | `I` |
| **Brake/Reverse** | `S` or `Down Arrow` | `K` |
| **Turn Left** | `A` or `Left Arrow` | `J` |
| **Turn Right** | `D` or `Right Arrow` | `L` |

### Starting a Race

1. Click **"PLAY"** on the main menu.
2. Select the mode (**1 Player** or **2 Players**).
3. Choose your **Cat** and the **Track**.
4. Set the number of **Laps** (3, 5, 10, 15).
5. Click **"START RACE"**.

---

<div align="center">

**Cat Dash 3D** © 2025 Cat Dash Studios
)

</div>
