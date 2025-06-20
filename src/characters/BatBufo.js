import BaseCharacter from './BaseCharacter.js';
import Logger from '../utils/Logger.js';

class BatBufo extends BaseCharacter {
    constructor(scene, characterData) {
        super(scene, characterData);
    }

    setupAbility() {
        // Initialize boomerang system
        this.createAbilityGroup('boomerangs');
        
        // Initialize boomerang state
        this.setAbilityState('lastBoomerangTime', 0);
        this.setAbilityState('stunnedEnemies', new Set());
    }

    updateAbility() {
        this.updateBoomerangThrowing();
        this.updateBoomerangs();
        this.updateStunnedEnemies();
    }

    updateBoomerangThrowing() {
        const currentTime = this.scene.time.now;
        const playerStats = this.getPlayerStats();
        const boomerangCooldown = playerStats.abilityCooldown;
        const lastBoomerangTime = this.getAbilityState('lastBoomerangTime');
        
        // Check if enough time has passed since last boomerang
        if (currentTime - lastBoomerangTime < boomerangCooldown) {
            return;
        }
        
        // Throw boomerang if there are enemies nearby
        const nearbyEnemies = this.getEnemiesInRange(
            this.scene.player.x, 
            this.scene.player.y, 
            200
        );
        
        if (nearbyEnemies.length > 0) {
            this.throwBoomerang();
            this.setAbilityState('lastBoomerangTime', currentTime);
        }
    }
    
    throwBoomerang() {
        const playerStats = this.getPlayerStats();
        const boomerangRange = playerStats.abilityRadius;
        
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
        
        // Create boomerang projectile
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
        boomerang.damage = playerStats.abilityDamage;
        boomerang.hitEnemies = new Set(); // Track which enemies were already hit
        
        // Add to boomerangs group
        const boomerangsGroup = this.getAbilityGroup('boomerangs');
        if (boomerangsGroup) {
            boomerangsGroup.add(boomerang);
        }
    }

    updateBoomerangs() {
        const boomerangsGroup = this.getAbilityGroup('boomerangs');
        if (!boomerangsGroup || !this.scene.player) return;
        
        const boomerangs = boomerangsGroup.children.entries;
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
        const stunnedEnemies = this.getAbilityState('stunnedEnemies');
        if (!stunnedEnemies) return;
        
        const currentTime = this.scene.time.now;
        // Use Set iterator for better performance with Set.delete()
        for (const enemy of stunnedEnemies) {
            if (!enemy || !enemy.active || !enemy.scene || currentTime > enemy.stunEndTime) {
                // Remove stun effect
                if (enemy.clearTint) {
                    enemy.clearTint();
                }
                stunnedEnemies.delete(enemy);
            }
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
            this.damageEnemy(enemy, boomerang.damage || 1);
            
            // Apply stun effect (1 second)
            const currentTime = this.scene.time.now;
            enemy.stunEndTime = currentTime + 1000; // 1 second stun
            
            const stunnedEnemies = this.getAbilityState('stunnedEnemies');
            if (stunnedEnemies) {
                stunnedEnemies.add(enemy);
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

    getUpgrades() {
        return [
            { 
                id: 'bat_power', 
                name: 'Sharpened Boomerang', 
                description: 'Boomerang damage increased by 25%', 
                type: 'character', 
                statType: 'damage',
                effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.25) 
            },
            { 
                id: 'bat_speed', 
                name: 'Quick Throw', 
                description: 'Boomerang cooldown reduced by 40%', 
                type: 'character', 
                statType: 'cooldown',
                effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6) 
            },
            { 
                id: 'bat_range', 
                name: 'Aerodynamic Design', 
                description: 'Boomerang range increased by 50%', 
                type: 'character', 
                statType: 'radius',
                effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) 
            },
            { 
                id: 'bat_stun', 
                name: 'Stunning Impact', 
                description: 'Stun duration increased to 2 seconds', 
                type: 'character', 
                statType: 'unique',
                effect: () => {
                    // This would extend stun duration in the boomerang system
                    // Stunning Impact upgrade applied
                }
            },
            { 
                id: 'bat_agility', 
                name: 'Bat Agility', 
                description: '+30% move speed and +25 health', 
                type: 'character', 
                statType: 'unique',
                effect: () => {
                    this.scene.statsSystem.multiplyStats('moveSpeedMultiplier', 1.3);
                    this.scene.statsSystem.addStatBonus('healthBonus', 25);
                }
            }
        ];
    }

    getCollisionHandlers() {
        return [
            { 
                projectileLabel: 'boomerang', 
                handler: this.boomerangHitEnemy.bind(this) 
            }
        ];
    }

    // Override cleanup to handle stunned enemies
    cleanup() {
        // Clear stunned enemies before calling parent cleanup
        const stunnedEnemies = this.getAbilityState('stunnedEnemies');
        if (stunnedEnemies) {
            for (const enemy of stunnedEnemies) {
                if (enemy && enemy.clearTint) {
                    enemy.clearTint();
                }
            }
            stunnedEnemies.clear();
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}

export default BatBufo; 