// Game Core System
import { GAME_CONFIG, COLLISION_CATEGORIES, ASSET_URLS, DEFAULT_GAME_SETTINGS } from './constants.js';
import { initializeAudio, scaleGameContainer } from './assetLoader.js';
import { setupKeyboardControls, selectPrimaryGamepad, getMovementInput, pollGamepadForUpgradeMenu, handleGameOverInput } from './input.js';
import { createPlayerBody, spawnEnemy, shootProjectile, updateEnemyMovement, cleanupOffScreenEntities, updateXPOrbMagnetism, applyPlayerMovement, createXPOrb } from './entities.js';
import { presentUpgradeOptions } from './upgrades.js';
import { renderUI } from './ui.js';
import { 
    setEngine,
    setWorld,
    setRender,
    setRunnerInstance,
    setPlayer,
    setGameDimensions,
    setPlayerImageElement,
    setGameInitialized,
    gameWidth,
    gameHeight,
    player,
    engine,
    world,
    render,
    runnerInstance,
    enemies,
    projectiles,
    xpOrbs,
    playerHealth,
    playerXP,
    playerLevel,
    xpToNextLevel,
    projectileDamage,
    shootInterval,
    playerSpeed,
    xpOrbPickupRadius,
    gameOver,
    gamePausedForUpgrade,
    playerIsInvincible,
    invincibilityTimerId,
    availableUpgrades,
    audioMusic,
    audioPlayerHit,
    audioEnemyDie,
    audioPickup,
    updatePlayerHealth,
    updatePlayerXP,
    updatePlayerLevel,
    updateXpToNextLevel,
    setGameOver,
    setGamePausedForUpgrade,
    setPlayerInvincible,
    setInvincibilityTimer,
    setAvailableUpgrades,
    incrementEnemyKillCount,
    updateRunTimer,
    resetRunTimer,
    setIntervals,
    enemySpawnIntervalId,
    shootIntervalId,
    healthRegenIntervalId,
    currentPlayerHealthRegenInterval,
    currentPlayerHealthRegenAmount
} from './gameState.js';

const { Engine, Render, Runner, World, Bodies, Body, Composite, Events } = Matter;

// Initialize the game
export function initializeGame() {
    console.log("Initializing Bufo Blaster with Matter.js!");

    resetRunTimer(); // Start the run timer

    // Set canvas dimensions
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    setGameDimensions(GAME_CONFIG.GAME_WIDTH, GAME_CONFIG.GAME_HEIGHT);
    canvas.width = gameWidth;
    canvas.height = gameHeight;

    // Setup player image element
    const playerImageElement = document.getElementById('playerImageElement');
    if (!playerImageElement) {
        console.error('Player image element not found!');
        return;
    }
    playerImageElement.src = ASSET_URLS.PLAYER_SPRITE;
    playerImageElement.style.width = (GAME_CONFIG.PLAYER_RADIUS * 2) + 'px';
    playerImageElement.style.height = (GAME_CONFIG.PLAYER_RADIUS * 2) + 'px';
    playerImageElement.style.display = 'block';
    setPlayerImageElement(playerImageElement);

    // Create Matter.js engine and world
    const newEngine = Engine.create({ gravity: { y: 0 } });
    const newWorld = newEngine.world;
    setEngine(newEngine);
    setWorld(newWorld);

    // Create renderer
    const newRender = Render.create({
        canvas: canvas,
        engine: newEngine,
        options: {
            width: gameWidth,
            height: gameHeight,
            wireframes: false,
            background: 'transparent'
        }
    });
    setRender(newRender);

    // Create player
    const newPlayer = createPlayerBody();
    setPlayer(newPlayer);
    World.add(newWorld, newPlayer);

    // Add boundaries (walls)
    const wallThickness = 50;
    World.add(newWorld, [
        Bodies.rectangle(gameWidth / 2, -wallThickness / 2, gameWidth, wallThickness, { isStatic: true, label: 'wall-top' }),
        Bodies.rectangle(gameWidth / 2, gameHeight + wallThickness / 2, gameWidth, wallThickness, { isStatic: true, label: 'wall-bottom' }),
        Bodies.rectangle(-wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, { isStatic: true, label: 'wall-left' }),
        Bodies.rectangle(gameWidth + wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, { isStatic: true, label: 'wall-right' })
    ]);

    // Create and run the runner
    const newRunner = Runner.create();
    newRunner.isFixed = true;
    setRunnerInstance(newRunner);
    
    Render.run(newRender);
    newEngine.timing.timeScale = GAME_CONFIG.TIME_SCALE;
    Runner.run(newRunner, newEngine);

    // Initialize audio
    initializeAudio();

    // Setup input controls
    setupKeyboardControls();
    selectPrimaryGamepad();

    // Setup event listeners
    setupEventListeners();

    // Start game intervals
    startGameIntervals();

    // Start the main game tick loop
    requestAnimationFrame(gameTick);

    setGameInitialized(true);
    scaleGameContainer();
    window.addEventListener('resize', scaleGameContainer);

    console.log("Game initialized successfully!");
}

