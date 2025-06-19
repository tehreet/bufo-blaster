// Enemy System - Handles enemy definitions, spawning, behavior, and interactions

class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        
        // Poison system tracking
        this.poisonTimer = null;
        this.poisonDuration = 5000; // 5 seconds of poison
        this.poisonDamage = 2; // Damage per second
        this.poisonTickInterval = 1000; // 1 second between damage ticks
        
        // XP Magnet Orb system
        this.lastMagnetOrbLevel = 0; // Track last level where magnet orb was spawned
        this.magnetOrbKillChance = 0.015; // 1.5% chance per enemy kill
        
        // Enemy type definitions (hitbox radii matched to player's 12.5% sprite ratio)
        this.enemyTypes = [
            {
                id: 'hazmat',
                name: 'Hazmat Bufo',
                sprite: 'bufo-covid',
                health: 2,
                speed: 80, // Increased movement speed
                displaySize: 40,
                hitboxRadius: 5, // 40px * 12.5% = 5px (matches player ratio)
                xpValue: 15, // More valuable due to poison effect
                weight: 30,
                specialEffect: 'poison' // Causes poison on contact
            },
            {
                id: 'clown',
                name: 'Clown Bufo',
                sprite: 'bufo-clown',
                health: 3,
                speed: 45,
                displaySize: 44,
                hitboxRadius: 5, // 44px * 12.5% = 5.5px, rounded to 5px
                xpValue: 15,
                weight: 25
            },
            {
                id: 'pog',
                name: 'Pog Bufo',
                sprite: 'bufo-pog',
                health: 1,
                speed: 80,
                displaySize: 36,
                hitboxRadius: 4, // 36px * 12.5% = 4.5px, rounded to 4px  
                xpValue: 8,
                weight: 35 // Fast but weak
            },
            {
                id: 'teeth',
                name: 'Teeth Bufo',
                sprite: 'bufo-enraged',
                health: 6, // Increased HP
                speed: 65, // Increased movement speed
                displaySize: 48,
                hitboxRadius: 6, // 48px * 12.5% = 6px (matches player ratio)
                xpValue: 25, // More valuable
                weight: 10,
                specialEffect: 'regen', // Has health regeneration
                contactDamage: 15 // Increased damage (vs normal 10)
            },
            {
                id: 'mob',
                name: 'Mob Bufo',
                sprite: 'bufo-mob',
                health: 6,
                speed: 50,
                displaySize: 48,
                hitboxRadius: 6, // 48px * 12.5% = 6px (matches player ratio)
                xpValue: 30,
                weight: 5 // Very rare but very tough
            }
        ];
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
        
        // Scale enemy count and difficulty based on player level
        this.scaleEnemyDifficulty();
        
        // Spawn multiple enemies at higher levels
        const enemyCount = Math.min(Math.floor(this.scene.statsSystem.getPlayerProgression().level / 3) + 1, 5);
        
        for (let i = 0; i < enemyCount; i++) {
            // Small delay between spawns to spread them out
            this.scene.time.delayedCall(i * 100, () => {
                this.spawnSingleEnemy();
            });
        }
    }

    spawnSingleEnemy() {
        if (!this.scene.gameStarted || this.scene.isPaused || this.scene.upgradeSystem.upgradeActive) return;
        
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
        
        // Create enemy with sprite
        const enemy = this.scene.add.image(clampedX, clampedY, enemyType.sprite);
        enemy.setDisplaySize(enemyType.displaySize, enemyType.displaySize); // Visual size
        
        // All enemies now use PNG sprites - no GIF overlays needed
        
        // Add Matter.js physics with explicit configuration
        this.scene.matter.add.gameObject(enemy, {
            shape: {
                type: 'circle',
                radius: enemyType.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Enemy stats based on type (scale with player level)
        const levelScaling = 1 + (this.scene.statsSystem.getPlayerProgression().level - 1) * 0.2; // 20% increase per level
        enemy.health = Math.ceil(enemyType.health * levelScaling);
        enemy.maxHealth = Math.ceil(enemyType.health * levelScaling);
        enemy.speed = enemyType.speed;
        enemy.lastAttack = 0;
        enemy.attackCooldown = 1000;
        enemy.enemyType = enemyType; // Store reference to type
        enemy.xpValue = enemyType.xpValue;
        
        // Special enemy properties
        if (enemyType.specialEffect === 'regen') {
            enemy.healthRegen = 0.5; // Health per second
            enemy.lastRegenTime = 0;
        }
        
        if (enemyType.contactDamage) {
            enemy.contactDamage = enemyType.contactDamage;
        } else {
            enemy.contactDamage = this.scene.gameConfig.ENEMY_CONTACT_DAMAGE; // Default damage
        }
        
        // Add debug hitbox visualization (initially hidden) - use actual physics body radius
        const actualRadius = enemy.body.circleRadius || enemyType.hitboxRadius;
        enemy.hitboxDebug = this.scene.add.circle(clampedX, clampedY, actualRadius, 0xff0000, 0.3);
        enemy.hitboxDebug.setStrokeStyle(2, 0xff0000);
        enemy.hitboxDebug.setVisible(this.scene.showHitboxes);
        
        this.scene.enemies.add(enemy);
    }

    getRandomEnemyType() {
        // Weight selection based on player level - higher levels see tougher enemies more often
        const level = this.scene.statsSystem.getPlayerProgression().level;
        const adjustedWeights = this.enemyTypes.map(type => {
            let weight = type.weight;
            
            // Increase weight of tougher enemies at higher levels
            if (type.health >= 4 && level >= 5) {
                weight *= 1.5; // Eyes and Mob Bufo appear more often after level 5
            }
            if (type.health >= 6 && level >= 10) {
                weight *= 2; // Mob Bufo appears even more often after level 10
            }
            
            return { ...type, adjustedWeight: weight };
        });
        
        // Calculate total weight
        const totalWeight = adjustedWeights.reduce((sum, type) => sum + type.adjustedWeight, 0);
        
        // Random selection based on weights
        let random = Math.random() * totalWeight;
        for (const type of adjustedWeights) {
            random -= type.adjustedWeight;
            if (random <= 0) {
                return type;
            }
        }
        
        // Fallback to first enemy type
        return this.enemyTypes[0];
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
        
        console.log(`Triggering boss wave for level ${level} with ${waveSize} enemies`);
        
        // Show boss wave notification
        this.showBossWaveNotification(level);
        
        // Spawn wave of enemies with bias towards tougher types
        for (let i = 0; i < waveSize; i++) {
            this.scene.time.delayedCall(i * 500, () => {
                // Choose tougher enemy types for boss waves
                const toughEnemyTypes = this.enemyTypes.filter(type => type.health >= 3);
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
        
        // Create enemy with sprite
        const enemy = this.scene.add.image(clampedX, clampedY, enemyType.sprite);
        enemy.setDisplaySize(enemyType.displaySize, enemyType.displaySize);
        
        // All enemies now use PNG sprites - no GIF overlays needed
        
        // Add Matter.js physics
        this.scene.matter.add.gameObject(enemy, {
            shape: {
                type: 'circle',
                radius: enemyType.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Enemy stats (boss wave enemies get +25% health bonus)
        const levelScaling = 1 + (this.scene.statsSystem.getPlayerProgression().level - 1) * 0.2;
        const bossWaveBonus = 1.25; // 25% more health for boss wave enemies
        enemy.health = Math.ceil(enemyType.health * levelScaling * bossWaveBonus);
        enemy.maxHealth = Math.ceil(enemyType.health * levelScaling * bossWaveBonus);
        enemy.speed = enemyType.speed;
        enemy.lastAttack = 0;
        enemy.attackCooldown = 1000;
        enemy.enemyType = enemyType;
        enemy.xpValue = Math.ceil(enemyType.xpValue * 1.5); // Bonus XP for boss wave enemies
        
        // Special enemy properties
        if (enemyType.specialEffect === 'regen') {
            enemy.healthRegen = 0.5; // Health per second
            enemy.lastRegenTime = 0;
        }
        
        if (enemyType.contactDamage) {
            enemy.contactDamage = enemyType.contactDamage;
        } else {
            enemy.contactDamage = this.scene.gameConfig.ENEMY_CONTACT_DAMAGE; // Default damage
        }
        
        // Add debug hitbox visualization
        const actualRadius = enemyType.hitboxRadius;
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
        
        // Drop XP orb
        this.dropXPOrb(enemy.x, enemy.y, enemy.xpValue);
        
        // Check for XP Magnet Orb spawn (random chance)
        this.checkMagnetOrbSpawn(enemy.x, enemy.y);
        
        // Death effect
        const deathEffect = this.scene.add.circle(enemy.x, enemy.y, enemy.enemyType.displaySize / 2, 0xff0000, 0.6);
        this.scene.tweens.add({
            targets: deathEffect,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => deathEffect.destroy()
        });
        
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
        
        // Deal damage to player (use enemy's contact damage)
        const damage = enemy.contactDamage || this.scene.gameConfig.ENEMY_CONTACT_DAMAGE;
        this.scene.statsSystem.takeDamage(damage);
        
        // Special effects based on enemy type
        if (enemy.enemyType.specialEffect === 'poison') {
            this.applyPoisonEffect();
        }
        
        // Knockback effect
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        this.scene.matter.body.setVelocity(player.body, {
            x: Math.cos(angle) * 4, // Knockback force
            y: Math.sin(angle) * 4
        });
        
        // Visual feedback (screen shake removed, color flashing handled by StatsSystem)
    }

    playerCollectXP(player, xpOrb) {
        if (!xpOrb || !xpOrb.active || !xpOrb.scene) return;
        
        // Add XP to player
        this.scene.statsSystem.addXP(xpOrb.xpValue);
        
        // Collection effect
        const collectEffect = this.scene.add.circle(xpOrb.x, xpOrb.y, this.scene.gameConfig.XP_ORB_RADIUS * 2, 0x00ff00, 0.5);
        this.scene.tweens.add({
            targets: collectEffect,
            alpha: 0,
            scale: 3,
            duration: 200,
            onComplete: () => collectEffect.destroy()
        });
        
        // Remove XP orb
        xpOrb.destroy();
    }

    updateEnemyAI() {
        // Return early if enemies group doesn't exist yet
        if (!this.scene.enemies) return;
        
        // Update enemy movement and behavior
        const activeEnemies = this.scene.enemies.children.entries.filter(enemy => enemy && enemy.active && enemy.body && enemy.scene);
        
        activeEnemies.forEach(enemy => {
            // Check if enemy is currently being knocked back
            if (enemy.knockbackTime && this.scene.time.now < enemy.knockbackTime) {
                // Skip AI movement while being knocked back
                console.log(`Enemy skipping AI movement due to knockback: ${enemy.knockbackTime - this.scene.time.now}ms remaining`);
                return;
            }
            
            let angle, speed = enemy.speed / 50; // Scale down for Matter.js
            
            // Check if enemy is stunned
            if (this.scene.stunnedEnemies && this.scene.stunnedEnemies.has(enemy)) {
                // Stunned enemies don't move
                return;
            }
            
            // Normal chase AI - move towards player
            angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y);
            
            this.scene.matter.body.setVelocity(enemy.body, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            
            // Update debug hitbox position
            if (enemy.hitboxDebug) {
                enemy.hitboxDebug.x = enemy.x;
                enemy.hitboxDebug.y = enemy.y;
            }
            
            // Update animated overlay position
            this.scene.assetManager.updateAnimatedOverlay(enemy);
        });
    }

    updateXPOrbMagnetism() {
        // Return early if XP orbs group doesn't exist yet or player stats not initialized
        if (!this.scene.xpOrbs || !this.scene.statsSystem.getPlayerStats()) return;
        
        // XP Orb magnetism using Matter.js (use pickup range stat)
        const activeOrbs = this.scene.xpOrbs.children.entries.filter(orb => orb && orb.active && orb.body && orb.scene);
        const pickupRange = this.scene.statsSystem.getPlayerStats().pickupRange;
        
        activeOrbs.forEach(orb => {
            const distance = Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, orb.x, orb.y);
            if (distance < pickupRange) {
                const angle = Phaser.Math.Angle.Between(orb.x, orb.y, this.scene.player.x, this.scene.player.y);
                const speed = this.scene.gameConfig.XP_ORB_MAGNET_SPEED / 50; // Scale down for Matter.js
                this.scene.matter.body.setVelocity(orb.body, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                });
            }
        });
    }
    
    updateEnemyRegeneration() {
        // Return early if enemies group doesn't exist yet
        if (!this.scene.enemies) return;
        
        const currentTime = this.scene.time.now;
        const activeEnemies = this.scene.enemies.children.entries.filter(enemy => 
            enemy && enemy.active && enemy.scene && enemy.healthRegen);
        
        activeEnemies.forEach(enemy => {
            // Regenerate health every second
            if (currentTime - enemy.lastRegenTime >= 1000) {
                enemy.lastRegenTime = currentTime;
                
                if (enemy.health < enemy.maxHealth) {
                    enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.healthRegen);
                    
                    // Visual feedback for regeneration
                    const healEffect = this.scene.add.text(enemy.x, enemy.y - 20, '+0.5', {
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
        });
    }

    applyPoisonEffect() {
        // Clear any existing poison timer
        if (this.poisonTimer) {
            this.poisonTimer.remove();
        }
        
        // Mark player as poisoned
        this.scene.statsSystem.getPlayerProgression().isPoisoned = true;
        
        // Visual indicator for poison
        this.showPoisonEffect();
        
        console.log('Player poisoned! Regen stopped, taking damage over time.');
        
        // Start poison damage timer
        let poisonTicks = Math.floor(this.poisonDuration / this.poisonTickInterval);
        this.poisonTimer = this.scene.time.addEvent({
            delay: this.poisonTickInterval,
            callback: () => {
                if (this.scene.statsSystem.getPlayerProgression().health > 0) {
                    this.scene.statsSystem.takeDamage(this.poisonDamage);
                    console.log(`Poison damage: ${this.poisonDamage}`);
                }
                
                poisonTicks--;
                if (poisonTicks <= 0) {
                    this.clearPoisonEffect();
                }
            },
            repeat: poisonTicks - 1
        });
    }
    
    clearPoisonEffect() {
        // Clear poison state
        this.scene.statsSystem.getPlayerProgression().isPoisoned = false;
        
        if (this.poisonTimer) {
            this.poisonTimer.remove();
            this.poisonTimer = null;
        }
        
        // Hide poison visual effect
        this.hidePoisonEffect();
        
        console.log('Poison effect cleared.');
    }
    
    showPoisonEffect() {
        // Create poison visual indicator
        if (!this.poisonIndicator) {
            this.poisonIndicator = this.scene.add.text(50, 120, 'POISONED', {
                fontSize: '16px',
                color: '#00ff00',
                backgroundColor: '#004400',
                padding: { x: 8, y: 4 }
            }).setScrollFactor(0).setDepth(1000);
            
            // Pulsing effect
            this.scene.tweens.add({
                targets: this.poisonIndicator,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    hidePoisonEffect() {
        if (this.poisonIndicator) {
            this.scene.tweens.killTweensOf(this.poisonIndicator);
            this.poisonIndicator.destroy();
            this.poisonIndicator = null;
        }
    }

    checkMagnetOrbSpawn(x, y) {
        // Random chance spawn on enemy kill
        if (Math.random() < this.magnetOrbKillChance) {
            console.log('XP Magnet Orb spawned by random chance!');
            this.spawnMagnetOrb(x, y);
        }
    }
    
    checkLevelMagnetOrbSpawn() {
        const currentLevel = this.scene.statsSystem.getPlayerProgression().level;
        
        // Spawn magnet orb every 3 levels (3, 6, 9, etc.)
        if (currentLevel % 3 === 0 && currentLevel > this.lastMagnetOrbLevel) {
            this.lastMagnetOrbLevel = currentLevel;
            
            // Spawn near player but not too close
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(100, 200);
            const spawnX = this.scene.player.x + Math.cos(angle) * distance;
            const spawnY = this.scene.player.y + Math.sin(angle) * distance;
            
            console.log(`XP Magnet Orb spawned for level ${currentLevel}!`);
            this.spawnMagnetOrb(spawnX, spawnY);
        }
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
        
        // Show notification
        this.showMagnetOrbNotification();
    }
    
    showMagnetOrbNotification() {
        const notification = this.scene.add.text(700, 200, 'XP MAGNET ORB SPAWNED!', {
            fontSize: '24px',
            color: '#FFD700',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1500);
        
        // Pulsing effect
        this.scene.tweens.add({
            targets: notification,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            yoyo: true,
            repeat: 3
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
    
    playerCollectMagnetOrb(player, magnetOrb) {
        if (!player || !magnetOrb || !magnetOrb.active || !magnetOrb.scene || !magnetOrb.isMagnetOrb) return;
        
        console.log('XP Magnet Orb collected! Collecting all XP orbs on map...');
        
        // Collect all regular XP orbs on the map
        let collectedXP = 0;
        let orbsCollected = 0;
        
        // Get all XP orbs (excluding the magnet orb itself)
        const xpOrbs = this.scene.xpOrbs.children.entries.filter(orb => 
            orb && orb.active && orb.scene && !orb.isMagnetOrb
        );
        
        xpOrbs.forEach(orb => {
            if (orb.xpValue) {
                collectedXP += orb.xpValue;
                orbsCollected++;
                
                // Visual effect - orb flies to player
                this.scene.tweens.add({
                    targets: orb,
                    x: player.x,
                    y: player.y,
                    scaleX: 0.1,
                    scaleY: 0.1,
                    duration: 300,
                    onComplete: () => orb.destroy()
                });
            }
        });
        
        // Add all collected XP to player
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
            onComplete: () => collectEffect.destroy()
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
                onComplete: () => summary.destroy()
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
            magnetOrb.destroy();
        } catch (error) {
            console.error('Error cleaning up magnet orb:', error);
        }
        
        console.log(`Magnet orb collected ${orbsCollected} XP orbs for ${collectedXP} total XP`);
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
                console.error('Error cleaning up magnet orb during cleanup:', error);
            }
        });
        
        console.log(`Cleaned up ${magnetOrbs.length} magnet orbs`);
    }

    update() {
        this.updateEnemyAI();
        this.updateXPOrbMagnetism();
        this.updateEnemyRegeneration();
        
        // Check for level-based magnet orb spawning
        this.checkLevelMagnetOrbSpawn();
    }
}

export default EnemySystem; 