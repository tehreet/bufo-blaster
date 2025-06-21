# 🐸 Bufo Blaster

A modern, fast-paced 2D survival action game built with Phaser 3, featuring an innovative modular character system, advanced enemy AI framework, and polished hybrid UI. Battle through endless waves of unique Bufo enemies, collect powerful upgrades, and survive as long as possible in this highly optimized Vampire Survivors-inspired adventure!

## 🎮 Game Features

### **🎯 5 Unique Characters (Fully Modular System)**
- **🛡️ Shield Bufo**: Defensive tank with shield bash attacks and health regeneration
- **🧙 Wizard Bufo**: Ranged caster with homing starfall spells from above  
- **🦆 Duck Bufo**: Balanced fighter with versatile combat abilities
- **🦇 Bat Bufo**: Agile speedster with stunning boomerang attacks
- **🧃 Juice Bufo**: Fast character with unique liquid-based abilities

*New characters can be added with just 3 simple files - the modular system handles everything else!*

### **🎭 9 Distinct Enemy Types (Advanced AI Framework v2.0)**
- **🧪 Hazmat Bufo**: Poison aura specialist - damages over time with toxic effects
- **🤡 Clown Bufo**: Standard balanced enemy with consistent threat level
- **😮 Pog Bufo**: Speed demon - fast but fragile swarm enemy
- **😬 Teeth Bufo**: Regenerating berserker with self-healing and rage mode
- **👥 Mob Bufo**: Rare tank with massive health pools
- **🧛 Vampire Bufo**: Blood magic specialist with life steal and bleed effects
- **🐔 Chicken Bufo**: Ranged artillery with explosive egg projectiles
- **👻 Ghost Bufo**: Damage reflection specialist - dangerous to attack directly
- **💥 Meltdown Bufo**: Explosive suicide bomber with countdown mechanics

*Enemy framework v2.0 includes automatic safety systems, centralized visual effects, and enhanced AI patterns*

### **🎨 Modern Hybrid UI System**
- **HTML5 + CSS3 Interface**: Beautiful Bulma-powered menus with glassmorphism effects
- **Responsive Design**: Works perfectly on desktop, mobile, and all screen sizes
- **Smooth Animations**: Fade transitions, hover effects, and visual feedback
- **Font Awesome Icons**: Professional iconography throughout the interface
- **High Contrast Text**: White text with proper readability on all backgrounds

### **🎮 Full Input Support**
- **Keyboard & Mouse**: Complete WASD/Arrow key movement with mouse UI interaction
- **Xbox Controller**: Full gamepad support with smart device filtering (excludes headsets)
- **Cross-Platform**: Consistent controls across all input methods
- **Visual Feedback**: Controller selection highlighted with blue borders
- **Input Debouncing**: Prevents accidental double-inputs and ensures smooth navigation

## 🎯 Character Abilities & Stats

### **🛡️ Shield Bufo - "Shield Bash"**
- **Base Stats**: 150 HP, 3 Armor, 1.0 HP/sec Regen, 3.5 Speed
- **Ability**: Area damage + knockback every 800ms in 100px radius
- **Character Upgrades**: Shield Slam, Rapid Bash, Shield Sweep, Fortress Form, Shield Blessing

### **🧙 Wizard Bufo - "Starfall"**
- **Base Stats**: 100 HP, 0 Armor, 0 HP/sec Regen, 5.0 Speed
- **Ability**: 3 homing stars fall from above every 1500ms
- **Character Upgrades**: Meteor Shower, Stellar Power, Greater Impact, Arcane Haste, Mystic Reserves

### **🦇 Bat Bufo - "Boomerang Toss"**
- **Base Stats**: 90 HP, 0 Armor, 0 HP/sec Regen, 5.5 Speed
- **Ability**: Boomerang travels 200px out and back every 2500ms
- **Character Upgrades**: Sharpened Boomerang, Quick Throw, Aerodynamic Design, Stunning Impact, Bat Agility

## ⚡ Universal Upgrades

- **❤️ +30 Health**: Increases maximum health by 30 points
- **🛡️ +2 Armor**: Reduces all incoming damage by 2
- **💚 +1 Health Regen**: Regenerates 1 health per second
- **⚔️ +12.5% Ability Damage**: Increases all ability damage by 12.5%
- **⏰ -30% Ability Cooldown**: Reduces all ability cooldowns by 30%
- **📏 +40% Ability Radius**: Increases all ability areas of effect by 40%
- **🧲 +50% Pickup Range**: Increases XP magnetism range by 50%

