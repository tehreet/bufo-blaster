// UI Rendering System
import { GAME_CONFIG, DEFAULT_GAME_SETTINGS, CHARACTERS } from './constants.js';
import { 
    gameWidth, 
    gameHeight, 
    player,
    enemies,
    playerHealth,
    playerXP,
    playerLevel,
    xpToNextLevel,
    elapsedRunTimeFormatted,
    enemyKillCount,
    availableUpgrades,
    currentUpgradeSelectionIndex,
    gamePausedForUpgrade,
    gameOver,
    characterSelectionActive,
    selectedCharacter
} from './gameState.js';

// Helper function for text wrapping
export function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

// Render player health bar
export function renderPlayerHealthBar(context) {
    if (!player) return;

    const barX = player.position.x - GAME_CONFIG.PLAYER_HEALTHBAR_WIDTH / 2;
    const barY = player.position.y - GAME_CONFIG.PLAYER_RADIUS - GAME_CONFIG.PLAYER_HEALTHBAR_OFFSET_Y;
    const healthPercentage = Math.max(0, playerHealth / DEFAULT_GAME_SETTINGS.playerHealth); // Use actual max health

    // Background (red)
    context.fillStyle = 'red';
    context.fillRect(barX, barY, GAME_CONFIG.PLAYER_HEALTHBAR_WIDTH, GAME_CONFIG.PLAYER_HEALTHBAR_HEIGHT);

    // Foreground (green)
    context.fillStyle = 'green';
    context.fillRect(barX, barY, GAME_CONFIG.PLAYER_HEALTHBAR_WIDTH * healthPercentage, GAME_CONFIG.PLAYER_HEALTHBAR_HEIGHT);
}

