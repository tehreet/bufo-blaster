// Character System - Now uses plugin-based character architecture
import Logger from '../utils/Logger.js';
import CharacterRegistry from '../characters/CharacterRegistry.js';

class CharacterSystem {
    constructor(scene) {
        this.scene = scene;
        this.selectedCharacterInstance = null;
        this.selectedCharacterData = null;
        this.characterSelected = false;
        this.selectedCharacterIndex = 0;
        this.collisionHandlers = new Map(); // Dynamic collision handler registry
    }

    // Get all available characters from registry
    getCharacters() {
        return CharacterRegistry.getAllCharacters();
    }

    // Get the selected character data (for UI compatibility)
    getSelectedCharacter() {
        return this.selectedCharacterData;
    }

    // Get the selected character instance (for new system)
    getSelectedCharacterInstance() {
        return this.selectedCharacterInstance;
    }

    // Set the selected character and create its instance
    setSelectedCharacter(character) {
        // Clean up previous character if any
        if (this.selectedCharacterInstance) {
            this.selectedCharacterInstance.cleanup();
        }

        // Store character data for UI compatibility
        this.selectedCharacterData = character;
        this.characterSelected = true;

        // Create the character instance using the registry
        try {
            this.selectedCharacterInstance = CharacterRegistry.createCharacter(this.scene, character.id);
            Logger.system(`Character instance created: ${character.name}`);
        } catch (error) {
            Logger.error('Failed to create character instance:', error);
            throw error;
        }
    }

    isCharacterSelected() {
        return this.characterSelected;
    }

    // Setup character abilities using the new system
    setupCharacterAbilities() {
        if (!this.selectedCharacterInstance) {
            Logger.error('No character instance available for ability setup');
            return;
        }

        try {
            // Setup the character's abilities
            this.selectedCharacterInstance.setupAbility();
            
            // Register collision handlers
            this.registerCollisionHandlers();
            
            Logger.system(`Character abilities setup completed: ${this.selectedCharacterData.name}`);
        } catch (error) {
            Logger.error('Failed to setup character abilities:', error);
        }
    }

    // Register collision handlers dynamically
    registerCollisionHandlers() {
        if (!this.selectedCharacterInstance) return;

        // Clear existing handlers
        this.collisionHandlers.clear();

        // Get collision handlers from the character
        const handlers = this.selectedCharacterInstance.getCollisionHandlers();
        
        for (const handler of handlers) {
            this.collisionHandlers.set(handler.projectileLabel, handler.handler);
        }

        Logger.system(`Registered ${handlers.length} collision handlers`);
    }

    // Update character abilities using the new system
    updateCharacterAbilities() {
        if (!this.selectedCharacterInstance) {
            return;
        }

        try {
            this.selectedCharacterInstance.updateAbility();
        } catch (error) {
            Logger.error('Error updating character abilities:', error);
        }
    }

    // Handle collisions dynamically
    handleProjectileCollision(projectileLabel, projectile, enemy) {
        // Enhanced safety checks with detailed logging
        if (!projectileLabel) {
            Logger.warn(Logger.Categories.SYSTEM, 'Invalid collision: projectileLabel is undefined');
            return;
        }
        
        if (!projectile) {
            Logger.warn(Logger.Categories.SYSTEM, `Invalid collision: projectile is undefined for label ${projectileLabel}`);
            return;
        }
        
        if (!enemy) {
            Logger.warn(Logger.Categories.SYSTEM, `Invalid collision: enemy is undefined for label ${projectileLabel}`);
            return;
        }
        
        // Check if objects are still active
        if (!projectile.active || !enemy.active || !projectile.scene || !enemy.scene) {
            return;
        }
        
        const handler = this.collisionHandlers.get(projectileLabel);
        if (handler) {
            try {
                handler(projectile, enemy);
            } catch (error) {
                Logger.error(Logger.Categories.SYSTEM, `Error in collision handler for ${projectileLabel}:`, error);
            }
        }
    }

    // Get character-specific upgrades
    getCharacterUpgrades() {
        if (!this.selectedCharacterInstance) {
            return [];
        }

        try {
            return this.selectedCharacterInstance.getUpgrades();
        } catch (error) {
            Logger.error('Failed to get character upgrades:', error);
            return [];
        }
    }

