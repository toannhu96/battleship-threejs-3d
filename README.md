# ThreeJS 3D Battleships Game

A modern, interactive 3D implementation of the classic Battleships board game built with Next.js, TypeScript, and Three.js.

## About

This project was created by Vibe Coding as a demonstration of how to build an engaging 3D game using modern web technologies with AI Agent. The implementation showcases the power of ThreeJS for creating immersive browser-based gaming experiences without requiring any plugins.

The game features:

- Full 3D rendering of ships and game boards using Three.js
- Realistic sound effects and visual feedback
- Smart AI opponent with tactical decision making
- Beautiful ship models with type-specific styling
- Intuitive controls for ship placement and gameplay

## Technologies Used

- **Next.js**: For server-side rendering and optimized React application structure
- **Three.js**: For 3D rendering and interactive game elements

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/toannhu96/battleship-threejs-3d.git
cd battleship-threejs-3d/app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to http://localhost:3000

## How to Play

1. **Setup Phase**: 
   - Place your ships on the board
   - Use the "Rotate" button to change orientation
   - Click "Auto Place" for a random arrangement
   - Press "Reset" to clear the board and start again

2. **Battle Phase**:
   - Take turns shooting at the opponent's board
   - Red markers indicate hits, teal markers show misses
   - Ships will display subtle damage effects when hit
   - Sink all opponent ships to win

## Game Features

- **Ship Types**:
  - Battleship (4 cells): Purple
  - Cruiser/Submarine (3 cells): Brown
  - Destroyer/Frigate (2 cells): Green
  - Raft (1 cell): Burgundy

- **Visual Effects**:
  - Splash animation for missed shots
  - Explosion animation for hits
  - Sink animation for destroyed ships
  - Damage effects on partially hit ships

## Credit

Made with ❤️ by Vibe Coding
- **[Cursor](https://cursor.sh/)** - The AI-first code editor
- **Claude 3.7 Sonnet** by Anthropic - Advanced AI assistant