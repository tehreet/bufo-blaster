// UI System - Handles all user interface elements and interactions

class UISystem {
    constructor(scene) {
        this.scene = scene;
        this.isPaused = false;
        this.pauseUIElements = [];
        this.gameUIElements = [];
    }

    showCharacterSelection() {
        // Clear any existing content
        this.scene.children.removeAll();
        
        // Add a dark background to prevent green screen
        const background = this.scene.add.rectangle(700, 400, 1400, 800, 0x002200);
        background.setDepth(-1000); // Behind everything else
        
        // Title
        this.scene.add.text(700, 100, 'BUFO BLASTER', {
            fontSize: '48px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5);
        
        this.scene.add.text(700, 150, 'Choose Your Character', {
            fontSize: '24px',
            color: '#cccccc'
        }).setOrigin(0.5, 0.5);
        
        // Character cards
        const characters = this.scene.characterSystem.getCharacters();
        const charactersArray = Object.values(characters);
        const cardWidth = 200;
        const cardHeight = 360; // Increased height to accommodate larger character previews
        const spacing = 50;
        const totalWidth = (cardWidth * charactersArray.length) + (spacing * (charactersArray.length - 1));
        const startX = (1400 - totalWidth) / 2;
        const cardY = 250;
        
        const characterCards = [];
        
        charactersArray.forEach((character, index) => {
            const cardX = startX + index * (cardWidth + spacing);
            
            // Card background
            const card = this.scene.add.rectangle(cardX + cardWidth/2, cardY + cardHeight/2, cardWidth, cardHeight, 0x333333);
            card.setStrokeStyle(3, character.color);
            card.setInteractive();
            card.characterData = character;
            
            // Character sprite
            const charSprite = this.scene.add.image(cardX + cardWidth/2, cardY + 80, character.sprite);
            // Make character previews 2x larger too (120px instead of 60px) for consistency
            const previewSize = 120;
            charSprite.setDisplaySize(previewSize, previewSize);
            
                                // Only create GIF overlay for characters that use GIF sprites
            if (character.sprite !== 'bufo-magician' && character.sprite !== 'shield-bufo' && character.sprite !== 'bat-bufo') {
                charSprite.setAlpha(0); // Hide static sprite, use animated overlay
                this.scene.assetManager.createAnimatedOverlay(charSprite, `assets/characters/${character.sprite}.gif`, previewSize, previewSize);
            } else {
                // For PNG characters, show the static sprite
                charSprite.setAlpha(1);
            }
            
            // Character name (moved down to accommodate larger sprite)
            this.scene.add.text(cardX + cardWidth/2, cardY + 170, character.name, {
                fontSize: '16px',
                color: '#ffffff',
                fontWeight: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Character description (moved down)
            this.scene.add.text(cardX + cardWidth/2, cardY + 200, character.description, {
                fontSize: '10px',
                color: '#cccccc',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0);
            
            // Ability info (moved down)
            this.scene.add.text(cardX + cardWidth/2, cardY + 250, character.abilityName, {
                fontSize: '12px',
                color: character.color,
                fontWeight: 'bold'
            }).setOrigin(0.5, 0.5);
            
            this.scene.add.text(cardX + cardWidth/2, cardY + 270, character.abilityDescription, {
                fontSize: '9px',
                color: '#aaaaaa',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0);
            
            // Stats (moved down)
            this.scene.add.text(cardX + cardWidth/2, cardY + 310, `Health: ${character.baseStats.health} | Speed: ${character.baseStats.moveSpeed} | Armor: ${character.baseStats.armor}`, {
                fontSize: '10px',
                color: '#888888'
            }).setOrigin(0.5, 0.5);
            
            // Click handler
            card.on('pointerdown', () => {
                // Set a flag to prevent the global click handler from triggering
                this.scene.inputManager.setCharacterCardClicked();
                this.selectCharacter(character);
            });
            
            // Hover effect
            card.on('pointerover', () => {
                card.setStrokeStyle(4, 0xffffff);
            });
            
            card.on('pointerout', () => {
                card.setStrokeStyle(3, character.color);
            });
            
            characterCards.push(card);
        });
        
        // Instructions
        this.scene.add.text(700, 750, 'Click on a character to begin your adventure!\nGamepad: Use D-Pad or Left Stick to navigate, A to select', {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Set up input manager with character cards
        this.scene.inputManager.setCharacterCards(characterCards);
        this.scene.inputManager.updateCharacterHighlight();
    }

    selectCharacter(character) {
        console.log(`Selected character: ${character.name}`);
        this.scene.characterSystem.setSelectedCharacter(character);
        this.startGame();
    }

    startGame() {
        console.log('Starting game...');
        
        // Clear character selection UI
        this.scene.children.removeAll();
        
        // Game state
        this.scene.gameStarted = true;
        
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
        
        console.log('Game started with character:', this.scene.characterSystem.getSelectedCharacter().name);
    }

    initializeGame() {
        // Initialize player stats based on selected character
        this.scene.statsSystem.initializePlayerStats(this.scene.characterSystem.getSelectedCharacter());
        
        // Initialize game groups
        this.scene.enemies = this.scene.add.group();
        this.scene.xpOrbs = this.scene.add.group();
        this.scene.auraEffects = this.scene.add.group();
        
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
        
        this.scene.player = this.scene.add.image(playerStartX, playerStartY, this.scene.characterSystem.getSelectedCharacter().sprite);
        // Make main character Bufos 2x larger (64px instead of 32px)
        this.scene.player.setDisplaySize(64, 64);
        
        const selectedCharacter = this.scene.characterSystem.getSelectedCharacter();
        
        // Only create GIF overlay for characters that use GIF sprites
        if (selectedCharacter.sprite !== 'bufo-magician' && selectedCharacter.sprite !== 'shield-bufo' && selectedCharacter.sprite !== 'bat-bufo') {
            this.scene.player.setAlpha(0); // Hide static sprite, use animated overlay
            this.scene.assetManager.createAnimatedOverlay(this.scene.player, 
                `assets/characters/${selectedCharacter.sprite}.gif`, 64, 64);
        } else {
            // For PNG characters, show the static sprite
            this.scene.player.setAlpha(1);
        }
        
        // Add Matter.js physics to player (much smaller collision radius to match visual sprite)
        this.scene.matter.add.gameObject(this.scene.player, {
            shape: 'circle',
            radius: 8, // Much smaller radius - visual sprite is 64px, so 8px radius (16px diameter) should work better
            frictionAir: 0.05,
            label: 'player'
        });
        
        // Add debug hitbox visualization for player (updated radius)
        this.scene.player.hitboxDebug = this.scene.debugUtils.createHitboxDebug(this.scene.player, 8, 0x00ff00);
        
        // Initialize character facing direction (default to facing right)
        this.scene.inputManager.lastFacingDirection = false; // false = facing right, true = facing left
        
        // Setup camera to follow player
        this.scene.cameras.main.startFollow(this.scene.player);
        this.scene.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        
        // Setup physics collision handlers
        this.setupPhysicsCollisions();
    }

    generateMap(mapWidth, mapHeight) {
        // Load the pre-generated grass/dirt map
        this.scene.map = this.scene.make.tilemap({ key: 'level1' });
        
        // Add the tileset
        const tileset = this.scene.map.addTilesetImage('grass-dirt', 'tileset');
        
        // Create the layer from the pre-generated map data
        const backgroundLayer = this.scene.map.createLayer('Ground', tileset);
        
        // Update map dimensions to match the actual map
        this.scene.map.widthInPixels = this.scene.map.widthInPixels;
        this.scene.map.heightInPixels = this.scene.map.heightInPixels;
        
        console.log(`Loaded clean grass/dirt map: ${this.scene.map.width}x${this.scene.map.height} tiles (${this.scene.map.widthInPixels}x${this.scene.map.heightInPixels} pixels)`);
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
                
                // Boomerang hits enemy (for Bat Bufo character)
                if (bodyA.label === 'boomerang' && bodyB.label === 'enemy') {
                    this.scene.characterSystem.boomerangHitEnemy(bodyA.gameObject, bodyB.gameObject);
                } else if (bodyA.label === 'enemy' && bodyB.label === 'boomerang') {
                    this.scene.characterSystem.boomerangHitEnemy(bodyB.gameObject, bodyA.gameObject);
                }
                
                // Starfall hits enemy (for Wizard Bufo character)
                if (bodyA.label === 'starfall' && bodyB.label === 'enemy') {
                    this.scene.characterSystem.starfallHitEnemy(bodyA.gameObject, bodyB.gameObject);
                } else if (bodyA.label === 'enemy' && bodyB.label === 'starfall') {
                    this.scene.characterSystem.starfallHitEnemy(bodyB.gameObject, bodyA.gameObject);
                }
                
                // Enemy projectile hits player (for Chicken Bufo eggs)
                if (bodyA.label === 'enemyProjectile' && bodyB.label === 'player') {
                    this.scene.enemySystem.playerHitByEnemyProjectile(bodyB.gameObject, bodyA.gameObject);
                } else if (bodyA.label === 'player' && bodyB.label === 'enemyProjectile') {
                    this.scene.enemySystem.playerHitByEnemyProjectile(bodyA.gameObject, bodyB.gameObject);
                }
            });
        });
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
        
        // Health bar foreground
        const healthBar = this.scene.add.rectangle(healthBarX + healthBarWidth/2, healthBarY + healthBarHeight/2, healthBarWidth, healthBarHeight, 0x00ff00);
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
            // Update health bar
            const healthPercent = stats.health / stats.maxHealth;
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
        
        this.showPauseUI();
        console.log('Game paused');
    }

    resumeGame() {
        this.isPaused = false;
        this.scene.matter.world.enabled = true; // Resume physics
        
        // Resume background music
        if (this.scene.audioManager) {
            this.scene.audioManager.onGameResume();
        }
        
        this.hidePauseUI();
        console.log('Game resumed');
    }

    showPauseUI() {
        // Semi-transparent overlay that covers the entire screen
        const overlay = this.scene.add.rectangle(0, 0, this.scene.cameras.main.width * 2, this.scene.cameras.main.height * 2, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        overlay.setScrollFactor(0).setDepth(1500);
        overlay.setPosition(-this.scene.cameras.main.width/2, -this.scene.cameras.main.height/2);
        this.pauseUIElements.push(overlay);
        
        // Pause title
        const title = this.scene.add.text(700, 300, 'GAME PAUSED', {
            fontSize: '48px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1501);
        this.pauseUIElements.push(title);
        
        // Instructions
        const instructions = this.scene.add.text(700, 400, 'Press ESC or click to resume\nGamepad: Press Start to resume', {
            fontSize: '18px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1501);
        this.pauseUIElements.push(instructions);
        
        // Stats summary
        if (this.scene.statsSystem) {
            const stats = this.scene.statsSystem.getPlayerStats();
            const progression = this.scene.statsSystem.getPlayerProgression();
            
            const summary = this.scene.add.text(700, 500, 
                `Character: ${progression.character.name}\n` +
                `Level: ${progression.level}\n` +
                `Health: ${Math.round(stats.health)}/${stats.maxHealth}\n` +
                `Damage: ${stats.abilityDamage.toFixed(1)} | Cooldown: ${Math.round(stats.abilityCooldown)}ms`, {
                fontSize: '14px',
                color: '#aaaaaa',
                align: 'center'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1501);
            this.pauseUIElements.push(summary);
        }
    }

    hidePauseUI() {
        this.pauseUIElements.forEach(element => element.destroy());
        this.pauseUIElements = [];
    }

    gameOver() {
        console.log('Game Over!');
        
        // Stop game systems
        this.scene.gameStarted = false;
        this.scene.matter.world.enabled = false;
        
        // Clean up systems
        if (this.scene.enemySpawnTimer) {
            this.scene.enemySpawnTimer.remove();
        }
        if (this.scene.shieldBashTimer) {
            this.scene.shieldBashTimer.remove();
        }
        
        // Clean up poison and bleed timers
        if (this.scene.enemySystem) {
            if (this.scene.enemySystem.poisonTimer) {
                console.log('🦠 POISON: Cleaning up poison timer on game over');
                this.scene.enemySystem.poisonTimer.remove();
                this.scene.enemySystem.poisonTimer = null;
            }
            if (this.scene.enemySystem.bleedTimer) {
                console.log('🩸 BLEED: Cleaning up bleed timer on game over');
                this.scene.enemySystem.bleedTimer.remove();
                this.scene.enemySystem.bleedTimer = null;
            }
            // Clear poison/bleed state
            this.scene.enemySystem.clearPoisonEffect();
            this.scene.enemySystem.clearBleedEffect();
        }
        
        // Hide debug UIs
        this.scene.debugUtils.hideStatsDebugUI();
        
        // Clean up magnet orbs
        if (this.scene.enemySystem) {
            this.scene.enemySystem.cleanupAllMagnetOrbs();
        }
        
        // Clean up status effects
        if (this.scene.statusEffectSystem) {
            this.scene.statusEffectSystem.cleanup();
        }
        
        // Handle game over music (keep playing by default)
        if (this.scene.audioManager) {
            this.scene.audioManager.onGameOver();
        }
        
        // Clean up animated overlays
        this.scene.assetManager.cleanupAllOverlays();
        
        // Clear game UI
        this.gameUIElements.forEach(element => element.destroy());
        this.gameUIElements = [];
        
        // Show game over screen
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        // Calculate final run time
        let finalRunTime = '0:00';
        if (this.gameStartTime) {
            const elapsedMs = Date.now() - this.gameStartTime;
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
            finalRunTime = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
        }
        
        // Semi-transparent overlay that covers the entire screen
        const overlay = this.scene.add.rectangle(0, 0, this.scene.cameras.main.width * 2, this.scene.cameras.main.height * 2, 0x000000, 0.9);
        overlay.setOrigin(0, 0);
        overlay.setScrollFactor(0).setDepth(2000);
        overlay.setPosition(-this.scene.cameras.main.width/2, -this.scene.cameras.main.height/2);
        
        // Game Over title
        const title = this.scene.add.text(700, 200, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2001);
        
        // Final stats
        if (this.scene.statsSystem) {
            const progression = this.scene.statsSystem.getPlayerProgression();
            
            const finalStats = this.scene.add.text(700, 350, 
                `Character: ${progression.character.name}\n` +
                `Final Level: ${progression.level}\n` +
                `Total XP: ${progression.xp}\n` +
                `Run Time: ${finalRunTime}\n` +
                `Enemies Killed: ${this.enemyKillCount}`, {
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2001);
        }
        
        // Restart button
        const restartButton = this.scene.add.rectangle(700, 550, 300, 60, 0x444444);
        restartButton.setStrokeStyle(3, 0x888888);
        restartButton.setScrollFactor(0).setDepth(2001);
        restartButton.setInteractive();
        
        const restartText = this.scene.add.text(700, 550, 'RESTART GAME', {
            fontSize: '24px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2002);
        
        // Button functionality
        restartButton.on('pointerdown', () => {
            this.restartGame();
        });
        
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x666666);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x444444);
        });
        
        // Additional instruction
        const instruction = this.scene.add.text(700, 630, 'Click restart to choose a new character', {
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2001);
    }

    restartGame() {
        console.log('Restarting game...');
        
        // Clean up all systems and timers
        if (this.scene.enemySpawnTimer) {
            this.scene.enemySpawnTimer.remove();
            this.scene.enemySpawnTimer = null;
        }
        if (this.scene.shieldBashTimer) {
            this.scene.shieldBashTimer.remove();
            this.scene.shieldBashTimer = null;
        }
        if (this.scene.enemySystem && this.scene.enemySystem.poisonTimer) {
            this.scene.enemySystem.poisonTimer.remove();
            this.scene.enemySystem.poisonTimer = null;
        }
        
        // Clear enemy system poison state and magnet orbs
        if (this.scene.enemySystem) {
            this.scene.enemySystem.hidePoisonEffect();
            this.scene.enemySystem.poisonTimer = null;
            this.scene.enemySystem.cleanupAllMagnetOrbs();
        }
        
        // Clean up status effects
        if (this.scene.statusEffectSystem) {
            this.scene.statusEffectSystem.cleanup();
        }
        
        // Clean up animated overlays
        this.scene.assetManager.cleanupAllOverlays();
        
        // Clear all groups
        if (this.scene.enemies) this.scene.enemies.clear(true, true);
        if (this.scene.xpOrbs) this.scene.xpOrbs.clear(true, true);
        if (this.scene.auraEffects) this.scene.auraEffects.clear(true, true);
        if (this.scene.starfallProjectiles) this.scene.starfallProjectiles.clear(true, true);
        if (this.scene.boomerangs) this.scene.boomerangs.clear(true, true);
        if (this.scene.enemyProjectiles) this.scene.enemyProjectiles.clear(true, true);
        
        // Reset character system
        this.scene.characterSystem.selectedCharacter = null;
        this.scene.characterSystem.characterSelected = false;
        
        // Reset stats system
        this.scene.statsSystem.playerStats = null;
        this.scene.statsSystem.playerProgression = null;
        this.scene.statsSystem.statModifiers = null;
        
        // Reset upgrade system
        this.scene.upgradeSystem.isPaused = false;
        this.scene.upgradeSystem.upgradeActive = false;
        this.scene.upgradeSystem.currentUpgrades = [];
        this.scene.upgradeSystem.upgradeUIElements = [];
        this.scene.upgradeSystem.rerollCount = 1;
        
        // Reset game state
        this.scene.gameStarted = false;
        this.scene.isPaused = false;
        this.scene.matter.world.enabled = false;
        
        // Reset camera
        this.scene.cameras.main.stopFollow();
        this.scene.cameras.main.setScroll(0, 0);
        this.scene.cameras.main.setBounds(0, 0, 1400, 800);
        
        // Clear all children (remove everything from scene)
        this.scene.children.removeAll();
        
        // Reset UI states
        this.isPaused = false;
        this.gameUIElements = [];
        this.pauseUIElements = [];
        
        // Reset input manager state
        this.scene.inputManager.characterCardClicked = false;
        this.scene.inputManager.upgradeCardClicked = false;
        this.scene.inputManager.selectedCharacterIndex = 0;
        this.scene.inputManager.characterCards = [];
        
        // Reset character direction state
        this.scene.inputManager.lastFacingDirection = null;
        
        // Go back to character selection
        this.showCharacterSelection();
    }
}

export default UISystem; 