// UI System - Handles user interface elements and interactions
// Now uses hybrid approach: HTML overlays for menus, Phaser for game UI

import HTMLUIManager from './HTMLUIManager.js';
import Logger from '../utils/Logger.js';

class UISystem {
    constructor(scene) {
        this.scene = scene;
        this.isPaused = false;
        this.gameOverInProgress = false;
        this.pauseUIElements = [];
        this.gameUIElements = [];
        
        // Initialize HTML UI Manager for modern overlays
        this.htmlUI = new HTMLUIManager(scene);
    }

    showCharacterSelection() {
        // Use the new HTML character selection instead of Phaser
        this.htmlUI.showCharacterSelection();
    }

    selectCharacter(character) {
        this.scene.characterSystem.setSelectedCharacter(character);
        this.startGame();
    }

    startGame() {
        // Clear character selection UI (handled by HTMLUIManager)
        // No need to clear Phaser children anymore
        
        // Game state
        this.scene.gameStarted = true;
        
        // Enable physics for the new game (critical fix for restart bug)
        this.scene.matter.world.enabled = true;
        
        // Initialize game systems
        this.initializeGame();
        
        // Create game world
        this.createGameWorld();
        
        // Create game UI
        this.createGameUI();
        
        // Start background music
        if (this.scene.audioManager) {
            this.scene.audioManager.onGameStart();
        }
        
        // Game started successfully
    }

    initializeGame() {
        // Initialize player stats based on selected character
        this.scene.statsSystem.initializePlayerStats(this.scene.characterSystem.getSelectedCharacter());
        
        // Initialize game groups
        this.scene.enemies = this.scene.add.group();
        this.scene.xpOrbs = this.scene.add.group();
        this.scene.auraEffects = this.scene.add.group();
        this.scene.enemyProjectiles = this.scene.add.group();
        
        // Start enemy spawning
        this.scene.enemySystem.startEnemySpawning(); 
        
        // Setup character abilities
        this.scene.characterSystem.setupCharacterAbilities();
    }

    createGameWorld() {
        // Generate tilemap
        const mapWidth = 3200;
        const mapHeight = 2400;
        this.generateMap(mapWidth, mapHeight);
        
        // Create player at center of map
        const playerStartX = mapWidth / 2;
        const playerStartY = mapHeight / 2;
        
        const selectedCharacter = this.scene.characterSystem.getSelectedCharacter();
        this.scene.player = this.scene.add.image(playerStartX, playerStartY, selectedCharacter.sprite);
        
        // Get the configured display size for this character
        const displaySize = this.scene.assetManager.getDisplaySize ? 
            this.scene.assetManager.getDisplaySize(selectedCharacter.sprite, 'characters') : 64;
        this.scene.player.setDisplaySize(displaySize, displaySize);
        
        // Try to create animated overlay using centralized asset management
        const hasAnimatedOverlay = this.scene.assetManager.createAnimatedOverlay(
            this.scene.player, selectedCharacter.sprite, 'characters'
        );
        
        if (!hasAnimatedOverlay) {
            // No animated version available or failed to load, show static sprite
            this.scene.player.setAlpha(1);
        }
        
        // Get character-specific hitbox radius
        const hitboxRadius = selectedCharacter.hitboxRadius || 8; // Default to 8 if not specified
        
        // Add Matter.js physics to player (character-specific collision radius)
        this.scene.matter.add.gameObject(this.scene.player, {
            shape: 'circle',
            radius: hitboxRadius,
            frictionAir: 0.05,
            label: 'player'
        });
        
        // Add debug hitbox visualization for player (character-specific radius)
        this.scene.player.hitboxDebug = this.scene.debugUtils.createHitboxDebug(this.scene.player, hitboxRadius, 0x00ff00);
        
        // Initialize character facing direction (default to facing right)
        this.scene.inputManager.lastFacingDirection = false; // false = facing right, true = facing left
        
        // Setup camera to follow player
        this.scene.cameras.main.startFollow(this.scene.player);
        this.scene.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        
        // Setup physics collision handlers
        this.setupPhysicsCollisions();
    }

