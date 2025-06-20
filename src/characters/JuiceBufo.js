import BaseCharacter from './BaseCharacter.js';
import Logger from '../utils/Logger.js';

class JuiceBufo extends BaseCharacter {
    constructor(scene, characterData) {
        super(scene, characterData);
    }

    setupAbility() {
        // Create juice boxes and puddles groups
        this.createAbilityGroup('juiceBoxes');
        this.createAbilityGroup('juicePuddles');
        
        // Initialize juice throwing state
        this.setAbilityState('lastJuiceTime', 0);
        this.setAbilityState('activePuddles', new Map()); // Track puddles and their timers
    }

    updateAbility() {
        this.updateJuiceThrowing();
        this.updateJuiceBoxes();
        this.updateJuicePuddles();
    }

    updateJuiceThrowing() {
        const currentTime = this.scene.time.now;
        const playerStats = this.getPlayerStats();
        const lastJuiceTime = this.getAbilityState('lastJuiceTime');
        
        // Check cooldown
        if (currentTime - lastJuiceTime < playerStats.abilityCooldown) {
            return;
        }
        
        // Get nearby enemies to target areas
        const nearbyEnemies = this.getVisibleEnemies();
        
        if (nearbyEnemies.length > 0) {
            this.throwJuiceBoxes();
            this.setAbilityState('lastJuiceTime', currentTime);
        }
    }

    throwJuiceBoxes() {
        const playerStats = this.getPlayerStats();
        const juiceBoxCount = playerStats.projectileCount;
        
        // Throw juice boxes in different directions around the player
        for (let i = 0; i < juiceBoxCount; i++) {
            // Calculate spread angle
            const baseAngle = (Math.PI * 2 * i) / juiceBoxCount;
            const angleVariation = Phaser.Math.FloatBetween(-0.3, 0.3); // Add some randomness
            const throwAngle = baseAngle + angleVariation;
            
            // Calculate target position
            const throwDistance = Phaser.Math.Between(80, 150);
            const targetX = this.scene.player.x + Math.cos(throwAngle) * throwDistance;
            const targetY = this.scene.player.y + Math.sin(throwAngle) * throwDistance;
            
            this.createJuiceBox(targetX, targetY);
        }
    }

    createJuiceBox(targetX, targetY) {
        // Create juice box projectile (small purple/orange rectangle)
        const juiceBox = this.scene.add.rectangle(
            this.scene.player.x, 
            this.scene.player.y, 
            16, 20, 0xFF6B35 // Orange color
        );
        juiceBox.setStrokeStyle(2, 0x8B4513); // Brown outline
        
        // Add physics for collision detection
        this.scene.matter.add.gameObject(juiceBox, {
            shape: 'circle',
            radius: 8,
            isSensor: true,
            label: 'juiceBox'
        });
        
        // Juice box properties
        const playerStats = this.getPlayerStats();
        juiceBox.damage = playerStats.abilityDamage;
        juiceBox.targetX = targetX;
        juiceBox.targetY = targetY;
        juiceBox.birthTime = this.scene.time.now;
        juiceBox.speed = 4; // Moderate throwing speed
        
        // Calculate trajectory
        const dx = targetX - this.scene.player.x;
        const dy = targetY - this.scene.player.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude > 0) {
            const velocityX = (dx / magnitude) * juiceBox.speed;
            const velocityY = (dy / magnitude) * juiceBox.speed;
            
            try {
                this.scene.matter.body.setVelocity(juiceBox.body, { x: velocityX, y: velocityY });
            } catch (error) {
                Logger.error('Juice box velocity error:', error);
            }
        }
        
