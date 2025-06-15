# 🐸 Bufo Blaster

A thrilling Vampire Survivors-like bullet hell game featuring adorable Bufo emojis! Survive endless waves of enemies, collect experience orbs, and upgrade your abilities to become the ultimate Bufo warrior.

## 🎮 Game Overview

Bufo Blaster is a top-down survival action game where you control a Bufo character through increasingly challenging waves of enemies. The game combines fast-paced combat with strategic upgrade choices, creating an addictive gameplay loop that keeps players coming back for more.

## 🎯 Core Gameplay

### **Survival Mechanics**
- **Health System**: Start with 100 HP, lose health when touching enemies
- **Invincibility Frames**: 1-second invincibility after taking damage
- **Health Regeneration**: Passive health regen every 10 seconds (upgradable)
- **Game Over**: Occurs when health reaches 0

### **Combat System**
- **Auto-Targeting**: Bufo automatically shoots at the nearest enemy
- **Projectile Physics**: Bullets travel at 12 units/second with 1.5 base damage
- **Enemy AI**: Enemies chase the player at 1.5 units/second
- **Collision Detection**: Precise physics-based collision using Matter.js

### **Progression System**
- **Experience Points**: Collect XP orbs from defeated enemies
- **Leveling Up**: Gain levels to unlock upgrade choices
- **Upgrade Selection**: Choose from 3 random upgrades when leveling up

## 🎮 Controls

### **Movement**
- **Keyboard**: WASD or Arrow Keys
- **Gamepad**: Left analog stick (Xbox/Standard gamepad support)
- **Diagonal Movement**: Normalized for consistent speed

### **Upgrade Menu Navigation**
- **Keyboard**: Arrow keys to navigate, Enter to select
- **Gamepad**: D-pad or left stick to navigate, A button to select

### **Game Restart**
- **Gamepad**: A button (when game over)
- **Mouse**: Click "Restart" text (when game over)

## ⚡ Upgrade System

### **Available Upgrades**
1. **Rapid Fire** - Increases attack speed by 15%
2. **Vitality Spores** - Speeds up health regeneration by 3 seconds
3. **Greater Greed** - Increases XP orb pickup range by 25 units
4. **More Damage** - Increases projectile damage by 1
5. **Increased Speed** - Increases movement speed by 0.5
6. **Health Pack** - Restores 25 health points

### **Upgrade Mechanics**
- **Random Selection**: 3 random upgrades offered per level
- **Immediate Effect**: Upgrades apply instantly when selected
- **Stackable**: Multiple upgrades of the same type stack
- **Pause Gameplay**: Game pauses during upgrade selection

## 🎨 Visual & Audio Features

### **Graphics**
- **Player Character**: Animated Bufo GIF with rotation
- **Enemy Variety**: 5 different Bufo enemy types
- **Visual Effects**: Health bars, XP orbs, projectiles
- **Responsive Design**: Scales to fit different screen sizes
- **Dark Theme**: Space-like background with gradient

### **Audio System**
- **Background Music**: Looping atmospheric track
- **Sound Effects**:
  - Shooting sounds
  - Enemy death sounds
  - Player hit sounds
  - XP pickup sounds
- **Volume Control**: Balanced audio levels for all effects

## 🛠️ Technical Implementation

### **Modular Architecture**
The game is built using a clean modular architecture with ES6 modules:

- **`constants.js`** - All game configuration and constants in one place
- **`gameState.js`** - Centralized state management with controlled access
- **`assetLoader.js`** - Asset loading, audio initialization, and responsive scaling
- **`input.js`** - Keyboard and gamepad input handling
- **`entities.js`** - Game object creation and management (player, enemies, projectiles)
- **`upgrades.js`** - Upgrade system definitions and logic
- **`ui.js`** - All UI rendering and visual feedback
- **`gameCore.js`** - Core game loop, collision detection, and initialization
- **`main.js`** - Entry point that ties everything together

This modular approach provides:
- **Maintainability**: Easy to find and modify specific functionality
- **Testability**: Individual modules can be tested in isolation
- **Reusability**: Modules can be reused across different parts of the game
- **Scalability**: New features can be added without affecting existing code

### **Physics Engine**
- **Matter.js**: Full 2D physics simulation
- **Collision Categories**: Separate collision groups for player, enemies, projectiles
- **Boundary System**: Invisible walls prevent objects from leaving the game area
- **Performance Optimized**: Efficient object cleanup and management

