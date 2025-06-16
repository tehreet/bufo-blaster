// Input Handling System
import { GAME_CONFIG, CHARACTERS } from './constants.js';
import { 
    keys, 
    gamepad, 
    setGamepad,
    audioMusic,
    availableUpgrades,
    currentUpgradeSelectionIndex,
    prevUpPressed,
    prevDownPressed,
    prevSelectPressed,
    prevLeftPressed,
    prevRightPressed,
    gamePaused,
    setCurrentUpgradeSelectionIndex,
    setUpgradeButtonStates,
    setGamePausedForUpgrade,
    setGamePaused,
    setAvailableUpgrades,
    runnerInstance,
    engine,
    playerHealth,
    characterSelectionActive,
    selectedCharacter,
    setSelectedCharacter
} from './gameState.js';

// Function to select the primary gamepad
export function selectPrimaryGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    let foundGamepad = null;
    let preferredGamepad = null;

    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
            if (!foundGamepad) foundGamepad = gamepads[i]; // Fallback to first detected
            // Check for Xbox controller (Vendor ID 045e) or standard mapping
            if (gamepads[i].id.includes('STANDARD GAMEPAD') || 
                gamepads[i].id.toLowerCase().includes('xbox') || 
                (gamepads[i].id.includes('045e') || gamepads[i].id.includes('045E'))) {
                preferredGamepad = gamepads[i];
                break; // Found a preferred one, use it
            }
        }
    }

    const newGamepad = preferredGamepad || foundGamepad;
    if (newGamepad) {
        if (!gamepad || gamepad.id !== newGamepad.id) {
            console.log("Primary gamepad selected:", newGamepad.id);
            setGamepad(newGamepad);
        }
    } else {
        if (gamepad) {
            console.log("No active gamepad found, clearing previous selection.");
            setGamepad(null);
        }
    }
}

// Setup gamepad event listeners for connection/disconnection
export function setupGamepadEventListeners() {
    window.addEventListener("gamepadconnected", function(e) {
        console.log("Gamepad connected:", e.gamepad.id);
        selectPrimaryGamepad();
    });

    window.addEventListener("gamepaddisconnected", function(e) {
        console.log("Gamepad disconnected:", e.gamepad.id);
        if (gamepad && gamepad.id === e.gamepad.id) {
            setGamepad(null);
            selectPrimaryGamepad(); // Try to find another one
        }
    });

    // Debug button removed - gamepad detection is working
}

// Keyboard event handlers
export function setupKeyboardControls() {
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
}

// Get movement input from keyboard or gamepad
export function getMovementInput() {
    let velocityX = 0;
    let velocityY = 0;
    let gamepadInputProcessed = false;

    // Try to detect gamepad if we don't have one yet
    if (!gamepad) {
        selectPrimaryGamepad();
    }

    // Gamepad input (overrides keyboard if active)
    if (gamepad) {
        const currentFrameGamepads = navigator.getGamepads();
        if (gamepad.index < currentFrameGamepads.length) {
            const liveGamepadState = currentFrameGamepads[gamepad.index];

            if (liveGamepadState && liveGamepadState.connected && 
                liveGamepadState.axes && liveGamepadState.axes.length >= 2) {
                
                let stickX = liveGamepadState.axes[0];
                let stickY = liveGamepadState.axes[1];

                if (Math.abs(stickX) > GAME_CONFIG.GAMEPAD_DEAD_ZONE) {
                    velocityX = stickX;
                    gamepadInputProcessed = true;
                }
                if (Math.abs(stickY) > GAME_CONFIG.GAMEPAD_DEAD_ZONE) {
                    velocityY = stickY;
                    gamepadInputProcessed = true;
                }
            }
        }
    }

    // Fallback to keyboard if no gamepad input was processed
    if (!gamepadInputProcessed) {
        if (keys.w || keys.ArrowUp) velocityY = -1;
        if (keys.s || keys.ArrowDown) velocityY = 1;
        if (keys.a || keys.ArrowLeft) velocityX = -1;
        if (keys.d || keys.ArrowRight) velocityX = 1;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
        const factor = Math.sqrt(2) / 2; // 1/sqrt(2)
        velocityX *= factor;
        velocityY *= factor;
    }

    return { velocityX, velocityY };
}

