// Game Entities System
import { GAME_CONFIG, COLLISION_CATEGORIES, ASSET_URLS } from './constants.js';
import { 
    gameWidth, 
    gameHeight, 
    enemies, 
    projectiles, 
    xpOrbs,
    world,
    player,
    imageAssets,
    projectileDamage,
    playerSpeed,
    incrementEnemyKillCount,
    lastAuraTickTime,
    audioEnemyDie
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
    enemies.forEach(enemy => {
        if (!enemy.isSleeping && player) {
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
    if (currentTime - lastAuraTickTime < GAME_CONFIG.STAB_BUFO_AURA_TICK_INTERVAL_MS) {
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

        const dx = player.position.x - enemy.position.x;
        const dy = player.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= GAME_CONFIG.STAB_BUFO_AURA_RADIUS) {
            enemy.health -= GAME_CONFIG.STAB_BUFO_AURA_DAMAGE_PER_TICK;

            // Apply knockback force - push enemy away from player
            if (distance > 0) { // Avoid division by zero
                const knockbackX = (dx / distance) * GAME_CONFIG.STAB_BUFO_AURA_KNOCKBACK_FORCE;
                const knockbackY = (dy / distance) * GAME_CONFIG.STAB_BUFO_AURA_KNOCKBACK_FORCE;
                
                // Apply the knockback velocity
                Matter.Body.applyForce(enemy, enemy.position, { 
                    x: knockbackX * 0.001, // Scale down for Matter.js force system
                    y: knockbackY * 0.001 
                });
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