import BaseEnemy from './BaseEnemy.js';

class HazmatBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
    }

    setupAbility() {
        // Initialize poison effect system
        this.setAbilityState('poisonAuraActive', false);
        this.setAbilityState('lastAuraTime', 0);
        this.setAbilityState('auraInterval', 2000); // Show poison aura every 2 seconds
        
        // Create persistent poison aura effect
        this.createPoisonAura();
    }

    updateAbility() {
        this.updatePoisonAura();
    }

    createPoisonAura() {
        // Create a subtle green aura around the hazmat bufo
        const aura = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2 + 5,
            0x00ff00,
            0.1
        );
        
        // Store reference to aura
        this.poisonAura = aura;
        
        // Make it pulse slowly
        this.scene.tweens.add({
            targets: aura,
            alpha: 0.3,
            scale: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    updatePoisonAura() {
        // Keep aura positioned with the enemy
        if (this.poisonAura && this.poisonAura.active) {
            this.poisonAura.x = this.gameObject.x;
            this.poisonAura.y = this.gameObject.y;
        }
        
        // Occasionally show poison bubbles
        const currentTime = this.scene.time.now;
        const lastAuraTime = this.getAbilityState('lastAuraTime');
        const auraInterval = this.getAbilityState('auraInterval');
        
        if (currentTime - lastAuraTime >= auraInterval) {
            this.showPoisonBubbles();
            this.setAbilityState('lastAuraTime', currentTime);
        }
    }

    showPoisonBubbles() {
        // Create small poison bubbles around the enemy
        for (let i = 0; i < 3; i++) {
            const bubble = this.scene.add.circle(
                this.gameObject.x + (Math.random() - 0.5) * 40,
                this.gameObject.y + (Math.random() - 0.5) * 40,
                3,
                0x00ff00,
                0.6
            );
            
            this.scene.tweens.add({
                targets: bubble,
                y: bubble.y - 30,
                alpha: 0,
                scale: 0.5,
                duration: 1500,
                delay: i * 200,
                onComplete: () => bubble.destroy()
            });
        }
    }

    onContactWithPlayer(player) {
        // Call parent contact behavior (which applies poison)
        super.onContactWithPlayer(player);
        
        // Add special poison contact effect
        this.showPoisonContactEffect();
    }

    showPoisonContactEffect() {
        // Green toxic splash effect
        const splashEffect = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2 + 10,
            0x00ff00,
            0.7
        );
        
        this.scene.tweens.add({
            targets: splashEffect,
            alpha: 0,
            scale: 2.5,
            duration: 400,
            onComplete: () => splashEffect.destroy()
        });
        
        // Add some toxic particles
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                this.gameObject.x,
                this.gameObject.y,
                2,
                0x00ff00
            );
            
            const angle = (Math.PI * 2 * i) / 5;
            const distance = 50;
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * distance,
                y: particle.y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 600,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
    }

    onDeath() {
        // Clean up poison aura
        if (this.poisonAura && this.poisonAura.active) {
            this.scene.tweens.killTweensOf(this.poisonAura);
            this.poisonAura.destroy();
        }
        
        // Show toxic death explosion
        const deathEffect = this.scene.add.circle(
            this.gameObject.x,
            this.gameObject.y,
            this.data.baseStats.displaySize / 2,
            0x00ff00,
            0.8
        );
        
        this.scene.tweens.add({
            targets: deathEffect,
            alpha: 0,
            scale: 3,
            duration: 500,
            onComplete: () => deathEffect.destroy()
        });
    }

    cleanup() {
        // Clean up poison aura when enemy is destroyed
        if (this.poisonAura && this.poisonAura.active) {
            this.scene.tweens.killTweensOf(this.poisonAura);
            this.poisonAura.destroy();
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}

export default HazmatBufo; 