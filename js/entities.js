// Game Entities System
import { GAME_CONFIG, COLLISION_CATEGORIES, ASSET_URLS } from './constants.js';
import { 
    gameWidth, 
    gameHeight, 
    enemies, 
    projectiles, 
    xpOrbs,
    starfallProjectiles,
    world,
    player,
    imageAssets,
    projectileDamage,
    playerSpeed,
    incrementEnemyKillCount,
    lastAuraTickTime,
    audioEnemyDie,
    currentAuraCooldown,
    currentAuraDamage,
    currentAuraKnockback,
    currentStarfallCooldown,
    currentStarfallDamage,
    currentStarfallCount,
    lastStarfallTime,
    setLastStarfallTime,
    selectedCharacter,
    gamePausedForUpgrade,
    gamePaused,
    gameOver,
    characterSelectionActive
} from './gameState.js';

const { Bodies, World, Composite } = Matter;

// Create player body
export function createPlayerBody() {
    return Bodies.circle(gameWidth / 2, gameHeight / 2, GAME_CONFIG.PLAYER_RADIUS, {
        collisionFilter: { 
            category: COLLISION_CATEGORIES.PLAYER, 
            mask: COLLISION_CATEGORIES.DEFAULT | COLLISION_CATEGORIES.ENEMY | COLLISION_CATEGORIES.PROJECTILE 
        },
        label: 'player',
        frictionAir: 0.085, // Air resistance for smoother movement
        density: 0.002,
        render: {
            fillStyle: 'transparent',
            strokeStyle: 'transparent',
            sprite: {
                xScale: 0.35, 
                yScale: 0.35
            }
        }
    });
}

// Spawn enemy at random edge position
export function spawnEnemy() {
    // Don't spawn enemies if game is paused, over, or during character selection
    if (gamePausedForUpgrade || gamePaused || gameOver || characterSelectionActive) {
        return;
    }
    
    const side = Math.floor(Math.random() * 4);
    const inset = GAME_CONFIG.ENEMY_RADIUS * 3; // Spawn well inside the boundaries
    let x, y;

    switch (side) {
        case 0: // Top
            x = Math.random() * (gameWidth - 2 * inset) + inset;
            y = -GAME_CONFIG.ENEMY_RADIUS;
            break;
        case 1: // Right
            x = gameWidth + GAME_CONFIG.ENEMY_RADIUS;
            y = Math.random() * (gameHeight - 2 * inset) + inset;
            break;
        case 2: // Bottom
            x = Math.random() * (gameWidth - 2 * inset) + inset;
            y = gameHeight + GAME_CONFIG.ENEMY_RADIUS;
            break;
        case 3: // Left
            x = -GAME_CONFIG.ENEMY_RADIUS;
            y = Math.random() * (gameHeight - 2 * inset) + inset;
            break;
    }

    // Select random enemy image
    const enemyImageFile = ASSET_URLS.ENEMY_IMAGE_FILES[Math.floor(Math.random() * ASSET_URLS.ENEMY_IMAGE_FILES.length)];
    const enemyImageAsset = imageAssets[enemyImageFile];

    // Create enemy body
    const enemy = Bodies.circle(x, y, GAME_CONFIG.ENEMY_RADIUS, {
        collisionFilter: { 
            category: COLLISION_CATEGORIES.ENEMY, 
            mask: COLLISION_CATEGORIES.DEFAULT | COLLISION_CATEGORIES.PLAYER | COLLISION_CATEGORIES.PROJECTILE 
        },
        label: 'enemy',
        frictionAir: 0.01,
        render: {
            sprite: enemyImageAsset && enemyImageAsset.complete && enemyImageAsset.naturalHeight > 0 ? {
                texture: enemyImageAsset.src,
                xScale: 0.22,
                yScale: 0.22
            } : {
                fillStyle: 'red'
            }
        }
    });

    enemy.health = GAME_CONFIG.ENEMY_MAX_HEALTH;
    enemy.circleRadius = GAME_CONFIG.ENEMY_RADIUS;
    enemies.push(enemy);
    World.add(world, enemy);
}

