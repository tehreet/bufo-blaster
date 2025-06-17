# Bufo Blaster

Browser-based survival game where you play as different Bufo characters, fight enemies, and face epic boss battles.

## Quick Start

**Play**: Open `index.html` in any modern web browser
**Develop**: Edit files, refresh browser to see changes

No build process, no dependencies, no setup required.

## How to Play

### Character Selection
- **Stab Bufo**: Melee bruiser with damaging aura and knockback
- **Wizard Bufo**: Ranged caster with starfall AOE that confuses enemies  
- **Goose Bufo**: Summoner with orbiting geese that convert enemies to allies

### Controls
- **Movement**: WASD or Arrow Keys
- **Gamepad**: Left stick to move, A/B for menus
- **Pause**: Enter or Space

### Gameplay Loop
1. Choose character and survive waves of enemies
2. Collect XP orbs to level up and get upgrades
3. Face special enemies every few levels
4. **Level 7**: Epic mega boss fight with strategic pillar system

### Mega Boss Strategy
- 4 pillars spawn in corners when mega boss appears
- Use character abilities to destroy ALL pillars
- Only then can you damage the mega boss
- Boss uses laser eyes, lava cracks, and enemy empowerment

## Development

### File Structure
```
bufo-blaster/
├── index.html          # Entry point
├── style.css           # Basic styling
├── js/
│   ├── main.js          # Bootstrap
│   ├── constants.js     # Game configuration
│   ├── gameState.js     # State management
│   ├── gameCore.js      # Main game loop
│   ├── entities.js      # Player, enemies, abilities
│   ├── input.js         # Keyboard/gamepad handling
│   ├── ui.js            # HUD and visual effects
│   ├── upgrades.js      # Level-up system
│   └── assetLoader.js   # Image/audio loading
└── sfx/                 # Audio files
```

### Core Systems

**Game Loop** (`gameCore.js`)
- Matter.js physics engine
- 60fps update cycle
- Collision detection
- Game state management

**Entity System** (`entities.js`)
- Player characters with unique abilities
- Enemy types with special behaviors
- Projectiles, XP orbs, boss mechanics
- Mega boss pillar system

**Upgrade System** (`upgrades.js`)
- Character-specific upgrades
- Progressive difficulty scaling
- Balanced risk/reward mechanics

### Adding Content

**New Enemy Type**:
1. Add to `ENEMY_TYPES` in `constants.js`
2. Add properties in `getEnemyProperties()` in `entities.js`
3. Add spawn logic in `determineEnemyType()`
4. Add special behavior in `updateSpecialEnemyEffects()`

**New Character**:
1. Add to `CHARACTERS` in `constants.js`
2. Add ability logic in `entities.js`
3. Add UI rendering in `ui.js`
4. Add upgrades in `upgrades.js`

**New Boss Ability**:
1. Add constants to `GAME_CONFIG`
2. Add ability logic in `updateMegaBossAbilities()`
3. Add visual effects in `ui.js`

### Physics

Uses Matter.js for:
- Collision detection (player, enemies, projectiles)
- Entity movement and boundaries
- Static bodies (pillars, walls)
- Sensor triggers (auras, AOE abilities)

### Asset Loading

- Images loaded from external URLs
- Fallback colors if images fail
- Audio preloaded for performance
- No asset bundling required

## Design Philosophy

### Gameplay
- **Immediate Action**: No loading screens or complex menus
- **Clear Progression**: Visual feedback for all mechanics
- **Strategic Depth**: Each character plays differently
- **Boss Encounters**: Mechanics-based fights, not damage sponges

### Code Architecture
- **Modular**: Each system in separate files
- **Readable**: Descriptive names, clear structure
- **Debuggable**: Console logging for complex systems
- **Extensible**: Easy to add content without breaking existing systems

### Performance
- **Client-Side Only**: No server required
- **Efficient Rendering**: Canvas-based with optimized draw calls
- **Memory Management**: Cleanup of off-screen entities
- **Responsive**: Smooth 60fps on modern browsers

## Contributing

1. Fork the repo
2. Make changes (no build step needed)
3. Test by opening `index.html`
4. Submit pull request

Keep changes focused and test thoroughly. The game should work immediately after any code changes.