// Setup all Matter.js event listeners
function setupEventListeners() {
    // Player image position sync
    Events.on(engine, 'afterUpdate', function() {
        import('./gameState.js').then(({ player, playerImageElement }) => {
            if (player && playerImageElement) {
                const imageWidth = playerImageElement.offsetWidth || (GAME_CONFIG.PLAYER_RADIUS * 2);
                const imageHeight = playerImageElement.offsetHeight || (GAME_CONFIG.PLAYER_RADIUS * 2);

                playerImageElement.style.left = (player.position.x - imageWidth / 2) + 'px';
                playerImageElement.style.top = (player.position.y - imageHeight / 2) + 'px';
                playerImageElement.style.transform = `rotate(${player.angle}rad)`;
            }
        });
    });

    // Player movement
    Events.on(engine, 'beforeUpdate', () => {
        if (!player || gamePausedForUpgrade || gameOver) return;

        const { velocityX, velocityY } = getMovementInput();
        applyPlayerMovement(velocityX, velocityY);
    });

    // Game logic updates
    Events.on(engine, 'beforeUpdate', () => {
        if (gameOver || gamePausedForUpgrade) {
            updateRunTimer(); // Still update timer during pause
            return;
        }

        updateRunTimer();
        updateEnemyMovement();
        cleanupOffScreenEntities();
        updateXPOrbMagnetism();
    });

    // Collision handling
    Events.on(engine, 'collisionStart', handleCollisions);

    // UI rendering
    Events.on(render, 'afterRender', () => {
        const context = render.canvas.getContext('2d');
        renderUI(context);
    });
}

// Handle all collision events
function handleCollisions(event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Player-Enemy collision
        handlePlayerEnemyCollision(bodyA, bodyB);
        
        // Projectile-Enemy collision
        handleProjectileEnemyCollision(bodyA, bodyB);
        
        // Player-XP Orb collision
        handlePlayerXPOrbCollision(bodyA, bodyB);
    }
}

// Handle player-enemy collisions
function handlePlayerEnemyCollision(bodyA, bodyB) {
    let playerBody, enemyBody;

    if (bodyA.label === 'player' && bodyB.label === 'enemy') {
        playerBody = bodyA;
        enemyBody = bodyB;
    } else if (bodyB.label === 'player' && bodyA.label === 'enemy') {
        playerBody = bodyB;
        enemyBody = bodyA;
    }

    if (playerBody && enemyBody && !playerIsInvincible) {
        const newHealth = playerHealth - GAME_CONFIG.ENEMY_CONTACT_DAMAGE;
        updatePlayerHealth(newHealth);
        
        // Play hit sound
        if (audioPlayerHit) {
            audioPlayerHit.currentTime = 0;
            audioPlayerHit.play().catch(e => console.warn("Player hit sound play failed:", e));
        }

        // Set invincibility
        setPlayerInvincible(true);
        if (invincibilityTimerId) clearTimeout(invincibilityTimerId);
        
        const timerId = setTimeout(() => {
            setPlayerInvincible(false);
        }, GAME_CONFIG.INVINCIBILITY_DURATION);
        setInvincibilityTimer(timerId);

        if (newHealth <= 0 && !gameOver) {
            triggerGameOver();
        }
    }
}

// Handle projectile-enemy collisions
function handleProjectileEnemyCollision(bodyA, bodyB) {
    let projectileBody, enemyBody;

    if (bodyA.label === 'projectile' && bodyB.label === 'enemy') {
        projectileBody = bodyA;
        enemyBody = bodyB;
    } else if (bodyB.label === 'projectile' && bodyA.label === 'enemy') {
        projectileBody = bodyB;
        enemyBody = bodyA;
    }

    if (projectileBody && enemyBody) {
        // Damage enemy
        enemyBody.health -= projectileDamage;

        // Remove projectile
        const projIndex = projectiles.indexOf(projectileBody);
        if (projIndex > -1) projectiles.splice(projIndex, 1);
        Composite.remove(world, projectileBody);

        // Check if enemy is dead
        if (enemyBody.health <= 0) {
            // Play death sound
            if (audioEnemyDie) {
                audioEnemyDie.currentTime = 0;
                audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
            }

            // Create XP orb
            createXPOrb(enemyBody.position.x, enemyBody.position.y);
            incrementEnemyKillCount();

            // Remove enemy
            const enemyIndex = enemies.indexOf(enemyBody);
            if (enemyIndex > -1) enemies.splice(enemyIndex, 1);
            Composite.remove(world, enemyBody);
        }
    }
}

