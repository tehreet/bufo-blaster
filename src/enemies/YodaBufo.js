// Yoda Bufo - Boss Enemy with Force abilities
// First boss encountered at level 10 with unique Star Wars-themed abilities

import BaseEnemy from './BaseEnemy.js';
import Logger from '../utils/Logger.js';

class YodaBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
        
        // Boss-specific properties
        this.isBoss = true;
        this.abilities = {
            saberSwipe: {
                lastUsed: 0,
                cooldown: 4000, // 4 seconds
                range: 150,
                damage: 25,
                knockbackForce: 20
            },
            forcePush: {
                lastUsed: 0,
                cooldown: 6000, // 6 seconds
                range: 200,
                knockbackForce: 35,
                noVisualDelay: 800 // Delay before invisible force hits
            },
            jediMindTrick: {
                lastUsed: 0,
                cooldown: 15000, // 15 seconds
                duration: 2000, // 2 seconds of mind control
                range: 300
            }
        };
        
        // Boss visual effects
        this.setupBossEffects();
        
        // Track current ability being used
        this.currentAbility = null;
        this.abilityStartTime = 0;
    }

    setupAbility() {
        // Create groups for boss abilities
        this.createAbilityGroup('saberEffects');
        this.createAbilityGroup('forceEffects');
        this.createAbilityGroup('mindTrickEffects');
        
        // Initialize boss behavior
        this.setAbilityState('lastAbilityChoice', 0);
        this.setAbilityState('consecutiveSameAbility', 0);
        
        Logger.enemy(`Yoda Bufo boss initialized with Force abilities`);
    }

    setupBossEffects() {
        // Create aura effect around the boss
        if (this.isOperationSafe(true)) {
            this.auraEffect = this.createVisualEffect(
                this.gameObject.x, 
                this.gameObject.y, 
                {
                    radius: 80,
                    color: 0x00FF88,
                    alpha: 0.2,
                    duration: -1, // Persistent effect
                    stroke: { width: 3, color: 0x00FF88 }
                }
            );
            
            // Make aura pulse
            if (this.scene.tweens && this.auraEffect) {
                this.scene.tweens.add({
                    targets: this.auraEffect,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    alpha: 0.1,
                    duration: 2000,
                    yoyo: true,
                    repeat: -1
                });
            }
        }
    }

    updateAI() {
        if (!this.isOperationSafe(true, true)) return;
        
        // Boss movement - slower and more deliberate
        this.moveTowardPlayer({
            speedMultiplier: 0.3, // Much slower than normal enemies
            minDistance: 120 // Keep some distance for abilities
        });
        
        // Update aura position
        if (this.auraEffect && this.auraEffect.active) {
            this.auraEffect.x = this.gameObject.x;
            this.auraEffect.y = this.gameObject.y;
        }
    }

    updateAbility() {
        if (!this.isOperationSafe(true, true)) return;
        
        const currentTime = this.scene.time.now;
        
        // Don't use abilities too frequently
        const globalCooldown = 2000; // 2 seconds between any abilities
        const timeSinceLastAbility = Math.min(
            currentTime - this.abilities.saberSwipe.lastUsed,
            currentTime - this.abilities.forcePush.lastUsed,
            currentTime - this.abilities.jediMindTrick.lastUsed
        );
        
        if (timeSinceLastAbility < globalCooldown) return;
        
        // Check distance to player for ability selection
        const distanceToPlayer = this.getDistanceToPlayer();
        
        // Select and use abilities based on distance and cooldowns
        if (distanceToPlayer <= this.abilities.saberSwipe.range && this.canUseSaberSwipe()) {
            this.useSaberSwipe();
        } else if (distanceToPlayer <= this.abilities.forcePush.range && this.canUseForcePush()) {
            this.useForcePush();
        } else if (distanceToPlayer <= this.abilities.jediMindTrick.range && this.canUseJediMindTrick()) {
            this.useJediMindTrick();
        }
    }

    // Saber Swipe ability - damage and knockback in front of boss
    canUseSaberSwipe() {
        const currentTime = this.scene.time.now;
        return currentTime - this.abilities.saberSwipe.lastUsed >= this.abilities.saberSwipe.cooldown;
    }

    useSaberSwipe() {
        if (!this.isOperationSafe(true, true)) return;
        
        const currentTime = this.scene.time.now;
        this.abilities.saberSwipe.lastUsed = currentTime;
        
        Logger.enemy('Yoda Bufo uses Saber Swipe!');
        
        // Create lightsaber visual effect
        this.createSaberEffect();
        
        // Apply damage and knockback after brief delay
        this.scene.time.delayedCall(300, this.wrapTimerCallback(() => {
            this.applySaberDamage();
        }, true, true));
    }

    createSaberEffect() {
        if (!this.isOperationSafe(true)) return;
        
        const playerPos = this.getPlayerPosition();
        if (!playerPos) return;
        
        // Calculate direction to player
        const angle = Math.atan2(
            playerPos.y - this.gameObject.y,
            playerPos.x - this.gameObject.x
        );
        
        // Create lightsaber blade effect
        const saberLength = 100;
        const saberWidth = 8;
        const startX = this.gameObject.x + Math.cos(angle) * 30;
        const startY = this.gameObject.y + Math.sin(angle) * 30;
        const endX = startX + Math.cos(angle) * saberLength;
        const endY = startY + Math.sin(angle) * saberLength;
        
        // Create the lightsaber blade
        const saber = this.scene.add.rectangle(
            (startX + endX) / 2,
            (startY + endY) / 2,
            saberLength,
            saberWidth,
            0x00FF00,
            0.9
        );
        saber.setRotation(angle);
        
        // Add glow effect
        const glow = this.scene.add.rectangle(
            (startX + endX) / 2,
            (startY + endY) / 2,
            saberLength + 10,
            saberWidth + 6,
            0x88FF88,
            0.5
        );
        glow.setRotation(angle);
        
        // Animate the saber swing
        this.scene.tweens.add({
            targets: [saber, glow],
            rotation: angle + Math.PI / 3, // 60 degree swing
            duration: 400,
            onComplete: () => {
                // Fade out and destroy
                this.scene.tweens.add({
                    targets: [saber, glow],
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        saber.destroy();
                        glow.destroy();
                    }
                });
            }
        });
    }

    applySaberDamage() {
        if (!this.isOperationSafe(true, true)) return;
        
        const distance = this.getDistanceToPlayer();
        
        if (distance <= this.abilities.saberSwipe.range) {
            // Apply damage
            this.scene.statsSystem.takeDamage(this.abilities.saberSwipe.damage);
            
            // Apply knockback
            const angle = Math.atan2(
                this.scene.player.y - this.gameObject.y,
                this.scene.player.x - this.gameObject.x
            );
            
            this.applyKnockback(angle, this.abilities.saberSwipe.knockbackForce);
            
            Logger.enemy(`Saber Swipe hit for ${this.abilities.saberSwipe.damage} damage`);
        }
    }

    // Force Push ability - long range knockback, no damage
    canUseForcePush() {
        const currentTime = this.scene.time.now;
        return currentTime - this.abilities.forcePush.lastUsed >= this.abilities.forcePush.cooldown;
    }

    useForcePush() {
        if (!this.isOperationSafe(true, true)) return;
        
        const currentTime = this.scene.time.now;
        this.abilities.forcePush.lastUsed = currentTime;
        
        Logger.enemy('Yoda Bufo uses Force Push!');
        
        // Create force charging effect
        this.createForceChargingEffect();
        
        // Apply force push after delay
        this.scene.time.delayedCall(this.abilities.forcePush.noVisualDelay, this.wrapTimerCallback(() => {
            this.applyForcePush();
        }, true, true));
    }

    createForceChargingEffect() {
        if (!this.isOperationSafe(true)) return;
        
        // Create ripple effect around Yoda Bufo
        for (let i = 0; i < 3; i++) {
            const ripple = this.scene.add.circle(
                this.gameObject.x,
                this.gameObject.y,
                20 + i * 15,
                0x4444FF,
                0.3
            );
            
            this.scene.tweens.add({
                targets: ripple,
                scaleX: 3 + i,
                scaleY: 3 + i,
                alpha: 0,
                duration: this.abilities.forcePush.noVisualDelay,
                delay: i * 100,
                onComplete: () => ripple.destroy()
            });
        }
    }

    applyForcePush() {
        if (!this.isOperationSafe(true, true)) return;
        
        const distance = this.getDistanceToPlayer();
        
        if (distance <= this.abilities.forcePush.range) {
            // Calculate knockback direction
            const angle = Math.atan2(
                this.scene.player.y - this.gameObject.y,
                this.scene.player.x - this.gameObject.x
            );
            
            // Apply strong knockback with no damage
            this.applyKnockback(angle, this.abilities.forcePush.knockbackForce);
            
            // Create impact effect at player location
            this.createVisualEffect(this.scene.player.x, this.scene.player.y, {
                radius: 30,
                color: 0x4444FF,
                alpha: 0.6,
                duration: 600,
                endScale: 2
            });
            
            Logger.enemy('Force Push applied - player knocked back!');
        }
    }

    // Jedi Mind Trick ability - controls player movement
    canUseJediMindTrick() {
        const currentTime = this.scene.time.now;
        return currentTime - this.abilities.jediMindTrick.lastUsed >= this.abilities.jediMindTrick.cooldown;
    }

    useJediMindTrick() {
        if (!this.isOperationSafe(true, true)) return;
        
        const currentTime = this.scene.time.now;
        this.abilities.jediMindTrick.lastUsed = currentTime;
        
        Logger.enemy('Yoda Bufo uses Jedi Mind Trick!');
        
        // Apply mind control effect
        this.applyMindControl();
    }

    applyMindControl() {
        if (!this.isOperationSafe(true, true)) return;
        
        // Find nearest enemy to the player
        const nearestEnemy = this.findNearestEnemyToPlayer();
        if (!nearestEnemy) return;
        
        // Add mind control status effect using the status effect system
        let mindControlEffectId = null;
        if (this.scene.statusEffectSystem) {
            mindControlEffectId = this.scene.statusEffectSystem.addStatusEffect(
                'mindControl', 
                this.abilities.jediMindTrick.duration
            );
        }
        
        // Create mind control visual effect on player
        const mindControlEffect = this.scene.add.circle(
            this.scene.player.x,
            this.scene.player.y,
            50,
            0xFF4444,
            0.3
        );
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: mindControlEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.1,
            duration: 500,
            yoyo: true,
            repeat: Math.floor(this.abilities.jediMindTrick.duration / 1000) - 1,
            onComplete: () => mindControlEffect.destroy()
        });
        
        // Add mind control particles around player
        this.createMindControlParticles();
        
        // Store original input manager state
        const originalInputManager = this.scene.inputManager;
        
        // Override player movement for the duration
        this.scene.inputManager = {
            ...originalInputManager,
            handleGameplayInput: () => {
                if (!this.scene.player || !nearestEnemy || !nearestEnemy.active) {
                    return;
                }
                
                // Force player to move toward nearest enemy
                const dx = nearestEnemy.x - this.scene.player.x;
                const dy = nearestEnemy.y - this.scene.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    const speed = this.scene.statsSystem.getPlayerStats().speed;
                    const velocityX = (dx / distance) * speed / 50;
                    const velocityY = (dy / distance) * speed / 50;
                    
                    try {
                        this.scene.matter.body.setVelocity(this.scene.player.body, {
                            x: velocityX,
                            y: velocityY
                        });
                    } catch (error) {
                        // Handle physics errors gracefully
                    }
                }
            }
        };
        
        // Restore normal controls after duration
        this.scene.time.delayedCall(this.abilities.jediMindTrick.duration, this.wrapTimerCallback(() => {
            this.scene.inputManager = originalInputManager;
            
            // Remove status effect
            if (mindControlEffectId && this.scene.statusEffectSystem) {
                this.scene.statusEffectSystem.removeStatusEffect(mindControlEffectId);
            }
            
            Logger.enemy('Mind control effect ended');
        }));
        
        Logger.enemy(`Mind control applied for ${this.abilities.jediMindTrick.duration}ms`);
    }
    
    createMindControlParticles() {
        if (!this.isOperationSafe(true, true)) return;
        
        // Create floating particles around the player to show mind control
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 60;
            const particleX = this.scene.player.x + Math.cos(angle) * radius;
            const particleY = this.scene.player.y + Math.sin(angle) * radius;
            
            const particle = this.scene.add.circle(particleX, particleY, 4, 0xFF4444, 0.8);
            
            // Orbit around player
            this.scene.tweens.add({
                targets: particle,
                angle: angle + Math.PI * 4, // Two full rotations
                duration: this.abilities.jediMindTrick.duration,
                onUpdate: () => {
                    if (this.scene.player && particle.active) {
                        const currentAngle = particle.angle || angle;
                        particle.x = this.scene.player.x + Math.cos(currentAngle) * radius;
                        particle.y = this.scene.player.y + Math.sin(currentAngle) * radius;
                    }
                },
                onComplete: () => {
                    if (particle.active) {
                        particle.destroy();
                    }
                }
            });
        }
    }

    findNearestEnemyToPlayer() {
        if (!this.scene.enemies || !this.scene.player) return null;
        
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active && enemy !== this.gameObject) {
                const distance = Phaser.Math.Distance.Between(
                    this.scene.player.x, this.scene.player.y,
                    enemy.x, enemy.y
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        return nearestEnemy;
    }

    // Helper method to apply knockback to player
    applyKnockback(angle, force) {
        if (!this.scene.player || !this.scene.player.body) return;
        
        try {
            this.scene.matter.body.setVelocity(this.scene.player.body, {
                x: Math.cos(angle) * force,
                y: Math.sin(angle) * force
            });
        } catch (error) {
            Logger.error('Error applying knockback:', error);
        }
    }

    // Override onDeath for boss-specific death effects
    onDeath() {
        Logger.enemy('Yoda Bufo boss defeated!');
        
        // Clean up aura effect
        if (this.auraEffect && this.auraEffect.active) {
            this.scene.tweens.killTweensOf(this.auraEffect);
            this.auraEffect.destroy();
        }
        
        // Create epic death explosion
        this.createExplosionEffect(120, {
            color: 0x00FF88,
            alpha: 0.6,
            duration: 1500,
            endScale: 3,
            rings: 5,
            ringColor: 0x88FF88
        });
        
        // Bonus XP and effects for boss kill
        if (this.scene.statsSystem) {
            this.scene.statsSystem.addXP(this.gameObject.xpValue * 2); // Double XP for boss
        }
        
        // Trigger boss defeat effects in the game
        if (this.scene.enemySystem && typeof this.scene.enemySystem.onBossDefeated === 'function') {
            this.scene.enemySystem.onBossDefeated('yoda');
        }
    }

    // Override cleanup for boss-specific cleanup
    cleanup() {
        // Clean up aura effect
        if (this.auraEffect && this.auraEffect.active) {
            this.scene.tweens.killTweensOf(this.auraEffect);
            this.auraEffect.destroy();
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}

export default YodaBufo; 