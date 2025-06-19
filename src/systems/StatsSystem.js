// Stats System - Handles player stats, progression, and stat modifications

class StatsSystem {
    constructor(scene) {
        this.scene = scene;
        this.playerStats = null;
        this.playerProgression = null;
        this.statModifiers = null;
    }

    initializePlayerStats(character) {
        // Clear any existing player stats to ensure clean start
        this.playerStats = null;
        
        // Base character stats
        const baseStats = character.baseStats;
        
        // Core progression stats
        this.playerProgression = {
            character: character,
            xp: 0,
            level: 1,
            xpToNextLevel: 100,
            invincible: false,
            invincibilityEnd: 0,
            lastRegenTime: 0,
            isPoisoned: false
        };
        
        // Upgrade modifiers (flat bonuses and multipliers)
        this.statModifiers = {
            // Flat bonuses
            healthBonus: 0,
            armorBonus: 0,
            healthRegenBonus: 0,
            abilityDamageBonus: 0,
            pickupRangeBonus: 0,
            abilityRadiusBonus: 0,
            projectileCountBonus: 0,
            
            // Multipliers
            abilityDamageMultiplier: 1.0,
            abilityCooldownMultiplier: 1.0,
            moveSpeedMultiplier: 1.0,
            abilityRadiusMultiplier: 1.0,
            pickupRangeMultiplier: 1.0
        };
        
        // Calculate and cache current stats (reset health to max for new game)
        this.refreshPlayerStats(true);
        
        console.log('Player stats initialized:', this.playerStats);
    }

    refreshPlayerStats(resetHealth = false) {
        // Calculate current stats based on base stats + modifiers
        const baseStats = this.playerProgression.character.baseStats;
        const mods = this.statModifiers;
        
        // Calculate final stats
        const maxHealth = Math.floor(baseStats.health + mods.healthBonus);
        const armor = Math.max(0, baseStats.armor + mods.armorBonus);
        const healthRegen = Math.max(0, baseStats.healthRegen + mods.healthRegenBonus);
        const abilityDamage = Math.max(0.1, (baseStats.abilityDamage + mods.abilityDamageBonus) * mods.abilityDamageMultiplier);
        const abilityCooldown = Math.max(50, baseStats.abilityCooldown * mods.abilityCooldownMultiplier);
        const abilityRadius = Math.max(10, (baseStats.abilityRadius + mods.abilityRadiusBonus) * mods.abilityRadiusMultiplier);
        const pickupRange = Math.max(20, (baseStats.pickupRange + mods.pickupRangeBonus) * mods.pickupRangeMultiplier);
        const projectileCount = Math.max(1, baseStats.projectileCount + mods.projectileCountBonus);
        const moveSpeed = Math.max(1, baseStats.moveSpeed * mods.moveSpeedMultiplier);
        
        // Determine current health: reset to max if requested, otherwise preserve current health
        let currentHealth;
        if (resetHealth || !this.playerStats || typeof this.playerStats.health !== 'number') {
            currentHealth = maxHealth; // Reset to full health for new game or if health is invalid
            console.log(`Health reset to max: ${currentHealth} (resetHealth: ${resetHealth})`);
        } else {
            currentHealth = this.playerStats.health; // Preserve current health during upgrades
            console.log(`Health preserved: ${currentHealth}`);
        }
        
        // Update cached stats
        this.playerStats = {
            // Core stats
            health: currentHealth,
            maxHealth: maxHealth,
            armor: armor,
            healthRegen: healthRegen,
            
            // Ability stats
            abilityDamage: abilityDamage,
            abilityCooldown: abilityCooldown,
            abilityRadius: abilityRadius,
            
            // Utility stats
            pickupRange: pickupRange,
            projectileCount: projectileCount,
            
            // Movement
            moveSpeed: moveSpeed,
            speed: moveSpeed * 50, // Scaled for Phaser physics
            
            // Legacy compatibility (for existing systems)
            shieldBashRange: abilityRadius, // For Shield Bufo bash
            wizardStarCount: projectileCount, // For Wizard Bufo stars
            batBoomerangRange: abilityRadius, // For Bat Bufo boomerang
            healthRegenPerSecond: healthRegen,
            
            // Keep upgrade multipliers for systems that need them
            abilityDamageMultiplier: mods.abilityDamageMultiplier,
            abilityCooldownMultiplier: mods.abilityCooldownMultiplier,
            moveSpeedMultiplier: mods.moveSpeedMultiplier
        };
        
        // Ensure health doesn't exceed max
        if (this.playerStats.health > this.playerStats.maxHealth) {
            this.playerStats.health = this.playerStats.maxHealth;
        }
    }

