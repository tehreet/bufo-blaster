import BaseEnemy from './BaseEnemy.js';

class VampireBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
        
        // Vampire-specific properties
        this.lifeStealRate = 0.3; // Heals 30% of damage dealt
        this.bleedDuration = 5000; // Bleed lasts 5 seconds
        this.bleedTickDamage = 2; // Damage per bleed tick
        this.vampireHungerLevel = 0; // Visual intensity based on missing health
    }

    setupAbility() {
        // Initialize vampire systems
        this.setAbilityState('lastRegenTime', 0);
        this.setAbilityState('regenRate', this.data.baseStats.healthRegen || 1.0);
        this.setAbilityState('regenInterval', 1000); // Regenerate every second
        this.setAbilityState('lastBloodAuraTime', 0);
        this.setAbilityState('auraInterval', 3000); // Blood aura every 3 seconds
        
        // Set vampire appearance
        this.gameObject.setTint(0xDD2222); // Deep red vampire tint
        
        // Create blood aura
        this.createBloodAura();
        
        // Setup periodic blood effects
        this.createSafeAbilityTimer('bloodEffects', {
            delay: 2000,
            callback: () => this.createBloodParticles(),
            loop: true
        }, true);
    }

    updateAbility() {
        this.updateVampireRegeneration();
        this.updateBloodAura();
        this.updateVampireAppearance();
    }

    updateAI() {
        // Vampires are fast and aggressive, especially when wounded
        this.aggressiveVampireAI();
    }

    updateVampireRegeneration() {
        const currentTime = this.scene.time.now;
        const lastRegenTime = this.getAbilityState('lastRegenTime');
        const regenInterval = this.getAbilityState('regenInterval');
        const regenRate = this.getAbilityState('regenRate');
        
        // Check if it's time to regenerate
        if (currentTime - lastRegenTime >= regenInterval) {
            // Only regenerate if not at full health
            if (this.gameObject.health < this.gameObject.maxHealth) {
                const oldHealth = this.gameObject.health;
                this.gameObject.health = Math.min(this.gameObject.maxHealth, this.gameObject.health + regenRate);
                
                // Show vampire regeneration effect if health was actually regenerated
                if (this.gameObject.health > oldHealth) {
                    this.showVampireRegenerationEffect();
                }
            }
            
            this.setAbilityState('lastRegenTime', currentTime);
        }
    }

    updateBloodAura() {
        // Keep blood aura positioned with the vampire
        if (this.bloodAura && this.bloodAura.active) {
            this.bloodAura.x = this.gameObject.x;
            this.bloodAura.y = this.gameObject.y;
        }
        
        // Show occasional blood drops
        const currentTime = this.scene.time.now;
        const lastAuraTime = this.getAbilityState('lastBloodAuraTime');
        const auraInterval = this.getAbilityState('auraInterval');
        
        if (currentTime - lastAuraTime >= auraInterval) {
            this.createBloodDrops();
            this.setAbilityState('lastBloodAuraTime', currentTime);
        }
    }

    updateVampireAppearance() {
        // Change appearance based on health (hunger level)
        const healthPercentage = this.gameObject.health / this.gameObject.maxHealth;
        this.vampireHungerLevel = 1 - healthPercentage;
        
        // More red/intense when wounded (hungry)
        if (healthPercentage < 0.3) {
            this.gameObject.setTint(0xFF0000); // Bright red when very hungry
        } else if (healthPercentage < 0.6) {
            this.gameObject.setTint(0xEE2222); // Medium red when hungry
        } else {
            this.gameObject.setTint(0xDD2222); // Deep red when healthy
        }
    }

    createBloodAura() {
        if (!this.isOperationSafe(true)) return;
        
        // Create a dark red aura around the vampire
        const aura = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2 + 8,
            0x660000,
            0.15
        );
        
        // Store reference to aura
        this.bloodAura = aura;
        
        // Make it pulse ominously
        this.scene.tweens.add({
            targets: aura,
            alpha: 0.4,
            scale: 1.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createBloodParticles() {
        if (!this.isOperationSafe(true)) return;
        
        // Create floating blood particles around the vampire
        for (let i = 0; i < 2; i++) {
            const particle = this.scene.add.circle(
                this.gameObject.x + (Math.random() - 0.5) * 35,
                this.gameObject.y + (Math.random() - 0.5) * 35,
                2,
                0x990000,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 25,
                x: particle.x + (Math.random() - 0.5) * 20,
                alpha: 0,
                scale: 0.3,
                duration: 2000,
                delay: i * 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    createBloodDrops() {
        if (!this.isOperationSafe(true)) return;
        
        // Create dripping blood effect
        for (let i = 0; i < 3; i++) {
            const drop = this.scene.add.circle(
                this.gameObject.x + (Math.random() - 0.5) * 25,
                this.gameObject.y + (Math.random() - 0.5) * 25,
                3,
                0xAA0000,
                0.9
            );
            
            this.scene.tweens.add({
                targets: drop,
                y: drop.y + 40,
                alpha: 0,
                duration: 1200,
                delay: i * 150,
                ease: 'Cubic.easeIn',
                onComplete: () => drop.destroy()
            });
        }
    }

    showVampireRegenerationEffect() {
        if (!this.isOperationSafe(true)) return;
        
        // Create dark red healing effect with blood theme
        const healEffect = this.scene.add.circle(
            this.gameObject.x, 
            this.gameObject.y, 
            this.data.baseStats.displaySize / 2 + 12, 
            0x990000, 
            0.4
        );
        
        // Pulsing vampire regeneration
        this.scene.tweens.add({
            targets: healEffect,
            alpha: 0,
            scale: 1.8,
            duration: 600,
            onComplete: () => healEffect.destroy()
        });
        
        // Add blood sparkles rising up
        for (let i = 0; i < 4; i++) {
            const sparkle = this.scene.add.circle(
                this.gameObject.x + (Math.random() - 0.5) * 25,
                this.gameObject.y + (Math.random() - 0.5) * 25,
                2,
                0xCC0000
            );
            
            this.scene.tweens.add({
                targets: sparkle,
                y: sparkle.y - 30,
                alpha: 0,
                scale: 0.5,
                duration: 1000,
                delay: i * 120,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    aggressiveVampireAI() {
        // Check if enemy is being knocked back
        if (this.gameObject.knockbackTime && this.scene.time.now < this.gameObject.knockbackTime) {
            return; // Don't apply AI movement during knockback
        }
        
        // Vampires get faster and more aggressive when wounded (bloodlust)
        const healthPercentage = this.gameObject.health / this.gameObject.maxHealth;
        const bloodlustMultiplier = healthPercentage < 0.5 ? 1.4 : 1.2; // 40% faster when wounded, 20% normally
        
        this.moveTowardPlayer({
            speedMultiplier: bloodlustMultiplier,
            minDistance: 2, // Get very close
            drift: true,
            driftFunction: () => {
                // Slightly erratic movement like a predator stalking
                const time = this.scene.time.now * 0.001;
                return {
                    x: Math.sin(time * 2) * 0.3,
                    y: Math.cos(time * 1.7) * 0.3
                };
            }
        });
    }

    onContactWithPlayer(player) {
        // Apply bleed effect and life steal
        this.applyVampireBite();
        
        // Call parent contact behavior for damage
        super.onContactWithPlayer(player);
        
        // Show vampire bite effect
        this.showVampireBiteEffect();
    }

    applyVampireBite() {
        // Apply bleed effect through the enemy system
        if (this.scene.enemySystem && this.scene.enemySystem.applyBleedEffect) {
            this.scene.enemySystem.applyBleedEffect();
        }
        
        // Life steal - heal vampire based on damage dealt
        const damageDealt = this.gameObject.contactDamage;
        const healAmount = Math.floor(damageDealt * this.lifeStealRate);
        
        if (healAmount > 0 && this.gameObject.health < this.gameObject.maxHealth) {
            this.gameObject.health = Math.min(this.gameObject.maxHealth, this.gameObject.health + healAmount);
            this.showLifeStealEffect();
        }
    }

    showVampireBiteEffect() {
        if (!this.isOperationSafe(true, true)) return;
        
        // Create blood splash effect at bite location
        const biteX = (this.gameObject.x + this.scene.player.x) / 2;
        const biteY = (this.gameObject.y + this.scene.player.y) / 2;
        
        const splashEffect = this.scene.add.circle(biteX, biteY, 20, 0xCC0000, 0.8);
        
        this.scene.tweens.add({
            targets: splashEffect,
            alpha: 0,
            scale: 2.5,
            duration: 300,
            onComplete: () => splashEffect.destroy()
        });
        
        // Blood particles spraying outward
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 35;
            const particleX = biteX + Math.cos(angle) * 10;
            const particleY = biteY + Math.sin(angle) * 10;
            
            const particle = this.scene.add.circle(particleX, particleY, 3, 0xAA0000);
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * distance,
                y: particle.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.3,
                duration: 500,
                delay: i * 40,
                onComplete: () => particle.destroy()
            });
        }
    }

    showLifeStealEffect() {
        if (!this.isOperationSafe(true)) return;
        
        // Green healing mixed with red vampire energy
        const lifeStealEffect = this.scene.add.circle(
            this.gameObject.x, 
            this.gameObject.y, 
            this.data.baseStats.displaySize / 2 + 5, 
            0x00AA00, 
            0.6
        );
        
        // Quick flash to show life steal
        this.scene.tweens.add({
            targets: lifeStealEffect,
            alpha: 0,
            scale: 1.3,
            duration: 200,
            onComplete: () => lifeStealEffect.destroy()
        });
        
        // Brief vampire glow
        const vampireGlow = this.scene.add.circle(
            this.gameObject.x, 
            this.gameObject.y, 
            this.data.baseStats.displaySize / 2, 
            0xFF0000, 
            0.4
        );
        
        this.scene.tweens.add({
            targets: vampireGlow,
            alpha: 0,
            duration: 300,
            onComplete: () => vampireGlow.destroy()
        });
    }

    onDeath() {
        // Clean up vampire aura
        if (this.bloodAura && this.bloodAura.active) {
            this.scene.tweens.killTweensOf(this.bloodAura);
            this.bloodAura.destroy();
        }
        
        // Vampire death explosion with blood theme
        const deathEffect = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2,
            0x660000,
            0.9
        );
        
        this.scene.tweens.add({
            targets: deathEffect,
            alpha: 0,
            scale: 3.5,
            duration: 700,
            onComplete: () => deathEffect.destroy()
        });
        
        // Blood burst effect
        this.createParticleBurst(8, {
            color: 0x990000,
            distance: 45,
            radius: 4,
            duration: 800,
            staggered: true
        });
    }

    cleanup() {
        // Clean up vampire-specific effects
        if (this.bloodAura && this.bloodAura.active) {
            this.scene.tweens.killTweensOf(this.bloodAura);
            this.bloodAura.destroy();
        }
        
        // Call parent cleanup
        super.cleanup();
    }

    // Vampire Bufo doesn't use projectiles
    getCollisionHandlers() {
        return [];
    }
}

export default VampireBufo; 