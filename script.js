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

// Function to select the primary gamepad
function selectPrimaryGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    let foundGamepad = null;
    let preferredGamepad = null;

    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (!foundGamepad) foundGamepad = gamepads[i]; // Fallback to first detected
            // Check for Xbox controller (Vendor ID 045e) or standard mapping
            if (gamepads[i].id.includes('STANDARD GAMEPAD') || gamepads[i].id.toLowerCase().includes('xbox') || (gamepads[i].id.includes('045e') || gamepads[i].id.includes('045E'))) {
                preferredGamepad = gamepads[i];
                break; // Found a preferred one, use it
            }
        }
    }

    const newGamepad = preferredGamepad || foundGamepad;
    if (newGamepad) {
        if (!gamepad || gamepad.id !== newGamepad.id) {
            console.log("Primary gamepad selected:", newGamepad.id);
            gamepad = newGamepad;
        }
    } else {
        if (gamepad) {
            console.log("No active gamepad found, clearing previous selection.");
            gamepad = null;
        }
    }

    // Log the final decision
    if (gamepad) { // This is the global gamepad variable
        console.log(`selectPrimaryGamepad RESULT: Active gamepad is ${gamepad.id}`);
    } else {
        console.log("selectPrimaryGamepad RESULT: No gamepad is active.");
    }
}

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

// Audio elements
let audioMusic;
let audioShoot;
let audioPickup;
let audioPlayerHit;
let audioEnemyDie;

let gamepad = null; // To store the connected gamepad object
const GAMEPAD_DEAD_ZONE = 0.2; // Dead zone for analog sticks

const xpOrbs = [];
const xpOrbMagnetSpeed = 4;   // Speed at which XP orbs move towards the player

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
let projectileDamage = 1.5; // Base projectile damage
let gameOver = false; // Tracks game over state
let playerSpeed = 5; // Player movement speed, consolidated global declaration
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
    // Try to play music on first keydown if it hasn't successfully played yet
    if (audioMusic && audioMusic.paused && !audioMusic.hasSuccessfullyPlayed) {
        audioMusic.play().then(() => {
            audioMusic.hasSuccessfullyPlayed = true;
        }).catch(e => console.warn("Music play on keydown failed:", e));
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
const enemySpeed = 1.5; // Slower than player
const ENEMY_MAX_HEALTH = 3; // Max health for enemies
const xpOrbRadius = 8;
let xpOrbPickupRadius = 100; // Radius within which XP orbs are attracted to the player
function spawnEnemy() {
    if (gamePausedForUpgrade || gameOver) return; // Check pause/game over state
    const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    const enemyImageAsset = imageAssets[randomEnemyType.file];

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

    let enemy;
    try {
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
            health: ENEMY_MAX_HEALTH,
            maxHealth: ENEMY_MAX_HEALTH
        });
    } catch (e) {
        // console.error('DEBUG SPAWN: ERROR during Bodies.circle creation!', e);
        console.error('Error during enemy body creation:', e); // Keep a more generic error
        return; // Stop if body creation fails
    }

    if (!enemy) {
        // console.error('DEBUG SPAWN: Enemy body is null/undefined after Bodies.circle, even without an exception.');
        console.error('Enemy body is null/undefined after creation attempt.'); // Keep a more generic error
        return;
    }

    enemies.push(enemy);
    World.add(world, enemy);
}
// const projectiles = []; // Removed redundant declaration, already declared with let globally
const projectileRadius = 5;
const projectileSpeed = 12;
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

    if (audioShoot) {
        audioShoot.currentTime = 0;
        audioShoot.play().catch(e => console.error("Error playing shoot sound:", e));
    }
}

// Automatic Shooting Interval
let shootIntervalId = setInterval(shootProjectile, shootInterval);

// Enemy Spawning Interval - Store ID to clear/reset later if needed
// let enemySpawnIntervalId = setInterval(spawnEnemy, 2500); // This is now handled in initializeGame and resetGame


// UI Rendering logic moved into initializeGame's afterRender event.

