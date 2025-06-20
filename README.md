# 🐸 Bufo Blaster

A fast-paced action roguelike game featuring three unique Bufo characters, each with distinct abilities and playstyles. Battle through waves of enemies, collect upgrades, and survive as long as possible in this Vampire Survivors-inspired adventure!

## 🎮 Game Features

### **Three Unique Characters (Easily Expandable!)**
- **🛡️ Shield Bufo**: Defensive tank with shield bash attacks that push enemies away
- **🧙 Magician Bufo**: Ranged caster with starfall spells that rain down from above
- **🦇 Bat Bufo**: Agile fighter with boomerang attacks that stun and damage enemies

### **Dynamic Upgrade System**
- **XP-based leveling** starting at 100 XP, scaling 1.5x per level
- **Character-specific upgrades** dynamically loaded from each character class
- **Individual card rerolling** with limited rerolls per level
- **No duplicate stat types** in the same upgrade selection
- **Boss waves** every 5 levels for extra challenge

### **Procedural World**
- **Large scrolling map** (3200x2400 pixels) with smooth camera following
- **Tilemap-based terrain** with grass and dirt textures
- **Dynamic enemy spawning** with increasing difficulty and spawn rates
- **Boundary constraints** keep players within the world

### **Enemy Variety**
Seven distinct enemy types with unique stats, behaviors, and special effects:
- **💀 Hazmat Bufo**: Poison on contact (Health: 4, Speed: 90) - *Causes poison damage over time*
- **🤡 Clown Bufo**: Balanced stats (Health: 3, Speed: 45) - *Standard enemy*
- **😮 Pog Bufo**: Fast but weak (Health: 1, Speed: 80) - *Speed demon*
- **😬 Teeth Bufo**: Regenerating bruiser (Health: 6, Speed: 65) - *Health regeneration + extra damage*
- **👥 Mob Bufo**: Rare and very tough (Health: 6, Speed: 50) - *Boss-tier enemy*
- **🧛 Vampire Bufo**: Fast with bleed effect (Health: 5, Speed: 100) - *Causes bleeding + health regen*
- **🐔 Chicken Bufo**: Ranged attacker (Health: 3, Speed: 40) - *Shoots egg projectiles*

### **Full Controller Support**
- **Xbox Controller** fully supported with smart device filtering
- **Complete menu navigation**: Character selection, upgrade screens, and gameplay
- **Visual feedback**: White highlighting shows controller selection
- **Debug controls**: Controller buttons for debug features

## 🎯 Controls

### **Keyboard & Mouse**
- **WASD / Arrow Keys**: Move character
- **Mouse**: Click to select characters/upgrades, pause game
- **ESC**: Pause/Resume game
- **F1**: Toggle debug hitbox display
- **F2**: Toggle stats debug display
- **F3**: Test status effects (debug)
- **F4**: Toggle background music
- **F5**: Show asset loading status

### **Xbox Controller**
- **Left Stick**: Move character / Navigate menus
- **D-Pad**: Navigate menus (alternative to stick)
- **A Button**: Select character/upgrade
- **X Button**: Reroll individual upgrade cards
- **Y Button**: Toggle debug hitbox display
- **Select Button**: Toggle stats debug display
- **Start Button**: Pause/Resume game

## 🚀 Character Abilities

### **Shield Bufo - Shield Bash**
- **Base Stats**: 150 HP, 3 Armor, 1.0 HP Regen, 3.5 Move Speed
- **Ability**: Damages and knocks back enemies within 100px radius every 800ms
- **Damage**: 1.2 base damage with horizontal knockback
- **Upgrades**: 
  - *Shield Slam*: +25% shield bash damage
  - *Rapid Bash*: 40% faster shield bash cooldown
  - *Shield Sweep*: +50% shield bash range
  - *Fortress Form*: +60 health and +3 armor
  - *Shield Blessing*: Double health regeneration

### **Magician Bufo - Starfall**
- **Base Stats**: 100 HP, 0 Armor, 0 HP Regen, 5.0 Move Speed
- **Ability**: Casts 3 homing stars that fall from above every 1500ms
- **Damage**: 2.0 per star with 100px explosion radius
- **Upgrades**:
  - *Meteor Shower*: +1 additional star per cast
  - *Stellar Power*: +18.75% star damage
  - *Greater Impact*: +50% star explosion radius
  - *Arcane Haste*: 40% faster starfall cooldown

