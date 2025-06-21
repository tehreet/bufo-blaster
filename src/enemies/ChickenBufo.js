import BaseEnemy from './BaseEnemy.js';

class ChickenBufo extends BaseEnemy {
    constructor(scene, enemyData, gameObject) {
        super(scene, enemyData, gameObject);
    }

    setupAbility() {
        // Initialize ranged attack system
        this.createAbilityGroup('projectiles');
        
        // Set initial attack state
        this.setAbilityState('lastAttackTime', 0);
        this.setAbilityState('targetingPlayer', false);
        
        // Get ranged attack config
        const rangedConfig = this.getRangedAttack();
        if (rangedConfig) {
            this.setAbilityState('attackRange', rangedConfig.range);
            this.setAbilityState('keepDistance', rangedConfig.keepDistance);
            this.setAbilityState('projectileSpeed', rangedConfig.projectileSpeed);
            this.setAbilityState('projectileDamage', rangedConfig.projectileDamage);
            this.setAbilityState('attackCooldown', rangedConfig.attackCooldown);
            this.setAbilityState('accuracy', rangedConfig.accuracy);
        }
    }

    updateAbility() {
        this.updateRangedAttack();
        this.updateProjectiles();
    }

    updateAI() {
        // Custom AI for ranged enemy - maintain distance and shoot
        this.rangedAI();
    }

    rangedAI() {
        if (!this.scene.player || !this.gameObject.body) return;
        
        // Check if enemy is being knocked back
        if (this.gameObject.knockbackTime && this.scene.time.now < this.gameObject.knockbackTime) {
            return; // Don't apply AI movement during knockback
        }
        
        const playerPos = this.getPlayerPosition();
        if (!playerPos) return;
        
        const distanceToPlayer = this.getDistanceToPlayer();
        const keepDistance = this.getAbilityState('keepDistance');
        const attackRange = this.getAbilityState('attackRange');
        
        // Determine movement behavior based on distance to player
        let moveX = 0, moveY = 0;
        
        if (distanceToPlayer < keepDistance) {
            // Too close - move away from player
            const dx = this.gameObject.x - playerPos.x;
            const dy = this.gameObject.y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                moveX = (dx / distance) * this.gameObject.speed / 50;
                moveY = (dy / distance) * this.gameObject.speed / 50;
            }
        } else if (distanceToPlayer > attackRange) {
            // Too far - move closer to player (but not too close)
            const dx = playerPos.x - this.gameObject.x;
            const dy = playerPos.y - this.gameObject.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                moveX = (dx / distance) * this.gameObject.speed / 50;
                moveY = (dy / distance) * this.gameObject.speed / 50;
            }
        }
        // If in optimal range, don't move (moveX and moveY remain 0)
        
        // Apply movement
        if (moveX !== 0 || moveY !== 0) {
            try {
                this.scene.matter.body.setVelocity(this.gameObject.body, {
                    x: moveX,
                    y: moveY
                });
            } catch (error) {
                // Handle physics errors gracefully
            }
        }
    }

    updateRangedAttack() {
        const currentTime = this.scene.time.now;
        const lastAttackTime = this.getAbilityState('lastAttackTime');
        const attackCooldown = this.getAbilityState('attackCooldown');
        const attackRange = this.getAbilityState('attackRange');
        
        // Check if we can attack
        if (currentTime - lastAttackTime < attackCooldown) return;
        
        const distanceToPlayer = this.getDistanceToPlayer();
        
        // Only attack if player is in range
        if (distanceToPlayer <= attackRange) {
            this.fireProjectile();
            this.setAbilityState('lastAttackTime', currentTime);
        }
    }

    fireProjectile() {
        const playerPos = this.getPlayerPosition();
        if (!playerPos) return;
        
        const accuracy = this.getAbilityState('accuracy');
        const projectileSpeed = this.getAbilityState('projectileSpeed');
        const projectileDamage = this.getAbilityState('projectileDamage');
        
        // Calculate direction to player with accuracy spread
        const dx = playerPos.x - this.gameObject.x;
        const dy = playerPos.y - this.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Add inaccuracy based on accuracy setting
        const spread = (1 - accuracy) * Math.PI * 0.2; // Max 20% of PI radians spread
        const angleOffset = (Math.random() - 0.5) * spread;
        const baseAngle = Math.atan2(dy, dx);
        const finalAngle = baseAngle + angleOffset;
        
        // Calculate projectile velocity
        const velocityX = Math.cos(finalAngle) * projectileSpeed / 50;
        const velocityY = Math.sin(finalAngle) * projectileSpeed / 50;
        
        // Create egg projectile
        const projectile = this.createProjectile(
            this.gameObject.x, 
            this.gameObject.y, 
            velocityX, 
            velocityY,
            {
                radius: 8,
                color: 0xffeaa7,
                stroke: { width: 2, color: 0xfdcb6e },
                damage: projectileDamage,
                label: 'chickenEgg',
                lifespan: 4000
            }
        );
        
        if (projectile) {
            // Add to projectiles group for management
            const projectileGroup = this.getAbilityGroup('projectiles');
            if (projectileGroup) {
                projectileGroup.add(projectile);
            }
        }
    }

    updateProjectiles() {
        const projectileGroup = this.getAbilityGroup('projectiles');
        if (!projectileGroup) return;
        
        const projectiles = projectileGroup.children.entries;
        const currentTime = this.scene.time.now;
        
        // Clean up old projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            if (!projectile || !projectile.active || !projectile.scene) {
                projectileGroup.remove(projectile);
                continue;
            }
            
            // Remove projectiles that are too old
            if (currentTime - projectile.birthTime > projectile.lifespan) {
                this.destroyProjectile(projectile);
            }
        }
    }

    destroyProjectile(projectile) {
        try {
            const projectileGroup = this.getAbilityGroup('projectiles');
            if (projectileGroup) {
                projectileGroup.remove(projectile);
            }
            
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        } catch (error) {
            // Handle destruction errors gracefully
        }
    }

    onDeath() {
        // Clean up all projectiles when chicken dies
        const projectileGroup = this.getAbilityGroup('projectiles');
        if (projectileGroup) {
            projectileGroup.clear(true, true);
        }
    }

    // Handle when projectile hits player
    projectileHitPlayer(projectile, player) {
        try {
            if (!projectile || !projectile.active || !player || !player.active) {
                return;
            }
            
            // Deal damage to player
            const damage = projectile.damage || 10;
            this.scene.statsSystem.takeDamage(damage);
            
            // Create impact effect
            const impactEffect = this.scene.add.circle(projectile.x, projectile.y, 15, 0xffeaa7, 0.6);
            this.scene.tweens.add({
                targets: impactEffect,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => impactEffect.destroy()
            });
            
            // Destroy the projectile
            this.destroyProjectile(projectile);
            
        } catch (error) {
            // Handle collision errors gracefully
        }
    }
}

export default ChickenBufo; 