// Base class for all playable characters
// Defines the common interface and shared functionality

class BaseCharacter {
    constructor(scene, characterData) {
        this.scene = scene;
        this.data = characterData;
        this.abilityGroups = new Map(); // Store ability-specific game object groups
        this.abilityTimers = new Map(); // Store ability-specific timers
        this.abilityState = new Map(); // Store ability-specific state data
    }

    // Character data getters
    getId() {
        return this.data.id;
    }

    getName() {
        return this.data.name;
    }

    getDescription() {
        return this.data.description;
    }

    getSprite() {
        return this.data.sprite;
    }

    getColor() {
        return this.data.color;
    }

    getBaseStats() {
        return this.data.baseStats;
    }

    getAbilityName() {
        return this.data.abilityName;
    }

    getAbilityDescription() {
        return this.data.abilityDescription;
    }

    // Abstract methods that each character must implement
    setupAbility() {
        throw new Error(`Character ${this.getId()} must implement setupAbility()`);
    }

    updateAbility() {
        throw new Error(`Character ${this.getId()} must implement updateAbility()`);
    }

    getUpgrades() {
        throw new Error(`Character ${this.getId()} must implement getUpgrades()`);
    }

    // Collision handler registration - characters can override this
    getCollisionHandlers() {
        // Returns an array of collision handler configurations
        // Format: [{ projectileLabel: 'labelName', handler: this.methodName.bind(this) }]
        return [];
    }

    // Helper methods for managing character-specific game objects
    createAbilityGroup(name) {
        const group = this.scene.add.group();
        this.abilityGroups.set(name, group);
        return group;
    }

    getAbilityGroup(name) {
        return this.abilityGroups.get(name);
    }

    createAbilityTimer(name, config) {
        const timer = this.scene.time.addEvent(config);
        this.abilityTimers.set(name, timer);
        return timer;
    }

    getAbilityTimer(name) {
        return this.abilityTimers.get(name);
    }

    removeAbilityTimer(name) {
        const timer = this.abilityTimers.get(name);
        if (timer) {
            timer.remove();
            this.abilityTimers.delete(name);
        }
    }

    setAbilityState(key, value) {
        this.abilityState.set(key, value);
    }

    getAbilityState(key) {
        return this.abilityState.get(key);
    }

    // Cleanup method called when character is deselected or game restarts
    cleanup() {
        // Remove all timers
        for (const [name, timer] of this.abilityTimers) {
            if (timer) {
                timer.remove();
            }
        }
        this.abilityTimers.clear();

        // Clear all groups
        for (const [name, group] of this.abilityGroups) {
            if (group) {
                group.clear(true, true);
            }
        }
        this.abilityGroups.clear();

        // Clear state
        this.abilityState.clear();
    }

    // Helper method to get current player stats
    getPlayerStats() {
        return this.scene.statsSystem.getPlayerStats();
    }

    // Helper method to get current player progression
    getPlayerProgression() {
        return this.scene.statsSystem.getPlayerProgression();
    }

    // Helper method to get enemies in range
    getEnemiesInRange(x, y, range) {
        if (!this.scene.enemies) return [];
        
        return this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) return false;
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            return distance <= range;
        });
    }

    // Helper method to get visible enemies (within camera bounds)
    getVisibleEnemies() {
        if (!this.scene.enemies) return [];
        
        const camera = this.scene.cameras.main;
        return this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) return false;
            
            return (
                enemy.x >= camera.scrollX - 50 &&
                enemy.x <= camera.scrollX + camera.width + 50 &&
                enemy.y >= camera.scrollY - 50 &&
                enemy.y <= camera.scrollY + camera.height + 50
            );
        });
    }

    // Helper method to damage an enemy
    damageEnemy(enemy, damage) {
        if (this.scene.enemySystem && typeof this.scene.enemySystem.damageEnemy === 'function') {
            this.scene.enemySystem.damageEnemy(enemy, damage);
        }
    }

    // Helper method to create visual effects
    createVisualEffect(x, y, config) {
        const effect = this.scene.add.circle(x, y, config.radius || 20, config.color || 0xffffff, config.alpha || 0.5);
        if (config.stroke) {
            effect.setStrokeStyle(config.stroke.width || 2, config.stroke.color || 0xffffff);
        }
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(effect);
        }

        // Animate the effect
        this.scene.tweens.add({
            targets: effect,
            alpha: 0,
            scale: config.endScale || 2,
            duration: config.duration || 500,
            onComplete: () => effect.destroy()
        });

        return effect;
    }
}

export default BaseCharacter; 