        // Add to juice boxes group
        const juiceBoxesGroup = this.getAbilityGroup('juiceBoxes');
        if (juiceBoxesGroup) {
            juiceBoxesGroup.add(juiceBox);
        }
    }

    updateJuiceBoxes() {
        const juiceBoxesGroup = this.getAbilityGroup('juiceBoxes');
        if (!juiceBoxesGroup) return;
        
        const currentTime = this.scene.time.now;
        const juiceBoxes = juiceBoxesGroup.children.entries;
        
        for (let i = juiceBoxes.length - 1; i >= 0; i--) {
            const juiceBox = juiceBoxes[i];
            
            if (!juiceBox || !juiceBox.active || !juiceBox.scene) {
                continue;
            }
            
            // Check if juice box reached target or timed out
            const travelTime = currentTime - juiceBox.birthTime;
            const distanceToTarget = Phaser.Math.Distance.Between(
                juiceBox.x, juiceBox.y, juiceBox.targetX, juiceBox.targetY
            );
            
            // Land the juice box if close to target or after 2 seconds
            if (distanceToTarget < 20 || travelTime > 2000) {
                this.landJuiceBox(juiceBox);
            }
        }
    }

    landJuiceBox(juiceBox) {
        const playerStats = this.getPlayerStats();
        const puddleRadius = playerStats.abilityRadius;
        
        // Create juice puddle at landing location
        const puddle = this.scene.add.circle(juiceBox.x, juiceBox.y, puddleRadius, 0xFF6B35, 0.4);
        puddle.setStrokeStyle(2, 0x8B4513, 0.8);
        
        // Add physics for puddle area detection
        this.scene.matter.add.gameObject(puddle, {
            shape: 'circle',
            radius: puddleRadius,
            isSensor: true,
            label: 'juicePuddle',
            isStatic: true // Puddles don't move
        });
        
        // Puddle properties
        puddle.damage = juiceBox.damage * 0.5; // Puddle does less damage than direct hit
        puddle.slowAmount = 0.5; // 50% movement speed reduction
        puddle.birthTime = this.scene.time.now;
        puddle.duration = 8000; // Puddle lasts 8 seconds
        puddle.lastDamageTime = 0;
        puddle.damageInterval = 1000; // Damage every 1 second
        puddle.affectedEnemies = new Set(); // Track enemies in puddle
        
        // Add to puddles group
        const puddlesGroup = this.getAbilityGroup('juicePuddles');
        if (puddlesGroup) {
            puddlesGroup.add(puddle);
        }
        
        // Splash effect
        this.createVisualEffect(juiceBox.x, juiceBox.y, {
            radius: 20,
            color: 0xFF6B35,
            alpha: 0.7,
            stroke: { width: 3, color: 0x8B4513 },
            duration: 400
        });
        
        // Remove the juice box
        juiceBox.destroy();
    }

    updateJuicePuddles() {
        const puddlesGroup = this.getAbilityGroup('juicePuddles');
        if (!puddlesGroup) return;
        
        const currentTime = this.scene.time.now;
        const puddles = puddlesGroup.children.entries;
        
        for (let i = puddles.length - 1; i >= 0; i--) {
            const puddle = puddles[i];
            
            if (!puddle || !puddle.active || !puddle.scene) {
                continue;
            }
            
            // Check if puddle expired
            if (currentTime - puddle.birthTime > puddle.duration) {
                this.cleanupPuddle(puddle);
                continue;
            }
            
            // Apply puddle effects to enemies
            this.applyPuddleEffects(puddle, currentTime);
            
            // Visual pulsing effect for active puddles
            if (currentTime % 500 < 250) { // Pulse every half second
                puddle.setAlpha(0.6);
            } else {
                puddle.setAlpha(0.4);
            }
        }
    }

    applyPuddleEffects(puddle, currentTime) {
        // Find enemies within puddle radius
        const enemiesInPuddle = this.getEnemiesInRange(puddle.x, puddle.y, puddle.radius);
        
        // Track which enemies are currently in this puddle
        const currentlyAffected = new Set();
        
        enemiesInPuddle.forEach(enemy => {
            currentlyAffected.add(enemy);
            
            // Apply slow effect (reduce enemy speed)
            if (!enemy.isSlowed) {
                enemy.originalSpeed = enemy.speed;
                enemy.speed = enemy.originalSpeed * puddle.slowAmount;
                enemy.isSlowed = true;
                
                // Visual slow effect (darker tint)
                if (enemy.setTint) {
                    enemy.setTint(0x996633); // Brown tint for slowed
                }
            }
            
            // Apply damage over time
            if (currentTime - puddle.lastDamageTime >= puddle.damageInterval) {
                this.damageEnemy(enemy, puddle.damage);
                puddle.lastDamageTime = currentTime;
            }
        });
        
        // Remove slow effect from enemies that left the puddle
        puddle.affectedEnemies.forEach(enemy => {
            if (!currentlyAffected.has(enemy) && enemy.isSlowed) {
                this.removeSlowEffect(enemy);
            }
        });
        
        // Update affected enemies list
        puddle.affectedEnemies = currentlyAffected;
    }

    removeSlowEffect(enemy) {
        if (enemy && enemy.isSlowed) {
            enemy.speed = enemy.originalSpeed || enemy.speed / 0.5; // Restore original speed
            enemy.isSlowed = false;
            delete enemy.originalSpeed;
            
            // Remove visual tint
            if (enemy.clearTint) {
                enemy.clearTint();
            }
        }
    }

    cleanupPuddle(puddle) {
        // Remove slow effects from all affected enemies
        if (puddle.affectedEnemies) {
            puddle.affectedEnemies.forEach(enemy => {
                this.removeSlowEffect(enemy);
            });
        }
        
        // Destroy the puddle
        puddle.destroy();
    }

    juiceBoxHitEnemy(juiceBox, enemy) {
        // Direct hit with juice box before it lands
        try {
            if (!juiceBox || !enemy || !juiceBox.active || !enemy.active) {
                return;
            }
            
            // Deal direct hit damage
            this.damageEnemy(enemy, juiceBox.damage);
            
            // Land the juice box at enemy location for puddle creation
            this.landJuiceBox(juiceBox);
            
        } catch (error) {
            Logger.error('Juice box hit enemy error:', error);
        }
    }

    getUpgrades() {
        return [
            { 
                id: 'juice_more_boxes', 
                name: 'Juice Barrage', 
                description: '+1 juice box per throw', 
                type: 'character', 
                statType: 'unique',
                effect: () => this.scene.statsSystem.addStatBonus('projectileCountBonus', 1) 
            },
            { 
                id: 'juice_bigger_puddles', 
                name: 'Sticky Mess', 
                description: 'Puddle radius increased by 50%', 
                type: 'character', 
                statType: 'radius',
                effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) 
            },
            { 
                id: 'juice_stronger_damage', 
                name: 'Acidic Juice', 
                description: 'Juice damage increased by 25%', 
                type: 'character', 
                statType: 'damage',
                effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.25) 
            },
            { 
                id: 'juice_faster_throwing', 
                name: 'Rapid Fire', 
                description: 'Juice box cooldown reduced by 35%', 
                type: 'character', 
                statType: 'cooldown',
                effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.65) 
            },
            { 
                id: 'juice_super_slow', 
                name: 'Molasses Mode', 
                description: 'Puddles slow enemies by 75% and +30 health', 
                type: 'character', 
                statType: 'unique',
                effect: () => {
                    // This would increase slow amount in the puddle system
                    this.scene.statsSystem.addStatBonus('healthBonus', 30);
                    // Note: Enhanced slow effect would need to be implemented in applyPuddleEffects
                }
            }
        ];
    }

    getCollisionHandlers() {
        return [
            { 
                projectileLabel: 'juiceBox', 
                handler: this.juiceBoxHitEnemy.bind(this) 
            }
        ];
    }

    // Override cleanup to handle puddle effects
    cleanup() {
        // Clean up all puddle effects
        const puddlesGroup = this.getAbilityGroup('juicePuddles');
        if (puddlesGroup) {
            puddlesGroup.children.entries.forEach(puddle => {
                if (puddle && puddle.affectedEnemies) {
                    puddle.affectedEnemies.forEach(enemy => {
                        this.removeSlowEffect(enemy);
                    });
                }
            });
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}

export default JuiceBufo; 