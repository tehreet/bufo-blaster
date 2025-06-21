# 🐸 Enemy Framework Guide

## Overview

The Bufo Blaster enemy system has been refactored into a modular, plugin-based architecture similar to the character system. This makes it incredibly easy to add new enemies with unique abilities and behaviors.

## 🏗️ Framework Architecture

### Core Components

1. **BaseEnemy** (`src/enemies/BaseEnemy.js`) - Abstract base class for all enemies
2. **EnemyRegistry** (`src/enemies/EnemyRegistry.js`) - Central registry for enemy types and classes
3. **Individual Enemy Classes** - Specialized implementations (HazmatBufo, ChickenBufo, etc.)
4. **EnemySystem** - Refactored to use the modular system

### Key Features

- **Modular Design**: Each enemy type is a separate class
- **Dynamic Abilities**: Enemies can have custom AI, abilities, and visual effects
- **Automatic Management**: Cleanup, collision detection, and state management handled automatically
- **Backward Compatibility**: Maintains compatibility with existing game systems

## 🚀 Adding a New Enemy (5 Simple Steps!)

### Step 1: Create Enemy Class

Create a new file in `src/enemies/` (e.g., `FrostBufo.js`):

```javascript
import BaseEnemy from './BaseEnemy.js';

class FrostBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
    }

    setupAbility() {
        // Initialize frost ability
        this.setAbilityState('lastFreezeTime', 0);
        this.setAbilityState('freezeInterval', 3000); // Freeze every 3 seconds
        this.setAbilityState('freezeRadius', 80);
        
        // Create ice aura effect
        this.createIceAura();
    }

    updateAbility() {
        // Update frost ability
        this.updateFreezeAttack();
        this.updateIceAura();
    }

    updateAI() {
        // Custom AI - slower but creates ice patches
        this.slowChaseAI();
    }

    createIceAura() {
        // Create blue ice aura around the enemy
        const aura = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2 + 8,
            0x87CEEB,
            0.2
        );
        
        this.iceAura = aura;
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: aura,
            alpha: 0.4,
            scale: 1.3,
            duration: 1200,
            yoyo: true,
            repeat: -1
        });
    }

    updateIceAura() {
        // Keep aura positioned with enemy
        if (this.iceAura && this.iceAura.active) {
            this.iceAura.x = this.gameObject.x;
            this.iceAura.y = this.gameObject.y;
        }
    }

    updateFreezeAttack() {
        const currentTime = this.scene.time.now;
        const lastFreezeTime = this.getAbilityState('lastFreezeTime');
        const freezeInterval = this.getAbilityState('freezeInterval');
        
        if (currentTime - lastFreezeTime >= freezeInterval) {
            this.createFreezeAttack();
            this.setAbilityState('lastFreezeTime', currentTime);
        }
    }

    createFreezeAttack() {
        const freezeRadius = this.getAbilityState('freezeRadius');
        
        // Create ice explosion effect
        const iceEffect = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            freezeRadius,
            0x87CEEB,
            0.3
        );
        
        this.scene.tweens.add({
            targets: iceEffect,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            onComplete: () => iceEffect.destroy()
        });
        
        // Check if player is in freeze range
        const playerDistance = this.getDistanceToPlayer();
        if (playerDistance <= freezeRadius) {
            // Apply slow effect to player (you'd implement this in your status system)
            this.applySlowEffect();
        }
    }

    applySlowEffect() {
        // Apply slow effect to player
        // This would integrate with your existing status effect system
        console.log('Player frozen by Frost Bufo!');
    }

    slowChaseAI() {
        // Slower movement but more strategic positioning
        if (!this.scene.player || !this.gameObject.body) return;
        
        if (this.gameObject.knockbackTime && this.scene.time.now < this.gameObject.knockbackTime) {
            return;
        }
        
        const dx = this.scene.player.x - this.gameObject.x;
        const dy = this.scene.player.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            // Move slower than normal enemies (0.7x speed)
            const speed = (this.gameObject.speed * 0.7) / 50;
            const velocityX = (dx / distance) * speed;
            const velocityY = (dy / distance) * speed;
            
            try {
                this.scene.matter.body.setVelocity(this.gameObject.body, {
                    x: velocityX,
                    y: velocityY
                });
            } catch (error) {
                // Handle physics errors gracefully
            }
        }
    }

    onContactWithPlayer(player) {
        // Call parent method for basic damage
        super.onContactWithPlayer(player);
        
        // Add freeze contact effect
        this.showFreezeContactEffect();
    }

    showFreezeContactEffect() {
        // Ice crystal contact effect
        const crystalEffect = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2 + 5,
            0x87CEEB,
            0.8
        );
        
        this.scene.tweens.add({
            targets: crystalEffect,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => crystalEffect.destroy()
        });
    }

    onDeath() {
        // Clean up ice aura
        if (this.iceAura && this.iceAura.active) {
            this.scene.tweens.killTweensOf(this.iceAura);
            this.iceAura.destroy();
        }
        
        // Ice shatter death effect
        const shatterEffect = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2,
            0x87CEEB,
            0.9
        );
        
        this.scene.tweens.add({
            targets: shatterEffect,
            alpha: 0,
            scale: 3,
            duration: 600,
            onComplete: () => shatterEffect.destroy()
        });
    }

    cleanup() {
        // Clean up ice aura
        if (this.iceAura && this.iceAura.active) {
            this.scene.tweens.killTweensOf(this.iceAura);
            this.iceAura.destroy();
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}

export default FrostBufo;
```

