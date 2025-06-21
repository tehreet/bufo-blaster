// Enemy Registry - Central registry for all enemy types
// Maps enemy IDs to their class implementations and data

import BaseEnemy from './BaseEnemy.js';
import ChickenBufo from './ChickenBufo.js';
import TeethBufo from './TeethBufo.js';
import HazmatBufo from './HazmatBufo.js';
import GhostBufo from './GhostBufo.js';
import MeltdownBufo from './MeltdownBufo.js';

// Enemy definitions with comprehensive base stats
const ENEMY_DATA = {
    HAZMAT_BUFO: {
        id: 'hazmat',
        name: 'Hazmat Bufo',
        sprite: 'bufo-covid',
        specialEffect: 'poison',
        weight: 25,
        baseStats: {
            health: 4,
            speed: 90,
            displaySize: 40,
            hitboxRadius: 3,
            xpValue: 25,
            contactDamage: 10
        }
    },
    CLOWN_BUFO: {
        id: 'clown',
        name: 'Clown Bufo',
        sprite: 'bufo-clown',
        specialEffect: null,
        weight: 25,
        baseStats: {
            health: 3,
            speed: 45,
            displaySize: 44,
            hitboxRadius: 3,
            xpValue: 15,
            contactDamage: 10
        }
    },
    POG_BUFO: {
        id: 'pog',
        name: 'Pog Bufo',
        sprite: 'bufo-pog',
        specialEffect: null,
        weight: 35,
        baseStats: {
            health: 1,
            speed: 80,
            displaySize: 36,
            hitboxRadius: 2,
            xpValue: 8,
            contactDamage: 10
        }
    },
    TEETH_BUFO: {
        id: 'teeth',
        name: 'Teeth Bufo',
        sprite: 'bufo-enraged',
        specialEffect: 'regen',
        weight: 10,
        baseStats: {
            health: 6,
            speed: 65,
            displaySize: 48,
            hitboxRadius: 4,
            xpValue: 25,
            contactDamage: 15,
            healthRegen: 0.5
        }
    },
    MOB_BUFO: {
        id: 'mob',
        name: 'Mob Bufo',
        sprite: 'bufo-mob',
        specialEffect: null,
        weight: 5,
        baseStats: {
            health: 6,
            speed: 50,
            displaySize: 48,
            hitboxRadius: 4,
            xpValue: 30,
            contactDamage: 10
        }
    },
    VAMPIRE_BUFO: {
        id: 'vampire',
        name: 'Vampire Bufo',
        sprite: 'bufo-vampire',
        specialEffect: 'bleed',
        weight: 8,
        baseStats: {
            health: 5,
            speed: 100,
            displaySize: 45,
            hitboxRadius: 3,
            xpValue: 35,
            contactDamage: 12,
            healthRegen: 1.0
        }
    },
    CHICKEN_BUFO: {
        id: 'chicken',
        name: 'Chicken Bufo',
        sprite: 'bufo-chicken',
        specialEffect: 'ranged',
        weight: 15,
        baseStats: {
            health: 3,
            speed: 40,
            displaySize: 42,
            hitboxRadius: 3,
            xpValue: 20,
            contactDamage: 8
        },
        rangedAttack: {
            range: 400,
            keepDistance: 300,
            projectileSpeed: 120,
            projectileDamage: 12,
            attackCooldown: 2000,
            accuracy: 0.8
        }
    },
    GHOST_BUFO: {
        id: 'ghost',
        name: 'Ghost Bufo',
        sprite: 'bufo-ghost',
        specialEffect: 'reflection',
        weight: 8, // Uncommon but not too rare
        baseStats: {
            health: 4,
            speed: 50, // Slower than most enemies
            displaySize: 44,
            hitboxRadius: 3,
            xpValue: 40, // Higher XP due to reflection mechanic
            contactDamage: 8 // Lower contact damage since it reflects
        }
    },
    MELTDOWN_BUFO: {
        id: 'meltdown',
        name: 'Meltdown Bufo',
        sprite: 'bufo-meltdown',
        specialEffect: 'explosion',
        weight: 3, // Rare spawn - very dangerous
        baseStats: {
            health: 2, // Low health, but dangerous
            speed: 120, // Very fast
            displaySize: 40,
            hitboxRadius: 3,
            xpValue: 60, // High XP reward for the danger
            contactDamage: 5 // Low contact damage - the explosion is the threat
        }
    }
};

