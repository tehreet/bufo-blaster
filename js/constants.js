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
    
    // Special Enemy Constants
    SPECIAL_ENEMY_SPAWN_CHANCE: 0.15, // 15% chance to spawn special enemies on eligible levels
    
    // Buff Bufo (stuns player on hit)
    BUFF_BUFO_RADIUS: 18, // Much larger than normal (was 15)
    BUFF_BUFO_HEALTH: 8, // Increased HP
    BUFF_BUFO_CONTACT_DAMAGE: 15,
    BUFF_BUFO_STUN_DURATION: 1000, // 1 second stun
    
    // Gavel Bufo (knockback and damage)
    GAVEL_BUFO_RADIUS: 15, // Larger than normal (was 12)
    GAVEL_BUFO_HEALTH: 6,
    GAVEL_BUFO_CONTACT_DAMAGE: 12,
    GAVEL_BUFO_KNOCKBACK_FORCE: 8,
    
    // Ice Bufo (slows player when close)
    ICE_BUFO_RADIUS: 13, // Larger than normal (was 10)
    ICE_BUFO_HEALTH: 5,
    ICE_BUFO_CONTACT_DAMAGE: 8,
    ICE_BUFO_SLOW_RADIUS: 120, // Increased range to apply slow effect (was 80)
    ICE_BUFO_SLOW_FACTOR: 0.5, // Reduces player speed to 50% at close range
    
    // Boss Bufo (every 7 levels)
    BOSS_BUFO_RADIUS: 20,
    BOSS_BUFO_HEALTH: 20,
    BOSS_BUFO_CONTACT_DAMAGE: 25,
    BOSS_BUFO_SPEED_MULTIPLIER: 0.8, // Slower but tankier
    BOSS_BUFO_LEVEL_INTERVAL: 7, // Spawn every 7 levels
    
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
    GOOSE_BUFO_CONVERTED_ALLY_LIFETIME: 12000, // 12 seconds for converted allies (increased from 8)
    GOOSE_BUFO_CONVERTED_ALLY_DAMAGE: 3, // Damage converted allies deal (increased from 2)
    GOOSE_BUFO_CONVERTED_ALLY_SPEED: 2, // Speed of converted allies
};

// Enemy Types
export const ENEMY_TYPES = {
    NORMAL: 'normal',
    BUFF_BUFO: 'buff_bufo',
    GAVEL_BUFO: 'gavel_bufo',
    ICE_BUFO: 'ice_bufo',
    BOSS_BUFO: 'boss_bufo'
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
        sprite: 'https://all-the.bufo.zone/bufo-riding-goose.gif',
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
    // Special Enemy Sprites
    SPECIAL_ENEMIES: {
        BUFF_BUFO: 'https://all-the.bufo.zone/buff-bufo.png',
        GAVEL_BUFO: 'https://all-the.bufo.zone/bufo-brings-a-new-meaning-to-gaveled-by-slamming-the-hammer-very-loud.png',
        ICE_BUFO: 'https://all-the.bufo.zone/bufo-code-freeze.png',
        BOSS_BUFO: 'https://all-the.bufo.zone/buff-bufo.png' // Using buff bufo but even larger for boss
    }
};

// Audio file paths
export const AUDIO_PATHS = {
    MUSIC: 'sfx/music_loop.mp3',
    SHOOT: 'sfx/shoot.mp3',
    PICKUP: 'sfx/pickup.mp3',
    PLAYER_HIT: 'sfx/player_hit.mp3',
    ENEMY_DIE: 'sfx/enemy_die.mp3',
}; 