// Find nearest enemy to player
export function findNearestEnemy() {
    let nearestEnemy = null;
    let minDistanceSq = Infinity;

    enemies.forEach(enemy => {
        if (enemy) {
            const dx = player.position.x - enemy.position.x;
            const dy = player.position.y - enemy.position.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                nearestEnemy = enemy;
            }
        }
    });
    return nearestEnemy;
}

// Shoot projectile at target
export function shootProjectile() {
    if (!player) return;

    const target = findNearestEnemy();
    if (!target) return;

    const dx = target.position.x - player.position.x;
    const dy = target.position.y - player.position.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude === 0) return;

    const velocityX = (dx / magnitude) * GAME_CONFIG.PROJECTILE_SPEED;
    const velocityY = (dy / magnitude) * GAME_CONFIG.PROJECTILE_SPEED;

    const projectile = Bodies.circle(player.position.x, player.position.y, GAME_CONFIG.PROJECTILE_RADIUS, {
        collisionFilter: { 
            category: COLLISION_CATEGORIES.PROJECTILE, 
            mask: COLLISION_CATEGORIES.DEFAULT | COLLISION_CATEGORIES.ENEMY 
        },
        label: 'projectile',
        isSensor: true,
        render: { fillStyle: 'yellow' }
    });

    Matter.Body.setVelocity(projectile, { x: velocityX, y: velocityY });
    projectiles.push(projectile);
    World.add(world, projectile);

    // Play shoot sound
    import('./gameState.js').then(({ audioShoot }) => {
        if (audioShoot) {
            audioShoot.currentTime = 0;
            audioShoot.play().catch(e => console.warn("Shoot sound play failed:", e));
        }
    });
}

// Create XP orb at position
export function createXPOrb(x, y) {
    const xpOrb = Bodies.circle(x, y, GAME_CONFIG.XP_ORB_RADIUS, {
        label: 'xpOrb', 
        isSensor: true, 
        render: { fillStyle: 'cyan' },
        collisionFilter: { 
            category: COLLISION_CATEGORIES.DEFAULT, 
            mask: COLLISION_CATEGORIES.PLAYER 
        }
    });
    World.add(world, xpOrb);
    xpOrbs.push(xpOrb);
    return xpOrb;
}

// Update enemy movement towards player
export function updateEnemyMovement() {
    const currentTime = Date.now();
    
    enemies.forEach(enemy => {
        if (!enemy.isSleeping && player) {
            // Skip movement if enemy is currently being knocked back
            if (enemy.knockbackTime && currentTime < enemy.knockbackTime) {
                return; // Don't override knockback velocity
            }
            
            const directionX = player.position.x - enemy.position.x;
            const directionY = player.position.y - enemy.position.y;
            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
            
            if (magnitude > 0) {
                const velocityX = (directionX / magnitude) * GAME_CONFIG.ENEMY_SPEED;
                const velocityY = (directionY / magnitude) * GAME_CONFIG.ENEMY_SPEED;
                Matter.Body.setVelocity(enemy, { x: velocityX, y: velocityY });
            }
        }
    });
}

// Clean up off-screen entities
export function cleanupOffScreenEntities() {
    // Clean up enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.position.x < -100 || enemy.position.x > gameWidth + 100 || 
            enemy.position.y < -100 || enemy.position.y > gameHeight + 100) {
            Composite.remove(world, enemy);
            enemies.splice(i, 1);
        }
    }

    // Clean up projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        if (projectile.position.x < -50 || projectile.position.x > gameWidth + 50 ||
            projectile.position.y < -50 || projectile.position.y > gameHeight + 50) {
            Composite.remove(world, projectile);
            projectiles.splice(i, 1);
        }
    }
    
    // Clean up starfall projectiles
    for (let i = starfallProjectiles.length - 1; i >= 0; i--) {
        const starfall = starfallProjectiles[i];
        if (starfall.position.x < -100 || starfall.position.x > gameWidth + 100 ||
            starfall.position.y < -100 || starfall.position.y > gameHeight + 100) {
            Composite.remove(world, starfall);
            starfallProjectiles.splice(i, 1);
        }
    }
}