    // Helper method to add stat bonuses from upgrades
    addStatBonus(statName, amount) {
        if (this.statModifiers.hasOwnProperty(statName)) {
            this.statModifiers[statName] += amount;
            this.refreshPlayerStats();
            console.log(`Added ${amount} to ${statName}. New value: ${this.statModifiers[statName]}`);
        } else {
            console.warn(`Unknown stat: ${statName}`);
        }
    }
    
    // Helper method to multiply stats
    multiplyStats(statName, multiplier) {
        if (this.statModifiers.hasOwnProperty(statName)) {
            this.statModifiers[statName] *= multiplier;
            this.refreshPlayerStats();
            console.log(`Multiplied ${statName} by ${multiplier}. New value: ${this.statModifiers[statName]}`);
        } else {
            console.warn(`Unknown stat: ${statName}`);
        }
    }

    getPlayerStats() {
        return this.playerStats;
    }

    getPlayerProgression() {
        return this.playerProgression;
    }

    getStatModifiers() {
        return this.statModifiers;
    }

    addXP(amount) {
        this.playerProgression.xp += amount;
        console.log(`Gained ${amount} XP. Total: ${this.playerProgression.xp}/${this.playerProgression.xpToNextLevel}`);
        
        // Check for level up
        this.checkLevelUp();
    }

    checkLevelUp() {
        if (this.playerProgression.xp >= this.playerProgression.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.playerProgression.level++;
        this.playerProgression.xp -= this.playerProgression.xpToNextLevel;
        this.playerProgression.xpToNextLevel = Math.floor(this.playerProgression.xpToNextLevel * 1.5); // 1.5x scaling
        
        console.log(`Level up! Now level ${this.playerProgression.level}. Next level needs ${this.playerProgression.xpToNextLevel} XP.`);
        
        // Trigger level up effects
        this.scene.upgradeSystem.showUpgradeSelection();
        
        // Special boss waves every few levels
        if (this.playerProgression.level % 5 === 0) {
            this.scene.enemySystem.triggerBossWave(this.playerProgression.level);
        }
    }

    takeDamage(amount) {
        if (this.playerProgression.invincible) return 0;
        
        // Apply armor reduction
        const actualDamage = Math.max(1, amount - this.playerStats.armor);
        this.playerStats.health -= actualDamage;
        
        console.log(`Player took ${actualDamage} damage (${amount} - ${this.playerStats.armor} armor). Health: ${this.playerStats.health}/${this.playerStats.maxHealth}`);
        
        // Trigger invincibility frames
        this.setInvincible(1000); // 1 second invincibility
        
        // Check for game over
        if (this.playerStats.health <= 0) {
            this.scene.gameOver();
        }
        
        return actualDamage;
    }

    heal(amount) {
        const oldHealth = this.playerStats.health;
        this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + amount);
        const actualHeal = this.playerStats.health - oldHealth;
        
        if (actualHeal > 0) {
            console.log(`Player healed for ${actualHeal}. Health: ${this.playerStats.health}/${this.playerStats.maxHealth}`);
        }
        
        return actualHeal;
    }

    setInvincible(duration) {
        this.playerProgression.invincible = true;
        this.playerProgression.invincibilityEnd = this.scene.time.now + duration;
        
        // Visual feedback for invincibility
        if (this.scene.player) {
            this.scene.tweens.add({
                targets: this.scene.player,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: Math.floor(duration / 200),
                onComplete: () => {
                    if (this.scene.player) {
                        this.scene.player.alpha = 1;
                    }
                }
            });
        }
    }

    updateInvincibility() {
        if (!this.playerProgression) return; // Guard against null
        
        if (this.playerProgression.invincible && this.scene.time.now >= this.playerProgression.invincibilityEnd) {
            this.playerProgression.invincible = false;
            console.log('Invincibility ended');
        }
    }

    updateHealthRegeneration() {
        if (!this.playerStats || !this.playerProgression) return; // Guard against null
        
        // Skip regeneration if player is poisoned
        if (this.playerProgression.isPoisoned) {
            return;
        }
        
        if (this.playerStats.healthRegen > 0) {
            const currentTime = this.scene.time.now;
            if (currentTime - this.playerProgression.lastRegenTime >= 1000) { // Every second
                const healAmount = this.heal(this.playerStats.healthRegen);
                if (healAmount > 0) {
                    this.playerProgression.lastRegenTime = currentTime;
                }
            }
        }
    }

    update() {
        // Only update if player stats are initialized
        if (!this.playerStats || !this.playerProgression) return;
        
        this.updateInvincibility();
        this.updateHealthRegeneration();
    }
}

export default StatsSystem; 