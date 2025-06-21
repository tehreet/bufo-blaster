import BaseEnemy from './BaseEnemy.js';

class MeltdownBufo extends BaseEnemy {
    constructor(scene, x, y, enemyData) {
        super(scene, x, y, enemyData);
        
        // Meltdown-specific properties
        this.explosionDamage = 25; // High explosion damage
        this.explosionRadius = 120; // Large explosion radius
        this.meltdownTime = 3000; // 3 seconds until explosion
        this.isTriggered = false; // Whether countdown has started
        this.meltdownStartTime = 0; // When countdown began
        this.pulsateTimer = 0; // For visual pulsing effect
        this.agitationLevel = 0; // Visual agitation as countdown progresses
        
        // Visual state for meltdown
        this.originalTint = 0xFFFFFF;
        this.warningTint = 0xFF4444; // Red warning color
        this.criticalTint = 0xFF0000; // Critical red color
        
        // Set initial distressed appearance
        this.setTint(0xFFAAAA); // Slightly reddish tint
        this.setScale(0.9); // Slightly smaller but will grow during meltdown
    }
    
    setupAbilities() {
        // Meltdown Bufo doesn't have regular abilities, just the meltdown sequence
        // But we can add stress indicators
        this.setupStressIndicators();
    }
    
    setupStressIndicators() {
        // Create periodic stress particle effects
        this.createAbilityTimer('stressParticles', {
            delay: 1000,
            callback: () => this.createStressParticles(),
            loop: true
        });
    }
    