### **Game Architecture**
- **Modular Design**: Separated concerns for different game systems
- **Event-Driven**: Physics events handle collisions and updates
- **State Management**: Clean game state transitions
- **Asset Loading**: Asynchronous image and audio loading

### **Performance Features**
- **Object Pooling**: Efficient memory management
- **Cleanup Systems**: Automatic removal of off-screen objects
- **Frame Rate Optimization**: Consistent 60 FPS gameplay
- **Memory Management**: Proper cleanup of intervals and timers

## 📊 Game Statistics

### **Displayed Metrics**
- **Run Timer**: Tracks survival time (MM:SS format)
- **Enemy Kill Count**: Total enemies defeated
- **Current Level**: Player's current level
- **Health Bar**: Visual health indicator
- **XP Progress**: Progress to next level

### **Game Balance**
- **Enemy Spawning**: 267ms intervals (adjustable)
- **Shooting Rate**: 1000ms intervals (upgradable)
- **XP Requirements**: 30 XP per level (increases with level)
- **Enemy Health**: 3 HP per enemy
- **Contact Damage**: 10 HP per enemy touch

## 🎯 Game Features

### **Advanced Mechanics**
- **XP Orb Magnetism**: Orbs are attracted to player within pickup radius
- **Enemy Health Bars**: Visual health indicators for enemies
- **Smooth Movement**: Physics-based movement with boundary clamping
- **Gamepad Support**: Full controller compatibility
- **Responsive UI**: Adapts to different screen sizes

### **Quality of Life**
- **Auto-Save**: Game state persists during session
- **Restart System**: Quick game reset functionality
- **Visual Feedback**: Clear indication of game states
- **Accessibility**: Multiple control schemes

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser with JavaScript enabled
- Optional: Gamepad for enhanced gameplay experience

### **Installation**
1. Clone or download the repository
2. Open `index.html` in a web browser
3. Wait for assets to load
4. Start playing!

### **Browser Compatibility**
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 📁 File Structure

```
bufo-blaster/
├── index.html              # Main game page
├── style.css               # Basic styling
├── README.md               # This file
├── script_original.js      # Original monolithic script (backup)
├── js/                     # Modular JavaScript files
│   ├── main.js            # Main entry point
│   ├── constants.js       # Game constants and configuration
│   ├── gameState.js       # Global state management
│   ├── assetLoader.js     # Asset loading and scaling
│   ├── input.js           # Input handling (keyboard/gamepad)
│   ├── entities.js        # Game entities (player, enemies, projectiles)
│   ├── upgrades.js        # Upgrade system
│   ├── ui.js              # UI rendering
│   └── gameCore.js        # Core game logic and initialization
└── sfx/                    # Audio assets
    ├── music_loop.mp3     # Background music
    ├── shoot.mp3          # Shooting sound
    ├── pickup.mp3         # XP pickup sound
    ├── player_hit.mp3     # Player damage sound
    └── enemy_die.mp3      # Enemy death sound
```

## 🎮 Game Tips

1. **Keep Moving**: Standing still makes you an easy target
2. **Collect XP**: Prioritize collecting experience orbs to level up quickly
3. **Choose Wisely**: Consider your current situation when selecting upgrades
4. **Manage Health**: Use health packs strategically when low on health
5. **Upgrade Strategically**: Focus on damage and attack speed for longer survival

## 🔧 Development Notes

### **Code Quality**
- **Modular Architecture**: Code split into focused, single-responsibility modules
- **ES6 Modules**: Modern JavaScript module system with clean imports/exports
- **Separation of Concerns**: Clear boundaries between game systems
- **Comprehensive Comments**: Well-documented codebase
- **Error Handling**: Robust error handling for asset loading
- **Debug Logging**: Extensive console logging for development
- **Clean Dependencies**: Minimal circular dependencies with dynamic imports where needed

### **Future Enhancements**
- Additional enemy types
- More upgrade variety
- Power-up items
- Boss encounters
- Multiple difficulty levels
- Save/load system

## 📄 License

This project uses assets from the [all-the-bufo](https://github.com/knobiknows/all-the-bufo) repository for character sprites.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the game!

---

**Enjoy blasting your way through endless waves of Bufo enemies! 🐸💥**