## 🎮 Controls

### **Keyboard & Mouse**
- **WASD / Arrow Keys**: Character movement (diagonal normalization prevents speed boost)
- **Mouse Click**: Select characters, upgrades, or pause game during play
- **ESC**: Pause/Resume game (works only during gameplay)
- **F1**: Toggle debug hitbox visualization
- **F2**: Toggle comprehensive stats debug panel

### **Xbox Controller** 
- **Left Stick / D-Pad**: Character movement / Menu navigation
- **A Button**: Select character, upgrade, or menu option
- **X Button**: Reroll individual upgrade cards
- **Y Button**: Toggle debug hitbox visualization
- **Start Button**: Pause/Resume game

## 🏗️ Technical Architecture

### **🛠️ Modern Tech Stack**
- **Phaser 3.90.0**: WebGL-accelerated game engine with ES6 support
- **Matter.js 0.20.0**: Advanced 2D physics engine for realistic collisions
- **Vite 6.3.5**: Lightning-fast development server and production builds
- **Bulma CSS 0.9.4**: Modern CSS framework for responsive UI design  
- **Font Awesome 6.4.0**: Professional icon library for consistent UI

### **🔧 System Architecture**

#### **Core Systems**
- **GameScene.js**: Main game loop, physics world, and system coordination
- **CharacterSystem.js**: Modular character management with plugin architecture
- **EnemySystem.js**: Advanced enemy AI with safety systems and visual effects
- **StatsSystem.js**: Comprehensive stats tracking with multipliers and bonuses
- **UpgradeSystem.js**: Dynamic upgrade generation with character-specific trees
- **StatusEffectSystem.js**: Visual status effects with proper cleanup

#### **Input & UI Systems**
- **InputManager.js**: Unified keyboard, mouse, and gamepad input handling
- **HTMLUIManager.js**: Modern HTML/CSS interface with Bulma framework
- **UISystem.js**: Hybrid Phaser + HTML UI coordination
- **AudioManager.js**: Sound effects and background music with autoplay handling

#### **Utility Systems**
- **AssetManager.js**: Handles static PNG and animated GIF sprite overlays
- **Logger.js**: Categorized logging system (UI, INPUT, AUDIO, ASSET, SYSTEM)
- **DebugUtils.js**: Comprehensive debug tools and performance monitoring

## 🚀 Performance Optimizations

### **60fps Guaranteed Performance**
- **Optimized Update Loops**: Replaced `forEach` with `for` loops in critical paths
- **Efficient Enemy Processing**: Safety checks prevent crashes during scene transitions
- **Physics Optimization**: Proper collision body cleanup and memory management
- **Clean Console Output**: Eliminated 100+ debug logs that were spamming every frame

### **Memory Management**
- **Automatic Cleanup**: Characters and enemies clean up their own timers and groups
- **Physics Body Disposal**: Proper Matter.js body removal prevents memory leaks
- **Event Listener Cleanup**: All event listeners properly removed on scene transitions
- **DOM Element Management**: HTML overlays cleaned up during state changes

## 🏆 Advanced Game Systems

### **🤖 Enemy Framework v2.0**

#### **Automatic Safety Systems**
- **Race Condition Prevention**: `isOperationSafe()` validation for all enemy operations
- **Timer Crash Protection**: `wrapTimerCallback()` automatically adds safety to all timers
- **Position Validation**: Built-in checks prevent undefined property access crashes
- **Scene Transition Safety**: Enemies automatically clean up during state changes

#### **Specialized Enemy Behaviors**
- **Vampire Bufo**: Life steal mechanics with dynamic blood effects and health regen
- **Ghost Bufo**: Damage reflection with ghostly particle auras
- **Meltdown Bufo**: Countdown explosion system with visual agitation effects
- **Chicken Bufo**: Ranged projectile AI with predictive targeting

### **💊 Status Effect System**
- **Visual Indicators**: Stack above player with distinct colors and icons
- **Proper Duration Tracking**: Timer-based effects with automatic cleanup
- **Multiple Effect Support**: Poison, bleeding, and custom effects can stack
- **Performance Optimized**: No memory leaks or infinite timers

## 🔧 Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd bufo-blaster
npm install

# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

## 👨‍💻 Adding New Characters (3 Simple Steps!)

