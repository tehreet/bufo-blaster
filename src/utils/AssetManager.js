// Asset Manager - Handles animated GIF overlays and asset management

import AssetConfig from './AssetConfig.js';
import Logger from './Logger.js';

class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.animatedOverlays = new Map();
        this.overlaysHidden = false;
        this.failedAssets = new Set(); // Track failed GIF loads
        this.loadingAssets = new Set(); // Track currently loading assets
    }

    createAnimatedOverlay(gameObject, assetId, assetType = 'characters') {
        if (!gameObject || !assetId) {
            Logger.warn(Logger.Categories.ASSET, 'Invalid parameters for createAnimatedOverlay');
            return false;
        }
        
        // Validate game object has required properties
        if (!gameObject.x || !gameObject.y || typeof gameObject.setAlpha !== 'function') {
            Logger.warn(Logger.Categories.ASSET, `Invalid game object for overlay: missing position or setAlpha method`);
            return false;
        }
        
        // Check if we already failed to load this asset
        const assetKey = `${assetType}_${assetId}`;
        if (this.failedAssets.has(assetKey)) {
            Logger.assetWarn(`Skipping already failed asset: ${assetKey}`);
            return false;
        }
        
        // Check if asset is currently loading
        if (this.loadingAssets.has(assetKey)) {
            Logger.assetWarn(`Asset already loading: ${assetKey}`);
            return false;
        }
        
        try {
            // Get asset configuration with validation
            const assetConfig = AssetConfig.getAssetConfig();
            if (!assetConfig || !assetConfig[assetType]) {
                Logger.assetWarn(`Asset configuration not found for type: ${assetType}`);
                this.showStaticSprite(gameObject);
                return false;
            }
            
            const asset = assetConfig[assetType][assetId];
            if (!asset) {
                Logger.assetWarn(`Asset configuration not found: ${assetType}.${assetId}`);
                this.showStaticSprite(gameObject);
                return false;
            }
            
            // Check if this asset has a GIF version
            if (!asset.gif) {
                Logger.asset(`No animated version available for: ${assetId}, using static PNG`);
                this.showStaticSprite(gameObject);
                return false;
            }
            
            // Validate asset path
            const assetPath = asset.gif;
            if (!assetPath || typeof assetPath !== 'string') {
                Logger.assetWarn(`Invalid asset path for ${assetId}: ${assetPath}`);
                this.showStaticSprite(gameObject);
                return false;
            }
            
            // Validate display size
            const width = asset.displaySize;
            const height = asset.displaySize;
            if (!width || !height || width <= 0 || height <= 0) {
                Logger.assetWarn(`Invalid display size for ${assetId}: ${width}x${height}`);
                this.showStaticSprite(gameObject);
                return false;
            }
            
            // Mark as loading
            this.loadingAssets.add(assetKey);
            
            // Create overlay element with validation
            const overlay = this.createOverlayElement(assetPath, width, height);
            if (!overlay) {
                this.loadingAssets.delete(assetKey);
                this.showStaticSprite(gameObject);
                return false;
            }
            
            // Success handler
            overlay.onload = () => {
                Logger.asset(`Successfully loaded animated overlay: ${assetId}`);
                this.loadingAssets.delete(assetKey);
                
                // Hide the static sprite since we have the animated overlay
                this.hideStaticSprite(gameObject);
            };
            
            // Error handling with fallback
            overlay.onerror = () => {
                Logger.assetWarn(`Failed to load animated overlay: ${assetPath}`);
                this.handleOverlayLoadError(assetKey, overlay, gameObject, assetId);
            };
            
            // Position overlay
            this.updateOverlayPosition(gameObject, overlay, width, height);
            
            // Add to DOM with error handling
            try {
                document.body.appendChild(overlay);
            } catch (domError) {
                Logger.assetError('Failed to add overlay to DOM:', domError);
                this.handleOverlayLoadError(assetKey, overlay, gameObject, assetId);
                return false;
            }
            
            // Store reference
            this.animatedOverlays.set(gameObject, {
                element: overlay,
                width: width,
                height: height,
                gameObject: gameObject,
                assetId: assetId,
                assetType: assetType
            });
            
            Logger.asset(`Created animated overlay for ${assetId} (${assetType})`);
            return true;
            
        } catch (error) {
            Logger.assetError('Error creating animated overlay:', error);
            this.loadingAssets.delete(assetKey);
            this.failedAssets.add(assetKey);
            this.showStaticSprite(gameObject);
            return false;
        }
    }
    
    // Helper method to create overlay element with validation
    createOverlayElement(assetPath, width, height) {
        try {
            const overlay = document.createElement('img');
            overlay.src = assetPath;
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '1000';
            overlay.style.width = width + 'px';
            overlay.style.height = height + 'px';
            overlay.style.imageRendering = 'pixelated';
            overlay.style.userSelect = 'none';
            overlay.style.display = 'block';
            return overlay;
        } catch (error) {
            Logger.assetError('Failed to create overlay element:', error);
            return null;
        }
    }
    
    // Helper method to handle overlay load errors
    handleOverlayLoadError(assetKey, overlay, gameObject, assetId) {
        this.loadingAssets.delete(assetKey);
        this.failedAssets.add(assetKey);
        
        // Clean up the failed overlay
        try {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        } catch (error) {
            Logger.assetError('Failed to remove failed overlay:', error);
        }
        
        this.animatedOverlays.delete(gameObject);
        
        // Fallback to static sprite
        Logger.asset(`Falling back to static sprite for: ${assetId}`);
        this.showStaticSprite(gameObject);
    }
    
    // Helper method to show static sprite
    showStaticSprite(gameObject) {
        if (gameObject && typeof gameObject.setAlpha === 'function') {
            gameObject.setAlpha(1);
        }
    }
    
    // Helper method to hide static sprite
    hideStaticSprite(gameObject) {
        if (gameObject && typeof gameObject.setAlpha === 'function') {
            gameObject.setAlpha(0);
        }
    }

    updateOverlayPosition(gameObject, overlayElement, width, height) {
        if (!gameObject || !overlayElement || !this.scene.cameras || !this.scene.cameras.main) {
            return;
        }
        
        try {
            const camera = this.scene.cameras.main;
            const canvas = this.scene.game.canvas;
            
            if (!canvas) {
                Logger.warn(Logger.Categories.ASSET, 'Game canvas not found');
                return;
            }
            
            const canvasRect = canvas.getBoundingClientRect();
            
            // Validate game object position first
            if (!isFinite(gameObject.x) || !isFinite(gameObject.y)) {
                overlayElement.style.display = 'none';
                return;
            }
            
            // Calculate screen position
            const screenX = (gameObject.x - camera.scrollX) * camera.zoom;
            const screenY = (gameObject.y - camera.scrollY) * camera.zoom;
            
            // Position overlay (centered on game object)
            const left = canvasRect.left + screenX - (width * camera.zoom) / 2;
            const top = canvasRect.top + screenY - (height * camera.zoom) / 2;
            
            // Validate calculated positions
            if (!isFinite(left) || !isFinite(top)) {
                overlayElement.style.display = 'none';
                return;
            }
            
            // Validate positions to prevent overlays appearing outside reasonable bounds
            const maxDistance = 5000; // Maximum pixels from canvas
            if (Math.abs(left) > maxDistance || Math.abs(top) > maxDistance) {
                overlayElement.style.display = 'none';
                return;
            } else if (overlayElement.style.display === 'none') {
                overlayElement.style.display = 'block';
            }
            
            overlayElement.style.left = Math.round(left) + 'px';
            overlayElement.style.top = Math.round(top) + 'px';
            overlayElement.style.width = Math.round(width * camera.zoom) + 'px';
            overlayElement.style.height = Math.round(height * camera.zoom) + 'px';
        } catch (error) {
            Logger.error(Logger.Categories.ASSET, 'Error updating overlay position:', error);
        }
    }

    updateAnimatedOverlay(gameObject) {
        const overlay = this.animatedOverlays.get(gameObject);
        if (!overlay || !overlay.element) {
            return;
        }
        
        // Check if game object is still active and in the scene
        if (!gameObject.active || !gameObject.scene) {
            this.destroyAnimatedOverlay(gameObject);
            return;
        }
        
        // Hide overlay if overlays are globally hidden
        if (this.overlaysHidden) {
            overlay.element.style.display = 'none';
            return;
        } else if (overlay.element.style.display === 'none') {
            overlay.element.style.display = 'block';
        }
        
        // Update position
        this.updateOverlayPosition(gameObject, overlay.element, overlay.width, overlay.height);
    }

    destroyAnimatedOverlay(gameObject) {
        const overlay = this.animatedOverlays.get(gameObject);
        if (overlay && overlay.element) {
            try {
                if (overlay.element.parentNode) {
                    overlay.element.parentNode.removeChild(overlay.element);
                }
            } catch (error) {
                Logger.error(Logger.Categories.ASSET, 'Error removing overlay element:', error);
            }
            this.animatedOverlays.delete(gameObject);
        }
    }

    cleanupAllOverlays() {
        Logger.asset(`Cleaning up ${this.animatedOverlays.size} animated overlays`);
        
        this.animatedOverlays.forEach((overlay, gameObject) => {
            if (overlay.element) {
                try {
                    // Remove event listeners to prevent memory leaks
                    overlay.element.onload = null;
                    overlay.element.onerror = null;
                    
                    if (overlay.element.parentNode) {
                        overlay.element.parentNode.removeChild(overlay.element);
                    }
                } catch (error) {
                    Logger.error(Logger.Categories.ASSET, 'Error cleaning up overlay:', error);
                }
            }
        });
        
        this.animatedOverlays.clear();
        
        // Clear loading and failed asset tracking
        this.loadingAssets.clear();
        // Note: Keep failedAssets to prevent retrying broken assets
    }

    hideAllOverlays() {
        this.overlaysHidden = true;
        this.animatedOverlays.forEach(overlay => {
            if (overlay.element) {
                overlay.element.style.display = 'none';
            }
        });
    }

    showAllOverlays() {
        this.overlaysHidden = false;
        this.animatedOverlays.forEach(overlay => {
            if (overlay.element) {
                overlay.element.style.display = 'block';
            }
        });
    }

    updateAllOverlays() {
        // Update all overlay positions - optimized iteration
        for (const [gameObject, overlay] of this.animatedOverlays) {
            this.updateAnimatedOverlay(gameObject);
        }
    }

    getOverlayCount() {
        return this.animatedOverlays.size;
    }

    isOverlayActive(gameObject) {
        return this.animatedOverlays.has(gameObject);
    }
    
    // Helper methods for accessing AssetConfig data
    getDisplaySize(assetId, assetType = 'characters') {
        return AssetConfig.getDisplaySize(assetId, assetType);
    }
    
    getPreviewSize(characterId) {
        return AssetConfig.getPreviewSize(characterId);
    }
    
    hasAnimatedVersion(assetId, assetType = 'characters') {
        return AssetConfig.hasAnimatedVersion(assetId, assetType);
    }
    
    // Get debug information about asset loading
    getAssetLoadingStatus() {
        return {
            activeOverlays: this.animatedOverlays.size,
            failedAssets: Array.from(this.failedAssets),
            loadingAssets: Array.from(this.loadingAssets),
            overlaysHidden: this.overlaysHidden
        };
    }
    
    // Retry failed assets (useful for debugging)
    retryFailedAsset(assetKey) {
        if (this.failedAssets.has(assetKey)) {
            this.failedAssets.delete(assetKey);
            Logger.asset(`Cleared failed status for asset: ${assetKey}`);
            return true;
        }
        return false;
    }
    
    // Clear all failed asset tracking (for retries)
    clearFailedAssets() {
        const count = this.failedAssets.size;
        this.failedAssets.clear();
        Logger.asset(`Cleared ${count} failed asset entries`);
    }
}

export default AssetManager; 