// Update XP orb magnetism
export function updateXPOrbMagnetism() {
    import('./gameState.js').then(({ xpOrbPickupRadius }) => {
        xpOrbs.forEach(orb => {
            if (player) {
                const distanceX = player.position.x - orb.position.x;
                const distanceY = player.position.y - orb.position.y;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Attract if within pickup radius but not already overlapping significantly
                if (distance < xpOrbPickupRadius && distance > (GAME_CONFIG.PLAYER_RADIUS * 0.5)) {
                    const directionX = distanceX / distance;
                    const directionY = distanceY / distance;
                    const magnetVelocityX = directionX * GAME_CONFIG.XP_ORB_MAGNET_SPEED;
                    const magnetVelocityY = directionY * GAME_CONFIG.XP_ORB_MAGNET_SPEED;
                    Matter.Body.setVelocity(orb, { x: magnetVelocityX, y: magnetVelocityY });
                }
            }
        });
    });
}

// Apply player movement
export function applyPlayerMovement(velocityX, velocityY) {
    if (!player) return;

    // Scale velocity by player speed
    const scaledVelocityX = velocityX * playerSpeed;
    const scaledVelocityY = velocityY * playerSpeed;

    Matter.Body.setVelocity(player, { x: scaledVelocityX, y: scaledVelocityY });

    // Player boundary clamp
    const { x, y } = player.position;
    const clampedX = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(x, gameWidth - GAME_CONFIG.PLAYER_RADIUS));
    const clampedY = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(y, gameHeight - GAME_CONFIG.PLAYER_RADIUS));

    if (x !== clampedX || y !== clampedY) {
        Matter.Body.setPosition(player, { x: clampedX, y: clampedY });
    }
}

// Apply Stab Bufo aura damage
export function applyStabBufoAura() {
    if (!player) return;

    const currentTime = Date.now();
    
    // Check if enough time has passed since last aura tick
    if (currentTime - lastAuraTickTime < currentAuraCooldown) {
        return;
    }

    // Update last aura tick time through gameState
    import('./gameState.js').then(({ setLastAuraTickTime }) => {
        setLastAuraTickTime(currentTime);
    });
    
    // Apply damage to enemies within aura range
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy) continue;

        const dx = enemy.position.x - player.position.x; // Direction FROM player TO enemy
        const dy = enemy.position.y - player.position.y; // Direction FROM player TO enemy
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= GAME_CONFIG.STAB_BUFO_AURA_RADIUS) {
            enemy.health -= currentAuraDamage;

            // Apply knockback force - push enemy away from player
            if (distance > 0) { // Avoid division by zero
                const knockbackX = (dx / distance) * currentAuraKnockback;
                const knockbackY = (dy / distance) * currentAuraKnockback;
                
                // Apply knockback directly as velocity (more immediate effect)
                Matter.Body.setVelocity(enemy, { 
                    x: knockbackX, 
                    y: knockbackY 
                });
                
                // Mark enemy as being knocked back to prevent immediate movement override
                enemy.knockbackTime = currentTime + 200; // 200ms of knockback
            }

            // Check if enemy dies from aura damage
            if (enemy.health <= 0) {
                // Play death sound
                if (audioEnemyDie) {
                    audioEnemyDie.currentTime = 0;
                    audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
                }

                // Create XP orb
                createXPOrb(enemy.position.x, enemy.position.y);
                incrementEnemyKillCount();

                // Remove enemy
                enemies.splice(i, 1);
                Matter.Composite.remove(world, enemy);
            }
        }
    }
}

// Find enemies within starfall range
export function findEnemiesInRange(centerX, centerY, range) {
    return enemies.filter(enemy => {
        const dx = enemy.position.x - centerX;
        const dy = enemy.position.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= range;
    });
}

