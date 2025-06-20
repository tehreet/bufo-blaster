// Logger Utility - Provides categorized logging for better debugging

class Logger {
    static LogLevel = {
        ERROR: 0,
        WARN: 1, 
        INFO: 2,
        VERBOSE: 3
    };
    
    static currentLogLevel = Logger.LogLevel.INFO; // Default level
    
    // Categories for filtering in Chrome DevTools
    static Categories = {
        SYSTEM: 'SYSTEM',
        ASSET: 'ASSET', 
        PHYSICS: 'PHYSICS',
        COMBAT: 'COMBAT',
        UI: 'UI',
        INPUT: 'INPUT',
        AUDIO: 'AUDIO',
        DEBUG: 'DEBUG'
    };
    
    static setLogLevel(level) {
        this.currentLogLevel = level;
        console.info(`[${this.Categories.SYSTEM}] Log level set to: ${Object.keys(this.LogLevel)[level]}`);
    }
    
    // Error logging (always shown)
    static error(category, message, ...args) {
        console.error(`[${category}] ${message}`, ...args);
    }
    
    // Warning logging (level WARN and above)
    static warn(category, message, ...args) {
        if (this.currentLogLevel >= this.LogLevel.WARN) {
            console.warn(`[${category}] ${message}`, ...args);
        }
    }
    
    // Info logging (level INFO and above)
    static info(category, message, ...args) {
        if (this.currentLogLevel >= this.LogLevel.INFO) {
            console.info(`[${category}] ${message}`, ...args);
        }
    }
    
    // Verbose logging (level VERBOSE only)
    static verbose(category, message, ...args) {
        if (this.currentLogLevel >= this.LogLevel.VERBOSE) {
            console.log(`[${category}] ${message}`, ...args);
        }
    }
    
    // System initialization and lifecycle
    static system(message, ...args) {
        this.info(this.Categories.SYSTEM, message, ...args);
    }
    
    // Asset loading and management
    static asset(message, ...args) {
        this.info(this.Categories.ASSET, message, ...args);
    }
    
    // Asset loading warnings
    static assetWarn(message, ...args) {
        this.warn(this.Categories.ASSET, message, ...args);
    }
    
    // Asset loading errors
    static assetError(message, ...args) {
        this.error(this.Categories.ASSET, message, ...args);
    }
    
    // Physics and collision detection (verbose only)
    static physics(message, ...args) {
        this.verbose(this.Categories.PHYSICS, message, ...args);
    }
    
    // Combat actions (verbose only)
    static combat(message, ...args) {
        this.verbose(this.Categories.COMBAT, message, ...args);
    }
    
    // UI interactions and updates
    static ui(message, ...args) {
        this.verbose(this.Categories.UI, message, ...args);
    }
    
    // Input handling
    static input(message, ...args) {
        this.verbose(this.Categories.INPUT, message, ...args);
    }
    
    // Audio system
    static audio(message, ...args) {
        this.info(this.Categories.AUDIO, message, ...args);
    }
    
    // Debug features
    static debug(message, ...args) {
        this.info(this.Categories.DEBUG, message, ...args);
    }
    
    // Game state changes (important info)
    static gameState(message, ...args) {
        this.info(this.Categories.SYSTEM, `GAME STATE: ${message}`, ...args);
    }
    
    // Character actions (for important events only)
    static character(message, ...args) {
        this.info(this.Categories.COMBAT, `CHARACTER: ${message}`, ...args);
    }
    
    // Enemy actions (for important events only)
    static enemy(message, ...args) {
        this.info(this.Categories.COMBAT, `ENEMY: ${message}`, ...args);
    }
    
    // Upgrade system
    static upgrade(message, ...args) {
        this.info(this.Categories.SYSTEM, `UPGRADE: ${message}`, ...args);
    }
    
    // Status effects (reduced logging)
    static status(message, ...args) {
        this.verbose(this.Categories.COMBAT, `STATUS: ${message}`, ...args);
    }
    
    // Chrome DevTools console helpers
    static logInstructions() {
        console.group('%c🎮 Bufo Blaster Debug Console', 'color: #00ff00; font-weight: bold; font-size: 14px;');
        console.info('%cTo filter logs in Chrome DevTools:', 'font-weight: bold;');
        console.info('• Type "[SYSTEM]" to see only system logs');
        console.info('• Type "[ASSET]" to see only asset loading logs');
        console.info('• Type "[COMBAT]" to see only combat logs');
        console.info('• Type "[UI]" to see only UI logs');
        console.info('• Type "[DEBUG]" to see only debug logs');
        console.info('• Type "-[COMBAT]" to hide combat logs');
        console.info('');
        console.info('%cCurrent log levels:', 'font-weight: bold;');
        console.info('• console.error() - Always visible (errors)');
        console.info('• console.warn() - Level WARN+ (warnings)');
        console.info('• console.info() - Level INFO+ (general info)');
        console.info('• console.log() - Level VERBOSE only (detailed debug)');
        console.info('');
        console.info(`%cCurrent level: ${Object.keys(this.LogLevel)[this.currentLogLevel]}`, 'color: #ffff00;');
        console.groupEnd();
    }
}

// Set default log level based on environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    Logger.setLogLevel(Logger.LogLevel.INFO); // Show info+ for development
} else {
    Logger.setLogLevel(Logger.LogLevel.WARN); // Show warnings+ for production
}

export default Logger; 