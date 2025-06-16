// Game Core System
import { GAME_CONFIG, COLLISION_CATEGORIES, ASSET_URLS, DEFAULT_GAME_SETTINGS, CHARACTERS, ENEMY_TYPES } from './constants.js';
import { initializeAudio, scaleGameContainer } from './assetLoader.js';
import { setupKeyboardControls, selectPrimaryGamepad, setupGamepadEventListeners, getMovementInput, pollGamepadForUpgradeMenu, handleGameOverInput, handleCharacterSelectionInput, handlePauseInput } from './input.js';
import { createPlayerBody, spawnEnemy, shootProjectile, updateEnemyMovement, cleanupOffScreenEntities, updateXPOrbMagnetism, applyPlayerMovement, createXPOrb, createXPOrbsForEnemy, applyStabBufoAura, castStarfall, updateStarfallProjectiles, updateConfusedEnemyMovement, initializeGooseOrbit, updateGooseOrbit, updateConvertedAllies, updateSpecialEnemyEffects, updateMegaBossAbilities, cleanupMegaBossEntities } from './entities.js';
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
    starfallProjectiles,
    orbitingGeese,
    convertedAllies,
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
    gamePaused,
    playerIsInvincible,
    invincibilityTimerId,
    availableUpgrades,
    characterSelectionActive,
    gameStarted,
    audioMusic,
    audioPlayerHit,
    audioEnemyDie,
    audioPickup,
    updatePlayerHealth,
    updatePlayerXP,
    updatePlayerLevel,
    updateXpToNextLevel,
    updateProjectileDamage,
    updateShootInterval,
    updatePlayerSpeed,
    updateXpOrbPickupRadius,
    updateHealthRegenInterval,
    setLastAuraTickTime,
    setAuraCooldown,
    setAuraDamage,
    setAuraKnockback,
    setStarfallCooldown,
    setStarfallDamage,
    setStarfallCount,
    setGooseOrbitSpeedMultiplier,
    setCharacterSelectionActive,
    setGameStarted,
    selectedCharacter,
    playerImageElement,
    setGameOver,
    setGamePausedForUpgrade,
    setGamePaused,
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
    currentPlayerHealthRegenAmount,
    playerStunned,
    playerSpeedMultiplier,
    abilityCooldownMultiplier,
    megaBossEmpowermentActive,
    setPlayerStunned,
    setStunEndTime,
    setAbilityCooldownMultiplier
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
    setupGamepadEventListeners();
    selectPrimaryGamepad();

    // Setup event listeners
    setupEventListeners();

    // Don't start game intervals or game loop until character is selected
    // startGameIntervals(); // Will be called after character selection
    
    // Start the main game tick loop (handles character selection too)
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
        if (!player || gamePausedForUpgrade || gamePaused || gameOver || characterSelectionActive) return;

        const { velocityX, velocityY } = getMovementInput();
        applyPlayerMovement(velocityX, velocityY);
    });

    // Game logic updates
    Events.on(engine, 'beforeUpdate', () => {
        if (gameOver || gamePausedForUpgrade || gamePaused || characterSelectionActive) {
            if (!characterSelectionActive && !gamePaused) {
                updateRunTimer(); // Still update timer during upgrade pause, but not during global pause or character selection
            }
            return;
        }

        updateRunTimer();
        updateEnemyMovement();
        updateSpecialEnemyEffects(); // Handle special enemy effects like ice bufo slow
        updateMegaBossAbilities(); // Handle mega boss special abilities
        updateConfusedEnemyMovement(); // Handle confused enemies separately
        cleanupOffScreenEntities();
        cleanupMegaBossEntities(); // Clean up mega boss projectiles
        updateXPOrbMagnetism();
        
        // Character-specific abilities
        if (selectedCharacter.id === 'stab') {
            applyStabBufoAura();
        } else if (selectedCharacter.id === 'wizard') {
            castStarfall(); // Auto-cast when enemies are in range
            updateStarfallProjectiles();
        } else if (selectedCharacter.id === 'goose') {
            updateGooseOrbit();
            updateConvertedAllies();
        }
    });

    // Collision handling
    Events.on(engine, 'collisionStart', handleCollisions);

    // UI rendering
    Events.on(render, 'afterRender', () => {
        const context = render.canvas.getContext('2d');
        renderUI(context);
    });

    // Mouse click handlers
    setupMouseEventListeners();
}

