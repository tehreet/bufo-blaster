// Game State Management
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG, CHARACTERS } from './constants.js';

// Matter.js instances
export let engine = null;
export let world = null;
export let render = null;
export let runnerInstance = null;
export let player = null;

// Game dimensions
export let gameWidth = 0;
export let gameHeight = 0;
export let playerImageElement = null;

// Game arrays
export const enemies = [];
export const projectiles = [];
export const xpOrbs = [];
export const starfallProjectiles = [];

// Goose Bufo arrays
export const orbitingGeese = [];
export const convertedAllies = [];

// Asset loading state
export let imagesToLoadCount = 0;
export let imagesLoadedCount = 0;
export const imageAssets = {};
export let gameInitialized = false;

// Game timing and intervals
export let enemySpawnIntervalId = null;
export let shootIntervalId = null;
export let healthRegenIntervalId = null;
export let currentPlayerHealthRegenInterval = GAME_CONFIG.PLAYER_HEALTH_REGEN_INTERVAL;
export let currentPlayerHealthRegenAmount = GAME_CONFIG.PLAYER_HEALTH_REGEN_AMOUNT;

// Game statistics
export let runStartTime = 0;
export let elapsedRunTimeFormatted = "00:00";
export let enemyKillCount = 0;

// Player state
export let playerHealth = DEFAULT_GAME_SETTINGS.playerHealth;
export let playerXP = DEFAULT_GAME_SETTINGS.playerXP;
export let playerLevel = DEFAULT_GAME_SETTINGS.playerLevel;
export let xpToNextLevel = DEFAULT_GAME_SETTINGS.xpToNextLevel;
export let projectileDamage = DEFAULT_GAME_SETTINGS.projectileDamage;
export let shootInterval = DEFAULT_GAME_SETTINGS.shootInterval;
export let playerSpeed = DEFAULT_GAME_SETTINGS.playerSpeed;
export let xpOrbPickupRadius = DEFAULT_GAME_SETTINGS.xpOrbPickupRadius;

// Game state flags
export let gameOver = false;
export let gamePausedForUpgrade = false;
export let gamePaused = false; // Global pause state
export let playerIsInvincible = false;
export let invincibilityTimerId = null;
export let lastAuraTickTime = 0;

// Character selection
export let selectedCharacter = CHARACTERS.STAB_BUFO; // Default to Stab Bufo
export let characterSelectionActive = true;
export let gameStarted = false;

// Dynamic aura properties (can be upgraded) - Stab Bufo
export let currentAuraCooldown = GAME_CONFIG.STAB_BUFO_AURA_TICK_INTERVAL_MS;
export let currentAuraDamage = GAME_CONFIG.STAB_BUFO_AURA_DAMAGE_PER_TICK;
export let currentAuraKnockback = GAME_CONFIG.STAB_BUFO_AURA_KNOCKBACK_FORCE;

// Dynamic starfall properties (can be upgraded) - Wizard Bufo
export let currentStarfallCooldown = GAME_CONFIG.WIZARD_STARFALL_COOLDOWN;
export let currentStarfallDamage = GAME_CONFIG.WIZARD_STARFALL_DAMAGE;
export let currentStarfallCount = GAME_CONFIG.WIZARD_STARFALL_COUNT;

// Goose Bufo state
export let currentGooseOrbitSpeedMultiplier = 1.0; // Base speed multiplier
export let lastStarfallTime = 0;

// Upgrade system state
export let availableUpgrades = [];
export let currentUpgradeSelectionIndex = 0;
export let prevUpPressed = false;
export let prevDownPressed = false;
export let prevSelectPressed = false;
export let prevLeftPressed = false;
export let prevRightPressed = false;

// Gamepad state
export let gamepad = null;

// Audio objects
export let audioMusic = null;
export let audioShoot = null;
export let audioPickup = null;
export let audioPlayerHit = null;
export let audioEnemyDie = null;

// Input state
export const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    Enter: false, ' ': false,
    leftPressed: false, rightPressed: false, confirmPressed: false
};

