import BaseEnemy from './BaseEnemy.js';

class GhostBufo extends BaseEnemy {
    constructor(scene, x, y, enemyData) {
        super(scene, x, y, enemyData);
        
        // Ghost-specific properties
        this.reflectionPower = 0.6; // Reflects 60% of damage back
        this.maxReflectedDamage = 100; // Maximum total damage that can be reflected
        this.totalReflectedDamage = 0; // Track total reflected damage
        this.ghostlyAlpha = 0.7; // Translucent appearance
        this.phaseTimer = 0; // For ghostly phasing effect
        
        // Set ghostly appearance
        this.setAlpha(this.ghostlyAlpha);
        this.setTint(0xBBBBFF); // Slight blue tint for ghostly effect
    }
    
    setupAbilities() {
        // Ghost Bufo doesn't have active abilities, just passive reflection
        // But we can add ghostly visual effects
        this.setupGhostlyEffects();
    }
    
    setupGhostlyEffects() {
        // Create ethereal aura effect
        this.createVisualEffect(this.x, this.y, {
            radius: 25,
            color: 0x9999FF,
            alpha: 0.2,
            duration: 2000,
            endScale: 1.5
        });
        
        // Schedule next aura effect
        this.createAbilityTimer('ghostAura', {
            delay: 3000,
            callback: () => this.setupGhostlyEffects(),
            loop: false
        });
    }
    
    updateAbilities() {
        // Update ghostly phasing visual effect
        this.updateGhostlyPhasing();
    }
    
    updateGhostlyPhasing() {
        this.phaseTimer += 0.05;
        
        // Gentle alpha oscillation for ghostly effect
        const phaseAlpha = this.ghostlyAlpha + Math.sin(this.phaseTimer) * 0.15;
        this.setAlpha(Math.max(0.4, Math.min(0.9, phaseAlpha)));
    }
    
    updateAI() {
        // Ghost Bufo moves slower and more erratically
        if (!this.scene.player || !this.body) return;
        
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
            // Move toward player but slower and with some drift
            const moveSpeed = this.getEnemyData().speed * 0.6; // 40% slower than normal
            const driftX = Math.sin(this.phaseTimer * 2) * 0.5; // Ghostly drift
            const driftY = Math.cos(this.phaseTimer * 1.7) * 0.5;
            
            try {
                this.scene.matter.body.setVelocity(this.body, {
                    x: (dx / distance) * moveSpeed + driftX,
                    y: (dy / distance) * moveSpeed + driftY
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
        
        // Take reduced damage
        super.takeDamage(damage);
        
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
        // Flash effect when reflecting damage
        this.setTint(0xFFFFFF);
        this.scene.time.delayedCall(100, () => {
            if (this.active && this.scene) {
                this.setTint(0xBBBBFF);
            }
        });
        
        // Particle-like effect
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                if (this.active && this.scene) {
                    this.createVisualEffect(
                        this.x + (Math.random() - 0.5) * 30,
                        this.y + (Math.random() - 0.5) * 30,
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
    
    createReflectionBeam() {
        if (!this.scene.player) return;
        
        // Create temporary beam visual
        const beam = this.scene.add.line(
            0, 0,
            this.x, this.y,
            this.scene.player.x, this.scene.player.y,
            0x9999FF, 0.6
        );
        beam.setLineWidth(3);
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(beam);
        }
        
        // Fade out beam
        this.scene.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 200,
            onComplete: () => beam.destroy()
        });
    }
    
    onReflectionExhausted() {
        // Ghost becomes more vulnerable when reflection power is used up
        this.setTint(0xFFBBBB); // Reddish tint to show vulnerability
        this.ghostlyAlpha = 0.9; // Less transparent
        
        // Visual feedback
        this.createVisualEffect(this.x, this.y, {
            radius: 40,
            color: 0xFF6666,
            alpha: 0.4,
            duration: 1000,
            endScale: 2
        });
    }
    
    // Override death to create special ghostly death effect
    die() {
        // Create ghostly dispersion effect
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const offsetX = Math.cos(angle) * 30;
            const offsetY = Math.sin(angle) * 30;
            
            this.createVisualEffect(this.x + offsetX, this.y + offsetY, {
                radius: 12,
                color: 0x9999FF,
                alpha: 0.7,
                duration: 800,
                endScale: 3
            });
        }
        
        // Call parent death
        super.die();
    }
    
    // Ghost Bufo doesn't use projectiles, so return empty collision handlers
    getCollisionHandlers() {
        return [];
    }
}

export default GhostBufo; 