    // Cleanup method
    cleanup() {
        if (this.selectedCharacterInstance) {
            this.selectedCharacterInstance.cleanup();
            this.selectedCharacterInstance = null;
        }
        
        this.selectedCharacterData = null;
        this.characterSelected = false;
        this.collisionHandlers.clear();
        
        Logger.system('Character system cleaned up');
    }

    // ========================================
    // LEGACY METHODS FOR BACKWARDS COMPATIBILITY
    // These methods are kept to maintain compatibility with existing code
    // that may still call them directly. They delegate to the character instance.
    // ========================================

    // Legacy method - delegates to character instance
    starfallHitEnemy(starfall, enemy) {
        if (this.selectedCharacterInstance && this.selectedCharacterData.id === 'wizard') {
            try {
                this.selectedCharacterInstance.starfallHitEnemy(starfall, enemy);
            } catch (error) {
                Logger.error('Legacy starfall hit enemy error:', error);
            }
        }
    }

    // Legacy method - delegates to character instance  
    boomerangHitEnemy(boomerang, enemy) {
        if (this.selectedCharacterInstance && this.selectedCharacterData.id === 'bat') {
            try {
                this.selectedCharacterInstance.boomerangHitEnemy(boomerang, enemy);
            } catch (error) {
                Logger.error('Legacy boomerang hit enemy error:', error);
            }
        }
    }

    // Legacy method - no longer needed but kept for compatibility
    setupShieldBash() {
        // This is now handled automatically in setupCharacterAbilities()
        Logger.warn('setupShieldBash() is deprecated - abilities are now auto-setup');
    }

    // Legacy method - no longer needed but kept for compatibility
    setupWizardStarfall() {
        // This is now handled automatically in setupCharacterAbilities()
        Logger.warn('setupWizardStarfall() is deprecated - abilities are now auto-setup');
    }

    // Legacy method - no longer needed but kept for compatibility
    setupBatBoomerang() {
        // This is now handled automatically in setupCharacterAbilities()
        Logger.warn('setupBatBoomerang() is deprecated - abilities are now auto-setup');
    }

    // Legacy method - for any code that still references scene groups directly
    updateBatBoomerang() {
        // This is now handled in updateCharacterAbilities()
        Logger.warn('updateBatBoomerang() is deprecated - use updateCharacterAbilities()');
    }

    // Legacy method - for any code that still references scene groups directly
    updateBoomerangs() {
        // This is now handled in updateCharacterAbilities()
        Logger.warn('updateBoomerangs() is deprecated - use updateCharacterAbilities()');
    }

    // Legacy method - for any code that still references scene groups directly
    updateStunnedEnemies() {
        // This is now handled in updateCharacterAbilities()
        Logger.warn('updateStunnedEnemies() is deprecated - use updateCharacterAbilities()');
    }

    // Legacy method - for any code that still references scene groups directly
    updateWizardStarfall() {
        // This is now handled in updateCharacterAbilities()
        Logger.warn('updateWizardStarfall() is deprecated - use updateCharacterAbilities()');
    }

    // Legacy method - for any code that still references scene groups directly
    updateStarfallProjectiles() {
        // This is now handled in updateCharacterAbilities()
        Logger.warn('updateStarfallProjectiles() is deprecated - use updateCharacterAbilities()');
    }

    // Legacy method - for any code that still references scene groups directly
    throwBoomerang() {
        // This is now handled automatically by character instances
        Logger.warn('throwBoomerang() is deprecated - boomerangs are auto-managed');
    }

    // Legacy method - for any code that still references scene groups directly
    applyShieldBash() {
        // This is now handled automatically by character instances
        Logger.warn('applyShieldBash() is deprecated - shield bash is auto-managed');
    }

    // Legacy method - for any code that still references scene groups directly
    createStarfallProjectile() {
        // This is now handled automatically by character instances
        Logger.warn('createStarfallProjectile() is deprecated - starfall is auto-managed');
    }

    // Legacy method - for any code that still references scene groups directly
    applyStarfallAOE() {
        // This is now handled automatically by character instances
        Logger.warn('applyStarfallAOE() is deprecated - starfall AOE is auto-managed');
    }
}

export default CharacterSystem; 