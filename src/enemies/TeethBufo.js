import BaseEnemy from './BaseEnemy.js';

class TeethBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
    }

    setupAbility() {
        // Initialize regeneration system
        this.setAbilityState('lastRegenTime', 0);
        this.setAbilityState('regenRate', this.data.baseStats.healthRegen || 0.5);
        this.setAbilityState('regenInterval', 1000); // Regenerate every second
        
        // Visual effect for regeneration
        this.setAbilityState('showingRegenEffect', false);
    }

    updateAbility() {
        this.updateHealthRegeneration();
    }

    updateAI() {
        // Use more aggressive chase AI since this enemy is tanky
        this.aggressiveChaseAI();
    }

    updateHealthRegeneration() {
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
                
                // Show visual effect if health was actually regenerated
                if (this.gameObject.health > oldHealth) {
                    this.showRegenerationEffect();
                }
            }
            
            this.setAbilityState('lastRegenTime', currentTime);
        }
    }

    showRegenerationEffect() {
        // Don't show multiple effects at once
        if (this.getAbilityState('showingRegenEffect')) return;
        
        this.setAbilityState('showingRegenEffect', true);
        
        // Create green healing particles around the enemy
        const healEffect = this.scene.add.circle(
            this.gameObject.x, 
            this.gameObject.y, 
            this.data.baseStats.displaySize / 2 + 10, 
            0x00ff00, 
            0.3
        );
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: healEffect,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => {
                healEffect.destroy();
                this.setAbilityState('showingRegenEffect', false);
            }
        });
        
        // Add some sparkle particles
        for (let i = 0; i < 3; i++) {
            const sparkle = this.scene.add.circle(
                this.gameObject.x + (Math.random() - 0.5) * 30,
                this.gameObject.y + (Math.random() - 0.5) * 30,
                2,
                0x00ff00
            );
            
            this.scene.tweens.add({
                targets: sparkle,
                y: sparkle.y - 20,
                alpha: 0,
                duration: 800,
                delay: i * 100,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    aggressiveChaseAI() {
        if (!this.scene.player || !this.gameObject.body) return;
        
        // Check if enemy is being knocked back
        if (this.gameObject.knockbackTime && this.scene.time.now < this.gameObject.knockbackTime) {
            return; // Don't apply AI movement during knockback
        }
        
        const dx = this.scene.player.x - this.gameObject.x;
        const dy = this.scene.player.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 3) { // Slightly more aggressive - gets closer
            // Move 25% faster than base speed when health is low (berserker mode)
            const healthPercentage = this.gameObject.health / this.gameObject.maxHealth;
            const speedMultiplier = healthPercentage < 0.5 ? 1.25 : 1.0;
            
            const velocityX = (dx / distance) * this.gameObject.speed * speedMultiplier / 50;
            const velocityY = (dy / distance) * this.gameObject.speed * speedMultiplier / 50;
            
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
        // Call parent contact behavior
        super.onContactWithPlayer(player);
        
        // Add extra visual feedback for this tanky enemy
        this.showContactEffect();
    }

    showContactEffect() {
        // Red impact effect to show this enemy hits hard
        const impactEffect = this.scene.add.circle(
            this.gameObject.x, 
            this.gameObject.y, 
            this.data.baseStats.displaySize / 2, 
            0xff0000, 
            0.6
        );
        
        this.scene.tweens.add({
            targets: impactEffect,
            alpha: 0,
            scale: 1.8,
            duration: 200,
            onComplete: () => impactEffect.destroy()
        });
    }

    onDeath() {
        // Show a more dramatic death effect for this tough enemy
        const deathEffect = this.scene.add.circle(
            this.gameObject.x, 
            this.gameObject.y, 
            this.data.baseStats.displaySize / 2, 
            0x8b0000, 
            0.8
        );
        
        this.scene.tweens.add({
            targets: deathEffect,
            alpha: 0,
            scale: 3,
            duration: 600,
            onComplete: () => deathEffect.destroy()
        });
    }
}

export default TeethBufo; 