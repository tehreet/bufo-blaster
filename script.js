// Matter.js module aliases
const { Engine, Render, Runner, World, Bodies, Body, Composite, Events } = Matter;

// Function to scale the game container to fit the window
function scaleGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer || typeof gameWidth === 'undefined' || typeof gameHeight === 'undefined') {
        // console.warn("scaleGameContainer called before game dimensions are set or container not found.");
        return;
    }

    const scaleX = window.innerWidth / gameWidth;
    const scaleY = window.innerHeight / gameHeight;
    let scale = Math.min(scaleX, scaleY);
    scale = Math.max(scale, 0.1); // Prevent scale from being 0 or negative

    if (gameContainer && gameContainer.style) {
        gameContainer.style.transformOrigin = 'center center'; // Ensure scaling is from the center
        gameContainer.style.transform = `scale(${scale})`;
    } else {
        console.error('gameContainer or gameContainer.style is null or undefined during scaling.');
    }
}

// Global game instances and state
let engine;
let world;
let render;
let runnerInstance;
let player;
let gameWidth;
let gameHeight;
let playerImageElement; // For the player's <img> tag

// Image Preloading
// imagesToLoadCount will now only count enemy images, player GIF is handled by <img> tag
let imagesToLoadCount = 0; 
let imagesLoadedCount = 0;
const imageAssets = {}; // Still used for enemy images
let projectiles = []; // Array to hold active projectiles
let gameInitialized = false;
let enemySpawnIntervalId; // Declare globally

// Player GIF animation state (gifler related - REMOVED)
// let currentPlayerFrameCanvas = null; 
// let playerGifLoaded = false;
// let playerGifSetupStarted = false;
// let playerGifSetupComplete = false;

// Asset URLs
const playerSpriteUrl = 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/bufo-stab.gif';
const enemySpriteBaseUrl = 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/';
const enemyImageFiles = [
    'bufo-angry.png',
    'awesomebufo.png', // Replaced bufo-cool.gif
    'bufo-anime-glasses.png', // Replaced bufo-think.gif
    'bufo-evil.png',
    'bufo-dizzy.gif'
];

function triggerGameLoadCheck() {
    console.log(`Load check: ${imagesLoadedCount} / ${imagesToLoadCount}, Game Initialized: ${gameInitialized}`);
    // Ensure all assets are accounted for and game hasn't started yet
    if (imagesLoadedCount >= imagesToLoadCount && !gameInitialized) {
        console.log('All assets loaded or timed out, initializing game.');
        initializeGame();
        gameInitialized = true; // Mark that game has been initialized
        scaleGameContainer(); // Initial scaling after game dimensions are set
        window.addEventListener('resize', scaleGameContainer); // Rescale on window resize
    }
}

