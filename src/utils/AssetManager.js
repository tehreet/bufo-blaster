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
            console.warn('Invalid parameters for createAnimatedOverlay');
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
            // Get asset configuration
            const assetConfig = AssetConfig.getAssetConfig();
            const asset = assetConfig[assetType][assetId];
            
            if (!asset) {
                Logger.assetWarn(`Asset configuration not found: ${assetType}.${assetId}`);
                return false;
            }
            
            // Check if this asset has a GIF version
            if (!asset.gif) {
                Logger.asset(`No animated version available for: ${assetId}, using static PNG`);
                // Show the static PNG sprite
                if (gameObject.setAlpha) {
                    gameObject.setAlpha(1);
                }
                return false;
            }
            
            const assetPath = asset.gif;
            const width = asset.displaySize;
            const height = asset.displaySize;
            
            // Mark as loading
            this.loadingAssets.add(assetKey);
            
            // Create overlay element
            const overlay = document.createElement('img');
            overlay.src = assetPath;
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '1000';
            overlay.style.width = width + 'px';
            overlay.style.height = height + 'px';
            overlay.style.imageRendering = 'pixelated'; // Maintain pixel art appearance
            overlay.style.userSelect = 'none';
            overlay.style.display = 'block';
            
            // Success handler
            overlay.onload = () => {
                Logger.asset(`Successfully loaded animated overlay: ${assetId}`);
                this.loadingAssets.delete(assetKey);
                
                // Hide the static sprite since we have the animated overlay
                if (gameObject.setAlpha) {
                    gameObject.setAlpha(0);
                }
            };
            
            // Error handling with fallback
            overlay.onerror = () => {
                Logger.assetWarn(`Failed to load animated overlay: ${assetPath}`);
                this.loadingAssets.delete(assetKey);
                this.failedAssets.add(assetKey);
                
                // Clean up the failed overlay
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.animatedOverlays.delete(gameObject);
                
                // Fallback to static sprite
                Logger.asset(`Falling back to static sprite for: ${assetId}`);
                if (gameObject.setAlpha) {
                    gameObject.setAlpha(1);
                }
            };
            
            // Position overlay
            this.updateOverlayPosition(gameObject, overlay, width, height);
            
            // Add to DOM
            document.body.appendChild(overlay);
            
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
            
            // Fallback to static sprite
            if (gameObject.setAlpha) {
                gameObject.setAlpha(1);
            }
            return false;
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
                console.warn('Game canvas not found');
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
            console.error('Error updating overlay position:', error);
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
                console.error('Error removing overlay element:', error);
            }
            this.animatedOverlays.delete(gameObject);
        }
    }

    cleanupAllOverlays() {
        Logger.asset(`Cleaning up ${this.animatedOverlays.size} animated overlays`);
        
        this.animatedOverlays.forEach((overlay, gameObject) => {
            if (overlay.element) {
                try {
                    if (overlay.element.parentNode) {
                        overlay.element.parentNode.removeChild(overlay.element);
                    }
                } catch (error) {
                    console.error('Error cleaning up overlay:', error);
                }
            }
        });
        
        this.animatedOverlays.clear();
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
        // Update all overlay positions
        this.animatedOverlays.forEach((overlay, gameObject) => {
            this.updateAnimatedOverlay(gameObject);
        });
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