// Setup mouse event listeners
function setupMouseEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        // Handle character selection clicks
        if (characterSelectionActive) {
            handleCharacterSelectionClick(mouseX, mouseY);
        }
        
        // Handle upgrade menu clicks
        if (gamePausedForUpgrade && availableUpgrades.length > 0) {
            const upgradeClicked = handleUpgradeMenuClick(mouseX, mouseY);
            if (upgradeClicked) {
                event.preventDefault();
                event.stopPropagation();
                return; // Don't process any other click handlers
            }
        }
        
        // Handle game over restart click
        if (gameOver) {
            handleGameOverClick(mouseX, mouseY);
        }
        
        // Handle pause toggle click during normal gameplay
        if (!characterSelectionActive && !gameOver && !gamePausedForUpgrade) {
            togglePause();
        }
    });

    // Add mouse move event listener for hover effects
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        // Handle character selection hover
        if (characterSelectionActive) {
            handleCharacterSelectionHover(mouseX, mouseY);
        }
        
        // Handle upgrade menu hover
        if (gamePausedForUpgrade && availableUpgrades.length > 0) {
            handleUpgradeMenuHover(mouseX, mouseY);
        }
    });
}

// Handle upgrade menu mouse clicks
function handleUpgradeMenuClick(mouseX, mouseY) {
    const boxWidth = 200;
    const boxHeight = 100;
    const spacing = 20;
    const totalHeight = (boxHeight + spacing) * availableUpgrades.length - spacing;
    let startY = (gameHeight - totalHeight) / 2;

    for (let index = 0; index < availableUpgrades.length; index++) {
        const upgrade = availableUpgrades[index];
        const boxY = startY + index * (boxHeight + spacing);
        const boxX = (gameWidth - boxWidth) / 2;
        
        // Check if click is within this upgrade box
        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            
            // Apply the upgrade
            if (upgrade && typeof upgrade.apply === 'function') {
                upgrade.apply();
            }
            
            // Resume game
            setGamePausedForUpgrade(false);
            setAvailableUpgrades([]);
            if (playerHealth > 0 && runnerInstance && engine) {
                const { Runner } = Matter;
                Runner.run(runnerInstance, engine);
                if (audioMusic && audioMusic.paused) {
                    audioMusic.play().catch(e => console.error("Error resuming music:", e));
                }
            }
            
            return true; // Indicate that an upgrade was clicked
        }
    }
    
    return false; // No upgrade was clicked
}

// Handle upgrade menu mouse hover
function handleUpgradeMenuHover(mouseX, mouseY) {
    const boxWidth = 200;
    const boxHeight = 100;
    const spacing = 20;
    const totalHeight = (boxHeight + spacing) * availableUpgrades.length - spacing;
    let startY = (gameHeight - totalHeight) / 2;

    for (let index = 0; index < availableUpgrades.length; index++) {
        const boxY = startY + index * (boxHeight + spacing);
        const boxX = (gameWidth - boxWidth) / 2;
        
        // Check if mouse is within this upgrade box
        if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
            mouseY >= boxY && mouseY <= boxY + boxHeight) {
            
            // Update selection index to highlight this upgrade
            import('./gameState.js').then(({ setCurrentUpgradeSelectionIndex }) => {
                setCurrentUpgradeSelectionIndex(index);
            });
            return; // Found the hovered upgrade, no need to check others
        }
    }
}