    generateMap(mapWidth, mapHeight) {
        // Load the pre-generated grass/dirt map using correct asset keys
        this.scene.map = this.scene.make.tilemap({ key: 'single-tile-level' });
        
        // Add the tileset using correct asset key
        const tileset = this.scene.map.addTilesetImage('single-tile', 'single-tile-tileset');
        
        // Create the layer from the pre-generated map data
        const backgroundLayer = this.scene.map.createLayer('Ground', tileset);
        
        // Update map dimensions to match the actual map
        this.scene.map.widthInPixels = this.scene.map.widthInPixels;
        this.scene.map.heightInPixels = this.scene.map.heightInPixels;
        
        console.info(`[ASSET] Loaded tilemap: ${this.scene.map.width}x${this.scene.map.height} tiles (${this.scene.map.widthInPixels}x${this.scene.map.heightInPixels} pixels)`);
    }

    setupPhysicsCollisions() {
        // Player hits enemy
        this.scene.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                
                if (bodyA.label === 'player' && bodyB.label === 'enemy') {
                    this.scene.enemySystem.playerHitEnemy(bodyA.gameObject, bodyB.gameObject);
                } else if (bodyA.label === 'enemy' && bodyB.label === 'player') {
                    this.scene.enemySystem.playerHitEnemy(bodyB.gameObject, bodyA.gameObject);
                }
                
                // Player collects XP orb
                if (bodyA.label === 'player' && bodyB.label === 'xpOrb') {
                    this.scene.enemySystem.playerCollectXP(bodyA.gameObject, bodyB.gameObject);
                } else if (bodyA.label === 'xpOrb' && bodyB.label === 'player') {
                    this.scene.enemySystem.playerCollectXP(bodyB.gameObject, bodyA.gameObject);
                }
                
                // Player collects XP Magnet Orb
                if (bodyA.label === 'player' && bodyB.label === 'magnetOrb') {
                    this.scene.enemySystem.playerCollectMagnetOrb(bodyA.gameObject, bodyB.gameObject);
                } else if (bodyA.label === 'magnetOrb' && bodyB.label === 'player') {
                    this.scene.enemySystem.playerCollectMagnetOrb(bodyB.gameObject, bodyA.gameObject);
                }
                
                // Dynamic character projectile collisions
                this.handleCharacterProjectileCollisions(bodyA, bodyB);
                
                // Enemy projectile hits player (for Chicken Bufo eggs)
                if (bodyA.label === 'enemyProjectile' && bodyB.label === 'player') {
                    this.scene.enemySystem.playerHitByEnemyProjectile(bodyB.gameObject, bodyA.gameObject);
                } else if (bodyA.label === 'player' && bodyB.label === 'enemyProjectile') {
                    this.scene.enemySystem.playerHitByEnemyProjectile(bodyA.gameObject, bodyB.gameObject);
                }
            });
        });
    }

    // Dynamic collision handler for character projectiles
    handleCharacterProjectileCollisions(bodyA, bodyB) {
        // Safety checks for physics bodies and gameObjects
        if (!bodyA || !bodyB || !bodyA.gameObject || !bodyB.gameObject) {
            return;
        }
        
        // Safety check for character system
        if (!this.scene.characterSystem || !this.scene.characterSystem.collisionHandlers) {
            return;
        }
        
        // Additional safety checks for active game objects
        if (!bodyA.gameObject.active || !bodyB.gameObject.active || 
            !bodyA.gameObject.scene || !bodyB.gameObject.scene) {
            return;
        }
        
        // Check all registered projectile labels
        for (const [label, handler] of this.scene.characterSystem.collisionHandlers) {
            if (bodyA.label === label && bodyB.label === 'enemy') {
                this.scene.characterSystem.handleProjectileCollision(label, bodyA.gameObject, bodyB.gameObject);
                return;
            } else if (bodyA.label === 'enemy' && bodyB.label === label) {
                this.scene.characterSystem.handleProjectileCollision(label, bodyB.gameObject, bodyA.gameObject);
                return;
            }
        }
    }

    createGameUI() {
        // Clear existing UI elements
        this.gameUIElements.forEach(element => element.destroy());
        this.gameUIElements = [];
        
        // Create stats panel background (semi-transparent black box)
        const panelWidth = 200;
        const panelHeight = 140;
        const panelX = 20;
        const panelY = 20;
        
        const statsPanel = this.scene.add.rectangle(panelX + panelWidth/2, panelY + panelHeight/2, panelWidth, panelHeight, 0x000000, 0.7);
        statsPanel.setStrokeStyle(2, 0x666666);
        statsPanel.setScrollFactor(0).setDepth(1000);
        this.gameUIElements.push(statsPanel);
        
        // Health bar (inside the panel)
        const healthBarWidth = 160;
        const healthBarHeight = 16;
        const healthBarX = panelX + 20;
        const healthBarY = panelY + 25;
        
        // Health bar background
        const healthBarBg = this.scene.add.rectangle(healthBarX + healthBarWidth/2, healthBarY + healthBarHeight/2, healthBarWidth, healthBarHeight, 0x330000);
        healthBarBg.setStrokeStyle(1, 0x666666);
        healthBarBg.setScrollFactor(0).setDepth(1001);
        this.gameUIElements.push(healthBarBg);
        
        // Health bar foreground (anchored to left side for proper scaling)
        const healthBar = this.scene.add.rectangle(healthBarX, healthBarY + healthBarHeight/2, healthBarWidth, healthBarHeight, 0x00ff00);
        healthBar.setOrigin(0, 0.5); // Anchor to left side instead of center
        healthBar.setScrollFactor(0).setDepth(1002);
        this.gameUIElements.push(healthBar);
        
        // Health text (centered on health bar)
        const healthText = this.scene.add.text(healthBarX + healthBarWidth/2, healthBarY + healthBarHeight/2, '', {
            fontSize: '11px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1003);
        this.gameUIElements.push(healthText);
        
        // Stats text (below health bar)
        const textX = panelX + 10;
        let textY = healthBarY + healthBarHeight + 15;
        const textStyle = {
            fontSize: '12px',
            color: '#ffffff'
        };
        
        // Level text
        const levelText = this.scene.add.text(textX, textY, '', textStyle);
        levelText.setScrollFactor(0).setDepth(1001);
        this.gameUIElements.push(levelText);
        textY += 16;
        
        // XP text
        const xpText = this.scene.add.text(textX, textY, '', textStyle);
        xpText.setScrollFactor(0).setDepth(1001);
        this.gameUIElements.push(xpText);
        textY += 16;
        
        // Time text
        const timeText = this.scene.add.text(textX, textY, '', textStyle);
        timeText.setScrollFactor(0).setDepth(1001);
        this.gameUIElements.push(timeText);
        textY += 16;
        
        // Kills text
        const killsText = this.scene.add.text(textX, textY, '', textStyle);
        killsText.setScrollFactor(0).setDepth(1001);
        this.gameUIElements.push(killsText);
        
        // Store references for updates
        this.healthBar = healthBar;
        this.healthText = healthText;
        this.levelText = levelText;
        this.xpText = xpText;
        this.timeText = timeText;
        this.killsText = killsText;
        
        // Initialize time and kill tracking
        this.gameStartTime = Date.now();
        this.enemyKillCount = 0;
    }

    updateUI() {
        if (!this.scene.gameStarted || !this.scene.statsSystem) return;
        
        const stats = this.scene.statsSystem.getPlayerStats();
        const progression = this.scene.statsSystem.getPlayerProgression();
        
        if (stats && this.healthBar && this.healthText) {
            // Update health bar (standard behavior - decreases from right side)
            const healthPercent = Math.max(0, stats.health / stats.maxHealth);
            this.healthBar.scaleX = healthPercent;
            this.healthText.setText(`${Math.round(stats.health)}/${stats.maxHealth}`);
        }
        
        if (progression && this.levelText) {
            // Update level
            this.levelText.setText(`Level: ${progression.level}`);
        }
        
        if (progression && this.xpText) {
            // Update XP
            this.xpText.setText(`XP: ${progression.xp}/${progression.xpToNextLevel}`);
        }
        
        if (this.timeText && this.gameStartTime) {
            // Update elapsed time
            const elapsedMs = Date.now() - this.gameStartTime;
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
            const timeString = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
            this.timeText.setText(`Time: ${timeString}`);
        }
        
        if (this.killsText) {
            // Update kill count
            this.killsText.setText(`Kills: ${this.enemyKillCount}`);
        }
    }

    // Method to increment kill count when enemies are defeated
    incrementKillCount() {
        this.enemyKillCount++;
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    pauseGame() {
        this.isPaused = true;
        this.scene.matter.world.enabled = false; // Pause physics
        
        // Pause background music
        if (this.scene.audioManager) {
            this.scene.audioManager.onGamePause();
        }
        
        // Use HTML pause menu instead of Phaser
        this.htmlUI.showPauseMenu();
    }

    resumeGame() {
        this.isPaused = false;
        this.scene.matter.world.enabled = true; // Resume physics
        
        // Resume background music
        if (this.scene.audioManager) {
            this.scene.audioManager.onGameResume();
        }
        
        // Hide HTML pause menu
        this.htmlUI.hidePauseMenu();
    }

    showPauseUI() {
        // This method is deprecated - using HTML UI now
        // Keep for backward compatibility but does nothing
    }

    hidePauseUI() {
        // This method is deprecated - using HTML UI now
        // Keep for backward compatibility but does nothing
    }

    gameOver() {
        // Prevent multiple game over calls
        if (this.gameOverInProgress) return;
        this.gameOverInProgress = true;
        
        // Stop game systems immediately
        this.scene.gameStarted = false;
        this.scene.matter.world.enabled = false;
        
        // Clean up systems
        if (this.scene.enemySpawnTimer) {
            this.scene.enemySpawnTimer.remove();
            this.scene.enemySpawnTimer = null;
        }
        
        // Clean up character system timers
        if (this.scene.characterSystem) {
            this.scene.characterSystem.cleanup();
        }
        
        // Clean up enemy system
        if (this.scene.enemySystem) {
            this.scene.enemySystem.cleanup();
        }
        
        // Clean up status effects
        if (this.scene.statusEffectSystem) {
            this.scene.statusEffectSystem.cleanup();
        }
        
        // Hide debug UIs
        if (this.scene.debugUtils) {
            this.scene.debugUtils.hideStatsDebugUI();
        }
        
        // Show game over screen
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        // Prepare stats for the game over screen
        const stats = this.scene.statsSystem.getPlayerStats();
        const progression = this.scene.statsSystem.getPlayerProgression();
        
        const gameOverStats = {
            level: progression ? progression.level : 1,
            time: this.getElapsedTimeString(),
            kills: this.enemyKillCount
        };
        
        // Use HTML game over screen instead of Phaser
        this.htmlUI.showGameOverScreen(gameOverStats);
        
        // Stop background music
        if (this.scene.audioManager) {
            this.scene.audioManager.onGamePause();
        }
    }
    
    getElapsedTimeString() {
        if (!this.gameStartTime) return '0:00';
        
        const elapsedMs = Date.now() - this.gameStartTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
        return `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
    }

    restartGame() {
        // Hide all HTML overlays
        this.htmlUI.hideGameOverScreen();
        this.htmlUI.hidePauseMenu();
        
        // Reset game state
        this.scene.gameStarted = false;
        this.isPaused = false;
        this.gameOverInProgress = false; // Reset game over flag
        
        // Clear existing UI elements
        this.gameUIElements.forEach(element => element.destroy());
        this.gameUIElements = [];
        
        // Reset camera
        this.scene.cameras.main.stopFollow();
        this.scene.cameras.main.setScroll(0, 0);
        
        // Clear all children (remove everything from scene)
        this.scene.children.removeAll();
        
        // Clear all groups if they exist
        if (this.scene.enemies) this.scene.enemies.clear(true, true);
        if (this.scene.xpOrbs) this.scene.xpOrbs.clear(true, true);
        if (this.scene.auraEffects) this.scene.auraEffects.clear(true, true);
        if (this.scene.enemyProjectiles) this.scene.enemyProjectiles.clear(true, true);
        
        // Show character selection
        this.showCharacterSelection();
    }
    
    // Handle gamepad input for HTML UI
    handleGamepadInput() {
        Logger.debug(Logger.Categories.INPUT, 'UISystem.handleGamepadInput called');
        
        if (!this.htmlUI) {
            Logger.warn(Logger.Categories.INPUT, 'htmlUI not available in UISystem');
            return;
        }
        
        Logger.debug(Logger.Categories.INPUT, 'Calling htmlUI.handleGamepadInput');
        // Let HTMLUIManager handle its own input checking
        this.htmlUI.handleGamepadInput();
    }
    
    // Add pause toggle method
    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    // Cleanup method
    destroy() {
        if (this.htmlUI) {
            this.htmlUI.destroy();
        }
    }
}

export default UISystem; 