// Handle player-XP orb collisions
function handlePlayerXPOrbCollision(bodyA, bodyB) {
    let playerBody, xpOrbBody;

    if (bodyA.label === 'player' && bodyB.label === 'xpOrb') {
        playerBody = bodyA;
        xpOrbBody = bodyB;
    } else if (bodyB.label === 'player' && bodyA.label === 'xpOrb') {
        playerBody = bodyB;
        xpOrbBody = bodyA;
    }

    if (playerBody && xpOrbBody) {
        // Add XP
        const newXP = playerXP + 5;
        updatePlayerXP(newXP);
        
        // Play pickup sound
        if (audioPickup) {
            audioPickup.currentTime = 0;
            audioPickup.play().catch(e => console.error("Error playing pickup sound:", e));
        }

        // Remove XP orb
        const orbIndex = xpOrbs.indexOf(xpOrbBody);
        if (orbIndex > -1) xpOrbs.splice(orbIndex, 1);
        Composite.remove(world, xpOrbBody);

        // Check for level up
        if (newXP >= xpToNextLevel && !gamePausedForUpgrade) {
            const newLevel = playerLevel + 1;
            const remainingXP = newXP - xpToNextLevel;
            const newXPToNext = Math.floor(xpToNextLevel * 1.7);
            
            updatePlayerLevel(newLevel);
            updatePlayerXP(remainingXP);
            updateXpToNextLevel(newXPToNext);
            
            console.log(`Level Up! New Level: ${newLevel}, XP for next: ${newXPToNext}`);
            
            setGamePausedForUpgrade(true);
            if (runnerInstance) Runner.stop(runnerInstance);
            if (audioMusic) audioMusic.pause();
            
            presentUpgradeOptions();
        }
    }
}

// Start all game intervals
function startGameIntervals() {
    // Enemy spawning
    const enemySpawnId = setInterval(spawnEnemy, 267);
    
    // Shooting
    const shootId = setInterval(shootProjectile, shootInterval);
    
    // Health regeneration
    const healthRegenId = setInterval(regeneratePlayerHealth, currentPlayerHealthRegenInterval);
    
    setIntervals(enemySpawnId, shootId, healthRegenId);
}

// Trigger game over
export function triggerGameOver() {
    if (gameOver) return;

    setGameOver(true);
    console.log("GAME OVER");

    // Stop game activities
    if (runnerInstance) {
        Runner.stop(runnerInstance);
        console.log("Matter.js runner stopped.");
    }
    
    // Clear all intervals
    if (enemySpawnIntervalId) clearInterval(enemySpawnIntervalId);
    if (shootIntervalId) clearInterval(shootIntervalId);
    if (healthRegenIntervalId) clearInterval(healthRegenIntervalId);
    setIntervals(null, null, null);
}

// Regenerate player health
export function regeneratePlayerHealth() {
    if (gameOver || gamePausedForUpgrade || !player || playerHealth <= 0) {
        return;
    }

    if (playerHealth < DEFAULT_GAME_SETTINGS.playerHealth) {
        const newHealth = Math.min(DEFAULT_GAME_SETTINGS.playerHealth, playerHealth + currentPlayerHealthRegenAmount);
        updatePlayerHealth(newHealth);
    }
}

// Main game tick function
export function gameTick() {
    if (gamePausedForUpgrade && availableUpgrades.length > 0) {
        pollGamepadForUpgradeMenu();
    } else if (gameOver) {
        if (handleGameOverInput()) {
            resetGame();
        }
    }
    
    requestAnimationFrame(gameTick);
}

// Reset game to initial state
export function resetGame() {
    console.log("Resetting game...");

    resetRunTimer();

    // Reset player stats
    updatePlayerHealth(DEFAULT_GAME_SETTINGS.playerHealth);
    updatePlayerXP(DEFAULT_GAME_SETTINGS.playerXP);
    updatePlayerLevel(DEFAULT_GAME_SETTINGS.playerLevel);
    updateXpToNextLevel(DEFAULT_GAME_SETTINGS.xpToNextLevel);
    // Reset other stats through gameState setters...

    // Clear dynamic objects
    [...enemies, ...projectiles, ...xpOrbs].forEach(obj => {
        if (obj && world && Composite.get(world, obj.id, obj.type)) {
            World.remove(world, obj);
        }
    });
    enemies.length = 0;
    projectiles.length = 0;
    xpOrbs.length = 0;

    // Reset player position
    if (player) {
        Body.setPosition(player, { x: gameWidth / 2, y: gameHeight / 2 });
        Body.setVelocity(player, { x: 0, y: 0 });
        Body.setAngle(player, 0);
    }

    // Reset game state flags
    setGameOver(false);
    setGamePausedForUpgrade(false);
    setAvailableUpgrades([]);

    // Restart intervals
    startGameIntervals();

    // Ensure game runner is active
    if (runnerInstance && engine) {
        engine.timing.timeScale = GAME_CONFIG.TIME_SCALE;
        Runner.run(runnerInstance, engine);
    }

    // Resume music
    if (audioMusic && audioMusic.paused) {
        audioMusic.play().catch(e => console.error("Error resuming music on reset:", e));
    }

    console.log("Game reset complete.");
} 