// Game Constants and Configuration
export const GAME_CONFIG = {
    // Game Speed Control
    TIME_SCALE: 0.68, // 1.0 is normal speed, < 1.0 is slower, > 1.0 is faster
    
    // Canvas Dimensions
    GAME_WIDTH: 1600,
    GAME_HEIGHT: 1000,
    INITIAL_CANVAS_WIDTH: 800,
    INITIAL_CANVAS_HEIGHT: 600,
    
    // Player Constants
    PLAYER_RADIUS: 18,
    PLAYER_HEALTH_REGEN_AMOUNT: 1, // Standard regen amount
    PLAYER_HEALTH_REGEN_INTERVAL: 9000, // 9 seconds (slightly faster than default)
    PLAYER_HEALTHBAR_WIDTH: 50,
    PLAYER_HEALTHBAR_HEIGHT: 5,
    PLAYER_HEALTHBAR_OFFSET_Y: 30,
    INVINCIBILITY_DURATION: 1000, // 1 second
    
    // Enemy Constants
    ENEMY_RADIUS: 10,
    ENEMY_SPEED: 1.5,
    ENEMY_MAX_HEALTH: 3,
    ENEMY_CONTACT_DAMAGE: 10,
    
    // Projectile Constants
    PROJECTILE_RADIUS: 5,
    PROJECTILE_SPEED: 12,
    
    // XP Orb Constants
    XP_ORB_RADIUS: 8,
    XP_ORB_MAGNET_SPEED: 4,
    
    // Gamepad Constants
    GAMEPAD_DEAD_ZONE: 0.2,
    
    // Stab Bufo Aura Constants
    STAB_BUFO_AURA_RADIUS: 80, // Slightly reduced range
    STAB_BUFO_AURA_DAMAGE_PER_TICK: 0.6, // Reduced damage for balance
    STAB_BUFO_AURA_TICK_INTERVAL_MS: 450, // Slightly slower ticks
    STAB_BUFO_AURA_KNOCKBACK_FORCE: 4, // New: knockback force (increased for visibility)
    
    // Wizard Bufo Starfall Constants
    WIZARD_STARFALL_COOLDOWN: 2500, // 2.5 seconds between casts (faster)
    WIZARD_STARFALL_DAMAGE: 3, // Damage per star (increased)
    WIZARD_STARFALL_COUNT: 5, // Number of stars per cast (more stars)
    WIZARD_STARFALL_CONFUSION_DURATION: 3000, // 3 seconds of confusion (longer)
    WIZARD_STARFALL_RANGE: 300, // Max range to target enemies (larger range)
    WIZARD_STARFALL_AOE_RADIUS: 60, // AOE damage radius around each star impact
    
    // Goose Bufo Constants
    GOOSE_BUFO_GOOSE_COUNT: 3, // Number of orbiting geese
    GOOSE_BUFO_ORBIT_RADIUS: 60, // Orbit radius around player
    GOOSE_BUFO_ORBIT_SPEED: 2, // Rotation speed of geese
    GOOSE_BUFO_GOOSE_DAMAGE: 1, // Damage per goose hit
    GOOSE_BUFO_KNOCKBACK_FORCE: 3, // Knockback force from geese
    GOOSE_BUFO_CONVERTED_ALLY_LIFETIME: 8000, // 8 seconds for converted allies
    GOOSE_BUFO_CONVERTED_ALLY_DAMAGE: 2, // Damage converted allies deal
    GOOSE_BUFO_CONVERTED_ALLY_SPEED: 2, // Speed of converted allies
};

// Collision Categories
export const COLLISION_CATEGORIES = {
    DEFAULT: 0x0001,
    PLAYER: 0x0002,
    ENEMY: 0x0004,
    PROJECTILE: 0x0008,
};

// Default Game Settings
export const DEFAULT_GAME_SETTINGS = {
    playerHealth: 120, // Reduced from 150 for better balance
    playerXP: 0,
    playerLevel: 1,
    xpToNextLevel: 30,
    projectileDamage: 1.5, // Not used for Stab Bufo
    shootInterval: 1000, // Not used for Stab Bufo
    playerSpeed: 4, // Slightly slower for melee bruiser
    xpOrbPickupRadius: 100,
    enemySpawnInterval: 2000,
};

// Character Definitions
export const CHARACTERS = {
    STAB_BUFO: {
        id: 'stab',
        name: 'Stab Bufo',
        description: 'Melee bruiser with damaging aura and knockback',
        sprite: 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/bufo-stab.gif',
        health: 120,
        speed: 4,
        abilityName: 'Toxic Aura',
        abilityDescription: 'Damages and knocks back nearby enemies'
    },
    WIZARD_BUFO: {
        id: 'wizard',
        name: 'Wizard Bufo',
        description: 'Ranged caster with area confusion spells',
        sprite: 'https://all-the.bufo.zone/bufo-wizard.gif',
        health: 100,
        speed: 5,
        abilityName: 'Starfall',
        abilityDescription: 'Casts stars that damage and confuse enemies'
    },
    GOOSE_BUFO: {
        id: 'goose',
        name: 'Goose Bufo',
        description: 'Summoner with orbiting geese that convert enemies',
        sprite: 'https://all-the.bufo.zone/bufo-goose-hat-happy-dance.gif',
        health: 110,
        speed: 4.5,
        abilityName: 'Goose Guard',
        abilityDescription: 'Orbiting geese damage enemies and convert them to allies'
    }
};

// Asset URLs
export const ASSET_URLS = {
    PLAYER_SPRITE: 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/bufo-stab.gif', // Default, will be overridden by character selection
    ENEMY_SPRITE_BASE: 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/',
    ENEMY_IMAGE_FILES: [
        'bufo-angry.png',
        'awesomebufo.png',
        'bufo-anime-glasses.png',
        'bufo-evil.png',
        'bufo-dizzy.gif'
    ],
};

// Audio file paths
export const AUDIO_PATHS = {
    MUSIC: 'sfx/music_loop.mp3',
    SHOOT: 'sfx/shoot.mp3',
    PICKUP: 'sfx/pickup.mp3',
    PLAYER_HIT: 'sfx/player_hit.mp3',
    ENEMY_DIE: 'sfx/enemy_die.mp3',
}; 