function preloadImage(url, key) {
    imagesToLoadCount++;
    const img = new Image();
    img.src = url;
    img.onload = () => {
        imagesLoadedCount++;
        imageAssets[key] = img;
        console.log(`Loaded image: ${key} (${url})`);
        if (imagesLoadedCount === imagesToLoadCount) {
            // This logic is now in triggerGameLoadCheck()
        triggerGameLoadCheck();
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${key} (${url})`);
        imagesLoadedCount++; // Still count it to not block game start indefinitely
        // Optionally, you could use a placeholder for broken images
        if (imagesLoadedCount === imagesToLoadCount) {
            console.log('Finished attempting to load images, checking if game should start.');
            // This logic is now in triggerGameLoadCheck()
            triggerGameLoadCheck();
        }
    };
}


function loadEnemyAssets() {
    console.log("Loading enemy assets...");
    if (enemyImageFiles.length === 0) { // No enemy images to load
        triggerGameLoadCheck(); // Proceed to game load check
        return;
    }
    enemyImageFiles.forEach(file => {
        preloadImage(enemySpriteBaseUrl + file, file);
    });
}

function setupGameAssets() {
    console.log("Setting up game assets...");
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found during asset setup!');
        return;
    }
    loadEnemyAssets();
}

// Game setup constants (can be adjusted here if needed)
const INITIAL_CANVAS_WIDTH = 800;
const INITIAL_CANVAS_HEIGHT = 600;

// Collision Categories
const defaultCategory = 0x0001;
const playerCategory = 0x0002;
const enemyCategory = 0x0004;
const projectileCategory = 0x0008;

// Player setup
const playerRadius = 18; // Player's physical body radius (visual ~14px radius @ 0.35 scale of 80px sprite)
// const playerSpriteUrl = 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/bufo-stab.gif'; // Removed duplicate

let playerHealth = 100;
let playerXP = 0;
let playerLevel = 1;
let xpToNextLevel = 30;
let gamePausedForUpgrade = false;
let availableUpgrades = [];
let projectileDamage = 0.05; // Base projectile damage
let gameOver = false; // Tracks game over state
let playerSpeed = 2; // Player movement speed, consolidated global declaration
let shootInterval = 1000; // Time in ms between shots, consolidated global declaration

// player is already declared globally with 'let player;'

function createPlayerBody() {
    return Bodies.circle(gameWidth / 2, gameHeight / 2, playerRadius, {
    collisionFilter: { category: playerCategory, mask: defaultCategory | enemyCategory | projectileCategory },
    label: 'player',
    frictionAir: 0.085, // Air resistance for smoother movement
    density: 0.002,
    render: {
        // visible: false // Option 1: Make Matter.js skip rendering this body entirely
        // Option 2: Keep body visible for physics debug, but make its default rendering transparent
        fillStyle: 'transparent',
        strokeStyle: 'transparent',
        sprite: {
            // No texture here, so Matter won't draw its static sprite
            // xScale and yScale are not strictly needed here if we use 'visible: false'
            // but might be useful if we only made fill/stroke transparent.
            // For consistency with how we calculate draw size later, let's keep them.
            xScale: 0.35, 
            yScale: 0.35
        }
    }
});
} // Close createPlayerBody function

// World.add(world, player); // Removed misplaced call, player is added in initializeGame

// Add boundaries (walls) - THIS IS NOW HANDLED INSIDE initializeGame() TO ENSURE 'world' IS DEFINED
// const wallThickness = 50; 
// World.add(world, [
//     Bodies.rectangle(gameWidth / 2, -wallThickness / 2, gameWidth, wallThickness, { isStatic: true, label: 'wall-top' }), // Top
//     Bodies.rectangle(gameWidth / 2, gameHeight + wallThickness / 2, gameWidth, wallThickness, { isStatic: true, label: 'wall-bottom' }), // Bottom
//     Bodies.rectangle(-wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, { isStatic: true, label: 'wall-left' }), // Left
//     Bodies.rectangle(gameWidth + wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, { isStatic: true, label: 'wall-right' }) // Right
// ]);

// Run the renderer (will be called in initializeGame)
// Render.run(render);

// Create a runner (will be called in initializeGame)
// const runner = Runner.create();

// Run the engine (will be called in initializeGame)
// Runner.run(runner, engine);

// runnerInstance is already declared globally with 'let runnerInstance;'

// Helper function for text wrapping (for upgrade descriptions)
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

// Player Movement
// playerSpeed = 3; // Assignment removed, consolidated to global let declaration
// The canvas click listener for upgrades and restart is now handled by a single listener towards the end of the file.
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};

document.addEventListener('keydown', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
});

// Redundant global player movement 'beforeUpdate' event listener REMOVED.
// This logic is now correctly placed inside the initializeGame() function.

// Enemy Setup
// const enemySpriteBaseUrl = 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/'; // Removed duplicate
const enemyTypes = [
    { file: 'bufo-angry.png', scale: 0.35 }, // Matched to player scale
    { file: 'awesomebufo.png', scale: 0.35 }, // Matched to player scale
    { file: 'bufo-anime-glasses.png', scale: 0.35 }, // Matched to player scale
    { file: 'bufo-evil.png', scale: 0.35 }, // Matched to player scale
    { file: 'bufo-dizzy.gif', scale: 0.35 } // Matched to player scale
];
const enemies = [];
const enemyRadius = 10; // Enemy physical body radius (visual ~9-14px radius @ 0.22-0.35 scale of ~80px sprite)
const enemySpeed = 0.5; // Slower than player
const xpOrbRadius = 8;
const xpOrbs = [];

function spawnEnemy() {
    if (gamePausedForUpgrade || gameOver) return; // Check pause/game over state
    console.log('spawnEnemy function called - Entry'); // Consistent log
    const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    // Not logging randomEnemyType for now to reduce noise, assuming it's fine if we reach Bodies.circle

    const enemyImageAsset = imageAssets[randomEnemyType.file];
    // Not logging enemyImageAsset details for now, assuming it's fine if we reach Bodies.circle

    if (!enemyImageAsset || enemyImageAsset.complete === false || enemyImageAsset.naturalHeight === 0) {
        console.warn(`Enemy sprite not loaded or broken, skipping spawn: ${randomEnemyType.file}`);
        return; 
    }

    let x, y;
    const side = Math.floor(Math.random() * 4);
    const inset = enemyRadius * 3; // Spawn well inside the boundaries
    if (side === 0) { // Top
        x = Math.random() * (gameWidth - 2 * inset) + inset;
        y = inset;
    } else if (side === 1) { // Bottom
        x = Math.random() * (gameWidth - 2 * inset) + inset;
        y = gameHeight - inset;
    } else if (side === 2) { // Left
        x = inset;
        y = Math.random() * (gameHeight - 2 * inset) + inset;
    } else { // Right
        x = gameWidth - inset;
        y = Math.random() * (gameHeight - 2 * inset) + inset;
    }
    console.log('Calculated spawn position (x, y):', x, y, 'Inset:', inset); // This log is confirmed to be seen

    console.log('DEBUG SPAWN: Texture for enemy body:', enemyImageAsset.src, '(Type:', typeof enemyImageAsset.src, ')');
    let enemy;
    try {
        console.log('DEBUG SPAWN: Attempting Bodies.circle...');
        enemy = Bodies.circle(x, y, enemyRadius, {
            collisionFilter: { category: enemyCategory, mask: defaultCategory | playerCategory | projectileCategory },
            label: 'enemy',
            frictionAir: 0.01,
            render: {
                sprite: {
                    texture: enemyImageAsset.src, 
                    xScale: randomEnemyType.scale,
                    yScale: randomEnemyType.scale
                }
            },
            health: 20 
        });
        console.log('DEBUG SPAWN: Bodies.circle SUCCEEDED.');
    } catch (e) {
        console.error('DEBUG SPAWN: ERROR during Bodies.circle creation!', e);
        return; // Stop if body creation fails
    }

    if (!enemy) {
        console.error('DEBUG SPAWN: Enemy body is null/undefined after Bodies.circle, even without an exception.');
        return;
    }
    // console.log('Created enemy body:', enemy); // Covered by success log above for now

    enemies.push(enemy);
    World.add(world, enemy);
    console.log('DEBUG SPAWN: Enemy added to world. Label:', enemy.label, 'ID:', enemy.id);
}

// Enemy Spawning Interval - Handled in initializeGame and resetGame

// Projectile Setup
// const projectiles = []; // Removed redundant declaration, already declared with let globally
const projectileRadius = 5;
const projectileSpeed = 7;
// shootInterval = 1000; // Assignment removed, consolidated to global let declaration

function findNearestEnemy() {
    let nearestEnemy = null;
    let minDistanceSq = Infinity;

    enemies.forEach(enemy => {
        if (enemy) { // Ensure enemy exists
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

function shootProjectile() {
    if (gamePausedForUpgrade || gameOver || !player) return; // Check pause/game over state
    const targetEnemy = findNearestEnemy();
    if (!targetEnemy || !player) return; // No target or player doesn't exist

    const angle = Matter.Vector.angle(player.position, targetEnemy.position);
    
    const projectile = Bodies.circle(
        player.position.x,
        player.position.y,
        projectileRadius,
        {
            label: 'projectile',
            frictionAir: 0,
            density: 0.0005,
            damage: projectileDamage, // Add damage property to projectile
            collisionFilter: { category: projectileCategory, mask: enemyCategory }, // Only collides with enemies
            render: { fillStyle: 'yellow' }
        }
    );

    Matter.Body.setVelocity(projectile, {
        x: Math.cos(angle) * projectileSpeed,
        y: Math.sin(angle) * projectileSpeed
    });

    World.add(world, projectile);
    projectiles.push(projectile);
}

// Automatic Shooting Interval
let shootIntervalId = setInterval(shootProjectile, shootInterval);

// Enemy Spawning Interval - Store ID to clear/reset later if needed
// let enemySpawnIntervalId = setInterval(spawnEnemy, 2500); // This is now handled in initializeGame and resetGame


// UI Rendering logic moved into initializeGame's afterRender event.

// Upgrade Definitions
const allUpgrades = [
    {
        name: "Faster Shots",
        description: "Increases your attack speed.",
        apply: () => {
            shootInterval = Math.max(100, shootInterval * 0.85); // 15% faster, cap at 100ms
            clearInterval(shootIntervalId);
            shootIntervalId = setInterval(shootProjectile, shootInterval);
            console.log(`Upgrade: Faster Shots! New interval: ${shootInterval}ms`);
        }
    },
    {
        name: "More Damage",
        description: "Your projectiles deal more damage.",
        apply: () => {
            projectileDamage += 1;
            console.log(`Upgrade: More Damage! New damage: ${projectileDamage}`);
        }
    },
    {
        name: "Increased Speed",
        description: "Increases Bufo's movement speed.",
        apply: () => {
            playerSpeed += 0.5;
            console.log(`Upgrade: Increased Speed! New speed: ${playerSpeed}`);
        }
    },
    {
        name: "Health Pack",
        description: "Restores 25 health.",
        apply: () => {
            playerHealth = Math.min(100, playerHealth + 25); // Cap at max health (assuming 100)
            console.log(`Upgrade: Health Pack! Current health: ${playerHealth}`);
        }
    },
    {
        name: "XP Magnet",
        description: "Increases XP orb collection radius (visual only for now).",
        apply: () => {
            // This would ideally make xpOrbs move towards player or increase sensor radius
            // For now, just a placeholder effect
            console.log("Upgrade: XP Magnet! (Effect TBD)");
        }
    }
];

function presentUpgradeOptions(count = 3) {
    if (runnerInstance) Runner.stop(runnerInstance); // Pause the engine runner
    availableUpgrades = [];
    const shuffledUpgrades = [...allUpgrades].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(3, shuffledUpgrades.length); i++) { // Offer up to 3 upgrades
        availableUpgrades.push(shuffledUpgrades[i]);
    }
}

function initializeGame() {
    if (gameInitialized) return;
    console.log("Initializing Bufo Blaster with Matter.js!");

    // Set canvas dimensions first
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    gameWidth = 1600; // Increased map size
    gameHeight = 1000; // Increased map size
    canvas.width = gameWidth;
    canvas.height = gameHeight;

    // Get the player <img> element and set its source
    playerImageElement = document.getElementById('playerImageElement');
    if (!playerImageElement) {
        console.error('Player image element not found!');
        return;
    }
    playerImageElement.src = playerSpriteUrl;
    playerImageElement.style.width = (playerRadius * 2) + 'px'; // e.g., 80px
    playerImageElement.style.height = (playerRadius * 2) + 'px';
    playerImageElement.style.display = 'block'; // Make it visible

    engine = Engine.create({ gravity: { y: 0 } });
    world = engine.world;
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: gameWidth,
            height: gameHeight,
            wireframes: false,
            background: 'transparent' // Darker background
        }
    });

    // 4. Create Player Body (now that gameWidth/Height and world are ready)
    player = createPlayerBody();
    World.add(world, player);

    // Add boundaries (walls) - ensure they are added only once
    if (!Composite.allBodies(world).find(body => body.label === 'wall-top')) {
        const wallThickness = 50;
        World.add(world, [
            Bodies.rectangle(gameWidth / 2, -wallThickness / 2, gameWidth, wallThickness, { isStatic: true, label: 'wall-top' }),
            Bodies.rectangle(gameWidth / 2, gameHeight + wallThickness / 2, gameWidth, wallThickness, { isStatic: true, label: 'wall-bottom' }),
            Bodies.rectangle(-wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, { isStatic: true, label: 'wall-left' }),
            Bodies.rectangle(gameWidth + wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, { isStatic: true, label: 'wall-right' })
        ]);
    }

    // Create and run the runner (fixed: only one creation)
    runnerInstance = Runner.create(); 
    Render.run(render);
    Runner.run(runnerInstance, engine);

    // Event listener to update player <img> position and rotation after each physics update
    // Start enemy spawning
    if (enemySpawnIntervalId) clearInterval(enemySpawnIntervalId); // Clear existing interval if any
    enemySpawnIntervalId = setInterval(spawnEnemy, 267); // Spawn enemy every 800ms

    Matter.Events.on(engine, 'afterUpdate', function(event) {
        if (player && playerImageElement) {
            const imageWidth = playerImageElement.offsetWidth || (playerRadius * 2);
            const imageHeight = playerImageElement.offsetHeight || (playerRadius * 2);

            playerImageElement.style.left = (player.position.x - imageWidth / 2) + 'px';
            playerImageElement.style.top = (player.position.y - imageHeight / 2) + 'px';
            playerImageElement.style.transform = `rotate(${player.angle}rad)`;
        }
    });

    // Player movement logic - moved from global scope
    Matter.Events.on(engine, 'beforeUpdate', () => {
        if (!player || gamePausedForUpgrade || gameOver) return; // Ensure player exists and game is active

        let velocityX = 0;
        let velocityY = 0;

        if (keys.w || keys.ArrowUp) velocityY -= playerSpeed;
        if (keys.s || keys.ArrowDown) velocityY += playerSpeed;
        if (keys.a || keys.ArrowLeft) velocityX -= playerSpeed;
        if (keys.d || keys.ArrowRight) velocityX += playerSpeed;

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            const factor = Math.sqrt(2) / 2; // 1/sqrt(2)
            velocityX *= factor;
            velocityY *= factor;
        }

        Body.setVelocity(player, { x: velocityX, y: velocityY });

        // Player boundary clamp
        const { x, y } = player.position;
        const clampedX = Math.max(playerRadius, Math.min(x, gameWidth - playerRadius));
        const clampedY = Math.max(playerRadius, Math.min(y, gameHeight - playerRadius));

        if (x !== clampedX || y !== clampedY) {
            Body.setPosition(player, { x: clampedX, y: clampedY });
        }
    });

    // Game Logic Update (Movement, Cleanup) - MOVED HERE
    Matter.Events.on(engine, 'beforeUpdate', () => {
        if (gameOver || gamePausedForUpgrade) return; // Simplified condition

        // Player movement (already in initializeGame, this is for other game logic)

        // Enemy movement and cleanup
        enemies.forEach(enemy => {
            if (!enemy.isSleeping && player) {
                const directionX = player.position.x - enemy.position.x;
                const directionY = player.position.y - enemy.position.y;
                const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
                
                if (magnitude > 0) {
                    const velocityX = (directionX / magnitude) * enemySpeed;
                    const velocityY = (directionY / magnitude) * enemySpeed;
                    Matter.Body.setVelocity(enemy, { x: velocityX, y: velocityY });
                }
            }
            if (enemy.position.x < -100 || enemy.position.x > gameWidth + 100 || 
                enemy.position.y < -100 || enemy.position.y > gameHeight + 100) {
                Matter.Composite.remove(world, enemy);
                const index = enemies.indexOf(enemy);
                if (index > -1) enemies.splice(index, 1);
            }
        });

        // Projectile cleanup
        projectiles.forEach((projectile, index) => {
            if (projectile.position.x < -50 || projectile.position.x > gameWidth + 50 ||
                projectile.position.y < -50 || projectile.position.y > gameHeight + 50) {
                Matter.Composite.remove(world, projectile);
                projectiles.splice(index, 1);
            }
        });
    });

    // Collision Handling - MOVED HERE
    Matter.Events.on(engine, 'collisionStart', (event) => {
        if (gameOver) return; // Don't process collisions if game is over

        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            let projectile = null, enemy = null, playerBody = null, xpOrbToCollect = null;

            // Identify bodies involved in the collision
            if ((bodyA.label === 'projectile' && bodyB.label === 'enemy') || (bodyB.label === 'projectile' && bodyA.label === 'enemy')) {
                projectile = bodyA.label === 'projectile' ? bodyA : bodyB;
                enemy = bodyA.label === 'enemy' ? bodyA : bodyB;
            } else if ((bodyA.label === 'player' && bodyB.label === 'enemy') || (bodyB.label === 'player' && bodyA.label === 'enemy')) {
                playerBody = bodyA.label === 'player' ? bodyA : bodyB;
                enemy = bodyA.label === 'enemy' ? bodyA : bodyB;
            } else if ((bodyA.label === 'player' && bodyB.label === 'xpOrb') || (bodyB.label === 'player' && bodyA.label === 'xpOrb')) {
                playerBody = bodyA.label === 'player' ? bodyA : bodyB; // Ensure playerBody is assigned for XP orb logic
                xpOrbToCollect = bodyA.label === 'xpOrb' ? bodyA : bodyB;
            }

            // Projectile-Enemy Collision
            if (projectile && enemy) {
                // Apply damage to enemy (assuming enemy object has a health property)
                // This part was duplicated and had issues, simplifying:
                // enemy.health -= projectileDamage; // Assuming projectileDamage is a global or accessible variable
                // For now, just remove them as per original logic until health/damage is robust

                const projIndex = projectiles.indexOf(projectile);
                if (projIndex > -1) projectiles.splice(projIndex, 1);
                Matter.Composite.remove(world, projectile);

                // Spawn XP Orb
                const xpOrb = Bodies.circle(enemy.position.x, enemy.position.y, xpOrbRadius, {
                    label: 'xpOrb', isSensor: true, render: { fillStyle: 'cyan' },
                    collisionFilter: { category: defaultCategory, mask: playerCategory }
                });
                World.add(world, xpOrb);
                xpOrbs.push(xpOrb);

                const enemyIndex = enemies.indexOf(enemy);
                if (enemyIndex > -1) enemies.splice(enemyIndex, 1);
                Matter.Composite.remove(world, enemy);
                continue; 
            }

            // Player-Enemy Collision
            if (playerBody && enemy) { // enemy here is the one involved with player
                playerHealth -= 10; 
                console.log(`Player hit! Health: ${playerHealth}`);
                
                const enemyIndexToRemove = enemies.indexOf(enemy);
                if (enemyIndexToRemove > -1) enemies.splice(enemyIndexToRemove, 1);
                Matter.Composite.remove(world, enemy);

                if (playerHealth <= 0 && !gameOver) {
                    gameOver = true; // Set gameOver flag
                    console.log('Game Over!');
                    Runner.stop(runnerInstance);
                    clearInterval(shootIntervalId);
                    clearInterval(enemySpawnIntervalId);
                }
                continue;
            }

            // Player-XP Orb Collision
            if (playerBody && xpOrbToCollect) {
                playerXP += 5;
                console.log(`Collected XP! Total XP: ${playerXP}, Level: ${playerLevel}`);

                const orbIndex = xpOrbs.indexOf(xpOrbToCollect);
                if (orbIndex > -1) xpOrbs.splice(orbIndex, 1);
                Matter.Composite.remove(world, xpOrbToCollect); // Remove collected orb

                if (playerXP >= xpToNextLevel && !gamePausedForUpgrade) {
                    playerLevel++;
                    playerXP -= xpToNextLevel;
                    xpToNextLevel = Math.floor(xpToNextLevel * 1.7); // CORRECTED MULTIPLIER
                    console.log(`Level Up! New Level: ${playerLevel}, XP for next: ${xpToNextLevel}`);
                    gamePausedForUpgrade = true;
                    if (runnerInstance) Runner.stop(runnerInstance); // Ensure runner stops for upgrades
                    presentUpgradeOptions();
                }
            } // Closes: if (playerBody && xpOrbToCollect)
        } // Closes: for (let i = 0; i < pairs.length; i++)
    });

    // UI Rendering on canvas - Moved from global scope and gifler logic removed
    Matter.Events.on(render, 'afterRender', () => {
        const context = render.context;

        // Existing UI drawing code:
        context.fillStyle = 'white';
        context.font = '18px Arial';
        context.textAlign = 'left';

        // Player Health
        context.fillText(`Health: ${playerHealth}`, 20, 30);
        // Player XP and Level
        context.fillText(`Level: ${playerLevel}`, 20, 60);
        context.fillText(`XP: ${playerXP} / ${xpToNextLevel}`, 20, 90);
        context.fillText(`Damage: ${projectileDamage}`, 20, 120);
        context.fillText(`Atk Speed: ${(1000/shootInterval).toFixed(1)}/s`, 20, 150);

        // Upgrade UI
        if (gamePausedForUpgrade && availableUpgrades.length > 0) {
            const boxWidth = 200;
            const boxHeight = 100;
            const spacing = 20;
            const totalHeight = (boxHeight + spacing) * availableUpgrades.length - spacing;
            let startY = (gameHeight - totalHeight) / 2;

            availableUpgrades.forEach((upgrade, index) => {
                const boxY = startY + index * (boxHeight + spacing);
                context.fillStyle = 'rgba(0, 0, 0, 0.7)';
                context.fillRect((gameWidth - boxWidth) / 2, boxY, boxWidth, boxHeight);
                context.fillStyle = 'white';
                context.font = '16px Arial';
                context.textAlign = 'center';
                context.fillText(upgrade.name, gameWidth / 2, boxY + 30);
                context.font = '12px Arial';
                wrapText(context, upgrade.description, gameWidth / 2, boxY + 55, boxWidth - 20, 15);
            });
        }

        if (gameOver) { // Changed from playerHealth <= 0 to use the gameOver flag
            context.fillStyle = 'red';
            context.font = '48px Arial';
            context.textAlign = 'center';
            context.fillText('GAME OVER', gameWidth / 2, gameHeight / 2);
        }
    });
    
    // Setup mouse controls (should be after canvas is defined)
    // setupMouseControls(canvas); // Temporarily commented out - function definition is missing

    gameInitialized = true; 
    console.log("Game initialized, Matter.js engine and renderer running. Player image sync active.");

    // Start game intervals
    shootIntervalId = setInterval(shootProjectile, shootInterval);
    enemySpawnIntervalId = setInterval(spawnEnemy, 2500);
}

// Modify canvas click listener for restart
const oldCanvasClickListener = document.querySelector('canvas').onclick;
document.querySelector('canvas').removeEventListener('click', oldCanvasClickListener); // Attempt to remove if it was set before

document.querySelector('canvas').addEventListener('click', (event) => {
    if (playerHealth <= 0) { // Game is over, check for restart click
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        // Restart button bounds: gameWidth / 2 - 75, gameHeight / 2 + 20, width 150, height 50
        if (clickX >= (gameWidth / 2 - 75) && clickX <= (gameWidth / 2 + 75) &&
            clickY >= (gameHeight / 2 + 20) && clickY <= (gameHeight / 2 + 70)) {
            resetGame();
            return; // Exit after handling restart
        }
    }

    if (!gamePausedForUpgrade || availableUpgrades.length === 0) return;

    const rect = event.target.getBoundingClientRect(); // event.target is the canvas

    // Recalculate the CSS scale factor applied to the game container
    // This ensures click coordinates are correctly mapped to the game's internal coordinate system.
    let currentAppliedScale = 1;
    if (typeof gameWidth !== 'undefined' && gameWidth > 0 && typeof gameHeight !== 'undefined' && gameHeight > 0) {
        const scaleXFactor = window.innerWidth / gameWidth;
        const scaleYFactor = window.innerHeight / gameHeight;
        currentAppliedScale = Math.min(scaleXFactor, scaleYFactor);
        currentAppliedScale = Math.max(currentAppliedScale, 0.1); // Match logic in scaleGameContainer
    } else {
        console.warn('gameWidth or gameHeight not properly defined for click scaling');
    }
    
    const clickX = (event.clientX - rect.left) / currentAppliedScale;
    const clickY = (event.clientY - rect.top) / currentAppliedScale;

    const boxWidth = 200;
    const boxHeight = 100;
    const spacing = 20;
    const totalHeight = (boxHeight + spacing) * availableUpgrades.length - spacing;
    let startY = (gameHeight - totalHeight) / 2;

    availableUpgrades.forEach((upgrade, index) => {
        const boxX = (gameWidth - boxWidth) / 2;
        const boxY = startY + index * (boxHeight + spacing);
        if (clickX >= boxX && clickX <= boxX + boxWidth && clickY >= boxY && clickY <= boxY + boxHeight) {
            upgrade.apply();
            gamePausedForUpgrade = false;
            availableUpgrades = []; 
            if (playerHealth > 0 && runnerInstance && engine) { // Added engine check for safety
                Runner.run(runnerInstance, engine); // Ensure runner is active
            }
        }
    });
});
window.onload = setupGameAssets;