// Handle character selection mouse hover
function handleCharacterSelectionHover(mouseX, mouseY) {
    const cardWidth = 300;
    const cardHeight = 400;
    const spacing = 50;
    const charactersArray = Object.values(CHARACTERS);
    const totalWidth = (cardWidth * charactersArray.length) + (spacing * (charactersArray.length - 1));
    const startX = (gameWidth - totalWidth) / 2;
    const cardY = 150;

    charactersArray.forEach((character, index) => {
        const cardX = startX + index * (cardWidth + spacing);
        
        // Check if mouse is within this character card
        if (mouseX >= cardX && mouseX <= cardX + cardWidth &&
            mouseY >= cardY && mouseY <= cardY + cardHeight) {
            
            // Update selected character to highlight this one
            import('./gameState.js').then(({ setSelectedCharacter }) => {
                setSelectedCharacter(character);
            });
            return; // Found the hovered character, no need to check others
        }
    });
}

// Handle character selection mouse clicks
function handleCharacterSelectionClick(mouseX, mouseY) {
    const cardWidth = 300;
    const cardHeight = 400;
    const spacing = 50;
    const charactersArray = Object.values(CHARACTERS);
    const totalWidth = (cardWidth * charactersArray.length) + (spacing * (charactersArray.length - 1));
    const startX = (gameWidth - totalWidth) / 2;
    const cardY = 150;

    charactersArray.forEach((character, index) => {
        const cardX = startX + index * (cardWidth + spacing);
        
        // Check if click is within this character card
        if (mouseX >= cardX && mouseX <= cardX + cardWidth &&
            mouseY >= cardY && mouseY <= cardY + cardHeight) {
            
            // Select this character and start the game
            import('./gameState.js').then(({ setSelectedCharacter }) => {
                setSelectedCharacter(character);
                startGameAfterCharacterSelection();
            });
        }
    });
}

// Handle game over screen mouse clicks
function handleGameOverClick(mouseX, mouseY) {
    // Simple click anywhere to restart for now
    resetGame();
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
        
        // Starfall-Enemy collision
        handleStarfallEnemyCollision(bodyA, bodyB);
        
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
        // Use enemy's contact damage or default
        let damage = enemyBody.contactDamage || GAME_CONFIG.ENEMY_CONTACT_DAMAGE;
        
        // Apply mega boss empowerment damage bonus (but not to mega boss itself)
        if (megaBossEmpowermentActive && enemyBody.enemyType !== ENEMY_TYPES.MEGA_BOSS_BUFO) {
            damage = Math.floor(damage * GAME_CONFIG.MEGA_BOSS_EMPOWERMENT_DAMAGE_BONUS);
        }
        
        const newHealth = playerHealth - damage;
        updatePlayerHealth(newHealth);
        
        // Play hit sound
        if (audioPlayerHit) {
            audioPlayerHit.currentTime = 0;
            audioPlayerHit.play().catch(e => console.warn("Player hit sound play failed:", e));
        }

        // Apply special enemy effects
        const currentTime = Date.now();
        
        if (enemyBody.enemyType === ENEMY_TYPES.BUFF_BUFO) {
            // Stun the player for 1 second
            setPlayerStunned(true);
            setStunEndTime(currentTime + GAME_CONFIG.BUFF_BUFO_STUN_DURATION);
        } else if (enemyBody.enemyType === ENEMY_TYPES.GAVEL_BUFO) {
            // Apply knockback to player
            const dx = playerBody.position.x - enemyBody.position.x;
            const dy = playerBody.position.y - enemyBody.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const knockbackX = (dx / distance) * GAME_CONFIG.GAVEL_BUFO_KNOCKBACK_FORCE;
                const knockbackY = (dy / distance) * GAME_CONFIG.GAVEL_BUFO_KNOCKBACK_FORCE;
                Matter.Body.setVelocity(playerBody, { x: knockbackX, y: knockbackY });
            }
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
            console.log(`Enemy killed by projectile! Type: ${enemyBody.enemyType || 'undefined'}, Health was: ${enemyBody.health}`);
            
            // Debug logging for boss bufos
            if (enemyBody.enemyType === 'boss_bufo') {
                console.log('Boss Bufo killed by projectile! Creating XP orb...');
            }
            
            // Play death sound
            if (audioEnemyDie) {
                audioEnemyDie.currentTime = 0;
                audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
            }

            // Create XP orb
            createXPOrbsForEnemy(enemyBody.position.x, enemyBody.position.y, enemyBody.enemyType);
            incrementEnemyKillCount();

            // Remove enemy
            const enemyIndex = enemies.indexOf(enemyBody);
            if (enemyIndex > -1) enemies.splice(enemyIndex, 1);
            Composite.remove(world, enemyBody);
        }
    }
}