// Cast starfall ability
export function castStarfall() {
    if (!player || selectedCharacter.id !== 'wizard') return;

    const currentTime = Date.now();
    
    // Check cooldown
    if (currentTime - lastStarfallTime < currentStarfallCooldown) {
        return;
    }

    // Find enemies within range
    const enemiesInRange = findEnemiesInRange(
        player.position.x, 
        player.position.y, 
        GAME_CONFIG.WIZARD_STARFALL_RANGE
    );

    if (enemiesInRange.length === 0) return;

    // Update last cast time
    setLastStarfallTime(currentTime);

    // Smart targeting: prioritize different areas to maximize coverage
    const targetedEnemies = selectOptimalTargets(enemiesInRange, currentStarfallCount);
    
    // Create starfall projectiles for each target
    targetedEnemies.forEach((targetEnemy, index) => {
        // Stagger the star creation slightly for visual effect
        setTimeout(() => {
            createStarfallProjectile(targetEnemy);
        }, index * 100); // 100ms delay between each star
    });

    // Play shoot sound (reuse existing sound)
    import('./gameState.js').then(({ audioShoot }) => {
        if (audioShoot) {
            audioShoot.currentTime = 0;
            audioShoot.play().catch(e => console.warn("Starfall sound play failed:", e));
        }
    });
}

// Select optimal targets to maximize damage coverage
function selectOptimalTargets(enemies, maxTargets) {
    if (enemies.length <= maxTargets) {
        return enemies; // Target all enemies if we have enough stars
    }

    const targets = [];
    const remainingEnemies = [...enemies];
    
    // First, select the closest enemy to player
    let closestEnemy = remainingEnemies[0];
    let closestDistance = getDistance(player.position, closestEnemy.position);
    
    remainingEnemies.forEach(enemy => {
        const distance = getDistance(player.position, enemy.position);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    });
    
    targets.push(closestEnemy);
    remainingEnemies.splice(remainingEnemies.indexOf(closestEnemy), 1);
    
    // Then select enemies that are furthest from already selected targets
    while (targets.length < maxTargets && remainingEnemies.length > 0) {
        let bestEnemy = null;
        let bestScore = -1;
        
        remainingEnemies.forEach(enemy => {
            // Calculate minimum distance to any already selected target
            let minDistanceToTarget = Infinity;
            targets.forEach(target => {
                const distance = getDistance(enemy.position, target.position);
                minDistanceToTarget = Math.min(minDistanceToTarget, distance);
            });
            
            // Prefer enemies that are far from existing targets (better spread)
            if (minDistanceToTarget > bestScore) {
                bestScore = minDistanceToTarget;
                bestEnemy = enemy;
            }
        });
        
        if (bestEnemy) {
            targets.push(bestEnemy);
            remainingEnemies.splice(remainingEnemies.indexOf(bestEnemy), 1);
        } else {
            break;
        }
    }
    
    return targets;
}

// Helper function to calculate distance between two points
function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Create a starfall projectile
export function createStarfallProjectile(targetEnemy) {
    if (!targetEnemy) return;

    // Start position above the target
    const startX = targetEnemy.position.x + (Math.random() - 0.5) * 100; // Some randomness
    const startY = targetEnemy.position.y - 300; // Start high above

    const starfall = Bodies.circle(startX, startY, GAME_CONFIG.PROJECTILE_RADIUS * 1.5, {
        collisionFilter: { 
            category: COLLISION_CATEGORIES.PROJECTILE, 
            mask: COLLISION_CATEGORIES.DEFAULT | COLLISION_CATEGORIES.ENEMY 
        },
        label: 'starfall',
        isSensor: true,
        render: { 
            fillStyle: '#FFD700', // Gold color for stars
            strokeStyle: '#FFA500',
            lineWidth: 2
        }
    });

    // Calculate velocity to hit the target
    const dx = targetEnemy.position.x - startX;
    const dy = targetEnemy.position.y - startY;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    if (magnitude > 0) {
        const speed = GAME_CONFIG.PROJECTILE_SPEED * 0.8; // Slightly slower than regular projectiles
        const velocityX = (dx / magnitude) * speed;
        const velocityY = (dy / magnitude) * speed;
        
        Matter.Body.setVelocity(starfall, { x: velocityX, y: velocityY });
    }

    // Add custom properties
    starfall.damage = currentStarfallDamage;
    starfall.confusionDuration = GAME_CONFIG.WIZARD_STARFALL_CONFUSION_DURATION;
    starfall.creationTime = Date.now();
    starfall.targetEnemy = targetEnemy; // Store reference to target for impact detection

    starfallProjectiles.push(starfall);
    World.add(world, starfall);
}

