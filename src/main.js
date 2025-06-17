import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d5016', // Dark forest green
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: false // Set to true for debugging
        }
    },
    input: {
        gamepad: true // Enable gamepad support
    },
    scene: [
        GameScene
    ]
};

const game = new Phaser.Game(config); 