// Handle starfall-enemy collisions
function handleStarfallEnemyCollision(bodyA, bodyB) {
    let starfallBody, enemyBody;

    if (bodyA.label === 'starfall' && bodyB.label === 'enemy') {
        starfallBody = bodyA;
        enemyBody = bodyB;
    } else if (bodyB.label === 'starfall' && bodyA.label === 'enemy') {
        starfallBody = bodyB;
        enemyBody = bodyA;
    }

    if (starfallBody && enemyBody) {
        const currentTime = Date.now();
        
        // Check if this starfall has already exploded recently (prevent multiple rapid explosions)
        if (starfallBody.lastExplosionTime && currentTime - starfallBody.lastExplosionTime < 500) {
            return; // Don't explode again so soon
        }
        
        // Mark explosion time
        starfallBody.lastExplosionTime = currentTime;
        
        // Trigger AOE explosion at starfall location
        import('./entities.js').then(({ applyStarfallAOE, starfallProjectiles }) => {
            const impactX = starfallBody.position.x;
            const impactY = starfallBody.position.y;
            const damage = starfallBody.damage || 2;
            const confusionDuration = starfallBody.confusionDuration || 2000;
            
            // Apply AOE damage using the existing function
            applyStarfallAOE(impactX, impactY, damage, confusionDuration, currentTime);
            
            // Remove starfall projectile after a short delay to allow visual feedback
            setTimeout(() => {
                const starfallIndex = starfallProjectiles.indexOf(starfallBody);
                if (starfallIndex > -1) starfallProjectiles.splice(starfallIndex, 1);
                Composite.remove(world, starfallBody);
            }, 100); // 100ms delay
            
            console.log(`Starfall collision triggered at (${impactX.toFixed(0)}, ${impactY.toFixed(0)})`);
        });
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
    
    // Shooting - DISABLED for Stab Bufo (melee character)
    // const shootId = setInterval(shootProjectile, shootInterval);
    const shootId = null; // No shooting for melee bruiser
    
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

// Toggle global pause
export function togglePause() {
    if (gameOver || characterSelectionActive || gamePausedForUpgrade) {
        return; // Don't allow pause during these states
    }

    const newPauseState = !gamePaused;
    setGamePaused(newPauseState);

    if (newPauseState) {
        // Pausing the game
        if (runnerInstance) {
            const { Runner } = Matter;
            Runner.stop(runnerInstance);
        }
        if (audioMusic && !audioMusic.paused) {
            audioMusic.pause();
        }
        console.log("Game paused");
    } else {
        // Resuming the game
        if (runnerInstance && engine) {
            const { Runner } = Matter;
            Runner.run(runnerInstance, engine);
        }
        if (audioMusic && audioMusic.paused) {
            audioMusic.play().catch(e => console.error("Error resuming music:", e));
        }
        console.log("Game resumed");
    }
}

// Regenerate player health
export function regeneratePlayerHealth() {
    if (gameOver || gamePausedForUpgrade || gamePaused || !player || playerHealth <= 0) {
        return;
    }

    const maxHealth = selectedCharacter ? selectedCharacter.health : DEFAULT_GAME_SETTINGS.playerHealth;
    if (playerHealth < maxHealth) {
        const newHealth = Math.min(maxHealth, playerHealth + currentPlayerHealthRegenAmount);
        updatePlayerHealth(newHealth);
    }
}

// Main game tick function
export function gameTick() {
    if (characterSelectionActive) {
        // Handle character selection input
        if (handleCharacterSelectionInput()) {
            startGameAfterCharacterSelection();
        }
    } else if (gamePausedForUpgrade && availableUpgrades.length > 0) {
        pollGamepadForUpgradeMenu();
    } else if (gameOver) {
        if (handleGameOverInput()) {
            resetGame();
        }
    } else if (!characterSelectionActive && !gameOver && !gamePausedForUpgrade) {
        // Handle pause input during normal gameplay
        if (handlePauseInput()) {
            togglePause();
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
    updateProjectileDamage(DEFAULT_GAME_SETTINGS.projectileDamage);
    updateShootInterval(DEFAULT_GAME_SETTINGS.shootInterval);
    updatePlayerSpeed(DEFAULT_GAME_SETTINGS.playerSpeed);
    updateXpOrbPickupRadius(DEFAULT_GAME_SETTINGS.xpOrbPickupRadius);
    updateHealthRegenInterval(GAME_CONFIG.PLAYER_HEALTH_REGEN_INTERVAL);
    setLastAuraTickTime(0); // Reset aura timer
    
    // Reset aura abilities to base values
    setAuraCooldown(GAME_CONFIG.STAB_BUFO_AURA_TICK_INTERVAL_MS);
    setAuraDamage(GAME_CONFIG.STAB_BUFO_AURA_DAMAGE_PER_TICK);
    setAuraKnockback(GAME_CONFIG.STAB_BUFO_AURA_KNOCKBACK_FORCE);
    
    // Reset starfall abilities to base values
    setStarfallCooldown(GAME_CONFIG.WIZARD_STARFALL_COOLDOWN);
    setStarfallDamage(GAME_CONFIG.WIZARD_STARFALL_DAMAGE);
    setStarfallCount(GAME_CONFIG.WIZARD_STARFALL_COUNT);
    
    // Reset goose abilities to base values
    setGooseOrbitSpeedMultiplier(1.0);
    
    // Reset special enemy effects
    setPlayerStunned(false);
    setStunEndTime(0);
    import('./gameState.js').then(({ setPlayerSpeedMultiplier, setAbilityCooldownMultiplier }) => {
        setPlayerSpeedMultiplier(1.0);
        setAbilityCooldownMultiplier(1.0);
    });

    // Clear dynamic objects
    [...enemies, ...projectiles, ...xpOrbs, ...starfallProjectiles, ...convertedAllies].forEach(obj => {
        if (obj && world && Composite.get(world, obj.id, obj.type)) {
            World.remove(world, obj);
        }
    });
    enemies.length = 0;
    projectiles.length = 0;
    xpOrbs.length = 0;
    starfallProjectiles.length = 0;
    orbitingGeese.length = 0;
    convertedAllies.length = 0;
    
    // Clear mega boss arrays
    import('./gameState.js').then(({ 
        megaBossLasers, 
        megaBossLavaCracks, 
        setMegaBossEmpowermentActive 
    }) => {
        megaBossLasers.length = 0;
        megaBossLavaCracks.length = 0;
        setMegaBossEmpowermentActive(false);
    });

    // Reset player position
    if (player) {
        Body.setPosition(player, { x: gameWidth / 2, y: gameHeight / 2 });
        Body.setVelocity(player, { x: 0, y: 0 });
        Body.setAngle(player, 0);
    }

    // Reset game state flags
    setGameOver(false);
    setGamePausedForUpgrade(false);
    setGamePaused(false);
    setAvailableUpgrades([]);
    
    // Go back to character selection
    setCharacterSelectionActive(true);
    setGameStarted(false);

    // Don't restart intervals - they'll start after character selection
    // startGameIntervals();

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

// Start the actual game after character selection
export function startGameAfterCharacterSelection() {
    console.log(`Starting game with ${selectedCharacter.name}...`);
    
    // Update player stats based on selected character
    updatePlayerHealth(selectedCharacter.health);
    updatePlayerSpeed(selectedCharacter.speed);
    
    // Update player sprite
    if (playerImageElement) {
        playerImageElement.src = selectedCharacter.sprite;
    }
    
    // Character-specific initialization
    if (selectedCharacter.id === 'goose') {
        initializeGooseOrbit();
    }
    
    // Mark character selection as complete
    setCharacterSelectionActive(false);
    setGameStarted(true);
    
    // Start game intervals
    startGameIntervals();
    
    // Reset run timer to start fresh
    resetRunTimer();
    
    console.log(`Game started successfully with ${selectedCharacter.name}!`);
} 