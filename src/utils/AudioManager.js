// Audio Manager - Handles background music and sound effects

class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.backgroundMusic = null;
        this.isMusicEnabled = true;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.hasPlayedMusic = false;
        
        // Initialize music when scene is ready
        this.initializeMusic();
    }
    
    initializeMusic() {
        try {
            // Create background music
            this.backgroundMusic = this.scene.sound.add('musicLoop', {
                loop: true,
                volume: this.musicVolume
            });
            
            console.log('Background music initialized');
            
            // Try to start music immediately (might fail due to autoplay policy)
            this.startMusic();
            
        } catch (error) {
            console.warn('Failed to initialize background music:', error);
        }
    }
    
    startMusic() {
        if (!this.backgroundMusic || !this.isMusicEnabled) return;
        
        try {
            if (!this.backgroundMusic.isPlaying) {
                this.backgroundMusic.play();
                this.hasPlayedMusic = true;
                console.log('Background music started');
            }
        } catch (error) {
            console.warn('Failed to start background music (likely autoplay restriction):', error);
            
            // Set up user interaction listener to start music
            this.setupUserInteractionListener();
        }
    }
    
    setupUserInteractionListener() {
        if (this.hasPlayedMusic) return;
        
        // Listen for any user interaction to start music
        const startMusicOnInteraction = () => {
            if (!this.hasPlayedMusic && this.backgroundMusic && this.isMusicEnabled) {
                try {
                    this.backgroundMusic.play();
                    this.hasPlayedMusic = true;
                    console.log('Background music started after user interaction');
                    
                    // Remove listeners once music has started
                    document.removeEventListener('click', startMusicOnInteraction);
                    document.removeEventListener('keydown', startMusicOnInteraction);
                    document.removeEventListener('touchstart', startMusicOnInteraction);
                } catch (error) {
                    console.warn('Failed to start music on user interaction:', error);
                }
            }
        };
        
        // Add interaction listeners
        document.addEventListener('click', startMusicOnInteraction);
        document.addEventListener('keydown', startMusicOnInteraction);
        document.addEventListener('touchstart', startMusicOnInteraction);
        
        console.log('Set up user interaction listeners for music');
    }
    
    pauseMusic() {
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.pause();
            console.log('Background music paused');
        }
    }
    
    resumeMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.isPlaying && this.isMusicEnabled) {
            try {
                this.backgroundMusic.resume();
                console.log('Background music resumed');
            } catch (error) {
                console.warn('Failed to resume background music:', error);
            }
        }
    }
    
    stopMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            console.log('Background music stopped');
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(this.musicVolume);
        }
        console.log(`Music volume set to: ${this.musicVolume}`);
    }
    
    toggleMusic() {
        this.isMusicEnabled = !this.isMusicEnabled;
        
        if (this.isMusicEnabled) {
            this.resumeMusic();
        } else {
            this.pauseMusic();
        }
        
        console.log(`Music ${this.isMusicEnabled ? 'enabled' : 'disabled'}`);
        return this.isMusicEnabled;
    }
    
    // Sound effect methods (for future use)
    playSound(soundKey, config = {}) {
        try {
            if (this.scene.sound.get(soundKey)) {
                const sound = this.scene.sound.play(soundKey, {
                    volume: config.volume || this.sfxVolume,
                    loop: config.loop || false,
                    rate: config.rate || 1
                });
                return sound;
            } else {
                console.warn(`Sound '${soundKey}' not found`);
            }
        } catch (error) {
            console.warn(`Failed to play sound '${soundKey}':`, error);
        }
        return null;
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`SFX volume set to: ${this.sfxVolume}`);
    }
    
    // Handle game state changes
    onGameStart() {
        this.startMusic();
    }
    
    onGamePause() {
        this.pauseMusic();
    }
    
    onGameResume() {
        this.resumeMusic();
    }
    
    onGameOver() {
        // Keep music playing even on game over
        // Could add different behavior here if needed
    }
    
    // Cleanup when scene is destroyed
    destroy() {
        if (this.backgroundMusic) {
            this.backgroundMusic.destroy();
            this.backgroundMusic = null;
        }
        console.log('AudioManager destroyed');
    }
    
    // Get current status
    getStatus() {
        return {
            isMusicEnabled: this.isMusicEnabled,
            isMusicPlaying: this.backgroundMusic ? this.backgroundMusic.isPlaying : false,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            hasPlayedMusic: this.hasPlayedMusic
        };
    }
}

export default AudioManager; 