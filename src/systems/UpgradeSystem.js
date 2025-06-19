// Upgrade System - Handles upgrade selection, UI, and upgrade application

class UpgradeSystem {
    constructor(scene) {
        this.scene = scene;
        this.isPaused = false;
        this.upgradeActive = false;
        this.currentUpgrades = [];
        this.upgradeUIElements = [];
        this.rerollCount = 1; // Start with 1 reroll per level up, like original
        this.maxRerolls = 1;
    }

    showUpgradeSelection() {
        this.upgradeActive = true;
        this.isPaused = true;
        this.scene.isPaused = true;
        this.scene.matter.world.enabled = false; // Pause physics
        
        // Reset reroll count for each level up
        this.rerollCount = this.maxRerolls;
        
        // Hide stats debug UI during upgrade selection
        if (this.scene.showStatsDebug && this.scene.statsDebugUI) {
            this.scene.debugUtils.hideStatsDebugUI();
        }
        
        this.generateUpgradeChoices();
        this.createUpgradeUI();
    }

    generateUpgradeChoices() {
        const availableUpgrades = this.getAvailableUpgrades();
        
        // Generate 3 random upgrade choices
        this.currentUpgrades = [];
        for (let i = 0; i < 3; i++) {
            const upgrade = this.getUniqueRandomUpgrade(availableUpgrades);
            if (upgrade) {
                this.currentUpgrades.push(upgrade);
            }
        }
        
        console.log('Generated upgrade choices:', this.currentUpgrades);
    }

