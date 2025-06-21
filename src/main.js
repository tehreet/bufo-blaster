import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

// Responsive canvas configuration
function getCanvasSize() {
    const minWidth = 800;
    const minHeight = 600;
    const maxWidth = 1400;
    const maxHeight = 900;
    
    // Get the available viewport size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate aspect ratio (prefer 16:10 for good gameplay)
    const targetAspectRatio = 16 / 10;
    
    let width = viewportWidth;
    let height = viewportHeight;
    
    // Adjust to maintain aspect ratio
    if (width / height > targetAspectRatio) {
        width = height * targetAspectRatio;
    } else {
        height = width / targetAspectRatio;
    }
    
    // Constrain to min/max bounds
    width = Math.max(minWidth, Math.min(maxWidth, width));
    height = Math.max(minHeight, Math.min(maxHeight, height));
    
    // Ensure we don't exceed viewport
    if (width > viewportWidth * 0.95) {
        width = viewportWidth * 0.95;
        height = width / targetAspectRatio;
    }
    
    if (height > viewportHeight * 0.95) {
        height = viewportHeight * 0.95;
        width = height * targetAspectRatio;
    }
    
    return { width: Math.floor(width), height: Math.floor(height) };
}

// Initial canvas size
const canvasSize = getCanvasSize();

const config = {
    type: Phaser.AUTO,
    width: canvasSize.width,
    height: canvasSize.height,
    parent: 'game-container',
    backgroundColor: '#2d5016', // Dark forest green
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Enable responsive scaling
        width: canvasSize.width,
        height: canvasSize.height,
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: false // Set to true for debugging
        }
    },
    input: {
        gamepad: true, // Enable gamepad support
        touch: true    // Enable touch support for mobile
    },
    scene: [
        GameScene
    ]
};

const game = new Phaser.Game(config);

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    const newSize = getCanvasSize();
    game.scale.resize(newSize.width, newSize.height);
});

// Hide loading overlay when game is ready
game.events.once('ready', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
});

// Export game instance for global access if needed
window.BufoBlasterGame = game; 