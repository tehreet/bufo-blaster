// Upgrade System
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG } from './constants.js';
import { 
    shootInterval,
    updateShootInterval,
    updatePlayerSpeed,
    updateXpOrbPickupRadius,
    updateProjectileDamage,
    updatePlayerHealth,
    playerHealth,
    playerSpeed,
    xpOrbPickupRadius,
    projectileDamage,
    shootIntervalId,
    healthRegenIntervalId,
    currentPlayerHealthRegenInterval,
    currentPlayerHealthRegenAmount,
    setIntervals,
    setCurrentUpgradeSelectionIndex,
    setUpgradeButtonStates,
    setAvailableUpgrades
} from './gameState.js';

// Upgrade Definitions
export const allUpgrades = [
    {
        name: "Rapid Fire",
        description: "Increases attack speed by 15%.",
        apply: () => { 
            const newInterval = shootInterval * 0.85;
            updateShootInterval(newInterval);
            
            // Restart shooting interval
            if (shootIntervalId) clearInterval(shootIntervalId);
            const newShootIntervalId = setInterval(() => {
                import('./entities.js').then(({ shootProjectile }) => {
                    shootProjectile();
                });
            }, newInterval);
            setIntervals(null, newShootIntervalId, null);
            
            console.log(`Attack speed increased. New interval: ${newInterval}`);
        }
    },
    {
        name: "Vitality Spores",
        description: "Speeds up health regeneration by 3 seconds (max 1 HP/sec).",
        apply: () => {
            const reduction = 3000; // Regenerate 3 seconds faster
            const minInterval = 1000; // Minimum interval of 1 second
            const newInterval = Math.max(minInterval, currentPlayerHealthRegenInterval - reduction);
            
            // Restart the health regeneration interval with the new speed
            if (healthRegenIntervalId) clearInterval(healthRegenIntervalId);
            const newHealthRegenId = setInterval(() => {
                import('./gameCore.js').then(({ regeneratePlayerHealth }) => {
                    regeneratePlayerHealth();
                });
            }, newInterval);
            setIntervals(null, null, newHealthRegenId);
            
            console.log(`Health regeneration interval decreased to: ${newInterval}ms`);
        }
    },
    {
        name: "Greater Greed",
        description: "Increases XP orb pickup range by 25.",
        apply: () => {
            const newRadius = xpOrbPickupRadius + 25;
            updateXpOrbPickupRadius(newRadius);
            console.log(`XP Orb pickup radius increased to: ${newRadius}`);
        }
    },
    {
        name: "More Damage",
        description: "Your projectiles deal more damage.",
        apply: () => {
            const newDamage = projectileDamage + 1;
            updateProjectileDamage(newDamage);
            console.log(`Upgrade: More Damage! New damage: ${newDamage}`);
        }
    },
    {
        name: "Increased Speed",
        description: "Increases Bufo's movement speed.",
        apply: () => {
            const newSpeed = playerSpeed + 0.5;
            updatePlayerSpeed(newSpeed);
            console.log(`Upgrade: Increased Speed! New speed: ${newSpeed}`);
        }
    },
    {
        name: "Health Pack",
        description: "Restores 25 health.",
        apply: () => {
            const newHealth = Math.min(DEFAULT_GAME_SETTINGS.playerHealth, playerHealth + 25);
            updatePlayerHealth(newHealth);
            console.log(`Upgrade: Health Pack! Current health: ${newHealth}`);
        }
    }
];

export function presentUpgradeOptions(count = 3) {
    setCurrentUpgradeSelectionIndex(0); // Reset selection to first option
    setUpgradeButtonStates(false, false, false); // Clear button edge states
    
    // Pause the engine runner
    import('./gameState.js').then(({ runnerInstance }) => {
        if (runnerInstance) {
            const { Runner } = Matter;
            Runner.stop(runnerInstance);
        }
    });
    
    const shuffledUpgrades = [...allUpgrades].sort(() => 0.5 - Math.random());
    const selectedUpgrades = [];
    for (let i = 0; i < Math.min(count, shuffledUpgrades.length); i++) {
        selectedUpgrades.push(shuffledUpgrades[i]);
    }
    
    setAvailableUpgrades(selectedUpgrades);
} 