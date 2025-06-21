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
        this.gameObject.setScale(0.9); // Slightly smaller but will grow during meltdown
        
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
        // Safety check: ensure gameObject and scene still exist
        if (!this.gameObject || !this.scene || this.gameObject.active === false) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        // Create small particle effect to show instability
        const particleCount = this.isTriggered ? 5 : 2;
        
        for (let i = 0; i < particleCount; i++) {
            if (this.scene.time) {
                this.scene.time.delayedCall(i * 100, () => {
                    if (this.gameObject && this.gameObject.active && this.scene &&
                        typeof this.gameObject.x === 'number' && typeof this.gameObject.y === 'number') {
                        this.createVisualEffect(
                            this.gameObject.x + (Math.random() - 0.5) * 25,
                            this.gameObject.y + (Math.random() - 0.5) * 25,
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
        
        // Visual feedback based on how close to explosion - MUCH MORE OBVIOUS
        if (this.gameObject.setTint) {
            if (progress < 0.33) {
                // First third - bright orange warning
                this.gameObject.setTint(0xFF8800);
            } else if (progress < 0.66) {
                // Second third - bright red danger (flashing)
                const flash = Math.sin(elapsed * 0.01) > 0 ? 0xFF2200 : 0xFF6600;
                this.gameObject.setTint(flash);
            } else {
                // Final third - rapid flashing bright red/white
                const rapidFlash = Math.sin(elapsed * 0.02) > 0 ? 0xFF0000 : 0xFFFFFF;
                this.gameObject.setTint(rapidFlash);
            }
        }
        
        // Scale grows dramatically as explosion approaches
        const scale = 0.8 + (progress * 0.6); // Grows from 0.8 to 1.4 (more dramatic)
        if (this.gameObject.setScale) {
            this.gameObject.setScale(scale);
        }
        
        // Screen shake effect in final second
        if (remaining < 1000 && this.scene.cameras) {
            const shakeIntensity = (1000 - remaining) / 1000 * 3; // 0 to 3 intensity
            this.scene.cameras.main.shake(50, shakeIntensity);
        }
        
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
            this.gameObject.setAlpha(0.9 + alphaMod);
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
        
        // Clean up and destroy (don't call die() to avoid recursion)
        this.cleanup();
        if (this.gameObject && this.gameObject.destroy) {
            this.gameObject.destroy();
        }
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
        
        // Main explosion effect
        this.createVisualEffect(this.gameObject.x, this.gameObject.y, {
            radius: this.explosionRadius,
            color: 0xFF2200,
            alpha: 0.4,
            duration: 800,
            endScale: 1.5,
            stroke: { width: 4, color: 0xFF4400 }
        });
        
        // Secondary explosion rings
        for (let i = 1; i <= 3; i++) {
            if (this.scene.time) {
                this.scene.time.delayedCall(i * 100, () => {
                    if (this.scene && this.scene.add && this.gameObject &&
                        typeof this.gameObject.x === 'number' && typeof this.gameObject.y === 'number') {
                        this.createVisualEffect(this.gameObject.x, this.gameObject.y, {
                            radius: this.explosionRadius * (0.3 + i * 0.2),
                            color: 0xFF6600,
                            alpha: 0.3,
                            duration: 400,
                            endScale: 2
                        });
                    }
                });
            }
        }
        
        // Particle explosion
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = this.explosionRadius * (0.5 + Math.random() * 0.5);
            const particleX = this.gameObject.x + Math.cos(angle) * distance;
            const particleY = this.gameObject.y + Math.sin(angle) * distance;
            
            if (this.scene.time) {
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
    
    // Handle direct contact with player - ALWAYS triggers meltdown
    onContactWithPlayer(player) {
        // Always trigger meltdown on contact with player
        if (!this.isTriggered) {
            this.triggerMeltdown();
        }
        
        // Still apply basic contact damage (minimal since explosion is the main threat)
        const damage = this.gameObject.contactDamage || 5;
        this.scene.statsSystem.takeDamage(damage);
        
        // Apply basic knockback
        if (player && player.body && this.gameObject) {
            const angle = Phaser.Math.Angle.Between(this.gameObject.x, this.gameObject.y, player.x, player.y);
            try {
                this.scene.matter.body.setVelocity(player.body, {
                    x: Math.cos(angle) * 4,
                    y: Math.sin(angle) * 4
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
    
    // Override death to ALWAYS explode
    die() {
        // MeltdownBufo ALWAYS explodes on death, regardless of trigger state
        if (this.gameObject && typeof this.gameObject.x === 'number' && typeof this.gameObject.y === 'number') {
            this.explode();
        } else {
            // Fallback cleanup if position is invalid
            this.cleanup();
            if (this.gameObject && this.gameObject.destroy) {
                this.gameObject.destroy();
            }
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