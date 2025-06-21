// Duck Bufo - Summons explosive rubber ducks that seek and destroy enemies
import BaseCharacter from './BaseCharacter.js';
import Logger from '../utils/Logger.js';

class DuckBufo extends BaseCharacter {
    constructor(scene, characterData) {
        super(scene, characterData);
        
        // Duck summoning state
        this.nextDuckSummon = 0;
        this.maxDucks = 3; // Base number of ducks
        this.duckSpeed = 80; // Base duck movement speed (increased for better visibility)
        this.explosionRadius = 50; // Base explosion radius
        this.explosionDamage = 2; // Base explosion damage
        this.duckHealth = 3; // Base duck health
    }

    // Called once when character is selected/initialized
    setupAbility() {
        // Initialize duck summoning timer
        this.nextDuckSummon = this.scene.time.now + 1000; // Start summoning after 1 second
        
        // Create ability groups for ducks
        this.ensureAbilityGroup('rubberDucks');
    }

    // Called every frame to handle duck summoning
    updateAbility() {
        if (!this.scene.gameStarted || this.scene.isPaused) return;
        
        const currentTime = this.scene.time.now;
        const playerStats = this.getPlayerStats();
        
        // Check if it's time to summon ducks and we haven't reached max count
        if (currentTime >= this.nextDuckSummon) {
            const currentDuckCount = this.getCurrentDuckCount();
            const maxDucks = this.getMaxDucks(playerStats);
            
            if (currentDuckCount < maxDucks) {
                this.summonDuck();
                this.nextDuckSummon = currentTime + playerStats.abilityCooldown;
            }
        }
        
        // Update existing ducks
        this.updateDucks();
    }

    // Summon a new rubber duck
    summonDuck() {
        try {
            const player = this.scene.player;
            if (!player) return;
            
            const playerStats = this.getPlayerStats();
            
            // Spawn duck further from player (50-100px radius)
            const spawnAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const spawnDistance = Phaser.Math.Between(50, 100);
            const duckX = player.x + Math.cos(spawnAngle) * spawnDistance;
            const duckY = player.y + Math.sin(spawnAngle) * spawnDistance;
            
            // Create simple rubber duck visual (yellow circle with stroke)
            const duck = this.scene.add.circle(duckX, duckY, 12, 0xFFD700);
            duck.setStrokeStyle(3, 0xFF8C00); // Orange border to make it look more duck-like
            
            // Add physics to duck
            this.scene.matter.add.gameObject(duck, {
                shape: 'circle',
                radius: 12,
                frictionAir: 0.05,
                label: 'rubberDuck'
            });
            
            // Duck properties
            duck.health = this.getDuckHealth(playerStats);
            duck.maxHealth = duck.health;
            duck.speed = this.getDuckSpeed(playerStats);
            duck.explosionRadius = this.getExplosionRadius(playerStats);
            duck.explosionDamage = this.getExplosionDamage(playerStats);
            duck.targetEnemy = null;
            duck.lastAIUpdate = 0;
            duck.birthTime = this.scene.time.now;
            duck.isExploding = false;
            
            // Add to ducks group
            const ducksGroup = this.getAbilityGroup('rubberDucks');
            if (ducksGroup) {
                ducksGroup.add(duck);
            }
            
            // Visual spawn effect
            this.createVisualEffect(duckX, duckY, {
                radius: 20,
                color: 0xFFD700,
                alpha: 0.6,
                duration: 300
            });
            
        } catch (error) {
            Logger.error('Duck summoning error:', error);
        }
    }

    // Update all existing ducks
    updateDucks() {
        const ducksGroup = this.getAbilityGroup('rubberDucks');
        if (!ducksGroup) return;
        
        const ducks = ducksGroup.children.entries;
        const currentTime = this.scene.time.now;
        
        for (let i = 0, len = ducks.length; i < len; i++) {
            const duck = ducks[i];
            if (!duck || !duck.active || !duck.scene) continue;
            
            try {
                // Duck AI update (every 100ms)
                if (currentTime - duck.lastAIUpdate > 100) {
                    this.updateDuckAI(duck);
                    duck.lastAIUpdate = currentTime;
                }
                
                // Check for explosion conditions
                this.checkDuckExplosion(duck);
                
            } catch (error) {
                Logger.error('Duck update error:', error);
                if (duck && duck.destroy) duck.destroy();
            }
        }
    }

