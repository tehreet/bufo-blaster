// Game Entities System
import { GAME_CONFIG, COLLISION_CATEGORIES, ASSET_URLS, ENEMY_TYPES } from './constants.js';
import { 
    gameWidth, 
    gameHeight, 
    enemies, 
    projectiles, 
    xpOrbs,
    starfallProjectiles,
    orbitingGeese,
    convertedAllies,
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
    currentGooseOrbitSpeedMultiplier,
    lastStarfallTime,
    setLastStarfallTime,
    selectedCharacter,
    gamePausedForUpgrade,
    gamePaused,
    gameOver,
    characterSelectionActive,
    playerLevel
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

// Get fallback color for enemy types
function getEnemyFallbackColor(enemyType) {
    switch (enemyType) {
        case ENEMY_TYPES.BUFF_BUFO:
            return '#FFD700'; // Gold
        case ENEMY_TYPES.GAVEL_BUFO:
            return '#8B4513'; // Brown
        case ENEMY_TYPES.ICE_BUFO:
            return '#87CEEB'; // Light blue
        case ENEMY_TYPES.BOSS_BUFO:
            return '#FF6B6B'; // Red
        default:
            return 'red'; // Normal enemy red
    }
}

// Determine what type of enemy to spawn based on current level
function determineEnemyType() {
    // Boss every 7 levels
    if (playerLevel > 0 && playerLevel % GAME_CONFIG.BOSS_BUFO_LEVEL_INTERVAL === 0) {
        return ENEMY_TYPES.BOSS_BUFO;
    }
    
    // Special enemies on certain levels (starting from level 2, every other level)
    if (playerLevel >= 2 && playerLevel % 2 === 0) {
        const shouldSpawnSpecial = Math.random() < GAME_CONFIG.SPECIAL_ENEMY_SPAWN_CHANCE;
        if (shouldSpawnSpecial) {
            const specialTypes = [ENEMY_TYPES.BUFF_BUFO, ENEMY_TYPES.GAVEL_BUFO, ENEMY_TYPES.ICE_BUFO];
            return specialTypes[Math.floor(Math.random() * specialTypes.length)];
        }
    }
    
    return ENEMY_TYPES.NORMAL;
}

// Get enemy properties based on type
function getEnemyProperties(enemyType) {
    switch (enemyType) {
        case ENEMY_TYPES.BUFF_BUFO:
            const buffAsset = imageAssets['special_enemy_buff_bufo'];
            return {
                radius: GAME_CONFIG.BUFF_BUFO_RADIUS,
                health: GAME_CONFIG.BUFF_BUFO_HEALTH,
                contactDamage: GAME_CONFIG.BUFF_BUFO_CONTACT_DAMAGE,
                sprite: buffAsset && buffAsset.complete && buffAsset.naturalHeight > 0 
                    ? buffAsset.src 
                    : null,
                scale: 0.35 // Larger sprite
            };
        case ENEMY_TYPES.GAVEL_BUFO:
            const gavelAsset = imageAssets['special_enemy_gavel_bufo'];
            return {
                radius: GAME_CONFIG.GAVEL_BUFO_RADIUS,
                health: GAME_CONFIG.GAVEL_BUFO_HEALTH,
                contactDamage: GAME_CONFIG.GAVEL_BUFO_CONTACT_DAMAGE,
                sprite: gavelAsset && gavelAsset.complete && gavelAsset.naturalHeight > 0 
                    ? gavelAsset.src 
                    : null,
                scale: 0.32 // Larger sprite
            };
        case ENEMY_TYPES.ICE_BUFO:
            const iceAsset = imageAssets['special_enemy_ice_bufo'];
            return {
                radius: GAME_CONFIG.ICE_BUFO_RADIUS,
                health: GAME_CONFIG.ICE_BUFO_HEALTH,
                contactDamage: GAME_CONFIG.ICE_BUFO_CONTACT_DAMAGE,
                sprite: iceAsset && iceAsset.complete && iceAsset.naturalHeight > 0 
                    ? iceAsset.src 
                    : null,
                scale: 0.28 // Larger sprite
            };
        case ENEMY_TYPES.BOSS_BUFO:
            const bossAsset = imageAssets['special_enemy_boss_bufo'];
            return {
                radius: GAME_CONFIG.BOSS_BUFO_RADIUS,
                health: GAME_CONFIG.BOSS_BUFO_HEALTH,
                contactDamage: GAME_CONFIG.BOSS_BUFO_CONTACT_DAMAGE,
                sprite: bossAsset && bossAsset.complete && bossAsset.naturalHeight > 0 
                    ? bossAsset.src 
                    : null,
                scale: 0.4
            };
        default: // NORMAL
            const enemyImageFile = ASSET_URLS.ENEMY_IMAGE_FILES[Math.floor(Math.random() * ASSET_URLS.ENEMY_IMAGE_FILES.length)];
            const enemyImageAsset = imageAssets[enemyImageFile];
            
            return {
                radius: GAME_CONFIG.ENEMY_RADIUS,
                health: GAME_CONFIG.ENEMY_MAX_HEALTH,
                contactDamage: GAME_CONFIG.ENEMY_CONTACT_DAMAGE,
                sprite: enemyImageAsset && enemyImageAsset.complete && enemyImageAsset.naturalHeight > 0 
                    ? enemyImageAsset.src 
                    : null, // Use null if image not loaded
                scale: 0.22
            };
    }
}

// Spawn enemy at random edge position
export function spawnEnemy() {
    // Don't spawn enemies if game is paused, over, or during character selection
    if (gamePausedForUpgrade || gamePaused || gameOver || characterSelectionActive) {
        return;
    }
    
    const enemyType = determineEnemyType();
    const enemyProps = getEnemyProperties(enemyType);
    
    const side = Math.floor(Math.random() * 4);
    const inset = enemyProps.radius * 3; // Spawn well inside the boundaries
    let x, y;

    switch (side) {
        case 0: // Top
            x = Math.random() * (gameWidth - 2 * inset) + inset;
            y = -enemyProps.radius;
            break;
        case 1: // Right
            x = gameWidth + enemyProps.radius;
            y = Math.random() * (gameHeight - 2 * inset) + inset;
            break;
        case 2: // Bottom
            x = Math.random() * (gameWidth - 2 * inset) + inset;
            y = gameHeight + enemyProps.radius;
            break;
        case 3: // Left
            x = -enemyProps.radius;
            y = Math.random() * (gameHeight - 2 * inset) + inset;
            break;
    }

    // Create enemy body with proper sprite handling
    const renderOptions = {
        fillStyle: getEnemyFallbackColor(enemyType) // Always provide fallback color
    };
    
    // Only add sprite if texture is available and valid
    if (enemyProps.sprite) {
        renderOptions.sprite = {
            texture: enemyProps.sprite,
            xScale: enemyProps.scale,
            yScale: enemyProps.scale
        };
    }
    
    const enemy = Bodies.circle(x, y, enemyProps.radius, {
        collisionFilter: { 
            category: COLLISION_CATEGORIES.ENEMY, 
            mask: COLLISION_CATEGORIES.DEFAULT | COLLISION_CATEGORIES.PLAYER | COLLISION_CATEGORIES.PROJECTILE 
        },
        label: 'enemy',
        frictionAir: 0.01,
        render: renderOptions
    });

    enemy.health = enemyProps.health;
    enemy.maxHealth = enemyProps.health;
    enemy.circleRadius = enemyProps.radius;
    enemy.enemyType = enemyType;
    enemy.contactDamage = enemyProps.contactDamage;
    
    // Special properties for boss
    if (enemyType === ENEMY_TYPES.BOSS_BUFO) {
        enemy.speedMultiplier = GAME_CONFIG.BOSS_BUFO_SPEED_MULTIPLIER;
    }
    
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
                let speed = GAME_CONFIG.ENEMY_SPEED;
                
                // Apply boss speed multiplier
                if (enemy.speedMultiplier) {
                    speed *= enemy.speedMultiplier;
                }
                
                const velocityX = (directionX / magnitude) * speed;
                const velocityY = (directionY / magnitude) * speed;
                Matter.Body.setVelocity(enemy, { x: velocityX, y: velocityY });
            }
        }
    });
}

