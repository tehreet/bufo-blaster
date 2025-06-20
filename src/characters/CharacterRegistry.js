// Character Registry - Central registry for all playable characters
// Maps character IDs to their class implementations and data

import ShieldBufo from './ShieldBufo.js';
import WizardBufo from './WizardBufo.js';
import BatBufo from './BatBufo.js';
import JuiceBufo from './JuiceBufo.js';

// Character definitions with comprehensive base stats
const CHARACTER_DATA = {
    SHIELD_BUFO: {
        id: 'shield',
        name: 'Shield Bufo',
        description: 'Defensive tank with shield bash attacks',
        abilityName: 'Shield Bash',
        abilityDescription: 'Pushes enemies left and right away, dealing damage',
        color: 0x4169E1, // Royal blue color for shield theme
        sprite: 'shield-bufo',
        baseStats: {
            // Core Stats
            health: 150, // Increased HP for tank role
            armor: 3, // Increased armor for defensive theme
            healthRegen: 1.0, // Increased health regen
            
            // Ability Stats
            abilityDamage: 1.2, // Base damage for shield bash
            abilityCooldown: 800, // Milliseconds between shield bash
            abilityRadius: 100, // Shield bash range
            
            // Utility Stats
            pickupRange: 80, // XP orb magnetism range
            projectileCount: 1, // Not used by Shield, but for consistency
            
            // Movement
            moveSpeed: 3.5 // Slightly slower due to heavy shield
        },
        // Physics
        hitboxRadius: 6 // Smaller hitbox to match actual sprite content
    },
    WIZARD_BUFO: {
        id: 'wizard',
        name: 'Magician Bufo',
        description: 'Ranged caster with area damage spells',
        abilityName: 'Starfall',
        abilityDescription: 'Casts stars that damage enemies in an area',
        color: 0x0066ff,
        sprite: 'bufo-magician',
        baseStats: {
            // Core Stats
            health: 100,
            armor: 0, // Glass cannon
            healthRegen: 0,
            
            // Ability Stats
            abilityDamage: 2, // Star damage (reduced from 3 to 2)
            abilityCooldown: 1500, // Milliseconds between starfall casts
            abilityRadius: 100, // AOE radius of star impact
            
            // Utility Stats
            pickupRange: 100, // Higher pickup range for ranged character
            projectileCount: 3, // Number of stars per cast (reduced from 5)
            
            // Movement
            moveSpeed: 5
        },
        // Physics
        hitboxRadius: 5 // Small hitbox to match actual sprite content
    },
    BAT_BUFO: {
        id: 'bat',
        name: 'Bat Bufo',
        description: 'Agile fighter with boomerang attacks',
        abilityName: 'Boomerang Toss',
        abilityDescription: 'Throws a boomerang that damages and stuns enemies',
        color: 0x8B4513, // Brown color for bat theme
        sprite: 'bat-bufo',
        baseStats: {
            // Core Stats (less tanky as requested)
            health: 90, // Lower than others
            armor: 0, // No armor for glass cannon feel
            healthRegen: 0, // No health regen
            
            // Ability Stats
            abilityDamage: 2.5, // Increased damage for boomerang
            abilityCooldown: 2500, // Milliseconds between boomerang throws
            abilityRadius: 200, // Increased boomerang travel distance
            
            // Utility Stats
            pickupRange: 100, // Good pickup range for agile character
            projectileCount: 1, // One boomerang
            
            // Movement (agile)
            moveSpeed: 5.5 // Fastest character to compensate for low tankiness
        },
        // Physics
        hitboxRadius: 4 // Very small hitbox for agile character
    },
    JUICE_BUFO: {
        id: 'juice',
        name: 'Juice Bufo',
        description: 'Area controller with slowing juice puddles',
        abilityName: 'Juice Barrage',
        abilityDescription: 'Throws juice boxes that create slowing puddles',
        color: 0xFF6B35, // Orange color to match juice theme
        sprite: 'juice-bufo',
        baseStats: {
            // Core Stats
            health: 120, // Moderate health
            armor: 1, // Light armor
            healthRegen: 0.5, // Some regeneration
            
            // Ability Stats
            abilityDamage: 1.8, // Moderate damage (puddles do additional DOT)
            abilityCooldown: 2000, // 2 seconds between juice throws
            abilityRadius: 60, // Puddle radius
            
            // Utility Stats
            pickupRange: 85, // Good pickup range
            projectileCount: 2, // Starts with 2 juice boxes
            
            // Movement
            moveSpeed: 4.2 // Moderate speed
        },
        // Physics
        hitboxRadius: 5 // Small hitbox to match actual sprite content
    }
};

// Map character IDs to their class implementations
const CHARACTER_CLASSES = {
    'shield': ShieldBufo,
    'wizard': WizardBufo,
    'bat': BatBufo,
    'juice': JuiceBufo
};

class CharacterRegistry {
    constructor() {
        this.characterData = CHARACTER_DATA;
        this.characterClasses = CHARACTER_CLASSES;
    }

    // Get all available character data
    getAllCharacters() {
        return this.characterData;
    }

    // Get character data by ID
    getCharacterData(characterId) {
        const characterKey = this.findCharacterKey(characterId);
        return characterKey ? this.characterData[characterKey] : null;
    }

    // Create a character instance by ID
    createCharacter(scene, characterId) {
        const characterData = this.getCharacterData(characterId);
        if (!characterData) {
            throw new Error(`Character with ID '${characterId}' not found`);
        }

        const CharacterClass = this.characterClasses[characterId];
        if (!CharacterClass) {
            throw new Error(`Character class for ID '${characterId}' not found`);
        }

        return new CharacterClass(scene, characterData);
    }

    // Check if a character exists
    hasCharacter(characterId) {
        return !!this.getCharacterData(characterId);
    }

    // Get list of all character IDs
    getCharacterIds() {
        return Object.values(this.characterData).map(char => char.id);
    }

    // Register a new character (for adding new characters)
    registerCharacter(characterKey, characterData, CharacterClass) {
        this.characterData[characterKey] = characterData;
        this.characterClasses[characterData.id] = CharacterClass;
    }

    // Helper method to find character key from ID
    findCharacterKey(characterId) {
        return Object.keys(this.characterData).find(key => 
            this.characterData[key].id === characterId
        );
    }

    // Get all collision handlers from all characters
    getAllCollisionHandlers(scene) {
        const handlers = [];
        
        for (const characterId of this.getCharacterIds()) {
            try {
                // Create temporary character instance to get collision handlers
                const tempCharacter = this.createCharacter(scene, characterId);
                const characterHandlers = tempCharacter.getCollisionHandlers();
                handlers.push(...characterHandlers);
            } catch (error) {
                console.warn(`Failed to get collision handlers for character ${characterId}:`, error);
            }
        }
        
        return handlers;
    }
}

// Export singleton instance
export default new CharacterRegistry(); 