// Character System - Handles character definitions, abilities, and character-specific logic
import Logger from '../utils/Logger.js';

class CharacterSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedCharacter = null;
        this.characterSelected = false;
        this.selectedCharacterIndex = 0;
        
        // Character definitions with comprehensive base stats
        this.characters = {
            SHIELD_BUFO: {
                id: 'shield',
                name: 'Shield Bufo',
                description: 'Defensive tank with shield bash attacks',
                abilityName: 'Shield Bash',
                abilityDescription: 'Pushes enemies left and right away, dealing damage',
                color: 0x4169E1, // Royal blue color for shield theme
                sprite: 'shield-bufo',
                baseStats: {
                    // Core Stats
                    health: 150, // Increased HP for tank role
                    armor: 3, // Increased armor for defensive theme
                    healthRegen: 1.0, // Increased health regen
                    
                    // Ability Stats
                    abilityDamage: 1.2, // Base damage for shield bash
                    abilityCooldown: 800, // Milliseconds between shield bash
                    abilityRadius: 100, // Shield bash range
                    
                    // Utility Stats
                    pickupRange: 80, // XP orb magnetism range
                    projectileCount: 1, // Not used by Shield, but for consistency
                    
                    // Movement
                    moveSpeed: 3.5 // Slightly slower due to heavy shield
                }
            },
            WIZARD_BUFO: {
                id: 'wizard',
                name: 'Magician Bufo',
                description: 'Ranged caster with area damage spells',
                abilityName: 'Starfall',
                abilityDescription: 'Casts stars that damage enemies in an area',
                color: 0x0066ff,
                sprite: 'bufo-magician',
                baseStats: {
                    // Core Stats
                    health: 100,
                    armor: 0, // Glass cannon
                    healthRegen: 0,
                    
                                    // Ability Stats
                abilityDamage: 2, // Star damage (reduced from 3 to 2)
                abilityCooldown: 1500, // Milliseconds between starfall casts
                abilityRadius: 100, // AOE radius of star impact
                    
                    // Utility Stats
                    pickupRange: 100, // Higher pickup range for ranged character
                    projectileCount: 3, // Number of stars per cast (reduced from 5)
                    
                    // Movement
                    moveSpeed: 5
                }
            },
            BAT_BUFO: {
                id: 'bat',
                name: 'Bat Bufo',
                description: 'Agile fighter with boomerang attacks',
                abilityName: 'Boomerang Toss',
                abilityDescription: 'Throws a boomerang that damages and stuns enemies',
                color: 0x8B4513, // Brown color for bat theme
                sprite: 'bat-bufo',
                baseStats: {
                    // Core Stats (less tanky as requested)
                    health: 90, // Lower than others
                    armor: 0, // No armor for glass cannon feel
                    healthRegen: 0, // No health regen
                    
                    // Ability Stats
                    abilityDamage: 2.5, // Increased damage for boomerang
                    abilityCooldown: 2500, // Milliseconds between boomerang throws
                    abilityRadius: 200, // Increased boomerang travel distance
                    
                    // Utility Stats
                    pickupRange: 100, // Good pickup range for agile character
                    projectileCount: 1, // One boomerang
                    
                    // Movement (agile)
                    moveSpeed: 5.5 // Fastest character to compensate for low tankiness
                }
            }
        };
    }

    getCharacters() {
        return this.characters;
    }

    getSelectedCharacter() {
        return this.selectedCharacter;
    }

    setSelectedCharacter(character) {
        this.selectedCharacter = character;
        this.characterSelected = true;
    }

    isCharacterSelected() {
        return this.characterSelected;
    }

    setupCharacterAbilities() {
        if (!this.selectedCharacter) return;
        
        // Setup character-specific abilities
        if (this.selectedCharacter.id === 'shield') {
            this.setupShieldBash();
        } else if (this.selectedCharacter.id === 'wizard') {
            this.setupWizardStarfall();
        } else if (this.selectedCharacter.id === 'bat') {
            this.setupBatBoomerang();
        }
    }

    setupShieldBash() {
        // Setup shield bash timer for Shield Bufo
        const statsSystem = this.scene.statsSystem;
        if (this.scene.shieldBashTimer) {
            this.scene.shieldBashTimer.remove();
        }
        
        this.scene.shieldBashTimer = this.scene.time.addEvent({
            delay: statsSystem.getPlayerStats().abilityCooldown,
            callback: () => this.applyShieldBash(),
            callbackScope: this,
            loop: true
        });
        

    }

    setupWizardStarfall() {
        // Initialize wizard starfall system
        const statsSystem = this.scene.statsSystem;
        this.scene.starfallProjectiles = this.scene.add.group();
        this.scene.lastStarfallTime = 0;
        this.scene.starfallCooldown = statsSystem.getPlayerStats().abilityCooldown;
        

    }

    setupBatBoomerang() {
        // Initialize boomerang system
        this.scene.boomerangs = this.scene.add.group();
        this.scene.lastBoomerangTime = 0;
        this.scene.stunnedEnemies = new Set(); // Track stunned enemies
        

    }

    updateBatBoomerang() {
        const currentTime = this.scene.time.now;
        const statsSystem = this.scene.statsSystem;
        const boomerangCooldown = statsSystem.getPlayerStats().abilityCooldown;
        
        // Check if enough time has passed since last boomerang
        if (currentTime - this.scene.lastBoomerangTime < boomerangCooldown) {
            return;
        }
        
        // Throw boomerang if there are enemies nearby
        const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) return false;
            const distance = Phaser.Math.Distance.Between(
                this.scene.player.x, this.scene.player.y, enemy.x, enemy.y
            );
            return distance <= 200; // Only throw if enemies are reasonably close
        });
        
        if (nearbyEnemies.length > 0) {
            this.throwBoomerang();
            this.scene.lastBoomerangTime = currentTime;
        }
    }
    
    throwBoomerang() {
        const statsSystem = this.scene.statsSystem;
        const boomerangRange = statsSystem.getPlayerStats().abilityRadius;
        
        // Find target direction (closest enemy) - calculate ONCE at creation
        let targetAngle = 0; // Default direction (right)
        let closestDistance = Infinity;
        
        const enemies = this.scene.enemies.children.entries;
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        
        for (let i = 0, len = enemies.length; i < len; i++) {
            const enemy = enemies[i];
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) continue;
            
            const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                targetAngle = Phaser.Math.Angle.Between(playerX, playerY, enemy.x, enemy.y);
            }
        }
        
        // Create boomerang projectile (bigger and slower)
        const boomerang = this.scene.add.rectangle(this.scene.player.x, this.scene.player.y, 32, 16, 0x8B4513);
        boomerang.setStrokeStyle(3, 0xFFFFFF);
        
        // Add Matter.js physics
        this.scene.matter.add.gameObject(boomerang, {
            shape: 'circle',
            radius: 16, // Bigger hitbox to match visual
            isSensor: true,
            label: 'boomerang'
        });
        
        // Boomerang properties - FIXED angle that won't change
        boomerang.startX = this.scene.player.x;
        boomerang.startY = this.scene.player.y;
        boomerang.fixedAngle = targetAngle; // Store the fixed angle
        boomerang.maxDistance = boomerangRange;
        boomerang.currentDistance = 0;
        boomerang.speed = 3; // Reduced from 8 to 3 for better visibility
        boomerang.returning = false;
        boomerang.damage = statsSystem.getPlayerStats().abilityDamage;
        boomerang.hitEnemies = new Set(); // Track which enemies were already hit
        
        this.scene.boomerangs.add(boomerang);
    }

    applyShieldBash() {
        if (this.selectedCharacter.id !== 'shield' || !this.scene.player || !this.scene.enemies) {
            return;
        }
        
        const statsSystem = this.scene.statsSystem;
        const playerStats = statsSystem.getPlayerStats();
        const bashRange = playerStats.abilityRadius;
        const bashDamage = playerStats.abilityDamage;
        
        // Create visual effects for left and right shield bash
        const leftBashEffect = this.scene.add.rectangle(
            this.scene.player.x - bashRange/2, this.scene.player.y, 
            bashRange, 60, 0x4169E1, 0.4
        );
        const rightBashEffect = this.scene.add.rectangle(
            this.scene.player.x + bashRange/2, this.scene.player.y, 
            bashRange, 60, 0x4169E1, 0.4
        );
        
        this.scene.auraEffects.add(leftBashEffect);
        this.scene.auraEffects.add(rightBashEffect);
        
        // Fade out effects
        this.scene.tweens.add({
            targets: [leftBashEffect, rightBashEffect],
            alpha: 0,
            scaleY: 1.5,
            duration: 400,
            onComplete: () => {
                leftBashEffect.destroy();
                rightBashEffect.destroy();
            }
        });
        
        let enemiesHit = 0;
        
        // Find enemies within bash range - optimized for loop
        const enemies = this.scene.enemies.children.entries || [];
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        
        for (let i = 0, len = enemies.length; i < len; i++) {
            const enemy = enemies[i];
            
            // Enhanced safety checks
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) continue;
            if (typeof enemy.x !== 'number' || typeof enemy.y !== 'number') continue;
            if (typeof playerX !== 'number' || typeof playerY !== 'number') continue;
            
            const enemyX = enemy.x;
            const enemyY = enemy.y;
            
            // Simple distance check like original aura
            const distance = Phaser.Math.Distance.Between(playerX, playerY, enemyX, enemyY);
            
            if (distance <= bashRange) {
                enemiesHit++;
                
                // Deal damage with error handling
                try {
                    if (this.scene.enemySystem && typeof this.scene.enemySystem.damageEnemy === 'function') {
                        this.scene.enemySystem.damageEnemy(enemy, bashDamage);
                    }
                } catch (error) {
                    Logger.error('Shield bash damage error:', error);
                }
                
                // Apply horizontal knockback (push left/right based on position)
                const knockbackForce = 10; // Increased from 6 for more visible knockback
                const deltaX = enemyX - playerX;
                const deltaY = enemyY - playerY;
                
                // Apply knockback with error handling
                try {
                    if (enemy.body && this.scene.matter && this.scene.matter.body) {
                        // Calculate knockback direction - push enemies horizontally away from player
                        let knockbackX, knockbackY;
                        
                        // For horizontal shield bash, prioritize horizontal knockback
                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            // Enemy is more to the left or right - strong horizontal knockback
                            knockbackX = (deltaX > 0 ? 1 : -1) * knockbackForce;
                            knockbackY = -0.5; // Small upward component
                        } else {
                            // Enemy is more above/below - use radial knockback but bias horizontally
                            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                            if (distance > 0) {
                                knockbackX = (deltaX / distance) * knockbackForce;
                                knockbackY = (deltaY / distance) * knockbackForce * 0.5; // Reduce vertical knockback
                            } else {
                                knockbackX = knockbackForce; // Default to right if same position
                                knockbackY = 0;
                            }
                        }
                        
                        // Apply knockback velocity
                        this.scene.matter.body.setVelocity(enemy.body, {
                            x: knockbackX,
                            y: knockbackY
                        });
                        
                        // Mark enemy as being knocked back to prevent AI override
                        enemy.knockbackTime = this.scene.time.now + 300; // 300ms of knockback immunity
                    }
                } catch (error) {
                    Logger.error('Shield bash knockback error:', error);
                }
                
                // Visual feedback for hit enemy with error handling
                try {
                    if (enemy.active && enemy.scene && this.scene.tweens) {
                        this.scene.tweens.add({
                            targets: enemy,
                            scaleX: 1.3,
                            scaleY: 1.3,
                            duration: 150,
                            yoyo: true
                        });
                    }
                } catch (error) {
                    Logger.error('Shield bash visual feedback error:', error);
                }
            }
        }
    }

    updateCharacterAbilities() {
        if (!this.selectedCharacter) {
            return;
        }

        if (this.selectedCharacter.id === 'wizard') {
            this.updateWizardStarfall();
            this.updateStarfallProjectiles();
        } else if (this.selectedCharacter.id === 'bat' && this.scene.boomerangs) {
            this.updateBatBoomerang();
            this.updateBoomerangs();
            this.updateStunnedEnemies();
        }
    }

    updateWizardStarfall() {
        const currentTime = this.scene.time.now;
        if (currentTime - this.scene.lastStarfallTime < this.scene.starfallCooldown) {
            return;
        }
        
        // Find enemies in range - use camera bounds to target any visible enemies
        const camera = this.scene.cameras.main;
        const nearbyEnemies = this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) return false;
            
            // Check if enemy is within camera bounds (visible on screen)
            const enemyInCameraBounds = (
                enemy.x >= camera.scrollX - 50 &&
                enemy.x <= camera.scrollX + camera.width + 50 &&
                enemy.y >= camera.scrollY - 50 &&
                enemy.y <= camera.scrollY + camera.height + 50
            );
            
            return enemyInCameraBounds;
        });
        
        if (nearbyEnemies.length > 0) {
            // Cast starfall - create stars targeting random nearby enemies
            const statsSystem = this.scene.statsSystem;
            const starCount = Math.min(statsSystem.getPlayerStats().projectileCount, nearbyEnemies.length);
            for (let i = 0; i < starCount; i++) {
                const targetEnemy = Phaser.Utils.Array.GetRandom(nearbyEnemies);
                this.createStarfallProjectile(targetEnemy.x, targetEnemy.y);
            }
            this.scene.lastStarfallTime = currentTime;
        }
    }

    createStarfallProjectile(targetX, targetY) {
        // Start position high above the target
        const startX = targetX + Phaser.Math.Between(-50, 50);
        const startY = targetY - 300;
        
        // Create star projectile
        const star = this.scene.add.circle(startX, startY, 12, 0xFFD700);
        star.setStrokeStyle(2, 0xFFA500);
        
        // Add Matter.js physics to star
        this.scene.matter.add.gameObject(star, {
            shape: 'circle',
            isSensor: true,
            label: 'starfall'
        });
        
        // Calculate velocity to hit the target
        const dx = targetX - startX;
        const dy = targetY - startY;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude > 0) {
            const speed = 6.4;
            const velocityX = (dx / magnitude) * speed;
            const velocityY = (dy / magnitude) * speed;
            try {
                this.scene.matter.body.setVelocity(star.body, { x: velocityX, y: velocityY });
            } catch (error) {
                Logger.error('Star velocity error:', error);
            }
        }
        
        const statsSystem = this.scene.statsSystem;
        star.damage = statsSystem.getPlayerStats().abilityDamage;
        star.lifespan = 5000;
        star.birthTime = this.scene.time.now;
        star.targetX = targetX;
        star.targetY = targetY;
        star.hasImpacted = false;
        
        // Track position for movement detection
        star.lastPosition = { x: startX, y: startY };
        star.lastMoveTime = this.scene.time.now;
        
        this.scene.starfallProjectiles.add(star);
    }

    updateStarfallProjectiles() {
        if (!this.scene.starfallProjectiles) return;
        
        const currentTime = this.scene.time.now;
        const starCount = this.scene.starfallProjectiles.children.entries.length;
        

        
        for (let i = this.scene.starfallProjectiles.children.entries.length - 1; i >= 0; i--) {
            const star = this.scene.starfallProjectiles.children.entries[i];
            
            // Enhanced null checks for crash prevention
            if (!star || !star.active || star.hasImpacted || !star.scene) {
                // Clean up invalid stars
                try {
                    if (star && star.active && star.destroy) {
                        star.destroy();
                    }
                } catch (error) {
                    // Invalid star already cleaned up
                }
                continue;
            }
            
            // Additional safety checks for position properties
            if (typeof star.x !== 'number' || typeof star.y !== 'number') {
                try {
                    star.destroy();
                } catch (error) {
                    // Star with invalid position already cleaned up
                }
                continue;
            }
            
            // Check if star has required properties
            if (typeof star.birthTime !== 'number' || typeof star.targetX !== 'number' || typeof star.targetY !== 'number') {
                try {
                    star.destroy();
                } catch (error) {
                    // Star with missing properties already cleaned up
                }
                continue;
            }
            
            // Calculate elapsed time
            const fallTime = currentTime - star.birthTime;
            
            // MANDATORY cleanup after 3 seconds (no exceptions) - much more aggressive
            if (fallTime > 3000) {
                try {
                    this.applyStarfallAOE(star.x, star.y, star.damage);
                } catch (error) {
                    // Force-expired starfall AOE error handled silently
                }
                star.hasImpacted = true;
                star.destroy();
                continue;
            }

            // Check if star hasn't moved significantly in 1 second (much more aggressive)
            let hasntMoved = false;
            let movingVerySlowly = false;
            try {
                const distanceMoved = Phaser.Math.Distance.Between(
                    star.x, star.y, star.lastPosition.x, star.lastPosition.y
                );
                
                // If star moved more than 2 pixels, update last position and time (reduced threshold)
                if (distanceMoved > 2) {
                    star.lastPosition = { x: star.x, y: star.y };
                    star.lastMoveTime = currentTime;
                } else {
                    // Check if star hasn't moved for 1 second (reduced timeout)
                    hasntMoved = (currentTime - star.lastMoveTime) > 1000;
                }
                
                // Additional check: if star has been alive for 1.5+ seconds and moving very slowly
                if (fallTime > 1500) {
                    try {
                        const velocity = star.body && star.body.velocity ? 
                            Math.sqrt(star.body.velocity.x * star.body.velocity.x + star.body.velocity.y * star.body.velocity.y) : 0;
                        movingVerySlowly = velocity < 1.0; // Very slow movement after 1.5 seconds
                    } catch (velocityError) {
                        movingVerySlowly = true; // Assume slow if can't check
                    }
                }
            } catch (error) {
                hasntMoved = true; // Treat as stuck if we can't check movement
            }
            
            // Simple target detection with reasonable radius
            let targetReached = false;
            try {
                const distanceToTarget = Phaser.Math.Distance.Between(
                    star.x, star.y, star.targetX, star.targetY
                );
                targetReached = distanceToTarget < 50; // Reasonable target detection
            } catch (error) {
                targetReached = false;
            }
            
            // Simple ground detection
            let hitGround = false;
            let nearGround = false;
            try {
                const mapHeight = this.scene.map.heightInPixels || 2400;
                hitGround = star.y > mapHeight - 50; // Hit actual ground
                nearGround = star.y > mapHeight - 150; // Getting close to ground
            } catch (error) {
                // Ground checking error handled silently
            }
            
            // Much more aggressive timeout
            const tooOld = fallTime > 3000; // 3 seconds max - no orb should live longer
            
            // Aggressive cleanup conditions - prioritize cleaning up lingering orbs
            if (targetReached || hitGround || nearGround || tooOld || hasntMoved || movingVerySlowly) {
                // Capture star details BEFORE destruction for logging
                const starDetails = {
                    x: star.x,
                    y: star.y,
                    targetX: star.targetX,
                    targetY: star.targetY,
                    age: fallTime
                };
                
                // Star should explode - trigger AOE explosion
                try {
                    this.applyStarfallAOE(star.x, star.y, star.damage);
                } catch (error) {
                    // Starfall AOE error handled silently
                }
                star.hasImpacted = true;
                star.destroy();
            }
        }
    }

    applyStarfallAOE(impactX, impactY, damage) {
        const statsSystem = this.scene.statsSystem;
        const aoeRadius = statsSystem.getPlayerStats().abilityRadius;
        
        // Create visual AOE effect
        const aoeEffect = this.scene.add.circle(impactX, impactY, aoeRadius, 0xFFD700, 0.3);
        aoeEffect.setStrokeStyle(3, 0xFFA500, 0.8);
        this.scene.auraEffects.add(aoeEffect);
        
        // Fade out effect
        this.scene.tweens.add({
            targets: aoeEffect,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => aoeEffect.destroy()
        });
        
        // Find all enemies within AOE radius and damage them - optimized for loop
        const enemies = this.scene.enemies.children.entries;
        for (let i = 0, len = enemies.length; i < len; i++) {
            const enemy = enemies[i];
            if (!enemy || !enemy.active || !enemy.body || !enemy.scene) continue;
            
            const distance = Phaser.Math.Distance.Between(impactX, impactY, enemy.x, enemy.y);
            if (distance <= aoeRadius) {
                // Deal damage
                this.scene.enemySystem.damageEnemy(enemy, damage);
            }
        }
    }



    updateBoomerangs() {
        if (!this.scene.boomerangs || !this.scene.player) return;
        
        const boomerangs = this.scene.boomerangs.children.entries;
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        
        for (let i = 0, len = boomerangs.length; i < len; i++) {
            const boomerang = boomerangs[i];
            
            // Fast validation checks
            if (!boomerang || !boomerang.active || !boomerang.scene) continue;
            
            try {
                // Rotate boomerang for visual effect
                boomerang.rotation += 0.3;
                
                if (!boomerang.returning) {
                    // Outward flight - use FIXED angle
                    const moveX = Math.cos(boomerang.fixedAngle) * boomerang.speed;
                    const moveY = Math.sin(boomerang.fixedAngle) * boomerang.speed;
                    
                    boomerang.x += moveX;
                    boomerang.y += moveY;
                    boomerang.currentDistance += boomerang.speed;
                    
                    // Update physics body position to match visual
                    if (boomerang.body) {
                        try {
                            this.scene.matter.body.setPosition(boomerang.body, { x: boomerang.x, y: boomerang.y });
                        } catch (error) {
                            // Silently handle physics errors
                        }
                    }
                    
                    // Check if reached max distance
                    if (boomerang.currentDistance >= boomerang.maxDistance) {
                        boomerang.returning = true;
                    }
                } else {
                    // Return flight - move towards player
                    const angleToPlayer = Phaser.Math.Angle.Between(boomerang.x, boomerang.y, playerX, playerY);
                    
                    const moveX = Math.cos(angleToPlayer) * boomerang.speed;
                    const moveY = Math.sin(angleToPlayer) * boomerang.speed;
                    
                    boomerang.x += moveX;
                    boomerang.y += moveY;
                    
                    // Update physics body position to match visual
                    if (boomerang.body) {
                        try {
                            this.scene.matter.body.setPosition(boomerang.body, { x: boomerang.x, y: boomerang.y });
                        } catch (error) {
                            // Silently handle physics errors
                        }
                    }
                    
                    // Check if returned to player
                    const distanceToPlayer = Phaser.Math.Distance.Between(boomerang.x, boomerang.y, playerX, playerY);
                    
                    if (distanceToPlayer < 32) { // Increased catch radius
                        // Boomerang caught by player
                        boomerang.destroy();
                        continue;
                    }
                }
                
            } catch (error) {
                Logger.error('Boomerang update error:', error);
            }
        }
    }
    
    updateStunnedEnemies() {
        if (!this.scene.stunnedEnemies) return;
        
        const currentTime = this.scene.time.now;
        // Use Set iterator for better performance with Set.delete()
        for (const enemy of this.scene.stunnedEnemies) {
            if (!enemy || !enemy.active || !enemy.scene || currentTime > enemy.stunEndTime) {
                // Remove stun effect
                if (enemy.clearTint) {
                    enemy.clearTint();
                }
                this.scene.stunnedEnemies.delete(enemy);
            }
        }
    }

    starfallHitEnemy(starfall, enemy) {
        try {
            // Safety checks
            if (!this.selectedCharacter || this.selectedCharacter.id !== 'wizard') {
                return;
            }
            if (!starfall || !enemy || !starfall.active || !enemy.active) {
                return;
            }
            if (starfall.hasImpacted) {
                return;
            }
            
            // Mark starfall as impacted to prevent double explosions
            starfall.hasImpacted = true;
            
            // Trigger immediate AOE explosion at collision point
            this.applyStarfallAOE(starfall.x, starfall.y, starfall.damage);
            
            // Destroy the starfall projectile
            starfall.destroy();
            
        } catch (error) {
            Logger.error('Starfall hit enemy error:', error);
        }
    }

    boomerangHitEnemy(boomerang, enemy) {
        try {
            // Comprehensive null/undefined checks BEFORE accessing any properties
            if (!boomerang || !enemy) {
                return;
            }
            
            // Check if objects have the expected structure
            if (typeof boomerang !== 'object' || typeof enemy !== 'object') {
                return;
            }
            
            // Enhanced safety checks with property existence verification
            if (!this.selectedCharacter || this.selectedCharacter.id !== 'bat') {
                return; // Silently ignore if not bat character
            }
            
            // Check active state safely
            if (!boomerang.hasOwnProperty('active') || !enemy.hasOwnProperty('active') || 
                !boomerang.active || !enemy.active) {
                return; // Objects are being destroyed
            }
            
            // Check scene references safely
            if (!enemy.hasOwnProperty('scene') || !boomerang.hasOwnProperty('scene') || 
                !enemy.scene || !boomerang.scene) {
                return; // Objects removed from scene
            }
            
            // Check body existence safely (enemy.body is critical for physics)
            if (!enemy.hasOwnProperty('body') || !enemy.body) {
                return; // Enemy physics body destroyed
            }
            
            // Check position properties exist and are valid numbers
            if (!enemy.hasOwnProperty('x') || !enemy.hasOwnProperty('y') ||
                typeof enemy.x !== 'number' || typeof enemy.y !== 'number' ||
                !isFinite(enemy.x) || !isFinite(enemy.y)) {
                return; // Invalid enemy position
            }
            
            if (!boomerang.hasOwnProperty('x') || !boomerang.hasOwnProperty('y') ||
                typeof boomerang.x !== 'number' || typeof boomerang.y !== 'number' ||
                !isFinite(boomerang.x) || !isFinite(boomerang.y)) {
                return; // Invalid boomerang position
            }
            
            // Check if this enemy was already hit by this boomerang
            if (boomerang.hitEnemies && boomerang.hitEnemies.has(enemy)) {
                return; // Already hit
            }
            
            // Mark this enemy as hit by this boomerang
            if (!boomerang.hitEnemies) {
                boomerang.hitEnemies = new Set();
            }
            boomerang.hitEnemies.add(enemy);
            
            // Deal damage
            if (this.scene.enemySystem && typeof this.scene.enemySystem.damageEnemy === 'function') {
                this.scene.enemySystem.damageEnemy(enemy, boomerang.damage || 1);
            }
            
            // Apply stun effect (1 second)
            const currentTime = this.scene.time.now;
            enemy.stunEndTime = currentTime + 1000; // 1 second stun
            if (this.scene.stunnedEnemies) {
                this.scene.stunnedEnemies.add(enemy);
            }
            
            // Visual stun effect (blue tint)
            if (enemy.setTint && typeof enemy.setTint === 'function') {
                enemy.setTint(0x0080FF);
            }
            
            // Light knockback with safe angle calculation
            try {
                const angle = Phaser.Math.Angle.Between(boomerang.x, boomerang.y, enemy.x, enemy.y);
                if (enemy.body && this.scene.matter && this.scene.matter.body && isFinite(angle)) {
                    this.scene.matter.body.setVelocity(enemy.body, {
                        x: Math.cos(angle) * 2,
                        y: Math.sin(angle) * 2
                    });
                }
            } catch (knockbackError) {
                // Silently ignore knockback errors
            }
            
        } catch (error) {
            Logger.error('Boomerang hit enemy error:', error);
        }
    }
}

export default CharacterSystem; 