// Setters for external modules to update state
export const setEngine = (newEngine) => { engine = newEngine; };
export const setWorld = (newWorld) => { world = newWorld; };
export const setRender = (newRender) => { render = newRender; };
export const setRunnerInstance = (newRunner) => { runnerInstance = newRunner; };
export const setPlayer = (newPlayer) => { player = newPlayer; };
export const setGameDimensions = (width, height) => { 
    gameWidth = width; 
    gameHeight = height; 
};
export const setPlayerImageElement = (element) => { playerImageElement = element; };
export const setGameInitialized = (initialized) => { gameInitialized = initialized; };

// State update functions
export const incrementImagesLoaded = () => { imagesLoadedCount++; };
export const incrementImagesToLoad = () => { imagesToLoadCount++; };
export const setImageAsset = (key, asset) => { imageAssets[key] = asset; };

export const updatePlayerHealth = (health) => { playerHealth = health; };
export const updatePlayerXP = (xp) => { playerXP = xp; };
export const updatePlayerLevel = (level) => { playerLevel = level; };
export const updateXpToNextLevel = (xp) => { xpToNextLevel = xp; };
export const updateProjectileDamage = (damage) => { projectileDamage = damage; };
export const updateShootInterval = (interval) => { shootInterval = interval; };
export const updatePlayerSpeed = (speed) => { playerSpeed = speed; };
export const updateXpOrbPickupRadius = (radius) => { xpOrbPickupRadius = radius; };

export const setGameOver = (isGameOver) => { gameOver = isGameOver; };
export const setGamePausedForUpgrade = (isPaused) => { gamePausedForUpgrade = isPaused; };
export const setGamePaused = (isPaused) => { gamePaused = isPaused; };
export const setPlayerInvincible = (isInvincible) => { playerIsInvincible = isInvincible; };
export const setInvincibilityTimer = (timerId) => { invincibilityTimerId = timerId; };

export const setAvailableUpgrades = (upgrades) => { availableUpgrades = upgrades; };
export const setCurrentUpgradeSelectionIndex = (index) => { currentUpgradeSelectionIndex = index; };
export const setUpgradeButtonStates = (up, down, select) => {
    prevUpPressed = up;
    prevDownPressed = down;
    prevSelectPressed = select;
};

export const setGamepad = (newGamepad) => { gamepad = newGamepad; };

export const setAudioObjects = (music, shoot, pickup, playerHit, enemyDie) => {
    audioMusic = music;
    audioShoot = shoot;
    audioPickup = pickup;
    audioPlayerHit = playerHit;
    audioEnemyDie = enemyDie;
};

export const setIntervals = (enemySpawn, shoot, healthRegen) => {
    if (enemySpawn !== null) enemySpawnIntervalId = enemySpawn;
    if (shoot !== null) shootIntervalId = shoot;
    if (healthRegen !== null) healthRegenIntervalId = healthRegen;
};

export const updateHealthRegenInterval = (interval) => { currentPlayerHealthRegenInterval = interval; };
export const setLastAuraTickTime = (time) => { lastAuraTickTime = time; };

// Aura upgrade setters
export const setAuraCooldown = (cooldown) => { currentAuraCooldown = cooldown; };
export const setAuraDamage = (damage) => { currentAuraDamage = damage; };
export const setAuraKnockback = (knockback) => { currentAuraKnockback = knockback; };

// Starfall upgrade setters
export const setStarfallCooldown = (cooldown) => { currentStarfallCooldown = cooldown; };
export const setStarfallDamage = (damage) => { currentStarfallDamage = damage; };
export const setStarfallCount = (count) => { currentStarfallCount = count; };
export const setLastStarfallTime = (time) => { lastStarfallTime = time; };

// Goose Bufo setters
export const setGooseOrbitSpeedMultiplier = (multiplier) => { currentGooseOrbitSpeedMultiplier = multiplier; };

// Character selection setters
export const setSelectedCharacter = (character) => { selectedCharacter = character; };
export const setCharacterSelectionActive = (active) => { characterSelectionActive = active; };
export const setGameStarted = (started) => { gameStarted = started; };

export const updateRunTimer = () => {
    if (runStartTime > 0) {
        const elapsedMs = Date.now() - runStartTime;
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        elapsedRunTimeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
};

export const resetRunTimer = () => {
    runStartTime = Date.now();
    elapsedRunTimeFormatted = "00:00";
    enemyKillCount = 0;
};

export const incrementEnemyKillCount = () => { enemyKillCount++; }; 