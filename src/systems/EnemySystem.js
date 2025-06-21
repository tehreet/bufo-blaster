// Enemy System - Handles enemy definitions, spawning, behavior, and interactions
import Logger from '../utils/Logger.js';
import EnemyRegistry from '../enemies/EnemyRegistry.js';

class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        
        // Poison system tracking - Nerfed for balance
        this.poisonTimer = null;
        this.poisonDuration = 5000; // 5 seconds of poison (reduced from 10 - 50% nerf)
        this.poisonDamage = 4; // 4 damage per tick (reduced from 6 - 35% nerf)
        this.poisonTickInterval = 800; // 0.8 seconds between damage ticks (was 1.0)
        
        // Bleed system tracking - Vampire Bufo bleed effect (nerfed)
        this.bleedTimer = null;
        this.bleedDuration = 4000; // 4 seconds of bleeding (reduced from 8 - 50% nerf)
        this.bleedDamage = 3; // 3 damage per tick (reduced from 4 - 25% nerf, close to 35%)
        this.bleedTickInterval = 1000; // 1 second between damage ticks
        
        // XP Magnet Orb system - MUCH MORE RARE
        this.lastMagnetOrbLevel = 0; // Track last level where magnet orb was spawned
        this.magnetOrbKillChance = 0.005; // 0.5% chance per enemy kill (was 1.5% - reduced by 75%)
        
        // Use EnemyRegistry instead of hardcoded types
        this.enemyRegistry = EnemyRegistry;
        
        // Level progression system
        this.levelProgression = {
            maxLevel: 25,
            currentLevel: 1,
            frenzyLevels: [5, 15, 25], // Enhanced frenzy at these levels
            bossLevels: [10, 20], // Boss fights at these levels
            lastProcessedLevel: 0
        };
        
        // Boss fight state
        this.bossState = {
            active: false,
            currentBoss: null,
            bossDefeated: false,
            bossSpawned: false
        };
        
        // Frenzy state
        this.frenzyState = {
            active: false,
            startTime: 0,
            duration: 30000, // 30 seconds of frenzy
            spawnMultiplier: 3, // 3x more enemies
            speedMultiplier: 1.5, // 1.5x faster
            damageMultiplier: 1.3 // 30% more damage
        };
    }

    startEnemySpawning() {
        // Start enemy spawning timer
        this.scene.enemySpawnTimer = this.scene.time.addEvent({
            delay: this.scene.gameConfig.ENEMY_SPAWN_INTERVAL,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    spawnEnemy() {
        if (!this.scene.gameStarted || this.scene.isPaused || this.scene.upgradeSystem.upgradeActive) return;
        
        // Update level progression
        this.updateLevelProgression();
        
        // Handle boss fights - don't spawn regular enemies during boss fights
        if (this.bossState.active) {
            return;
        }
        
        // Scale enemy count and difficulty based on player level
        this.scaleEnemyDifficulty();
        
        // Determine spawn count (increased during frenzy)
        let enemyCount = Math.min(Math.floor(this.levelProgression.currentLevel / 3) + 1, 5);
        if (this.frenzyState.active) {
            enemyCount = Math.floor(enemyCount * this.frenzyState.spawnMultiplier);
        }
        
        // Spawn multiple enemies
        for (let i = 0; i < enemyCount; i++) {
            // Small delay between spawns to spread them out
            this.scene.time.delayedCall(i * 100, () => {
                this.spawnSingleEnemy();
            });
        }
    }

    spawnSingleEnemy() {
        if (!this.scene.gameStarted || this.scene.isPaused || this.scene.upgradeSystem.upgradeActive) return;
        
        // Additional safety checks
        if (!this.scene.player || !this.scene.enemies || !this.scene.matter) {
            Logger.warn('Cannot spawn enemy: Missing required scene components');
            return;
        }
        
        // Get random enemy type (weighted towards tougher enemies at higher levels)
        const enemyType = this.getRandomEnemyType();
        
        // Spawn enemy outside camera view with some variation
        const camera = this.scene.cameras.main;
        const spawnDistance = Phaser.Math.Between(120, 200); // Add some variation to spawn distance
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const spawnX = this.scene.player.x + Math.cos(angle) * (camera.width / 2 + spawnDistance);
        const spawnY = this.scene.player.y + Math.sin(angle) * (camera.height / 2 + spawnDistance);
        
        // Clamp to world bounds
        const clampedX = Phaser.Math.Clamp(spawnX, 0, this.scene.map.widthInPixels);
        const clampedY = Phaser.Math.Clamp(spawnY, 0, this.scene.map.heightInPixels);
        
        // Create enemy with sprite using centralized asset management
        const enemy = this.scene.add.image(clampedX, clampedY, enemyType.sprite);
        
        // Get display size from asset configuration, fallback to enemyType.displaySize
        const displaySize = this.scene.assetManager.getDisplaySize ? 
            this.scene.assetManager.getDisplaySize(enemyType.sprite, 'enemies') : enemyType.displaySize;
        enemy.setDisplaySize(displaySize, displaySize);
        
        // Try to create animated overlay if available, otherwise use static sprite
        const hasAnimatedOverlay = this.scene.assetManager.createAnimatedOverlay(enemy, enemyType.sprite, 'enemies');
        if (!hasAnimatedOverlay) {
            // Ensure static sprite is visible if no animated overlay
            enemy.setAlpha(1);
        }
        
        // Add Matter.js physics with explicit configuration
        this.scene.matter.add.gameObject(enemy, {
            shape: {
                type: 'circle',
                radius: enemyType.baseStats.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Create enemy instance using the registry
        try {
            const enemyInstance = this.enemyRegistry.createEnemy(this.scene, enemyType.id, enemy);
            Logger.system(`Created enemy instance: ${enemyType.name}`);
            
            // Apply frenzy modifiers if active
            if (this.frenzyState.active) {
                this.applyFrenzyModifiers(enemy);
            }
            
        } catch (error) {
            Logger.error('Failed to create enemy instance:', error);
            // Fallback: destroy the enemy if instance creation fails
            enemy.destroy();
            return;
        }
        
        // Add debug hitbox visualization (initially hidden) - use actual physics body radius
        const actualRadius = enemy.body.circleRadius || enemyType.baseStats.hitboxRadius;
        enemy.hitboxDebug = this.scene.add.circle(clampedX, clampedY, actualRadius, 0xff0000, 0.3);
        enemy.hitboxDebug.setStrokeStyle(2, 0xff0000);
        enemy.hitboxDebug.setVisible(this.scene.showHitboxes);
        
        this.scene.enemies.add(enemy);
    }

    getRandomEnemyType() {
        // Use EnemyRegistry for random selection with level-based weighting
        const level = this.scene.statsSystem.getPlayerProgression().level;
        return this.enemyRegistry.getRandomEnemyType(level);
    }

    scaleEnemyDifficulty() {
        const level = this.scene.statsSystem.getPlayerProgression().level;
        
        // Increase spawn rate at higher levels (decrease interval)
        const baseInterval = this.scene.gameConfig.ENEMY_SPAWN_INTERVAL;
        const newInterval = Math.max(400, baseInterval - (level * 50)); // Minimum 400ms, decrease by 50ms per level
        
        if (this.scene.enemySpawnTimer) {
            this.scene.enemySpawnTimer.delay = newInterval;
        }
    }

    triggerBossWave(level) {
        // Spawn a boss wave with multiple tough enemies
        const waveSize = Math.min(Math.floor(level / 5) + 2, 8); // 2-8 enemies based on level
        
        Logger.system(`Boss wave triggered: Level ${level} with ${waveSize} enemies`);
        
        // Show boss wave notification
        this.showBossWaveNotification(level);
        
        // Spawn wave of enemies with bias towards tougher types
        for (let i = 0; i < waveSize; i++) {
            this.scene.time.delayedCall(i * 500, () => {
                // Choose tougher enemy types for boss waves
                const toughEnemyTypes = this.enemyRegistry.getBossWaveEnemyTypes();
                const enemyType = Phaser.Utils.Array.GetRandom(toughEnemyTypes);
                this.spawnSingleEnemyOfType(enemyType);
            });
        }
    }

    spawnSingleEnemyOfType(enemyType) {
        if (!this.scene.gameStarted || this.scene.isPaused || this.scene.upgradeSystem.upgradeActive) return;
        
        // Spawn enemy outside camera view with some variation
        const camera = this.scene.cameras.main;
        const spawnDistance = Phaser.Math.Between(120, 200);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const spawnX = this.scene.player.x + Math.cos(angle) * (camera.width / 2 + spawnDistance);
        const spawnY = this.scene.player.y + Math.sin(angle) * (camera.height / 2 + spawnDistance);
        
        // Clamp to world bounds
        const clampedX = Phaser.Math.Clamp(spawnX, 0, this.scene.map.widthInPixels);
        const clampedY = Phaser.Math.Clamp(spawnY, 0, this.scene.map.heightInPixels);
        
        // Create enemy with sprite using centralized asset management
        const enemy = this.scene.add.image(clampedX, clampedY, enemyType.sprite);
        
        // Get display size from asset configuration, fallback to enemyType.displaySize
        const displaySize = this.scene.assetManager.getDisplaySize ? 
            this.scene.assetManager.getDisplaySize(enemyType.sprite, 'enemies') : enemyType.displaySize;
        enemy.setDisplaySize(displaySize, displaySize);
        
        // Try to create animated overlay if available, otherwise use static sprite
        const hasAnimatedOverlay = this.scene.assetManager.createAnimatedOverlay(enemy, enemyType.sprite, 'enemies');
        if (!hasAnimatedOverlay) {
            // Ensure static sprite is visible if no animated overlay
            enemy.setAlpha(1);
        }
        
        // Add Matter.js physics
        this.scene.matter.add.gameObject(enemy, {
            shape: {
                type: 'circle',
                radius: enemyType.baseStats.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Create enemy instance using the registry (with boss wave bonus)
        try {
            const enemyInstance = this.enemyRegistry.createEnemy(this.scene, enemyType.id, enemy);
            
            // Apply boss wave bonuses after instance creation
            const levelScaling = 1 + (this.scene.statsSystem.getPlayerProgression().level - 1) * 0.2;
            const bossWaveBonus = 1.25; // 25% more health for boss wave enemies
            enemy.health = Math.ceil(enemyType.baseStats.health * levelScaling * bossWaveBonus);
            enemy.maxHealth = Math.ceil(enemyType.baseStats.health * levelScaling * bossWaveBonus);
            enemy.xpValue = Math.ceil(enemyType.baseStats.xpValue * 1.5); // Bonus XP for boss wave enemies
            
            Logger.system(`Created boss wave enemy instance: ${enemyType.name}`);
        } catch (error) {
            Logger.error('Failed to create boss wave enemy instance:', error);
            // Fallback: destroy the enemy if instance creation fails
            enemy.destroy();
            return;
        }
        
        // Add debug hitbox visualization
        const actualRadius = enemyType.baseStats.hitboxRadius;
        enemy.hitboxDebug = this.scene.add.circle(clampedX, clampedY, actualRadius, 0xff0000, 0.3);
        enemy.hitboxDebug.setStrokeStyle(2, 0xff0000);
        enemy.hitboxDebug.setVisible(this.scene.showHitboxes);
        
        this.scene.enemies.add(enemy);
    }

    showBossWaveNotification(level) {
        // Create notification text
        const notification = this.scene.add.text(700, 300, `BOSS WAVE - LEVEL ${level}`, {
            fontSize: '36px',
            color: '#ff0000',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1000);
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: notification,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 2
        });
        
        // Fade out and destroy after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 1000,
                onComplete: () => notification.destroy()
            });
        });
    }

    damageEnemy(enemy, damage) {
        if (!enemy || !enemy.active || !enemy.scene || enemy.health <= 0) return;
        
        enemy.health -= damage;
        
        // Visual feedback for damage (only if enemy will survive)
        if (enemy.health > 0) {
            this.scene.tweens.add({
                targets: enemy,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
        }
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        if (!enemy || !enemy.active || !enemy.scene) return;
        
        // Stop all tweens on this enemy before destroying it
        this.scene.tweens.killTweensOf(enemy);
        
        // Call enemy instance death handler if available
        if (enemy.enemyInstance && typeof enemy.enemyInstance.onDeath === 'function') {
            try {
                enemy.enemyInstance.onDeath();
            } catch (error) {
                Logger.error('Error in enemy onDeath handler:', error);
            }
        }
        
        // Increment kill count in UI
        this.scene.uiSystem.incrementKillCount();
        
        // Drop XP orb
        this.dropXPOrb(enemy.x, enemy.y, enemy.xpValue);
        
        // Check for XP Magnet Orb spawn (random chance)
        this.checkMagnetOrbSpawn(enemy.x, enemy.y);
        
        // Death effect - get display size from enemy type or default
        const displaySize = enemy.enemyType ? enemy.enemyType.baseStats.displaySize : 40;
        const deathEffect = this.scene.add.circle(enemy.x, enemy.y, displaySize / 2, 0xff0000, 0.6);
        this.scene.tweens.add({
            targets: deathEffect,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => deathEffect.destroy()
        });
        
        // Clean up enemy instance
        if (enemy.enemyInstance && typeof enemy.enemyInstance.cleanup === 'function') {
            try {
                enemy.enemyInstance.cleanup();
            } catch (error) {
                Logger.error('Error in enemy cleanup:', error);
            }
        }
        
        // Clean up enemy
        if (enemy.hitboxDebug) {
            enemy.hitboxDebug.destroy();
        }
        
        this.scene.assetManager.destroyAnimatedOverlay(enemy);
        enemy.destroy();
    }

    dropXPOrb(x, y, xpValue) {
        const xpOrb = this.scene.add.circle(x, y, this.scene.gameConfig.XP_ORB_RADIUS, 0x00ff00);
        xpOrb.setStrokeStyle(2, 0x00aa00);
        
        // Add Matter.js physics to XP orb
        this.scene.matter.add.gameObject(xpOrb, {
            shape: 'circle',
            isSensor: true, // XP orbs don't collide with other objects
            label: 'xpOrb'
        });
        
        xpOrb.xpValue = xpValue;
        this.scene.xpOrbs.add(xpOrb);
    }

    playerHitEnemy(player, enemy) {
        // Safety checks
        if (!player || !enemy || !enemy.active || !enemy.scene) return;
        
        // Check if player is invincible
        if (this.scene.statsSystem.getPlayerProgression().invincible) return;
        
        // Delegate to enemy instance if available
        if (enemy.enemyInstance && typeof enemy.enemyInstance.onContactWithPlayer === 'function') {
            enemy.enemyInstance.onContactWithPlayer(player);
        } else {
            // Fallback for enemies without instances (shouldn't happen with new system)
            const damage = enemy.contactDamage || this.scene.gameConfig.ENEMY_CONTACT_DAMAGE;
            this.scene.statsSystem.takeDamage(damage);
            
            // Apply basic knockback
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            this.scene.matter.body.setVelocity(player.body, {
                x: Math.cos(angle) * 4,
                y: Math.sin(angle) * 4
            });
        }
    }

    playerCollectXP(player, xpOrb) {
        if (!xpOrb || !xpOrb.active || !xpOrb.scene || xpOrb.beingCollected) return;
        
        // Mark as being collected to prevent double collection
        xpOrb.beingCollected = true;
        
        // Add XP to player
        this.scene.statsSystem.addXP(xpOrb.xpValue);
        
        // Collection effect
        const collectEffect = this.scene.add.circle(xpOrb.x, xpOrb.y, this.scene.gameConfig.XP_ORB_RADIUS * 2, 0x00ff00, 0.5);
        this.scene.tweens.add({
            targets: collectEffect,
            alpha: 0,
            scale: 3,
            duration: 200,
            onComplete: () => {
                try {
                    collectEffect.destroy();
                } catch (error) {
                    // Collect effect already destroyed
                }
            }
        });
        
        // Remove XP orb
        xpOrb.destroy();
    }

    updateEnemyAI() {
        // Return early if enemies group doesn't exist yet
        if (!this.scene.enemies || !this.scene.player) return;
        
        // Cache player position for performance - accessed once instead of in every loop iteration
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const playerBody = this.scene.player.body;
        
        // Update enemy AI and abilities using the new enemy instance system
        const enemies = this.scene.enemies.children.entries;
        
        for (let i = 0, len = enemies.length; i < len; i++) {
            const enemy = enemies[i];
            
            // Fast validation checks - ensure enemy and position properties are valid
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene || 
                typeof enemy.x !== 'number' || typeof enemy.y !== 'number') continue;
            
            // Pass cached player position to enemy instance for better performance
            if (enemy.enemyInstance) {
                try {
                    // Update enemy AI with cached player position
                    if (typeof enemy.enemyInstance.updateAI === 'function') {
                        enemy.enemyInstance.cachedPlayerPos = { x: playerX, y: playerY, body: playerBody };
                        enemy.enemyInstance.updateAI();
                    }
                    
                    // Update enemy abilities
                    if (typeof enemy.enemyInstance.updateAbility === 'function') {
                        enemy.enemyInstance.updateAbility();
                    }
                } catch (error) {
                    Logger.error(`Error updating enemy instance ${enemy.enemyType?.name}:`, error);
                }
            } else {
                // Fallback: use basic chase AI for enemies without instances
                this.basicChaseAI(enemy, playerX, playerY);
            }
            
            // Update debug hitbox position with comprehensive safety checks
            if (enemy.hitboxDebug && enemy.active && enemy.scene && 
                typeof enemy.x === 'number' && typeof enemy.y === 'number' &&
                enemy.body && enemy.body.position) {
                try {
                    enemy.hitboxDebug.x = enemy.x;
                    enemy.hitboxDebug.y = enemy.y;
                } catch (error) {
                    Logger.error('Error updating enemy hitbox position:', error);
                }
            }
            
            // Update animated overlay position with comprehensive safety check
            if (enemy.active && enemy.scene && enemy.body && enemy.body.position &&
                typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                try {
                    this.scene.assetManager.updateAnimatedOverlay(enemy);
                } catch (error) {
                    Logger.error('Error updating animated overlay:', error);
                }
            }
        }
    }
    
    // Updated fallback basic AI to accept cached player position
    basicChaseAI(enemy, playerX = null, playerY = null) {
        // Use cached position if provided, otherwise fall back to direct access
        const targetX = playerX !== null ? playerX : this.scene.player.x;
        const targetY = playerY !== null ? playerY : this.scene.player.y;
        
        // Check if enemy is being knocked back
        if (enemy.knockbackTime && this.scene.time.now < enemy.knockbackTime) {
            return; // Don't apply AI movement during knockback
        }
        
        // Check if enemy is stunned
        if (this.scene.stunnedEnemies && this.scene.stunnedEnemies.has(enemy)) {
            return; // Stunned enemies don't move
        }
        
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Avoid jittering when very close
            const speed = enemy.speed / 50; // Scale down for Matter.js
            const velocityX = (dx / distance) * speed;
            const velocityY = (dy / distance) * speed;
            
            try {
                this.scene.matter.body.setVelocity(enemy.body, {
                    x: velocityX,
                    y: velocityY
                });
            } catch (error) {
                // Handle physics errors gracefully
            }
        }
    }

    updateXPOrbMagnetism() {
        // Return early if XP orbs group doesn't exist yet or player stats not initialized
        if (!this.scene.xpOrbs || !this.scene.statsSystem.getPlayerStats() || !this.scene.player) return;
        
        // XP Orb magnetism using Matter.js - optimized for loop
        const orbs = this.scene.xpOrbs.children.entries;
        const pickupRange = this.scene.statsSystem.getPlayerStats().pickupRange;
        const pickupRangeSquared = pickupRange * pickupRange; // Use squared distance for performance
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const speed = this.scene.gameConfig.XP_ORB_MAGNET_SPEED / 50; // Scale down for Matter.js
        
        for (let i = 0, len = orbs.length; i < len; i++) {
            const orb = orbs[i];
            
            // Fast validation checks
            if (!orb || !orb.active || !orb.body || !orb.scene || orb.beingCollected || orb.isMagnetOrb) continue;
            
            // Use squared distance comparison to avoid expensive sqrt operation
            const dx = playerX - orb.x;
            const dy = playerY - orb.y;
            const distanceSquared = dx * dx + dy * dy;
            
            if (distanceSquared < pickupRangeSquared) {
                // Only calculate the actual distance and angle when we need to apply magnetism
                const distance = Math.sqrt(distanceSquared);
                const angle = Math.atan2(dy, dx);
                
                try {
                    this.scene.matter.body.setVelocity(orb.body, {
                        x: Math.cos(angle) * speed,
                        y: Math.sin(angle) * speed
                    });
                } catch (error) {
                    Logger.error('Orb velocity error:', error);
                }
            }
        }
    }
    
    updateEnemyRegeneration() {
        // Return early if enemies group doesn't exist yet
        if (!this.scene.enemies) return;
        
        const currentTime = this.scene.time.now;
        const enemies = this.scene.enemies.children.entries;
        
        for (let i = 0, len = enemies.length; i < len; i++) {
            const enemy = enemies[i];
            
            // Fast validation checks - only process enemies with regen
            if (!enemy || !enemy.active || !enemy.scene || !enemy.healthRegen) continue;
            
            // Regenerate health every second
            if (currentTime - enemy.lastRegenTime >= 1000) {
                enemy.lastRegenTime = currentTime;
                
                if (enemy.health < enemy.maxHealth) {
                    enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.healthRegen);
                    
                    // Visual feedback for regeneration
                    const healEffect = this.scene.add.text(enemy.x, enemy.y - 20, `+${enemy.healthRegen}`, {
                        fontSize: '12px',
                        color: '#00ff00'
                    }).setOrigin(0.5, 0.5);
                    
                    this.scene.tweens.add({
                        targets: healEffect,
                        y: enemy.y - 40,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => healEffect.destroy()
                    });
                }
            }
        }
    }

    applyPoisonEffect() {
        // Clear any existing poison timer
        if (this.poisonTimer) {
            this.poisonTimer.remove();
        }
        
        // Mark player as poisoned
        this.scene.statsSystem.getPlayerProgression().isPoisoned = true;
        
        // Add visual indicator using StatusEffectSystem
        if (this.scene.statusEffectSystem) {
            // Remove any existing poison effects first
            this.scene.statusEffectSystem.removeStatusEffectsByType('poison');
            
            // Add new poison effect with duration
            this.poisonEffectId = this.scene.statusEffectSystem.addStatusEffect('poison', this.poisonDuration);
        }
        
        // Start poison damage timer - use simple repeat count, let Phaser handle the timing
        const poisonTicks = Math.floor(this.poisonDuration / this.poisonTickInterval);
        let currentTick = 0;
        
        this.poisonTimer = this.scene.time.addEvent({
            delay: this.poisonTickInterval,
            callback: () => {
                // Check if game is still active and player is alive
                if (!this.scene.gameStarted || this.scene.statsSystem.getPlayerProgression().health <= 0) {
                    this.clearPoisonEffect();
                    return;
                }
                
                this.scene.statsSystem.takeDamage(this.poisonDamage, true); // true = bypass invincibility
                
                currentTick++;
                // Clear effect after all ticks are complete
                if (currentTick >= poisonTicks) {
                    this.clearPoisonEffect();
                }
            },
            repeat: poisonTicks - 1 // This will make the callback run poisonTicks times total
        });
    }
    
    clearPoisonEffect() {
        // Clear poison state
        this.scene.statsSystem.getPlayerProgression().isPoisoned = false;
        
        if (this.poisonTimer) {
            this.poisonTimer.remove();
            this.poisonTimer = null;
        }
        
        // Remove poison visual effect using StatusEffectSystem
        if (this.scene.statusEffectSystem) {
            if (this.poisonEffectId) {
                this.scene.statusEffectSystem.removeStatusEffect(this.poisonEffectId);
                this.poisonEffectId = null;
            } else {
                // Fallback: remove all poison effects
                this.scene.statusEffectSystem.removeStatusEffectsByType('poison');
            }
        }
    }
    
    applyBleedEffect() {
        // Clear any existing bleed timer
        if (this.bleedTimer) {
            this.bleedTimer.remove();
        }
        
        // Mark player as bleeding
        this.scene.statsSystem.getPlayerProgression().isBleeding = true;
        
        // Add visual indicator using StatusEffectSystem
        if (this.scene.statusEffectSystem) {
            // Remove any existing bleed effects first
            this.scene.statusEffectSystem.removeStatusEffectsByType('bleed');
            
            // Add new bleed effect with duration
            this.bleedEffectId = this.scene.statusEffectSystem.addStatusEffect('bleed', this.bleedDuration);
        }
        
        // Start bleed damage timer - use simple repeat count, let Phaser handle the timing
        const bleedTicks = Math.floor(this.bleedDuration / this.bleedTickInterval);
        let currentTick = 0;
        
        this.bleedTimer = this.scene.time.addEvent({
            delay: this.bleedTickInterval,
            callback: () => {
                // Check if game is still active and player is alive
                if (!this.scene.gameStarted || this.scene.statsSystem.getPlayerProgression().health <= 0) {
                    this.clearBleedEffect();
                    return;
                }
                
                this.scene.statsSystem.takeDamage(this.bleedDamage, true); // true = bypass invincibility
                
                currentTick++;
                // Clear effect after all ticks are complete
                if (currentTick >= bleedTicks) {
                    this.clearBleedEffect();
                }
            },
            repeat: bleedTicks - 1 // This will make the callback run bleedTicks times total
        });
    }
    
    clearBleedEffect() {
        // Clear bleed state
        this.scene.statsSystem.getPlayerProgression().isBleeding = false;
        
        if (this.bleedTimer) {
            this.bleedTimer.remove();
            this.bleedTimer = null;
        }
        
        // Remove bleed visual effect using StatusEffectSystem
        if (this.scene.statusEffectSystem) {
            if (this.bleedEffectId) {
                this.scene.statusEffectSystem.removeStatusEffect(this.bleedEffectId);
                this.bleedEffectId = null;
            } else {
                // Fallback: remove all bleed effects
                this.scene.statusEffectSystem.removeStatusEffectsByType('bleed');
            }
        }
    }
    
    showPoisonEffect() {
        // Legacy method - now handled by applyPoisonEffect
    }
    
    hidePoisonEffect() {
        // Legacy method - now handled by clearPoisonEffect
    }

    checkMagnetOrbSpawn(x, y) {
        // Only spawn if no magnet orb already exists on map
        if (this.isMagnetOrbAlreadyOnMap()) {
            return; // Don't spawn another one
        }
        
        // Random chance spawn on enemy kill (much rarer now)
        if (Math.random() < this.magnetOrbKillChance) {
            this.spawnMagnetOrb(x, y);
        }
    }
    
    checkLevelMagnetOrbSpawn() {
        const currentLevel = this.scene.statsSystem.getPlayerProgression().level;
        
        // Only spawn if no magnet orb already exists on map
        if (this.isMagnetOrbAlreadyOnMap()) {
            return; // Don't spawn another one
        }
        
        // Spawn magnet orb every 2 levels (2, 4, 6, etc.) instead of every 3
        if (currentLevel % 2 === 0 && currentLevel > this.lastMagnetOrbLevel) {
            this.lastMagnetOrbLevel = currentLevel;
            
            // Spawn near player but not too close
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(100, 200);
            const spawnX = this.scene.player.x + Math.cos(angle) * distance;
            const spawnY = this.scene.player.y + Math.sin(angle) * distance;
            
            this.spawnMagnetOrb(spawnX, spawnY);
        }
    }
    
    // Helper method to check if a magnet orb already exists on the map
    isMagnetOrbAlreadyOnMap() {
        if (!this.scene.xpOrbs) return false;
        
        const existingMagnetOrbs = this.scene.xpOrbs.children.entries.filter(orb => 
            orb && orb.active && orb.scene && orb.isMagnetOrb
        );
        
        return existingMagnetOrbs.length > 0;
    }
    
    spawnMagnetOrb(x, y) {
        // Create XP Magnet Orb with distinctive appearance
        const magnetOrb = this.scene.add.circle(x, y, 16, 0xFFD700); // Gold color, larger than normal XP orbs
        magnetOrb.setStrokeStyle(3, 0xFFA500, 1); // Orange border
        
        // Add pulsing glow effect
        const glowEffect = this.scene.add.circle(x, y, 24, 0xFFD700, 0.3);
        
        // Create tween with proper cleanup handling
        const glowTween = this.scene.tweens.add({
            targets: glowEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                // Safety check - if glow effect is destroyed, stop the tween
                if (!glowEffect.active || !glowEffect.scene) {
                    glowTween.destroy();
                }
            }
        });
        
        // Store references for cleanup
        magnetOrb.glowEffect = glowEffect;
        magnetOrb.glowTween = glowTween;
        
        // Add Matter.js physics 
        this.scene.matter.add.gameObject(magnetOrb, {
            shape: 'circle',
            isSensor: true,
            label: 'magnetOrb'
        });
        
        // Mark as magnet orb for identification
        magnetOrb.isMagnetOrb = true;
        
        // Add to XP orbs group for easy management
        this.scene.xpOrbs.add(magnetOrb);
        
        // Store reference to current magnet orb for indicator
        this.currentMagnetOrb = magnetOrb;
        
        // Show arrow indicator instead of text notification
        this.showMagnetOrbIndicator();
    }
    
    showMagnetOrbIndicator() {
        // Clean up any existing indicator
        this.hideMagnetOrbIndicator();
        
        // Create arrow indicator at edge of screen
        this.magnetOrbIndicator = this.scene.add.triangle(0, 0, 0, -12, 10, 8, -10, 8, 0xFFD700);
        this.magnetOrbIndicator.setStrokeStyle(2, 0xFFA500);
        this.magnetOrbIndicator.setScrollFactor(0); // Stay fixed to camera
        this.magnetOrbIndicator.setDepth(1500);
        
        // Add pulsing animation to make it more noticeable
        this.magnetOrbIndicatorTween = this.scene.tweens.add({
            targets: this.magnetOrbIndicator,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });
        
        // Update arrow position immediately
        this.updateMagnetOrbIndicator();
    }
    
    updateMagnetOrbIndicator() {
        // Only update if indicator exists and magnet orb exists
        if (!this.magnetOrbIndicator || !this.currentMagnetOrb || !this.currentMagnetOrb.active) {
            this.hideMagnetOrbIndicator();
            return;
        }
        
        // Get camera bounds
        const camera = this.scene.cameras.main;
        const cameraCenter = {
            x: camera.scrollX + camera.width / 2,
            y: camera.scrollY + camera.height / 2
        };
        
        // Calculate direction from camera center to magnet orb
        const dx = this.currentMagnetOrb.x - cameraCenter.x;
        const dy = this.currentMagnetOrb.y - cameraCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only show indicator if magnet orb is outside a certain range or off-screen
        const indicatorRange = Math.min(camera.width, camera.height) * 0.4; // Show when orb is in outer 40% of screen
        
        if (distance < indicatorRange) {
            // Magnet orb is close to center, hide indicator
            this.magnetOrbIndicator.setVisible(false);
            return;
        }
        
        // Show indicator
        this.magnetOrbIndicator.setVisible(true);
        
        // Calculate angle to magnet orb
        const angle = Math.atan2(dy, dx);
        
        // Position arrow at edge of screen in direction of magnet orb
        const margin = 50; // Distance from edge of screen
        const edgeDistance = Math.min(camera.width / 2 - margin, camera.height / 2 - margin);
        
        const arrowX = camera.width / 2 + Math.cos(angle) * edgeDistance;
        const arrowY = camera.height / 2 + Math.sin(angle) * edgeDistance;
        
        // Update arrow position and rotation
        this.magnetOrbIndicator.setPosition(arrowX, arrowY);
        this.magnetOrbIndicator.setRotation(angle + Math.PI / 2); // Adjust rotation so arrow points correctly
    }
    
    hideMagnetOrbIndicator() {
        if (this.magnetOrbIndicator) {
            if (this.magnetOrbIndicatorTween) {
                this.magnetOrbIndicatorTween.destroy();
                this.magnetOrbIndicatorTween = null;
            }
            this.magnetOrbIndicator.destroy();
            this.magnetOrbIndicator = null;
        }
    }
    
    playerCollectMagnetOrb(player, magnetOrb) {
        if (!player || !magnetOrb || !magnetOrb.active || !magnetOrb.scene || !magnetOrb.isMagnetOrb) return;
        
        // Collect all regular XP orbs on the map
        let collectedXP = 0;
        let orbsCollected = 0;
        
        // Get all XP orbs (excluding the magnet orb itself)
        const xpOrbs = this.scene.xpOrbs.children.entries.filter(orb => 
            orb && orb.active && orb.scene && !orb.isMagnetOrb && orb.xpValue
        );
        
        // Process each orb immediately to prevent race conditions
        xpOrbs.forEach(orb => {
            // Mark orb as being collected to prevent double collection
            if (orb.beingCollected) return;
            orb.beingCollected = true;
            
            // Add XP value and count immediately
            collectedXP += orb.xpValue;
            orbsCollected++;
            
            // Store original position and properties for animation
            const startX = orb.x;
            const startY = orb.y;
            const orbColor = orb.fillColor || 0x00ff00;
            const orbRadius = orb.radius || 8;
            
            // Remove original orb immediately - no more physics or rendering issues
            try {
                if (orb.body) {
                    this.scene.matter.world.remove(orb.body);
                }
                this.scene.xpOrbs.remove(orb);
                orb.destroy();
            } catch (error) {
                // Orb already cleaned up
            }
            
            // Create a new visual-only element for animation (no physics)
            const animationOrb = this.scene.add.circle(startX, startY, orbRadius, orbColor);
            animationOrb.setAlpha(1);
            
            // Animate the visual element toward player
            this.scene.tweens.add({
                targets: animationOrb,
                x: player.x,
                y: player.y,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    // Clean up the animation element
                    try {
                        if (animationOrb && animationOrb.active) {
                            animationOrb.destroy();
                        }
                    } catch (error) {
                        // Animation orb already destroyed
                    }
                }
            });
        });
        
        // Add all collected XP to player immediately
        if (collectedXP > 0) {
            this.scene.statsSystem.addXP(collectedXP);
        }
        
        // Visual collection effect for magnet orb
        const collectEffect = this.scene.add.circle(magnetOrb.x, magnetOrb.y, 32, 0xFFD700, 0.8);
        this.scene.tweens.add({
            targets: collectEffect,
            alpha: 0,
            scale: 4,
            duration: 500,
            onComplete: () => {
                try {
                    collectEffect.destroy();
                } catch (error) {
                    // Collect effect already destroyed
                }
            }
        });
        
        // Show collection summary
        if (orbsCollected > 0) {
            const summary = this.scene.add.text(magnetOrb.x, magnetOrb.y - 50, 
                `+${collectedXP} XP\n(${orbsCollected} orbs)`, {
                fontSize: '16px',
                color: '#FFD700',
                fontWeight: 'bold',
                align: 'center'
            }).setOrigin(0.5, 0.5);
            
            this.scene.tweens.add({
                targets: summary,
                y: summary.y - 30,
                alpha: 0,
                duration: 2000,
                onComplete: () => {
                    try {
                        summary.destroy();
                    } catch (error) {
                        // Summary already destroyed
                    }
                }
            });
        }
        
        // Clean up magnet orb and its glow effect
        try {
            if (magnetOrb.glowTween) {
                magnetOrb.glowTween.destroy();
            }
            if (magnetOrb.glowEffect && magnetOrb.glowEffect.active) {
                this.scene.tweens.killTweensOf(magnetOrb.glowEffect);
                magnetOrb.glowEffect.destroy();
            }
            
            // Clear reference to current magnet orb
            if (this.currentMagnetOrb === magnetOrb) {
                this.currentMagnetOrb = null;
            }
            
            // Hide indicator since magnet orb is gone
            this.hideMagnetOrbIndicator();
            
            // Remove from physics world and group
            if (magnetOrb.body) {
                this.scene.matter.world.remove(magnetOrb.body);
            }
            this.scene.xpOrbs.remove(magnetOrb);
            magnetOrb.destroy();
        } catch (error) {
            Logger.error(Logger.Categories.SYSTEM, 'Error cleaning up magnet orb:', error);
        }
    }
    
    cleanupAllMagnetOrbs() {
        // Clean up all magnet orbs and their effects when game restarts/ends
        if (!this.scene.xpOrbs) return;
        
        const magnetOrbs = this.scene.xpOrbs.children.entries.filter(orb => 
            orb && orb.active && orb.isMagnetOrb
        );
        
        magnetOrbs.forEach(magnetOrb => {
            try {
                if (magnetOrb.glowTween) {
                    magnetOrb.glowTween.destroy();
                }
                if (magnetOrb.glowEffect && magnetOrb.glowEffect.active) {
                    this.scene.tweens.killTweensOf(magnetOrb.glowEffect);
                    magnetOrb.glowEffect.destroy();
                }
                            } catch (error) {
                    Logger.error(Logger.Categories.SYSTEM, 'Error cleaning up magnet orb during cleanup:', error);
                }
        });
        
        // Clean up indicator as well
        this.currentMagnetOrb = null;
        this.hideMagnetOrbIndicator();
        
        // Cleaned up magnet orbs on restart
    }

    handleRangedEnemyAI(enemy) {
        const distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y);
        const rangedConfig = enemy.enemyType.rangedAttack;
        let speed = enemy.speed / 50; // Scale down for Matter.js
        
        // Initialize attack timer if not set
        if (!enemy.lastRangedAttack) {
            enemy.lastRangedAttack = 0;
        }
        
        // Movement behavior based on distance to player
        if (distanceToPlayer < rangedConfig.keepDistance) {
            // Too close - move away from player
            const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, enemy.x, enemy.y);
            try {
                this.scene.matter.body.setVelocity(enemy.body, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                });
            } catch (error) {
                Logger.error(Logger.Categories.SYSTEM, 'Error setting ranged enemy retreat velocity:', error);
            }
        } else if (distanceToPlayer > rangedConfig.range) {
            // Too far - move closer to player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y);
            try {
                this.scene.matter.body.setVelocity(enemy.body, {
                    x: Math.cos(angle) * speed * 0.5, // Move slower when approaching
                    y: Math.sin(angle) * speed * 0.5
                });
            } catch (error) {
                Logger.error(Logger.Categories.SYSTEM, 'Error setting ranged enemy approach velocity:', error);
            }
        } else {
            // In optimal range - stop moving and attack
            try {
                this.scene.matter.body.setVelocity(enemy.body, { x: 0, y: 0 });
                    } catch (error) {
            Logger.error(Logger.Categories.SYSTEM, 'Error stopping ranged enemy:', error);
        }
            
            // Check if we can attack
            const currentTime = this.scene.time.now;
            if (currentTime - enemy.lastRangedAttack >= rangedConfig.attackCooldown) {
                this.fireEggProjectile(enemy);
                enemy.lastRangedAttack = currentTime;
            }
        }
    }
    
    fireEggProjectile(enemy) {
        const rangedConfig = enemy.enemyType.rangedAttack;
        
        // Calculate base angle to player
        let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y);
        
        // Add some inaccuracy based on accuracy setting
        const inaccuracy = (1 - rangedConfig.accuracy) * 0.5; // Convert to radians
        angle += Phaser.Math.FloatBetween(-inaccuracy, inaccuracy);
        
        // Create egg projectile
        const egg = this.scene.add.circle(enemy.x, enemy.y, 4, 0xFFF8DC); // Cream/eggshell color
        egg.setStrokeStyle(1, 0xDEB887); // Burlywood border
        
        // Add Matter.js physics to projectile
        this.scene.matter.add.gameObject(egg, {
            shape: 'circle',
            isSensor: true, // Don't collide with other objects, only trigger events
            label: 'enemyProjectile',
            ignoreGravity: true
        });
        
        // Set projectile properties
        egg.damage = rangedConfig.projectileDamage;
        egg.shooter = enemy;
        egg.creationTime = this.scene.time.now;
        egg.lifespan = 3000; // 3 seconds before auto-destroy
        
        // Set velocity
        const velocity = {
            x: Math.cos(angle) * (rangedConfig.projectileSpeed / 50), // Scale for Matter.js
            y: Math.sin(angle) * (rangedConfig.projectileSpeed / 50)
        };
        
        try {
            this.scene.matter.body.setVelocity(egg.body, velocity);
        } catch (error) {
            Logger.error(Logger.Categories.SYSTEM, 'Error setting projectile velocity:', error);
            egg.destroy();
            return;
        }
        
        // Add to projectiles group
        this.scene.enemyProjectiles.add(egg);
        
        // Visual feedback on the shooter (muzzle flash effect)
        const muzzleFlash = this.scene.add.circle(enemy.x, enemy.y, 8, 0xFFFF00, 0.6);
        this.scene.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scale: 2,
            duration: 150,
            onComplete: () => muzzleFlash.destroy()
        });
        
        // Chicken Bufo fired egg projectile
    }
    
    updateEnemyProjectiles() {
        // Return early if projectiles group doesn't exist
        if (!this.scene.enemyProjectiles) return;
        
        const currentTime = this.scene.time.now;
        const activeProjectiles = this.scene.enemyProjectiles.children.entries.filter(projectile => 
            projectile && projectile.active && projectile.scene
        );
        
        activeProjectiles.forEach(projectile => {
            // Check lifespan
            if (currentTime - projectile.creationTime >= projectile.lifespan) {
                this.destroyEnemyProjectile(projectile);
                return;
            }
            
            // Check bounds
            const bounds = this.scene.map;
            if (projectile.x < 0 || projectile.x > bounds.widthInPixels || 
                projectile.y < 0 || projectile.y > bounds.heightInPixels) {
                this.destroyEnemyProjectile(projectile);
                return;
            }
        });
    }
    
    destroyEnemyProjectile(projectile) {
        if (!projectile || !projectile.active) return;
        
        // Small destruction effect
        const destroyEffect = this.scene.add.circle(projectile.x, projectile.y, 6, 0xFFFFFF, 0.8);
        this.scene.tweens.add({
            targets: destroyEffect,
            alpha: 0,
            scale: 0.1,
            duration: 200,
            onComplete: () => {
                try {
                    destroyEffect.destroy();
                } catch (error) {
                    // Destroy effect already cleaned up
                }
            }
        });
        
        // Remove from group and destroy
        this.scene.enemyProjectiles.remove(projectile);
        projectile.destroy();
    }
    
    playerHitByEnemyProjectile(player, projectile) {
        if (!player || !projectile || !projectile.active || !projectile.scene) return;
        
        // Check if player is invincible
        if (this.scene.statsSystem.getPlayerProgression().invincible) return;
        
        // Deal damage to player
        const damage = projectile.damage || 5;
        this.scene.statsSystem.takeDamage(damage);
        
        // Knockback effect
        const angle = Phaser.Math.Angle.Between(projectile.shooter?.x || projectile.x, projectile.shooter?.y || projectile.y, player.x, player.y);
        this.scene.matter.body.setVelocity(player.body, {
            x: Math.cos(angle) * 3, // Lighter knockback than enemy contact
            y: Math.sin(angle) * 3
        });
        
        // Destroy the projectile
        this.destroyEnemyProjectile(projectile);
        
        // Player hit by enemy projectile
    }

    update() {
        this.updateEnemyAI();
        this.updateXPOrbMagnetism();
        this.updateEnemyRegeneration();
        this.updateEnemyProjectiles();
        this.updateMagnetOrbIndicator();
        
        // Update boss health bar if boss is active
        if (this.bossState.active && this.bossState.currentBoss) {
            this.updateBossHealthBar();
        }
    }
    
    // Cleanup method for game over/restart
    cleanup() {
        // Clear poison timer
        if (this.poisonTimer) {
            this.poisonTimer.remove();
            this.poisonTimer = null;
        }
        
        // Clear bleed timer
        if (this.bleedTimer) {
            this.bleedTimer.remove();
            this.bleedTimer = null;
        }
        
        // Clear poison/bleed effects
        this.clearPoisonEffect();
        this.clearBleedEffect();
        
        // Cleanup all magnet orbs
        this.cleanupAllMagnetOrbs();
        
        // Reset magnet orb tracking
        this.lastMagnetOrbLevel = 0;
    }

    updateLevelProgression() {
        const currentLevel = this.scene.statsSystem.getPlayerProgression().level;
        this.levelProgression.currentLevel = currentLevel;
        
        // Check if we need to process a new level
        if (currentLevel > this.levelProgression.lastProcessedLevel) {
            this.processLevelEvents(currentLevel);
            this.levelProgression.lastProcessedLevel = currentLevel;
        }
        
        // Update frenzy state
        this.updateFrenzyState();
    }
    
    processLevelEvents(level) {
        Logger.system(`Processing level ${level} events`);
        
        // Check for boss levels
        if (this.levelProgression.bossLevels.includes(level)) {
            this.triggerBossFight(level);
        }
        // Check for frenzy levels (only if not a boss level)
        else if (this.levelProgression.frenzyLevels.includes(level)) {
            this.triggerFrenzyMode(level);
        }
        
        // Check for XP magnet orb level spawns
        this.checkLevelMagnetOrbSpawn();
    }
    
    triggerBossFight(level) {
        if (this.bossState.active) return; // Boss already active
        
        Logger.system(`🏆 BOSS FIGHT TRIGGERED at level ${level}!`);
        
        // Clear existing enemies for boss fight
        this.clearAllEnemies();
        
        // Set boss state
        this.bossState.active = true;
        this.bossState.bossDefeated = false;
        this.bossState.bossSpawned = false;
        
        // Show boss warning
        this.showBossWarning(level);
        
        // Spawn boss after warning
        this.scene.time.delayedCall(3000, () => {
            this.spawnBoss(level);
        });
    }
    
    showBossWarning(level) {
        // Create warning notification
        const warning = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            this.scene.cameras.main.height / 2, 
            `⚠️ BOSS APPROACHING ⚠️\nLevel ${level} Boss Fight!`, 
            {
                fontSize: '48px',
                color: '#ff0000',
                fontWeight: 'bold',
                backgroundColor: '#000000',
                padding: { x: 24, y: 16 },
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: warning,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 4
        });
        
        // Fade out and destroy after 3 seconds
        this.scene.time.delayedCall(2500, () => {
            this.scene.tweens.add({
                targets: warning,
                alpha: 0,
                duration: 500,
                onComplete: () => warning.destroy()
            });
        });
    }
    
    spawnBoss(level) {
        if (this.bossState.bossSpawned) return;
        
        let bossType;
        
        // Determine boss type based on level
        if (level === 10) {
            bossType = this.enemyRegistry.getEnemyData('yoda');
        } else if (level === 20) {
            // Future boss - for now use Yoda again
            bossType = this.enemyRegistry.getEnemyData('yoda');
        }
        
        if (!bossType) {
            Logger.error('No boss type found for level', level);
            this.endBossFight(false);
            return;
        }
        
        Logger.system(`Spawning boss: ${bossType.name}`);
        
        // Spawn boss at center of map
        const mapCenterX = this.scene.map ? this.scene.map.widthInPixels / 2 : 1600;
        const mapCenterY = this.scene.map ? this.scene.map.heightInPixels / 2 : 1200;
        
        // Create boss sprite
        const boss = this.scene.add.image(mapCenterX, mapCenterY, bossType.sprite);
        boss.setDisplaySize(bossType.baseStats.displaySize, bossType.baseStats.displaySize);
        
        // Try to create animated overlay
        const hasAnimatedOverlay = this.scene.assetManager.createAnimatedOverlay(boss, bossType.sprite, 'enemies');
        if (!hasAnimatedOverlay) {
            boss.setAlpha(1);
        }
        
        // Add Matter.js physics with boss-specific settings
        this.scene.matter.add.gameObject(boss, {
            shape: {
                type: 'circle',
                radius: bossType.baseStats.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Create boss instance
        try {
            const bossInstance = this.enemyRegistry.createEnemy(this.scene, bossType.id, boss);
            
            // Mark as boss
            boss.isBoss = true;
            boss.bossLevel = level;
            
            Logger.system(`Boss ${bossType.name} spawned successfully`);
        } catch (error) {
            Logger.error('Failed to create boss instance:', error);
            boss.destroy();
            this.endBossFight(false);
            return;
        }
        
        // Add debug hitbox visualization
        boss.hitboxDebug = this.scene.add.circle(
            mapCenterX, 
            mapCenterY, 
            bossType.baseStats.hitboxRadius, 
            0xff0000, 
            0.3
        );
        boss.hitboxDebug.setStrokeStyle(4, 0xff0000);
        boss.hitboxDebug.setVisible(this.scene.showHitboxes);
        
        // Add to enemies group
        this.scene.enemies.add(boss);
        
        // Store boss reference
        this.bossState.currentBoss = boss;
        this.bossState.bossSpawned = true;
        
        // Show boss health bar
        this.showBossHealthBar(boss);
    }
    
    showBossHealthBar(boss) {
        // Create boss health bar UI
        const barWidth = 600;
        const barHeight = 20;
        const barX = this.scene.cameras.main.width / 2 - barWidth / 2;
        const barY = 50;
        
        // Background
        const healthBarBg = this.scene.add.rectangle(
            barX + barWidth / 2, 
            barY + barHeight / 2, 
            barWidth, 
            barHeight, 
            0x330000
        );
        healthBarBg.setStrokeStyle(2, 0xff0000);
        healthBarBg.setScrollFactor(0).setDepth(1500);
        
        // Foreground
        const healthBar = this.scene.add.rectangle(
            barX, 
            barY + barHeight / 2, 
            barWidth, 
            barHeight, 
            0xff0000
        );
        healthBar.setOrigin(0, 0.5);
        healthBar.setScrollFactor(0).setDepth(1501);
        
        // Boss name text
        const bossNameText = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            barY - 25, 
            boss.enemyType ? boss.enemyType.name : 'Boss', 
            {
                fontSize: '24px',
                color: '#ff0000',
                fontWeight: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1502);
        
        // Store references for updates
        boss.healthBarBg = healthBarBg;
        boss.healthBar = healthBar;
        boss.bossNameText = bossNameText;
    }
    
    triggerFrenzyMode(level) {
        if (this.frenzyState.active) return; // Frenzy already active
        
        Logger.system(`🔥 FRENZY MODE TRIGGERED at level ${level}!`);
        
        // Set frenzy state
        this.frenzyState.active = true;
        this.frenzyState.startTime = this.scene.time.now;
        
        // Show frenzy notification
        this.showFrenzyNotification(level);
        
        // Apply frenzy effects to existing enemies
        this.applyFrenzyToExistingEnemies();
    }
    
    showFrenzyNotification(level) {
        const notification = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            300, 
            `🔥 FRENZY MODE 🔥\nLevel ${level} - 30 seconds of chaos!`, 
            {
                fontSize: '36px',
                color: '#ff6600',
                fontWeight: 'bold',
                backgroundColor: '#000000',
                padding: { x: 16, y: 8 },
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1000);
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: notification,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 400,
            yoyo: true,
            repeat: 4
        });
        
        // Fade out after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 1000,
                onComplete: () => notification.destroy()
            });
        });
    }
    
    applyFrenzyToExistingEnemies() {
        if (!this.scene.enemies) return;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active && !enemy.isBoss) {
                // Increase speed
                if (enemy.speed) {
                    enemy.speed *= this.frenzyState.speedMultiplier;
                }
                
                // Increase damage
                if (enemy.contactDamage) {
                    enemy.contactDamage = Math.floor(enemy.contactDamage * this.frenzyState.damageMultiplier);
                }
                
                // Add visual frenzy effect
                if (enemy.setTint) {
                    enemy.setTint(0xff6600); // Orange tint for frenzy
                }
            }
        });
    }
    
    updateFrenzyState() {
        if (!this.frenzyState.active) return;
        
        const currentTime = this.scene.time.now;
        const elapsed = currentTime - this.frenzyState.startTime;
        
        if (elapsed >= this.frenzyState.duration) {
            this.endFrenzyMode();
        }
    }
    
    endFrenzyMode() {
        if (!this.frenzyState.active) return;
        
        Logger.system('Frenzy mode ended');
        this.frenzyState.active = false;
        
        // Remove frenzy effects from existing enemies
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy && enemy.active && !enemy.isBoss) {
                    // Reset speed
                    if (enemy.speed && enemy.enemyType) {
                        enemy.speed = enemy.enemyType.baseStats.speed;
                    }
                    
                    // Reset damage
                    if (enemy.contactDamage && enemy.enemyType) {
                        enemy.contactDamage = enemy.enemyType.baseStats.contactDamage;
                    }
                    
                    // Remove tint
                    if (enemy.clearTint) {
                        enemy.clearTint();
                    }
                }
            });
        }
    }
    
    clearAllEnemies() {
        if (!this.scene.enemies) return;
        
        // Clear all non-boss enemies
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active && !enemy.isBoss) {
                this.killEnemy(enemy);
            }
        });
    }
    
    // Method to handle boss defeat
    onBossDefeated(bossType) {
        Logger.system(`🎉 Boss ${bossType} defeated!`);
        
        this.bossState.bossDefeated = true;
        
        // Clean up boss UI
        if (this.bossState.currentBoss) {
            const boss = this.bossState.currentBoss;
            if (boss.healthBarBg) boss.healthBarBg.destroy();
            if (boss.healthBar) boss.healthBar.destroy(); 
            if (boss.bossNameText) boss.bossNameText.destroy();
        }
        
        // Show victory message
        this.showBossVictoryMessage(bossType);
        
        // End boss fight after delay
        this.scene.time.delayedCall(3000, () => {
            this.endBossFight(true);
        });
    }
    
    showBossVictoryMessage(bossType) {
        const victory = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            this.scene.cameras.main.height / 2, 
            `🎉 BOSS DEFEATED! 🎉\n${bossType.toUpperCase()} BUFO VANQUISHED!`, 
            {
                fontSize: '42px',
                color: '#00ff00',
                fontWeight: 'bold',
                backgroundColor: '#000000',
                padding: { x: 24, y: 16 },
                align: 'center'
            }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Celebration effect
        this.scene.tweens.add({
            targets: victory,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 600,
            yoyo: true,
            repeat: 3
        });
        
        // Fade out
        this.scene.time.delayedCall(2500, () => {
            this.scene.tweens.add({
                targets: victory,
                alpha: 0,
                duration: 500,
                onComplete: () => victory.destroy()
            });
        });
    }
    
    endBossFight(victory) {
        Logger.system(`Boss fight ended - Victory: ${victory}`);
        
        // Reset boss state
        this.bossState.active = false;
        this.bossState.currentBoss = null;
        this.bossState.bossDefeated = false;
        this.bossState.bossSpawned = false;
        
        // Resume normal enemy spawning
        // (spawnEnemy method will automatically resume when bossState.active = false)
    }

    applyFrenzyModifiers(enemy) {
        if (!enemy || !enemy.enemyType) return;
        
        // Increase speed
        if (enemy.speed) {
            enemy.speed = Math.floor(enemy.speed * this.frenzyState.speedMultiplier);
        }
        
        // Increase damage
        if (enemy.contactDamage) {
            enemy.contactDamage = Math.floor(enemy.contactDamage * this.frenzyState.damageMultiplier);
        }
        
        // Add visual frenzy effect
        if (enemy.setTint) {
            enemy.setTint(0xff6600); // Orange tint for frenzy
        }
        
        Logger.enemy(`Applied frenzy modifiers to ${enemy.enemyType.name}`);
    }
    
    updateBossHealthBar() {
        const boss = this.bossState.currentBoss;
        if (!boss || !boss.active || !boss.healthBar) return;
        
        // Calculate health percentage
        const healthPercent = Math.max(0, boss.health / boss.maxHealth);
        
        // Update health bar width
        boss.healthBar.scaleX = healthPercent;
        
        // Change color based on health
        let healthColor = 0xff0000; // Red
        if (healthPercent > 0.6) {
            healthColor = 0xffff00; // Yellow
        } else if (healthPercent > 0.3) {
            healthColor = 0xff8800; // Orange
        }
        
        boss.healthBar.setFillStyle(healthColor);
    }
}

export default EnemySystem; 