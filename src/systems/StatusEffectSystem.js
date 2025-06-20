// Status Effect System - Handles visual status effect indicators above the player character

class StatusEffectSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Track active status effects and their visual elements
        this.activeEffects = new Map(); // key: effectId, value: { element, config, startTime, pausedTime }
        this.effectConfigs = new Map(); // key: effectType, value: visual config
        
        // Initialize status effect configurations
        this.initializeStatusEffectConfigs();
        
        // Track vertical offset for stacking multiple effects
        this.baseOffsetY = -50; // Base distance above player
        this.stackSpacing = 18; // Vertical spacing between effects
        
        // Pause state tracking
        this.wasPaused = false;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
    }
    
    initializeStatusEffectConfigs() {
        // Define visual configurations for different status effects
        this.effectConfigs.set('poison', {
            text: 'POISONED',
            fontSize: '16px',
            color: '#00ff40', // Changed back to green
            backgroundColor: '#004400', // Changed back to dark green
            padding: { x: 8, y: 4 },
            pulseColor: '#44ff66', // Changed back to bright green
            pulseSpeed: 400,
            priority: 1 // Higher priority effects show closer to player
        });
        
        this.effectConfigs.set('stunned', {
            text: 'STUNNED',
            fontSize: '14px',
            color: '#FFD700',
            backgroundColor: '#663300',
            padding: { x: 6, y: 3 },
            pulseColor: '#FFFF00',
            pulseSpeed: 400,
            priority: 2
        });
        
        this.effectConfigs.set('slowed', {
            text: 'SLOWED',
            fontSize: '12px',
            color: '#87CEEB',
            backgroundColor: '#001144',
            padding: { x: 6, y: 3 },
            pulseColor: '#B0E0E6',
            pulseSpeed: 800,
            priority: 3
        });
        
        this.effectConfigs.set('burning', {
            text: 'BURNING',
            fontSize: '14px',
            color: '#FF4500',
            backgroundColor: '#330000',
            padding: { x: 6, y: 3 },
            pulseColor: '#FF6600',
            pulseSpeed: 300,
            priority: 1
        });
        
        this.effectConfigs.set('frozen', {
            text: 'FROZEN',
            fontSize: '14px',
            color: '#00FFFF',
            backgroundColor: '#003333',
            padding: { x: 6, y: 3 },
            pulseColor: '#66FFFF',
            pulseSpeed: 1000,
            priority: 2
        });
        
        this.effectConfigs.set('bleed', {
            text: 'BLEEDING',
            fontSize: '14px',
            color: '#FF0000', // Bright red for blood
            backgroundColor: '#440000', // Dark red background
            padding: { x: 6, y: 3 },
            pulseColor: '#FF3333', // Bright red pulse
            pulseSpeed: 300, // Fast pulse for urgency
            priority: 1 // High priority like poison
        });
        
        this.effectConfigs.set('mindControl', {
            text: 'MIND CONTROLLED',
            fontSize: '16px',
            color: '#FF4444', // Bright red for mind control
            backgroundColor: '#440000', // Dark red background
            padding: { x: 8, y: 4 },
            pulseColor: '#FF6666', // Pulsing red
            pulseSpeed: 250, // Fast pulse for urgency
            priority: 0 // Highest priority - shows closest to player
        });
        
        // Add more status effect configs as needed...
    }
    
    // Add a status effect with automatic visual indicator
    addStatusEffect(effectType, duration = 5000, customConfig = {}) {
        if (!this.scene.player) {
            Logger.warn(Logger.Categories.SYSTEM, 'Cannot add status effect: player not found');
            return null;
        }
        
        const config = this.effectConfigs.get(effectType);
        if (!config) {
            Logger.warn(Logger.Categories.SYSTEM, `Unknown status effect type: ${effectType}`);
            return null;
        }
        
        // Generate unique effect ID
        const effectId = `${effectType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Merge custom config with default
        const finalConfig = { ...config, ...customConfig };
        
        // Create visual indicator
        const indicator = this.createStatusIndicator(effectId, effectType, finalConfig);
        
        if (!indicator) {
                            Logger.warn(Logger.Categories.SYSTEM, `Failed to create indicator for effect: ${effectType}`);
            return null;
        }
        
        // Store effect data
        this.activeEffects.set(effectId, {
            element: indicator,
            config: finalConfig,
            effectType: effectType,
            startTime: this.scene.time.now,
            duration: duration,
            pausedTime: 0 // Track how long this effect has been paused
        });
        
        // Update positions of all indicators
        this.updateIndicatorPositions();
        
        // Note: Automatic removal is now handled in the update() method to respect pause state
        // The delayedCall timer has been removed as it doesn't pause with the game
        
        // Status effect added
        return effectId;
    }
    
    // Remove a specific status effect
    removeStatusEffect(effectId) {
        const effect = this.activeEffects.get(effectId);
        if (!effect) return false;
        
        // Clean up visual element
        if (effect.element && effect.element.active) {
            // Fade out animation
            this.scene.tweens.add({
                targets: effect.element,
                alpha: 0,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 200,
                onComplete: () => {
                    try {
                        if (effect.element && effect.element.active) {
                            this.scene.tweens.killTweensOf(effect.element);
                            effect.element.destroy();
                        }
                    } catch (error) {
                        // Status effect element already destroyed
                    }
                }
            });
        }
        
        // Remove from tracking
        this.activeEffects.delete(effectId);
        
        // Update positions of remaining indicators
        this.updateIndicatorPositions();
        
        // Status effect removed
        return true;
    }
    
    // Remove all status effects of a specific type
    removeStatusEffectsByType(effectType) {
        const toRemove = [];
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.effectType === effectType) {
                toRemove.push(effectId);
            }
        }
        
        toRemove.forEach(effectId => this.removeStatusEffect(effectId));
        return toRemove.length;
    }
    
    // Check if a specific status effect type is active
    hasStatusEffect(effectType) {
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.effectType === effectType) {
                return true;
            }
        }
        return false;
    }
    
    // Get all active status effects of a type
    getStatusEffects(effectType) {
        const effects = [];
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.effectType === effectType) {
                effects.push({ id: effectId, ...effect });
            }
        }
        return effects;
    }
    
    // Create the visual indicator element
    createStatusIndicator(effectId, effectType, config) {
        if (!this.scene.player) return null;
        
        try {
            // Create text element
            const indicator = this.scene.add.text(
                this.scene.player.x, 
                this.scene.player.y + this.baseOffsetY, 
                config.text, 
                {
                    fontSize: config.fontSize,
                    color: config.color,
                    backgroundColor: config.backgroundColor || '#000000',
                    padding: config.padding || { x: 4, y: 2 },
                    fontWeight: 'bold'
                }
            );
            
            indicator.setOrigin(0.5, 0.5);
            indicator.setDepth(2000); // Above most game elements
            
            // Add pulsing animation
            const pulseSpeed = config.pulseSpeed || 500;
            const pulseColor = config.pulseColor || config.color;
            
            this.scene.tweens.add({
                targets: indicator,
                alpha: 0.6,
                duration: pulseSpeed,
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    // Change color during pulse
                    if (indicator.active && indicator.scene) {
                        const progress = indicator.alpha;
                        if (progress < 0.8) {
                            indicator.setColor(pulseColor);
                        } else {
                            indicator.setColor(config.color);
                        }
                    }
                }
            });
            
            // Store effect metadata
            indicator.effectId = effectId;
            indicator.effectType = effectType;
            
            return indicator;
            
        } catch (error) {
            Logger.error(Logger.Categories.SYSTEM, 'Error creating status indicator:', error);
            return null;
        }
    }
    
    // Update positions of all status indicators (called when effects are added/removed)
    updateIndicatorPositions() {
        if (!this.scene.player) return;
        
        // Sort effects by priority (higher priority = closer to player)
        const sortedEffects = Array.from(this.activeEffects.entries()).sort((a, b) => {
            const priorityA = a[1].config.priority || 0;
            const priorityB = b[1].config.priority || 0;
            return priorityB - priorityA; // Descending order
        });
        
        // Position each indicator
        sortedEffects.forEach(([effectId, effect], index) => {
            if (effect.element && effect.element.active) {
                const targetY = this.scene.player.y + this.baseOffsetY - (index * this.stackSpacing);
                
                // Smooth transition to new position
                this.scene.tweens.add({
                    targets: effect.element,
                    y: targetY,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
    }
    
    // Check if the game is currently paused
    isGamePaused() {
        return this.scene.isPaused || 
               this.scene.upgradeSystem?.upgradeActive || 
               this.scene.uiSystem?.isPaused;
    }
    
    // Update system - called every frame to maintain positioning
    update() {
        if (!this.scene.player || !this.scene.gameStarted) return;
        
        const isPaused = this.isGamePaused();
        
        // Handle pause state changes
        if (isPaused && !this.wasPaused) {
            // Game just paused - record pause start time and pause all tweens
            this.pauseStartTime = this.scene.time.now;
            this.wasPaused = true;
            
            // Pause all visual effect tweens
            for (const [effectId, effect] of this.activeEffects) {
                if (effect.element && effect.element.active) {
                    this.scene.tweens.pauseAll(effect.element);
                }
            }
            
            // Status effects paused
        } else if (!isPaused && this.wasPaused) {
            // Game just resumed - calculate paused time and resume tweens
            const pauseDuration = this.scene.time.now - this.pauseStartTime;
            this.totalPausedTime += pauseDuration;
            this.wasPaused = false;
            
            // Add the pause duration to each active effect's paused time
            for (const [effectId, effect] of this.activeEffects) {
                effect.pausedTime += pauseDuration;
                
                // Resume visual effect tweens
                if (effect.element && effect.element.active) {
                    this.scene.tweens.resumeAll(effect.element);
                }
            }
            
            // Status effects resumed after pause
        }
        
        // Don't update positions or check expiration while paused
        if (isPaused) return;
        
        // Update positions of all indicators to follow player
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.element && effect.element.active) {
                // Keep X position centered on player
                effect.element.x = this.scene.player.x;
                
                // Y position is managed by updateIndicatorPositions, 
                // but we ensure it's relative to current player position
                const sortedEffects = Array.from(this.activeEffects.entries()).sort((a, b) => {
                    const priorityA = a[1].config.priority || 0;
                    const priorityB = b[1].config.priority || 0;
                    return priorityB - priorityA;
                });
                
                const index = sortedEffects.findIndex(([id]) => id === effectId);
                if (index >= 0) {
                    const targetY = this.scene.player.y + this.baseOffsetY - (index * this.stackSpacing);
                    // Only update if position is significantly different to avoid jitter
                    if (Math.abs(effect.element.y - targetY) > 2) {
                        effect.element.y = targetY;
                    }
                }
            }
        }
        
        // Clean up expired effects (safety cleanup) - adjusted for paused time
        const currentTime = this.scene.time.now;
        const toRemove = [];
        
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.duration > 0) {
                const effectiveElapsedTime = (currentTime - effect.startTime) - effect.pausedTime;
                if (effectiveElapsedTime > effect.duration) {
                    toRemove.push(effectId);
                }
            }
        }
        
        toRemove.forEach(effectId => this.removeStatusEffect(effectId));
    }
    
    // Clean up all status effects (called on game over/restart)
    cleanup() {
        // Cleaning up active status effects
        
        for (const [effectId, effect] of this.activeEffects) {
            if (effect.element && effect.element.active) {
                try {
                    this.scene.tweens.killTweensOf(effect.element);
                    effect.element.destroy();
                } catch (error) {
                    // Error cleaning up status effect
                }
            }
        }
        
        this.activeEffects.clear();
        
        // Reset pause tracking state
        this.wasPaused = false;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
    }
    
    // Add a new status effect type configuration
    addStatusEffectConfig(effectType, config) {
        this.effectConfigs.set(effectType, config);
        // Status effect config added
    }
    
    // Get debug info
    getDebugInfo() {
        return {
            activeEffects: this.activeEffects.size,
            configuredTypes: Array.from(this.effectConfigs.keys()),
            isPaused: this.isGamePaused(),
            wasPaused: this.wasPaused,
            totalPausedTime: this.totalPausedTime
        };
    }
}

export default StatusEffectSystem; 