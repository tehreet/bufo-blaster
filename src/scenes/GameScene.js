import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    


    preload() {
        // Load tilemap assets
        this.load.image('tileset', 'assets/map/tilemap.png');
        this.load.tilemapTiledJSON('level1', 'assets/map/level1.json');
        
        // Load character sprites (static for collision, we'll overlay GIFs for animation)
        this.load.image('stab-bufo', 'assets/characters/stab-bufo.gif');
        this.load.image('wizard-bufo', 'assets/characters/wizard-bufo.gif');
        this.load.image('goose-bufo', 'assets/characters/goose-bufo.gif');
        
        // Load enemy sprites (static for collision, we'll overlay GIFs for animation)
        this.load.image('bufo-dancing', 'assets/enemies/bufo-dancing.gif');
        this.load.image('bufo-clown', 'assets/enemies/bufo-clown.png');
        this.load.image('bufo-pog', 'assets/enemies/bufo-pog.png');
        this.load.image('bufo-eyes', 'assets/enemies/bufo-eyes.gif');
        this.load.image('bufo-mob', 'assets/enemies/bufo-mob.png');
        
        // Load sound effects (from original game)
        this.load.audio('shoot', 'assets/sfx/shoot.mp3');
        this.load.audio('enemyDie', 'assets/sfx/enemy_die.mp3');
        this.load.audio('pickup', 'assets/sfx/pickup.mp3');
        this.load.audio('playerHit', 'assets/sfx/player_hit.mp3');
        this.load.audio('musicLoop', 'assets/sfx/music_loop.mp3');
    }

    create() {
        // Game state
        this.gameStarted = false;
        this.characterSelected = false;
        this.selectedCharacter = null;
        
        // Game constants (adjusted for sprite-based collision)
        this.gameConfig = {
            ENEMY_RADIUS: 10,
            ENEMY_SPEED: 75, // Adjusted for Phaser
            ENEMY_MAX_HEALTH: 3,
            ENEMY_CONTACT_DAMAGE: 10,
            PLAYER_RADIUS: 16, // Reduced to better match 36px sprite display size
            XP_ORB_RADIUS: 8,
            XP_ORB_MAGNET_SPEED: 200,
            STAB_BUFO_AURA_RADIUS: 80,
            STAB_BUFO_AURA_DAMAGE: 0.6,
            STAB_BUFO_AURA_TICK_INTERVAL: 450,
            ENEMY_SPAWN_INTERVAL: 1200 // Balanced at 1200ms (50% slower than previous 800ms)
        };
        
        // Character definitions with comprehensive base stats
        this.characters = {
            STAB_BUFO: {
                id: 'stab',
                name: 'Stab Bufo',
                description: 'Melee bruiser with damaging aura and knockback',
                abilityName: 'Toxic Aura',
                abilityDescription: 'Damages and knocks back nearby enemies',
                color: 0x00ff00,
                sprite: 'stab-bufo',
                baseStats: {
                    // Core Stats
                    health: 120,
                    armor: 2, // Reduces incoming damage
                    healthRegen: 0.5, // HP per second
                    
                    // Ability Stats
                    abilityDamage: 0.6, // Base damage for toxic aura
                    abilityCooldown: 450, // Milliseconds between aura ticks
                    abilityRadius: 80, // Aura radius
                    
                    // Utility Stats
                    pickupRange: 80, // XP orb magnetism range
                    projectileCount: 1, // Not used by Stab, but for consistency
                    
                    // Movement
                    moveSpeed: 4
                }
            },
            WIZARD_BUFO: {
                id: 'wizard',
                name: 'Wizard Bufo',
                description: 'Ranged caster with area confusion spells',
                abilityName: 'Starfall',
                abilityDescription: 'Casts stars that damage and confuse enemies',
                color: 0x0066ff,
                sprite: 'wizard-bufo',
                baseStats: {
                    // Core Stats
                    health: 100,
                    armor: 0, // Glass cannon
                    healthRegen: 0,
                    
                    // Ability Stats
                    abilityDamage: 3, // Star damage
                    abilityCooldown: 1500, // Milliseconds between starfall casts
                    abilityRadius: 100, // AOE radius of star impact
                    
                    // Utility Stats
                    pickupRange: 100, // Higher pickup range for ranged character
                    projectileCount: 5, // Number of stars per cast
                    
                    // Movement
                    moveSpeed: 5
                }
            },
            GOOSE_BUFO: {
                id: 'goose',
                name: 'Goose Bufo',
                description: 'Summoner with orbiting geese that convert enemies',
                abilityName: 'Goose Guard',
                abilityDescription: 'Orbiting geese damage enemies and convert them to allies',
                color: 0xffaa00,
                sprite: 'goose-bufo',
                baseStats: {
                    // Core Stats
                    health: 110,
                    armor: 1, // Moderate armor
                    healthRegen: 0.2,
                    
                    // Ability Stats
                    abilityDamage: 1, // Damage per goose hit
                    abilityCooldown: 2000, // Orbit speed base (lower = faster)
                    abilityRadius: 60, // Orbit radius
                    
                    // Utility Stats
                    pickupRange: 90,
                    projectileCount: 3, // Number of orbiting geese
                    
                    // Movement
                    moveSpeed: 4.5
                }
            }
        };
        
        // Enemy type definitions (hitbox radii adjusted to match sprite proportions)
        this.enemyTypes = [
            {
                id: 'dancing',
                name: 'Dancing Bufo',
                sprite: 'bufo-dancing',
                health: 2,
                speed: 60,
                displaySize: 40, // Visual size
                hitboxRadius: 16, // ~40% of display size for better sprite matching
                xpValue: 10,
                weight: 30 // Higher weight = more common
            },
            {
                id: 'clown',
                name: 'Clown Bufo',
                sprite: 'bufo-clown',
                health: 3,
                speed: 45,
                displaySize: 44,
                hitboxRadius: 18, // ~40% of display size for better sprite matching
                xpValue: 15,
                weight: 25
            },
            {
                id: 'pog',
                name: 'Pog Bufo',
                sprite: 'bufo-pog',
                health: 1,
                speed: 80,
                displaySize: 36,
                hitboxRadius: 14, // ~40% of display size for better sprite matching
                xpValue: 8,
                weight: 35 // Fast but weak
            },
            {
                id: 'eyes',
                name: 'Eyes Bufo',
                sprite: 'bufo-eyes',
                health: 4,
                speed: 40,
                displaySize: 48,
                hitboxRadius: 20, // ~40% of display size for better sprite matching
                xpValue: 20,
                weight: 10 // Rare but tough
            },
            {
                id: 'mob',
                name: 'Mob Bufo',
                sprite: 'bufo-mob',
                health: 6,
                speed: 50,
                displaySize: 48,
                hitboxRadius: 20, // ~40% of display size for better sprite matching
                xpValue: 30,
                weight: 5 // Very rare but very tough
            }
        ];
        
        // Start with character selection
        this.showCharacterSelection();
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
        this.statsDebugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Gamepad support
        this.setupGamepadSupport();
        
        // Debug settings
        this.showHitboxes = false;
        this.showStatsDebug = false;
        this.statsDebugUI = null;
        
        // Overlay management
        this.overlaysHidden = false;
        
        // Pause system
        this.isPaused = false;
        this.pauseUIElements = [];
        
        // Character selection click prevention
        this.characterCardClicked = false;
        
        // Mouse input
        this.input.on('pointerdown', this.handleClick, this);
        

    }
    
    setupGamepadSupport() {
        // Check if gamepad support is available
        if (!this.input.gamepad) {
            this.gamepadState = {
                connected: false,
                pad: null,
                lastButtonPress: {},
                selectedUpgradeIndex: 0,
                deadzone: 0.3,
                supported: false
            };
            return;
        }
        
        try {
            // The gamepad manager should already be started with the config, but let's ensure it
            if (!this.input.gamepad.enabled) {
                this.input.gamepad.start();
            }
            
            // Gamepad state tracking
            this.gamepadState = {
                connected: false,
                pad: null,
                lastButtonPress: {},
                selectedUpgradeIndex: 0, // For navigating upgrades with gamepad
                deadzone: 0.3, // Analog stick deadzone
                supported: true
            };
            
            // Listen for gamepad connection
            this.input.gamepad.on('connected', (pad) => {
                // Only connect to actual game controllers, not headsets
                if (this.isValidGameController(pad)) {
                    this.gamepadState.connected = true;
                    this.gamepadState.pad = pad;
                    
                    // Show gamepad controls hint
                    this.showGamepadHint();
                }
            });
            
            this.input.gamepad.on('disconnected', (pad) => {
                this.gamepadState.connected = false;
                this.gamepadState.pad = null;
            });
            
            // Check for already connected gamepads
            if (this.input.gamepad.total > 0) {
                for (let i = 0; i < this.input.gamepad.total; i++) {
                    const pad = this.input.gamepad.getPad(i);
                    if (pad && pad.connected) {
                        if (this.isValidGameController(pad)) {
                            this.gamepadState.connected = true;
                            this.gamepadState.pad = pad;
                            this.showGamepadHint();
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to initialize gamepad support:', error);
            this.gamepadState = {
                connected: false,
                pad: null,
                lastButtonPress: {},
                selectedUpgradeIndex: 0,
                deadzone: 0.3,
                supported: false
            };
        }
    }
    
    isValidGameController(pad) {
        if (!pad || !pad.id) return false;
        
        const id = pad.id.toLowerCase();
        
        // List of known gaming controller patterns
        const gameControllerPatterns = [
            'xbox',
            'x-box',
            'microsoft',
            'standard gamepad',
            'dualshock',
            'playstation',
            'ps4',
            'ps5',
            'nintendo',
            'pro controller',
            'joycon',
            'steam controller',
            'logitech'
        ];
        
        // List of devices to exclude (headsets, audio devices, etc.)
        const excludePatterns = [
            'corsair',
            'virtuoso',
            'headset',
            'headphone',
            'audio',
            'microphone',
            'speaker',
            'sound',
            'wireless gaming receiver', // Corsair headset pattern
            'receiver' // Generic receiver pattern for headsets
        ];
        
        // Check if it's explicitly excluded
        for (const exclude of excludePatterns) {
            if (id.includes(exclude)) {
                return false;
            }
        }
        
        // Check if it matches known game controller patterns
        for (const pattern of gameControllerPatterns) {
            if (id.includes(pattern)) {
                return true;
            }
        }
        
        // Additional check: real game controllers usually have at least 10 buttons
        // and analog sticks
        if (pad.buttons && pad.buttons.length >= 10 && pad.leftStick) {
            return true;
        }
        
        // If unsure, default to false to avoid connecting to wrong devices
        return false;
    }
    
    showGamepadHint() {
        // Show a temporary hint about gamepad controls
        const hint = this.add.text(700, 50, 'Xbox Controller Connected!\nLeft Stick: Move/Navigate | A: Select | X: Reroll\nY: Hitboxes | Select: Stats Debug', {
            fontSize: '14px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Fade out after 3 seconds
        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: hint,
                alpha: 0,
                duration: 1000,
                onComplete: () => hint.destroy()
            });
        });
    }
    
    showCharacterSelection() {
        // Clear any existing content
        this.children.removeAll();
        
        // Title
        this.add.text(700, 100, 'BUFO BLASTER', {
            fontSize: '48px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5);
        
        this.add.text(700, 150, 'Choose Your Character', {
            fontSize: '24px',
            color: '#cccccc'
        }).setOrigin(0.5, 0.5);
        
        // Character cards
        const charactersArray = Object.values(this.characters);
        const cardWidth = 200;
        const cardHeight = 360; // Increased height to accommodate larger character previews
        const spacing = 50;
        const totalWidth = (cardWidth * charactersArray.length) + (spacing * (charactersArray.length - 1));
        const startX = (1400 - totalWidth) / 2;
        const cardY = 250;
        
        this.characterCards = [];
        
        charactersArray.forEach((character, index) => {
            const cardX = startX + index * (cardWidth + spacing);
            
            // Card background
            const card = this.add.rectangle(cardX + cardWidth/2, cardY + cardHeight/2, cardWidth, cardHeight, 0x333333);
            card.setStrokeStyle(3, character.color);
            card.setInteractive();
            card.characterData = character;
            
            // Character sprite
            const charSprite = this.add.image(cardX + cardWidth/2, cardY + 80, character.sprite);
            // Make character previews 2x larger too (120px instead of 60px) for consistency
            const previewSize = 120;
            charSprite.setDisplaySize(previewSize, previewSize);
            charSprite.setAlpha(0); // Hide static sprite, use animated overlay
            
            // Create animated GIF overlay for character selection (also 2x larger)
            this.createAnimatedOverlay(charSprite, `assets/characters/${character.sprite}.gif`, previewSize, previewSize);
            
            // Character name (moved down to accommodate larger sprite)
            this.add.text(cardX + cardWidth/2, cardY + 170, character.name, {
                fontSize: '16px',
                color: '#ffffff',
                fontWeight: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Character description (moved down)
            this.add.text(cardX + cardWidth/2, cardY + 200, character.description, {
                fontSize: '10px',
                color: '#cccccc',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0);
            
            // Ability info (moved down)
            this.add.text(cardX + cardWidth/2, cardY + 250, character.abilityName, {
                fontSize: '12px',
                color: character.color,
                fontWeight: 'bold'
            }).setOrigin(0.5, 0.5);
            
            this.add.text(cardX + cardWidth/2, cardY + 270, character.abilityDescription, {
                fontSize: '9px',
                color: '#aaaaaa',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0);
            
            // Stats (moved down)
            this.add.text(cardX + cardWidth/2, cardY + 310, `Health: ${character.baseStats.health} | Speed: ${character.baseStats.moveSpeed} | Armor: ${character.baseStats.armor}`, {
                fontSize: '10px',
                color: '#888888'
            }).setOrigin(0.5, 0.5);
            
            // Click handler
            card.on('pointerdown', () => {
                // Set a flag to prevent the global click handler from triggering
                this.characterCardClicked = true;
                this.selectCharacter(character);
            });
            
            // Hover effect
            card.on('pointerover', () => {
                card.setStrokeStyle(4, 0xffffff);
            });
            
            card.on('pointerout', () => {
                card.setStrokeStyle(3, character.color);
            });
            
            this.characterCards.push(card);
        });
        
        // Instructions
        this.add.text(700, 750, 'Click on a character to begin your adventure!\nGamepad: Use D-Pad or Left Stick to navigate, A to select', {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Initialize gamepad character selection
        this.selectedCharacterIndex = 0;
        this.updateCharacterHighlight();
    }
    
    updateCharacterHighlight() {
        // Remove previous highlights
        this.characterCards.forEach((card, index) => {
            if (index === this.selectedCharacterIndex) {
                card.setStrokeStyle(4, 0xffff00); // Yellow highlight for selected
            } else {
                const character = Object.values(this.characters)[index];
                card.setStrokeStyle(3, character.color); // Back to original color
            }
        });
    }
    
    selectCharacter(character) {
        this.selectedCharacter = character;
        this.characterSelected = true;
        
        // Start the actual game
        this.startGame();
    }
    
    startGame() {
        // Clean up character selection animated overlays
        if (this.characterCards) {
            this.characterCards.forEach(card => {
                // Find the character sprite and clean up its overlay
                if (card.characterData) {
                    const charSprite = this.children.list.find(child => 
                        child.texture && child.texture.key === card.characterData.sprite
                    );
                    if (charSprite) {
                        this.destroyAnimatedOverlay(charSprite);
                    }
                }
            });
        }
        
        // Clear character selection
        this.children.removeAll();
        
        // Create a much larger procedural tilemap world
        const mapWidth = 200; // 200 tiles wide
        const mapHeight = 150; // 150 tiles tall
        const tileSize = 16;
        
        // Create blank tilemap
        this.map = this.make.tilemap({
            width: mapWidth,
            height: mapHeight,
            tileWidth: tileSize,
            tileHeight: tileSize
        });
        
        this.tileset = this.map.addTilesetImage('ground', 'tileset');
        this.groundLayer = this.map.createBlankLayer('Ground', this.tileset);
        
        // Fill the map procedurally
        this.generateMap(mapWidth, mapHeight);
        
        // Create player at center of large map
        const centerX = (mapWidth * tileSize) / 2;
        const centerY = (mapHeight * tileSize) / 2;
        this.player = this.add.image(centerX, centerY, this.selectedCharacter.sprite);
        // Make player character 2x larger visually (64px instead of 32px)
        const playerDisplaySize = this.gameConfig.PLAYER_RADIUS * 4; // 2x larger than before (was * 2)
        this.player.setDisplaySize(playerDisplaySize, playerDisplaySize);
        this.player.setAlpha(0); // Hide static sprite, we'll use animated overlay
        
        // Create animated GIF overlay for player (also 2x larger)
        this.createAnimatedOverlay(this.player, `assets/characters/${this.selectedCharacter.sprite}.gif`, 
                                  playerDisplaySize, playerDisplaySize);
        
        // Add Matter.js physics to player with explicit radius
        this.matter.add.gameObject(this.player, {
            shape: {
                type: 'circle',
                radius: this.gameConfig.PLAYER_RADIUS
            },
            frictionAir: 0.085,
            density: 0.002,
            label: 'player'
        });
        
        // Add debug hitbox visualization for player (initially hidden)
        this.player.hitboxDebug = this.add.circle(centerX, centerY, this.gameConfig.PLAYER_RADIUS, 0x00ff00, 0.3);
        this.player.hitboxDebug.setStrokeStyle(3, 0x00ff00);
        this.player.hitboxDebug.setVisible(this.showHitboxes);
        
        console.log(`Player created with explicit collision radius: ${this.gameConfig.PLAYER_RADIUS}px, display size: ${playerDisplaySize}px (2x larger for better visibility)`);
        console.log(`Collision setup: Player (${this.gameConfig.PLAYER_RADIUS}px) vs Enemies (14-20px) - much better sprite matching!`);
        
        // Initialize comprehensive stats system
        this.initializePlayerStats();
        
        // Create game object groups (using regular Phaser groups, not physics groups)
        this.enemies = this.add.group();
        this.xpOrbs = this.add.group();
        this.auraEffects = this.add.group(); // For visual effects
        
        // Set world bounds to match the tilemap
        const worldWidth = this.map.widthInPixels;
        const worldHeight = this.map.heightInPixels;
        this.matter.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Camera follows player with smooth movement
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setZoom(1); // You can adjust zoom level here
        
        // Optional: Add some camera deadzone for smoother movement
        this.cameras.main.setDeadzone(100, 100);
        
        // Debug: Log the actual map dimensions
        console.log('Map dimensions:', worldWidth, 'x', worldHeight);
        console.log('Camera setup with smooth following');
        console.log('World bounds set for Matter.js');
        console.log('Player physics body created');
        
        // Setup Matter.js collisions
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                
                // Check for player-enemy collision
                if ((bodyA.label === 'player' && bodyB.label === 'enemy') ||
                    (bodyA.label === 'enemy' && bodyB.label === 'player')) {
                    const player = bodyA.label === 'player' ? bodyA.gameObject : bodyB.gameObject;
                    const enemy = bodyA.label === 'enemy' ? bodyA.gameObject : bodyB.gameObject;
                    
                    // Check if both objects still exist and are active
                    if (player && enemy && player.active && enemy.active) {
                        this.playerHitEnemy(player, enemy);
                    }
                }
                
                // Check for player-xpOrb collision
                if ((bodyA.label === 'player' && bodyB.label === 'xpOrb') ||
                    (bodyA.label === 'xpOrb' && bodyB.label === 'player')) {
                    const player = bodyA.label === 'player' ? bodyA.gameObject : bodyB.gameObject;
                    const xpOrb = bodyA.label === 'xpOrb' ? bodyA.gameObject : bodyB.gameObject;
                    
                    // Check if both objects still exist and are active
                    if (player && xpOrb && player.active && xpOrb.active) {
                        this.playerCollectXP(player, xpOrb);
                    }
                }
                
                // Check for goose-enemy collision
                if ((bodyA.label === 'goose' && bodyB.label === 'enemy') ||
                    (bodyA.label === 'enemy' && bodyB.label === 'goose')) {
                    const goose = bodyA.label === 'goose' ? bodyA.gameObject : bodyB.gameObject;
                    const enemy = bodyA.label === 'enemy' ? bodyA.gameObject : bodyB.gameObject;
                    
                    // Enhanced safety checks for goose-enemy collision
                    if (goose && enemy && 
                        goose.active && enemy.active && 
                        goose.scene && enemy.scene &&
                        typeof goose.x === 'number' && typeof goose.y === 'number' &&
                        typeof enemy.x === 'number' && typeof enemy.y === 'number' &&
                        enemy.body) {
                        this.gooseHitEnemy(goose, enemy);
                    }
                }
            });
        });
        
        // Character-specific setup
        this.setupCharacterAbilities();
        
        // Start enemy spawning
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.gameConfig.ENEMY_SPAWN_INTERVAL,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // UI
        this.createGameUI();
        
        this.gameStarted = true;
        // Initialize upgrade system
        this.upgradeSystem = {
            isPaused: false,
            rerollsRemaining: 1,
            currentUpgradeChoices: [],
            usedUpgradeIds: new Set() // Track which upgrades are currently shown
        };
        
        // Initialize upgrade selection timing to prevent accidental pause
        this.lastUpgradeSelectionTime = 0;
        
        console.log(`Game started with ${this.selectedCharacter.name}!`);
    }
    
    initializePlayerStats() {
        // Clear any existing player stats to ensure clean start
        this.playerStats = null;
        
        // Base character stats
        const baseStats = this.selectedCharacter.baseStats;
        
        // Core progression stats
        this.playerProgression = {
            character: this.selectedCharacter,
            xp: 0,
            level: 1,
            xpToNextLevel: 100,
            invincible: false,
            invincibilityEnd: 0,
            lastRegenTime: 0
        };
        
        // Upgrade modifiers (flat bonuses and multipliers)
        this.statModifiers = {
            // Flat bonuses
            healthBonus: 0,
            armorBonus: 0,
            healthRegenBonus: 0,
            abilityDamageBonus: 0,
            pickupRangeBonus: 0,
            abilityRadiusBonus: 0,
            projectileCountBonus: 0,
            
            // Multipliers
            abilityDamageMultiplier: 1.0,
            abilityCooldownMultiplier: 1.0,
            moveSpeedMultiplier: 1.0,
            abilityRadiusMultiplier: 1.0,
            pickupRangeMultiplier: 1.0
        };
        
        // Calculate and cache current stats (reset health to max for new game)
        this.refreshPlayerStats(true);
        
        console.log('Player stats initialized:', this.playerStats);
    }
    
    refreshPlayerStats(resetHealth = false) {
        // Calculate current stats based on base stats + modifiers
        const baseStats = this.selectedCharacter.baseStats;
        const mods = this.statModifiers;
        
        // Calculate final stats
        const maxHealth = Math.floor(baseStats.health + mods.healthBonus);
        const armor = Math.max(0, baseStats.armor + mods.armorBonus);
        const healthRegen = Math.max(0, baseStats.healthRegen + mods.healthRegenBonus);
        const abilityDamage = Math.max(0.1, (baseStats.abilityDamage + mods.abilityDamageBonus) * mods.abilityDamageMultiplier);
        const abilityCooldown = Math.max(50, baseStats.abilityCooldown * mods.abilityCooldownMultiplier);
        const abilityRadius = Math.max(10, (baseStats.abilityRadius + mods.abilityRadiusBonus) * mods.abilityRadiusMultiplier);
        const pickupRange = Math.max(20, (baseStats.pickupRange + mods.pickupRangeBonus) * mods.pickupRangeMultiplier);
        const projectileCount = Math.max(1, baseStats.projectileCount + mods.projectileCountBonus);
        const moveSpeed = Math.max(1, baseStats.moveSpeed * mods.moveSpeedMultiplier);
        
        // Determine current health: reset to max if requested, otherwise preserve current health
        let currentHealth;
        if (resetHealth || !this.playerStats || typeof this.playerStats.health !== 'number') {
            currentHealth = maxHealth; // Reset to full health for new game or if health is invalid
            console.log(`Health reset to max: ${currentHealth} (resetHealth: ${resetHealth})`);
        } else {
            currentHealth = this.playerStats.health; // Preserve current health during upgrades
            console.log(`Health preserved: ${currentHealth}`);
        }
        
        // Update cached stats
        this.playerStats = {
            // Core stats
            health: currentHealth,
            maxHealth: maxHealth,
            armor: armor,
            healthRegen: healthRegen,
            
            // Ability stats
            abilityDamage: abilityDamage,
            abilityCooldown: abilityCooldown,
            abilityRadius: abilityRadius,
            
            // Utility stats
            pickupRange: pickupRange,
            projectileCount: projectileCount,
            
            // Movement
            moveSpeed: moveSpeed,
            speed: moveSpeed * 50, // Scaled for Phaser physics
            
            // Legacy compatibility (for existing systems)
            stabAuraRadius: abilityRadius, // For Stab Bufo aura
            wizardStarCount: projectileCount, // For Wizard Bufo stars
            gooseOrbitRadius: abilityRadius, // For Goose Bufo orbit
            healthRegenPerSecond: healthRegen,
            
            // Keep upgrade multipliers for systems that need them
            abilityDamageMultiplier: mods.abilityDamageMultiplier,
            abilityCooldownMultiplier: mods.abilityCooldownMultiplier,
            moveSpeedMultiplier: mods.moveSpeedMultiplier
        };
        
        // Ensure health doesn't exceed max
        if (this.playerStats.health > this.playerStats.maxHealth) {
            this.playerStats.health = this.playerStats.maxHealth;
        }
    }
    
    // Helper method to add stat bonuses from upgrades
    addStatBonus(statName, amount) {
        if (this.statModifiers.hasOwnProperty(statName)) {
            this.statModifiers[statName] += amount;
            this.refreshPlayerStats();
            console.log(`Added ${amount} to ${statName}. New value: ${this.statModifiers[statName]}`);
        } else {
            console.warn(`Unknown stat: ${statName}`);
        }
    }
    
    // Helper method to multiply stats
    multiplyStats(statName, multiplier) {
        if (this.statModifiers.hasOwnProperty(statName)) {
            this.statModifiers[statName] *= multiplier;
            this.refreshPlayerStats();
            console.log(`Multiplied ${statName} by ${multiplier}. New value: ${this.statModifiers[statName]}`);
        } else {
            console.warn(`Unknown stat: ${statName}`);
        }
    }
    
    generateMap(mapWidth, mapHeight) {
        // Create a simple map with grass interior and stone border
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
                let tileIndex;
                
                // Border tiles (stone)
                if (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) {
                    tileIndex = 1; // Stone tile
                } else {
                    // Interior tiles (grass with some variation)
                    if (Math.random() < 0.95) {
                        tileIndex = 2; // Grass tile
                    } else {
                        tileIndex = 3; // Occasional different grass tile for variety
                    }
                }
                
                this.groundLayer.putTileAt(tileIndex, x, y);
            }
        }
        
        // Add some decorative elements
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(5, mapWidth - 5);
            const y = Phaser.Math.Between(5, mapHeight - 5);
            // Add some decorative tiles randomly
            if (Math.random() < 0.3) {
                this.groundLayer.putTileAt(Phaser.Math.Between(4, 8), x, y);
            }
        }
        
        console.log(`Generated ${mapWidth}x${mapHeight} procedural map (${mapWidth * 16}x${mapHeight * 16} pixels)`);
    }
    
    getAvailableUpgrades() {
        const baseUpgrades = [
            {
                id: 'ability_damage',
                name: 'Ability Power',
                description: 'Increases ability damage by 25%',
                icon: '💥',
                apply: () => {
                    this.multiplyStats('abilityDamageMultiplier', 1.25);
                }
            },
            {
                id: 'cooldown_reduction',
                name: 'Cooldown Reduction',
                description: 'Reduces ability cooldowns by 15%',
                icon: '⚡',
                apply: () => {
                    this.multiplyStats('abilityCooldownMultiplier', 0.85);
                    // Update existing cooldowns for wizard
                    if (this.selectedCharacter.id === 'wizard') {
                        this.starfallCooldown = this.playerStats.abilityCooldown;
                    }
                }
            },
            {
                id: 'health_regen',
                name: 'Regeneration',
                description: 'Increases health regeneration by 1 HP/sec',
                icon: '💚',
                apply: () => {
                    this.addStatBonus('healthRegenBonus', 1);
                }
            },
            {
                id: 'max_health',
                name: 'Vitality',
                description: 'Increases maximum health by 25',
                icon: '❤️',
                apply: () => {
                    this.addStatBonus('healthBonus', 25);
                    this.playerStats.health += 25; // Heal for the bonus amount
                }
            },
            {
                id: 'armor',
                name: 'Thick Hide',
                description: 'Increases armor by 2 (reduces damage taken)',
                icon: '🛡️',
                apply: () => {
                    this.addStatBonus('armorBonus', 2);
                }
            },
            {
                id: 'pickup_range',
                name: 'Magnetic Attraction',
                description: 'Increases XP pickup range by 30%',
                icon: '🧲',
                apply: () => {
                    this.multiplyStats('pickupRangeMultiplier', 1.3);
                }
            },
            {
                id: 'ability_radius',
                name: 'Power Extension',
                description: 'Increases ability radius by 25%',
                icon: '🎯',
                apply: () => {
                    this.multiplyStats('abilityRadiusMultiplier', 1.25);
                }
            }
        ];
        
        const characterUpgrades = this.getCharacterSpecificUpgrades();
        return [...baseUpgrades, ...characterUpgrades];
    }
    
    getCharacterSpecificUpgrades() {
        const upgrades = [];
        
        if (this.selectedCharacter.id === 'stab') {
            upgrades.push({
                id: 'stab_extra_damage',
                name: 'Toxic Potency',
                description: 'Increases aura damage by 50%',
                icon: '🧪',
                apply: () => {
                    this.multiplyStats('abilityDamageMultiplier', 1.5);
                }
            });
            upgrades.push({
                id: 'stab_faster_ticks',
                name: 'Rapid Toxicity',
                description: 'Aura damages enemies 25% faster',
                icon: '⚡',
                apply: () => {
                    this.multiplyStats('abilityCooldownMultiplier', 0.75);
                }
            });
        }
        
        if (this.selectedCharacter.id === 'wizard') {
            upgrades.push({
                id: 'wizard_star_count',
                name: 'Star Shower',
                description: 'Adds 2 more stars per cast',
                icon: '⭐',
                apply: () => {
                    this.addStatBonus('projectileCountBonus', 2);
                }
            });
            upgrades.push({
                id: 'wizard_confusion_duration',
                name: 'Mind Scramble',
                description: 'Confusion lasts 2 seconds longer',
                icon: '🌀',
                apply: () => {
                    // This will be applied in the starfall AOE method
                    this.confusionDurationBonus = (this.confusionDurationBonus || 0) + 2000;
                }
            });
            upgrades.push({
                id: 'wizard_explosive_stars',
                name: 'Explosive Stars',
                description: 'Star explosions have 40% larger radius',
                icon: '💥',
                apply: () => {
                    this.multiplyStats('abilityRadiusMultiplier', 1.4);
                }
            });
        }
        
        if (this.selectedCharacter.id === 'goose') {
            upgrades.push({
                id: 'goose_count',
                name: 'Goose Squadron',
                description: 'Adds 1 more orbiting goose',
                icon: '🦢',
                apply: () => {
                    this.addStatBonus('projectileCountBonus', 1);
                    this.addExtraGoose();
                }
            });
            upgrades.push({
                id: 'goose_speed',
                name: 'Rapid Formation',
                description: 'Geese orbit 30% faster',
                icon: '💨',
                apply: () => {
                    this.multiplyStats('abilityCooldownMultiplier', 0.7);
                }
            });
            upgrades.push({
                id: 'goose_damage',
                name: 'Sharp Beaks',
                description: 'Geese deal 75% more damage',
                icon: '🗡️',
                apply: () => {
                    this.multiplyStats('abilityDamageMultiplier', 1.75);
                }
            });
        }
        
        return upgrades;
    }
    
    getRandomEnemyType() {
        // Weighted random selection
        const totalWeight = this.enemyTypes.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const enemyType of this.enemyTypes) {
            random -= enemyType.weight;
            if (random <= 0) {
                return enemyType;
            }
        }
        
        // Fallback to first enemy type
        return this.enemyTypes[0];
    }
    
    setupCharacterAbilities() {
        if (this.selectedCharacter.id === 'stab') {
            // Stab Bufo aura setup (use ability cooldown stat)
            this.lastAuraTime = 0;
            this.auraTimer = this.time.addEvent({
                delay: this.playerStats.abilityCooldown,
                callback: this.applyStabAura,
                callbackScope: this,
                loop: true
            });
        } else if (this.selectedCharacter.id === 'wizard') {
            // Wizard Bufo starfall setup (use ability cooldown stat)
            this.lastStarfallTime = 0;
            this.starfallCooldown = this.playerStats.abilityCooldown;
            this.starfallProjectiles = this.add.group();
            this.confusedEnemies = new Set(); // Track confused enemies
        } else if (this.selectedCharacter.id === 'goose') {
            // Goose Bufo orbiting geese setup
            this.orbitingGeese = this.add.group();
            this.convertedAllies = this.add.group();
            this.setupGooseOrbit();
        }
    }
    
    addExtraGoose() {
        if (this.selectedCharacter.id !== 'goose' || !this.orbitingGeese) {
            console.warn('Cannot add extra goose - invalid character or missing orbitingGeese group');
            return;
        }
        
        const currentGeeseCount = this.orbitingGeese.children.entries.length;
        const goose = this.add.circle(0, 0, 8, 0xffffff);
        goose.setStrokeStyle(2, 0xffaa00);
        
        // Add Matter.js physics to goose
        this.matter.add.gameObject(goose, {
            shape: 'circle',
            isSensor: true,
            label: 'goose'
        });
        
        // Initialize orbit properties with proper spacing
        goose.orbitAngle = (currentGeeseCount / (currentGeeseCount + 1)) * Math.PI * 2;
        goose.gooseIndex = currentGeeseCount; // For debugging
        
        // Set initial position around player
        if (this.player && typeof this.player.x === 'number' && typeof this.player.y === 'number') {
            const initialRadius = this.playerStats.gooseOrbitRadius || 60;
            goose.x = this.player.x + Math.cos(goose.orbitAngle) * initialRadius;
            goose.y = this.player.y + Math.sin(goose.orbitAngle) * initialRadius;
        }
        
        this.orbitingGeese.add(goose);
        
        console.log(`Added extra goose ${currentGeeseCount} with orbit angle ${goose.orbitAngle.toFixed(2)}! Now have ${this.orbitingGeese.children.entries.length} geese`);
    }
    
    setupGooseOrbit() {
        // Create 3 orbiting geese with enhanced initialization
        const geeseCount = 3;
        console.log(`Setting up ${geeseCount} orbiting geese for Goose Bufo`);
        
        for (let i = 0; i < geeseCount; i++) {
            const goose = this.add.circle(0, 0, 8, 0xffffff);
            goose.setStrokeStyle(2, 0xffaa00);
            
            // Add Matter.js physics to goose
            this.matter.add.gameObject(goose, {
                shape: 'circle',
                isSensor: true,
                label: 'goose'
            });
            
            // Initialize orbit properties
            goose.orbitAngle = (i / geeseCount) * Math.PI * 2;
            goose.gooseIndex = i; // For debugging
            
            // Set initial position around player
            if (this.player && typeof this.player.x === 'number' && typeof this.player.y === 'number') {
                const initialRadius = this.playerStats.gooseOrbitRadius || 60;
                goose.x = this.player.x + Math.cos(goose.orbitAngle) * initialRadius;
                goose.y = this.player.y + Math.sin(goose.orbitAngle) * initialRadius;
            }
            
            this.orbitingGeese.add(goose);
            console.log(`Created goose ${i} with orbit angle ${goose.orbitAngle.toFixed(2)}`);
        }
    }
    
    spawnEnemy() {
        if (!this.gameStarted || this.upgradeSystem.isPaused) return;
        
        // Calculate number of enemies to spawn based on level (1-6 enemies per wave, balanced)
        const baseEnemyCount = 1; // Start with 1 enemy at level 1 (reduced from 2)
        const levelBonus = Math.floor((this.playerProgression.level - 1) / 3); // +1 enemy every 3 levels (slower than before)
        const randomBonus = Math.random() < 0.2 ? Phaser.Math.Between(1, 2) : 0; // 20% chance for 1-2 extra enemies (reduced)
        const enemyCount = Math.min(6, baseEnemyCount + levelBonus + randomBonus); // Cap at 6 enemies per wave (reduced from 12)
        
        console.log(`Level ${this.playerProgression.level}: Spawning ${enemyCount} enemies (base: ${baseEnemyCount}, level bonus: ${levelBonus}, random bonus: ${randomBonus})`);
        
        // Spawn multiple enemies in this wave
        for (let i = 0; i < enemyCount; i++) {
            this.spawnSingleEnemy();
        }
        
        // 7% chance for an additional "mini-wave" at higher levels (reduced from 15%)
        if (this.playerProgression.level >= 7 && Math.random() < 0.07) {
            const miniWaveSize = Phaser.Math.Between(1, 2); // Reduced mini-wave size from 2-4 to 1-2
            console.log(`Bonus mini-wave: +${miniWaveSize} enemies!`);
            
            // Delay the mini-wave slightly
            this.time.delayedCall(300, () => {
                for (let i = 0; i < miniWaveSize; i++) {
                    this.spawnSingleEnemy();
                }
            });
        }
    }
    
    spawnSingleEnemy() {
        if (!this.gameStarted || this.upgradeSystem.isPaused) return;
        
        // Get random enemy type (weighted towards tougher enemies at higher levels)
        const enemyType = this.getRandomEnemyType();
        
        // Spawn enemy outside camera view with some variation
        const camera = this.cameras.main;
        const spawnDistance = Phaser.Math.Between(120, 200); // Add some variation to spawn distance
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const spawnX = this.player.x + Math.cos(angle) * (camera.width / 2 + spawnDistance);
        const spawnY = this.player.y + Math.sin(angle) * (camera.height / 2 + spawnDistance);
        
        // Clamp to world bounds
        const clampedX = Phaser.Math.Clamp(spawnX, 0, this.map.widthInPixels);
        const clampedY = Phaser.Math.Clamp(spawnY, 0, this.map.heightInPixels);
        
        // Create enemy with sprite
        const enemy = this.add.image(clampedX, clampedY, enemyType.sprite);
        enemy.setDisplaySize(enemyType.displaySize, enemyType.displaySize); // Visual size
        
        // Check if this enemy type uses a GIF and create animated overlay
        const gifEnemies = ['bufo-dancing', 'bufo-eyes'];
        if (gifEnemies.includes(enemyType.sprite)) {
            enemy.setAlpha(0); // Hide static sprite for GIF enemies
            this.createAnimatedOverlay(enemy, `assets/enemies/${enemyType.sprite}.gif`, 
                                     enemyType.displaySize, enemyType.displaySize);
        }
        
        // Add Matter.js physics with explicit configuration
        this.matter.add.gameObject(enemy, {
            shape: {
                type: 'circle',
                radius: enemyType.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Enemy stats based on type (scale with player level)
        const levelScaling = 1 + (this.playerProgression.level - 1) * 0.2; // 20% increase per level
        enemy.health = Math.ceil(enemyType.health * levelScaling);
        enemy.maxHealth = Math.ceil(enemyType.health * levelScaling);
        enemy.speed = enemyType.speed;
        enemy.lastAttack = 0;
        enemy.attackCooldown = 1000;
        enemy.enemyType = enemyType; // Store reference to type
        enemy.xpValue = enemyType.xpValue;
        
        // Add debug hitbox visualization (initially hidden) - use actual physics body radius
        const actualRadius = enemy.body.circleRadius || enemyType.hitboxRadius;
        enemy.hitboxDebug = this.add.circle(clampedX, clampedY, actualRadius, 0xff0000, 0.3);
        enemy.hitboxDebug.setStrokeStyle(2, 0xff0000);
        enemy.hitboxDebug.setVisible(this.showHitboxes);
        
        this.enemies.add(enemy);
    }
    
    applyStabAura() {
        if (!this.gameStarted || this.selectedCharacter.id !== 'stab') return;
        
        // Create visual aura effect (use ability radius stat)
        const auraRadius = this.playerStats.abilityRadius;
        const auraEffect = this.add.circle(this.player.x, this.player.y, auraRadius, 0x00ff00, 0.2);
        auraEffect.setStrokeStyle(2, 0x00ff00, 0.5);
        this.auraEffects.add(auraEffect);
        
        // Fade out effect
        this.tweens.add({
            targets: auraEffect,
            alpha: 0,
            duration: 300,
            onComplete: () => auraEffect.destroy()
        });
        
        // Damage enemies in range (use ability damage stat)
        const activeEnemies = this.enemies.children.entries.filter(enemy => enemy.active && enemy.body && enemy.scene);
        activeEnemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );
            
            if (distance <= auraRadius) {
                this.damageEnemy(enemy, this.playerStats.abilityDamage);
                
                // Knockback (check if enemy still exists after damage)
                if (enemy.active && enemy.body && enemy.scene) {
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    this.matter.body.setVelocity(enemy.body, {
                        x: Math.cos(angle) * 3, // Scale down for Matter.js
                        y: Math.sin(angle) * 3
                    });
                }
            }
        });
    }
    
    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        
        // Visual damage feedback (simplified to avoid Matter.js conflicts)
        if (enemy.setTint) {
            enemy.setTint(0xff8888); // Flash red briefly
            this.time.delayedCall(100, () => {
                if (enemy.active && enemy.clearTint) {
                    enemy.clearTint();
                }
            });
        }
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }
    
    killEnemy(enemy) {
        // Create XP orbs based on enemy type
        const baseXpValue = enemy.xpValue || 10;
        const xpOrbCount = Phaser.Math.Between(1, 3);
        const xpPerOrb = Math.ceil(baseXpValue / xpOrbCount);
        
        for (let i = 0; i < xpOrbCount; i++) {
            const orb = this.add.circle(
                enemy.x + Phaser.Math.Between(-20, 20),
                enemy.y + Phaser.Math.Between(-20, 20),
                this.gameConfig.XP_ORB_RADIUS,
                0x00ffff
            );
            orb.setStrokeStyle(1, 0x0080ff);
            
            // Add Matter.js physics to XP orb
            this.matter.add.gameObject(orb, {
                shape: 'circle',
                isSensor: true,
                label: 'xpOrb'
            });
            
            orb.xpValue = xpPerOrb;
            this.xpOrbs.add(orb);
        }
        
        // Play death sound
        if (this.sound.get('enemyDie')) {
            this.sound.play('enemyDie', { volume: 0.3 });
        }
        
        // Log enemy death for debugging
        if (enemy.enemyType) {
            console.log(`${enemy.enemyType.name} defeated! Dropped ${baseXpValue} XP`);
        }
        
        // Clean up debug hitbox
        if (enemy.hitboxDebug) {
            enemy.hitboxDebug.destroy();
        }
        
        // Clean up animated overlay
        this.destroyAnimatedOverlay(enemy);
        
        // Remove enemy
        enemy.destroy();
    }
    
    playerHitEnemy(player, enemy) {
        const currentTime = this.time.now;
        
        // Check invincibility
        if (this.playerStats.invincible || currentTime < this.playerStats.invincibilityEnd) {
            return;
        }
        
        // Check enemy attack cooldown
        if (currentTime - enemy.lastAttack < enemy.attackCooldown) {
            return;
        }
        
        // Calculate damage after armor reduction
        const baseDamage = this.gameConfig.ENEMY_CONTACT_DAMAGE;
        const armorReduction = this.playerStats.armor * 0.5; // Each armor point reduces damage by 0.5
        const finalDamage = Math.max(1, baseDamage - armorReduction); // Minimum 1 damage
        this.playerStats.health -= finalDamage;
        
        console.log(`Player hit! Base damage: ${baseDamage}, Armor: ${this.playerStats.armor}, Final damage: ${finalDamage}`);
        enemy.lastAttack = currentTime;
        
        // Player invincibility
        this.playerStats.invincible = true;
        this.playerStats.invincibilityEnd = currentTime + 1000; // 1 second
        
        // Visual feedback
        this.tweens.add({
            targets: this.player,
            alpha: 0.5,
            duration: 1000,
            onComplete: () => {
                this.player.alpha = 1;
                this.playerStats.invincible = false;
            }
        });
        
        // Knockback using Matter.js
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        this.matter.body.setVelocity(player.body, {
            x: Math.cos(angle) * 4, // Scale down for Matter.js
            y: Math.sin(angle) * 4
        });
        
        // Play hit sound
        if (this.sound.get('playerHit')) {
            this.sound.play('playerHit', { volume: 0.4 });
        }
        
        // Check if player died
        if (this.playerStats.health <= 0) {
            this.gameOver();
        }
    }
    
    playerCollectXP(player, xpOrb) {
        // Safety check to ensure xpOrb exists and has xpValue
        if (!xpOrb || typeof xpOrb.xpValue !== 'number') {
            console.warn('Invalid XP orb in playerCollectXP:', xpOrb);
            return;
        }
        
        this.playerProgression.xp += xpOrb.xpValue;
        
        // Check for level up
        this.checkLevelUp();
        
        // Play pickup sound
        if (this.sound.get('pickup')) {
            this.sound.play('pickup', { volume: 0.3 });
        }
        
        xpOrb.destroy();
    }
    
    checkLevelUp() {
        if (this.playerProgression.xp >= this.playerProgression.xpToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.playerProgression.level++;
        this.playerProgression.xp -= this.playerProgression.xpToNextLevel;
        
        // Increase XP requirement for next level (exponential scaling)
        this.playerProgression.xpToNextLevel = Math.floor(this.playerProgression.xpToNextLevel * 1.5);
        
        console.log(`Level up! Now level ${this.playerProgression.level}`);
        
        // Check for boss wave at milestone levels (every 5 levels)
        if (this.playerProgression.level % 5 === 0) {
            this.triggerBossWave();
        }
        
        // Show upgrade selection every level
        this.showUpgradeSelection();
        
        // Scale enemy difficulty
        this.scaleEnemyDifficulty();
    }
    
    triggerBossWave() {
        const level = this.playerProgression.level;
        const bossWaveSize = 5 + Math.floor(level / 5) * 2; // 5 enemies at level 5, 7 at level 10, etc. (reduced from 8+3)
        
        console.log(`🚨 BOSS WAVE TRIGGERED! Level ${level} - Spawning ${bossWaveSize} tough enemies! 🚨`);
        
        // Delay boss wave slightly after level up
        this.time.delayedCall(1500, () => {
            // Spawn mostly tough enemies for boss wave
            for (let i = 0; i < bossWaveSize; i++) {
                // 70% chance for tough enemies, 30% for random
                let enemyType;
                if (Math.random() < 0.7) {
                    // Force tough enemy types
                    const toughEnemies = this.enemyTypes.filter(type => 
                        type.id === 'mob' || type.id === 'eyes' || type.id === 'clown'
                    );
                    enemyType = Phaser.Utils.Array.GetRandom(toughEnemies);
                } else {
                    enemyType = this.getRandomEnemyType();
                }
                
                // Spawn with slight delay for dramatic effect
                this.time.delayedCall(i * 100, () => {
                    this.spawnSingleEnemyOfType(enemyType);
                });
            }
            
            // Show boss wave notification
            this.showBossWaveNotification(level);
        });
    }
    
    spawnSingleEnemyOfType(enemyType) {
        if (!this.gameStarted) return;
        
        // Spawn enemy outside camera view with some variation
        const camera = this.cameras.main;
        const spawnDistance = Phaser.Math.Between(120, 200);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const spawnX = this.player.x + Math.cos(angle) * (camera.width / 2 + spawnDistance);
        const spawnY = this.player.y + Math.sin(angle) * (camera.height / 2 + spawnDistance);
        
        // Clamp to world bounds
        const clampedX = Phaser.Math.Clamp(spawnX, 0, this.map.widthInPixels);
        const clampedY = Phaser.Math.Clamp(spawnY, 0, this.map.heightInPixels);
        
        // Create enemy with sprite
        const enemy = this.add.image(clampedX, clampedY, enemyType.sprite);
        enemy.setDisplaySize(enemyType.displaySize, enemyType.displaySize);
        
        // Check if this enemy type uses a GIF
        const gifEnemies = ['bufo-dancing', 'bufo-eyes'];
        if (gifEnemies.includes(enemyType.sprite)) {
            enemy.setAlpha(0);
            this.createAnimatedOverlay(enemy, `assets/enemies/${enemyType.sprite}.gif`, 
                                     enemyType.displaySize, enemyType.displaySize);
        }
        
        // Add Matter.js physics
        this.matter.add.gameObject(enemy, {
            shape: {
                type: 'circle',
                radius: enemyType.hitboxRadius
            },
            frictionAir: 0.01,
            label: 'enemy',
            ignoreGravity: true
        });
        
        // Enemy stats (boss wave enemies get +25% health bonus)
        const levelScaling = 1 + (this.playerProgression.level - 1) * 0.2;
        const bossWaveBonus = 1.25; // 25% more health for boss wave enemies
        enemy.health = Math.ceil(enemyType.health * levelScaling * bossWaveBonus);
        enemy.maxHealth = Math.ceil(enemyType.health * levelScaling * bossWaveBonus);
        enemy.speed = enemyType.speed;
        enemy.lastAttack = 0;
        enemy.attackCooldown = 1000;
        enemy.enemyType = enemyType;
        enemy.xpValue = Math.floor(enemyType.xpValue * 1.5); // 50% more XP for boss wave enemies
        enemy.isBossWaveEnemy = true; // Mark as boss wave enemy
        
        // Add debug hitbox
        const actualRadius = enemy.body.circleRadius || enemyType.hitboxRadius;
        enemy.hitboxDebug = this.add.circle(clampedX, clampedY, actualRadius, 0xff0000, 0.3);
        enemy.hitboxDebug.setStrokeStyle(2, 0xff0000);
        enemy.hitboxDebug.setVisible(this.showHitboxes);
        
        this.enemies.add(enemy);
    }
    
    showBossWaveNotification(level) {
        // Create dramatic notification
        const notification = this.add.text(700, 200, `🚨 BOSS WAVE! 🚨\nLevel ${level} Milestone`, {
            fontSize: '36px',
            color: '#ff0000',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Pulsing effect
        this.tweens.add({
            targets: notification,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                // Fade out after pulsing
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 1000,
                    delay: 1000,
                    onComplete: () => notification.destroy()
                });
            }
        });
    }
    
    scaleEnemyDifficulty() {
        // Much more aggressive difficulty scaling
        const level = this.playerProgression.level;
        
        // Exponential spawn rate reduction (gets much faster at higher levels)
        // Level 1: 800ms, Level 5: 400ms, Level 10: 200ms, Level 15: 100ms
        const baseRate = this.gameConfig.ENEMY_SPAWN_INTERVAL;
        const levelMultiplier = Math.pow(0.85, level - 1); // 15% faster each level (exponential)
        const newSpawnRate = Math.max(100, Math.floor(baseRate * levelMultiplier)); // Minimum 100ms (10 waves per second!)
        
        // Update spawn timer
        this.enemySpawnTimer.delay = newSpawnRate;
        
        // Also modify enemy type weights to favor tougher enemies at higher levels
        if (level >= 3) {
            // Increase weight of tougher enemies as level increases
            this.enemyTypes.forEach(enemyType => {
                if (enemyType.id === 'mob' || enemyType.id === 'eyes') {
                    // Rare enemies become more common at higher levels
                    enemyType.weight = Math.min(enemyType.weight * 1.1, 30);
                } else if (enemyType.id === 'pog') {
                    // Weak enemies become less common
                    enemyType.weight = Math.max(enemyType.weight * 0.95, 10);
                }
            });
        }
        
        // Calculate theoretical enemies per second for logging
        const enemiesPerWave = 1 + Math.floor((level - 1) / 3); // Average enemies per wave (updated to match new formula)
        const wavesPerSecond = 1000 / newSpawnRate;
        const enemiesPerSecond = enemiesPerWave * wavesPerSecond;
        
        console.log(`=== DIFFICULTY SCALED FOR LEVEL ${level} ===`);
        console.log(`Spawn rate: ${newSpawnRate}ms (${wavesPerSecond.toFixed(1)} waves/sec)`);
        console.log(`Enemies per wave: ~${enemiesPerWave}`);
        console.log(`Theoretical enemies/sec: ${enemiesPerSecond.toFixed(1)}`);
        console.log(`Active enemies: ${this.enemies.countActive(true)}`);
        console.log(`=======================================`);
    }
    
    showUpgradeSelection() {
        // Pause the game
        this.upgradeSystem.isPaused = true;
        this.matter.world.enabled = false; // Pause Matter.js physics
        
        // Hide animated overlays during upgrade screen
        this.hideAllOverlays();
        
        // Hide stats debug UI during upgrade screen
        if (this.showStatsDebug) {
            this.hideStatsDebugUI();
        }
        
        // Pause all timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = true;
        }
        if (this.auraTimer) {
            this.auraTimer.paused = true;
        }
        
        // Reset gamepad upgrade selection
        if (this.gamepadState) {
            this.gamepadState.selectedUpgradeIndex = 0;
        }
        
        // Generate 3 random upgrade choices
        this.generateUpgradeChoices();
        
        // Create upgrade UI
        this.createUpgradeUI();
    }
    
    generateUpgradeChoices() {
        const availableUpgrades = this.getAvailableUpgrades();
        this.upgradeSystem.currentUpgradeChoices = [];
        this.upgradeSystem.usedUpgradeIds.clear();
        
        // Pick 3 unique random upgrades
        for (let i = 0; i < 3; i++) {
            const uniqueUpgrade = this.getUniqueRandomUpgrade(availableUpgrades);
            this.upgradeSystem.currentUpgradeChoices.push(uniqueUpgrade);
            this.upgradeSystem.usedUpgradeIds.add(uniqueUpgrade.id);
        }
        
        // Reset rerolls
        this.upgradeSystem.rerollsRemaining = 1;
    }
    
    getUniqueRandomUpgrade(availableUpgrades) {
        // Filter out upgrades that are already selected
        const unusedUpgrades = availableUpgrades.filter(upgrade => 
            !this.upgradeSystem.usedUpgradeIds.has(upgrade.id)
        );
        
        // If we somehow run out of unique upgrades, allow duplicates
        const upgradesPool = unusedUpgrades.length > 0 ? unusedUpgrades : availableUpgrades;
        
        return Phaser.Utils.Array.GetRandom(upgradesPool);
    }
    
    createUpgradeUI() {
        // Clear any existing upgrade UI
        if (this.upgradeUI) {
            this.upgradeUI.destroy();
        }
        
        // Create elements directly in the scene instead of using a container
        this.upgradeUIElements = [];
        this.upgradeCardElements = []; // Track elements for each card separately
        
        // Background - make it fullscreen to block all clicks
        const bg = this.add.rectangle(700, 450, 2000, 1400, 0x000000, 0.8);
        bg.setScrollFactor(0);
        bg.setDepth(1000);
        bg.setInteractive(); // Make it interactive to block clicks behind it
        bg.on('pointerdown', () => {}); // Consume click events
        this.upgradeUIElements.push(bg);
        
        // Upgrade panel background
        const panel = this.add.rectangle(700, 450, 700, 400, 0x222222, 1.0);
        panel.setScrollFactor(0);
        panel.setDepth(1001);
        panel.setStrokeStyle(4, 0xffffff);
        this.upgradeUIElements.push(panel);
        
        // Title
        const title = this.add.text(700, 290, `LEVEL ${this.playerProgression.level}!`, {
            fontSize: '32px',
            color: '#ffff00',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5);
        title.setScrollFactor(0);
        title.setDepth(1002);
        this.upgradeUIElements.push(title);
        
        const subtitle = this.add.text(700, 320, 'Choose an upgrade:', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5);
        subtitle.setScrollFactor(0);
        subtitle.setDepth(1002);
        this.upgradeUIElements.push(subtitle);
        
        // Upgrade cards
        const cardWidth = 180;
        const cardHeight = 200;
        const spacing = 20;
        const startX = 700 - (cardWidth + spacing);
        
        this.upgradeSystem.currentUpgradeChoices.forEach((upgrade, index) => {
            const cardX = startX + index * (cardWidth + spacing);
            const cardY = 450;
            
            // Initialize card elements array for this card
            this.upgradeCardElements[index] = [];
            
            // Card background
            const card = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0x333333);
            card.setStrokeStyle(3, 0x666666);
            card.setScrollFactor(0);
            card.setDepth(1003);
            card.setInteractive();
            
            // Upgrade icon
            const icon = this.add.text(cardX, cardY - 60, upgrade.icon, {
                fontSize: '48px'
            }).setOrigin(0.5, 0.5);
            icon.setScrollFactor(0);
            icon.setDepth(1004);
            
            // Upgrade name
            const name = this.add.text(cardX, cardY - 20, upgrade.name, {
                fontSize: '16px',
                color: '#ffffff',
                fontWeight: 'bold',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0.5);
            name.setScrollFactor(0);
            name.setDepth(1004);
            
            // Upgrade description
            const description = this.add.text(cardX, cardY + 30, upgrade.description, {
                fontSize: '12px',
                color: '#cccccc',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0.5);
            description.setScrollFactor(0);
            description.setDepth(1004);
            
            // Individual reroll button (if rerolls available)
            let rerollButton, rerollText;
            if (this.upgradeSystem.rerollsRemaining > 0) {
                rerollButton = this.add.rectangle(cardX, cardY + 80, 100, 25, 0x555555);
                rerollButton.setStrokeStyle(1, 0x888888);
                rerollButton.setScrollFactor(0);
                rerollButton.setDepth(1005);
                rerollButton.setInteractive();
                
                rerollText = this.add.text(cardX, cardY + 80, '🎲 Reroll', {
                    fontSize: '10px',
                    color: '#ffffff'
                }).setOrigin(0.5, 0.5);
                rerollText.setScrollFactor(0);
                rerollText.setDepth(1006);
                
                rerollButton.on('pointerdown', () => {
                    this.rerollSingleUpgrade(index);
                });
                
                rerollButton.on('pointerover', () => {
                    rerollButton.setStrokeStyle(2, 0xffffff);
                });
                
                rerollButton.on('pointerout', () => {
                    rerollButton.setStrokeStyle(1, 0x888888);
                });
            }
            
            // Click handler for main card
            card.on('pointerdown', () => {
                this.selectUpgrade(upgrade);
            });
            
            // Enhanced hover effect for main card with highlight
            card.on('pointerover', () => {
                card.setStrokeStyle(4, 0xffffff);
                card.setFillStyle(0x444444); // Lighter background on hover
                name.setColor('#ffff00'); // Highlight name in yellow
            });
            
            card.on('pointerout', () => {
                card.setStrokeStyle(3, 0x666666);
                card.setFillStyle(0x333333); // Back to original background
                name.setColor('#ffffff'); // Back to white
            });
            
            // Add all elements to our tracking arrays
            this.upgradeUIElements.push(card, icon, name, description);
            this.upgradeCardElements[index].push(card, icon, name, description);
            
            if (rerollButton && rerollText) {
                this.upgradeUIElements.push(rerollButton, rerollText);
                this.upgradeCardElements[index].push(rerollButton, rerollText);
            }
        });
        
        // Reroll instructions and controller instructions
        let instructionY = 590;
        if (this.upgradeSystem.rerollsRemaining > 0) {
            const rerollInstructions = this.add.text(700, instructionY, `Rerolls remaining: ${this.upgradeSystem.rerollsRemaining}`, {
                fontSize: '14px',
                color: '#ffff00'
            }).setOrigin(0.5, 0.5);
            rerollInstructions.setScrollFactor(0);
            rerollInstructions.setDepth(1002);
            
            this.upgradeUIElements.push(rerollInstructions);
            instructionY += 25;
        }
        
        // Controller instructions (if controller is connected)
        if (this.gamepadState && this.gamepadState.connected) {
            const controllerInstructions = this.add.text(700, instructionY, 'Controller: D-Pad/Left Stick to navigate | A to select | X to reroll', {
                fontSize: '12px',
                color: '#aaaaaa'
            }).setOrigin(0.5, 0.5);
            controllerInstructions.setScrollFactor(0);
            controllerInstructions.setDepth(1002);
            
            this.upgradeUIElements.push(controllerInstructions);
        }
        
        // Initialize gamepad highlighting if controller is connected
        if (this.gamepadState && this.gamepadState.connected) {
            // Call highlighting immediately and also with a small delay to be sure
            this.updateUpgradeHighlight();
            this.time.delayedCall(100, () => {
                this.updateUpgradeHighlight();
            });
        }
    }
    
    selectUpgrade(upgrade) {
        // Apply the upgrade
        upgrade.apply();
        
        // Set a brief cooldown to prevent accidental pause triggering right after upgrade selection
        this.lastUpgradeSelectionTime = this.time.now;
        
        // Close upgrade UI
        this.closeUpgradeUI();
    }
    
    rerollSingleUpgrade(upgradeIndex) {
        if (this.upgradeSystem.rerollsRemaining <= 0) return;
        
        this.upgradeSystem.rerollsRemaining--;
        
        // Remove the old upgrade from the used set
        const oldUpgrade = this.upgradeSystem.currentUpgradeChoices[upgradeIndex];
        this.upgradeSystem.usedUpgradeIds.delete(oldUpgrade.id);
        
        // Get a new unique upgrade
        const availableUpgrades = this.getAvailableUpgrades();
        const newUpgrade = this.getUniqueRandomUpgrade(availableUpgrades);
        
        // Replace the upgrade and mark it as used
        this.upgradeSystem.currentUpgradeChoices[upgradeIndex] = newUpgrade;
        this.upgradeSystem.usedUpgradeIds.add(newUpgrade.id);
        

        
        // Instead of recreating the entire UI, just replace this specific card
        this.replaceUpgradeCard(upgradeIndex, newUpgrade);
    }
    
    replaceUpgradeCard(upgradeIndex, newUpgrade) {
        // Destroy the old card elements
        if (this.upgradeCardElements[upgradeIndex]) {
            this.upgradeCardElements[upgradeIndex].forEach(element => {
                if (element && element.destroy) {
                    // Remove from main tracking array too
                    const mainIndex = this.upgradeUIElements.indexOf(element);
                    if (mainIndex > -1) {
                        this.upgradeUIElements.splice(mainIndex, 1);
                    }
                    element.destroy();
                }
            });
            this.upgradeCardElements[upgradeIndex] = [];
        }
        
        // Create the new card elements
        this.createSingleUpgradeCard(upgradeIndex, newUpgrade);
        
        // Update the reroll counter display
        this.updateRerollCounter();
        
        // Refresh gamepad highlighting if controller is connected
        if (this.gamepadState && this.gamepadState.connected) {
            this.time.delayedCall(50, () => {
                this.updateUpgradeHighlight();
            });
        }
    }
    
    createSingleUpgradeCard(upgradeIndex, upgrade) {
        const cardWidth = 180;
        const cardHeight = 200;
        const spacing = 20;
        const startX = 700 - (cardWidth + spacing);
        const cardX = startX + upgradeIndex * (cardWidth + spacing);
        const cardY = 450;
        
        // Initialize card elements array for this card
        this.upgradeCardElements[upgradeIndex] = [];
        
        // Card background
        const card = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0x333333);
        card.setStrokeStyle(3, 0x666666);
        card.setScrollFactor(0);
        card.setDepth(1003);
        card.setInteractive();
        
        // Upgrade icon
        const icon = this.add.text(cardX, cardY - 60, upgrade.icon, {
            fontSize: '48px'
        }).setOrigin(0.5, 0.5);
        icon.setScrollFactor(0);
        icon.setDepth(1004);
        
        // Upgrade name
        const name = this.add.text(cardX, cardY - 20, upgrade.name, {
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: 'bold',
            wordWrap: { width: cardWidth - 20 }
        }).setOrigin(0.5, 0.5);
        name.setScrollFactor(0);
        name.setDepth(1004);
        
        // Upgrade description
        const description = this.add.text(cardX, cardY + 30, upgrade.description, {
            fontSize: '12px',
            color: '#cccccc',
            wordWrap: { width: cardWidth - 20 }
        }).setOrigin(0.5, 0.5);
        description.setScrollFactor(0);
        description.setDepth(1004);
        
        // Individual reroll button (if rerolls available)
        let rerollButton, rerollText;
        if (this.upgradeSystem.rerollsRemaining > 0) {
            rerollButton = this.add.rectangle(cardX, cardY + 80, 100, 25, 0x555555);
            rerollButton.setStrokeStyle(1, 0x888888);
            rerollButton.setScrollFactor(0);
            rerollButton.setDepth(1005);
            rerollButton.setInteractive();
            
            rerollText = this.add.text(cardX, cardY + 80, '🎲 Reroll', {
                fontSize: '10px',
                color: '#ffffff'
            }).setOrigin(0.5, 0.5);
            rerollText.setScrollFactor(0);
            rerollText.setDepth(1006);
            
                            rerollButton.on('pointerdown', () => {
                    this.rerollSingleUpgrade(upgradeIndex);
                });
            
            rerollButton.on('pointerover', () => {
                rerollButton.setStrokeStyle(2, 0xffffff);
            });
            
            rerollButton.on('pointerout', () => {
                rerollButton.setStrokeStyle(1, 0x888888);
            });
        }
        
        // Click handler for main card
        card.on('pointerdown', () => {
            this.selectUpgrade(upgrade);
        });
        
        // Enhanced hover effect for main card with highlight
        card.on('pointerover', () => {
            card.setStrokeStyle(4, 0xffffff);
            card.setFillStyle(0x444444); // Lighter background on hover
            name.setColor('#ffff00'); // Highlight name in yellow
        });
        
        card.on('pointerout', () => {
            card.setStrokeStyle(3, 0x666666);
            card.setFillStyle(0x333333); // Back to original background
            name.setColor('#ffffff'); // Back to white
        });
        
        // Add all elements to our tracking arrays
        this.upgradeUIElements.push(card, icon, name, description);
        this.upgradeCardElements[upgradeIndex].push(card, icon, name, description);
        
        if (rerollButton && rerollText) {
            this.upgradeUIElements.push(rerollButton, rerollText);
            this.upgradeCardElements[upgradeIndex].push(rerollButton, rerollText);
        }
    }
    
    updateRerollCounter() {
        // Find and update the reroll counter text
        const rerollElement = this.upgradeUIElements.find(element => 
            element.type === 'Text' && element.text && element.text.includes('Rerolls remaining')
        );
        
        if (rerollElement) {
            rerollElement.setText(`Rerolls remaining: ${this.upgradeSystem.rerollsRemaining}`);
        }
    }
    
    closeUpgradeUI() {
        // Resume the game - clear BOTH pause states to prevent conflicts
        this.upgradeSystem.isPaused = false;
        this.isPaused = false; // Ensure general pause state is also cleared
        this.matter.world.enabled = true; // Resume Matter.js physics
        
        // Hide any pause UI that might be showing
        this.hidePauseUI();
        
        // Show animated overlays again
        this.showAllOverlays();
        
        // Restore stats debug UI if it was active
        if (this.showStatsDebug) {
            this.createStatsDebugUI();
        }
        
        // Resume all timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = false;
        }
        if (this.auraTimer) {
            this.auraTimer.paused = false;
        }
        
        // Remove upgrade UI
        if (this.upgradeUIElements) {
            this.upgradeUIElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.upgradeUIElements = [];
        }
        
        // Clear card element tracking
        if (this.upgradeCardElements) {
            this.upgradeCardElements = [];
        }
        
        console.log('Upgrade UI closed - game fully resumed');
    }
    
    updateWizardStarfall() {
        const currentTime = this.time.now;
        if (currentTime - this.lastStarfallTime < this.starfallCooldown) {
            return;
        }
        
        // Find enemies in range - use camera bounds to target any visible enemies
        const camera = this.cameras.main;
        const starfallRange = Math.max(camera.width, camera.height); // Cover entire screen
        const nearbyEnemies = this.enemies.children.entries.filter(enemy => {
            if (!enemy.active || !enemy.body || !enemy.scene) return false;
            
            // Check if enemy is within camera bounds (visible on screen)
            const enemyInCameraBounds = (
                enemy.x >= camera.scrollX - 50 &&
                enemy.x <= camera.scrollX + camera.width + 50 &&
                enemy.y >= camera.scrollY - 50 &&
                enemy.y <= camera.scrollY + camera.height + 50
            );
            
            return enemyInCameraBounds;
        });
        
        if (nearbyEnemies.length > 0) {
            // Cast starfall - create stars targeting random nearby enemies (use projectile count stat)
            const starCount = Math.min(this.playerStats.projectileCount, nearbyEnemies.length);
            for (let i = 0; i < starCount; i++) {
                const targetEnemy = Phaser.Utils.Array.GetRandom(nearbyEnemies);
                this.createStarfallProjectile(targetEnemy.x, targetEnemy.y);
            }
            this.lastStarfallTime = currentTime;
        }
    }
    
    createStarfallProjectile(targetX, targetY) {
        // Start position high above the target (like original)
        const startX = targetX + Phaser.Math.Between(-50, 50); // Add some spread
        const startY = targetY - 300; // Start 300 pixels above target like original
        


        // Create star projectile
        const star = this.add.circle(startX, startY, 12, 0xFFD700);
        star.setStrokeStyle(2, 0xFFA500);
        
        // Add Matter.js physics to star
        this.matter.add.gameObject(star, {
            shape: 'circle',
            isSensor: true, // Don't collide with other objects
            label: 'starfall'
        });
        
        // Calculate velocity to hit the target (like original)
        const dx = targetX - startX;
        const dy = targetY - startY;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude > 0) {
            const speed = 6.4; // Scaled down for Matter.js (320/50)
            const velocityX = (dx / magnitude) * speed;
            const velocityY = (dy / magnitude) * speed;
            

            this.matter.body.setVelocity(star.body, { x: velocityX, y: velocityY });
        }
        
        star.damage = 3 * this.playerStats.abilityDamageMultiplier;
        star.lifespan = 5000;
        star.birthTime = this.time.now;
        star.targetX = targetX;
        star.targetY = targetY;
        star.hasImpacted = false;
        
        this.starfallProjectiles.add(star);
        
        // Note: Removed visual effects to avoid conflicts with Matter.js physics
    }
    
    updateStarfallProjectiles() {
        const currentTime = this.time.now;
        
        for (let i = this.starfallProjectiles.children.entries.length - 1; i >= 0; i--) {
            const star = this.starfallProjectiles.children.entries[i];
            if (!star.active || star.hasImpacted) continue;
            
            // Remove old starfall projectiles (5 second lifetime)
            if (currentTime - star.birthTime > star.lifespan) {
                star.destroy();
                continue;
            }

            // Check for impact with target area (when star gets close to target)
            const distanceToTarget = Phaser.Math.Distance.Between(
                star.x, star.y, star.targetX, star.targetY
            );
            
            const targetReached = distanceToTarget < 30;
            const hitGround = star.y > this.map.heightInPixels - 50;
            
            if (targetReached || hitGround) {
                // Star has reached its target or hit the ground - trigger AOE explosion
                this.applyStarfallAOE(star.x, star.y, star.damage);
                star.hasImpacted = true;
                star.destroy();
            }
        }
    }
    
    applyStarfallAOE(impactX, impactY, damage) {
        const aoeRadius = this.playerStats.abilityRadius; // Use ability radius stat
        const currentTime = this.time.now;
        
        // Create visual AOE effect
        const aoeEffect = this.add.circle(impactX, impactY, aoeRadius, 0xFFD700, 0.3);
        aoeEffect.setStrokeStyle(3, 0xFFA500, 0.8);
        this.auraEffects.add(aoeEffect);
        
        // Fade out effect
        this.tweens.add({
            targets: aoeEffect,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => aoeEffect.destroy()
        });
        
        // Find all enemies within AOE radius and damage them
        const affectedEnemies = [];
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active || !enemy.body || !enemy.scene) return;
            
            const distance = Phaser.Math.Distance.Between(impactX, impactY, enemy.x, enemy.y);
            if (distance <= aoeRadius) {
                affectedEnemies.push(enemy);
                
                // Deal damage (use ability damage stat)
                this.damageEnemy(enemy, this.playerStats.abilityDamage);
                
                // Apply confusion effect (with upgraded duration)
                this.confusedEnemies.add(enemy);
                const confusionDuration = 3000 + (this.confusionDurationBonus || 0);
                enemy.confusedUntil = currentTime + confusionDuration;
                
                // Visual confusion effect
                if (enemy.setTint) {
                    enemy.setTint(0x9966ff);
                }
            }
        });
        

    }
    

    
    updateConfusedEnemies() {
        const currentTime = this.time.now;
        this.confusedEnemies.forEach(enemy => {
            if (!enemy.active || !enemy.scene || currentTime > enemy.confusedUntil) {
                if (enemy.clearTint) {
                    enemy.clearTint();
                }
                this.confusedEnemies.delete(enemy);
            }
        });
    }
    
    gooseHitEnemy(goose, enemy) {
        // Safety checks to prevent crashes
        if (this.selectedCharacter.id !== 'goose') return;
        if (!goose || !enemy) {
            console.warn('gooseHitEnemy called with null/undefined objects:', { goose, enemy });
            return;
        }
        if (!goose.active || !enemy.active) {
            console.warn('gooseHitEnemy called with inactive objects');
            return;
        }
        if (typeof goose.x !== 'number' || typeof goose.y !== 'number' ||
            typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            console.warn('gooseHitEnemy called with objects missing position properties:', {
                gooseX: goose.x, gooseY: goose.y, enemyX: enemy.x, enemyY: enemy.y
            });
            return;
        }
        if (!enemy.body) {
            console.warn('gooseHitEnemy called with enemy missing physics body');
            return;
        }
        
        // Damage the enemy (use ability damage stat)
        this.damageEnemy(enemy, this.playerStats.abilityDamage);
        
        // Knockback enemy using Matter.js (only if enemy still exists after damage)
        if (enemy.active && enemy.body && enemy.scene) {
            try {
                const angle = Phaser.Math.Angle.Between(goose.x, goose.y, enemy.x, enemy.y);
                this.matter.body.setVelocity(enemy.body, {
                    x: Math.cos(angle) * 2, // Scale down for Matter.js
                    y: Math.sin(angle) * 2
                });
            } catch (error) {
                console.error('Error in gooseHitEnemy knockback:', error);
            }
        }
    }
    
    gameOver() {
        this.gameStarted = false;
        
        // Clean up pause state and UI
        this.isPaused = false;
        this.hidePauseUI();
        
        // Clean up debug UI
        this.hideStatsDebugUI();
        this.showStatsDebug = false;
        
        // Clean up all animated overlays
        this.cleanupAllOverlays();
        
        // Stop timers
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.auraTimer) this.auraTimer.remove();
        
        // Show game over screen
        this.add.text(700, 450, 'GAME OVER', {
            fontSize: '48px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5, 0.5).setScrollFactor(0);
        
        this.add.text(700, 500, 'Click to return to character selection', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0.5).setScrollFactor(0);
        
        // Allow restart
        this.input.once('pointerdown', () => {
            this.cleanupAllOverlays();
            this.scene.restart();
        });
    }
    
    createGameUI() {
        // Health bar
        this.healthBarBg = this.add.rectangle(16, 16, 204, 24, 0x000000);
        this.healthBarBg.setOrigin(0, 0).setScrollFactor(0);
        this.healthBar = this.add.rectangle(18, 18, 200, 20, 0x00ff00);
        this.healthBar.setOrigin(0, 0).setScrollFactor(0);
        
        // Character info
        this.characterText = this.add.text(16, 50, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setScrollFactor(0);
        
        this.updateUI();
    }
    
    updateUI() {
        if (!this.gameStarted) return;
        
        // Update health bar
        const healthPercent = this.playerStats.health / this.playerStats.maxHealth;
        this.healthBar.width = 200 * healthPercent;
        this.healthBar.fillColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        
        // Update character info
        const xpProgress = `${this.playerProgression.xp}/${this.playerProgression.xpToNextLevel}`;
        this.characterText.setText([
            `Character: ${this.selectedCharacter.name}`,
            `Health: ${Math.ceil(this.playerStats.health)}/${this.playerStats.maxHealth} | Armor: ${this.playerStats.armor}`,
            `Level: ${this.playerProgression.level} | XP: ${xpProgress}`,
            `Pickup Range: ${Math.round(this.playerStats.pickupRange)} | Regen: ${this.playerStats.healthRegen.toFixed(1)}/s`
        ]);
    }
    
    handleClick(pointer) {
        // Handle clicks during character selection
        if (!this.characterSelected) {
            // Character selection is handled by card click events
            return;
        }
        
        // Don't toggle pause if a character card was just clicked
        if (this.characterCardClicked) {
            this.characterCardClicked = false; // Reset the flag
            return;
        }
        
        // Don't toggle pause during upgrade screen
        if (this.upgradeSystem && this.upgradeSystem.isPaused) {
            return;
        }
        
        // Don't toggle pause immediately after upgrade selection (500ms cooldown)
        if (this.lastUpgradeSelectionTime && this.time.now - this.lastUpgradeSelectionTime < 500) {
            return;
        }
        
        // Toggle pause during gameplay
        if (this.gameStarted) {
            this.togglePause();
        }
    }
    
    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    pauseGame() {
        if (this.isPaused) return; // Already paused
        
        this.isPaused = true;
        console.log('Game paused');
        
        // Pause Matter.js physics
        this.matter.world.enabled = false;
        
        // Pause all timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = true;
        }
        if (this.auraTimer) {
            this.auraTimer.paused = true;
        }
        
        // Hide animated overlays during pause
        this.hideAllOverlays();
        
        // Show pause UI
        this.showPauseUI();
    }
    
    resumeGame() {
        if (!this.isPaused) return; // Not paused
        
        this.isPaused = false;
        console.log('Game resumed');
        
        // Resume Matter.js physics
        this.matter.world.enabled = true;
        
        // Resume all timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.paused = false;
        }
        if (this.auraTimer) {
            this.auraTimer.paused = false;
        }
        
        // Show animated overlays again
        this.showAllOverlays();
        
        // Hide pause UI
        this.hidePauseUI();
    }
    
    showPauseUI() {
        // Clear any existing pause UI
        this.hidePauseUI();
        
        // Dark overlay background
        const bg = this.add.rectangle(700, 450, 2000, 1400, 0x000000, 0.7);
        bg.setScrollFactor(0);
        bg.setDepth(2000);
        bg.setInteractive(); // Block clicks behind it
        bg.on('pointerdown', () => {}); // Consume click events
        this.pauseUIElements.push(bg);
        
        // Pause panel
        const panel = this.add.rectangle(700, 450, 400, 300, 0x222222, 1.0);
        panel.setScrollFactor(0);
        panel.setDepth(2001);
        panel.setStrokeStyle(4, 0xffffff);
        this.pauseUIElements.push(panel);
        
        // Pause title
        const title = this.add.text(700, 350, 'GAME PAUSED', {
            fontSize: '36px',
            color: '#ffff00',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5);
        title.setScrollFactor(0);
        title.setDepth(2002);
        this.pauseUIElements.push(title);
        
        // Instructions
        const instructions = this.add.text(700, 450, 'Click anywhere, press Escape, or press Start to resume', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        instructions.setScrollFactor(0);
        instructions.setDepth(2002);
        this.pauseUIElements.push(instructions);
        
        // Controls info
        const controls = this.add.text(700, 500, 'Mouse/Keyboard: Click or Escape to pause/resume\nController: Start button to pause/resume', {
            fontSize: '14px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        controls.setScrollFactor(0);
        controls.setDepth(2002);
        this.pauseUIElements.push(controls);
    }
    
    hidePauseUI() {
        // Remove all pause UI elements
        if (this.pauseUIElements) {
            this.pauseUIElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.pauseUIElements = [];
        }
    }
    
    toggleStatsDebug() {
        this.showStatsDebug = !this.showStatsDebug;
        
        if (this.showStatsDebug) {
            this.createStatsDebugUI();
        } else {
            this.hideStatsDebugUI();
        }
        
        console.log(`Stats debug mode: ${this.showStatsDebug ? 'ON' : 'OFF'}`);
    }
    
    createStatsDebugUI() {
        // Remove existing stats debug UI if it exists
        this.hideStatsDebugUI();
        
        if (!this.gameStarted || !this.playerStats) return;
        
        // Create container for all stats debug elements
        this.statsDebugUI = [];
        
        // Background panel
        const panel = this.add.rectangle(150, 300, 280, 550, 0x000000, 0.8);
        panel.setScrollFactor(0);
        panel.setDepth(1500);
        panel.setStrokeStyle(2, 0x00ff00);
        this.statsDebugUI.push(panel);
        
        // Title
        const title = this.add.text(20, 50, 'DEBUG STATS', {
            fontSize: '16px',
            color: '#00ff00',
            fontWeight: 'bold'
        });
        title.setScrollFactor(0);
        title.setDepth(1501);
        this.statsDebugUI.push(title);
        
        // Create stats text - this will be updated each frame
        this.statsDebugText = this.add.text(20, 80, '', {
            fontSize: '11px',
            color: '#ffffff',
            lineSpacing: 2
        });
        this.statsDebugText.setScrollFactor(0);
        this.statsDebugText.setDepth(1501);
        this.statsDebugUI.push(this.statsDebugText);
        
        // Instructions
        const instructions = this.add.text(20, 570, 'F2 / Select: Toggle\nF1 / Y: Hitboxes', {
            fontSize: '10px',
            color: '#888888'
        });
        instructions.setScrollFactor(0);
        instructions.setDepth(1501);
        this.statsDebugUI.push(instructions);
        
        // Update the stats text immediately
        this.updateStatsDebugUI();
    }
    
    updateStatsDebugUI() {
        if (!this.showStatsDebug || !this.statsDebugText || !this.playerStats) return;
        
        const stats = this.playerStats;
        const progression = this.playerProgression;
        const mods = this.statModifiers;
        
        const statsText = [
            `CHARACTER: ${this.selectedCharacter.name}`,
            ``,
            `=== PROGRESSION ===`,
            `Level: ${progression.level}`,
            `XP: ${progression.xp} / ${progression.xpToNextLevel}`,
            ``,
            `=== CORE STATS ===`,
            `Health: ${Math.ceil(stats.health)} / ${stats.maxHealth}`,
            `Armor: ${stats.armor}`,
            `Health Regen: ${stats.healthRegen.toFixed(1)}/sec`,
            `Move Speed: ${stats.moveSpeed.toFixed(1)}`,
            ``,
            `=== ABILITY STATS ===`,
            `Ability Damage: ${stats.abilityDamage.toFixed(2)}`,
            `Ability Cooldown: ${Math.round(stats.abilityCooldown)}ms`,
            `Ability Radius: ${Math.round(stats.abilityRadius)}px`,
            `Projectile Count: ${stats.projectileCount}`,
            ``,
            `=== UTILITY ===`,
            `Pickup Range: ${Math.round(stats.pickupRange)}px`,
            ``,
            `=== MULTIPLIERS ===`,
            `Ability Damage: ${(mods.abilityDamageMultiplier * 100).toFixed(0)}%`,
            `Cooldown: ${(mods.abilityCooldownMultiplier * 100).toFixed(0)}%`,
            `Move Speed: ${(mods.moveSpeedMultiplier * 100).toFixed(0)}%`,
            `Ability Radius: ${(mods.abilityRadiusMultiplier * 100).toFixed(0)}%`,
            `Pickup Range: ${(mods.pickupRangeMultiplier * 100).toFixed(0)}%`,
            ``,
            `=== BONUSES ===`,
            `Health Bonus: +${mods.healthBonus}`,
            `Armor Bonus: +${mods.armorBonus}`,
            `Regen Bonus: +${mods.healthRegenBonus}`,
            `Damage Bonus: +${mods.abilityDamageBonus}`,
            `Pickup Bonus: +${mods.pickupRangeBonus}`,
            `Radius Bonus: +${mods.abilityRadiusBonus}`,
            `Projectile Bonus: +${mods.projectileCountBonus}`
        ].join('\n');
        
        this.statsDebugText.setText(statsText);
    }
    
    hideStatsDebugUI() {
        if (this.statsDebugUI) {
            this.statsDebugUI.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.statsDebugUI = [];
        }
        this.statsDebugText = null;
    }

    update() {
        // Handle gamepad input for character selection
        if (!this.gameStarted) {
            this.handleGamepadInput();
            
            // Update character selection animated overlays
            if (this.characterCards) {
                this.characterCards.forEach(card => {
                    if (card.characterData) {
                        const charSprite = this.children.list.find(child => 
                            child.texture && child.texture.key === card.characterData.sprite
                        );
                        if (charSprite) {
                            this.updateAnimatedOverlay(charSprite);
                        }
                    }
                });
            }
            return;
        }
        
        // Handle gamepad input (needs to work even when upgrade screen is open)
        this.handleGamepadInput();
        
        // Only allow movement after game has started and when not in upgrade screen or paused
        if (this.upgradeSystem.isPaused || this.isPaused) return;
        
        // Player movement using Matter.js (apply speed upgrades)
        const speed = (this.playerStats.speed * this.playerStats.moveSpeedMultiplier) / 50; // Scale down for Matter.js
        let velocityX = 0;
        let velocityY = 0;
        
        // Keyboard input
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            velocityX = speed;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            velocityY = speed;
        }
        
        // Gamepad input (left analog stick)
        if (this.gamepadState.supported && this.gamepadState.connected && this.gamepadState.pad) {
            const leftStick = this.gamepadState.pad.leftStick;
            if (leftStick) {
                if (Math.abs(leftStick.x) > this.gamepadState.deadzone) {
                    velocityX = leftStick.x * speed;
                }
                if (Math.abs(leftStick.y) > this.gamepadState.deadzone) {
                    velocityY = leftStick.y * speed;
                }
            }
        }
        
        // Apply velocity using Matter.js
        this.matter.body.setVelocity(this.player.body, { x: velocityX, y: velocityY });
        
        // Update player debug hitbox position
        if (this.player.hitboxDebug) {
            this.player.hitboxDebug.x = this.player.x;
            this.player.hitboxDebug.y = this.player.y;
        }
        
        // Update player animated overlay position
        this.updateAnimatedOverlay(this.player);
        
        // Health regeneration
        if (this.playerStats.healthRegen > 0) {
            const currentTime = this.time.now;
            if (currentTime - this.playerProgression.lastRegenTime >= 1000) { // Every second
                this.playerStats.health = Math.min(
                    this.playerStats.maxHealth,
                    this.playerStats.health + this.playerStats.healthRegen
                );
                this.playerProgression.lastRegenTime = currentTime;
            }
        }
        
        // Debug toggle (F1 - hitboxes)
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.showHitboxes = !this.showHitboxes;
            
            // Toggle visibility of player hitbox debug circle
            if (this.player.hitboxDebug) {
                this.player.hitboxDebug.setVisible(this.showHitboxes);
            }
            
            // Toggle visibility of all enemy hitbox debug circles
            this.enemies.children.entries.forEach(enemy => {
                if (enemy.hitboxDebug) {
                    enemy.hitboxDebug.setVisible(this.showHitboxes);
                }
            });
        }
        
        // Stats debug toggle (F2 - stats display)
        if (Phaser.Input.Keyboard.JustDown(this.statsDebugKey)) {
            this.toggleStatsDebug();
        }
        
        // Pause toggle with Escape key (only during gameplay, not upgrade screen, with cooldown after upgrade)
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey) && 
            (!this.upgradeSystem || !this.upgradeSystem.isPaused) &&
            (!this.lastUpgradeSelectionTime || this.time.now - this.lastUpgradeSelectionTime >= 500)) {
            this.togglePause();
        }
        
        // Enemy AI using Matter.js
        const activeEnemies = this.enemies.children.entries.filter(enemy => enemy.active && enemy.body && enemy.scene);
        activeEnemies.forEach(enemy => {
            let angle, speed = enemy.speed / 50; // Scale down for Matter.js
            
            // Check if enemy is confused
            if (this.confusedEnemies && this.confusedEnemies.has(enemy)) {
                // Confused enemies move randomly
                if (!enemy.confusedDirection || this.time.now > enemy.nextDirectionChange) {
                    enemy.confusedDirection = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    enemy.nextDirectionChange = this.time.now + 500; // Change direction every 0.5s
                }
                angle = enemy.confusedDirection;
                speed = (enemy.speed / 50) * 0.6; // Move slower when confused
            } else {
                // Normal chase AI - move towards player
                angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            }
            
            this.matter.body.setVelocity(enemy.body, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            
            // Update debug hitbox position
            if (enemy.hitboxDebug) {
                enemy.hitboxDebug.x = enemy.x;
                enemy.hitboxDebug.y = enemy.y;
            }
            
            // Update animated overlay position
            this.updateAnimatedOverlay(enemy);
        });
        
        // XP Orb magnetism using Matter.js (use pickup range stat)
        const activeOrbs = this.xpOrbs.children.entries.filter(orb => orb.active && orb.body && orb.scene);
        activeOrbs.forEach(orb => {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, orb.x, orb.y);
            if (distance < this.playerStats.pickupRange) { // Use pickup range stat
                const angle = Phaser.Math.Angle.Between(orb.x, orb.y, this.player.x, this.player.y);
                const speed = this.gameConfig.XP_ORB_MAGNET_SPEED / 50; // Scale down for Matter.js
                this.matter.body.setVelocity(orb.body, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                });
            }
        });
        
        // Update character-specific abilities
        if (this.selectedCharacter.id === 'wizard') {
            this.updateWizardStarfall();
            this.updateStarfallProjectiles();
            this.updateConfusedEnemies();
        } else if (this.selectedCharacter.id === 'goose' && this.orbitingGeese) {
            // Update goose orbit (use ability radius stat) with safety checks
            const orbitRadius = this.playerStats.abilityRadius;
            const baseOrbitSpeed = 2;
            // Apply cooldown reduction to orbit speed (faster orbiting = more DPS)
            const orbitSpeed = baseOrbitSpeed / this.playerStats.abilityCooldownMultiplier;
            
            // Enhanced safety checks for geese
            const activeGeese = this.orbitingGeese.children.entries.filter(goose => 
                goose && goose.active && goose.body && goose.scene && 
                typeof goose.orbitAngle === 'number'
            );
            
            activeGeese.forEach(goose => {
                try {
                    // Ensure player exists and has valid position
                    if (!this.player || typeof this.player.x !== 'number' || typeof this.player.y !== 'number') {
                        console.warn('Player position invalid during goose orbit update');
                        return;
                    }
                    
                    // Update orbit angle (now affected by cooldown reduction)
                    goose.orbitAngle += orbitSpeed * 0.02; // Adjusted for frame rate
                    
                    // Calculate new position
                    const newX = this.player.x + Math.cos(goose.orbitAngle) * orbitRadius;
                    const newY = this.player.y + Math.sin(goose.orbitAngle) * orbitRadius;
                    
                    // Validate calculated position
                    if (isNaN(newX) || isNaN(newY)) {
                        console.warn('Invalid goose position calculated:', { newX, newY, orbitAngle: goose.orbitAngle });
                        return;
                    }
                    
                    // Update goose position
                    goose.x = newX;
                    goose.y = newY;
                } catch (error) {
                    console.error('Error updating goose orbit:', error, goose);
                }
            });
        }
        
        // Update UI
        this.updateUI();
        
        // Update stats debug UI if active
        if (this.showStatsDebug) {
            this.updateStatsDebugUI();
        }
    }
    
    handleGamepadInput() {
        if (!this.gamepadState.supported || !this.gamepadState.connected || !this.gamepadState.pad) return;
        
        const pad = this.gamepadState.pad;
        const currentTime = this.time.now;
        
        // Check if gamepad is still connected
        if (!pad.connected) {
            this.gamepadState.connected = false;
            this.gamepadState.pad = null;
            return;
        }
        
        // Helper function to check if button was just pressed (debounce)
        const justPressed = (buttonIndex) => {
            if (!pad.buttons[buttonIndex]) {
                return false;
            }
            
            const isPressed = pad.buttons[buttonIndex].pressed;
            const lastPress = this.gamepadState.lastButtonPress[buttonIndex] || 0;
            
            if (isPressed && currentTime - lastPress > 200) { // 200ms debounce
                this.gamepadState.lastButtonPress[buttonIndex] = currentTime;
                return true;
            }
            return false;
        };
        
        // Character selection navigation
        if (!this.characterSelected && this.characterCards) {
            let navigationChanged = false;
            
            // D-Pad navigation
            if (justPressed(14)) { // D-Pad Left
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                navigationChanged = true;
            } else if (justPressed(15)) { // D-Pad Right
                this.selectedCharacterIndex = Math.min(this.characterCards.length - 1, this.selectedCharacterIndex + 1);
                navigationChanged = true;
            }
            
            // Left stick navigation (with debouncing)
            if (pad.leftStick && Math.abs(pad.leftStick.x) > 0.6) {
                const lastStickPress = this.gamepadState.lastStickPress || 0;
                if (currentTime - lastStickPress > 300) { // 300ms debounce for stick
                    if (pad.leftStick.x < -0.6) { // Left
                        this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                        navigationChanged = true;
                        this.gamepadState.lastStickPress = currentTime;
                    } else if (pad.leftStick.x > 0.6) { // Right
                        this.selectedCharacterIndex = Math.min(this.characterCards.length - 1, this.selectedCharacterIndex + 1);
                        navigationChanged = true;
                        this.gamepadState.lastStickPress = currentTime;
                    }
                }
            }
            
            if (navigationChanged) {
                this.updateCharacterHighlight();
            }
            
            // A button to select character
            if (justPressed(0)) { // A button
                const selectedCharacter = Object.values(this.characters)[this.selectedCharacterIndex];
                this.selectCharacter(selectedCharacter);
            }
        }
        
        // Upgrade selection navigation
        if (this.upgradeSystem && this.upgradeSystem.isPaused && this.upgradeSystem.currentUpgradeChoices.length > 0) {
            let upgradeNavigationChanged = false;
            
            // D-Pad navigation for upgrades
            if (justPressed(14)) { // Left
                this.gamepadState.selectedUpgradeIndex = Math.max(0, this.gamepadState.selectedUpgradeIndex - 1);
                upgradeNavigationChanged = true;
            } else if (justPressed(15)) { // Right
                this.gamepadState.selectedUpgradeIndex = Math.min(2, this.gamepadState.selectedUpgradeIndex + 1);
                upgradeNavigationChanged = true;
            }
            
            // Left stick navigation for upgrades (with debouncing)
            if (pad.leftStick && Math.abs(pad.leftStick.x) > 0.6) {
                const lastUpgradeStickPress = this.gamepadState.lastUpgradeStickPress || 0;
                if (currentTime - lastUpgradeStickPress > 300) { // 300ms debounce for stick
                    if (pad.leftStick.x < -0.6) { // Left
                        this.gamepadState.selectedUpgradeIndex = Math.max(0, this.gamepadState.selectedUpgradeIndex - 1);
                        upgradeNavigationChanged = true;
                        this.gamepadState.lastUpgradeStickPress = currentTime;
                    } else if (pad.leftStick.x > 0.6) { // Right
                        this.gamepadState.selectedUpgradeIndex = Math.min(2, this.gamepadState.selectedUpgradeIndex + 1);
                        upgradeNavigationChanged = true;
                        this.gamepadState.lastUpgradeStickPress = currentTime;
                    }
                }
            }
            
            if (upgradeNavigationChanged) {
                this.updateUpgradeHighlight();
            }
            
            // A button to select upgrade
            if (justPressed(0)) { // A button
                const selectedUpgrade = this.upgradeSystem.currentUpgradeChoices[this.gamepadState.selectedUpgradeIndex];
                this.selectUpgrade(selectedUpgrade);
            }
            
            // X button to reroll selected upgrade
            if (justPressed(2) && this.upgradeSystem && this.upgradeSystem.rerollsRemaining > 0) { // X button
                this.rerollSingleUpgrade(this.gamepadState.selectedUpgradeIndex);
            }
        }
        
        // Y button for hitbox debug toggle
        if (justPressed(3)) { // Y button
            this.showHitboxes = !this.showHitboxes;
            
            // Toggle player hitbox visibility
            if (this.player && this.player.hitboxDebug) {
                this.player.hitboxDebug.setVisible(this.showHitboxes);
            }
            
            // Toggle enemy hitbox visibility
            this.enemies.children.entries.forEach(enemy => {
                if (enemy.hitboxDebug) {
                    enemy.hitboxDebug.setVisible(this.showHitboxes);
                }
            });
        }
        
        // Select button for stats debug toggle
        if (justPressed(8)) { // Select/Back button
            this.toggleStatsDebug();
        }
        
        // Start button for pause toggle (only during gameplay, not character selection or upgrade screen, with cooldown after upgrade)
        if (justPressed(9) && this.gameStarted && 
            (!this.upgradeSystem || !this.upgradeSystem.isPaused) &&
            (!this.lastUpgradeSelectionTime || this.time.now - this.lastUpgradeSelectionTime >= 500)) { // Start button
            this.togglePause();
        }
    }
    
    updateUpgradeHighlight() {
        if (!this.upgradeCardElements || !this.upgradeSystem || !this.upgradeSystem.currentUpgradeChoices) return;
        
        // Update visual highlighting for all upgrade cards
        this.upgradeCardElements.forEach((cardElements, index) => {
            if (!cardElements || cardElements.length === 0) return;
            
            // Elements are always in order: card, icon, name, description, [rerollButton, rerollText]
            const card = cardElements[0]; // Rectangle background
            const icon = cardElements[1]; // Icon text
            const name = cardElements[2]; // Name text
            
            if (card && icon && name) {
                if (index === this.gamepadState.selectedUpgradeIndex) {
                    // Highlight selected card with bright yellow
                    card.setStrokeStyle(5, 0xffff00); // Thicker yellow border
                    card.setFillStyle(0x555555); // Lighter background
                    name.setColor('#ffff00'); // Yellow name
                    icon.setTint(0xffff00); // Yellow icon
                } else {
                    // Reset non-selected cards to default
                    card.setStrokeStyle(3, 0x666666);
                    card.setFillStyle(0x333333);
                    name.setColor('#ffffff');
                    icon.clearTint();
                }
            }
        });
    }
    
    createAnimatedOverlay(gameObject, assetPath, width, height) {
        // Create or get the overlay container
        let container = document.getElementById('bufo-overlay-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bufo-overlay-container';
            container.style.position = 'absolute';
            container.style.overflow = 'hidden';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '5'; // Above canvas but below UI
            document.body.appendChild(container);
        }
        
        // Create HTML img element for GIF animation
        const img = document.createElement('img');
        img.src = assetPath;
        img.style.position = 'absolute';
        img.style.width = width + 'px';
        img.style.height = height + 'px';
        img.style.pointerEvents = 'none'; // Don't interfere with game input
        img.style.imageRendering = 'pixelated'; // Keep pixel art crisp
        img.style.imageRendering = 'crisp-edges'; // Alternative for some browsers
        img.style.transform = 'translate(-50%, -50%)'; // Center the image
        img.style.filter = 'none'; // Disable any filtering
        img.style.backfaceVisibility = 'hidden'; // Improve performance
        
        // Add to container instead of body
        container.appendChild(img);
        
        // Store reference for cleanup
        gameObject.animatedOverlay = img;
        
        return img;
    }
    
    updateAnimatedOverlay(gameObject) {
        if (gameObject.animatedOverlay && gameObject.active) {
            // Don't update overlays during upgrade screen or when explicitly hidden
            if ((this.upgradeSystem && this.upgradeSystem.isPaused) || this.overlaysHidden) {
                return;
            }
            
            // Update container position to match canvas
            const container = document.getElementById('bufo-overlay-container');
            if (container) {
                // Ensure container is visible (in case something else hid it)
                if (container.style.display === 'none') {
                    container.style.display = 'block';
                }
                
                const canvas = this.sys.game.canvas;
                const canvasRect = canvas.getBoundingClientRect();
                
                container.style.left = (canvasRect.left + window.scrollX) + 'px';
                container.style.top = (canvasRect.top + window.scrollY) + 'px';
                container.style.width = canvasRect.width + 'px';
                container.style.height = canvasRect.height + 'px';
            }
            
            let finalX, finalY;
            
            // Check if this is during character selection (no camera scrolling)
            if (!this.gameStarted) {
                // Character selection screen - use direct coordinates
                finalX = gameObject.x;
                finalY = gameObject.y;
            } else {
                // In-game - use camera coordinates
                const camera = this.cameras.main;
                finalX = (gameObject.x - camera.scrollX) * camera.zoom;
                finalY = (gameObject.y - camera.scrollY) * camera.zoom;
            }
            
            // Snap to pixel boundaries to reduce blurriness
            finalX = Math.round(finalX);
            finalY = Math.round(finalY);
            
            // Update overlay position (relative to container)
            gameObject.animatedOverlay.style.left = finalX + 'px';
            gameObject.animatedOverlay.style.top = finalY + 'px';
            gameObject.animatedOverlay.style.display = 'block';
        }
    }
    
    destroyAnimatedOverlay(gameObject) {
        if (gameObject.animatedOverlay) {
            // Remove from container if it exists
            const container = document.getElementById('bufo-overlay-container');
            if (container && gameObject.animatedOverlay.parentNode === container) {
                container.removeChild(gameObject.animatedOverlay);
            }
            gameObject.animatedOverlay = null;
        }
    }
    
    cleanupAllOverlays() {
        // Clean up the entire overlay container
        const container = document.getElementById('bufo-overlay-container');
        if (container) {
            document.body.removeChild(container);
        }
    }
    
    hideAllOverlays() {
        // Hide all animated overlays
        this.overlaysHidden = true;
        const container = document.getElementById('bufo-overlay-container');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    showAllOverlays() {
        // Show all animated overlays
        this.overlaysHidden = false;
        const container = document.getElementById('bufo-overlay-container');
        if (container) {
            container.style.display = 'block';
        }
    }

}

export default GameScene; 