// Upgrade Definitions
const allUpgrades = [
    {
        name: "Rapid Fire",
        description: "Increases attack speed by 15%.",
        apply: () => { 
            shootInterval *= 0.85; 
            if (shootIntervalId) clearInterval(shootIntervalId);
            shootIntervalId = setInterval(shootProjectile, shootInterval);
            console.log(`Attack speed increased. New interval: ${shootInterval}`);
        }
    },
    {
        name: "Greater Greed",
        description: "Increases XP orb pickup range by 25.",
        apply: () => {
            xpOrbPickupRadius += 25;
            console.log(`XP Orb pickup radius increased to: ${xpOrbPickupRadius}`);
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
    runnerInstance.isFixed = true; // Ensure consistent game speed
    Render.run(render);
    Runner.run(runnerInstance, engine);

    // Select the primary gamepad on initialization
    selectPrimaryGamepad();
    // console.log(`Runner properties: isFixed = ${runnerInstance.isFixed}, delta = ${runnerInstance.delta}`);
    // console.log(`Engine timing: timeScale = ${engine.timing.timeScale}`);

    // Initialize audio
    audioMusic = new Audio('sfx/music_loop.mp3');
    audioShoot = new Audio('sfx/shoot.mp3');
    audioPickup = new Audio('sfx/pickup.mp3');
    audioPlayerHit = new Audio('sfx/player_hit.mp3');
    audioEnemyDie = new Audio('sfx/enemy_die.mp3');

    audioMusic.loop = true;
    audioMusic.volume = 0.3; // Adjust volume as needed
    audioMusic.hasSuccessfullyPlayed = false; // Custom flag
    audioMusic.play().then(() => {
        audioMusic.hasSuccessfullyPlayed = true;
    }).catch(e => console.warn("Initial music play failed, likely due to autoplay policy. Will try on interaction.", e));

    // Set volume for sound effects if desired
    audioShoot.volume = 0.25;
    audioPickup.volume = 0.6;
    audioPlayerHit.volume = 0.7;
    audioEnemyDie.volume = 0.25;

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
        let gamepadInputProcessed = false;

        // Gamepad input (overrides keyboard if active)
        if (gamepad) { // Check if a primary gamepad is selected
            const currentFrameGamepads = navigator.getGamepads();
            if (gamepad.index < currentFrameGamepads.length) { // Ensure index is still valid
                const liveGamepadState = currentFrameGamepads[gamepad.index]; // Get the live state using the stored index

                if (liveGamepadState && liveGamepadState.connected && liveGamepadState.axes && liveGamepadState.axes.length >= 2) {
                    // ---- UPDATED LOGGING ----
                    // console.log(`Gamepad active for movement: ${liveGamepadState.id}, Raw Axes: X=${liveGamepadState.axes[0].toFixed(4)}, Y=${liveGamepadState.axes[1].toFixed(4)}`);
                    // ---- END UPDATED LOGGING ----

                    let stickX = liveGamepadState.axes[0];
                    let stickY = liveGamepadState.axes[1];

                    if (Math.abs(stickX) > GAMEPAD_DEAD_ZONE) {
                        velocityX = stickX * playerSpeed;
                        gamepadInputProcessed = true;
                    }
                    if (Math.abs(stickY) > GAMEPAD_DEAD_ZONE) {
                        velocityY = stickY * playerSpeed;
                        gamepadInputProcessed = true;
                    }
                } else if (liveGamepadState && !liveGamepadState.connected) {
                    // console.log(`Selected gamepad ${gamepad.id} (index ${gamepad.index}) is no longer connected.`);
                    // Potentially clear 'gamepad' or re-select, but for now, will fall to keyboard
                } else {
                    // console.log(`Selected gamepad ${gamepad.id} (index ${gamepad.index}) has insufficient axes or is not fully available.`);
                }
            } else {
                // console.warn(`Stored gamepad index ${gamepad.index} is out of bounds for current gamepads list (length ${currentFrameGamepads.length}).`);
                // This might happen if gamepads are rapidly connected/disconnected.
            }
        }

        // Fallback to keyboard if no gamepad input was processed
        if (!gamepadInputProcessed) {
            if (keys.w || keys.ArrowUp) velocityY = -playerSpeed;
            if (keys.s || keys.ArrowDown) velocityY = playerSpeed;
            if (keys.a || keys.ArrowLeft) velocityX = -playerSpeed;
            if (keys.d || keys.ArrowRight) velocityX = playerSpeed;
            
            // If both vertical and horizontal keys are pressed, adjust velocity for diagonal movement
            // This ensures keyboard diagonal speed matches gamepad diagonal speed if only one axis is primary for keyboard
            if (keys.w || keys.s || keys.ArrowUp || keys.ArrowDown) {
                if (keys.a || keys.d || keys.ArrowLeft || keys.ArrowRight) {
                    // velocityX and velocityY are already set, they will be normalized later
                } else {
                    // Only vertical, ensure horizontal is zero if it was somehow set
                    // velocityX = 0; // This line might be too aggressive if mixing inputs is desired
                }
            } else if (keys.a || keys.d || keys.ArrowLeft || keys.ArrowRight) {
                // Only horizontal, ensure vertical is zero
                // velocityY = 0; // This line might be too aggressive
            }
        }

        // Normalize diagonal movement (applies to both gamepad and keyboard)
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

        // XP Orb Magnetism
        xpOrbs.forEach(orb => {
            if (player) { // player is the Matter.js body
                const distanceX = player.position.x - orb.position.x;
                const distanceY = player.position.y - orb.position.y;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Attract if within pickup radius but not already overlapping significantly
                if (distance < xpOrbPickupRadius && distance > (playerRadius * 0.5)) {
                    const directionX = distanceX / distance;
                    const directionY = distanceY / distance;
                    Matter.Body.setVelocity(orb, {
                        x: directionX * xpOrbMagnetSpeed,
                        y: directionY * xpOrbMagnetSpeed
                    });
                } 
                // If it's very close or overlapping, the collision system will handle the pickup.
                // No need to explicitly stop velocity here unless overshooting becomes an issue.
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
                enemy.health -= projectileDamage;

                const projIndex = projectiles.indexOf(projectile);
                if (projIndex > -1) projectiles.splice(projIndex, 1);
                Matter.Composite.remove(world, projectile);

                if (enemy.health <= 0) {
                    if (audioEnemyDie) {
                        audioEnemyDie.currentTime = 0;
                        audioEnemyDie.play().catch(e => console.error("Error playing enemy die sound:", e));
                    }
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
                }
                continue; 
            }

            // Player-Enemy Collision
            if (playerBody && enemy) { // enemy here is the one involved with player
                playerHealth -= 10; 
                console.log(`Player hit! Health: ${playerHealth}`);
                if (audioPlayerHit) {
                    audioPlayerHit.currentTime = 0;
                    audioPlayerHit.play().catch(e => console.error("Error playing player hit sound:", e));
                }
                
                const enemyIndexToRemove = enemies.indexOf(enemy);
                if (enemyIndexToRemove > -1) enemies.splice(enemyIndexToRemove, 1);
                Matter.Composite.remove(world, enemy);

                if (playerHealth <= 0 && !gameOver) {
                    gameOver = true; // Set gameOver flag
                    console.log('Game Over!');
                    Runner.stop(runnerInstance);
                    clearInterval(shootIntervalId);
                    clearInterval(enemySpawnIntervalId);
                    if (audioMusic) audioMusic.pause(); // Stop music on game over
                }
                continue;
            }

            // Player-XP Orb Collision
            if (playerBody && xpOrbToCollect) {
                playerXP += 5;
                if (audioPickup) {
                    audioPickup.currentTime = 0;
                    audioPickup.play().catch(e => console.error("Error playing pickup sound:", e));
                }
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
                    if (runnerInstance) Runner.stop(runnerInstance);
                    if (audioMusic) audioMusic.pause(); // Pause music during upgrade screen
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

        // Draw enemy health bars
        enemies.forEach(e => {
            // Only draw health bar if enemy is alive and has taken some damage, or always show if you prefer
            if (e.health > 0) { 
                const barWidth = 30; // Width of the health bar
                const barHeight = 5; // Height of the health bar
                const x = e.position.x - barWidth / 2;
                // Position above enemy: enemyRadius is visual, use actual body bounds if different
                const y = e.position.y - (e.circleRadius || enemyRadius) - barHeight - 5; 

                // Background of the health bar (e.g., dark red or grey)
                context.fillStyle = 'rgba(100, 100, 100, 0.7)';
                context.fillRect(x, y, barWidth, barHeight);

                // Current health (e.g., green)
                const healthPercentage = e.health / e.maxHealth;
                context.fillStyle = 'rgba(0, 255, 0, 0.9)';
                context.fillRect(x, y, barWidth * healthPercentage, barHeight);
            }
        });

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
    // Try to play music on first canvas click if it hasn't successfully played yet
    if (audioMusic && audioMusic.paused && !audioMusic.hasSuccessfullyPlayed) {
        audioMusic.play().then(() => {
            audioMusic.hasSuccessfullyPlayed = true;
        }).catch(e => console.warn("Music play on canvas click failed:", e));
    }

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
                if (audioMusic && audioMusic.paused) {
                    audioMusic.play().catch(e => console.error("Error resuming music:", e));
                }
            }
        }
    });
});
// Gamepad event listeners
window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad connected event for:", event.gamepad.id);
    selectPrimaryGamepad(); // Re-evaluate primary gamepad
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Gamepad disconnected event for:", event.gamepad.id);
    selectPrimaryGamepad(); // Re-evaluate primary gamepad
});

window.onload = setupGameAssets;

