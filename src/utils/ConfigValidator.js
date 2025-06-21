// Configuration Validator - Validates character and enemy configurations
// Prevents runtime errors by catching configuration issues early

import Logger from './Logger.js';

class ConfigValidator {
    // Validate character configuration
    static validateCharacterConfig(characterData) {
        const errors = [];
        
        if (!characterData) {
            errors.push('Character data is null or undefined');
            return errors;
        }
        
        // Required fields
        const requiredFields = ['id', 'name', 'description', 'sprite', 'baseStats'];
        for (const field of requiredFields) {
            if (!characterData[field] && characterData[field] !== 0) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate baseStats
        if (characterData.baseStats) {
            const requiredStats = ['health', 'moveSpeed', 'abilityDamage', 'abilityCooldown'];
            for (const stat of requiredStats) {
                if (typeof characterData.baseStats[stat] !== 'number' || characterData.baseStats[stat] < 0) {
                    errors.push(`Invalid ${stat}: must be a positive number`);
                }
            }
            
            // Health should be > 0
            if (characterData.baseStats.health <= 0) {
                errors.push('Health must be greater than 0');
            }
            
            // Move speed should be reasonable
            if (characterData.baseStats.moveSpeed <= 0 || characterData.baseStats.moveSpeed > 20) {
                errors.push('Move speed should be between 0 and 20');
            }
        }
        
        // Validate sprite reference
        if (characterData.sprite && typeof characterData.sprite !== 'string') {
            errors.push('Sprite must be a string reference');
        }
        
        // Validate color if present
        if (characterData.color !== undefined && (typeof characterData.color !== 'number' || characterData.color < 0 || characterData.color > 0xFFFFFF)) {
            errors.push('Color must be a valid hexadecimal number (0x000000 to 0xFFFFFF)');
        }
        
        return errors;
    }
    
    // Validate enemy configuration
    static validateEnemyConfig(enemyData) {
        const errors = [];
        
        if (!enemyData) {
            errors.push('Enemy data is null or undefined');
            return errors;
        }
        
        // Required fields
        const requiredFields = ['id', 'name', 'sprite', 'baseStats'];
        for (const field of requiredFields) {
            if (!enemyData[field] && enemyData[field] !== 0) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate baseStats
        if (enemyData.baseStats) {
            const requiredStats = ['health', 'speed', 'xpValue'];
            for (const stat of requiredStats) {
                if (typeof enemyData.baseStats[stat] !== 'number' || enemyData.baseStats[stat] < 0) {
                    errors.push(`Invalid ${stat}: must be a positive number`);
                }
            }
            
            // Health should be > 0
            if (enemyData.baseStats.health <= 0) {
                errors.push('Health must be greater than 0');
            }
            
            // XP value should be reasonable
            if (enemyData.baseStats.xpValue <= 0 || enemyData.baseStats.xpValue > 1000) {
                errors.push('XP value should be between 1 and 1000');
            }
        }
        
        return errors;
    }
    
    // Validate asset configuration
    static validateAssetConfig(assetConfig) {
        const errors = [];
        
        if (!assetConfig) {
            errors.push('Asset config is null or undefined');
            return errors;
        }
        
        // Check for required asset categories
        const requiredCategories = ['characters', 'enemies', 'audio'];
        for (const category of requiredCategories) {
            if (!assetConfig[category]) {
                errors.push(`Missing asset category: ${category}`);
            }
        }
        
        // Validate character assets
        if (assetConfig.characters) {
            for (const [id, asset] of Object.entries(assetConfig.characters)) {
                if (!asset.png) {
                    errors.push(`Character ${id} missing PNG asset`);
                }
                if (!asset.displaySize || typeof asset.displaySize !== 'number' || asset.displaySize <= 0) {
                    errors.push(`Character ${id} missing or invalid displaySize`);
                }
            }
        }
        
        // Validate enemy assets
        if (assetConfig.enemies) {
            for (const [id, asset] of Object.entries(assetConfig.enemies)) {
                if (!asset.png) {
                    errors.push(`Enemy ${id} missing PNG asset`);
                }
                if (!asset.displaySize || typeof asset.displaySize !== 'number' || asset.displaySize <= 0) {
                    errors.push(`Enemy ${id} missing or invalid displaySize`);
                }
            }
        }
        
        return errors;
    }
    
    // Validate all configurations and log any issues
    static validateAllConfigurations(characterRegistry, enemyRegistry, assetConfig) {
        let totalErrors = 0;
        
        // Validate characters
        if (characterRegistry && characterRegistry.getAllCharacters) {
            const characters = characterRegistry.getAllCharacters();
            for (const [key, character] of Object.entries(characters)) {
                const errors = this.validateCharacterConfig(character);
                if (errors.length > 0) {
                    Logger.error(Logger.Categories.SYSTEM, `Character validation errors for ${key}:`, errors);
                    totalErrors += errors.length;
                }
            }
        }
        
        // Validate enemies
        if (enemyRegistry && enemyRegistry.getAllEnemies) {
            const enemies = enemyRegistry.getAllEnemies();
            for (const [key, enemy] of Object.entries(enemies)) {
                const errors = this.validateEnemyConfig(enemy);
                if (errors.length > 0) {
                    Logger.error(Logger.Categories.SYSTEM, `Enemy validation errors for ${key}:`, errors);
                    totalErrors += errors.length;
                }
            }
        }
        
        // Validate asset configuration
        if (assetConfig) {
            const errors = this.validateAssetConfig(assetConfig);
            if (errors.length > 0) {
                Logger.error(Logger.Categories.ASSET, 'Asset configuration validation errors:', errors);
                totalErrors += errors.length;
            }
        }
        
        if (totalErrors === 0) {
            Logger.system('All configurations validated successfully');
        } else {
            Logger.warn(Logger.Categories.SYSTEM, `Found ${totalErrors} configuration validation errors`);
        }
        
        return totalErrors === 0;
    }
    
    // Validate upgrade configuration
    static validateUpgradeConfig(upgrade) {
        const errors = [];
        
        if (!upgrade) {
            errors.push('Upgrade is null or undefined');
            return errors;
        }
        
        // Required fields
        const requiredFields = ['id', 'name', 'description', 'type', 'effect'];
        for (const field of requiredFields) {
            if (!upgrade[field] && upgrade[field] !== 0) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate type
        const validTypes = ['generic', 'character'];
        if (upgrade.type && !validTypes.includes(upgrade.type)) {
            errors.push(`Invalid type: ${upgrade.type}. Must be one of: ${validTypes.join(', ')}`);
        }
        
        // Validate effect is a function
        if (upgrade.effect && typeof upgrade.effect !== 'function') {
            errors.push('Effect must be a function');
        }
        
        return errors;
    }
}

export default ConfigValidator; 