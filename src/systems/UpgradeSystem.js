// Upgrade System - Handles upgrade selection, UI, and upgrade application

import Logger from '../utils/Logger.js';

class UpgradeSystem {
    constructor(scene) {
        this.scene = scene;
        this.isPaused = false;
        this.upgradeActive = false;
        this.currentUpgrades = [];
        this.upgradeUIElements = [];
        this.rerollsUsed = []; // Track which cards have been rerolled (per-card system)
    }

    showUpgradeSelection() {
        this.upgradeActive = true;
        this.isPaused = true;
        this.scene.isPaused = true;
        this.scene.matter.world.enabled = false; // Pause physics
        
        // Reset reroll tracking for each level up (each card can be rerolled once)
        this.rerollsUsed = [false, false, false]; // 3 cards, none rerolled yet
        
        // Hide stats debug UI during upgrade selection
        if (this.scene.showStatsDebug && this.scene.statsDebugUI) {
            this.scene.debugUtils.hideStatsDebugUI();
        }
        
        this.generateUpgradeChoices();
        
        // Use HTML UI instead of Phaser UI
        this.scene.uiSystem.htmlUI.showUpgradeSelection(this.currentUpgrades, this.rerollsUsed);
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
        
        // Generated upgrade choices for selection
    }

    getAvailableUpgrades() {
        // Generic upgrades available to all characters - only keeping the better version of each stat
        const genericUpgrades = [
            // Health upgrades (only one version per stat type)
            { id: 'health', name: '+30 Health', description: 'Increases maximum health by 30 points', type: 'generic', statType: 'health',
              effect: () => this.scene.statsSystem.addStatBonus('healthBonus', 30) },
            { id: 'armor', name: '+2 Armor', description: 'Reduces incoming damage by 2', type: 'generic', statType: 'armor',
              effect: () => this.scene.statsSystem.addStatBonus('armorBonus', 2) },
            { id: 'regen', name: '+1 Health Regen', description: 'Regenerates 1 health per second', type: 'generic', statType: 'regen',
              effect: () => this.scene.statsSystem.addStatBonus('healthRegenBonus', 1) },
            
            // Ability upgrades (reduced by 75%)
            { id: 'damage', name: '+12.5% Ability Damage', description: 'Increases ability damage by 12.5%', type: 'generic', statType: 'damage',
              effect: () => this.scene.statsSystem.multiplyStats('abilityDamageMultiplier', 1.125) },
            { id: 'cooldown', name: '-30% Ability Cooldown', description: 'Reduces ability cooldown by 30%', type: 'generic', statType: 'cooldown',
              effect: () => this.scene.statsSystem.multiplyStats('abilityCooldownMultiplier', 0.7) },
            { id: 'radius', name: '+40% Ability Radius', description: 'Increases ability area of effect by 40%', type: 'generic', statType: 'radius',
              effect: () => this.scene.statsSystem.multiplyStats('abilityRadiusMultiplier', 1.4) },
            
            // Utility upgrades
            { id: 'pickup', name: '+50% Pickup Range', description: 'Increases XP magnetism range by 50%', type: 'generic', statType: 'pickup',
              effect: () => this.scene.statsSystem.multiplyStats('pickupRangeMultiplier', 1.5) }
        ];
        
        // Character-specific upgrades
        const characterUpgrades = this.getCharacterSpecificUpgrades();
        
        return [...genericUpgrades, ...characterUpgrades];
    }

    getCharacterSpecificUpgrades() {
        // Use the new character system to get upgrades dynamically
        return this.scene.characterSystem.getCharacterUpgrades();
    }

    getUniqueRandomUpgrade(availableUpgrades) {
        // Get the stat types already selected to prevent duplicates
        const selectedStatTypes = this.currentUpgrades.map(upgrade => upgrade.statType || 'unknown');
        
        // Filter out upgrades that conflict with already selected ones
        const unusedUpgrades = availableUpgrades.filter(upgrade => {
            // Always allow 'unique' stat types (they don't conflict with anything)
            if (upgrade.statType === 'unique') {
                // But still prevent exact ID duplicates
                return !this.currentUpgrades.some(selected => selected.id === upgrade.id);
            }
            
            // For non-unique upgrades, prevent both ID and stat type duplicates
            const idConflict = this.currentUpgrades.some(selected => selected.id === upgrade.id);
            const statTypeConflict = selectedStatTypes.includes(upgrade.statType);
            
            return !idConflict && !statTypeConflict;
        });
        
        if (unusedUpgrades.length === 0) {
            return null; // No more unique upgrades available
        }
        
        return Phaser.Utils.Array.GetRandom(unusedUpgrades);
    }