### Step 2: Add Enemy Data to Registry

Update `src/enemies/EnemyRegistry.js`:

```javascript
// Add import
import FrostBufo from './FrostBufo.js';

// Add to ENEMY_DATA
const ENEMY_DATA = {
    // ... existing enemies
    FROST_BUFO: {
        id: 'frost',
        name: 'Frost Bufo',
        sprite: 'bufo-frost', // Add this sprite to your assets
        specialEffect: 'freeze',
        weight: 12, // Medium rarity
        baseStats: {
            health: 4,
            speed: 35, // Slower than most enemies
            displaySize: 46,
            hitboxRadius: 3,
            xpValue: 22,
            contactDamage: 12 // Higher damage due to frost effect
        }
    }
};

// Add to ENEMY_CLASSES
const ENEMY_CLASSES = {
    // ... existing enemies
    'frost': FrostBufo
};
```

### Step 3: Add Sprite Asset

Add your enemy sprite to `public/assets/enemies/bufo-frost.png`

### Step 4: Update Asset Configuration (Optional)

If using custom display sizes, update `src/utils/AssetConfig.js`:

```javascript
const ASSET_CONFIG = {
    enemies: {
        // ... existing enemies
        'bufo-frost': {
            png: 'assets/enemies/bufo-frost.png',
            displaySize: 46
        }
    }
};
```

### Step 5: Test Your Enemy

Your new Frost Bufo will automatically:
- ✅ Appear in enemy spawns
- ✅ Use level-based scaling
- ✅ Handle collisions properly
- ✅ Clean up on death/restart
- ✅ Show up in boss waves (if health >= 3)

## 📚 BaseEnemy Helper Methods

The `BaseEnemy` class provides many useful methods:

### Ability Management
```javascript
this.createAbilityGroup('projectiles');     // Create physics group
this.getAbilityGroup('projectiles');        // Get physics group
this.createAbilityTimer('cooldown', config); // Create timer
this.setAbilityState('key', value);         // Store state data
this.getAbilityState('key');                // Get state data
```

### Player Interaction
```javascript
this.getPlayerPosition();                   // Get player position
this.getDistanceToPlayer();                 // Get distance to player
this.applyPlayerKnockback(player);          // Apply knockback to player
```

### Projectile Creation
```javascript
this.createProjectile(x, y, velX, velY, {
    radius: 8,
    color: 0xff0000,
    damage: 15,
    label: 'customProjectile',
    lifespan: 3000
});
```

### Visual Effects
```javascript
// Create explosion-style effects
const effect = this.scene.add.circle(x, y, radius, color, alpha);
this.scene.tweens.add({
    targets: effect,
    alpha: 0,
    scale: 2,
    duration: 500,
    onComplete: () => effect.destroy()
});
```

## 🎯 Common Enemy Patterns

### 1. Projectile Enemy (like ChickenBufo)
```javascript
setupAbility() {
    this.createAbilityGroup('projectiles');
    this.setAbilityState('lastAttackTime', 0);
    this.setAbilityState('attackCooldown', 2000);
}

updateAbility() {
    this.updateRangedAttack();
    this.updateProjectiles();
}

updateAI() {
    this.rangedAI(); // Keep distance and shoot
}
```

### 2. Regenerating Enemy (like TeethBufo)
```javascript
setupAbility() {
    this.setAbilityState('lastRegenTime', 0);
    this.setAbilityState('regenRate', 0.5);
}

updateAbility() {
    this.updateHealthRegeneration();
}
```