    // Update individual duck AI (pathfinding and movement)
    updateDuckAI(duck) {
        if (!duck.body || duck.isExploding) return;
        
        // Find nearest enemy
        const nearestEnemy = this.findNearestEnemy(duck.x, duck.y, 300); // 300px search radius
        
        if (nearestEnemy) {
            duck.targetEnemy = nearestEnemy;
            
            // Move towards target enemy  
            const angle = Phaser.Math.Angle.Between(duck.x, duck.y, nearestEnemy.x, nearestEnemy.y);
            const velocityX = Math.cos(angle) * (duck.speed / 50); // Scale down for Matter.js
            const velocityY = Math.sin(angle) * (duck.speed / 50); // Scale down for Matter.js
            
            try {
                this.scene.matter.body.setVelocity(duck.body, { x: velocityX, y: velocityY });
            } catch (error) {
                // Silent error handling for destroyed objects
            }
            
            // Add bobbing animation for visual appeal
            duck.y += Math.sin(this.scene.time.now * 0.005) * 0.5;
        } else {
            // No enemy found, stop moving
            try {
                this.scene.matter.body.setVelocity(duck.body, { x: 0, y: 0 });
            } catch (error) {
                // Silent error handling
            }
        }
    }

    // Check if duck should explode
    checkDuckExplosion(duck) {
        if (duck.isExploding) return;
        
        // Explode when close to target enemy
        if (duck.targetEnemy && duck.targetEnemy.active) {
            const distance = Phaser.Math.Distance.Between(
                duck.x, duck.y, 
                duck.targetEnemy.x, duck.targetEnemy.y
            );
            
            if (distance < 25) { // 25px explosion trigger distance
                this.explodeDuck(duck);
                return;
            }
        }
        
        // Auto-explode after 15 seconds to prevent clutter
        if (this.scene.time.now - duck.birthTime > 15000) {
            this.explodeDuck(duck);
        }
    }

    // Explode duck and deal area damage
    explodeDuck(duck) {
        if (duck.isExploding) return;
        duck.isExploding = true;
        
        try {
            // Find all enemies within explosion radius
            const enemiesInRange = this.findEnemiesInRange(duck.x, duck.y, duck.explosionRadius);
            
            // Deal damage to all enemies in range
            for (let i = 0, len = enemiesInRange.length; i < len; i++) {
                const enemy = enemiesInRange[i];
                if (enemy && enemy.active) {
                    this.damageEnemy(enemy, duck.explosionDamage);
                    
                    // Apply knockback
                    const angle = Phaser.Math.Angle.Between(duck.x, duck.y, enemy.x, enemy.y);
                    try {
                        if (enemy.body && this.scene.matter && this.scene.matter.body) {
                            this.scene.matter.body.setVelocity(enemy.body, {
                                x: Math.cos(angle) * 6,
                                y: Math.sin(angle) * 6
                            });
                        }
                    } catch (knockbackError) {
                        // Silent knockback error handling
                    }
                }
            }
            
            // Create explosion visual effect
            this.createVisualEffect(duck.x, duck.y, {
                radius: duck.explosionRadius,
                color: 0xFF6B35,
                alpha: 0.8,
                stroke: { width: 4, color: 0xFF0000 },
                duration: 600
            });
            
            // Screen shake for satisfying explosion feel
            if (this.scene.cameras && this.scene.cameras.main) {
                this.scene.cameras.main.shake(200, 0.02);
            }
            
            // Remove duck
            duck.destroy();
            
        } catch (error) {
            Logger.error('Duck explosion error:', error);
            if (duck && duck.destroy) duck.destroy();
        }
    }

