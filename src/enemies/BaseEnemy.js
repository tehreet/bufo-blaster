// Base class for all enemy types
// Defines the common interface and shared functionality for enemies

class BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        this.scene = scene;
        this.data = enemyData;
        this.gameObject = gameObject; // The Phaser game object (sprite)
        this.abilityGroups = new Map(); // Store ability-specific game object groups (for projectiles, etc.)
        this.abilityTimers = new Map(); // Store ability-specific timers
        this.abilityState = new Map(); // Store ability-specific state data
        
        // Initialize enemy with data
        this.initializeStats();
        this.setupAbility();
    }

    // =================== SAFETY AND VALIDATION METHODS ===================
    
    /**
     * Comprehensive safety check for enemy operations
     * @param {boolean} requiresPosition - Whether to check for valid position
     * @param {boolean} requiresPlayer - Whether to check for valid player
     * @returns {boolean} - True if all checks pass
     */
    isOperationSafe(requiresPosition = false, requiresPlayer = false) {
        // Basic existence checks
        if (!this.gameObject || !this.scene || this.gameObject.active === false) {
            return false;
        }
        
        // Position validation if required
        if (requiresPosition) {
            if (typeof this.gameObject.x !== 'number' || typeof this.gameObject.y !== 'number') {
                return false;
            }
        }
        
        // Player validation if required
        if (requiresPlayer) {
            if (!this.scene.player || 
                typeof this.scene.player.x !== 'number' || 
                typeof this.scene.player.y !== 'number') {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Safe wrapper for timer callbacks - automatically adds safety checks
     * @param {Function} callback - The callback function to wrap
     * @param {boolean} requiresPosition - Whether callback requires valid position
     * @param {boolean} requiresPlayer - Whether callback requires valid player
     * @returns {Function} - Wrapped callback with safety checks
     */
    wrapTimerCallback(callback, requiresPosition = false, requiresPlayer = false) {
        return () => {
            if (this.isOperationSafe(requiresPosition, requiresPlayer)) {
                callback();
            }
        };
    }

    // =================== ENHANCED VISUAL EFFECTS SYSTEM ===================
    
    /**
     * Centralized visual effects creation with automatic safety checks
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {Object} config - Visual effect configuration
     * @returns {Object|null} - Created effect or null if failed
     */
    createVisualEffect(x, y, config = {}) {
        // Safety check: ensure scene still exists
        if (!this.scene || !this.scene.add) {
            return null;
        }
        
        const effect = this.scene.add.circle(
            x, y, 
            config.radius || 20, 
            config.color || 0xffffff, 
            config.alpha || 0.5
        );
        
        if (config.stroke) {
            effect.setStrokeStyle(config.stroke.width || 2, config.stroke.color || 0xffffff);
        }
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(effect);
        }

        // Animate the effect with safety checks
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
    
    /**
     * Create explosion visual effect with multiple rings
     * @param {number} radius - Explosion radius
     * @param {Object} config - Explosion configuration
     */
    createExplosionEffect(radius, config = {}) {
        if (!this.isOperationSafe(true)) return;
        
        const x = this.gameObject.x;
        const y = this.gameObject.y;
        
        // Main explosion
        this.createVisualEffect(x, y, {
            radius: radius,
            color: config.color || 0xFF2200,
            alpha: config.alpha || 0.4,
            duration: config.duration || 800,
            endScale: config.endScale || 1.5,
            stroke: config.stroke
        });
        
        // Secondary rings
        const ringCount = config.rings || 3;
        for (let i = 1; i <= ringCount; i++) {
            if (this.scene.time) {
                this.scene.time.delayedCall(i * 100, this.wrapTimerCallback(() => {
                    this.createVisualEffect(x, y, {
                        radius: radius * (0.3 + i * 0.2),
                        color: config.ringColor || 0xFF6600,
                        alpha: 0.3,
                        duration: 400,
                        endScale: 2
                    });
                }, true));
            }
        }
    }
    
    /**
     * Create particle burst effect
     * @param {number} particleCount - Number of particles
     * @param {Object} config - Particle configuration
     */
    createParticleBurst(particleCount = 8, config = {}) {
        if (!this.isOperationSafe(true)) return;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = config.distance || 30;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            const delay = config.staggered ? Math.random() * 200 : 0;
            
            if (this.scene.time) {
                this.scene.time.delayedCall(delay, this.wrapTimerCallback(() => {
                    this.createVisualEffect(
                        this.gameObject.x + offsetX, 
                        this.gameObject.y + offsetY, 
                        {
                            radius: config.radius || 12,
                            color: config.color || 0x9999FF,
                            alpha: config.alpha || 0.7,
                            duration: config.duration || 800,
                            endScale: config.endScale || 3
                        }
                    );
                }, true));
            }
        }
    }

    // =================== ENHANCED TIMER MANAGEMENT ===================
    
    /**
     * Enhanced timer creation with automatic safety wrapping
     * @param {string} name - Timer name
     * @param {Object} config - Timer configuration
     * @param {boolean} requiresPosition - Whether callbacks require position
     * @param {boolean} requiresPlayer - Whether callbacks require player
     */
    createSafeAbilityTimer(name, config, requiresPosition = false, requiresPlayer = false) {
        const safeConfig = { ...config };
        
        if (config.callback) {
            safeConfig.callback = this.wrapTimerCallback(config.callback, requiresPosition, requiresPlayer);
        }
        
        const timer = this.scene.time.addEvent(safeConfig);
        this.abilityTimers.set(name, timer);
        return timer;
    }

    // =================== COMMON AI PATTERNS ===================
    
    /**
     * Move toward player with customizable behavior
     * @param {Object} config - Movement configuration
     */
    moveTowardPlayer(config = {}) {
        if (!this.isOperationSafe(true, true) || !this.gameObject.body) return;
        
        const dx = this.scene.player.x - this.gameObject.x;
        const dy = this.scene.player.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const minDistance = config.minDistance || 5;
        const speedMultiplier = config.speedMultiplier || 1.0;
        const driftEnabled = config.drift || false;
        
        if (distance > minDistance) {
            let velocityX = (dx / distance) * this.gameObject.speed * speedMultiplier / 50;
            let velocityY = (dy / distance) * this.gameObject.speed * speedMultiplier / 50;
            
            // Add drift if enabled
            if (driftEnabled && config.driftFunction) {
                const drift = config.driftFunction();
                velocityX += drift.x;
                velocityY += drift.y;
            }
            
            try {
                this.scene.matter.body.setVelocity(this.gameObject.body, {
                    x: velocityX,
                    y: velocityY
                });
            } catch (error) {
                // Handle velocity setting errors silently
            }
        }
    }
    
    /**
     * Apply area damage to player if within radius
     * @param {number} radius - Damage radius
     * @param {number} damage - Base damage amount
     * @param {Object} config - Damage configuration
     */
    applyAreaDamage(radius, damage, config = {}) {
        if (!this.isOperationSafe(true, true)) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.gameObject.x, this.gameObject.y,
            this.scene.player.x, this.scene.player.y
        );
        
        if (distance <= radius) {
            // Scale damage by distance if configured
            let actualDamage = damage;
            if (config.falloff) {
                const falloffMultiplier = 1 - (distance / radius);
                actualDamage = Math.floor(damage * falloffMultiplier);
            }
            
            if (actualDamage > 0 && this.scene.player.takeDamage) {
                this.scene.player.takeDamage(actualDamage);
                
                // Apply knockback if configured
                if (config.knockback) {
                    this.applyAreaKnockback(config.knockback);
                }
            }
        }
    }
    
    /**
     * Apply knockback to player from this enemy's position
     * @param {number} force - Knockback force
     */
    applyAreaKnockback(force = 15) {
        if (!this.isOperationSafe(true, true) || !this.scene.player.body) return;
        
        const dx = this.scene.player.x - this.gameObject.x;
        const dy = this.scene.player.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            try {
                this.scene.matter.body.setVelocity(this.scene.player.body, {
                    x: (dx / distance) * force,
                    y: (dy / distance) * force
                });
            } catch (error) {
                // Handle knockback errors silently
            }
        }
    }

    // =================== ORIGINAL METHODS (Enhanced) ===================

    // Enemy data getters
    getId() {
        return this.data.id;
    }

    getName() {
        return this.data.name;
    }

    getSprite() {
        return this.data.sprite;
    }

    getBaseStats() {
        return this.data.baseStats;
    }

    getSpecialEffect() {
        return this.data.specialEffect;
    }

    getWeight() {
        return this.data.weight;
    }

    getRangedAttack() {
        return this.data.rangedAttack;
    }

    // Initialize enemy stats and properties
    initializeStats() {
        const baseStats = this.data.baseStats;
        const levelScaling = this.getLevelScaling();
        
        // Apply level scaling to health
        this.gameObject.health = Math.ceil(baseStats.health * levelScaling);
        this.gameObject.maxHealth = Math.ceil(baseStats.health * levelScaling);
        this.gameObject.speed = baseStats.speed;
        this.gameObject.contactDamage = baseStats.contactDamage || this.scene.gameConfig.ENEMY_CONTACT_DAMAGE;
        this.gameObject.xpValue = baseStats.xpValue;
        
        // Special properties
        if (baseStats.healthRegen) {
            this.gameObject.healthRegen = baseStats.healthRegen;
            this.gameObject.lastRegenTime = 0;
        }
        
        // Store reference to this enemy instance on the game object
        this.gameObject.enemyInstance = this;
        this.gameObject.enemyType = this.data; // Keep for backward compatibility
        
        // Initialize ability-specific properties
        this.gameObject.lastAttack = 0;
        this.gameObject.attackCooldown = 1000;
    }

    getLevelScaling() {
        const level = this.scene.statsSystem.getPlayerProgression().level;
        return 1 + (level - 1) * 0.2; // 20% increase per level
    }

    // Abstract methods that each enemy type should implement
    setupAbility() {
        // Override in subclasses to setup enemy-specific abilities
        // Default implementation does nothing (for basic enemies)
    }

    updateAbility() {
        // Override in subclasses to update enemy-specific abilities each frame
        // Default implementation does nothing (for basic enemies)
    }

    updateAI() {
        // Override in subclasses for custom AI behavior
        // Default implementation uses basic chase AI
        this.basicChaseAI();
    }

    onContactWithPlayer(player) {
        // Override in subclasses for special contact effects
        // Default implementation applies the enemy's contact damage and special effects
        
        // Deal damage to player
        const damage = this.gameObject.contactDamage;
        this.scene.statsSystem.takeDamage(damage);
        
        // Apply special effects
        const specialEffect = this.getSpecialEffect();
        if (specialEffect === 'poison') {
            this.scene.enemySystem.applyPoisonEffect();
        } else if (specialEffect === 'bleed') {
            this.scene.enemySystem.applyBleedEffect();
        }
        
        // Apply knockback
        this.applyPlayerKnockback(player);
    }

    onDeath() {
        // Override in subclasses for special death effects
        // Default implementation does nothing
    }

    // Helper methods for managing enemy-specific abilities
    createAbilityGroup(name) {
        const group = this.scene.add.group();
        this.abilityGroups.set(name, group);
        return group;
    }

    getAbilityGroup(name) {
        return this.abilityGroups.get(name);
    }

    createAbilityTimer(name, config) {
        const timer = this.scene.time.addEvent(config);
        this.abilityTimers.set(name, timer);
        return timer;
    }

    getAbilityTimer(name) {
        return this.abilityTimers.get(name);
    }

    removeAbilityTimer(name) {
        const timer = this.abilityTimers.get(name);
        if (timer) {
            timer.remove();
            this.abilityTimers.delete(name);
        }
    }

    setAbilityState(key, value) {
        this.abilityState.set(key, value);
    }

    getAbilityState(key) {
        return this.abilityState.get(key);
    }

    // Basic AI implementation - move toward player (now uses enhanced method)
    basicChaseAI() {
        // Check if enemy is being knocked back
        if (this.gameObject.knockbackTime && this.scene.time.now < this.gameObject.knockbackTime) {
            return; // Don't apply AI movement during knockback
        }
        
        this.moveTowardPlayer();
    }

    // Apply knockback to player on contact
    applyPlayerKnockback(player) {
        const angle = Phaser.Math.Angle.Between(this.gameObject.x, this.gameObject.y, player.x, player.y);
        try {
            this.scene.matter.body.setVelocity(player.body, {
                x: Math.cos(angle) * 4, // Knockback force
                y: Math.sin(angle) * 4
            });
        } catch (error) {
            // Handle physics errors gracefully
        }
    }

    // Helper method to get player position
    getPlayerPosition() {
        if (!this.scene.player) return null;
        return { x: this.scene.player.x, y: this.scene.player.y };
    }

    // Helper method to get distance to player
    getDistanceToPlayer() {
        const playerPos = this.getPlayerPosition();
        if (!playerPos) return Infinity;
        
        return Phaser.Math.Distance.Between(
            this.gameObject.x, this.gameObject.y,
            playerPos.x, playerPos.y
        );
    }

    // Helper method to create projectiles
    createProjectile(x, y, velocityX, velocityY, config = {}) {
        const projectile = this.scene.add.circle(x, y, config.radius || 6, config.color || 0xff6600);
        if (config.stroke) {
            projectile.setStrokeStyle(config.stroke.width || 2, config.stroke.color || 0xff3300);
        }
        
        // Add physics
        this.scene.matter.add.gameObject(projectile, {
            shape: 'circle',
            isSensor: true,
            label: config.label || 'enemyProjectile'
        });
        
        // Set velocity
        try {
            this.scene.matter.body.setVelocity(projectile.body, {
                x: velocityX,
                y: velocityY
            });
        } catch (error) {
            projectile.destroy();
            return null;
        }
        
        // Set projectile properties
        projectile.damage = config.damage || 10;
        projectile.birthTime = this.scene.time.now;
        projectile.lifespan = config.lifespan || 5000;
        projectile.enemySource = this.gameObject;
        
        return projectile;
    }

    // Enhanced cleanup method
    cleanup() {
        // Immediately remove from enemies group to prevent update loop access
        if (this.scene && this.scene.enemies && this.gameObject) {
            this.scene.enemies.remove(this.gameObject);
        }
        
        // Remove all timers
        for (const [name, timer] of this.abilityTimers) {
            if (timer) {
                timer.remove();
            }
        }
        this.abilityTimers.clear();

        // Clear all groups and their contents
        for (const [name, group] of this.abilityGroups) {
            if (group) {
                group.clear(true, true);
            }
        }
        this.abilityGroups.clear();

        // Clear state
        this.abilityState.clear();
    }

    // =================== COLLISION HANDLERS ===================
    
    /**
     * Get collision handlers for this enemy type
     * Override in subclasses to define enemy-specific collision behavior
     * @returns {Array} Array of collision handler objects
     */
    getCollisionHandlers() {
        // Default implementation - no special collision handlers
        return [];
    }
}

export default BaseEnemy; 