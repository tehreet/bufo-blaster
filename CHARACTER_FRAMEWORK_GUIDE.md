# Character Framework Guide
*A comprehensive guide for adding new playable character bufos to Bufo Blaster*

## Overview

Bufo Blaster uses a modular character framework that makes adding new playable characters straightforward and maintainable. This guide will walk you through the complete process of creating a new character with unique abilities, upgrades, and behaviors.

## Architecture

The character system consists of several key components:

### Core Files
- `BaseCharacter.js` - Abstract base class with common functionality
- `CharacterRegistry.js` - Central registry mapping character IDs to classes and data
- `CharacterSystem.js` - Game system that manages character instances and abilities
- Individual character files (e.g., `WizardBufo.js`, `ShieldBufo.js`)

### Key Features
- **Modular Design**: Each character is a self-contained class
- **Automatic Integration**: Characters are automatically discovered and integrated
- **Helper Methods**: Rich set of utilities for common character operations
- **State Management**: Built-in ability state and timer management
- **Dynamic Collision Handling**: Automatic projectile collision registration
- **Cleanup System**: Automatic resource cleanup when switching characters

## How to Add a New Character

### Step 1: Create Character Data in CharacterRegistry.js

Add your character's data to the `CHARACTER_DATA` object:

```javascript
FROST_BUFO: {
    id: 'frost',
    name: 'Frost Bufo',
    description: 'Ice mage that slows and freezes enemies',
    abilityName: 'Ice Blast',
    abilityDescription: 'Shoots ice shards that slow enemies',
    color: 0x87CEEB, // Sky blue for ice theme
    sprite: 'frost-bufo',
    baseStats: {
        // Core Stats
        health: 110,
        armor: 1,
        healthRegen: 0.5,
        
        // Ability Stats
        abilityDamage: 2.0,
        abilityCooldown: 1800,
        abilityRadius: 120,
        
        // Utility Stats
        pickupRange: 90,
        projectileCount: 2,
        
        // Movement
        moveSpeed: 4.0
    },
    hitboxRadius: 5
}
```

### Step 2: Create Character Class File

Create `src/characters/FrostBufo.js`:

```javascript
import BaseCharacter from './BaseCharacter.js';

class FrostBufo extends BaseCharacter {
    setupAbility() {
        // Initialize ice blast system
        this.createAbilityGroup('iceShards');
        this.setAbilityState('lastBlastTime', 0);
        this.setAbilityState('slowedEnemies', new Map());
    }

    updateAbility() {
        this.updateIceBlasting();
        this.updateIceShards();
        this.updateSlowedEnemies();
    }
    
    // ... implement ability logic
    
    getUpgrades() {
        return [
            {
                id: 'frost_freeze',
                name: 'Deep Freeze',
                description: 'Ice shards can freeze enemies solid',
                type: 'character',
                statType: 'unique',
                effect: () => this.setAbilityState('canFreeze', true)
            }
            // ... more upgrades
        ];
    }
    
    getCollisionHandlers() {
        return [
            { 
                projectileLabel: 'iceShard', 
                handler: this.iceShardHitEnemy.bind(this) 
            }
        ];
    }
}

export default FrostBufo;
```

### Step 3: Register Character Class

In `CharacterRegistry.js`, import and add to `CHARACTER_CLASSES`:

```javascript
import FrostBufo from './FrostBufo.js';

const CHARACTER_CLASSES = {
    'shield': ShieldBufo,
    'wizard': WizardBufo,
    'bat': BatBufo,
    'juice': JuiceBufo,
    'duck': DuckBufo,
    'frost': FrostBufo  // Add your character here
};
```

### Step 4: Add Character Sprite

Place your character sprite in `public/assets/characters/frost-bufo.png` and ensure it's loaded in the game's asset configuration.

### Step 5: Test Your Character

Your new character will automatically appear in the character selection screen and be fully functional with abilities, upgrades, and collision detection.

## Character Patterns

### Projectile-Based Characters

