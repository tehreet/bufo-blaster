import BaseEnemy from './BaseEnemy.js';

class MeltdownBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
        
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
    }
    
    setupAbility() {
        // Set initial distressed appearance
        this.gameObject.setTint(0xFFAAAA); // Slightly reddish tint
        this.gameObject.setScale(1.0); // Normal size
        
        // Simple stress indicators without complex timers
        this.setupStressIndicators();
    }
    
    setupStressIndicators() {
        // Simple periodic stress particle effects - less frequent to avoid spam
        this.createAbilityTimer('stressParticles', {
            delay: 2000, // Every 2 seconds instead of 1
            callback: () => this.createStressParticles(),
            loop: true
        });
    }
    
    createStressParticles() {
        // Safety check: ensure gameObject and scene still exist
        if (!this.gameObject || !this.scene || this.gameObject.active === false) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        // Simple single particle - no delays or loops
        const particle = this.scene.add.circle(
            this.gameObject.x + (Math.random() - 0.5) * 20,
            this.gameObject.y + (Math.random() - 0.5) * 20,
            4,
            this.isTriggered ? 0xFF4444 : 0xFF8888,
            0.6
        );
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(particle);
        }
        
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 2,
            duration: 400,
            onComplete: () => {
                if (particle && particle.destroy) {
                    particle.destroy();
                }
            }
        });
    }
    
    updateAbility() {
        if (this.isTriggered) {
            this.updateMeltdownSequence();
        }
        this.updateVisualEffects();
    }
    
    updateMeltdownSequence() {
        // Safety check: ensure scene and gameObject still exist
        if (!this.scene || !this.gameObject || this.gameObject.active === false) {
            return;
        }
        
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
        
        // Simple visual feedback - no complex color interpolation
        if (this.gameObject.setTint) {
            if (progress < 0.33) {
                this.gameObject.setTint(0xFF8800); // Orange warning
            } else if (progress < 0.66) {
                this.gameObject.setTint(0xFF4400); // Red danger  
            } else {
                this.gameObject.setTint(0xFF0000); // Critical red
            }
        }
        
        // Slight scale increase
        const scale = 1.0 + (progress * 0.2); // Grows from 1.0 to 1.2 (subtle)
        if (this.gameObject.setScale) {
            this.gameObject.setScale(scale);
        }
        
        // No complex particle generation during countdown to avoid crashes
    }
    
    updateVisualEffects() {
        // Simplified - no complex pulsating effects that can cause issues
        if (this.isTriggered && this.gameObject && this.gameObject.setAlpha) {
            this.gameObject.setAlpha(1.0); // Just keep it solid
        }
    }
    
    updateAI() {
        // Meltdown Bufo is very fast and aggressive
        if (!this.scene.player || !this.gameObject.body) return;
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number' ||
            typeof this.scene.player.x !== 'number' || typeof this.scene.player.y !== 'number') {
            return;
        }
        
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const dx = playerX - this.gameObject.x;
        const dy = playerY - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check for contact trigger
        if (distance < 30 && !this.isTriggered) {
            this.triggerMeltdown();
        }
        
        // Fast, aggressive movement toward player
        const moveSpeed = this.isTriggered ? 
            this.gameObject.speed * 0.5 : // Slower when triggered (focusing on explosion)
            this.gameObject.speed * 1.8;   // Very fast normally
        
        if (distance > 20) {
            try {
                this.scene.matter.body.setVelocity(this.gameObject.body, {
                    x: (dx / distance) * moveSpeed / 50,
                    y: (dy / distance) * moveSpeed / 50
                });
            } catch (error) {
                // Handle velocity setting errors silently
            }
        }
    }
    
    triggerMeltdown() {
        if (this.isTriggered) return; // Already triggered
        
        // Additional check: ensure position properties are valid
        if (!this.gameObject || typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        this.isTriggered = true;
        this.meltdownStartTime = this.scene.time.now;
        
        // Visual feedback for trigger
        this.createVisualEffect(this.gameObject.x, this.gameObject.y, {
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
        // Safety check: ensure gameObject and scene still exist
        if (!this.gameObject || !this.scene || this.gameObject.active === false) {
            return;
        }
        
        // Create massive explosion visual
        this.createExplosionVisual();
        
        // Deal damage to player if in range
        this.dealExplosionDamage();
        
        // Destroy self
        this.die();
    }
    
    createExplosionVisual() {
        // Safety check: ensure gameObject and scene still exist
        if (!this.gameObject || !this.scene) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        // Store position before cleanup (object might be destroyed)
        const explosionX = this.gameObject.x;
        const explosionY = this.gameObject.y;
        
        // Simple single explosion effect - like other effects in game
        const explosionEffect = this.scene.add.circle(explosionX, explosionY, this.explosionRadius, 0xFF4400, 0.6);
        explosionEffect.setStrokeStyle(3, 0xFF0000);
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(explosionEffect);
        }

        // Simple tween animation
        this.scene.tweens.add({
            targets: explosionEffect,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => {
                if (explosionEffect && explosionEffect.destroy) {
                    explosionEffect.destroy();
                }
            }
        });
    }
    
    dealExplosionDamage() {
        // Check if player is in explosion radius
        if (!this.scene.player) return;
        
        // Additional check: ensure position properties are valid
        if (!this.gameObject || typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number' ||
            typeof this.scene.player.x !== 'number' || typeof this.scene.player.y !== 'number') {
            return;
        }
        
        const playerDistance = Phaser.Math.Distance.Between(
            this.gameObject.x, this.gameObject.y,
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
        
        // Additional check: ensure position properties are valid
        if (!this.gameObject || typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number' ||
            typeof this.scene.player.x !== 'number' || typeof this.scene.player.y !== 'number') {
            return;
        }
        
        const dx = this.scene.player.x - this.gameObject.x;
        const dy = this.scene.player.y - this.gameObject.y;
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
        // Take damage on game object
        this.gameObject.health -= damage;
        
        // 30% chance to trigger meltdown when taking damage (if not already triggered)
        if (!this.isTriggered && this.gameObject.health > 0 && Math.random() < 0.3) {
            this.triggerMeltdown();
        }
        
        // Check if should die
        if (this.gameObject.health <= 0) {
            this.die();
        }
    }
    
    // Override death - simplified and safe
    die() {
        // Safety check first
        if (!this.gameObject || this.gameObject.active === false) {
            return;
        }
        
        // Create simple death effect
        if (typeof this.gameObject.x === 'number' && typeof this.gameObject.y === 'number') {
            const deathEffect = this.scene.add.circle(this.gameObject.x, this.gameObject.y, 30, 0x888888, 0.5);
            if (this.scene.auraEffects) {
                this.scene.auraEffects.add(deathEffect);
            }
            
            this.scene.tweens.add({
                targets: deathEffect,
                alpha: 0,
                scale: 2,
                duration: 400,
                onComplete: () => {
                    if (deathEffect && deathEffect.destroy) {
                        deathEffect.destroy();
                    }
                }
            });
        }
        
        // Clean shutdown
        this.cleanup();
        if (this.gameObject && this.gameObject.destroy) {
            this.gameObject.destroy();
        }
    }
    
    // Helper method to create visual effects
    createVisualEffect(x, y, config) {
        // Safety check: ensure scene still exists
        if (!this.scene || !this.scene.add) {
            return null;
        }
        
        const effect = this.scene.add.circle(x, y, config.radius || 20, config.color || 0xffffff, config.alpha || 0.5);
        if (config.stroke) {
            effect.setStrokeStyle(config.stroke.width || 2, config.stroke.color || 0xffffff);
        }
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(effect);
        }

        // Animate the effect
        if (this.scene.tweens) {
            this.scene.tweens.add({
                targets: effect,
                alpha: 0,
                scale: config.endScale || 2,
                duration: config.duration || 500,
                onComplete: () => {
                    if (effect && effect.destroy) {
                        effect.destroy();
                    }
                }
            });
        }

        return effect;
    }

    // Meltdown Bufo doesn't use projectiles
    getCollisionHandlers() {
        return [];
    }
}

export default MeltdownBufo; 