    // Legacy Phaser UI methods - no longer used, replaced by HTML UI
    // Keeping these methods for backward compatibility but they do nothing
    createUpgradeUI() {
        // This method is no longer used - HTML UI is used instead
        Logger.debug(Logger.Categories.SYSTEM, 'createUpgradeUI called but no longer used (HTML UI is used instead)');
    }

    createSingleUpgradeCard() {
        // This method is no longer used - HTML UI is used instead
        Logger.debug(Logger.Categories.SYSTEM, 'createSingleUpgradeCard called but no longer used (HTML UI is used instead)');
    }

    // Method called by HTMLUIManager when an upgrade is selected
    selectUpgradeFromHTML(upgrade) {
        // Validate upgrade before applying
        if (!upgrade) {
            Logger.error(Logger.Categories.SYSTEM, 'Cannot select upgrade: upgrade is null or undefined');
            return;
        }
        
        if (!upgrade.effect || typeof upgrade.effect !== 'function') {
            Logger.error(Logger.Categories.SYSTEM, `Cannot select upgrade "${upgrade.name}": effect is not a function`);
            return;
        }
        
        try {
            // Apply the upgrade effect with error handling
            upgrade.effect();
            Logger.upgrade(`Applied upgrade: ${upgrade.name}`);
            
            // Refresh player stats to ensure they're properly updated
            if (this.scene.statsSystem && typeof this.scene.statsSystem.refreshPlayerStats === 'function') {
                this.scene.statsSystem.refreshPlayerStats();
            } else {
                Logger.warn(Logger.Categories.SYSTEM, 'Stats system not available for refresh after upgrade');
            }
            
            // Setup character abilities again (in case projectile count changed, etc.)
            if (this.scene.characterSystem && typeof this.scene.characterSystem.setupCharacterAbilities === 'function') {
                this.scene.characterSystem.setupCharacterAbilities();
            } else {
                Logger.warn(Logger.Categories.SYSTEM, 'Character system not available for ability setup after upgrade');
            }
            
        } catch (error) {
            Logger.error(Logger.Categories.SYSTEM, `Failed to apply upgrade "${upgrade.name}":`, error);
            
            // Try to continue the game even if the upgrade failed
            Logger.warn(Logger.Categories.SYSTEM, 'Continuing game despite upgrade failure');
        }
        
        // Always close the upgrade UI, even if the upgrade failed
        this.closeUpgradeUI();
    }
    
    // Legacy method for backward compatibility
    selectUpgrade(upgrade) {
        this.selectUpgradeFromHTML(upgrade);
    }

    // Method called by HTMLUIManager when a reroll is requested
    rerollUpgradeFromHTML(upgradeIndex) {
        if (this.rerollsUsed[upgradeIndex]) {
            Logger.warn(Logger.Categories.SYSTEM, `Card ${upgradeIndex} already rerolled`);
            return;
        }
        
        // Mark this card as rerolled
        this.rerollsUsed[upgradeIndex] = true;
        
        // Get a new upgrade to replace the one at this index
        const availableUpgrades = this.getAvailableUpgrades();
        const newUpgrade = this.getUniqueRandomUpgrade(availableUpgrades);
        
        if (newUpgrade) {
            this.currentUpgrades[upgradeIndex] = newUpgrade;
            // Update only the specific card instead of recreating the whole screen
            this.scene.uiSystem.htmlUI.updateSingleUpgradeCard(upgradeIndex, newUpgrade, this.rerollsUsed);
        }
    }
    
    // Legacy method for backward compatibility  
    rerollSingleUpgrade(upgradeIndex) {
        this.rerollUpgradeFromHTML(upgradeIndex);
    }

    rerollAllUpgrades() {
        // This method is deprecated with per-card reroll system
        Logger.debug(Logger.Categories.SYSTEM, 'rerollAllUpgrades called but deprecated with per-card reroll system');
    }

    closeUpgradeUI() {
        // Hide HTML upgrade UI
        this.scene.uiSystem.htmlUI.hideUpgradeSelection();
        
        // Clear any legacy Phaser UI elements (for backward compatibility)
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
        
        Logger.info(Logger.Categories.SYSTEM, 'Upgrade UI closed, game resumed');
    }

    // Legacy gamepad methods - no longer used, replaced by HTML UI gamepad handling
    updateUpgradeHighlight() {
        // This method is no longer used - HTML UI handles highlighting
        Logger.debug(Logger.Categories.SYSTEM, 'updateUpgradeHighlight called but no longer used (HTML UI handles highlighting)');
    }

    handleGamepadUpgradeInput() {
        // This method is no longer used - HTML UI handles gamepad input
        // (Removed debug log to prevent console spam)
    }
}

export default UpgradeSystem; 