// Render Stab Bufo aura
export function renderStabBufoAura(context) {
    if (!player) return;

    // Create a pulsing effect based on time
    const time = Date.now();
    const pulseIntensity = (Math.sin(time * 0.005) + 1) * 0.5; // Oscillates between 0 and 1
    const alpha = 0.1 + (pulseIntensity * 0.15); // Alpha between 0.1 and 0.25

    // Draw the aura circle
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = '#ff6b6b'; // Red-ish color for damage aura
    context.fillStyle = '#ff6b6b';
    context.lineWidth = 2;
    
    context.beginPath();
    context.arc(player.position.x, player.position.y, GAME_CONFIG.STAB_BUFO_AURA_RADIUS, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
    
    context.restore();
}

// Render enemy health bars
export function renderEnemyHealthBars(context) {
    enemies.forEach(enemy => {
        if (enemy.health !== undefined) {
            const barWidth = 30;
            const barHeight = 5;
            const x = enemy.position.x - barWidth / 2;
            const y = enemy.position.y - (enemy.circleRadius || GAME_CONFIG.ENEMY_RADIUS) - barHeight - 5;
            const healthPercentage = Math.max(0, enemy.health / GAME_CONFIG.ENEMY_MAX_HEALTH);

            // Background (red)
            context.fillStyle = 'red';
            context.fillRect(x, y, barWidth, barHeight);

            // Foreground (green)
            context.fillStyle = 'green';
            context.fillRect(x, y, barWidth * healthPercentage, barHeight);
        }
    });
}

// Render game HUD
export function renderHUD(context) {
    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.textAlign = 'left';
    
    // Game statistics
    context.fillText(`Health: ${playerHealth}/${DEFAULT_GAME_SETTINGS.playerHealth}`, 10, 30);
    context.fillText(`Level: ${playerLevel}`, 10, 50);
    context.fillText(`XP: ${playerXP}/${xpToNextLevel}`, 10, 70);
    context.fillText(`Time: ${elapsedRunTimeFormatted}`, 10, 90);
    context.fillText(`Kills: ${enemyKillCount}`, 10, 110);
}

// Render upgrade menu
export function renderUpgradeMenu(context) {
    if (!gamePausedForUpgrade || availableUpgrades.length === 0) return;

    const boxWidth = 200;
    const boxHeight = 100;
    const spacing = 20;
    const totalHeight = (boxHeight + spacing) * availableUpgrades.length - spacing;
    let startY = (gameHeight - totalHeight) / 2;

    availableUpgrades.forEach((upgrade, index) => {
        const boxY = startY + index * (boxHeight + spacing);
        const boxX = (gameWidth - boxWidth) / 2;
        
        // Box background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Upgrade name
        context.fillStyle = 'white';
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText(upgrade.name, gameWidth / 2, boxY + 30);
        
        // Upgrade description
        context.font = '12px Arial';
        wrapText(context, upgrade.description, gameWidth / 2, boxY + 55, boxWidth - 20, 15);

        // Highlight currently selected upgrade
        if (index === currentUpgradeSelectionIndex) {
            context.strokeStyle = 'yellow';
            context.lineWidth = 4;
            context.strokeRect(boxX, boxY, boxWidth, boxHeight);
        }
    });
}

// Render character selection screen
export function renderCharacterSelection(context) {
    if (!characterSelectionActive) return;

    // Dark background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, gameWidth, gameHeight);

    // Title
    context.fillStyle = 'white';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.fillText('Choose Your Bufo', gameWidth / 2, 100);

    // Character cards
    const cardWidth = 300;
    const cardHeight = 400;
    const spacing = 50;
    const characters = Object.values(CHARACTERS);
    const totalWidth = (cardWidth * characters.length) + (spacing * (characters.length - 1));
    const startX = (gameWidth - totalWidth) / 2;
    const cardY = 150;

    characters.forEach((character, index) => {
        const cardX = startX + index * (cardWidth + spacing);
        const isSelected = selectedCharacter.id === character.id;

        // Card background
        context.fillStyle = isSelected ? 'rgba(255, 255, 0, 0.3)' : 'rgba(50, 50, 50, 0.8)';
        context.fillRect(cardX, cardY, cardWidth, cardHeight);

        // Card border
        context.strokeStyle = isSelected ? 'yellow' : 'white';
        context.lineWidth = isSelected ? 4 : 2;
        context.strokeRect(cardX, cardY, cardWidth, cardHeight);

        // Character name
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(character.name, cardX + cardWidth / 2, cardY + 40);

        // Character sprite placeholder (we'll add actual images later)
        context.fillStyle = 'rgba(100, 100, 100, 0.5)';
        context.fillRect(cardX + 50, cardY + 60, 200, 150);
        context.fillStyle = 'white';
        context.font = '16px Arial';
        context.fillText('Character Sprite', cardX + cardWidth / 2, cardY + 140);

        // Character stats
        context.font = '16px Arial';
        context.textAlign = 'left';
        context.fillStyle = 'white';
        context.fillText(`Health: ${character.health}`, cardX + 20, cardY + 240);
        context.fillText(`Speed: ${character.speed}`, cardX + 20, cardY + 260);

        // Ability info
        context.font = '18px Arial';
        context.fillStyle = 'cyan';
        context.textAlign = 'center';
        context.fillText(character.abilityName, cardX + cardWidth / 2, cardY + 300);
        
        context.font = '14px Arial';
        context.fillStyle = 'lightgray';
        wrapText(context, character.abilityDescription, cardX + cardWidth / 2, cardY + 325, cardWidth - 20, 18);

        // Description
        context.font = '14px Arial';
        context.fillStyle = 'lightgray';
        wrapText(context, character.description, cardX + cardWidth / 2, cardY + 370, cardWidth - 20, 16);
    });

    // Instructions
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.textAlign = 'center';
    context.fillText('Use A/D or Arrow Keys to select, Enter or Space to confirm', gameWidth / 2, gameHeight - 50);
}

// Render game over screen
export function renderGameOverScreen(context) {
    if (!gameOver) return;

    context.fillStyle = 'red';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.fillText('GAME OVER', gameWidth / 2, gameHeight / 2);
    
    context.font = '24px Arial';
    context.fillText("Press 'A' (Gamepad) or Click to Restart", gameWidth / 2, gameHeight / 2 + 60);
}

// Main render function called after each frame
export function renderUI(context) {
    // Clear any previous UI elements if needed
    context.save();
    
    // Show character selection if active
    if (characterSelectionActive) {
        renderCharacterSelection(context);
    } else {
        // Render character-specific abilities
        if (selectedCharacter.id === 'stab') {
            renderStabBufoAura(context);
        }
        // TODO: Add Wizard Bufo starfall visual effects here
        
        // Render player health bar
        renderPlayerHealthBar(context);
        
        // Render enemy health bars
        renderEnemyHealthBars(context);
        
        // Render HUD
        renderHUD(context);
        
        // Render upgrade menu if active
        renderUpgradeMenu(context);
        
        // Render game over screen if needed
        renderGameOverScreen(context);
    }
    
    context.restore();
} 