// UI Rendering System
import { GAME_CONFIG, DEFAULT_GAME_SETTINGS, CHARACTERS } from './constants.js';
import { 
    gameWidth, 
    gameHeight, 
    player,
    enemies,
    starfallProjectiles,
    orbitingGeese,
    convertedAllies,
    playerHealth,
    playerXP,
    playerLevel,
    xpToNextLevel,
    elapsedRunTimeFormatted,
    enemyKillCount,
    availableUpgrades,
    currentUpgradeSelectionIndex,
    gamePausedForUpgrade,
    gamePaused,
    gameOver,
    characterSelectionActive,
    selectedCharacter,
    imageAssets,
    playerStunned,
    playerSpeedMultiplier,
    abilityCooldownMultiplier
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
    const maxHealth = selectedCharacter ? selectedCharacter.health : DEFAULT_GAME_SETTINGS.playerHealth;
    const healthPercentage = Math.max(0, playerHealth / maxHealth);

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

// Render starfall projectiles with trail effects
export function renderStarfallProjectiles(context) {
    starfallProjectiles.forEach(starfall => {
        const time = Date.now();
        const age = time - starfall.creationTime;
        const maxAge = 5000; // 5 seconds
        const ageRatio = Math.min(age / maxAge, 1);
        
        // Create a glowing star effect
        context.save();
        
        // Outer glow
        const glowSize = 20 - (ageRatio * 8); // Larger, more visible glow
        context.globalAlpha = 0.4 - (ageRatio * 0.2);
        context.fillStyle = '#FFD700';
        context.beginPath();
        context.arc(starfall.position.x, starfall.position.y, glowSize, 0, 2 * Math.PI);
        context.fill();
        
        // Inner star
        context.globalAlpha = 1 - (ageRatio * 0.3);
        context.fillStyle = '#FFA500';
        context.strokeStyle = '#FFD700';
        context.lineWidth = 3; // Thicker outline
        
        // Draw a 5-pointed star
        const starSize = 12 - (ageRatio * 4); // Larger stars
        drawStar(context, starfall.position.x, starfall.position.y, starSize, 5);
        
        // Add a trailing comet effect
        context.globalAlpha = 0.3;
        context.fillStyle = '#FFD700';
        const trailLength = 30;
        for (let i = 1; i <= 5; i++) {
            const trailX = starfall.position.x - (starfall.velocity?.x || 0) * i * 2;
            const trailY = starfall.position.y - (starfall.velocity?.y || 0) * i * 2;
            const trailSize = starSize * (1 - i * 0.15);
            context.beginPath();
            context.arc(trailX, trailY, trailSize * 0.3, 0, 2 * Math.PI);
            context.fill();
        }
        
        context.restore();
    });
}

// Helper function to draw a star
function drawStar(context, x, y, radius, points) {
    const angle = Math.PI / points;
    context.beginPath();
    for (let i = 0; i < 2 * points; i++) {
        const r = i % 2 === 0 ? radius : radius * 0.5;
        const currX = x + Math.cos(i * angle) * r;
        const currY = y + Math.sin(i * angle) * r;
        if (i === 0) {
            context.moveTo(currX, currY);
        } else {
            context.lineTo(currX, currY);
        }
    }
    context.closePath();
    context.fill();
    context.stroke();
}

// Render confused enemy indicators
export function renderConfusedEnemies(context) {
    const currentTime = Date.now();
    enemies.forEach(enemy => {
        if (enemy.confused && currentTime < enemy.confusionEndTime) {
            // Draw spinning stars above confused enemies
            const spinSpeed = 0.01;
            const rotation = (currentTime * spinSpeed) % (2 * Math.PI);
            
            context.save();
            context.translate(enemy.position.x, enemy.position.y - 25);
            context.rotate(rotation);
            
            context.fillStyle = '#FFD700';
            context.strokeStyle = '#FFA500';
            context.lineWidth = 1;
            
            // Draw small spinning stars
            drawStar(context, -8, 0, 4, 5);
            drawStar(context, 8, 0, 4, 5);
            drawStar(context, 0, -8, 4, 5);
            
            context.restore();
        }
    });
}

// Render special status effects on player
export function renderPlayerStatusEffects(context) {
    if (!player) return;
    
    const statusY = player.position.y - GAME_CONFIG.PLAYER_RADIUS - 45;
    let statusIndex = 0;
    
    // Stunned indicator
    if (playerStunned) {
        const time = Date.now();
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7; // Pulsing effect
        
        context.save();
        context.globalAlpha = pulse;
        context.fillStyle = '#FFD700';
        context.strokeStyle = '#FF6B6B';
        context.lineWidth = 2;
        context.font = 'bold 14px Arial';
        context.textAlign = 'center';
        
        const text = 'STUNNED';
        const y = statusY - (statusIndex * 18);
        context.strokeText(text, player.position.x, y);
        context.fillText(text, player.position.x, y);
        context.restore();
        
        statusIndex++;
    }
    
    // Slowed indicator
    if (playerSpeedMultiplier < 1.0) {
        const time = Date.now();
        const pulse = Math.sin(time * 0.008) * 0.2 + 0.8; // Slower pulsing
        
        context.save();
        context.globalAlpha = pulse;
        context.fillStyle = '#87CEEB';
        context.strokeStyle = '#4169E1';
        context.lineWidth = 2;
        context.font = 'bold 14px Arial';
        context.textAlign = 'center';
        
        const text = 'SLOWED';
        const y = statusY - (statusIndex * 18);
        context.strokeText(text, player.position.x, y);
        context.fillText(text, player.position.x, y);
        context.restore();
        
        statusIndex++;
    }
    
    // Ability slowed indicator
    if (abilityCooldownMultiplier > 1.0) {
        const time = Date.now();
        const pulse = Math.sin(time * 0.006) * 0.2 + 0.8; // Even slower pulsing
        
        context.save();
        context.globalAlpha = pulse;
        context.fillStyle = '#B0E0E6';
        context.strokeStyle = '#1E90FF';
        context.lineWidth = 2;
        context.font = 'bold 12px Arial';
        context.textAlign = 'center';
        
        const text = 'ABILITY SLOWED';
        const y = statusY - (statusIndex * 18);
        context.strokeText(text, player.position.x, y);
        context.fillText(text, player.position.x, y);
        context.restore();
        
        statusIndex++;
    }
}

// Render enemy health bars
export function renderEnemyHealthBars(context) {
    enemies.forEach(enemy => {
        if (enemy.health !== undefined && enemy.maxHealth !== undefined) {
            const barWidth = enemy.enemyType && enemy.enemyType !== 'normal' ? 40 : 30; // Wider bars for special enemies
            const barHeight = 5;
            const x = enemy.position.x - barWidth / 2;
            const y = enemy.position.y - (enemy.circleRadius || GAME_CONFIG.ENEMY_RADIUS) - barHeight - 5;
            const healthPercentage = Math.max(0, enemy.health / enemy.maxHealth);

            // Background (red)
            context.fillStyle = 'red';
            context.fillRect(x, y, barWidth, barHeight);

            // Different colors for special enemies
            let healthColor = 'green';
            if (enemy.enemyType === 'buff_bufo') {
                healthColor = '#FFD700'; // Gold for buff bufo
            } else if (enemy.enemyType === 'gavel_bufo') {
                healthColor = '#8B4513'; // Brown for gavel bufo
            } else if (enemy.enemyType === 'ice_bufo') {
                healthColor = '#87CEEB'; // Light blue for ice bufo
            } else if (enemy.enemyType === 'boss_bufo') {
                healthColor = '#FF6B6B'; // Red for boss bufo
            }

            // Foreground
            context.fillStyle = healthColor;
            context.fillRect(x, y, barWidth * healthPercentage, barHeight);
            
            // Special enemy type indicator
            if (enemy.enemyType && enemy.enemyType !== 'normal') {
                context.fillStyle = 'white';
                context.strokeStyle = 'black';
                context.lineWidth = 1;
                context.font = '10px Arial';
                context.textAlign = 'center';
                
                let typeText = '';
                switch (enemy.enemyType) {
                    case 'buff_bufo': typeText = 'BUFF'; break;
                    case 'gavel_bufo': typeText = 'GAVEL'; break;
                    case 'ice_bufo': typeText = 'ICE'; break;
                    case 'boss_bufo': typeText = 'BOSS'; break;
                }
                
                if (typeText) {
                    context.strokeText(typeText, enemy.position.x, y - 8);
                    context.fillText(typeText, enemy.position.x, y - 8);
                }
            }
        }
    });
}

// Render Goose Bufo orbiting geese
export function renderGooseOrbit(context) {
    if (!player || selectedCharacter.id !== 'goose') return;

    orbitingGeese.forEach(goose => {
        const gooseX = player.position.x + Math.cos(goose.angle) * goose.radius;
        const gooseY = player.position.y + Math.sin(goose.angle) * goose.radius;
        
        // Draw goose as a simple bird-like shape
        context.save();
        context.translate(gooseX, gooseY);
        context.rotate(goose.angle + Math.PI / 2); // Orient geese to face their movement direction
        
        // Goose body (simple oval)
        context.fillStyle = 'white';
        context.strokeStyle = 'gray';
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(0, 0, 8, 5, 0, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
        
        // Goose head
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(0, -8, 4, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
        
        // Goose beak
        context.fillStyle = 'orange';
        context.beginPath();
        context.moveTo(0, -12);
        context.lineTo(-2, -14);
        context.lineTo(2, -14);
        context.closePath();
        context.fill();
        
        context.restore();
    });
}

// Render converted allies (goose-riding bufos)
export function renderConvertedAllies(context) {
    // Note: Converted allies now use Matter.js sprite rendering
    // This function is kept for potential additional effects or debugging
    convertedAllies.forEach(ally => {
        // Add a subtle glow effect around converted allies
        context.save();
        context.globalAlpha = 0.3;
        context.fillStyle = 'lightgreen';
        context.beginPath();
        context.arc(ally.position.x, ally.position.y, 20, 0, 2 * Math.PI);
        context.fill();
        context.restore();
        
        // Add a timer indicator above the ally
        const timeLeft = (GAME_CONFIG.GOOSE_BUFO_CONVERTED_ALLY_LIFETIME - (Date.now() - ally.creationTime)) / 1000;
        if (timeLeft > 0 && timeLeft < 3) { // Show countdown in last 3 seconds
            context.save();
            context.fillStyle = 'yellow';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.fillText(Math.ceil(timeLeft).toString(), ally.position.x, ally.position.y - 25);
            context.restore();
        }
    });
}

// Render game HUD
export function renderHUD(context) {
    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.textAlign = 'left';
    
    // Game statistics
    const maxHealth = selectedCharacter ? selectedCharacter.health : DEFAULT_GAME_SETTINGS.playerHealth;
    context.fillText(`Health: ${playerHealth}/${maxHealth}`, 10, 30);
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

        // Character sprite - use preloaded image
        const spriteKey = `character_${character.id}`;
        const spriteImg = imageAssets[spriteKey];
        
        if (spriteImg && spriteImg.complete && spriteImg.naturalHeight > 0) {
            // Image is loaded, draw it
            const spriteWidth = 200;
            const spriteHeight = 150;
            context.drawImage(spriteImg, cardX + 50, cardY + 60, spriteWidth, spriteHeight);
        } else {
            // Image not loaded yet, show placeholder
            context.fillStyle = 'rgba(100, 100, 100, 0.5)';
            context.fillRect(cardX + 50, cardY + 60, 200, 150);
            context.fillStyle = 'white';
            context.font = '16px Arial';
            context.fillText('Loading...', cardX + cardWidth / 2, cardY + 140);
        }

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
    context.fillText('Or click on a character card to select and start!', gameWidth / 2, gameHeight - 20);
    
    // Show current selection more prominently
    context.fillStyle = 'yellow';
    context.font = '24px Arial';
    context.fillText(`Selected: ${selectedCharacter.name}`, gameWidth / 2, gameHeight - 80);
}

// Render pause screen
export function renderPauseScreen(context) {
    if (!gamePaused) return;

    // Semi-transparent overlay
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, gameWidth, gameHeight);

    // Pause text
    context.fillStyle = 'white';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.fillText('PAUSED', gameWidth / 2, gameHeight / 2 - 50);
    
    context.font = '24px Arial';
    context.fillText("Press Start (Gamepad) or Click to Resume", gameWidth / 2, gameHeight / 2 + 20);
    
    // Show current character and stats
    context.font = '20px Arial';
    context.fillStyle = 'lightgray';
    context.fillText(`Playing as: ${selectedCharacter.name}`, gameWidth / 2, gameHeight / 2 + 60);
    context.fillText(`Time: ${elapsedRunTimeFormatted} | Kills: ${enemyKillCount} | Level: ${playerLevel}`, gameWidth / 2, gameHeight / 2 + 90);
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
        } else if (selectedCharacter.id === 'wizard') {
            renderStarfallProjectiles(context);
        } else if (selectedCharacter.id === 'goose') {
            renderGooseOrbit(context);
            renderConvertedAllies(context);
        }
        
        // Render player health bar
        renderPlayerHealthBar(context);
        
        // Render player status effects
        renderPlayerStatusEffects(context);
        
        // Render enemy health bars
        renderEnemyHealthBars(context);
        
        // Render confused enemy indicators
        renderConfusedEnemies(context);
        
        // Render HUD
        renderHUD(context);
        
        // Render upgrade menu if active
        renderUpgradeMenu(context);
        
        // Render pause screen if paused
        renderPauseScreen(context);
        
        // Render game over screen if needed
        renderGameOverScreen(context);
    }
    
    context.restore();
} 