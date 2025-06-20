// Debug Utils - Handles debug visualization and debugging tools

class DebugUtils {
    constructor(scene) {
        this.scene = scene;
        this.showHitboxes = false;
        this.showStatsDebug = false;
        this.statsDebugUI = null;
        
        // Setup debug keys
        this.setupDebugKeys();
    }

    toggleHitboxDebug() {
        this.showHitboxes = !this.showHitboxes;
        console.log(`Hitbox debug: ${this.showHitboxes ? 'ON' : 'OFF'}`);
        
        // Update visibility of all hitbox debug elements
        this.updateHitboxVisibility();
    }

    updateHitboxVisibility() {
        // Update player hitbox
        if (this.scene.player && this.scene.player.hitboxDebug) {
            this.scene.player.hitboxDebug.setVisible(this.showHitboxes);
        }
        
        // Update enemy hitboxes
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy.hitboxDebug) {
                    enemy.hitboxDebug.setVisible(this.showHitboxes);
                }
            });
        }
        
        // Update orbiting geese hitboxes if they exist
        if (this.scene.orbitingGeese) {
            this.scene.orbitingGeese.children.entries.forEach(goose => {
                if (goose.hitboxDebug) {
                    goose.hitboxDebug.setVisible(this.showHitboxes);
                }
            });
        }
    }

    toggleStatsDebug() {
        this.showStatsDebug = !this.showStatsDebug;
        console.log(`Stats debug: ${this.showStatsDebug ? 'ON' : 'OFF'}`);
        
        if (this.showStatsDebug) {
            if (!this.statsDebugUI) {
                this.createStatsDebugUI();
            }
        } else {
            this.hideStatsDebugUI();
        }
    }

    createStatsDebugUI() {
        if (this.statsDebugUI || !this.scene.gameStarted || this.scene.upgradeSystem.isPaused) {
            return; // Don't create during upgrade screens or if already exists
        }
        
        // Position below the main stats panel (which is at 20,20 with size 200x140)
        const debugPanelX = 20;
        const debugPanelY = 180; // Start below main stats panel (20 + 140 + 20 margin)
        const debugPanelWidth = 200; // Same width as main stats panel
        const debugPanelHeight = 420; // Increased height to prevent cut-off at bottom
        
        // Background panel - positioned to align with main stats panel
        const panel = this.scene.add.rectangle(
            debugPanelX + debugPanelWidth/2, 
            debugPanelY + debugPanelHeight/2, 
            debugPanelWidth, 
            debugPanelHeight, 
            0x000000, 
            0.7
        );
        panel.setStrokeStyle(2, 0x666666); // Match main stats panel border
        panel.setScrollFactor(0).setDepth(1000);
        
        // Title - positioned at top of debug panel
        const title = this.scene.add.text(debugPanelX + debugPanelWidth/2, debugPanelY + 15, 'DEBUG (F2)', {
            fontSize: '12px',
            color: '#ffff00',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
        
        // Stats container - positioned relative to panel
        const statsContainer = this.scene.add.container(debugPanelX + 10, debugPanelY + 35);
        statsContainer.setScrollFactor(0).setDepth(1001);
        
        this.statsDebugUI = {
            panel: panel,
            title: title,
            container: statsContainer,
            elements: []
        };
        
        this.updateStatsDebugUI();
    }

    updateStatsDebugUI() {
        if (!this.statsDebugUI || !this.scene.gameStarted || this.scene.upgradeSystem.isPaused) {
            return;
        }
        
        // Clear existing text elements
        this.statsDebugUI.elements.forEach(element => element.destroy());
        this.statsDebugUI.elements = [];
        
        const statsSystem = this.scene.statsSystem;
        const characterSystem = this.scene.characterSystem;
        
        if (!statsSystem || !characterSystem) return;
        
        const playerStats = statsSystem.getPlayerStats();
        const progression = statsSystem.getPlayerProgression();
        const modifiers = statsSystem.getStatModifiers();
        
        if (!playerStats || !progression || !modifiers) return;
        
        const textStyle = {
            fontSize: '10px',
            color: '#ffffff',
            wordWrap: { width: 180 }
        };
        
        const headerStyle = {
            fontSize: '10px',
            color: '#ffff00',
            fontWeight: 'bold'
        };
        
        let yOffset = 0; // Start from top of container
        const lineHeight = 11;
        
        // Helper function to add text
        const addText = (text, style = textStyle) => {
            const textObj = this.scene.add.text(0, yOffset, text, style);
            textObj.setOrigin(0, 0.5);
            this.statsDebugUI.container.add(textObj);
            this.statsDebugUI.elements.push(textObj);
            yOffset += lineHeight;
        };
        
        // Character & Level
        addText('CHAR & LEVEL', headerStyle);
        addText(`${progression.character.name} L${progression.level}`);
        addText(`XP: ${progression.xp}/${progression.xpToNextLevel}`);
        yOffset += 3;
        
        // Core Stats
        addText('CORE STATS', headerStyle);
        addText(`HP: ${Math.round(playerStats.health)}/${playerStats.maxHealth}`);
        addText(`Armor: ${playerStats.armor}`);
        addText(`Regen: ${playerStats.healthRegen.toFixed(1)}/sec`);
        addText(`Speed: ${playerStats.moveSpeed.toFixed(1)}`);
        yOffset += 3;
        
        // Ability Stats
        addText('ABILITIES', headerStyle);
        addText(`Damage: ${playerStats.abilityDamage.toFixed(1)}`);
        addText(`Cooldown: ${Math.round(playerStats.abilityCooldown)}ms`);
        addText(`Radius: ${Math.round(playerStats.abilityRadius)}`);
        addText(`Count: ${playerStats.projectileCount}`);
        addText(`Pickup: ${Math.round(playerStats.pickupRange)}`);
        yOffset += 3;
        
        // Multipliers (compact format)
        addText('MULTIPLIERS', headerStyle);
        addText(`Dmg: ${modifiers.abilityDamageMultiplier.toFixed(2)}x`);
        addText(`CD: ${modifiers.abilityCooldownMultiplier.toFixed(2)}x`);
        addText(`Spd: ${modifiers.moveSpeedMultiplier.toFixed(2)}x`);
        addText(`Rad: ${modifiers.abilityRadiusMultiplier.toFixed(2)}x`);
        addText(`Pick: ${modifiers.pickupRangeMultiplier.toFixed(2)}x`);
        yOffset += 3;
        
        // Bonuses (compact format)
        addText('BONUSES', headerStyle);
        addText(`HP: +${modifiers.healthBonus}`);
        addText(`Arm: +${modifiers.armorBonus}`);
        addText(`Reg: +${modifiers.healthRegenBonus.toFixed(1)}`);
        addText(`Dmg: +${modifiers.abilityDamageBonus.toFixed(1)}`);
        addText(`Rad: +${modifiers.abilityRadiusBonus}`);
        addText(`Pick: +${modifiers.pickupRangeBonus}`);
        
        // Status indicators
        if (progression.invincible) {
            yOffset += 3;
            addText('STATUS', headerStyle);
            addText('INVINCIBLE', { fontSize: '10px', color: '#ff0000', fontWeight: 'bold' });
        }
        
        if (progression.isPoisoned) {
            if (!progression.invincible) {
                yOffset += 3;
                addText('STATUS', headerStyle);
            }
            addText('POISONED', { fontSize: '10px', color: '#00ff40', fontWeight: 'bold' });
        }
        
        if (progression.isBleeding) {
            if (!progression.invincible && !progression.isPoisoned) {
                yOffset += 3;
                addText('STATUS', headerStyle);
            }
            addText('BLEEDING', { fontSize: '10px', color: '#ff0000', fontWeight: 'bold' });
        }
    }

    hideStatsDebugUI() {
        if (this.statsDebugUI) {
            this.statsDebugUI.panel.destroy();
            this.statsDebugUI.title.destroy();
            this.statsDebugUI.container.destroy();
            this.statsDebugUI.elements.forEach(element => element.destroy());
            this.statsDebugUI = null;
        }
    }

    update() {
        // Handle debug key presses
        if (Phaser.Input.Keyboard.JustDown(this.hitboxDebugKey)) {
            this.toggleHitboxDebug();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.statsDebugKey)) {
            this.toggleStatsDebug();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.statusEffectTestKey)) {
            this.testStatusEffects();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.musicToggleKey)) {
            this.toggleMusic();
        }
        
        // Update debug UIs if they exist and all systems are initialized
        if (this.showStatsDebug && 
            this.statsDebugUI && 
            this.scene.gameStarted && 
            this.scene.upgradeSystem && 
            !this.scene.upgradeSystem.isPaused) {
            this.updateStatsDebugUI();
        }
    }

    testStatusEffects() {
        if (!this.scene.statusEffectSystem || !this.scene.player) {
            console.log('Status effect system not available or player not found');
            return;
        }
        
        console.log('Testing status effects...');
        
        // Add multiple status effects to demonstrate the system
        this.scene.statusEffectSystem.addStatusEffect('poison', 8000);
        this.scene.statusEffectSystem.addStatusEffect('stunned', 3000);
        this.scene.statusEffectSystem.addStatusEffect('slowed', 6000);
        
        // Show a notification
        const notification = this.scene.add.text(700, 100, 'Status Effects Test!\n(F3 pressed)', {
            fontSize: '16px',
            color: '#FFD700',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Auto-remove notification after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 500,
                onComplete: () => notification.destroy()
            });
        });
        
        console.log('Added poison (8s), stunned (3s), and slowed (6s) status effects');
    }

    toggleMusic() {
        if (!this.scene.audioManager) {
            console.log('Audio manager not available');
            return;
        }
        
        const isEnabled = this.scene.audioManager.toggleMusic();
        
        // Show a notification about music state
        const notification = this.scene.add.text(700, 150, `Music ${isEnabled ? 'ENABLED' : 'DISABLED'}\n(F4 pressed)`, {
            fontSize: '16px',
            color: isEnabled ? '#00FF00' : '#FF0000',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2000);
        
        // Auto-remove notification after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 500,
                onComplete: () => notification.destroy()
            });
        });
        
        console.log(`Music toggled: ${isEnabled ? 'ON' : 'OFF'}`);
    }

    // Create debug visualization for new game objects
    createHitboxDebug(gameObject, radius, color = 0xff0000) {
        if (!gameObject) return;
        
        const hitboxDebug = this.scene.add.circle(gameObject.x, gameObject.y, radius, color, 0.3);
        hitboxDebug.setStrokeStyle(2, color);
        hitboxDebug.setVisible(this.showHitboxes);
        
        return hitboxDebug;
    }

    // Update hitbox debug position
    updateHitboxDebug(gameObject) {
        if (gameObject && gameObject.hitboxDebug) {
            gameObject.hitboxDebug.x = gameObject.x;
            gameObject.hitboxDebug.y = gameObject.y;
            gameObject.hitboxDebug.setVisible(this.showHitboxes);
        }
    }

    // Cleanup debug elements
    destroyHitboxDebug(gameObject) {
        if (gameObject && gameObject.hitboxDebug) {
            gameObject.hitboxDebug.destroy();
            gameObject.hitboxDebug = null;
        }
    }

    getDebugInfo() {
        return {
            showHitboxes: this.showHitboxes,
            showStatsDebug: this.showStatsDebug,
            hasStatsUI: !!this.statsDebugUI
        };
    }

    setupDebugKeys() {
        // F1 - Toggle hitbox debug
        this.hitboxDebugKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
        
        // F2 - Toggle stats debug
        this.statsDebugKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        
        // F3 - Test status effects (for development)
        this.statusEffectTestKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
        
        // F4 - Toggle music
        this.musicToggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F4);
    }
}

export default DebugUtils; 