// Update special enemy effects (like ice bufo slowing)
export function updateSpecialEnemyEffects() {
    import('./gameState.js').then(({ 
        playerSpeedMultiplier, 
        setPlayerSpeedMultiplier,
        abilityCooldownMultiplier,
        setAbilityCooldownMultiplier,
        playerStunned,
        stunEndTime,
        setPlayerStunned 
    }) => {
        const currentTime = Date.now();
        
        // Reset multipliers
        let newSpeedMultiplier = 1.0;
        let newAbilityCooldownMultiplier = 1.0;
        
        // Check for ice bufo slow effects (gradual based on distance)
        enemies.forEach(enemy => {
            if (enemy.enemyType === ENEMY_TYPES.ICE_BUFO && player) {
                const dx = player.position.x - enemy.position.x;
                const dy = player.position.y - enemy.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= GAME_CONFIG.ICE_BUFO_SLOW_RADIUS) {
                    // Calculate gradual slow effect based on distance
                    // At distance 0: full slow (50%), at max distance: no slow (100%)
                    const distanceRatio = distance / GAME_CONFIG.ICE_BUFO_SLOW_RADIUS;
                    const slowEffect = GAME_CONFIG.ICE_BUFO_SLOW_FACTOR + (distanceRatio * (1 - GAME_CONFIG.ICE_BUFO_SLOW_FACTOR));
                    newSpeedMultiplier = Math.min(newSpeedMultiplier, slowEffect);
                    
                    // Same effect applies to ability cooldowns (makes abilities slower)
                    // At close range: 2x cooldown (50% effectiveness), at max range: normal cooldown
                    const cooldownEffect = 1 + (1 - slowEffect); // Inverse of speed effect for cooldowns
                    newAbilityCooldownMultiplier = Math.max(newAbilityCooldownMultiplier, cooldownEffect);
                }
            }
        });
        
        // Update multipliers if changed
        if (newSpeedMultiplier !== playerSpeedMultiplier) {
            setPlayerSpeedMultiplier(newSpeedMultiplier);
        }
        
        if (newAbilityCooldownMultiplier !== abilityCooldownMultiplier) {
            setAbilityCooldownMultiplier(newAbilityCooldownMultiplier);
        }
        
        // Check if stun has ended
        if (playerStunned && currentTime >= stunEndTime) {
            setPlayerStunned(false);
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

    import('./gameState.js').then(({ playerSpeedMultiplier, playerStunned }) => {
        // Don't move if stunned
        if (playerStunned) return;
        
        // Scale velocity by player speed and any speed multipliers (like ice bufo slow)
        const scaledVelocityX = velocityX * playerSpeed * playerSpeedMultiplier;
        const scaledVelocityY = velocityY * playerSpeed * playerSpeedMultiplier;

        Matter.Body.setVelocity(player, { x: scaledVelocityX, y: scaledVelocityY });

        // Player boundary clamp
        const { x, y } = player.position;
        const clampedX = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(x, gameWidth - GAME_CONFIG.PLAYER_RADIUS));
        const clampedY = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(y, gameHeight - GAME_CONFIG.PLAYER_RADIUS));

        if (x !== clampedX || y !== clampedY) {
            Matter.Body.setPosition(player, { x: clampedX, y: clampedY });
        }
    });
}

