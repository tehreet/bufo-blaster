// HTML UI Manager - Handles modern HTML/CSS overlays with Bulma styling
// Replaces Phaser-based UI with responsive, accessible HTML interfaces

import Logger from '../utils/Logger.js';

class HTMLUIManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedCharacterIndex = 0;
        this.charactersArray = [];
        
        // Upgrade selection state
        this.selectedUpgradeIndex = 0;
        this.currentUpgrades = [];
        this.rerollCount = 0;
        
        // Add InputManager reference
        this.inputManager = scene.inputManager;
        this.lastInputTime = 0;
        this.currentScreen = 'character-selection';
        this.inputManagerWarningShown = false; // Flag to prevent spam logging
        
        // Gamepad input debouncing
        this.gamepadInputCooldown = 0;
        this.gamepadInputDelay = 200; // 200ms between inputs
        
        // Get references to HTML overlay elements
        this.characterSelectionOverlay = document.getElementById('character-selection-overlay');
        this.gameHudOverlay = document.getElementById('game-hud-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.upgradeOverlay = document.getElementById('upgrade-overlay');
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Bind methods to preserve context
        this.handleCharacterCardClick = this.handleCharacterCardClick.bind(this);
        this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
        
        // Setup keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation);
    }
    
    // =================== CHARACTER SELECTION ===================
    
    showCharacterSelection() {
        Logger.ui('Showing character selection screen');
        this.currentScreen = 'character-selection';
        
        // Get characters from the character system
        const characters = this.scene.characterSystem.getCharacters();
        this.charactersArray = Object.values(characters);
        
        // Generate character cards HTML
        const characterGrid = document.getElementById('character-grid');
        characterGrid.innerHTML = this.generateCharacterCardsHTML();
        
        // Setup click handlers
        this.setupCharacterCardHandlers();
        
        // Show overlay with fade-in effect
        this.showOverlay(this.characterSelectionOverlay);
        
        // Reset selection
        this.selectedCharacterIndex = 0;
        this.updateCharacterSelection();
    }
    
    generateCharacterCardsHTML() {
        return this.charactersArray.map((character, index) => `
            <div class="character-card" data-character-index="${index}" data-character-id="${character.id}">
                <div class="character-image">
                    <img src="assets/characters/${character.sprite}.png" alt="${character.name}" />
                </div>
                
                <h3 class="title is-5 has-text-white mb-2">${character.name}</h3>
                
                <p class="has-text-light is-size-7 mb-3">${character.description}</p>
                
                <div class="notification is-info is-light mb-3" style="padding: 0.5rem;">
                    <p class="has-text-weight-bold is-size-7" style="color: ${character.color};">
                        <i class="fas fa-magic mr-1"></i>${character.abilityName}
                    </p>
                    <p class="is-size-7 has-text-dark">${character.abilityDescription}</p>
                </div>
                
                                 <div class="columns is-gapless is-mobile has-text-centered">
                     <div class="column">
                         <p class="has-text-white is-size-7">
                             <i class="fas fa-heart has-text-danger"></i><br>
                             <strong class="has-text-white">${character.baseStats.health}</strong>
                         </p>
                     </div>
                     <div class="column">
                         <p class="has-text-white is-size-7">
                             <i class="fas fa-tachometer-alt has-text-warning"></i><br>
                             <strong class="has-text-white">${character.baseStats.moveSpeed}</strong>
                         </p>
                     </div>
                     <div class="column">
                         <p class="has-text-white is-size-7">
                             <i class="fas fa-shield-alt has-text-info"></i><br>
                             <strong class="has-text-white">${character.baseStats.armor}</strong>
                         </p>
                     </div>
                 </div>
                
                <button class="button is-primary is-fullwidth mt-3 character-select-btn">
                    <i class="fas fa-play mr-2"></i>Select
                </button>
            </div>
        `).join('');
    }
    
    setupCharacterCardHandlers() {
        const characterCards = document.querySelectorAll('.character-card');
        
        characterCards.forEach((card, index) => {
            // Click handler
            card.addEventListener('click', () => {
                this.selectedCharacterIndex = index;
                this.selectCharacter();
            });
            
            // Hover handlers for visual feedback
            card.addEventListener('mouseenter', () => {
                this.selectedCharacterIndex = index;
                this.updateCharacterSelection();
            });
        });
    }
    
    updateCharacterSelection() {
        Logger.debug(Logger.Categories.UI, `Updating character selection to index ${this.selectedCharacterIndex} of ${this.charactersArray.length} characters`);
        
        const characterCards = document.querySelectorAll('.character-card');
        
        if (characterCards.length === 0) {
            Logger.warn(Logger.Categories.UI, 'No character cards found for selection update');
            return;
        }
        
        characterCards.forEach((card, index) => {
            if (index === this.selectedCharacterIndex) {
                card.classList.add('selected');
                // Scroll into view if using keyboard navigation
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.classList.remove('selected');
            }
        });
        
        Logger.debug(Logger.Categories.UI, `Character card ${this.selectedCharacterIndex} highlighted successfully`);
    }
    
    handleKeyboardNavigation(event) {
        // Only handle keyboard navigation on character selection screen
        if (this.currentScreen !== 'character-selection') return;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                this.updateCharacterSelection();
                break;
                
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                this.selectedCharacterIndex = Math.min(this.charactersArray.length - 1, this.selectedCharacterIndex + 1);
                this.updateCharacterSelection();
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.selectCharacter();
                break;
        }
    }
    
    selectCharacter() {
        const selectedCharacter = this.charactersArray[this.selectedCharacterIndex];
        
        Logger.info(Logger.Categories.UI, `Character selected: ${selectedCharacter.name}`);
        
        // Add selection animation
        const selectedCard = document.querySelector(`[data-character-index="${this.selectedCharacterIndex}"]`);
        if (selectedCard) {
            selectedCard.style.transform = 'scale(1.05)';
            selectedCard.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                selectedCard.style.transform = '';
            }, 200);
        }
        
        // Set character in scene
        this.scene.characterSystem.setSelectedCharacter(selectedCharacter);
        
        // Hide character selection IMMEDIATELY (no animation delay for character selection)
        this.characterSelectionOverlay.style.display = 'none';
        this.characterSelectionOverlay.classList.remove('fade-exit', 'fade-exit-active');
        
        // Update current screen
        this.currentScreen = 'game';
        
        // Start game immediately
        this.scene.uiSystem.startGame();
    }
    
    handleCharacterCardClick(event) {
        const card = event.target.closest('.character-card');
        if (!card) return;
        
        const characterIndex = parseInt(card.dataset.characterIndex);
        this.selectedCharacterIndex = characterIndex;
        this.selectCharacter();
    }
    
    // =================== UPGRADE SELECTION ===================
    
    showUpgradeSelection(upgrades, rerollCount) {
        Logger.info(Logger.Categories.UI, 'Showing upgrade selection screen');
        this.currentScreen = 'upgrade-selection';
        this.currentUpgrades = upgrades;
        this.rerollCount = rerollCount;
        
        // Generate upgrade cards HTML
        const upgradeGrid = document.getElementById('upgrade-grid');
        upgradeGrid.innerHTML = this.generateUpgradeCardsHTML();
        
        // Setup click handlers
        this.setupUpgradeCardHandlers();
        
        // Show overlay with fade-in effect
        this.showOverlay(this.upgradeOverlay);
        
        // Reset selection
        this.selectedUpgradeIndex = 0;
        this.updateUpgradeSelection();
    }
    
    generateUpgradeCardsHTML() {
        return this.currentUpgrades.map((upgrade, index) => {
            const upgradeIcon = this.getUpgradeIcon(upgrade);
            const isCharacterUpgrade = upgrade.type === 'character';
            
            return `
                <div class="upgrade-card ${isCharacterUpgrade ? 'character-upgrade' : ''}" 
                     data-upgrade-index="${index}" 
                     data-upgrade-id="${upgrade.id}">
                    
                    <div class="upgrade-type-badge ${upgrade.type}">
                        ${upgrade.type === 'character' ? 'CHARACTER' : 'GENERIC'}
                    </div>
                    
                    <div class="upgrade-icon">
                        <i class="fas ${upgradeIcon}"></i>
                    </div>
                    
                    <h3 class="title is-5 has-text-white mb-2">${upgrade.name}</h3>
                    
                    <div class="upgrade-stats">
                        <p class="has-text-light is-size-7">${upgrade.description}</p>
                    </div>
                    
                    <button class="reroll-btn" data-upgrade-index="${index}" ${this.rerollCount <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-dice mr-1"></i>Reroll (${this.rerollCount})
                    </button>
                </div>
            `;
        }).join('');
    }
    
    getUpgradeIcon(upgrade) {
        // Map upgrade types to Font Awesome icons
        const iconMap = {
            'health': 'fa-heart',
            'armor': 'fa-shield-alt',
            'regen': 'fa-plus-circle',
            'damage': 'fa-fist-raised',
            'cooldown': 'fa-clock',
            'radius': 'fa-expand-arrows-alt',
            'pickup': 'fa-magnet',
            'projectile': 'fa-crosshairs',
            'speed': 'fa-tachometer-alt',
            'unique': 'fa-star'
        };
        
        return iconMap[upgrade.statType] || iconMap[upgrade.id] || 'fa-bolt';
    }
    
    setupUpgradeCardHandlers() {
        const upgradeCards = document.querySelectorAll('.upgrade-card');
        const rerollButtons = document.querySelectorAll('.reroll-btn');
        
        // Upgrade card click handlers
        upgradeCards.forEach((card, index) => {
            card.addEventListener('click', (event) => {
                // Don't trigger card selection if reroll button was clicked
                if (event.target.closest('.reroll-btn')) return;
                
                this.selectedUpgradeIndex = index;
                this.selectUpgrade();
            });
            
            // Hover handlers for visual feedback
            card.addEventListener('mouseenter', () => {
                this.selectedUpgradeIndex = index;
                this.updateUpgradeSelection();
            });
        });
        
        // Reroll button handlers
        rerollButtons.forEach((button, index) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent card click
                this.rerollUpgrade(index);
            });
        });
    }
    
    updateUpgradeSelection() {
        Logger.debug(Logger.Categories.UI, `Updating upgrade selection to index ${this.selectedUpgradeIndex}`);
        
        const upgradeCards = document.querySelectorAll('.upgrade-card');
        
        upgradeCards.forEach((card, index) => {
            if (index === this.selectedUpgradeIndex) {
                card.classList.add('selected');
                // Scroll into view if using keyboard/gamepad navigation
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.classList.remove('selected');
            }
        });
    }
    
    selectUpgrade() {
        const selectedUpgrade = this.currentUpgrades[this.selectedUpgradeIndex];
        
        Logger.info(Logger.Categories.UI, `Upgrade selected: ${selectedUpgrade.name}`);
        
        // Add selection animation
        const selectedCard = document.querySelector(`[data-upgrade-index="${this.selectedUpgradeIndex}"]`);
        if (selectedCard) {
            selectedCard.style.transform = 'scale(1.05)';
            selectedCard.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                selectedCard.style.transform = '';
            }, 200);
        }
        
        // Hide upgrade selection immediately
        this.upgradeOverlay.style.display = 'none';
        this.upgradeOverlay.classList.remove('fade-exit', 'fade-exit-active');
        
        // Update current screen
        this.currentScreen = 'game';
        
        // Notify the upgrade system that an upgrade was selected
        this.scene.upgradeSystem.selectUpgradeFromHTML(selectedUpgrade);
    }
    
    rerollUpgrade(upgradeIndex) {
        if (this.rerollCount <= 0) {
            Logger.warn(Logger.Categories.UI, 'No rerolls remaining');
            return;
        }
        
        Logger.info(Logger.Categories.UI, `Rerolling upgrade at index ${upgradeIndex}`);
        
        // Notify the upgrade system to reroll
        this.scene.upgradeSystem.rerollUpgradeFromHTML(upgradeIndex);
    }
    
    hideUpgradeSelection() {
        Logger.info(Logger.Categories.UI, 'Hiding upgrade selection screen');
        this.currentScreen = 'game';
        this.hideOverlay(this.upgradeOverlay);
    }
    
    // =================== OVERLAY MANAGEMENT ===================
    
    showOverlay(overlay, duration = 300) {
        overlay.style.display = 'block';
        overlay.classList.add('fade-enter');
        
        // Force reflow
        overlay.offsetHeight;
        
        overlay.classList.add('fade-enter-active');
        overlay.classList.remove('fade-enter');
        
        setTimeout(() => {
            overlay.classList.remove('fade-enter-active');
        }, duration);
    }
    
    hideOverlay(overlay, duration = 300) {
        overlay.classList.add('fade-exit');
        overlay.classList.add('fade-exit-active');
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('fade-exit', 'fade-exit-active');
        }, duration);
    }
    
    // =================== LOADING SCREEN ===================
    
    showLoadingScreen() {
        Logger.ui('Showing loading screen');
        this.showOverlay(this.loadingOverlay);
    }
    
    hideLoadingScreen() {
        Logger.ui('Hiding loading screen');
        this.hideOverlay(this.loadingOverlay);
    }
    
    // =================== PAUSE MENU ===================
    
    showPauseMenu() {
        Logger.ui('Showing pause menu');
        this.currentScreen = 'pause';
        
        // Get current run statistics
        const currentStats = this.getCurrentRunStats();
        
        // Always recreate pause menu with fresh stats
        this.pauseOverlay.innerHTML = `
            <div class="character-selection">
                <div class="container has-text-centered">
                    <h1 class="title is-1 has-text-white mb-6">
                        <i class="fas fa-pause mr-3"></i>GAME PAUSED
                    </h1>
                    
                    <div class="box has-background-dark has-text-white mb-6" style="color: white !important;">
                        <h2 class="title is-4 has-text-white mb-4">Current Run</h2>
                        <div class="columns is-mobile">
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-user has-text-primary"></i><br>
                                    <strong>${currentStats.character}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-trophy has-text-warning"></i><br>
                                    <strong>Level ${currentStats.level}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-clock has-text-info"></i><br>
                                    <strong>${currentStats.time}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-crosshairs has-text-danger"></i><br>
                                    <strong>${currentStats.kills} Kills</strong>
                                </p>
                            </div>
                        </div>
                        
                        <div class="columns is-mobile mt-4">
                            <div class="column">
                                <p class="is-size-7" style="color: white !important;">
                                    <i class="fas fa-heart has-text-danger"></i>
                                    <strong>${currentStats.health}/${currentStats.maxHealth} HP</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-7" style="color: white !important;">
                                    <i class="fas fa-star has-text-warning"></i>
                                    <strong>${currentStats.xp}/${currentStats.xpToNext} XP</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="buttons is-centered">
                        <button class="button is-primary is-large" id="resume-btn">
                            <i class="fas fa-play mr-2"></i>Resume Game
                        </button>
                        <button class="button is-warning is-large" id="restart-same-btn">
                            <i class="fas fa-redo mr-2"></i>Restart Run
                        </button>
                        <button class="button is-light is-large" id="change-character-btn">
                            <i class="fas fa-user-edit mr-2"></i>Change Character
                        </button>
                    </div>
                    
                    <p class="has-text-white mt-6">
                        <i class="fas fa-mouse-pointer mr-2"></i>Click anywhere or press ESC to resume
                        <br>
                        <i class="fas fa-gamepad mr-2"></i>Gamepad: A to resume, Start to resume
                    </p>
                </div>
            </div>
        `;
        
        // Setup pause menu handlers
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.scene.uiSystem.resumeGame();
        });
        
        document.getElementById('restart-same-btn').addEventListener('click', () => {
            // Restart with the same character - reload the current game
            this.scene.uiSystem.restartGame();
        });
        
        document.getElementById('change-character-btn').addEventListener('click', () => {
            // Go back to character selection
            this.returnToCharacterSelection();
        });
        
        // Add click-to-resume functionality to the entire overlay
        this.pauseClickHandler = (event) => {
            // Only resume if clicking on the background (not on buttons)
            if (event.target === this.pauseOverlay || event.target.classList.contains('character-selection')) {
                this.scene.uiSystem.resumeGame();
            }
        };
        this.pauseOverlay.addEventListener('click', this.pauseClickHandler);
        
        // Initialize pause menu selection for gamepad
        this.selectedPauseOption = 0; // 0 = Resume, 1 = Restart, 2 = Change Character
        this.updatePauseMenuSelection();
        
        this.showOverlay(this.pauseOverlay);
    }
    
    getCurrentRunStats() {
        // Get current game statistics for the pause menu
        const stats = this.scene.statsSystem ? this.scene.statsSystem.getPlayerStats() : {};
        const progression = this.scene.statsSystem ? this.scene.statsSystem.getPlayerProgression() : {};
        const selectedCharacter = this.scene.characterSystem ? this.scene.characterSystem.getSelectedCharacter() : {};
        const elapsedTime = this.scene.uiSystem ? this.scene.uiSystem.getElapsedTimeString() : '0:00';
        const kills = this.scene.uiSystem ? this.scene.uiSystem.enemyKillCount : 0;
        
        return {
            character: selectedCharacter.name || 'Unknown',
            level: progression.level || 1,
            time: elapsedTime,
            kills: kills,
            health: Math.round(stats.health || 0),
            maxHealth: stats.maxHealth || 100,
            xp: progression.xp || 0,
            xpToNext: progression.xpToNextLevel || 100
        };
    }
    
    returnToCharacterSelection() {
        // Hide pause menu first
        this.hideOverlay(this.pauseOverlay);
        
        // Reset game state completely
        this.scene.gameStarted = false;
        this.scene.isPaused = false;
        
        // Clear all game objects
        this.scene.children.removeAll();
        
        // Clear all groups if they exist
        if (this.scene.enemies) this.scene.enemies.clear(true, true);
        if (this.scene.xpOrbs) this.scene.xpOrbs.clear(true, true);
        if (this.scene.auraEffects) this.scene.auraEffects.clear(true, true);
        if (this.scene.enemyProjectiles) this.scene.enemyProjectiles.clear(true, true);
        
        // Reset camera
        this.scene.cameras.main.stopFollow();
        this.scene.cameras.main.setScroll(0, 0);
        
        // Clean up systems
        if (this.scene.characterSystem) {
            this.scene.characterSystem.cleanup();
        }
        if (this.scene.enemySystem) {
            this.scene.enemySystem.cleanup();
        }
        if (this.scene.statusEffectSystem) {
            this.scene.statusEffectSystem.cleanup();
        }
        
        // Stop background music
        if (this.scene.audioManager) {
            this.scene.audioManager.onGamePause();
        }
        
        // Show character selection
        this.showCharacterSelection();
    }
    
    updatePauseMenuSelection() {
        // Update visual selection for pause menu buttons
        const buttons = ['resume-btn', 'restart-same-btn', 'change-character-btn'];
        
        buttons.forEach((buttonId, index) => {
            const button = document.getElementById(buttonId);
            if (button) {
                if (index === this.selectedPauseOption) {
                    button.classList.add('is-focused');
                    button.style.transform = 'scale(1.05)';
                    button.style.boxShadow = '0 0 0 3px rgba(50, 115, 220, 0.5)';
                } else {
                    button.classList.remove('is-focused');
                    button.style.transform = '';
                    button.style.boxShadow = '';
                }
            }
        });
    }
    
    selectPauseMenuOption() {
        // Execute the selected pause menu option
        switch(this.selectedPauseOption) {
            case 0: // Resume
                this.scene.uiSystem.resumeGame();
                break;
            case 1: // Restart
                this.scene.uiSystem.restartGame();
                break;
            case 2: // Change Character
                this.returnToCharacterSelection();
                break;
        }
    }
    
    hidePauseMenu() {
        Logger.ui('Hiding pause menu');
        this.currentScreen = 'game';
        this.hideOverlay(this.pauseOverlay);
        
        // Clean up any event listeners
        this.pauseOverlay.removeEventListener('click', this.pauseClickHandler);
    }
    
    // =================== GAME OVER SCREEN ===================
    
    showGameOverScreen(stats = {}) {
        Logger.ui('Showing game over screen');
        this.currentScreen = 'game-over';
        const gameOverHTML = `
            <div class="character-selection">
                <div class="container has-text-centered">
                    <h1 class="title is-1 has-text-danger mb-6">
                        <i class="fas fa-skull mr-3"></i>GAME OVER
                    </h1>
                    
                    <div class="box has-background-dark has-text-white mb-6" style="color: white !important;">
                        <h2 class="title is-4 has-text-white mb-4">Final Stats</h2>
                        <div class="columns is-mobile">
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-trophy has-text-warning"></i><br>
                                    <strong>Level ${stats.level || 1}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-clock has-text-info"></i><br>
                                    <strong>${stats.time || '0:00'}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6" style="color: white !important;">
                                    <i class="fas fa-crosshairs has-text-danger"></i><br>
                                    <strong>${stats.kills || 0} Kills</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="buttons is-centered">
                        <button class="button is-primary is-large" id="restart-game-btn">
                            <i class="fas fa-redo mr-2"></i>Play Again
                        </button>
                        <button class="button is-light is-large" id="change-character-btn">
                            <i class="fas fa-user-edit mr-2"></i>Change Character
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.gameOverOverlay.innerHTML = gameOverHTML;
        
        // Setup game over handlers
        document.getElementById('restart-game-btn').addEventListener('click', () => {
            this.scene.uiSystem.restartGame();
        });
        
        document.getElementById('change-character-btn').addEventListener('click', () => {
            this.hideOverlay(this.gameOverOverlay);
            this.showCharacterSelection();
        });
        
        this.showOverlay(this.gameOverOverlay);
    }
    
    hideGameOverScreen() {
        Logger.ui('Hiding game over screen');
        this.currentScreen = 'character-selection';
        this.hideOverlay(this.gameOverOverlay);
    }
    
    // =================== GAMEPAD SUPPORT ===================
    
    handleGamepadInput() {
        // Add basic debugging to see if this method is called
        Logger.debug(Logger.Categories.INPUT, 'handleGamepadInput called');
        
        // Safety check for InputManager with spam prevention
        if (!this.inputManager) {
            if (!this.inputManagerWarningShown) {
                Logger.warn(Logger.Categories.INPUT, 'InputManager not available for gamepad input');
                this.inputManagerWarningShown = true;
            }
            return;
        }
        
        Logger.debug(Logger.Categories.INPUT, 'InputManager available');
        
        if (Date.now() - this.lastInputTime < 200) {
            Logger.debug(Logger.Categories.INPUT, 'Input debounced');
            return; // Debounce
        }

        const gamepadState = this.inputManager.getGamepadState();
        Logger.debug(Logger.Categories.INPUT, `Gamepad state: connected=${gamepadState.connected}, buttons=${gamepadState.buttons?.length}`);
        
        if (!gamepadState.connected) {
            Logger.debug(Logger.Categories.INPUT, 'Gamepad not connected');
            return;
        }

        // DEBUG: Show all button states that are pressed
        const pressedButtons = [];
        gamepadState.buttons.forEach((pressed, index) => {
            if (pressed) pressedButtons.push(index);
        });
        if (pressedButtons.length > 0) {
            Logger.debug(Logger.Categories.INPUT, `Buttons pressed: [${pressedButtons.join(', ')}] on screen: ${this.currentScreen}`);
        }

        // A or B button
        if (gamepadState.buttons[0] || gamepadState.buttons[1]) { 
            this.lastInputTime = Date.now();
            
            Logger.info(Logger.Categories.INPUT, `A/B pressed on screen: ${this.currentScreen}`);
            
            if (this.currentScreen === 'character-selection') {
                Logger.info(Logger.Categories.UI, `Selecting character at index ${this.selectedCharacterIndex}: ${this.charactersArray[this.selectedCharacterIndex]?.name}`);
                this.selectCharacter();
            } else if (this.currentScreen === 'upgrade-selection') {
                Logger.info(Logger.Categories.UI, `Selecting upgrade at index ${this.selectedUpgradeIndex}: ${this.currentUpgrades[this.selectedUpgradeIndex]?.name}`);
                this.selectUpgrade();
            } else if (this.currentScreen === 'pause') {
                Logger.info(Logger.Categories.UI, `Selecting pause menu option ${this.selectedPauseOption}`);
                this.selectPauseMenuOption();
            } else if (this.currentScreen === 'game-over') {
                this.returnToMenu();
            }
        }
        
        // X button for reroll (upgrade screen only)
        if (gamepadState.buttons[2] && this.currentScreen === 'upgrade-selection') { 
            this.lastInputTime = Date.now();
            Logger.info(Logger.Categories.INPUT, `X pressed - rerolling upgrade at index ${this.selectedUpgradeIndex}`);
            this.rerollUpgrade(this.selectedUpgradeIndex);
        }

        // Start/Menu button for pause/unpause
        if (gamepadState.buttons[9]) { // Start button
            this.lastInputTime = Date.now();
            
            if (this.currentScreen === 'game') {
                this.pauseGame();
            } else if (this.currentScreen === 'pause') {
                this.resumeGame();
            }
            Logger.info(Logger.Categories.INPUT, 'Start button pressed');
        }

        // D-pad navigation for character selection
        if (this.currentScreen === 'character-selection') {
            Logger.debug(Logger.Categories.INPUT, `Checking D-pad navigation on character-selection screen`);
            let moved = false;
            
            if (gamepadState.buttons[14]) { // D-pad left
                const oldIndex = this.selectedCharacterIndex;
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                moved = (oldIndex !== this.selectedCharacterIndex);
                Logger.info(Logger.Categories.INPUT, `D-pad LEFT pressed, index: ${oldIndex} -> ${this.selectedCharacterIndex}`);
            } else if (gamepadState.buttons[15]) { // D-pad right
                const oldIndex = this.selectedCharacterIndex;
                this.selectedCharacterIndex = Math.min(this.charactersArray.length - 1, this.selectedCharacterIndex + 1);
                moved = (oldIndex !== this.selectedCharacterIndex);
                Logger.info(Logger.Categories.INPUT, `D-pad RIGHT pressed, index: ${oldIndex} -> ${this.selectedCharacterIndex}`);
            }
            
            if (moved) {
                this.lastInputTime = Date.now();
                Logger.info(Logger.Categories.INPUT, `Character selection moved to index ${this.selectedCharacterIndex} (${this.charactersArray[this.selectedCharacterIndex]?.name})`);
                this.updateCharacterSelection();
            }
        }
        
        // D-pad navigation for upgrade selection
        if (this.currentScreen === 'upgrade-selection') {
            Logger.debug(Logger.Categories.INPUT, `Checking D-pad navigation on upgrade-selection screen`);
            let moved = false;
            
            if (gamepadState.buttons[14]) { // D-pad left
                const oldIndex = this.selectedUpgradeIndex;
                this.selectedUpgradeIndex = Math.max(0, this.selectedUpgradeIndex - 1);
                moved = (oldIndex !== this.selectedUpgradeIndex);
                Logger.info(Logger.Categories.INPUT, `D-pad LEFT pressed, upgrade index: ${oldIndex} -> ${this.selectedUpgradeIndex}`);
            } else if (gamepadState.buttons[15]) { // D-pad right
                const oldIndex = this.selectedUpgradeIndex;
                this.selectedUpgradeIndex = Math.min(this.currentUpgrades.length - 1, this.selectedUpgradeIndex + 1);
                moved = (oldIndex !== this.selectedUpgradeIndex);
                Logger.info(Logger.Categories.INPUT, `D-pad RIGHT pressed, upgrade index: ${oldIndex} -> ${this.selectedUpgradeIndex}`);
            }
            
            if (moved) {
                this.lastInputTime = Date.now();
                Logger.info(Logger.Categories.INPUT, `Upgrade selection moved to index ${this.selectedUpgradeIndex} (${this.currentUpgrades[this.selectedUpgradeIndex]?.name})`);
                this.updateUpgradeSelection();
            }
        }
        
        // D-pad navigation for pause menu
        if (this.currentScreen === 'pause') {
            Logger.debug(Logger.Categories.INPUT, `Checking D-pad navigation on pause screen`);
            let moved = false;
            
            if (gamepadState.buttons[14] || gamepadState.buttons[12]) { // D-pad left or up
                const oldIndex = this.selectedPauseOption;
                this.selectedPauseOption = Math.max(0, this.selectedPauseOption - 1);
                moved = (oldIndex !== this.selectedPauseOption);
                Logger.info(Logger.Categories.INPUT, `D-pad LEFT/UP pressed, pause option: ${oldIndex} -> ${this.selectedPauseOption}`);
            } else if (gamepadState.buttons[15] || gamepadState.buttons[13]) { // D-pad right or down
                const oldIndex = this.selectedPauseOption;
                this.selectedPauseOption = Math.min(2, this.selectedPauseOption + 1); // 0=Resume, 1=Restart, 2=Change Character
                moved = (oldIndex !== this.selectedPauseOption);
                Logger.info(Logger.Categories.INPUT, `D-pad RIGHT/DOWN pressed, pause option: ${oldIndex} -> ${this.selectedPauseOption}`);
            }
            
            if (moved) {
                this.lastInputTime = Date.now();
                const optionNames = ['Resume Game', 'Restart Run', 'Change Character'];
                Logger.info(Logger.Categories.INPUT, `Pause menu selection moved to: ${optionNames[this.selectedPauseOption]}`);
                this.updatePauseMenuSelection();
            }
        }
    }
    
    // Add methods for pause/resume that are called by gamepad input
    pauseGame() {
        Logger.ui('Pausing game via HTMLUIManager');
        if (this.scene.uiSystem && typeof this.scene.uiSystem.pauseGame === 'function') {
            this.scene.uiSystem.pauseGame();
        }
    }
    
    resumeGame() {
        Logger.ui('Resuming game via HTMLUIManager');
        if (this.scene.uiSystem && typeof this.scene.uiSystem.resumeGame === 'function') {
            this.scene.uiSystem.resumeGame();
        }
    }
    
    returnToMenu() {
        Logger.ui('Returning to menu via HTMLUIManager');
        this.showCharacterSelection();
        // Reset game state if needed
        if (this.scene.uiSystem && typeof this.scene.uiSystem.restartGame === 'function') {
            this.scene.uiSystem.restartGame();
        }
    }
    
    // =================== CLEANUP ===================
    
    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
        
        // Hide all overlays
        this.hideOverlay(this.characterSelectionOverlay, 0);
        this.hideOverlay(this.gameHudOverlay, 0);
        this.hideOverlay(this.pauseOverlay, 0);
        this.hideOverlay(this.gameOverOverlay, 0);
        this.hideOverlay(this.upgradeOverlay, 0);
    }
}

export default HTMLUIManager; 