Characters that shoot projectiles (like Wizard Bufo's starfall):

```javascript
updateAbility() {
    this.updateProjectileCasting();
    this.updateProjectileMovement();
}

createProjectile(targetX, targetY) {
    const projectile = this.scene.add.circle(startX, startY, radius, color);
    
    // Add physics
    this.scene.matter.add.gameObject(projectile, {
        shape: 'circle',
        isSensor: true,
        label: 'myProjectile'
    });
    
    // Set velocity toward target
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    this.scene.matter.body.setVelocity(projectile.body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
    });
    
    // Add to group for management
    this.getAbilityGroup('projectiles').add(projectile);
}
```

### Melee/Area Characters

Characters with area-of-effect abilities (like Shield Bufo's bash):

```javascript
executeAreaAbility() {
    const playerStats = this.getPlayerStats();
    const range = playerStats.abilityRadius;
    
    // Create visual effect
    this.createVisualEffect(this.scene.player.x, this.scene.player.y, {
        radius: range,
        color: 0xff0000,
        duration: 400
    });
    
    // Find and affect enemies
    const enemies = this.getEnemiesInRange(
        this.scene.player.x, 
        this.scene.player.y, 
        range
    );
    
    enemies.forEach(enemy => {
        this.damageEnemy(enemy, playerStats.abilityDamage);
        // Apply additional effects (knockback, status, etc.)
    });
}
```

### Returning Projectile Characters

Characters with boomerang-like mechanics (like Bat Bufo):

```javascript
updateProjectiles() {
    const projectiles = this.getAbilityGroup('boomerangs').children.entries;
    
    for (const projectile of projectiles) {
        if (!projectile.returning) {
            // Outward flight
            projectile.currentDistance += projectile.speed;
            if (projectile.currentDistance >= projectile.maxDistance) {
                projectile.returning = true;
            }
        } else {
            // Return flight - move toward player
            const angle = Phaser.Math.Angle.Between(
                projectile.x, projectile.y,
                this.scene.player.x, this.scene.player.y
            );
            
            projectile.x += Math.cos(angle) * projectile.speed;
            projectile.y += Math.sin(angle) * projectile.speed;
        }
    }
}
```

### Minion/Summoner Characters

Characters that spawn helping entities (like Duck Bufo):

```javascript
summonMinion() {
    const minion = this.scene.add.sprite(x, y, 'minion-sprite');
    
    // Add AI behavior
    minion.target = this.findNearestEnemy();
    minion.aiState = 'seeking';
    minion.speed = 2;
    
    this.getAbilityGroup('minions').add(minion);
}

updateMinions() {
    const minions = this.getAbilityGroup('minions').children.entries;
    
    for (const minion of minions) {
        this.updateMinionAI(minion);
    }
}
```

## BaseCharacter Helper Methods

### State Management
```javascript
// Store ability-specific data
this.setAbilityState('keyName', value);
const value = this.getAbilityState('keyName');

// Create and manage timers
this.createAbilityTimer('timerName', {
    delay: 1000,
    callback: this.someMethod,
    loop: true
});

// Create and manage object groups
this.createAbilityGroup('groupName');
const group = this.getAbilityGroup('groupName');
```

### Enemy Interaction
```javascript
// Find enemies in range
const enemies = this.getEnemiesInRange(x, y, radius);

// Get all visible enemies
const visibleEnemies = this.getVisibleEnemies();

// Deal damage to enemy
this.damageEnemy(enemy, damageAmount);
```

### Visual Effects
```javascript
// Create visual effect
this.createVisualEffect(x, y, {
    radius: 50,
    color: 0xff0000,
    alpha: 0.6,
    stroke: { width: 2, color: 0xffffff },
    endScale: 2.0,
    duration: 500
});
```

### Stats Access
```javascript
// Get current player stats (with all bonuses applied)
const stats = this.getPlayerStats();
console.log(stats.abilityDamage, stats.abilityCooldown);

// Get player progression info
const progression = this.getPlayerProgression();
console.log(progression.level, progression.xp);
```

## Upgrade System

### Upgrade Types

**Damage Upgrades**
```javascript
{
    id: 'char_power',
    name: 'Power Boost',
    description: 'Ability damage +25%',
    type: 'character',
    statType: 'damage',
    effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.25)
}
```

**Cooldown Upgrades**
```javascript
{
    id: 'char_speed',
    name: 'Quick Cast',
    description: 'Ability cooldown -40%',
    type: 'character',
    statType: 'cooldown',
    effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6)
}
```

**Range/Radius Upgrades**
```javascript
{
    id: 'char_range',
    name: 'Extended Range',
    description: 'Ability range +50%',
    type: 'character',
    statType: 'radius',
    effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5)
}
```

**Unique Upgrades**
```javascript
{
    id: 'char_unique',
    name: 'Special Power',
    description: 'Unlocks unique ability behavior',
    type: 'character',
    statType: 'unique',
    effect: () => {
        this.setAbilityState('hasSpecialPower', true);
        this.scene.statsSystem.addStatBonus('healthBonus', 50);
    }
}
```

## Collision System

### Automatic Registration
Your character's collision handlers are automatically registered when the character is selected. Just implement `getCollisionHandlers()`:

```javascript
getCollisionHandlers() {
    return [
        { 
            projectileLabel: 'myProjectileType', 
            handler: this.myProjectileHitEnemy.bind(this) 
        },
        { 
            projectileLabel: 'anotherProjectile', 
            handler: this.anotherHitHandler.bind(this) 
        }
    ];
}
```

### Collision Handler Implementation
```javascript
myProjectileHitEnemy(projectile, enemy) {
    // Always include safety checks
    if (!projectile || !enemy || !projectile.active || !enemy.active) {
        return;
    }
    
    // Prevent double hits
    if (projectile.hasHit) return;
    projectile.hasHit = true;
    
    // Apply damage
    this.damageEnemy(enemy, projectile.damage);
    
    // Apply status effects
    enemy.slowedUntil = this.scene.time.now + 2000;
    
    // Cleanup projectile
    projectile.destroy();
}
```

## Balancing Guidelines

### Health and Survivability
- **Tank characters**: 120-150+ HP, 2-4+ armor, some health regen
- **Glass cannons**: 80-100 HP, 0-1 armor, no/minimal regen  
- **Balanced**: 100-120 HP, 1-2 armor, moderate regen

### Damage Output
- **High damage, slow**: 3-4+ damage, 2000-3000ms cooldown
- **Moderate damage, fast**: 1.5-2.5 damage, 1000-1800ms cooldown
- **Low damage, very fast**: 1-2 damage, 500-1000ms cooldown

### Movement Speed
- **Agile characters**: 5-6 speed (compensates for low health)
- **Standard**: 4-5 speed (most characters)
- **Tank/Heavy**: 3-4 speed (compensates with high survivability)

### Ability Balance
- Total DPS should be roughly equivalent across characters
- DPS = (Damage per Cast) / (Cooldown in seconds)
- Target DPS range: 1.0 - 2.0 depending on utility/survivability trade-offs

## Testing Your Character

### Basic Functionality Test
1. Select your character in character selection
2. Verify abilities trigger correctly
3. Check collision detection works
4. Test all upgrades apply properly
5. Ensure cleanup works when switching characters

### Balance Testing
1. Compare clear speed against other characters
2. Test survivability in late-game scenarios  
3. Verify upgrade scaling feels meaningful
4. Check ability cooldowns feel responsive

### Edge Case Testing
1. Test ability behavior with no enemies present
2. Verify cleanup prevents memory leaks
3. Test collision handlers with destroyed objects
4. Check behavior at map boundaries

## Common Patterns

### Status Effect Application
```javascript
applyStatusEffect(enemy, effectType, duration) {
    const endTime = this.scene.time.now + duration;
    
    switch(effectType) {
        case 'slow':
            enemy.slowedUntil = endTime;
            enemy.originalSpeed = enemy.speed;
            enemy.speed *= 0.5;
            break;
        case 'freeze':
            enemy.frozenUntil = endTime;
            enemy.originalSpeed = enemy.speed;
            enemy.speed = 0;
            enemy.setTint(0x87CEEB);
            break;
    }
}
```

### Resource Management
```javascript
// Limit active projectiles
createProjectile() {
    const maxProjectiles = this.getPlayerStats().projectileCount;
    const activeProjectiles = this.getAbilityGroup('projectiles').children.size;
    
    if (activeProjectiles >= maxProjectiles) {
        return; // Don't create more
    }
    
    // Create projectile...
}
```

### Performance Optimization
```javascript
updateAbility() {
    // Batch expensive operations
    const currentTime = this.scene.time.now;
    
    // Only check for new targets every 100ms
    if (currentTime - this.lastTargetCheck > 100) {
        this.nearbyEnemies = this.getVisibleEnemies();
        this.lastTargetCheck = currentTime;
    }
    
    // Use cached enemy list for this frame
    this.updateProjectileTargeting(this.nearbyEnemies);
}
```

## Debugging Tips

### Enable Debug Logging
```javascript
import Logger from '../utils/Logger.js';

updateAbility() {
    Logger.debug(`${this.getName()} ability update`, {
        activeProjectiles: this.getAbilityGroup('projectiles').children.size,
        abilityState: Object.fromEntries(this.abilityState)
    });
}
```

### Visual Debug Information
```javascript
// Show ability ranges
if (this.scene.debugMode) {
    const debugCircle = this.scene.add.circle(
        this.scene.player.x, this.scene.player.y,
        this.getPlayerStats().abilityRadius,
        0xff0000, 0.2
    );
    
    this.scene.time.delayedCall(100, () => debugCircle.destroy());
}
```

### Console Commands
```javascript
// Add to browser console for testing
window.debugCharacter = () => {
    const char = window.game.scene.scenes[0].characterSystem.getSelectedCharacterInstance();
    console.log('Character State:', {
        abilityGroups: char.abilityGroups,
        abilityState: Object.fromEntries(char.abilityState),
        timers: char.abilityTimers
    });
};
```

## Before vs After Framework Benefits

### Before Modular System
- All character logic mixed together in CharacterSystem
- 15+ different code locations to modify for new characters
- Difficult to maintain and extend
- No clean separation of concerns
- Manual collision handler management

### After Modular System  
- Each character is self-contained
- 5-step process to add new characters
- Automatic integration and cleanup
- Clean, maintainable code architecture
- Dynamic collision handling

## Summary

The character framework provides a powerful, flexible foundation for creating unique and engaging playable characters. Each character can have completely different mechanics while leveraging shared infrastructure for common operations.

Key benefits:
- **Fast development**: New characters in 5 steps
- **Automatic integration**: No manual system updates needed
- **Rich helpers**: Comprehensive utility methods
- **Clean architecture**: Modular, maintainable code
- **Easy balancing**: Clear upgrade and stat systems

Happy character creating! 🐸✨ 