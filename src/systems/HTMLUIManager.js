// HTML UI Manager - Handles modern HTML/CSS overlays with Bulma styling
// Replaces Phaser-based UI with responsive, accessible HTML interfaces

import Logger from '../utils/Logger.js';

class HTMLUIManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedCharacterIndex = 0;
        this.charactersArray = [];
        
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
        Logger.warn(Logger.Categories.UI, `Updating character selection to index ${this.selectedCharacterIndex} of ${this.charactersArray.length} characters`);
        
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
        
        Logger.warn(Logger.Categories.UI, `Character card ${this.selectedCharacterIndex} highlighted successfully`);
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
        
        Logger.warn(Logger.Categories.UI, `Character selected: ${selectedCharacter.name}`);
        
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
        // Create pause menu HTML if it doesn't exist
        if (!this.pauseOverlay.innerHTML.trim()) {
            this.pauseOverlay.innerHTML = `
                <div class="character-selection">
                    <div class="container has-text-centered">
                        <h1 class="title is-1 has-text-white mb-6">
                            <i class="fas fa-pause mr-3"></i>GAME PAUSED
                        </h1>
                        
                        <div class="buttons is-centered">
                            <button class="button is-primary is-large" id="resume-btn">
                                <i class="fas fa-play mr-2"></i>Resume
                            </button>
                            <button class="button is-light is-large" id="restart-btn">
                                <i class="fas fa-redo mr-2"></i>Restart
                            </button>
                        </div>
                        
                        <p class="has-text-light mt-6">
                            <i class="fas fa-keyboard mr-2"></i>Press ESC to resume
                        </p>
                    </div>
                </div>
            `;
            
            // Setup pause menu handlers
            document.getElementById('resume-btn').addEventListener('click', () => {
                this.scene.uiSystem.resumeGame();
            });
            
            document.getElementById('restart-btn').addEventListener('click', () => {
                this.scene.uiSystem.restartGame();
            });
        }
        
        this.showOverlay(this.pauseOverlay);
    }
    
    hidePauseMenu() {
        Logger.ui('Hiding pause menu');
        this.currentScreen = 'game';
        this.hideOverlay(this.pauseOverlay);
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
                    
                    <div class="box has-background-dark has-text-light mb-6">
                        <h2 class="title is-4 has-text-light mb-4">Final Stats</h2>
                        <div class="columns is-mobile">
                            <div class="column">
                                <p class="is-size-6">
                                    <i class="fas fa-trophy has-text-warning"></i><br>
                                    <strong>Level ${stats.level || 1}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6">
                                    <i class="fas fa-clock has-text-info"></i><br>
                                    <strong>${stats.time || '0:00'}</strong>
                                </p>
                            </div>
                            <div class="column">
                                <p class="is-size-6">
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
        Logger.warn(Logger.Categories.INPUT, 'handleGamepadInput called');
        
        // Safety check for InputManager with spam prevention
        if (!this.inputManager) {
            if (!this.inputManagerWarningShown) {
                Logger.warn(Logger.Categories.INPUT, 'InputManager not available for gamepad input');
                this.inputManagerWarningShown = true;
            }
            return;
        }
        
        Logger.warn(Logger.Categories.INPUT, 'InputManager available');
        
        if (Date.now() - this.lastInputTime < 200) {
            Logger.warn(Logger.Categories.INPUT, 'Input debounced');
            return; // Debounce
        }

        const gamepadState = this.inputManager.getGamepadState();
        Logger.warn(Logger.Categories.INPUT, `Gamepad state: connected=${gamepadState.connected}, buttons=${gamepadState.buttons?.length}`);
        
        if (!gamepadState.connected) {
            Logger.warn(Logger.Categories.INPUT, 'Gamepad not connected');
            return;
        }

        // DEBUG: Show all button states that are pressed
        const pressedButtons = [];
        gamepadState.buttons.forEach((pressed, index) => {
            if (pressed) pressedButtons.push(index);
        });
        if (pressedButtons.length > 0) {
            Logger.warn(Logger.Categories.INPUT, `Buttons pressed: [${pressedButtons.join(', ')}] on screen: ${this.currentScreen}`);
        }

        // A or B button
        if (gamepadState.buttons[0] || gamepadState.buttons[1]) { 
            this.lastInputTime = Date.now();
            
            Logger.warn(Logger.Categories.INPUT, `A/B pressed on screen: ${this.currentScreen}`);
            
            if (this.currentScreen === 'character-selection') {
                Logger.warn(Logger.Categories.UI, `Selecting character at index ${this.selectedCharacterIndex}: ${this.charactersArray[this.selectedCharacterIndex]?.name}`);
                this.selectCharacter();
            } else if (this.currentScreen === 'pause') {
                this.resumeGame();
            } else if (this.currentScreen === 'game-over') {
                this.returnToMenu();
            }
        }

        // Start/Menu button for pause/unpause
        if (gamepadState.buttons[9]) { // Start button
            this.lastInputTime = Date.now();
            
            if (this.currentScreen === 'game') {
                this.pauseGame();
            } else if (this.currentScreen === 'pause') {
                this.resumeGame();
            }
            Logger.warn(Logger.Categories.INPUT, 'Start button pressed');
        }

        // D-pad navigation for character selection
        if (this.currentScreen === 'character-selection') {
            Logger.warn(Logger.Categories.INPUT, `Checking D-pad navigation on character-selection screen`);
            let moved = false;
            
            if (gamepadState.buttons[14]) { // D-pad left
                const oldIndex = this.selectedCharacterIndex;
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                moved = (oldIndex !== this.selectedCharacterIndex);
                Logger.warn(Logger.Categories.INPUT, `D-pad LEFT pressed, index: ${oldIndex} -> ${this.selectedCharacterIndex}`);
            } else if (gamepadState.buttons[15]) { // D-pad right
                const oldIndex = this.selectedCharacterIndex;
                this.selectedCharacterIndex = Math.min(this.charactersArray.length - 1, this.selectedCharacterIndex + 1);
                moved = (oldIndex !== this.selectedCharacterIndex);
                Logger.warn(Logger.Categories.INPUT, `D-pad RIGHT pressed, index: ${oldIndex} -> ${this.selectedCharacterIndex}`);
            }
            
            if (moved) {
                this.lastInputTime = Date.now();
                Logger.warn(Logger.Categories.INPUT, `Character selection moved to index ${this.selectedCharacterIndex} (${this.charactersArray[this.selectedCharacterIndex]?.name})`);
                this.updateCharacterSelection();
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
    }
}

export default HTMLUIManager; 