### **Bat Bufo - Boomerang Toss**
- **Base Stats**: 90 HP, 0 Armor, 0 HP Regen, 5.5 Move Speed
- **Ability**: Throws a boomerang that travels 200px and returns every 2500ms
- **Damage**: 2.5 damage with enemy stunning
- **Upgrades**:
  - *Sharpened Boomerang*: +25% boomerang damage
  - *Quick Throw*: 40% faster boomerang cooldown
  - *Aerodynamic Design*: +50% boomerang range
  - *Stunning Impact*: Extended stun duration to 2 seconds
  - *Bat Agility*: +30% move speed and +25 health

## ⚡ Generic Upgrades

### **Survival Upgrades**
- **❤️ +30 Health**: Increases maximum health by 30 points
- **🛡️ +2 Armor**: Reduces incoming damage by 2
- **💚 +1 Health Regen**: Regenerates 1 health per second

### **Ability Upgrades**
- **⚔️ +12.5% Ability Damage**: Increases ability damage by 12.5%
- **⏰ -30% Ability Cooldown**: Reduces ability cooldowns by 30%
- **📏 +40% Ability Radius**: Increases ability area of effect by 40%
- **🧲 +50% Pickup Range**: Increases XP magnetism range by 50%

*Note: Movement speed upgrades are now character-specific only (e.g., Bat Bufo's "Bat Agility")*

## 🛠️ Technical Features

### **Modern Tech Stack**
- **Phaser 3.90.0**: Game engine with WebGL rendering
- **Matter.js 0.20.0**: Physics engine for realistic collisions
- **Vite 6.3.5**: Fast development and build tooling
- **ES6 Modules**: Clean, modular code architecture

### **Plugin-Based Character System**
- **Modular character architecture**: Each character is a separate class extending `BaseCharacter`
- **Dynamic collision detection**: Collision handlers automatically registered from character classes
- **Character registry**: Centralized management of all character data and implementations
- **Automatic cleanup**: Characters manage their own timers, groups, and state
- **Scalable design**: Adding new characters requires minimal code changes

### **Advanced Systems**
- **Modular architecture**: Separate systems for characters, enemies, stats, UI, upgrades, etc.
- **Status effect system**: Visual indicators for poison, bleeding, and other effects
- **Audio management**: Background music with user interaction handling
- **Asset management**: Handles both static PNG and animated GIF overlays
- **Input management**: Unified keyboard, mouse, and gamepad input

### **Performance Optimizations**
- **Optimized update loops**: Replaced forEach with for loops for 60fps performance
- **Efficient collision detection** with properly sized hitboxes (12.5% sprite ratio)
- **Fixed diagonal movement speed**: Vector normalization prevents speed boost
- **Smooth camera system** with world bounds
- **Clean console output**: Removed debug spam for production-ready performance
- **Memory management** with proper cleanup of physics bodies and DOM elements

### **Quality of Life**
- **Visual upgrade highlighting** for controller users
- **Smart gamepad detection** (filters out audio devices like headsets)
- **Comprehensive debug tools** with F-key shortcuts
- **Pause system** that works during gameplay but not during menus
- **Physics bug fixes**: Restart properly re-enables physics world

## 🎨 Visual & Audio Design

- **Pixel-perfect sprites** with 2x scaling for better visibility
- **Animated GIF overlays** for character movement (where available)
- **Particle effects** and visual feedback for all abilities
- **Status effect indicators** that stack above the player
- **Retro sound effects** for game actions
- **Looping background music** with autoplay handling

## 📱 Platform Support

- **Web Browser**: Runs in any modern browser with WebGL support
- **Desktop**: Full keyboard and mouse support
- **Controller**: Xbox controller support with device filtering
- **Vercel Deployment**: Ready for web deployment with proper headers

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

# Preview production build
npm run preview
```

### **Project Structure**
```
bufo-blaster/
├── src/
│   ├── main.js              # Game initialization and config
│   ├── scenes/
│   │   └── GameScene.js     # Main game scene logic
│   ├── characters/          # 🆕 Modular character classes
│   │   ├── BaseCharacter.js # Base class for all characters
│   │   ├── CharacterRegistry.js # Character data and class registry
│   │   ├── ShieldBufo.js    # Shield Bufo implementation
│   │   ├── WizardBufo.js    # Wizard Bufo implementation
│   │   └── BatBufo.js       # Bat Bufo implementation
│   ├── systems/             # Game systems
│   │   ├── CharacterSystem.js # 🔄 Refactored to use plugin system
│   │   ├── EnemySystem.js   # 🔄 Performance optimized
│   │   ├── StatsSystem.js   # 🔄 Cleaned up logging
│   │   ├── UISystem.js      # 🔄 Dynamic collision handling
│   │   ├── UpgradeSystem.js # 🔄 Uses character-defined upgrades
│   │   └── StatusEffectSystem.js
│   └── utils/               # Utility classes
│       ├── InputManager.js  # 🔄 Fixed diagonal movement
│       ├── AssetManager.js  # 🔄 Performance optimized
│       ├── AudioManager.js
│       ├── DebugUtils.js
│       └── Logger.js        # 🔄 Categorized logging system
├── public/
│   └── assets/              # Game assets
│       ├── characters/      # Character sprites (PNG/GIF)
│       ├── enemies/         # Enemy sprites
│       ├── map/             # Tilemap and tileset assets
│       └── sfx/             # Sound effects and music
└── package.json
```

## 🆕 Adding New Characters

### **How to Add a New Character (3 Simple Steps!)**

The new plugin-based system makes adding characters incredibly easy:

#### **Step 1: Create Character Class**
Create a new file in `src/characters/` (e.g., `ThunderBufo.js`):

```javascript
import BaseCharacter from './BaseCharacter.js';

class ThunderBufo extends BaseCharacter {
    setupAbility() {
        // Initialize your character's ability groups and state
        this.createAbilityGroup('lightning');
        this.setAbilityState('lastLightningTime', 0);
    }

    updateAbility() {
        // Handle ability logic (called every frame)
        const currentTime = this.scene.time.now;
        const playerStats = this.getPlayerStats();
        // ... your ability logic here
    }

    getUpgrades() {
        // Define character-specific upgrades
        return [
            { 
                id: 'thunder_power', 
                name: 'Thunder Strike', 
                description: 'Lightning damage increased by 30%', 
                type: 'character', 
                statType: 'damage',
                effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.3) 
            },
            // ... more upgrades
        ];
    }

    getCollisionHandlers() {
        // Register collision detection for your projectiles
        return [
            { 
                projectileLabel: 'lightning', 
                handler: this.lightningHitEnemy.bind(this) 
            }
        ];
    }

    lightningHitEnemy(lightning, enemy) {
        // Handle what happens when your projectile hits an enemy
        this.damageEnemy(enemy, lightning.damage);
    }
}

