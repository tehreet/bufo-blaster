// Input Handling System
import { GAME_CONFIG } from './constants.js';
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
    setCurrentUpgradeSelectionIndex,
    setUpgradeButtonStates,
    setGamePausedForUpgrade,
    setAvailableUpgrades,
    runnerInstance,
    engine,
    playerHealth
} from './gameState.js';

// Function to select the primary gamepad
export function selectPrimaryGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    let foundGamepad = null;
    let preferredGamepad = null;

    console.log("Checking for gamepads...", gamepads.length, "slots available");
    
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
            console.log(`Gamepad ${i}:`, gamepads[i].id, "Connected:", gamepads[i].connected);
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

    // Log the final decision
    if (gamepad) {
        console.log(`selectPrimaryGamepad RESULT: Active gamepad is ${gamepad.id}`);
    } else {
        console.log("selectPrimaryGamepad RESULT: No gamepad is active.");
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