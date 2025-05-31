import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { BoatService } from "server/services/BoatService";
import { getBoatTemplate, calculateBoatStats } from "shared/configs/boats";

export = function(context: CommandContext, targetPlayer: Player, boatId: string) {
    const boatService = Dependency<BoatService>();
    
    // Verificar que el template del barco existe
    const template = getBoatTemplate(boatId);
    if (!template) {
        return `❌ Barco no encontrado: ${boatId}. Usa 'listboats' para ver opciones.`;
    }

    // Obtener el barco actual del jugador
    const currentBoat = boatService.getPlayerBoat(targetPlayer);
    if (!currentBoat) {
        return `❌ Error: ${targetPlayer.Name} no tiene datos de barco inicializados.`;
    }

    // Despawnear barco actual si está spawneado
    if (currentBoat.isSpawned) {
        boatService.despawnBoat(targetPlayer);
    }

    // Cambiar el template del barco
    currentBoat.templateId = boatId;
    currentBoat.currentStats = calculateBoatStats(boatId, currentBoat.upgrades);
    currentBoat.health = currentBoat.currentStats.maxHealth; // Salud completa

    const tierEmoji = template.tier === "basic" ? "🔰" : 
                     template.tier === "improved" ? "⚡" : "💎";
    
    return `${tierEmoji} ${targetPlayer.Name} recibió el barco: ${template.displayName}\n` +
           `📊 Stats: HP ${template.baseStats.maxHealth}, Speed ${template.baseStats.speed}, Cannons ${template.baseStats.cannonCount}\n` +
           `💰 Valor: $${template.cost} Robux\n` +
           `💡 El jugador puede usar 'spawnboat' para invocarlo`;
}; 