export default ThunderBufo;
```

#### **Step 2: Register in CharacterRegistry**
Add your character to `src/characters/CharacterRegistry.js`:

```javascript
// Import your character
import ThunderBufo from './ThunderBufo.js';

// Add character data
const CHARACTER_DATA = {
    // ... existing characters
    THUNDER_BUFO: {
        id: 'thunder',
        name: 'Thunder Bufo',
        description: 'Electric mage with chain lightning',
        abilityName: 'Lightning Strike',
        abilityDescription: 'Strikes enemies with chaining lightning bolts',
        color: 0x00ffff,
        sprite: 'thunder-bufo',
        baseStats: {
            health: 110,
            armor: 1,
            healthRegen: 0.5,
            abilityDamage: 3.0,
            abilityCooldown: 1800,
            abilityRadius: 150,
            pickupRange: 90,
            projectileCount: 2,
            moveSpeed: 4.5
        }
    }
};

// Add to class mapping
const CHARACTER_CLASSES = {
    // ... existing characters
    'thunder': ThunderBufo
};
```

#### **Step 3: Add Sprite Asset**
Add your character sprite to `public/assets/characters/thunder-bufo.png`

#### **That's It! 🎉**
Your character will automatically:
- ✅ Appear in character selection
- ✅ Handle collisions dynamically  
- ✅ Show upgrades in upgrade system
- ✅ Clean up properly on restart/death
- ✅ Work with all existing systems

### **Character Development Tips**

#### **BaseCharacter Helper Methods**
The `BaseCharacter` class provides many helpful methods:

```javascript
// Ability management
this.createAbilityGroup('projectiles');     // Create physics group
this.getAbilityGroup('projectiles');        // Get physics group
this.createAbilityTimer('cooldown', config); // Create timer
this.setAbilityState('key', value);         // Store state data

// Enemy interaction
this.getEnemiesInRange(x, y, radius);       // Find nearby enemies
this.getVisibleEnemies();                   // Get enemies on screen
this.damageEnemy(enemy, damage);            // Deal damage safely

// Visual effects
this.createVisualEffect(x, y, config);      // Create explosion effects