// Update starfall projectiles
export function updateStarfallProjectiles() {
    const currentTime = Date.now();
    
    for (let i = starfallProjectiles.length - 1; i >= 0; i--) {
        const starfall = starfallProjectiles[i];
        
        // Remove old starfall projectiles (5 second lifetime)
        if (currentTime - starfall.creationTime > 5000) {
            Composite.remove(world, starfall);
            starfallProjectiles.splice(i, 1);
            continue;
        }

        // Check for impact with ground or target area (when starfall gets close to target)
        const targetReached = starfall.targetEnemy && 
            getDistance(starfall.position, starfall.targetEnemy.position) < 30;
        
        if (targetReached || starfall.position.y > gameHeight - 50) {
            // Star has reached its target or hit the ground - trigger AOE explosion
            applyStarfallAOE(starfall.position.x, starfall.position.y, starfall.damage, starfall.confusionDuration, currentTime);
            
            // Remove starfall projectile after impact
            Composite.remove(world, starfall);
            starfallProjectiles.splice(i, 1);
        }
    }
}

// Update confused enemy movement
export function updateConfusedEnemyMovement() {
    const currentTime = Date.now();
    
    enemies.forEach(enemy => {
        if (enemy.confused && currentTime < enemy.confusionEndTime && player) {
            // Move away from player instead of towards
            const directionX = enemy.position.x - player.position.x; // Reversed
            const directionY = enemy.position.y - player.position.y; // Reversed
            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
            
            if (magnitude > 0) {
                const velocityX = (directionX / magnitude) * GAME_CONFIG.ENEMY_SPEED * 0.5; // Slower when confused
                const velocityY = (directionY / magnitude) * GAME_CONFIG.ENEMY_SPEED * 0.5;
                Matter.Body.setVelocity(enemy, { x: velocityX, y: velocityY });
            }
        } else if (enemy.confused && currentTime >= enemy.confusionEndTime) {
            // Remove confusion
            enemy.confused = false;
            delete enemy.confusionEndTime;
        }
    });
}

// Apply AOE damage from starfall impact
export function applyStarfallAOE(impactX, impactY, damage, confusionDuration, currentTime) {
    const affectedEnemies = [];
    const enemiesToRemove = [];
    
    // Find all enemies within AOE radius
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const distance = getDistance({ x: impactX, y: impactY }, enemy.position);
        
        if (distance <= GAME_CONFIG.WIZARD_STARFALL_AOE_RADIUS) {
            affectedEnemies.push({ enemy, index: i, distance });
        }
    }
    
    // Sort by distance (closest first) for better visual feedback
    affectedEnemies.sort((a, b) => a.distance - b.distance);
    
    // Apply damage and effects to all enemies in AOE
    affectedEnemies.forEach(({ enemy, index }) => {
        // Deal damage
        enemy.health -= damage;
        
        // Apply confusion effect
        enemy.confused = true;
        enemy.confusionEndTime = currentTime + confusionDuration;
        
        // Check if enemy dies
        if (enemy.health <= 0) {
            // Play death sound
            if (audioEnemyDie) {
                audioEnemyDie.currentTime = 0;
                audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
            }

            // Create XP orb
            createXPOrb(enemy.position.x, enemy.position.y);
            incrementEnemyKillCount();

            // Mark for removal (we'll remove them after processing all)
            enemiesToRemove.push(enemy);
        }
    });
    
    // Remove dead enemies in reverse order to avoid index shifting issues
    enemiesToRemove.forEach(deadEnemy => {
        const enemyIndex = enemies.indexOf(deadEnemy);
        if (enemyIndex > -1) {
            // Remove from enemies array
            enemies.splice(enemyIndex, 1);
            // Remove from Matter.js world
            Matter.Composite.remove(world, deadEnemy);
        }
    });
    
    console.log(`Starfall AOE hit ${affectedEnemies.length} enemies, killed ${enemiesToRemove.length} at (${impactX.toFixed(0)}, ${impactY.toFixed(0)})`);
} 