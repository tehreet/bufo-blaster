// Upgrade System
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG } from './constants.js';
import { 
    shootInterval,
    updateShootInterval,
    updatePlayerSpeed,
    updateXpOrbPickupRadius,
    updateProjectileDamage,
    updatePlayerHealth,
    updateHealthRegenInterval,
    playerHealth,
    playerSpeed,
    xpOrbPickupRadius,
    projectileDamage,
    shootIntervalId,
    healthRegenIntervalId,
    currentPlayerHealthRegenInterval,
    currentPlayerHealthRegenAmount,
    currentAuraCooldown,
    currentAuraDamage,
    currentAuraKnockback,
    setIntervals,
    setCurrentUpgradeSelectionIndex,
    setUpgradeButtonStates,
    setAvailableUpgrades,
    setAuraCooldown,
    setAuraDamage,
    setAuraKnockback
} from './gameState.js';

// Upgrade Definitions
export const allUpgrades = [
    {
        name: "Ability Haste",
        description: "Reduces ability cooldown by 15% (aura ticks faster).",
        apply: () => { 
            // Reduce aura tick interval for faster damage/knockback
            const newInterval = Math.max(200, Math.floor(currentAuraCooldown * 0.85)); // Min 200ms
            setAuraCooldown(newInterval);
            console.log(`Ability cooldown reduced. New aura interval: ${newInterval}ms`);
        }
    },
    {
        name: "Vitality Spores",
        description: "Speeds up health regeneration by 3 seconds (max 1 HP/sec).",
        apply: () => {
            const reduction = 3000; // Regenerate 3 seconds faster
            const minInterval = 1000; // Minimum interval of 1 second
            const newInterval = Math.max(minInterval, currentPlayerHealthRegenInterval - reduction);
            
            // Update the interval value
            updateHealthRegenInterval(newInterval);
            
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
        name: "Ability Power",
        description: "Increases ability damage by 25% (stronger aura).",
        apply: () => {
            // Increase aura damage and knockback
            const newDamage = currentAuraDamage * 1.25;
            const newKnockback = currentAuraKnockback * 1.15;
            
            setAuraDamage(newDamage);
            setAuraKnockback(newKnockback);
            
            console.log(`Ability Power increased! Damage: ${newDamage.toFixed(2)}, Knockback: ${newKnockback.toFixed(1)}`);
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