// Map enemy IDs to their class implementations
const ENEMY_CLASSES = {
    'hazmat': HazmatBufo,    // Specialized: Poison aura and effects
    'clown': BaseEnemy,      // Basic enemy - no special abilities needed
    'pog': BaseEnemy,        // Basic enemy - just fast and weak
    'teeth': TeethBufo,      // Specialized: Health regeneration and berserker mode
    'mob': BaseEnemy,        // Basic enemy - just tough
    'vampire': BaseEnemy,    // TODO: Will become VampireBufo class (bleed effects)
    'chicken': ChickenBufo,  // Specialized: Ranged attacks
    'ghost': GhostBufo,      // Specialized: Damage reflection mechanics
    'meltdown': MeltdownBufo // Specialized: Explosion timer mechanics
};

class EnemyRegistry {
    constructor() {
        this.enemyData = ENEMY_DATA;
        this.enemyClasses = ENEMY_CLASSES;
    }

    // Get all available enemy data
    getAllEnemies() {
        return this.enemyData;
    }

    // Get enemy data by ID
    getEnemyData(enemyId) {
        const enemyKey = this.findEnemyKey(enemyId);
        return enemyKey ? this.enemyData[enemyKey] : null;
    }

    // Create an enemy instance by ID
    createEnemy(scene, enemyId, gameObject) {
        const enemyData = this.getEnemyData(enemyId);
        if (!enemyData) {
            throw new Error(`Enemy with ID '${enemyId}' not found`);
        }

        const EnemyClass = this.enemyClasses[enemyId];
        if (!EnemyClass) {
            throw new Error(`Enemy class for ID '${enemyId}' not found`);
        }

        return new EnemyClass(scene, enemyData, gameObject);
    }

    // Check if an enemy exists
    hasEnemy(enemyId) {
        return !!this.getEnemyData(enemyId);
    }

    // Get list of all enemy IDs
    getEnemyIds() {
        return Object.values(this.enemyData).map(enemy => enemy.id);
    }

    // Register a new enemy (for adding new enemy types)
    registerEnemy(enemyKey, enemyData, EnemyClass) {
        this.enemyData[enemyKey] = enemyData;
        this.enemyClasses[enemyData.id] = EnemyClass;
    }

    // Helper method to find enemy key from ID
    findEnemyKey(enemyId) {
        return Object.keys(this.enemyData).find(key => 
            this.enemyData[key].id === enemyId
        );
    }

    // Get random enemy type with level-based weighting
    getRandomEnemyType(level = 1) {
        const enemies = Object.values(this.enemyData);
        
        // Adjust weights based on level
        const adjustedEnemies = enemies.map(enemy => {
            let weight = enemy.weight;
            
            // Increase weight of tougher enemies at higher levels
            if (enemy.baseStats.health >= 4 && level >= 5) {
                weight *= 1.5; // Tougher enemies appear more often after level 5
            }
            if (enemy.baseStats.health >= 6 && level >= 10) {
                weight *= 2; // Strongest enemies appear even more often after level 10
            }
            
            return { ...enemy, adjustedWeight: weight };
        });
        
        // Calculate total weight
        const totalWeight = adjustedEnemies.reduce((sum, enemy) => sum + enemy.adjustedWeight, 0);
        
        // Random selection based on weights
        let random = Math.random() * totalWeight;
        for (const enemy of adjustedEnemies) {
            random -= enemy.adjustedWeight;
            if (random <= 0) {
                return enemy;
            }
        }
        
        // Fallback to first enemy type
        return enemies[0];
    }

    // Get enemies suitable for boss waves (higher health)
    getBossWaveEnemyTypes() {
        return Object.values(this.enemyData).filter(enemy => enemy.baseStats.health >= 3);
    }

    // Update an enemy class mapping (useful for development)
    updateEnemyClass(enemyId, EnemyClass) {
        if (this.hasEnemy(enemyId)) {
            this.enemyClasses[enemyId] = EnemyClass;
            return true;
        }
        return false;
    }

    // Get enemy data in the old format for backward compatibility
    getEnemyTypesArray() {
        return Object.values(this.enemyData).map(enemy => ({
            id: enemy.id,
            name: enemy.name,
            sprite: enemy.sprite,
            health: enemy.baseStats.health,
            speed: enemy.baseStats.speed,
            displaySize: enemy.baseStats.displaySize,
            hitboxRadius: enemy.baseStats.hitboxRadius,
            xpValue: enemy.baseStats.xpValue,
            weight: enemy.weight,
            specialEffect: enemy.specialEffect,
            contactDamage: enemy.baseStats.contactDamage,
            healthRegen: enemy.baseStats.healthRegen,
            rangedAttack: enemy.rangedAttack
        }));
    }
}

// Export singleton instance
export default new EnemyRegistry(); 