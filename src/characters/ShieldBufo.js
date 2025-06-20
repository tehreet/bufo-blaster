import BaseCharacter from './BaseCharacter.js';
import Logger from '../utils/Logger.js';

class ShieldBufo extends BaseCharacter {
    constructor(scene, characterData) {
        super(scene, characterData);
    }

    setupAbility() {
        // Remove any existing shield bash timer
        this.removeAbilityTimer('shieldBash');
        
        // Setup shield bash timer
        const playerStats = this.getPlayerStats();
        this.createAbilityTimer('shieldBash', {
            delay: playerStats.abilityCooldown,
            callback: () => this.executeShieldBash(),
            callbackScope: this,
            loop: true
        });
    }

    updateAbility() {
        // Shield Bufo's ability is timer-based, no continuous updates needed
        // The shield bash executes automatically via timer
    }

    executeShieldBash() {
        if (!this.scene.player || !this.scene.enemies) {
            return;
        }
        
        const playerStats = this.getPlayerStats();
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
        
        if (this.scene.auraEffects) {
            this.scene.auraEffects.add(leftBashEffect);
            this.scene.auraEffects.add(rightBashEffect);
        }
        
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
        
        // Find and damage enemies within bash range
        const enemiesInRange = this.getEnemiesInRange(
            this.scene.player.x, 
            this.scene.player.y, 
            bashRange
        );
        
        enemiesInRange.forEach(enemy => {
            try {
                // Deal damage
                this.damageEnemy(enemy, bashDamage);
                
                // Apply horizontal knockback
                this.applyKnockback(enemy);
                
                // Visual feedback for hit enemy
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
                Logger.error('Shield bash enemy hit error:', error);
            }
        });
    }

    applyKnockback(enemy) {
        const knockbackForce = 10;
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const deltaX = enemy.x - playerX;
        const deltaY = enemy.y - playerY;
        
        try {
            if (enemy.body && this.scene.matter && this.scene.matter.body) {
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
    }

    getUpgrades() {
        return [
            { 
                id: 'shield_bash_power', 
                name: 'Shield Slam', 
                description: 'Shield bash damage increased by 25%', 
                type: 'character', 
                statType: 'damage',
                effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.25) 
            },
            { 
                id: 'shield_bash_speed', 
                name: 'Rapid Bash', 
                description: 'Shield bash triggers 40% faster', 
                type: 'character', 
                statType: 'cooldown',
                effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6) 
            },
            { 
                id: 'shield_bash_range', 
                name: 'Shield Sweep', 
                description: 'Shield bash range increased by 50%', 
                type: 'character', 
                statType: 'radius',
                effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) 
            },
            { 
                id: 'shield_fortress', 
                name: 'Fortress Form', 
                description: '+60 Health and +3 Armor', 
                type: 'character', 
                statType: 'unique',
                effect: () => { 
                    this.scene.statsSystem.addStatBonus('healthBonus', 60);
                    this.scene.statsSystem.addStatBonus('armorBonus', 3);
                }
            },
            { 
                id: 'shield_regeneration', 
                name: 'Shield Blessing', 
                description: 'Health regeneration doubled', 
                type: 'character', 
                statType: 'regen',
                effect: () => this.scene.statsSystem.multiplyStats('healthRegenMultiplier', 2.0) 
            }
        ];
    }

    // Shield Bufo doesn't have projectiles that need collision detection
    getCollisionHandlers() {
        return [];
    }
}

export default ShieldBufo; 