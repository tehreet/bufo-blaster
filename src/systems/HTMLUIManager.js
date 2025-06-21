// HTML UI Manager - Handles modern HTML/CSS overlays with Bulma styling
// Replaces Phaser-based UI with responsive, accessible HTML interfaces

class HTMLUIManager {
    constructor(scene) {
        this.scene = scene;
        this.selectedCharacterIndex = 0;
        this.charactersArray = [];
        
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
        const characterCards = document.querySelectorAll('.character-card');
        
        characterCards.forEach((card, index) => {
            if (index === this.selectedCharacterIndex) {
                card.classList.add('selected');
                // Scroll into view if using keyboard navigation
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.classList.remove('selected');
            }
        });
    }
    
    handleKeyboardNavigation(event) {
        // Only handle keyboard navigation on character selection screen
        if (this.characterSelectionOverlay.style.display === 'none') return;
        
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
        
        // Add selection animation
        const selectedCard = document.querySelector(`[data-character-index="${this.selectedCharacterIndex}"]`);
        if (selectedCard) {
            selectedCard.style.transform = 'scale(1.05)';
            selectedCard.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                selectedCard.style.transform = '';
            }, 200);
        }
        
        // Set character in scene and start game
        this.scene.characterSystem.setSelectedCharacter(selectedCharacter);
        
        // Hide character selection with fade out
        setTimeout(() => {
            this.hideOverlay(this.characterSelectionOverlay);
            this.scene.uiSystem.startGame();
        }, 300);
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
        this.showOverlay(this.loadingOverlay);
    }
    
    hideLoadingScreen() {
        this.hideOverlay(this.loadingOverlay);
    }
    
    // =================== PAUSE MENU ===================
    
    showPauseMenu() {
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
        this.hideOverlay(this.pauseOverlay);
    }
    
    // =================== GAME OVER SCREEN ===================
    
    showGameOverScreen(stats = {}) {
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
        this.hideOverlay(this.gameOverOverlay);
    }
    
    // =================== GAMEPAD SUPPORT ===================
    
    handleGamepadInput(gamepadState) {
        // Check cooldown to prevent rapid-fire inputs
        const currentTime = Date.now();
        if (currentTime < this.gamepadInputCooldown) return;
        
        let inputDetected = false;
        
        // Handle character selection screen
        if (this.characterSelectionOverlay.style.display !== 'none') {
            // Handle D-pad navigation
            if (gamepadState.left || gamepadState.up) {
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                this.updateCharacterSelection();
                inputDetected = true;
            } else if (gamepadState.right || gamepadState.down) {
                this.selectedCharacterIndex = Math.min(this.charactersArray.length - 1, this.selectedCharacterIndex + 1);
                this.updateCharacterSelection();
                inputDetected = true;
            }
            
            // Handle A button (select)
            if (gamepadState.a) {
                this.selectCharacter();
                inputDetected = true;
            }
        }
        
        // Handle pause screen
        else if (this.pauseOverlay.style.display !== 'none') {
            if (gamepadState.a || gamepadState.start) {
                this.scene.uiSystem.resumeGame();
                inputDetected = true;
            } else if (gamepadState.b) {
                this.scene.uiSystem.restartGame();
                inputDetected = true;
            }
        }
        
        // Handle game over screen
        else if (this.gameOverOverlay.style.display !== 'none') {
            if (gamepadState.a) {
                this.scene.uiSystem.restartGame();
                inputDetected = true;
            } else if (gamepadState.b) {
                this.hideOverlay(this.gameOverOverlay);
                this.showCharacterSelection();
                inputDetected = true;
            }
        }
        
        // Set cooldown if input was detected
        if (inputDetected) {
            this.gamepadInputCooldown = currentTime + this.gamepadInputDelay;
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