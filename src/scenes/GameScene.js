import Phaser from 'phaser';

// Import all system modules
import CharacterSystem from '../systems/CharacterSystem.js';
import StatsSystem from '../systems/StatsSystem.js';
import EnemySystem from '../systems/EnemySystem.js';
import UpgradeSystem from '../systems/UpgradeSystem.js';
import UISystem from '../systems/UISystem.js';
import StatusEffectSystem from '../systems/StatusEffectSystem.js';
import InputManager from '../utils/InputManager.js';
import AssetManager from '../utils/AssetManager.js';
import AudioManager from '../utils/AudioManager.js';
import DebugUtils from '../utils/DebugUtils.js';
import AssetConfig from '../utils/AssetConfig.js';
import Logger from '../utils/Logger.js';
import ConfigValidator from '../utils/ConfigValidator.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        try {
            // Load tilemap assets using centralized configuration
            const mapAssets = AssetConfig.getMapAssetsForPreload();
            mapAssets.forEach(asset => {
                if (asset.path.endsWith('.json')) {
                    this.load.tilemapTiledJSON(asset.key, asset.path);
                } else if (asset.path.endsWith('.png')) {
                    this.load.image(asset.key, asset.path);
                }
            });
            
            // Load PNG sprites for physics collision (both characters and enemies)
            const pngAssets = AssetConfig.getPNGAssetsForPreload();
            pngAssets.forEach(asset => {
                this.load.image(asset.key, asset.path);
            });
            Logger.asset(`Queued ${pngAssets.length} PNG assets for loading`);
            
            // Load audio assets using centralized configuration
            const audioAssets = AssetConfig.getAudioAssetsForPreload();
            audioAssets.forEach(asset => {
                this.load.audio(asset.key, asset.path);
            });
            Logger.asset(`Queued ${audioAssets.length} audio assets for loading`);
            
            Logger.asset('All assets queued for loading using centralized configuration');
            
        } catch (error) {
            Logger.assetError('Error setting up asset loading:', error);
            // Fallback to basic assets if configuration fails
            this.loadFallbackAssets();
        }
    }
    
    loadFallbackAssets() {
        Logger.assetWarn('Loading fallback assets due to configuration error');
        
        // Essential assets for basic functionality
        this.load.image('tileset', 'assets/map/single-tile-tileset.png');
        this.load.tilemapTiledJSON('level1', 'assets/map/single-tile-level.json');
        
        // Essential character sprites
        this.load.image('shield-bufo', 'assets/characters/shield-bufo.png');
        this.load.image('bufo-magician', 'assets/characters/bufo-magician.png');
        this.load.image('bat-bufo', 'assets/characters/bat-bufo.png');
        
        // Essential enemy sprites
        this.load.image('bufo-covid', 'assets/enemies/bufo-covid.png');
        this.load.image('bufo-clown', 'assets/enemies/bufo-clown.png');
        this.load.image('bufo-pog', 'assets/enemies/bufo-pog.png');
        
        // Essential audio
        this.load.audio('musicLoop', 'assets/sfx/music_loop.mp3');
    }

    create() {
        // Initialize game state
        this.gameStarted = false;
        
        // Game configuration constants
        this.gameConfig = {
            ENEMY_RADIUS: 10,
            ENEMY_SPEED: 75,
            ENEMY_MAX_HEALTH: 3,
            ENEMY_CONTACT_DAMAGE: 10,
            // PLAYER_RADIUS is now character-specific (defined in CharacterRegistry)
            XP_ORB_RADIUS: 8,
            XP_ORB_MAGNET_SPEED: 400, // Doubled from 200 to 400 - much stronger magnetism
            SHIELD_BUFO_BASH_RANGE: 100,
            SHIELD_BUFO_BASH_DAMAGE: 1.2,
            SHIELD_BUFO_BASH_COOLDOWN: 800,
            ENEMY_SPAWN_INTERVAL: 1200
        };
        
        // Initialize enemy projectiles group
        this.enemyProjectiles = this.add.group();
        
        // Initialize all systems
        this.initializeSystems();
        
        // Start with character selection
        this.uiSystem.showCharacterSelection();
    }

    initializeSystems() {
        // Utility systems first (needed by other systems)
        this.inputManager = new InputManager(this);
        this.assetManager = new AssetManager(this);
        this.audioManager = new AudioManager(this);
        this.debugUtils = new DebugUtils(this);
        
        // Core systems (now that utilities are available)
        this.characterSystem = new CharacterSystem(this);
        this.statsSystem = new StatsSystem(this);
        this.enemySystem = new EnemySystem(this);
        this.upgradeSystem = new UpgradeSystem(this);
        this.uiSystem = new UISystem(this);
        this.statusEffectSystem = new StatusEffectSystem(this);
        
        // Validate all configurations early to catch issues
        try {
            ConfigValidator.validateAllConfigurations(
                this.characterSystem.getCharacters ? this.characterSystem : null,
                this.enemySystem.enemyRegistry,
                AssetConfig.getAssetConfig ? AssetConfig.getAssetConfig() : null
            );
        } catch (error) {
            Logger.error(Logger.Categories.SYSTEM, 'Configuration validation failed:', error);
        }
        
        // Legacy properties for compatibility (some systems still reference these directly)
        this.gamepadState = this.inputManager.getGamepadState();
        this.showHitboxes = false;
        this.showStatsDebug = false;
        this.statsDebugUI = null;
        
        Logger.system('All game systems initialized');
        
        // Show logging instructions in console for development
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            Logger.logInstructions();
        }
    }

    update() {
        // Always update input and asset management
        this.inputManager.update();
        this.assetManager.updateAllOverlays();
        
        // Always update HTML UI for input handling (menus, character selection, etc.)
        this.uiSystem.handleGamepadInput();
        
        // Only update game systems when the game has started AND is not paused
        if (this.gameStarted && !this.isPaused && !this.upgradeSystem.upgradeActive) {
            this.statsSystem.update();
            this.enemySystem.update();
            this.characterSystem.updateCharacterAbilities();
            this.statusEffectSystem.update();
            this.debugUtils.update();
            this.uiSystem.updateUI();
        }
        // Removed excessive update blocking logs - use F2 for debug info instead
        
        // Always update upgrade system for input handling
        this.upgradeSystem.handleGamepadUpgradeInput();
        
        // Legacy debug property sync (for compatibility)
        this.showHitboxes = this.debugUtils.showHitboxes;
        this.showStatsDebug = this.debugUtils.showStatsDebug;
        this.statsDebugUI = this.debugUtils.statsDebugUI;
    }

    // Delegate methods for systems that need to call scene methods
    gameOver() {
        this.uiSystem.gameOver();
    }

    // Legacy property getters for backward compatibility
    get isPaused() {
        return this.uiSystem.isPaused;
    }

    set isPaused(value) {
        this.uiSystem.isPaused = value;
    }
}

export default GameScene; 