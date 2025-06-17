# 🐸 Bufo Blaster

A fast-paced action roguelike game featuring three unique Bufo characters, each with distinct abilities and playstyles. Battle through waves of enemies, collect upgrades, and survive as long as possible in this bullet-hell inspired adventure!

## 🎮 Game Features

### **Three Unique Characters**
- **🗡️ Stab Bufo**: Melee bruiser with a damaging toxic aura and knockback
- **🧙 Wizard Bufo**: Ranged caster with starfall spells that damage and confuse enemies
- **🦆 Goose Bufo**: Summoner with orbiting geese that damage enemies and convert them to allies

### **Dynamic Upgrade System**
- **XP-based leveling** starting at 100 XP, scaling 1.5x per level
- **15+ unique upgrades** including base stats and character-specific abilities
- **Individual card rerolling** system with strategic choices
- **No duplicate upgrades** in the same selection

### **Procedural World**
- **Large scrolling map** (3200x2400 pixels) with smooth camera following
- **Procedurally generated terrain** with stone borders and grass interior
- **Dynamic enemy spawning** with increasing difficulty over time

### **Enemy Variety**
Four distinct Bufo enemy types with unique stats and behaviors:
- **Dancing Bufo**: Common, balanced stats (Health: 2, Speed: 60)
- **Clown Bufo**: Moderate, tanky (Health: 3, Speed: 45)
- **Pog Bufo**: Fast but weak (Health: 1, Speed: 80)
- **Eyes Bufo**: Rare and tough (Health: 4, Speed: 40)

### **Full Controller Support**
- **Xbox Controller** fully supported with smart device filtering
- **Dual input methods**: Both D-Pad and Left Analog Stick for navigation
- **Complete menu navigation**: Character selection, upgrade screens, and gameplay
- **Visual feedback**: Yellow highlighting shows controller selection

## 🎯 Controls

### **Keyboard & Mouse**
- **WASD / Arrow Keys**: Move character
- **Mouse**: Click to select characters/upgrades
- **F1**: Toggle debug hitbox display

### **Xbox Controller**
- **Left Stick**: Move character / Navigate menus
- **D-Pad**: Navigate menus (alternative to stick)
- **A Button**: Select character/upgrade
- **X Button**: Reroll individual upgrade cards
- **Y Button**: Toggle debug hitbox display

## 🚀 Character Abilities

### **Stab Bufo - Toxic Aura**
- **Base**: Damages and knocks back nearby enemies in 80px radius
- **Upgrades**: 
  - *Toxic Expansion*: Increases aura radius
  - *Toxic Potency*: Increases aura damage

### **Wizard Bufo - Starfall**
- **Base**: Casts 3 homing stars that damage and confuse enemies
- **Upgrades**:
  - *Star Shower*: +2 additional stars per cast
  - *Mind Scramble*: +1.5 seconds confusion duration

### **Goose Bufo - Goose Guard**
- **Base**: 2 orbiting geese damage enemies and provide protection
- **Upgrades**:
  - *Goose Squadron*: +1 additional orbiting goose
  - *Extended Formation*: Increases orbit radius

## ⚡ Base Upgrades

- **⚔️ Ability Power**: +25% ability damage
- **⏰ Cooldown Reduction**: -15% ability cooldowns
- **💨 Swift Movement**: +10% movement speed
- **💚 Regeneration**: +2 HP per second
- **❤️ Vitality**: +20 maximum health

## 🛠️ Technical Features

### **Modern Tech Stack**
- **Phaser 3**: Game engine with WebGL rendering
- **Matter.js**: Physics engine for realistic collisions
- **Vite**: Fast development and build tooling
- **ES6 Modules**: Clean, modular code architecture

### **Performance Optimizations**
- **Efficient collision detection** with properly sized hitboxes
- **Object pooling** for bullets and effects
- **Smooth camera system** with deadzone and bounds
- **Optimized rendering** with depth layering

### **Quality of Life**
- **Visual upgrade highlighting** for controller users
- **Smart gamepad detection** (filters out audio devices)
- **Responsive UI** that works with both input methods
- **Debug mode** for development and testing

## 🎨 Visual Design

- **Pixel-perfect sprites** from all-the.bufo.zone
- **Smooth animations** and particle effects
- **Clear visual feedback** for all interactions
- **Accessible UI** with high contrast and readable fonts

## 📱 Platform Support

- **Web Browser**: Runs in any modern browser with WebGL support
- **Desktop**: Full keyboard and mouse support
- **Controller**: Xbox controller support with automatic detection
- **Mobile**: Touch controls (future enhancement)

## 🚧 Development

### **Prerequisites**
- Node.js 16+ 
- npm or yarn

### **Setup**
```bash
# Clone the repository
git clone <repository-url>
cd bufo-blaster

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### **Project Structure**
```
bufo-blaster/
├── src/
│   ├── main.js          # Game initialization
│   └── scenes/
│       └── GameScene.js # Main game logic
├── public/
│   └── assets/          # Game assets
│       ├── enemies/     # Enemy sprites
│       ├── map/         # Tilemap assets
│       └── sfx/         # Sound effects
└── package.json
```

## 🎯 Game Balance

### **Difficulty Scaling**
- **Enemy Health**: +20% per player level
- **Enemy Speed**: +20% per player level  
- **Spawn Rate**: Increases over time
- **XP Requirements**: 1.5x multiplier per level

### **Upgrade Balance**
- **One reroll per level** for strategic decision-making
- **No duplicate upgrades** prevents overpowered combinations
- **Character-specific upgrades** encourage diverse playstyles

## 🐛 Debug Features

- **F1 / Y Button**: Toggle hitbox visualization
- **Red circles**: Show actual collision areas
- **Visual feedback**: See exactly where damage occurs

## 🎵 Audio

- **Retro sound effects** for all game actions
- **Background music** loop for atmosphere
- **Audio feedback** for hits, pickups, and abilities

## 🏆 Future Enhancements

- **More characters** with unique abilities
- **Additional enemy types** and boss encounters
- **Power-up items** and temporary effects
- **Leaderboards** and score tracking
- **Mobile touch controls**
- **Save system** for persistent progression

## 📄 License

This project is open source. Sprite assets are courtesy of all-the.bufo.zone.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Built with ❤️ for the Bufo community**
