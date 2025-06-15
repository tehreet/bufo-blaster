// UI Rendering System
import { GAME_CONFIG } from './constants.js';
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
    gameOver
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
    const healthPercentage = Math.max(0, playerHealth / 100); // Assuming max health is 100

    // Background (red)
    context.fillStyle = 'red';
    context.fillRect(barX, barY, GAME_CONFIG.PLAYER_HEALTHBAR_WIDTH, GAME_CONFIG.PLAYER_HEALTHBAR_HEIGHT);

    // Foreground (green)
    context.fillStyle = 'green';
    context.fillRect(barX, barY, GAME_CONFIG.PLAYER_HEALTHBAR_WIDTH * healthPercentage, GAME_CONFIG.PLAYER_HEALTHBAR_HEIGHT);
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
    context.fillText(`Health: ${playerHealth}`, 10, 30);
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
    
    context.restore();
} 