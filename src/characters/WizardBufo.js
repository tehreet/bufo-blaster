import BaseCharacter from './BaseCharacter.js';
import Logger from '../utils/Logger.js';

class WizardBufo extends BaseCharacter {
    constructor(scene, characterData) {
        super(scene, characterData);
    }

    setupAbility() {
        // Initialize starfall system
        const playerStats = this.getPlayerStats();
        
        // Create projectiles group
        this.createAbilityGroup('starfall');
        
        // Initialize starfall state
        this.setAbilityState('lastStarfallTime', 0);
        this.setAbilityState('starfallCooldown', playerStats.abilityCooldown);
    }

    updateAbility() {
        this.updateStarfallCasting();
        this.updateStarfallProjectiles();
    }

    updateStarfallCasting() {
        const currentTime = this.scene.time.now;
        const lastStarfallTime = this.getAbilityState('lastStarfallTime');
        const starfallCooldown = this.getAbilityState('starfallCooldown');
        
        if (currentTime - lastStarfallTime < starfallCooldown) {
            return;
        }
        
        // Find visible enemies to target
        const visibleEnemies = this.getVisibleEnemies();
        
        if (visibleEnemies.length > 0) {
            // Cast starfall - create stars targeting random visible enemies
            const playerStats = this.getPlayerStats();
            const starCount = Math.min(playerStats.projectileCount, visibleEnemies.length);
            
            for (let i = 0; i < starCount; i++) {
                const targetEnemy = Phaser.Utils.Array.GetRandom(visibleEnemies);
                this.createStarfallProjectile(targetEnemy.x, targetEnemy.y);
            }
            
            this.setAbilityState('lastStarfallTime', currentTime);
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
        
        const playerStats = this.getPlayerStats();
        star.damage = playerStats.abilityDamage;
        star.lifespan = 5000;
        star.birthTime = this.scene.time.now;
        star.targetX = targetX;
        star.targetY = targetY;
        star.hasImpacted = false;
        
        // Track position for movement detection
        star.lastPosition = { x: startX, y: startY };
        star.lastMoveTime = this.scene.time.now;
        
        // Add to starfall group
        const starfallGroup = this.getAbilityGroup('starfall');
        if (starfallGroup) {
            starfallGroup.add(star);
        }
    }

    updateStarfallProjectiles() {
        const starfallGroup = this.getAbilityGroup('starfall');
        if (!starfallGroup) return;
        
        const currentTime = this.scene.time.now;
        const stars = starfallGroup.children.entries;
        
        for (let i = stars.length - 1; i >= 0; i--) {
            const star = stars[i];
            
            // Enhanced null checks for crash prevention
            if (!star || !star.active || star.hasImpacted || !star.scene) {
                this.destroyStar(star);
                continue;
            }
            
            // Additional safety checks for position properties
            if (typeof star.x !== 'number' || typeof star.y !== 'number') {
                this.destroyStar(star);
                continue;
            }
            
            // Check if star has required properties
            if (typeof star.birthTime !== 'number' || typeof star.targetX !== 'number' || typeof star.targetY !== 'number') {
                this.destroyStar(star);
                continue;
            }
            
            // Calculate elapsed time
            const fallTime = currentTime - star.birthTime;
            
            // MANDATORY cleanup after 3 seconds (no exceptions)
            if (fallTime > 3000) {
                this.triggerStarfallExplosion(star.x, star.y, star.damage);
                this.destroyStar(star);
                continue;
            }

            // Check movement and impact conditions
            const shouldExplode = this.checkStarImpactConditions(star, currentTime, fallTime);
            
            if (shouldExplode) {
                this.triggerStarfallExplosion(star.x, star.y, star.damage);
                this.destroyStar(star);
            }
        }
    }

    checkStarImpactConditions(star, currentTime, fallTime) {
        // Check if star hasn't moved significantly in 1 second
        let hasntMoved = false;
        let movingVerySlowly = false;
        
        try {
            const distanceMoved = Phaser.Math.Distance.Between(
                star.x, star.y, star.lastPosition.x, star.lastPosition.y
            );
            
            // If star moved more than 2 pixels, update last position and time
            if (distanceMoved > 2) {
                star.lastPosition = { x: star.x, y: star.y };
                star.lastMoveTime = currentTime;
            } else {
                // Check if star hasn't moved for 1 second
                hasntMoved = (currentTime - star.lastMoveTime) > 1000;
            }
            
            // Additional check: if star has been alive for 1.5+ seconds and moving very slowly
            if (fallTime > 1500) {
                try {
                    const velocity = star.body && star.body.velocity ? 
                        Math.sqrt(star.body.velocity.x * star.body.velocity.x + star.body.velocity.y * star.body.velocity.y) : 0;
                    movingVerySlowly = velocity < 1.0;
                } catch (velocityError) {
                    movingVerySlowly = true;
                }
            }
        } catch (error) {
            hasntMoved = true;
        }
        
        // Target detection
        let targetReached = false;
        try {
            const distanceToTarget = Phaser.Math.Distance.Between(
                star.x, star.y, star.targetX, star.targetY
            );
            targetReached = distanceToTarget < 50;
        } catch (error) {
            targetReached = false;
        }
        
        // Ground detection
        let hitGround = false;
        let nearGround = false;
        try {
            const mapHeight = this.scene.map.heightInPixels || 2400;
            hitGround = star.y > mapHeight - 50;
            nearGround = star.y > mapHeight - 150;
        } catch (error) {
            // Ground checking error handled silently
        }
        
        const tooOld = fallTime > 3000;
        
        return targetReached || hitGround || nearGround || tooOld || hasntMoved || movingVerySlowly;
    }

    triggerStarfallExplosion(impactX, impactY, damage) {
        const playerStats = this.getPlayerStats();
        const aoeRadius = playerStats.abilityRadius;
        
        // Create visual AOE effect
        this.createVisualEffect(impactX, impactY, {
            radius: aoeRadius,
            color: 0xFFD700,
            alpha: 0.3,
            stroke: { width: 3, color: 0xFFA500 },
            endScale: 1.5,
            duration: 500
        });
        
        // Find all enemies within AOE radius and damage them
        const enemiesInRange = this.getEnemiesInRange(impactX, impactY, aoeRadius);
        enemiesInRange.forEach(enemy => {
            this.damageEnemy(enemy, damage);
        });
    }

    destroyStar(star) {
        try {
            if (star && star.active && star.destroy) {
                star.hasImpacted = true;
                star.destroy();
            }
        } catch (error) {
            // Star already destroyed
        }
    }

    starfallHitEnemy(starfall, enemy) {
        try {
            // Safety checks
            if (!starfall || !enemy || !starfall.active || !enemy.active) {
                return;
            }
            if (starfall.hasImpacted) {
                return;
            }
            
            // Mark starfall as impacted to prevent double explosions
            starfall.hasImpacted = true;
            
            // Trigger immediate AOE explosion at collision point
            this.triggerStarfallExplosion(starfall.x, starfall.y, starfall.damage);
            
            // Destroy the starfall projectile
            this.destroyStar(starfall);
            
        } catch (error) {
            Logger.error('Starfall hit enemy error:', error);
        }
    }

    getUpgrades() {
        return [
            { 
                id: 'wizard_more_stars', 
                name: 'Meteor Shower', 
                description: '+1 star per cast', 
                type: 'character', 
                statType: 'unique',
                effect: () => this.scene.statsSystem.addStatBonus('projectileCountBonus', 1) 
            },
            { 
                id: 'wizard_star_power', 
                name: 'Stellar Power', 
                description: 'Star damage increased by 18.75%', 
                type: 'character', 
                statType: 'damage',
                effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.1875) 
            },
            { 
                id: 'wizard_star_size', 
                name: 'Greater Impact', 
                description: 'Star explosion radius increased by 50%', 
                type: 'character', 
                statType: 'radius',
                effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) 
            },
            { 
                id: 'wizard_rapid_cast', 
                name: 'Arcane Haste', 
                description: 'Starfall cooldown reduced by 40%', 
                type: 'character', 
                statType: 'cooldown',
                effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6) 
            }
        ];
    }

    getCollisionHandlers() {
        return [
            { 
                projectileLabel: 'starfall', 
                handler: this.starfallHitEnemy.bind(this) 
            }
        ];
    }
}

export default WizardBufo; 