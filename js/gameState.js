// Game State Management
import { DEFAULT_GAME_SETTINGS } from './constants.js';

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

// Asset loading state
export let imagesToLoadCount = 0;
export let imagesLoadedCount = 0;
export const imageAssets = {};
export let gameInitialized = false;

// Game timing and intervals
export let enemySpawnIntervalId = null;
export let shootIntervalId = null;
export let healthRegenIntervalId = null;
export let currentPlayerHealthRegenInterval = 10000; // 10 seconds
export let currentPlayerHealthRegenAmount = 1;

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
export let playerIsInvincible = false;
export let invincibilityTimerId = null;
export let lastAuraTickTime = 0;

// Upgrade system state
export let availableUpgrades = [];
export let currentUpgradeSelectionIndex = 0;
export let prevUpPressed = false;
export let prevDownPressed = false;
export let prevSelectPressed = false;

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
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
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