    getAvailableUpgrades() {
        // Generic upgrades available to all characters
        const genericUpgrades = [
            // Health upgrades
            { id: 'health1', name: '+20 Health', description: 'Increases maximum health by 20 points', type: 'generic', 
              effect: () => this.scene.statsSystem.addStatBonus('healthBonus', 20) },
            { id: 'health2', name: '+30 Health', description: 'Increases maximum health by 30 points', type: 'generic', 
              effect: () => this.scene.statsSystem.addStatBonus('healthBonus', 30) },
            { id: 'armor1', name: '+1 Armor', description: 'Reduces incoming damage by 1', type: 'generic', 
              effect: () => this.scene.statsSystem.addStatBonus('armorBonus', 1) },
            { id: 'armor2', name: '+2 Armor', description: 'Reduces incoming damage by 2', type: 'generic', 
              effect: () => this.scene.statsSystem.addStatBonus('armorBonus', 2) },
            { id: 'regen1', name: '+0.5 Health Regen', description: 'Regenerates 0.5 health per second', type: 'generic', 
              effect: () => this.scene.statsSystem.addStatBonus('healthRegenBonus', 0.5) },
            { id: 'regen2', name: '+1 Health Regen', description: 'Regenerates 1 health per second', type: 'generic', 
              effect: () => this.scene.statsSystem.addStatBonus('healthRegenBonus', 1) },
            
            // Movement upgrades
            { id: 'speed1', name: '+20% Move Speed', description: 'Increases movement speed by 20%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('moveSpeedMultiplier', 1.2) },
            { id: 'speed2', name: '+30% Move Speed', description: 'Increases movement speed by 30%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('moveSpeedMultiplier', 1.3) },
            
            // Ability upgrades
            { id: 'damage1', name: '+30% Ability Damage', description: 'Increases ability damage by 30%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.3) },
            { id: 'damage2', name: '+50% Ability Damage', description: 'Increases ability damage by 50%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.5) },
            { id: 'cooldown1', name: '-20% Ability Cooldown', description: 'Reduces ability cooldown by 20%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.8) },
            { id: 'cooldown2', name: '-30% Ability Cooldown', description: 'Reduces ability cooldown by 30%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.7) },
            { id: 'radius1', name: '+25% Ability Radius', description: 'Increases ability area of effect by 25%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.25) },
            { id: 'radius2', name: '+40% Ability Radius', description: 'Increases ability area of effect by 40%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.4) },
            
            // Utility upgrades
            { id: 'pickup1', name: '+30% Pickup Range', description: 'Increases XP magnetism range by 30%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('pickupRangeMultiplier', 1.3) },
            { id: 'pickup2', name: '+50% Pickup Range', description: 'Increases XP magnetism range by 50%', type: 'generic', 
              effect: () => this.scene.statsSystem.multiplyStats('pickupRangeMultiplier', 1.5) }
        ];
        
        // Character-specific upgrades
        const characterUpgrades = this.getCharacterSpecificUpgrades();
        
        return [...genericUpgrades, ...characterUpgrades];
    }

    getCharacterSpecificUpgrades() {
        const character = this.scene.characterSystem.getSelectedCharacter();
        if (!character) return [];
        
        switch(character.id) {
            case 'shield':
                return [
                    { id: 'shield_bash_power', name: 'Shield Slam', description: 'Shield bash damage increased by 100%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 2.0) },
                    { id: 'shield_bash_speed', name: 'Rapid Bash', description: 'Shield bash triggers 40% faster', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6) },
                    { id: 'shield_bash_range', name: 'Shield Sweep', description: 'Shield bash range increased by 50%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) },
                    { id: 'shield_fortress', name: 'Fortress Form', description: '+60 Health and +3 Armor', type: 'character', 
                      effect: () => { 
                          this.scene.statsSystem.addStatBonus('healthBonus', 60);
                          this.scene.statsSystem.addStatBonus('armorBonus', 3);
                      }},
                    { id: 'shield_regeneration', name: 'Shield Blessing', description: 'Health regeneration doubled', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('healthRegenMultiplier', 2.0) }
                ];
                
            case 'wizard':
                return [
                    { id: 'wizard_more_stars', name: 'Meteor Shower', description: '+3 stars per cast', type: 'character', 
                      effect: () => this.scene.statsSystem.addStatBonus('projectileCountBonus', 3) },
                    { id: 'wizard_star_power', name: 'Stellar Power', description: 'Star damage increased by 75%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.75) },
                    { id: 'wizard_star_size', name: 'Greater Impact', description: 'Star explosion radius increased by 50%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) },

                    { id: 'wizard_rapid_cast', name: 'Arcane Haste', description: 'Starfall cooldown reduced by 40%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6) }
                ];
                
            case 'bat':
                return [
                    { id: 'bat_power', name: 'Sharpened Boomerang', description: 'Boomerang damage increased by 100%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 2.0) },
                    { id: 'bat_speed', name: 'Quick Throw', description: 'Boomerang cooldown reduced by 40%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.6) },
                    { id: 'bat_range', name: 'Aerodynamic Design', description: 'Boomerang range increased by 50%', type: 'character', 
                      effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.5) },
                    { id: 'bat_stun', name: 'Stunning Impact', description: 'Stun duration increased to 2 seconds', type: 'character', 
                      effect: () => {
                          // This would extend stun duration in the boomerang system
                          console.log('Stunning Impact upgrade applied - stun duration doubled');
                      }},
                    { id: 'bat_agility', name: 'Bat Agility', description: '+30% move speed and +25 health', type: 'character', 
                      effect: () => {
                          this.scene.statsSystem.multiplyStats('moveSpeedMultiplier', 1.3);
                          this.scene.statsSystem.addStatBonus('healthBonus', 25);
                      }}
                ];
                
            default:
                return [];
        }
    }

    getUniqueRandomUpgrade(availableUpgrades) {
        // Filter out upgrades that are already in current selection
        const unusedUpgrades = availableUpgrades.filter(upgrade => 
            !this.currentUpgrades.some(selected => selected.id === upgrade.id)
        );
        
        if (unusedUpgrades.length === 0) {
            return null; // No more unique upgrades available
        }
        
        return Phaser.Utils.Array.GetRandom(unusedUpgrades);
    }

    createUpgradeUI() {
        // Clear any existing UI
        this.upgradeUIElements.forEach(element => element.destroy());
        this.upgradeUIElements = [];
        
        // Semi-transparent overlay that covers the entire screen
        const overlay = this.scene.add.rectangle(0, 0, this.scene.cameras.main.width * 2, this.scene.cameras.main.height * 2, 0x000000, 0.8);
        overlay.setOrigin(0, 0);
        overlay.setScrollFactor(0).setDepth(1000);
        overlay.setPosition(-this.scene.cameras.main.width/2, -this.scene.cameras.main.height/2);
        this.upgradeUIElements.push(overlay);
        
        // Title
        const title = this.scene.add.text(700, 150, 'LEVEL UP!', {
            fontSize: '48px',
            color: '#ffff00',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
        this.upgradeUIElements.push(title);
        
        const subtitle = this.scene.add.text(700, 200, 'Choose an Upgrade', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
        this.upgradeUIElements.push(subtitle);
        
        // Create 3 upgrade cards side by side horizontally
        const cardWidth = 320;
        const cardHeight = 200;
        const spacing = 40;
        const totalWidth = (cardWidth * this.currentUpgrades.length) + (spacing * (this.currentUpgrades.length - 1));
        const startX = (1400 - totalWidth) / 2; // Center horizontally
        const cardY = 400; // Fixed vertical position
        
        for (let i = 0; i < this.currentUpgrades.length; i++) {
            this.createSingleUpgradeCard(i, this.currentUpgrades[i], startX, cardY, cardWidth, cardHeight, spacing);
        }
        
        // Controls text
        const controls = this.scene.add.text(700, 620, 'Click upgrade to select • Click "Reroll" button to reroll that upgrade\nGamepad: A to select • X to reroll • Left/Right to navigate', {
            fontSize: '14px',
            color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
        this.upgradeUIElements.push(controls);
        
        // Initialize gamepad selection
        this.scene.gamepadState.selectedUpgradeIndex = 0;
        this.updateUpgradeHighlight();
    }

    createSingleUpgradeCard(upgradeIndex, upgrade, startX, cardY, cardWidth, cardHeight, spacing) {
        const cardX = startX + upgradeIndex * (cardWidth + spacing) + cardWidth/2; // Position horizontally
        
        // Card background
        const card = this.scene.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0x333333);
        card.setStrokeStyle(3, upgrade.type === 'character' ? 0xffa500 : 0x666666);
        card.setScrollFactor(0).setDepth(1001);
        card.setInteractive();
        card.upgradeIndex = upgradeIndex;
        
        // Click handler for selection
        card.on('pointerdown', () => {
            // Set flag to prevent pause immediately after upgrade selection
            this.scene.inputManager.setUpgradeCardClicked();
            this.selectUpgrade(upgrade);
        });
        
        // Hover effects
        card.on('pointerover', () => {
            card.setStrokeStyle(4, 0xffffff);
        });
        
        card.on('pointerout', () => {
            card.setStrokeStyle(3, upgrade.type === 'character' ? 0xffa500 : 0x666666);
        });
        
        this.upgradeUIElements.push(card);
        
        // Upgrade name (centered at top of card)
        const name = this.scene.add.text(cardX, cardY - 60, upgrade.name, {
            fontSize: '18px',
            color: upgrade.type === 'character' ? '#ffa500' : '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1002);
        this.upgradeUIElements.push(name);
        
        // Upgrade description (centered in middle of card)
        const description = this.scene.add.text(cardX, cardY - 10, upgrade.description, {
            fontSize: '12px',
            color: '#cccccc',
            wordWrap: { width: cardWidth - 20 },
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1002);
        this.upgradeUIElements.push(description);
        
        // Type indicator (top right of card)
        const typeText = upgrade.type === 'character' ? 'CHARACTER' : 'GENERIC';
        const type = this.scene.add.text(cardX + cardWidth/2 - 10, cardY - 80, typeText, {
            fontSize: '10px',
            color: upgrade.type === 'character' ? '#ffa500' : '#888888',
            fontWeight: 'bold'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(1002);
        this.upgradeUIElements.push(type);
        
        // Reroll button inside the card at the bottom
        const rerollButton = this.scene.add.rectangle(cardX, cardY + 60, 100, 30, 0x555555);
        rerollButton.setStrokeStyle(2, 0x888888);
        rerollButton.setScrollFactor(0).setDepth(1002);
        rerollButton.setInteractive();
        this.upgradeUIElements.push(rerollButton);
        
        const rerollText = this.scene.add.text(cardX, cardY + 60, `Reroll (${this.rerollCount})`, {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1003);
        this.upgradeUIElements.push(rerollText);
        
        // Reroll button functionality
        rerollButton.on('pointerdown', () => {
            // Set flag to prevent pause immediately after reroll
            this.scene.inputManager.setUpgradeCardClicked();
            this.rerollSingleUpgrade(upgradeIndex);
        });
        
        rerollButton.on('pointerover', () => {
            rerollButton.setFillStyle(0x777777);
        });
        
        rerollButton.on('pointerout', () => {
            rerollButton.setFillStyle(0x555555);
        });
    }

    selectUpgrade(upgrade) {
        console.log(`Selected upgrade: ${upgrade.name}`);
        
        // Apply the upgrade effect
        upgrade.effect();
        this.scene.statsSystem.refreshPlayerStats();
        
        // Setup character abilities again (in case projectile count changed, etc.)
        this.scene.characterSystem.setupCharacterAbilities();
        
        this.closeUpgradeUI();
    }

    rerollSingleUpgrade(upgradeIndex) {
        if (this.rerollCount <= 0) {
            console.log('No rerolls remaining');
            return;
        }
        
        this.rerollCount--;
        
        // Get a new upgrade to replace the one at this index
        const availableUpgrades = this.getAvailableUpgrades();
        const newUpgrade = this.getUniqueRandomUpgrade(availableUpgrades);
        
        if (newUpgrade) {
            this.currentUpgrades[upgradeIndex] = newUpgrade;
            // Recreate the entire UI since layout is complex
            this.createUpgradeUI();
        }
    }

    rerollAllUpgrades() {
        if (this.rerollCount <= 0) {
            console.log('No rerolls remaining');
            return;
        }
        
        this.rerollCount--;
        
        // Generate completely new upgrade choices
        this.generateUpgradeChoices();
        this.createUpgradeUI();
    }



    closeUpgradeUI() {
        // Clear upgrade UI
        this.upgradeUIElements.forEach(element => element.destroy());
        this.upgradeUIElements = [];
        
        // Clear upgrade selection state
        this.upgradeActive = false;
        
        // Resume game
        this.isPaused = false;
        this.scene.isPaused = false; // Also clear the scene's pause state
        this.scene.gameStarted = true; // Ensure game is marked as started
        this.scene.matter.world.enabled = true; // Resume physics
        
        // Clear any gamepad upgrade state
        if (this.scene.gamepadState) {
            this.scene.gamepadState.selectedUpgradeIndex = 0;
        }
        
        // Restore stats debug UI if it was shown before
        if (this.scene.showStatsDebug && !this.scene.statsDebugUI) {
            // Small delay to prevent immediate pause from debug key
            this.scene.time.delayedCall(500, () => {
                this.scene.debugUtils.createStatsDebugUI();
            });
        }
        
        console.log('Upgrade UI closed, game resumed');
    }

    updateUpgradeHighlight() {
        // Update gamepad selection highlight for upgrade cards
        if (!this.scene.gamepadState.connected || this.upgradeUIElements.length === 0) return;
        
        const upgradeCards = this.upgradeUIElements.filter(element => 
            element.upgradeIndex !== undefined
        );
        
        // Reset all card highlights
        upgradeCards.forEach((card, index) => {
            const upgrade = this.currentUpgrades[card.upgradeIndex];
            if (upgrade) {
                if (index === this.scene.gamepadState.selectedUpgradeIndex) {
                    card.setStrokeStyle(4, 0xffffff); // Highlight selected
                } else {
                    card.setStrokeStyle(3, upgrade.type === 'character' ? 0xffa500 : 0x666666); // Normal
                }
            }
        });
    }

    handleGamepadUpgradeInput() {
        if (!this.scene.gamepadState.connected || !this.upgradeActive) return;
        
        const pad = this.scene.gamepadState.pad;
        const justPressed = this.scene.inputManager.getJustPressedFunction();
        
        // Navigate upgrades horizontally
        if (justPressed(14) || (pad.leftStick.x < -this.scene.gamepadState.deadzone && justPressed('leftStick'))) { // Left
            this.scene.gamepadState.selectedUpgradeIndex = Math.max(0, this.scene.gamepadState.selectedUpgradeIndex - 1);
            this.updateUpgradeHighlight();
        }
        if (justPressed(15) || (pad.leftStick.x > this.scene.gamepadState.deadzone && justPressed('leftStick'))) { // Right
            this.scene.gamepadState.selectedUpgradeIndex = Math.min(this.currentUpgrades.length - 1, this.scene.gamepadState.selectedUpgradeIndex + 1);
            this.updateUpgradeHighlight();
        }
        
        // Select upgrade
        if (justPressed(0)) { // A button
            const selectedUpgrade = this.currentUpgrades[this.scene.gamepadState.selectedUpgradeIndex];
            if (selectedUpgrade) {
                this.selectUpgrade(selectedUpgrade);
            }
        }
        
        // Reroll single upgrade
        if (justPressed(2)) { // X button
            this.rerollSingleUpgrade(this.scene.gamepadState.selectedUpgradeIndex);
        }
    }
}

export default UpgradeSystem; 