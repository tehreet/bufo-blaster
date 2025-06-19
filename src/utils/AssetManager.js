// Asset Manager - Handles animated GIF overlays and asset management

class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.animatedOverlays = new Map();
        this.overlaysHidden = false;
    }

    createAnimatedOverlay(gameObject, assetPath, width, height) {
        if (!gameObject || !assetPath) {
            console.warn('Invalid parameters for createAnimatedOverlay');
            return;
        }
        
        try {
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
            
            // Error handling
            overlay.onerror = () => {
                console.warn(`Failed to load animated overlay: ${assetPath}`);
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.animatedOverlays.delete(gameObject);
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
                gameObject: gameObject
            });
            
            console.log(`Created animated overlay for ${assetPath}`);
        } catch (error) {
            console.error('Error creating animated overlay:', error);
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
        console.log(`Cleaning up ${this.animatedOverlays.size} animated overlays`);
        
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
}

export default AssetManager; 