### 3. Area Effect Enemy (like HazmatBufo)
```javascript
setupAbility() {
    this.createPersistentAura();
    this.setAbilityState('lastAuraTime', 0);
}

updateAbility() {
    this.updateAuraEffects();
}
```

### 4. Summoner Enemy
```javascript
setupAbility() {
    this.createAbilityGroup('minions');
    this.setAbilityState('lastSummonTime', 0);
    this.setAbilityState('maxMinions', 3);
}

updateAbility() {
    this.updateSummons();
    this.manageMinionCount();
}
```

## 🔧 Advanced Features

### Custom AI Behaviors
```javascript
updateAI() {
    const distanceToPlayer = this.getDistanceToPlayer();
    
    if (distanceToPlayer < 100) {
        this.aggressiveAI();
    } else if (distanceToPlayer > 300) {
        this.guardModeAI();
    } else {
        this.patrolAI();
    }
}
```

### Collision Detection
```javascript
// For projectiles that need custom collision handling
getCollisionHandlers() {
    return [
        { 
            projectileLabel: 'customProjectile', 
            handler: this.customProjectileHit.bind(this) 
        }
    ];
}

customProjectileHit(projectile, target) {
    // Handle custom collision logic
}
```

### State Management
```javascript
setupAbility() {
    // Store complex state
    this.setAbilityState('phase', 'normal');
    this.setAbilityState('enrageThreshold', 0.3);
    this.setAbilityState('specialAttackCharges', 3);
}

updateAbility() {
    const healthPercent = this.gameObject.health / this.gameObject.maxHealth;
    const currentPhase = this.getAbilityState('phase');
    
    if (healthPercent < this.getAbilityState('enrageThreshold') && currentPhase === 'normal') {
        this.setAbilityState('phase', 'enraged');
        this.triggerEnrageMode();
    }
}
```

## 📊 Enemy Balancing

### Base Stats Guidelines
```javascript
// Fast, weak enemy
baseStats: {
    health: 1-2,
    speed: 80-120,
    contactDamage: 8-10,
    xpValue: 5-10
}

// Balanced enemy
baseStats: {
    health: 3-4,
    speed: 40-60,
    contactDamage: 10-12,
    xpValue: 15-20
}

// Tank enemy
baseStats: {
    health: 5-8,
    speed: 20-40,
    contactDamage: 12-18,
    xpValue: 25-35
}
```

### Weight Guidelines
- **Very Common**: 30-40 (basic enemies)
- **Common**: 20-30 (standard enemies)
- **Uncommon**: 10-20 (special abilities)
- **Rare**: 5-10 (powerful enemies)
- **Very Rare**: 1-5 (boss-tier enemies)

## 🐛 Testing Your Enemy

1. **Start the game**: `npm start`
2. **Use F1** to see hitboxes and collision detection
3. **Use F2** to monitor performance and stats
4. **Test abilities**: Verify all special abilities work correctly
5. **Test cleanup**: Restart the game multiple times to ensure no memory leaks

## 🔍 Debugging Tips

### Common Issues

1. **Enemy not spawning**: Check EnemyRegistry registration
2. **Abilities not working**: Verify setupAbility() is called
3. **Visual effects not cleaning up**: Check cleanup() method
4. **Physics errors**: Add try-catch around Matter.js operations

### Debug Logging
```javascript
setupAbility() {
    console.log(`Setting up ${this.getName()} abilities`);
    // ... setup code
}

updateAbility() {
    if (this.scene.time.now % 1000 < 16) { // Log once per second
        console.log(`${this.getName()} state:`, this.abilityState);
    }
}
```

## 🚀 Future Enhancements

The enemy framework is designed to be easily extensible:

- **Boss Enemies**: Multi-phase enemies with complex behaviors
- **Environmental Enemies**: Enemies that interact with the map
- **Cooperative Enemies**: Enemies that work together
- **Player-Mimicking Enemies**: Enemies that copy player abilities

## 📈 Performance Considerations

- Use `for` loops instead of `forEach` for better performance
- Cache frequently accessed values
- Clean up visual effects promptly
- Use object pooling for frequently spawned projectiles
- Limit the number of active projectiles per enemy

## 🎉 Conclusion

The new enemy framework makes it incredibly easy to add diverse, interesting enemies to Bufo Blaster. Each enemy can have unique behaviors, abilities, and visual effects while maintaining clean, modular code.

**Happy enemy creating!** 🐸⚡ 