// Stats access
this.getPlayerStats();                      // Current player stats
this.getPlayerProgression();                // XP, level, etc.
```

#### **Ability Design Patterns**

1. **Timer-based abilities** (like Shield Bash): Use `createAbilityTimer()`
2. **Cooldown-based abilities** (like Starfall): Check time in `updateAbility()`
3. **Projectile abilities** (like Boomerang): Use physics groups and collision handlers
4. **Instant abilities** (like Lightning): Apply effects immediately with visuals

#### **Testing Your Character**
1. Use **F1** to see hitboxes and collision detection
2. Use **F2** to monitor stats and multipliers
3. Test all upgrades to ensure they work correctly
4. Verify cleanup by restarting the game multiple times

## 🎯 Game Balance

### **Difficulty Scaling**
- **Enemy Health**: +20% per player level
- **Boss Wave Health**: +25% bonus health for boss wave enemies
- **Enemy Speed**: Varies by type, scaled by level
- **Spawn Rate**: Decreases by 50ms per level (minimum 400ms)
- **XP Requirements**: 1.5x multiplier per level (starts at 100 XP)
- **Boss Waves**: Every 5 levels with 25% bonus health enemies

### **Status Effects**
- **Poison**: 4 damage every 0.8 seconds for 5 seconds (from Hazmat Bufo)
- **Bleed**: 3 damage every 1 second for 4 seconds (from Vampire Bufo)
- **Stun**: Prevents enemy movement (from Bat Bufo boomerang)
- **Invincibility**: 1 second after taking damage

### **Special Mechanics**
- **XP Magnet Orbs**: 0.5% chance per enemy kill, increases pickup range dramatically
- **Enemy Regeneration**: Some enemies heal over time
- **Ranged Enemies**: Chicken Bufo shoots egg projectiles with 400px range

## 🐛 Debug Features

### **Debug Controls**
- **F1 / Y Button**: Toggle hitbox visualization (red circles)
- **F2 / Select**: Toggle comprehensive stats debug panel
- **F3**: Test status effects (adds poison, stunned, slowed)
- **F4**: Toggle background music on/off
- **F5**: Show asset loading status and diagnostics

### **Debug Information**
- **Stats Panel**: Shows all character stats, multipliers, and bonuses
- **Status Indicators**: Visual effects for poison, bleeding, etc.
- **Hitbox Visualization**: See exact collision areas
- **Performance Monitoring**: FPS and system status

## 🎵 Audio System

- **Background music loop** with autoplay policy handling
- **User interaction detection** to start music after first click/key
- **Volume controls** (0.3 music, 0.5 SFX by default)
- **Pause/resume functionality** tied to game state

## 🚀 Deployment

### **Vercel Configuration**
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **COOP/COEP Headers**: Configured for SharedArrayBuffer support

### **Build Process**
- **Vite bundling** with ES6 module support
- **Asset optimization** with Sharp for image processing
- **Production builds** with minification and tree-shaking

## 🏆 Recent Major Improvements

### **🔄 Character System Refactor (v2.0)**
- **Plugin-based architecture**: Characters are now individual classes
- **Scalable design**: Adding new characters requires minimal code
- **Dynamic collision detection**: No more hard-coded collision handlers
- **Automatic cleanup**: Proper memory management and timer cleanup

### **⚡ Performance Optimizations**
- **60fps optimization**: Replaced forEach with for loops in update cycles
- **Reduced console spam**: Removed 80+ debug statements for production
- **Fixed diagonal movement**: Vector normalization prevents speed boost
- **Physics bug fixes**: Restart properly re-enables physics world

### **🎮 Gameplay Balance**
- **Movement speed rebalance**: Now character-specific only
- **Upgrade system cleanup**: No duplicate stat types in selections
- **Collision improvements**: Better hitbox accuracy and error handling

## 🏆 Future Enhancements

- **Additional characters** using the new plugin system
- **More enemy types** and special behaviors
- **Save system** for persistent progression
- **Leaderboards** and score tracking
- **Mobile touch controls**
- **More status effects** and interactive mechanics
- **Sound effect integration** for all game actions

## 🤝 Contributing

Contributions are welcome! The new modular character system makes it especially easy to contribute new characters.

### **Contributing a New Character**
1. Follow the **Adding New Characters** guide above
2. Ensure your character has unique gameplay mechanics
3. Test thoroughly with all upgrades and interactions
4. Submit a pull request with character sprite assets

### **Known Issues**
- Some animated GIF overlays may not load on all browsers
- Gamepad support may vary by browser and controller type
- Audio may require user interaction on some browsers due to autoplay policies

## 📄 License

This project is open source. Sprite assets are courtesy of all-the.bufo.zone.

---

**Built with ❤️ for the Bufo community**

*Ready to add 7 more characters? The new system makes it easy! 🚀*
