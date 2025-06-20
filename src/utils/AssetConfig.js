// Asset Configuration - Centralized asset path and type management

class AssetConfig {
    static getAssetConfig() {
        return {
            // Character assets - specify both PNG (for physics) and GIF (for animation) if available
            characters: {
                'shield-bufo': {
                    png: 'assets/characters/shield-bufo.png',
                    gif: null, // PNG only character
                    displaySize: 64,
                    previewSize: 120
                },
                'bufo-magician': {
                    png: 'assets/characters/bufo-magician.png',
                    gif: null, // PNG only character
                    displaySize: 64,
                    previewSize: 120
                },
                'bat-bufo': {
                    png: 'assets/characters/bat-bufo.png',
                    gif: null, // PNG only character
                    displaySize: 64,
                    previewSize: 120
                }
            },
            
            // Enemy assets - specify PNG for physics, GIF for animation if available
            enemies: {
                'bufo-covid': {
                    png: 'assets/enemies/bufo-covid.png',
                    gif: 'assets/enemies/bufo-covid.gif',
                    displaySize: 40
                },
                'bufo-clown': {
                    png: 'assets/enemies/bufo-clown.png',
                    gif: null, // PNG only
                    displaySize: 44
                },
                'bufo-pog': {
                    png: 'assets/enemies/bufo-pog.png',
                    gif: null, // PNG only
                    displaySize: 36
                },
                'bufo-enraged': {
                    png: 'assets/enemies/bufo-enraged.png',
                    gif: null, // PNG only
                    displaySize: 48
                },
                'bufo-mob': {
                    png: 'assets/enemies/bufo-mob.png',
                    gif: null, // PNG only
                    displaySize: 48
                },
                'bufo-vampire': {
                    png: 'assets/enemies/bufo-vampire.png',
                    gif: null, // PNG only
                    displaySize: 45
                },
                'bufo-chicken': {
                    png: 'assets/enemies/bufo-chicken.png',
                    gif: null, // PNG only
                    displaySize: 42
                },
                'bufo-dancing': {
                    png: null, // No PNG version
                    gif: 'assets/enemies/bufo-dancing.gif',
                    displaySize: 40
                },
                'bufo-eyes': {
                    png: null, // No PNG version
                    gif: 'assets/enemies/bufo-eyes.gif',
                    displaySize: 40
                }
            },
            
            // Map assets
            map: {
                'single-tile-tileset': 'assets/map/single-tile-tileset.png',
                'single-tile-level': 'assets/map/single-tile-level.json',
                'grass-dirt-tileset': 'assets/map/grass-dirt-tileset.png',
                'grass-dirt-level': 'assets/map/grass-dirt-level.json',
                'custom-tileset': 'assets/map/custom-tileset.png',
                'custom-level': 'assets/map/custom-level.json'
            },
            
            // Audio assets
            audio: {
                'shoot': 'assets/sfx/shoot.mp3',
                'enemyDie': 'assets/sfx/enemy_die.mp3',
                'pickup': 'assets/sfx/pickup.mp3',
                'playerHit': 'assets/sfx/player_hit.mp3',
                'musicLoop': 'assets/sfx/music_loop.mp3'
            }
        };
    }
    
    // Get character asset info
    static getCharacterAsset(characterId) {
        const config = this.getAssetConfig();
        return config.characters[characterId] || null;
    }
    
    // Get enemy asset info
    static getEnemyAsset(enemyId) {
        const config = this.getAssetConfig();
        return config.enemies[enemyId] || null;
    }
    
    // Get map asset path
    static getMapAsset(mapId) {
        const config = this.getAssetConfig();
        return config.map[mapId] || null;
    }
    
    // Get audio asset path
    static getAudioAsset(audioId) {
        const config = this.getAssetConfig();
        return config.audio[audioId] || null;
    }
    
    // Get all PNG assets for preloading
    static getPNGAssetsForPreload() {
        const config = this.getAssetConfig();
        const assets = [];
        
        // Add character PNG assets
        Object.entries(config.characters).forEach(([id, asset]) => {
            if (asset.png) {
                assets.push({ key: id, path: asset.png });
            }
        });
        
        // Add enemy PNG assets
        Object.entries(config.enemies).forEach(([id, asset]) => {
            if (asset.png) {
                assets.push({ key: id, path: asset.png });
            }
        });
        
        return assets;
    }
    
    // Get all map assets for preloading
    static getMapAssetsForPreload() {
        const config = this.getAssetConfig();
        return Object.entries(config.map).map(([key, path]) => ({ key, path }));
    }
    
    // Get all audio assets for preloading
    static getAudioAssetsForPreload() {
        const config = this.getAssetConfig();
        return Object.entries(config.audio).map(([key, path]) => ({ key, path }));
    }
    
    // Check if an asset has animated GIF version
    static hasAnimatedVersion(assetId, assetType = 'characters') {
        const config = this.getAssetConfig();
        const asset = config[assetType][assetId];
        return asset && asset.gif !== null;
    }
    
    // Get GIF path for animated overlay
    static getAnimatedAssetPath(assetId, assetType = 'characters') {
        const config = this.getAssetConfig();
        const asset = config[assetType][assetId];
        return asset ? asset.gif : null;
    }
    
    // Get display size for an asset
    static getDisplaySize(assetId, assetType = 'characters') {
        const config = this.getAssetConfig();
        const asset = config[assetType][assetId];
        return asset ? asset.displaySize : 32; // Default size
    }
    
    // Get preview size for character selection
    static getPreviewSize(characterId) {
        const asset = this.getCharacterAsset(characterId);
        return asset ? asset.previewSize : 60; // Default preview size
    }
}

export default AssetConfig; 