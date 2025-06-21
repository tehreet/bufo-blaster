import BaseEnemy from './BaseEnemy.js';

class GhostBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
        
        // Ghost-specific properties
        this.reflectionPower = 0.6; // Reflects 60% of damage back
        this.maxReflectedDamage = 100; // Maximum total damage that can be reflected
        this.totalReflectedDamage = 0; // Track total reflected damage
        this.ghostlyAlpha = 0.7; // Translucent appearance
        this.phaseTimer = 0; // For ghostly phasing effect
    }
    
    setupAbility() {
        // Set initial ghostly appearance
        this.gameObject.setAlpha(this.ghostlyAlpha);
        this.gameObject.setTint(0xBBBBFF); // Slight blue tint for ghostly effect
        
        // Ghost Bufo doesn't have active abilities, just passive reflection
        // But we can add ghostly visual effects
        this.setupGhostlyEffects();
    }
    
    setupGhostlyEffects() {
        // Safety check: ensure gameObject and scene still exist
        if (!this.gameObject || !this.scene || this.gameObject.active === false) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        // Create ethereal aura effect
        this.createVisualEffect(this.gameObject.x, this.gameObject.y, {
            radius: 25,
            color: 0x9999FF,
            alpha: 0.2,
            duration: 2000,
            endScale: 1.5
        });
        
        // Schedule next aura effect only if still active
        if (this.gameObject && this.gameObject.active && this.scene) {
            this.createAbilityTimer('ghostAura', {
                delay: 3000,
                callback: () => this.setupGhostlyEffects(),
                loop: false
            });
        }
    }
    
    updateAbilities() {
        // Update ghostly phasing visual effect
        this.updateGhostlyPhasing();
    }
    
    updateGhostlyPhasing() {
        // Safety check: ensure gameObject still exists and is active
        if (!this.gameObject || this.gameObject.active === false) {
            return;
        }
        
        this.phaseTimer += 0.05;
        
        // Gentle alpha oscillation for ghostly effect
        const phaseAlpha = this.ghostlyAlpha + Math.sin(this.phaseTimer) * 0.15;
        this.gameObject.setAlpha(Math.max(0.4, Math.min(0.9, phaseAlpha)));
    }
    
    updateAI() {
        // Ghost Bufo moves slower and more erratically
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
        
        if (distance > 50) {
            // Move toward player but slower and with some drift
            const moveSpeed = this.gameObject.speed * 0.6; // 40% slower than normal
            const driftX = Math.sin(this.phaseTimer * 2) * 0.5; // Ghostly drift
            const driftY = Math.cos(this.phaseTimer * 1.7) * 0.5;
            
            try {
                this.scene.matter.body.setVelocity(this.gameObject.body, {
                    x: (dx / distance) * moveSpeed / 50 + driftX,
                    y: (dy / distance) * moveSpeed / 50 + driftY
                });
            } catch (error) {
                // Handle velocity setting errors silently
            }
        }
    }
    
    // Override takeDamage to implement reflection mechanics
    takeDamage(damage) {
        // Check if we can still reflect damage
        const canReflect = this.totalReflectedDamage < this.maxReflectedDamage;
        
        if (canReflect && this.scene.player) {
            // Calculate reflected damage
            const reflectedDamage = Math.floor(damage * this.reflectionPower);
            const actualReflectedDamage = Math.min(
                reflectedDamage, 
                this.maxReflectedDamage - this.totalReflectedDamage
            );
            
            if (actualReflectedDamage > 0) {
                // Reflect damage back to player
                this.reflectDamageToPlayer(actualReflectedDamage);
                this.totalReflectedDamage += actualReflectedDamage;
                
                // Reduce damage taken based on reflection
                damage = Math.ceil(damage * (1 - this.reflectionPower));
                
                // Visual feedback for reflection
                this.createReflectionEffect();
            }
        }
        
        // Take reduced damage - we need to implement damage handling for game object
        this.gameObject.health -= damage;
        if (this.gameObject.health <= 0) {
            this.die();
        }
        
        // Check if reflection power is exhausted
        if (this.totalReflectedDamage >= this.maxReflectedDamage) {
            this.onReflectionExhausted();
        }
    }
    
    reflectDamageToPlayer(damage) {
        // Damage the player
        if (this.scene.player && this.scene.player.takeDamage) {
            this.scene.player.takeDamage(damage);
        }
        
        // Create visual line effect from ghost to player
        this.createReflectionBeam();
    }
    
    createReflectionEffect() {
        // Safety check: ensure gameObject and scene still exist
        if (!this.gameObject || !this.scene || this.gameObject.active === false) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        // Flash effect when reflecting damage
        if (this.gameObject.setTint) {
            this.gameObject.setTint(0xFFFFFF);
        }
        
        if (this.scene.time) {
            this.scene.time.delayedCall(100, () => {
                if (this.gameObject && this.gameObject.active && this.scene && this.gameObject.setTint) {
                    this.gameObject.setTint(0xBBBBFF);
                }
            });
        }
        
        // Particle-like effect
        for (let i = 0; i < 3; i++) {
            if (this.scene.time) {
                this.scene.time.delayedCall(i * 50, () => {
                    if (this.gameObject && this.gameObject.active && this.scene && 
                        typeof this.gameObject.x === 'number' && typeof this.gameObject.y === 'number') {
                        this.createVisualEffect(
                            this.gameObject.x + (Math.random() - 0.5) * 30,
                            this.gameObject.y + (Math.random() - 0.5) * 30,
                            {
                                radius: 8,
                                color: 0x9999FF,
                                alpha: 0.8,
                                duration: 300,
                                endScale: 2
                            }
                        );
                    }
                });
            }
        }
    }
    
    createReflectionBeam() {
        // Safety checks: ensure all required objects exist
        if (!this.scene || !this.scene.player || !this.gameObject || !this.scene.add) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number' ||
            typeof this.scene.player.x !== 'number' || typeof this.scene.player.y !== 'number') {
            return;
        }
        
        // Create temporary beam visual
        const beam = this.scene.add.line(
            0, 0,
            this.gameObject.x, this.gameObject.y,
            this.scene.player.x, this.scene.player.y,
            0x9999FF, 0.6
        );
        beam.setLineWidth(3);
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(beam);
        }
        
        // Fade out beam
        if (this.scene.tweens) {
            this.scene.tweens.add({
                targets: beam,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    if (beam && beam.destroy) {
                        beam.destroy();
                    }
                }
            });
        }
    }
    
    onReflectionExhausted() {
        // Safety check: ensure gameObject still exists
        if (!this.gameObject || this.gameObject.active === false) {
            return;
        }
        
        // Additional check: ensure position properties are valid
        if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
            return;
        }
        
        // Ghost becomes more vulnerable when reflection power is used up
        if (this.gameObject.setTint) {
            this.gameObject.setTint(0xFFBBBB); // Reddish tint to show vulnerability
        }
        this.ghostlyAlpha = 0.9; // Less transparent
        
        // Visual feedback
        this.createVisualEffect(this.gameObject.x, this.gameObject.y, {
            radius: 40,
            color: 0xFF6666,
            alpha: 0.4,
            duration: 1000,
            endScale: 2
        });
    }
    
    // Override death to create special ghostly death effect
    die() {
        // Create ghostly dispersion effect only if position is valid
        if (this.gameObject && typeof this.gameObject.x === 'number' && typeof this.gameObject.y === 'number') {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const offsetX = Math.cos(angle) * 30;
                const offsetY = Math.sin(angle) * 30;
                
                this.createVisualEffect(this.gameObject.x + offsetX, this.gameObject.y + offsetY, {
                    radius: 12,
                    color: 0x9999FF,
                    alpha: 0.7,
                    duration: 800,
                    endScale: 3
                });
            }
        }
        
        // Cleanup and destroy
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

    // Ghost Bufo doesn't use projectiles, so return empty collision handlers
    getCollisionHandlers() {
        return [];
    }
}

export default GhostBufo; 