// Gamepad navigation for upgrade menu
export function pollGamepadForUpgradeMenu() {
    if (!gamepad || availableUpgrades.length === 0) return;

    const pads = navigator.getGamepads();
    const live = pads[gamepad.index];
    if (!live) return;

    // D-Pad buttons (standard mapping): 12 = Up, 13 = Down, 0 = A / South Button
    const upPressed = (live.buttons[12] && live.buttons[12].pressed) || 
                     (live.axes && live.axes.length > 1 && live.axes[1] < -0.5);
    const downPressed = (live.buttons[13] && live.buttons[13].pressed) || 
                       (live.axes && live.axes.length > 1 && live.axes[1] > 0.5);
    const selectPressed = live.buttons[0] && live.buttons[0].pressed; // A button

    // Navigate options
    if (upPressed && !prevUpPressed) {
        const newIndex = (currentUpgradeSelectionIndex - 1 + availableUpgrades.length) % availableUpgrades.length;
        setCurrentUpgradeSelectionIndex(newIndex);
    }
    if (downPressed && !prevDownPressed) {
        const newIndex = (currentUpgradeSelectionIndex + 1) % availableUpgrades.length;
        setCurrentUpgradeSelectionIndex(newIndex);
    }

    // Select option
    if (selectPressed && !prevSelectPressed) {
        const chosen = availableUpgrades[currentUpgradeSelectionIndex];
        if (chosen && typeof chosen.apply === 'function') {
            chosen.apply();
        }
        setGamePausedForUpgrade(false);
        setAvailableUpgrades([]);
        if (playerHealth > 0 && runnerInstance && engine) {
            const { Runner } = Matter;
            Runner.run(runnerInstance, engine);
            if (audioMusic && audioMusic.paused) {
                audioMusic.play().catch(e => console.error("Error resuming music:", e));
            }
        }
    }

    // Update previous button states for edge detection
    setUpgradeButtonStates(upPressed, downPressed, selectPressed);
}

// Handle gamepad input for game over screen
export function handleGameOverInput() {
    if (!gamepad) return false;

    const pads = navigator.getGamepads();
    if (pads && gamepad.index < pads.length) {
        const liveGamepad = pads[gamepad.index];
        if (liveGamepad && liveGamepad.buttons[0]) {
            if (liveGamepad.buttons[0].pressed && !prevSelectPressed) {
                setUpgradeButtonStates(false, false, true);
                return true; // Signal to restart game
            }
            setUpgradeButtonStates(false, false, liveGamepad.buttons[0].pressed);
        } else {
            setUpgradeButtonStates(false, false, false);
        }
    } else {
        setUpgradeButtonStates(false, false, false);
    }
    return false;
}

// Handle pause input (gamepad start button)
export function handlePauseInput() {
    if (!gamepad) return false;

    const pads = navigator.getGamepads();
    const live = pads[gamepad.index];
    if (!live) return false;

    // Start button (button 9 in standard mapping)
    const startPressed = live.buttons[9] && live.buttons[9].pressed;
    
    // Use a static variable to track previous state for edge detection
    if (!handlePauseInput.prevStartPressed) {
        handlePauseInput.prevStartPressed = false;
    }
    
    if (startPressed && !handlePauseInput.prevStartPressed) {
        handlePauseInput.prevStartPressed = true;
        return true; // Signal to toggle pause
    }
    
    handlePauseInput.prevStartPressed = startPressed;
    return false;
}

// Handle character selection input
export function handleCharacterSelectionInput() {
    if (!characterSelectionActive) return false;

    const characters = Object.values(CHARACTERS);
    const currentIndex = characters.findIndex(char => char.id === selectedCharacter.id);
    
    // Removed spammy console log that was called every frame during character selection

    // Keyboard input
    if (keys.a || keys.ArrowLeft) {
        if (!keys.leftPressed) {
            const newIndex = (currentIndex - 1 + characters.length) % characters.length;
            setSelectedCharacter(characters[newIndex]);
            keys.leftPressed = true;
        }
    } else {
        keys.leftPressed = false;
    }

    if (keys.d || keys.ArrowRight) {
        if (!keys.rightPressed) {
            const newIndex = (currentIndex + 1) % characters.length;
            setSelectedCharacter(characters[newIndex]);
            keys.rightPressed = true;
        }
    } else {
        keys.rightPressed = false;
    }

    if (keys.Enter || keys[' ']) {
        if (!keys.confirmPressed) {
            keys.confirmPressed = true;
            return true; // Signal to start game
        }
    } else {
        keys.confirmPressed = false;
    }

    // Gamepad input
    if (gamepad) {
        const pads = navigator.getGamepads();
        const live = pads[gamepad.index];
        if (!live) return false;

        // D-Pad or left stick for navigation
        const leftPressed = (live.buttons[14] && live.buttons[14].pressed) || 
                           (live.axes && live.axes.length > 0 && live.axes[0] < -0.5);
        const rightPressed = (live.buttons[15] && live.buttons[15].pressed) || 
                            (live.axes && live.axes.length > 0 && live.axes[0] > 0.5);
        const confirmPressed = live.buttons[0] && live.buttons[0].pressed; // A button

        if (leftPressed && !prevLeftPressed) {
            const newIndex = (currentIndex - 1 + characters.length) % characters.length;
            setSelectedCharacter(characters[newIndex]);
        }
        if (rightPressed && !prevRightPressed) {
            const newIndex = (currentIndex + 1) % characters.length;
            setSelectedCharacter(characters[newIndex]);
        }
        if (confirmPressed && !prevSelectPressed) {
            setUpgradeButtonStates(false, false, true);
            return true; // Signal to start game
        }

        // Update previous states
        setUpgradeButtonStates(false, false, confirmPressed);
        prevLeftPressed = leftPressed;
        prevRightPressed = rightPressed;
    }

    return false;
} 