    // Handle duck taking damage (when enemies hit ducks)
    duckHitByEnemy(duck, enemy) {
        if (!duck || duck.isExploding) return;
        
        try {
            duck.health -= 1;
            
            // Visual damage effect (red tint)
            if (duck && duck.setTint) {
                duck.setTint(0xFF4444);
                this.scene.time.delayedCall(200, () => {
                    if (duck && duck.clearTint) duck.clearTint();
                });
            }
            
            // Duck dies, explode
            if (duck.health <= 0) {
                this.explodeDuck(duck);
            }
            
        } catch (error) {
            Logger.error('Duck damage error:', error);
        }
    }

    // Get current number of active ducks
    getCurrentDuckCount() {
        const ducksGroup = this.getAbilityGroup('rubberDucks');
        return ducksGroup ? ducksGroup.children.entries.length : 0;
    }

    // Calculate max ducks based on player stats
    getMaxDucks(playerStats) {
        return Math.floor(this.maxDucks + (playerStats.projectileCount - 2)); // projectileCount upgrades add more ducks
    }

    // Calculate duck speed based on player stats
    getDuckSpeed(playerStats) {
        return this.duckSpeed + (playerStats.moveSpeed - 4.2) * 20; // Simple addition scaling
    }

    // Calculate explosion radius based on player stats
    getExplosionRadius(playerStats) {
        return this.explosionRadius * (1 + (playerStats.abilityRadius - 60) / 60); // Scale with ability radius
    }

    // Calculate explosion damage based on player stats
    getExplosionDamage(playerStats) {
        return this.explosionDamage * (1 + (playerStats.abilityDamage - 1.8) / 1.8); // Scale with ability damage
    }

    // Calculate duck health based on player stats
    getDuckHealth(playerStats) {
        return Math.max(1, Math.floor(this.duckHealth + (playerStats.health - 120) * 0.02)); // Tiny health scaling
    }

    // Get character-specific upgrades
    getCharacterUpgrades() {
        return [
            {
                name: 'Duck Swarm',
                description: 'Summon +2 more ducks at once',
                type: 'projectileCount',
                value: 2,
                rarity: 'common'
            },
            {
                name: 'Quack Speed',
                description: 'Ducks move 40% faster',
                type: 'moveSpeed', 
                value: 1.68, // 40% of base 4.2
                rarity: 'common'
            },
            {
                name: 'Explosive Payload',
                description: 'Duck explosions have +60% larger radius',
                type: 'abilityRadius',
                value: 36, // 60% of base 60
                rarity: 'uncommon'
            },
            {
                name: 'Duck Commander',
                description: 'Summon ducks 50% faster + 40 health',
                type: 'compound',
                effects: [
                    { type: 'abilityCooldown', value: -1000 }, // -50% of base 2000ms
                    { type: 'health', value: 40 }
                ],
                rarity: 'rare'
            },
            {
                name: 'Thermonuclear Duck',
                description: 'Explosions deal 75% more damage + stun enemies',
                type: 'compound',
                effects: [
                    { type: 'abilityDamage', value: 1.35 }, // 75% of base 1.8
                    { type: 'special', value: 'duck_stun' }
                ],
                rarity: 'epic'
            }
        ];
    }

    // Handle special upgrade effects
    applySpecialUpgrade(type, value) {
        if (type === 'duck_stun') {
            // Modify explodeDuck to apply stun effect
            this.duckStunEnabled = true;
        }
    }

    // Get collision handlers for rubber ducks
    getCollisionHandlers() {
        return [
            {
                label: 'rubberDuck',
                handler: (duck, enemy) => {
                    if (enemy.label === 'enemy') {
                        this.duckHitByEnemy(duck, enemy);
                    }
                }
            }
        ];
    }

    // Clean up when character is deselected or game restarts
    cleanup() {
        const ducksGroup = this.getAbilityGroup('rubberDucks');
        if (ducksGroup) {
            ducksGroup.clear(true, true);
        }
        
        this.nextDuckSummon = 0;
        this.duckStunEnabled = false;
    }
}

export default DuckBufo; 