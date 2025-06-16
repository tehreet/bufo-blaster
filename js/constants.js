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
    PLAYER_HEALTH_REGEN_AMOUNT: 2, // Increased regen for bruiser
    PLAYER_HEALTH_REGEN_INTERVAL: 8000, // 8 seconds (faster regen)
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
    STAB_BUFO_AURA_RADIUS: 85, // Slightly larger for melee range
    STAB_BUFO_AURA_DAMAGE_PER_TICK: 0.8, // More damage for melee focus
    STAB_BUFO_AURA_TICK_INTERVAL_MS: 400, // Faster ticks
    STAB_BUFO_AURA_KNOCKBACK_FORCE: 2, // New: knockback force
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
    playerHealth: 150, // Increased health for tankiness
    playerXP: 0,
    playerLevel: 1,
    xpToNextLevel: 30,
    projectileDamage: 1.5, // Not used for Stab Bufo
    shootInterval: 1000, // Not used for Stab Bufo
    playerSpeed: 4, // Slightly slower for melee bruiser
    xpOrbPickupRadius: 100,
    enemySpawnInterval: 2000,
};

// Asset URLs
export const ASSET_URLS = {
    PLAYER_SPRITE: 'https://raw.githubusercontent.com/knobiknows/all-the-bufo/main/all-the-bufo/bufo-stab.gif',
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