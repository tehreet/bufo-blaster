import Logger from './Logger.js';

// Input Manager - Handles keyboard, mouse, and gamepad input

class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.gamepadState = {
            connected: false,
            pad: null,
            lastButtonPress: {},
            selectedUpgradeIndex: 0,
            deadzone: 0.3,
            supported: false
        };
        
        this.characterCardClicked = false;
        this.upgradeCardClicked = false;
        this.selectedCharacterIndex = 0;
        this.characterCards = [];
        
        // Character direction state
        this.lastFacingDirection = null; // Track current facing direction to prevent unnecessary flips
        
        this.setupInput();
    }

    setupInput() {
        // Keyboard
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.debugKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
        this.statsDebugKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.pauseKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Mouse
        this.scene.input.on('pointerdown', this.handleClick, this);
        
        // Gamepad
        this.setupGamepadSupport();
    }

    setupGamepadSupport() {
        // Check if gamepad support is available
        if (!this.scene.input.gamepad) {
            this.gamepadState.supported = false;
            return;
        }
        
        try {
            // The gamepad manager should already be started with the config, but let's ensure it
            if (!this.scene.input.gamepad.enabled) {
                this.scene.input.gamepad.start();
            }
            
            this.gamepadState.supported = true;
            
            // Listen for gamepad connection
            this.scene.input.gamepad.on('connected', (pad) => {
                // Only connect to actual game controllers, not headsets
                if (this.isValidGameController(pad)) {
                    this.gamepadState.connected = true;
                    this.gamepadState.pad = pad;
                    
                    // Show gamepad controls hint
                    this.showGamepadHint();
                }
            });
            
            this.scene.input.gamepad.on('disconnected', (pad) => {
                this.gamepadState.connected = false;
                this.gamepadState.pad = null;
            });
            
            // Check for already connected gamepads
            if (this.scene.input.gamepad.total > 0) {
                for (let i = 0; i < this.scene.input.gamepad.total; i++) {
                    const pad = this.scene.input.gamepad.getPad(i);
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
            this.gamepadState.supported = false;
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
        const hint = this.scene.add.text(700, 50, 'Xbox Controller Connected!\nLeft Stick: Move/Navigate | A: Select | X: Reroll\nY: Hitboxes | Select: Stats Debug', {
            fontSize: '14px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Fade out after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: hint,
                alpha: 0,
                duration: 1000,
                onComplete: () => hint.destroy()
            });
        });
    }

    handleClick(pointer) {
        // Check if this click was from a character card (prevent pause immediately after character selection)
        if (this.characterCardClicked) {
            this.characterCardClicked = false;
            return;
        }
        
        // Check if this click was from an upgrade card (prevent pause immediately after upgrade selection)
        if (this.upgradeCardClicked) {
            this.upgradeCardClicked = false;
            return;
        }
        
        // Only allow pausing during gameplay (not during character selection or upgrades)
        if (this.scene.gameStarted && !this.scene.upgradeSystem.upgradeActive) {
            this.scene.uiSystem.togglePause();
        }
    }

    setCharacterCardClicked() {
        this.characterCardClicked = true;
    }

    setUpgradeCardClicked() {
        this.upgradeCardClicked = true;
    }

    updateCharacterHighlight() {
        // Update character selection highlight for gamepad
        if (!this.gamepadState.connected || !this.characterCards || this.characterCards.length === 0) return;
        
        // Reset all character card highlights
        this.characterCards.forEach((card, index) => {
            if (card && card.characterData) {
                if (index === this.selectedCharacterIndex) {
                    card.setStrokeStyle(4, 0xffffff); // Highlight selected
                } else {
                    card.setStrokeStyle(3, card.characterData.color); // Normal
                }
            }
        });
    }

    handleCharacterSelectionInput() {
        if (!this.gamepadState.connected || this.scene.characterSystem.isCharacterSelected()) return;
        
        const pad = this.gamepadState.pad;
        const justPressed = this.getJustPressedFunction();
        
        // Character selection navigation
        if (justPressed(14) || (pad.leftStick.y < -this.gamepadState.deadzone && justPressed('leftStick'))) { // Up/Left
            this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
            this.updateCharacterHighlight();
        }
        if (justPressed(15) || (pad.leftStick.y > this.gamepadState.deadzone && justPressed('leftStick'))) { // Down/Right
            const characters = Object.values(this.scene.characterSystem.getCharacters());
            this.selectedCharacterIndex = Math.min(characters.length - 1, this.selectedCharacterIndex + 1);
            this.updateCharacterHighlight();
        }
        if (justPressed(12) || (pad.leftStick.x < -this.gamepadState.deadzone && justPressed('leftStick'))) { // Left
            this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
            this.updateCharacterHighlight();
        }
        if (justPressed(13) || (pad.leftStick.x > this.gamepadState.deadzone && justPressed('leftStick'))) { // Right
            const characters = Object.values(this.scene.characterSystem.getCharacters());
            this.selectedCharacterIndex = Math.min(characters.length - 1, this.selectedCharacterIndex + 1);
            this.updateCharacterHighlight();
        }
        
        // Select character
        if (justPressed(0)) { // A button
            const characters = Object.values(this.scene.characterSystem.getCharacters());
            if (this.selectedCharacterIndex < characters.length) {
                this.scene.uiSystem.selectCharacter(characters[this.selectedCharacterIndex]);
            }
        }
    }

    getJustPressedFunction() {
        return (buttonIndex) => {
            if (!this.gamepadState.pad) return false;
            
            if (buttonIndex === 'leftStick') {
                // Handle analog stick presses
                const currentTime = this.scene.time.now;
                const lastPress = this.gamepadState.lastButtonPress['leftStick'] || 0;
                
                if (currentTime - lastPress > 200) { // 200ms debounce for analog sticks
                    this.gamepadState.lastButtonPress['leftStick'] = currentTime;
                    return true;
                }
                return false;
            }
            
            const button = this.gamepadState.pad.buttons[buttonIndex];
            if (!button) return false;
            
            const currentTime = this.scene.time.now;
            const wasPressed = this.gamepadState.lastButtonPress[buttonIndex] || 0;
            
            if (button.pressed && currentTime - wasPressed > 150) { // 150ms debounce
                this.gamepadState.lastButtonPress[buttonIndex] = currentTime;
                return true;
            }
            
            return false;
        };
    }

    handleGameplayInput() {
        if (!this.scene.gameStarted || this.scene.upgradeSystem.upgradeActive || this.scene.isPaused || !this.scene.player) return;
        
        // Keyboard movement
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            velocityX = -1;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            velocityX = 1;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            velocityY = -1;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            velocityY = 1;
        }
        
        // Gamepad movement (analog stick already provides normalized input)
        if (this.gamepadState.connected && this.gamepadState.pad) {
            const leftStick = this.gamepadState.pad.leftStick;
            if (leftStick && (Math.abs(leftStick.x) > this.gamepadState.deadzone || Math.abs(leftStick.y) > this.gamepadState.deadzone)) {
                velocityX = leftStick.x;
                velocityY = leftStick.y;
            }
        }
        
        // Normalize diagonal movement to prevent speed boost
        if (velocityX !== 0 && velocityY !== 0) {
            // Diagonal movement: normalize the vector to maintain consistent speed
            const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            velocityX = velocityX / magnitude;
            velocityY = velocityY / magnitude;
        }
        
        // Apply speed scaling after normalization
        const playerSpeed = this.scene.statsSystem.getPlayerStats().speed;
        velocityX *= playerSpeed;
        velocityY *= playerSpeed;
        
        // Handle character direction based on horizontal movement
        this.updateCharacterDirection(velocityX);
        
        // Apply movement with boundary constraints
        if (this.scene.player && this.scene.player.body) {
            // Calculate the new position
            const newVelX = velocityX / 50;
            const newVelY = velocityY / 50;
            
            // Get map boundaries (with minimal padding for the player radius)
            const playerRadius = 8; // Updated player collision radius
            const mapWidth = this.scene.map ? this.scene.map.widthInPixels : 3200;
            const mapHeight = this.scene.map ? this.scene.map.heightInPixels : 2400;
            const padding = 2; // Very minimal padding to allow getting very close to edges
            const minX = playerRadius + padding;
            const maxX = mapWidth - playerRadius - padding;
            const minY = playerRadius + padding;
            const maxY = mapHeight - playerRadius - padding;
            
            // Calculate where the player would be after movement (minimal prediction for tight collision)
            const futureX = this.scene.player.x + newVelX * 4; // Very small prediction for precise movement
            const futureY = this.scene.player.y + newVelY * 4;
            
            // Constrain movement to map boundaries
            let constrainedVelX = newVelX;
            let constrainedVelY = newVelY;
            
            if (futureX < minX && newVelX < 0) constrainedVelX = 0;
            if (futureX > maxX && newVelX > 0) constrainedVelX = 0;
            if (futureY < minY && newVelY < 0) constrainedVelY = 0;
            if (futureY > maxY && newVelY > 0) constrainedVelY = 0;
            
            this.scene.matter.body.setVelocity(this.scene.player.body, {
                x: constrainedVelX,
                y: constrainedVelY
            });
        }
    }

    updateCharacterDirection(velocityX) {
        // Only update direction if there's significant horizontal movement
        const movementThreshold = 0.1; // Reduced threshold for more responsive direction changes
        
        if (Math.abs(velocityX) > movementThreshold) {
            const shouldFaceLeft = velocityX > 0; // Reversed: flip when moving right instead of left
            
            // Only update if direction has actually changed to prevent unnecessary operations
            if (this.lastFacingDirection !== shouldFaceLeft) {
                this.lastFacingDirection = shouldFaceLeft;
                
                // Apply flipping to the main player sprite
                if (this.scene.player) {
                    this.scene.player.setFlipX(shouldFaceLeft);
                }
                
                // Also apply flipping to any animated overlay (for GIF characters)
                const selectedCharacter = this.scene.characterSystem.getSelectedCharacter();
                if (selectedCharacter && this.scene.assetManager && this.scene.assetManager.animatedOverlays) {
                    // Find the overlay for this player
                    const playerOverlay = this.scene.assetManager.animatedOverlays.get(this.scene.player);
                    
                    if (playerOverlay && playerOverlay.element) {
                        // Apply CSS transform to flip the GIF overlay
                        const currentTransform = playerOverlay.element.style.transform || '';
                        const baseTransform = currentTransform.replace(/scaleX\([^)]*\)\s*/g, '');
                        
                        if (shouldFaceLeft) {
                            playerOverlay.element.style.transform = `scaleX(-1) ${baseTransform}`.trim();
                        } else {
                            playerOverlay.element.style.transform = baseTransform.trim();
                        }
                    }
                }
                
                // Character direction updated
            }
        }
    }

    handleDebugInput() {
        // Debug keys (F1 for hitboxes, F2 for stats)
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.scene.debugUtils.toggleHitboxDebug();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.statsDebugKey)) {
            this.scene.debugUtils.toggleStatsDebug();
        }
        
        // Gamepad debug controls
        if (this.gamepadState.connected) {
            const justPressed = this.getJustPressedFunction();
            
            if (justPressed(3)) { // Y button - toggle hitboxes
                this.scene.debugUtils.toggleHitboxDebug();
            }
            
            if (justPressed(8)) { // Select button - toggle stats debug
                this.scene.debugUtils.toggleStatsDebug();
            }
        }
    }

    handlePauseInput() {
        // ESC key for pause
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            if (this.scene.gameStarted && !this.scene.upgradeSystem.upgradeActive) {
                this.scene.uiSystem.togglePause();
            }
        }
        
        // Gamepad pause (Start button)
        if (this.gamepadState.connected) {
            const justPressed = this.getJustPressedFunction();
            
            if (justPressed(9)) { // Start button
                if (this.scene.gameStarted && !this.scene.upgradeSystem.upgradeActive) {
                    this.scene.uiSystem.togglePause();
                }
            }
        }
    }

    update() {
        if (!this.scene.characterSystem.isCharacterSelected()) {
            this.handleCharacterSelectionInput();
        } else {
            this.handleGameplayInput();
            this.handleDebugInput();
            this.handlePauseInput();
            
            // Handle upgrade screen input
            if (this.scene.upgradeSystem && this.scene.upgradeSystem.upgradeActive) {
                this.scene.upgradeSystem.handleGamepadUpgradeInput();
            }
        }
    }

    getGamepadState() {
        const gamepads = navigator.getGamepads();
        Logger.warn(Logger.Categories.INPUT, `navigator.getGamepads() returned ${gamepads.length} slots`);
        
        // Find the first connected VALID game controller (not headsets, etc.)
        let gamepad = null;
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].connected) {
                Logger.warn(Logger.Categories.INPUT, `Checking gamepad at index ${i}: ${gamepads[i].id}`);
                
                // Use our filtering logic to ensure it's a real game controller
                if (this.isValidGameController(gamepads[i])) {
                    gamepad = gamepads[i];
                    Logger.warn(Logger.Categories.INPUT, `Found VALID game controller at index ${i}: ${gamepad.id}`);
                    break;
                } else {
                    Logger.warn(Logger.Categories.INPUT, `Skipping invalid device at index ${i}: ${gamepads[i].id} (likely headset/audio device)`);
                }
            }
        }
        
        if (!gamepad) {
            Logger.warn(Logger.Categories.INPUT, 'No valid game controller found');
            return { connected: false };
        }

        const buttonStates = [];
        for (let i = 0; i < gamepad.buttons.length; i++) {
            buttonStates[i] = gamepad.buttons[i].pressed;
        }

        const state = {
            connected: true,
            buttons: buttonStates,
            axes: Array.from(gamepad.axes),
            id: gamepad.id
        };

        Logger.warn(Logger.Categories.INPUT, `Valid gamepad state: ${gamepad.buttons.length} buttons, ${gamepad.axes.length} axes, id: ${gamepad.id}`);
        return state;
    }

    setCharacterCards(cards) {
        this.characterCards = cards;
    }
}

export default InputManager; 