### **1. Create Character Class** (`src/characters/NewBufo.js`)
```javascript
import BaseCharacter from './BaseCharacter.js';

class NewBufo extends BaseCharacter {
    setupAbility() {
        this.createAbilityGroup('projectiles');
        this.setAbilityState('lastAttackTime', 0);
    }

    updateAbility() {
        // Your ability logic here
    }

    getUpgrades() {
        return [
            { 
                id: 'power_boost', 
                name: 'Power Boost', 
                description: '+25% ability damage', 
                type: 'character', 
                statType: 'damage',
                effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.25)
            }
        ];
    }

    getCollisionHandlers() {
        return [
            { projectileLabel: 'newProjectile', handler: this.projectileHitEnemy.bind(this) }
        ];
    }
}

export default NewBufo;
```

### **2. Register in CharacterRegistry** (`src/characters/CharacterRegistry.js`)
```javascript
import NewBufo from './NewBufo.js';

const CHARACTER_DATA = {
    NEW_BUFO: {
        id: 'new',
        name: 'New Bufo',
        description: 'Amazing new character',
        sprite: 'new-bufo',
        baseStats: { /* stats */ }
    }
};

const CHARACTER_CLASSES = {
    'new': NewBufo
};
```

### **3. Add Sprite** (`public/assets/characters/new-bufo.png`)

**That's it!** Your character automatically:
- ✅ Appears in character selection with proper styling
- ✅ Handles collisions through the collision system
- ✅ Shows character-specific upgrades in the upgrade screen
- ✅ Cleans up properly on restart/death

## 🐛 Debug Features

- **F1 / Y Button**: Hitbox visualization (red circles show collision areas)
- **F2 / Select**: Comprehensive stats panel with real-time updates
- **Live Stats Panel**: All character stats, multipliers, bonuses, and progression
- **Performance Monitor**: FPS counter, system status, memory usage
- **Error Handling**: Graceful degradation and comprehensive logging

## 🎉 Recent Major Updates

### **🔧 V2.0 System Overhauls**

#### **Enemy Framework v2.0** 
- **Automatic Safety Systems**: Prevents all race condition crashes during scene transitions
- **Enhanced Visual Effects**: Centralized particle systems and explosion management  
- **Smart AI Patterns**: Advanced movement, targeting, and behavior systems
- **Specialized Enemies**: 9 unique enemy types with distinct mechanics

#### **Character Framework v2.0**
- **Plugin Architecture**: Characters are completely modular with automatic system integration
- **Dynamic Collision System**: No more hard-coded collision handlers - all automatic
- **Scalable Design**: Adding new characters requires minimal code changes

#### **Hybrid UI System**
- **HTML5 + CSS3**: Modern interface using Bulma framework with responsive design
- **Glassmorphism Effects**: Beautiful backdrop blur and transparency effects
- **Cross-Platform**: Perfect scaling on desktop, mobile, and all screen sizes

### **⚡ Performance & Stability**
- **60fps Guaranteed**: Optimized update loops with efficient data structures
- **Clean Console**: Eliminated 100+ debug logs that were spamming every frame
- **Memory Management**: Proper cleanup prevents memory leaks and crashes
- **MeltdownBufo Crash Fix**: Resolved position access crashes during explosion
- **Text Readability**: White text with proper contrast in all UI screens
- **Input Debouncing**: Prevents accidental double-inputs and button spam

## 🚀 Future Development

- **Additional Characters**: Expanding the roster using the modular character system
- **More Enemy Types**: Leveraging the enemy framework v2.0 for new behaviors
- **Save System**: Persistent progression and unlockables
- **Mobile Optimization**: Touch controls and mobile-specific UI improvements

## 🤝 Contributing

Contributions welcome! The modular architecture makes it especially easy to contribute new content.

### **Character Contributions**
1. Follow the **Adding New Characters** guide above
2. Ensure unique gameplay mechanics and balanced stats
3. Test thoroughly with all upgrades and edge cases
4. Include high-quality sprite assets (PNG + optional GIF)

### **Bug Reports**
- Use debug tools (F1, F2) to gather information
- Include browser, OS, and input device details
- Provide steps to reproduce and expected vs actual behavior

## 📄 License & Credits

**Open Source Project** - Contributions and modifications welcome

**Sprite Assets**: Courtesy of all-the.bufo.zone Bufo community  
**Audio**: Retro game-inspired sound effects and background music  
**Icons**: Font Awesome 6.4.0 for professional UI iconography  
**Framework**: Built with love using Phaser 3, Matter.js, and modern web technologies

---

**🎮 Ready to join the Bufo Blaster community?**

*With the new modular systems, adding 10 more characters and enemies is easier than ever! 🚀*
