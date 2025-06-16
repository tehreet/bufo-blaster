// Asset Loading System
import { ASSET_URLS, AUDIO_PATHS, CHARACTERS } from './constants.js';
import { 
    imagesToLoadCount, 
    imagesLoadedCount, 
    gameInitialized,
    incrementImagesLoaded,
    incrementImagesToLoad,
    setImageAsset,
    setAudioObjects
} from './gameState.js';

export function triggerGameLoadCheck() {
    console.log(`Load check: ${imagesLoadedCount} / ${imagesToLoadCount}, Game Initialized: ${gameInitialized}`);
    // Ensure all assets are accounted for and game hasn't started yet
    if (imagesLoadedCount >= imagesToLoadCount && !gameInitialized) {
        console.log('All assets loaded or timed out, initializing game.');
        // Import and call initializeGame dynamically to avoid circular dependency
        import('./gameCore.js').then(({ initializeGame }) => {
            initializeGame();
        });
    }
}

export function preloadImage(url, key) {
    incrementImagesToLoad();
    const img = new Image();
    img.src = url;
    img.onload = () => {
        incrementImagesLoaded();
        setImageAsset(key, img);
        console.log(`Loaded image: ${key} (${url})`);
        triggerGameLoadCheck();
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${key} (${url})`);
        incrementImagesLoaded(); // Still count it to not block game start indefinitely
        triggerGameLoadCheck();
    };
}

export function loadEnemyAssets() {
    console.log("Loading enemy assets...");
    if (ASSET_URLS.ENEMY_IMAGE_FILES.length === 0) {
        triggerGameLoadCheck();
        return;
    }
    ASSET_URLS.ENEMY_IMAGE_FILES.forEach(file => {
        preloadImage(ASSET_URLS.ENEMY_SPRITE_BASE + file, file);
    });
}

export function loadCharacterAssets() {
    console.log("Loading character assets...");
    const characters = Object.values(CHARACTERS);
    characters.forEach(character => {
        preloadImage(character.sprite, `character_${character.id}`);
    });
}

export function loadSpecialEnemyAssets() {
    console.log("Loading special enemy assets...");
    if (ASSET_URLS.SPECIAL_ENEMIES) {
        Object.entries(ASSET_URLS.SPECIAL_ENEMIES).forEach(([key, url]) => {
            preloadImage(url, `special_enemy_${key.toLowerCase()}`);
        });
    }
}

export function setupGameAssets() {
    console.log("Setting up game assets...");
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found during asset setup!');
        return;
    }
    loadEnemyAssets();
    loadCharacterAssets();
    loadSpecialEnemyAssets();
}

export function initializeAudio() {
    const audioMusic = new Audio(AUDIO_PATHS.MUSIC);
    const audioShoot = new Audio(AUDIO_PATHS.SHOOT);
    const audioPickup = new Audio(AUDIO_PATHS.PICKUP);
    const audioPlayerHit = new Audio(AUDIO_PATHS.PLAYER_HIT);
    const audioEnemyDie = new Audio(AUDIO_PATHS.ENEMY_DIE);

    // Configure audio settings
    audioMusic.loop = true;
    audioMusic.volume = 0.3;
    audioMusic.hasSuccessfullyPlayed = false;
    
    audioShoot.volume = 0.25;
    audioPickup.volume = 0.6;
    audioPlayerHit.volume = 0.7;
    audioEnemyDie.volume = 0.25;

    // Try to play music initially
    audioMusic.play().then(() => {
        audioMusic.hasSuccessfullyPlayed = true;
    }).catch(e => console.warn("Initial music play failed, likely due to autoplay policy. Will try on interaction.", e));

    // Update game state with audio objects
    setAudioObjects(audioMusic, audioShoot, audioPickup, audioPlayerHit, audioEnemyDie);

    return { audioMusic, audioShoot, audioPickup, audioPlayerHit, audioEnemyDie };
}

// Function to scale the game container to fit the window
export function scaleGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    // Import gameWidth and gameHeight dynamically to avoid circular dependency
    import('./gameState.js').then(({ gameWidth, gameHeight }) => {
        if (!gameContainer || typeof gameWidth === 'undefined' || typeof gameHeight === 'undefined') {
            return;
        }

        const scaleX = window.innerWidth / gameWidth;
        const scaleY = window.innerHeight / gameHeight;
        let scale = Math.min(scaleX, scaleY);
        scale = Math.max(scale, 0.1); // Prevent scale from being 0 or negative

        if (gameContainer && gameContainer.style) {
            gameContainer.style.transformOrigin = 'center center';
            gameContainer.style.transform = `scale(${scale})`;
        } else {
            console.error('gameContainer or gameContainer.style is null or undefined during scaling.');
        }
    });
} 