    createStressParticles() {
        if (!this.active || !this.scene) return;
        
        // Create small particle effect to show instability
        const particleCount = this.isTriggered ? 5 : 2;
        
        for (let i = 0; i < particleCount; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (this.active && this.scene) {
                    this.createVisualEffect(
                        this.x + (Math.random() - 0.5) * 25,
                        this.y + (Math.random() - 0.5) * 25,
                        {
                            radius: 4,
                            color: this.isTriggered ? 0xFF4444 : 0xFF8888,
                            alpha: 0.6,
                            duration: 400,
                            endScale: 2
                        }
                    );
                }
            });
        }
    }
    
    updateAbilities() {
        if (this.isTriggered) {
            this.updateMeltdownSequence();
        }
        this.updateVisualEffects();
    }
    
    updateMeltdownSequence() {
        const currentTime = this.scene.time.now;
        const elapsed = currentTime - this.meltdownStartTime;
        const remaining = this.meltdownTime - elapsed;
        
        if (remaining <= 0) {
            // Time's up - EXPLODE!
            this.explode();
            return;
        }
        
        // Update agitation level based on remaining time
        const progress = elapsed / this.meltdownTime;
        this.agitationLevel = progress;
        
        // Visual feedback based on how close to explosion
        if (progress < 0.5) {
            // First half - warning phase
            this.setTint(Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 170, b: 170 },
                { r: 255, g: 68, b: 68 },
                Math.floor(progress * 100),
                100
            ));
        } else {
            // Second half - critical phase
            this.setTint(Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 68, b: 68 },
                { r: 255, g: 0, b: 0 },
                Math.floor((progress - 0.5) * 200),
                100
            ));
        }
        
        // Scale grows as explosion approaches
        const scale = 0.9 + (progress * 0.3); // Grows from 0.9 to 1.2
        this.setScale(scale);
        
        // Faster particle generation as countdown progresses
        if (progress > 0.7 && currentTime % 200 < 50) { // Every 200ms in final phase
            this.createStressParticles();
        }
    }
    
    updateVisualEffects() {
        this.pulsateTimer += 0.1;
        
        if (this.isTriggered) {
            // Pulsating effect during countdown
            const pulsate = Math.sin(this.pulsateTimer * (1 + this.agitationLevel * 3));
            const alphaMod = 0.2 + (pulsate * 0.1);
            this.setAlpha(0.9 + alphaMod);
        }
    }
    
    updateAI() {
        // Meltdown Bufo is very fast and aggressive
        if (!this.scene.player || !this.body) return;
        
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for contact trigger
        if (distance < 30 && !this.isTriggered) {
            this.triggerMeltdown();
        }
        
        // Fast, aggressive movement toward player
        const moveSpeed = this.isTriggered ? 
            this.getEnemyData().speed * 0.5 : // Slower when triggered (focusing on explosion)
            this.getEnemyData().speed * 1.8;   // Very fast normally
        
        if (distance > 20) {
            try {
                this.scene.matter.body.setVelocity(this.body, {
                    x: (dx / distance) * moveSpeed,
                    y: (dy / distance) * moveSpeed
                });
            } catch (error) {
                // Handle velocity setting errors silently
            }
        }
    }
    
    triggerMeltdown() {
        if (this.isTriggered) return; // Already triggered
        
        this.isTriggered = true;
        this.meltdownStartTime = this.scene.time.now;
        
        // Visual feedback for trigger
        this.createVisualEffect(this.x, this.y, {
            radius: 50,
            color: 0xFF4444,
            alpha: 0.6,
            duration: 500,
            endScale: 2
        });
        
        // Play warning sound or effect if available
        // TODO: Add warning sound here
        
        // Stop regular stress particles, meltdown sequence will handle visuals
        this.removeAbilityTimer('stressParticles');
    }
    
    explode() {
        if (!this.active || !this.scene) return;
        
        // Create massive explosion visual
        this.createExplosionVisual();
        
        // Deal damage to player if in range
        this.dealExplosionDamage();
        
        // Destroy self
        this.die();
    }
    
    createExplosionVisual() {
        // Main explosion effect
        this.createVisualEffect(this.x, this.y, {
            radius: this.explosionRadius,
            color: 0xFF2200,
            alpha: 0.4,
            duration: 800,
            endScale: 1.5,
            stroke: { width: 4, color: 0xFF4400 }
        });
        
        // Secondary explosion rings
        for (let i = 1; i <= 3; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (this.scene && this.scene.add) {
                    this.createVisualEffect(this.x, this.y, {
                        radius: this.explosionRadius * (0.3 + i * 0.2),
                        color: 0xFF6600,
                        alpha: 0.3,
                        duration: 400,
                        endScale: 2
                    });
                }
            });
        }
        
        // Particle explosion
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = this.explosionRadius * (0.5 + Math.random() * 0.5);
            const particleX = this.x + Math.cos(angle) * distance;
            const particleY = this.y + Math.sin(angle) * distance;
            
            this.scene.time.delayedCall(Math.random() * 200, () => {
                if (this.scene && this.scene.add) {
                    this.createVisualEffect(particleX, particleY, {
                        radius: 15,
                        color: 0xFF8800,
                        alpha: 0.7,
                        duration: 600,
                        endScale: 3
                    });
                }
            });
        }
    }
    
    dealExplosionDamage() {
        // Check if player is in explosion radius
        if (!this.scene.player) return;
        
        const playerDistance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.scene.player.x, this.scene.player.y
        );
        
        if (playerDistance <= this.explosionRadius) {
            // Damage scales with distance (closer = more damage)
            const damageMultiplier = 1 - (playerDistance / this.explosionRadius);
            const actualDamage = Math.floor(this.explosionDamage * damageMultiplier);
            
            if (actualDamage > 0 && this.scene.player.takeDamage) {
                this.scene.player.takeDamage(actualDamage);
                
                // Knockback effect
                this.applyExplosionKnockback();
            }
        }
    }
    
    applyExplosionKnockback() {
        if (!this.scene.player || !this.scene.player.body) return;
        
        const dx = this.scene.player.x - this.x;
        const dy = this.scene.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const knockbackForce = 15;
            try {
                this.scene.matter.body.setVelocity(this.scene.player.body, {
                    x: (dx / distance) * knockbackForce,
                    y: (dy / distance) * knockbackForce
                });
            } catch (error) {
                // Handle knockback errors silently
            }
        }
    }
    
    // Override takeDamage to potentially trigger meltdown when damaged
    takeDamage(damage) {
        super.takeDamage(damage);
        
        // 30% chance to trigger meltdown when taking damage (if not already triggered)
        if (!this.isTriggered && this.health > 0 && Math.random() < 0.3) {
            this.triggerMeltdown();
        }
    }
    
    // Override death to prevent normal death if explosion is imminent
    die() {
        // If triggered but haven't exploded yet, force explosion
        if (this.isTriggered && this.health > 0) {
            this.explode();
            return;
        }
        
        // Create special death effect if not from explosion
        if (!this.isTriggered) {
            this.createVisualEffect(this.x, this.y, {
                radius: 30,
                color: 0x888888,
                alpha: 0.5,
                duration: 400,
                endScale: 2
            });
        }
        
        // Call parent death
        super.die();
    }
    
    // Meltdown Bufo doesn't use projectiles
    getCollisionHandlers() {
        return [];
    }
}

export default MeltdownBufo; 