// Apply Stab Bufo aura damage
export function applyStabBufoAura() {
    if (!player) return;

    const currentTime = Date.now();
    
    // Get ability cooldown multiplier for ice bufo effect
    import('./gameState.js').then(({ abilityCooldownMultiplier, setLastAuraTickTime }) => {
        const effectiveCooldown = currentAuraCooldown * abilityCooldownMultiplier;
        
        // Check if enough time has passed since last aura tick (affected by ice bufo)
        if (currentTime - lastAuraTickTime < effectiveCooldown) {
            return;
        }

        // Update last aura tick time
        setLastAuraTickTime(currentTime);
        
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
    });
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
    
    // Check cooldown (affected by ice bufo)
    import('./gameState.js').then(({ abilityCooldownMultiplier }) => {
        const effectiveCooldown = currentStarfallCooldown * abilityCooldownMultiplier;
        
        if (currentTime - lastStarfallTime < effectiveCooldown) {
            return;
        }
        
        // Continue with starfall logic
        executeStarfall(currentTime);
    });
}

// Separate function for starfall execution
function executeStarfall(currentTime) {
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

// Initialize orbiting geese for Goose Bufo
export function initializeGooseOrbit() {
    orbitingGeese.length = 0; // Clear existing geese
    
    for (let i = 0; i < GAME_CONFIG.GOOSE_BUFO_GOOSE_COUNT; i++) {
        const angle = (i / GAME_CONFIG.GOOSE_BUFO_GOOSE_COUNT) * Math.PI * 2;
        const goose = {
            angle: angle,
            radius: GAME_CONFIG.GOOSE_BUFO_ORBIT_RADIUS
        };
        orbitingGeese.push(goose);
    }
}

// Update orbiting geese around Goose Bufo
export function updateGooseOrbit() {
    if (!player || selectedCharacter.id !== 'goose') return;
    
    const currentTime = Date.now();
    
    // Get ability cooldown multiplier for ice bufo effect
    import('./gameState.js').then(({ abilityCooldownMultiplier }) => {
        orbitingGeese.forEach(goose => {
            // Update rotation with speed multiplier from Ability Haste upgrades and ice bufo effect
            // Ice bufo slows down orbit speed (higher cooldown multiplier = slower orbit)
            const effectiveSpeed = GAME_CONFIG.GOOSE_BUFO_ORBIT_SPEED * currentGooseOrbitSpeedMultiplier / abilityCooldownMultiplier;
            goose.angle += effectiveSpeed * 0.016; // Assuming 60fps
            
            // Calculate position
            const gooseX = player.position.x + Math.cos(goose.angle) * goose.radius;
            const gooseY = player.position.y + Math.sin(goose.angle) * goose.radius;
            
            // Check for enemy collisions
            enemies.forEach((enemy, enemyIndex) => {
                const dx = gooseX - enemy.position.x;
                const dy = gooseY - enemy.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If goose is close to enemy, deal damage every contact
                if (distance < 25) {
                    // Damage enemy
                    enemy.health -= GAME_CONFIG.GOOSE_BUFO_GOOSE_DAMAGE;
                    
                    // Apply knockback
                    const knockbackForce = GAME_CONFIG.GOOSE_BUFO_KNOCKBACK_FORCE;
                    const knockbackX = (dx / distance) * knockbackForce;
                    const knockbackY = (dy / distance) * knockbackForce;
                    Matter.Body.setVelocity(enemy, { x: knockbackX, y: knockbackY });
                    enemy.knockbackTime = currentTime + 300; // 300ms knockback duration
                    
                    // Check if enemy dies
                    if (enemy.health <= 0) {
                        // Play death sound
                        if (audioEnemyDie) {
                            audioEnemyDie.currentTime = 0;
                            audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
                        }

                        // Create converted ally instead of XP orb
                        createConvertedAlly(enemy.position.x, enemy.position.y);
                        incrementEnemyKillCount();

                        // Remove enemy
                        enemies.splice(enemyIndex, 1);
                        Composite.remove(world, enemy);
                    }
                }
            });
        });
    });
}

// Create a converted ally (goose-riding bufo)
export function createConvertedAlly(x, y) {
    const ally = Bodies.circle(x, y, GAME_CONFIG.ENEMY_RADIUS, {
        collisionFilter: { 
            category: COLLISION_CATEGORIES.PROJECTILE, // Use projectile category to hit enemies
            mask: COLLISION_CATEGORIES.DEFAULT | COLLISION_CATEGORIES.ENEMY 
        },
        label: 'convertedAlly',
        isSensor: true,
        render: { 
            sprite: {
                texture: 'https://all-the.bufo.zone/bufo-riding-goose.gif',
                xScale: 0.3,
                yScale: 0.3
            }
        }
    });

    // Add custom properties
    ally.health = 1; // One hit and they're gone
    ally.damage = GAME_CONFIG.GOOSE_BUFO_CONVERTED_ALLY_DAMAGE;
    ally.creationTime = Date.now();
    ally.targetEnemy = null;
    ally.hasAttacked = false;

    convertedAllies.push(ally);
    World.add(world, ally);
}

// Update converted allies behavior
export function updateConvertedAllies() {
    const currentTime = Date.now();
    
    for (let i = convertedAllies.length - 1; i >= 0; i--) {
        const ally = convertedAllies[i];
        
        // Remove expired allies
        if (currentTime - ally.creationTime > GAME_CONFIG.GOOSE_BUFO_CONVERTED_ALLY_LIFETIME) {
            Composite.remove(world, ally);
            convertedAllies.splice(i, 1);
            continue;
        }
        
        // If ally hasn't attacked yet, find and move toward nearest enemy
        if (!ally.hasAttacked && enemies.length > 0) {
            let nearestEnemy = null;
            let minDistance = Infinity;
            
            enemies.forEach(enemy => {
                const dx = ally.position.x - enemy.position.x;
                const dy = ally.position.y - enemy.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            if (nearestEnemy) {
                const dx = nearestEnemy.position.x - ally.position.x;
                const dy = nearestEnemy.position.y - ally.position.y;
                const magnitude = Math.sqrt(dx * dx + dy * dy);
                
                if (magnitude > 0) {
                    const velocityX = (dx / magnitude) * GAME_CONFIG.GOOSE_BUFO_CONVERTED_ALLY_SPEED;
                    const velocityY = (dy / magnitude) * GAME_CONFIG.GOOSE_BUFO_CONVERTED_ALLY_SPEED;
                    Matter.Body.setVelocity(ally, { x: velocityX, y: velocityY });
                    
                    // Check if close enough to attack
                    if (magnitude < 20) {
                        // Deal damage
                        nearestEnemy.health -= ally.damage;
                        ally.hasAttacked = true;
                        
                        // Check if enemy dies
                        if (nearestEnemy.health <= 0) {
                            // Play death sound
                            if (audioEnemyDie) {
                                audioEnemyDie.currentTime = 0;
                                audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
                            }

                            // Create XP orb for converted ally kills
                            createXPOrb(nearestEnemy.position.x, nearestEnemy.position.y);
                            incrementEnemyKillCount();

                            // Remove enemy
                            const enemyIndex = enemies.indexOf(nearestEnemy);
                            if (enemyIndex > -1) {
                                enemies.splice(enemyIndex, 1);
                                Composite.remove(world, nearestEnemy);
                            }
                        }
                        
                        // Remove the ally after attacking
                        Composite.remove(world, ally);
                        convertedAllies.splice(i, 1);
                    }
                }
            }
        } else if (ally.hasAttacked) {
            // Remove ally if it has already attacked
            Composite.remove(world, ally);
            convertedAllies.splice(i, 1);
        }
    }
}