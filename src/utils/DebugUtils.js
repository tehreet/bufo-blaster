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
        
        // Background panel
        const panel = this.scene.add.rectangle(150, 250, 280, 450, 0x000000, 0.8);
        panel.setStrokeStyle(2, 0x00ff00);
        panel.setScrollFactor(0).setDepth(2000);
        
        // Title
        const title = this.scene.add.text(150, 50, 'STATS DEBUG', {
            fontSize: '16px',
            color: '#00ff00',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2001);
        
        // Stats container
        const statsContainer = this.scene.add.container(150, 250);
        statsContainer.setScrollFactor(0).setDepth(2001);
        
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
            wordWrap: { width: 260 }
        };
        
        const headerStyle = {
            fontSize: '11px',
            color: '#ffff00',
            fontWeight: 'bold'
        };
        
        let yOffset = -200;
        const lineHeight = 12;
        
        // Helper function to add text
        const addText = (text, style = textStyle) => {
            const textObj = this.scene.add.text(0, yOffset, text, style);
            textObj.setOrigin(0, 0.5);
            this.statsDebugUI.container.add(textObj);
            this.statsDebugUI.elements.push(textObj);
            yOffset += lineHeight;
        };
        
        // Progression
        addText('=== PROGRESSION ===', headerStyle);
        addText(`Level: ${progression.level}`);
        addText(`XP: ${progression.xp}/${progression.xpToNextLevel}`);
        addText(`Character: ${progression.character.name}`);
        yOffset += 5;
        
        // Core Stats
        addText('=== CORE STATS ===', headerStyle);
        addText(`Health: ${Math.round(playerStats.health)}/${playerStats.maxHealth}`);
        addText(`Armor: ${playerStats.armor}`);
        addText(`Health Regen: ${playerStats.healthRegen.toFixed(1)}/sec`);
        addText(`Move Speed: ${playerStats.moveSpeed.toFixed(1)}`);
        yOffset += 5;
        
        // Ability Stats
        addText('=== ABILITIES ===', headerStyle);
        addText(`Damage: ${playerStats.abilityDamage.toFixed(2)}`);
        addText(`Cooldown: ${Math.round(playerStats.abilityCooldown)}ms`);
        addText(`Radius: ${Math.round(playerStats.abilityRadius)}`);
        addText(`Projectiles: ${playerStats.projectileCount}`);
        addText(`Pickup Range: ${Math.round(playerStats.pickupRange)}`);
        yOffset += 5;
        
        // Multipliers
        addText('=== MULTIPLIERS ===', headerStyle);
        addText(`Damage: ${modifiers.abilityDamageMultiplier.toFixed(2)}x`);
        addText(`Cooldown: ${modifiers.abilityCooldownMultiplier.toFixed(2)}x`);
        addText(`Move Speed: ${modifiers.moveSpeedMultiplier.toFixed(2)}x`);
        addText(`Radius: ${modifiers.abilityRadiusMultiplier.toFixed(2)}x`);
        addText(`Pickup: ${modifiers.pickupRangeMultiplier.toFixed(2)}x`);
        addText(`Pickup: +${modifiers.pickupRangeBonus}`);
        
        // Bonuses
        addText('=== BONUSES ===', headerStyle);
        addText(`Health: +${modifiers.healthBonus}`);
        addText(`Armor: +${modifiers.armorBonus}`);
        addText(`Regen: +${modifiers.healthRegenBonus.toFixed(1)}`);
        addText(`Damage: +${modifiers.abilityDamageBonus.toFixed(1)}`);
        addText(`Radius: +${modifiers.abilityRadiusBonus}`);
        addText(`Pickup: +${modifiers.pickupRangeBonus}`);
        
        // Status indicators
        if (progression.invincible) {
            yOffset += 5;
            addText('=== STATUS ===', headerStyle);
            addText('INVINCIBLE', { fontSize: '10px', color: '#ff0000', fontWeight: 'bold' });
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
    }
}

export default DebugUtils; 