import { CommandContext } from "@rbxts/cmdr";
import { BOAT_TEMPLATES } from "shared/configs/boats";

export = function(context: CommandContext) {
    const output: string[] = [];
    output.push("🚢 === BARCOS DISPONIBLES ===");
    output.push("");

    // Agrupar por tier
    const basicBoats: string[] = [];
    const improvedBoats: string[] = [];
    const legendaryBoats: string[] = [];

    for (const [id, template] of pairs(BOAT_TEMPLATES)) {
        const boatInfo = `${template.displayName} (${id}) - $${template.cost} Robux`;
        const statsInfo = `  HP: ${template.baseStats.maxHealth}, Speed: ${template.baseStats.speed}, Cannons: ${template.baseStats.cannonCount}`;
        
        if (template.tier === "basic") {
            basicBoats.push(boatInfo);
            basicBoats.push(statsInfo);
        } else if (template.tier === "improved") {
            improvedBoats.push(boatInfo);
            improvedBoats.push(statsInfo);
        } else if (template.tier === "legendary") {
            legendaryBoats.push(boatInfo);
            legendaryBoats.push(statsInfo);
        }
    }

    // Mostrar por categorías
    output.push("🔰 TIER 1 - BÁSICOS (Gratis):");
    basicBoats.forEach(boat => output.push(boat));
    output.push("");

    output.push("⚡ TIER 2 - MEJORADOS ($299-699 Robux):");
    improvedBoats.forEach(boat => output.push(boat));
    output.push("");

    output.push("💎 TIER 3 - LEGENDARIOS ($999-1499 Robux):");
    legendaryBoats.forEach(boat => output.push(boat));
    output.push("");

    output.push("💡 Usa 'giveboat [jugador] [barcoId]' para dar un barco");
    output.push("💡 Usa 'spawnboat [jugador]' para spawnear el barco del jugador");

    return output.join("\n");
}; 
