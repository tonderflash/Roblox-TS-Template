import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { BoatService } from "server/services/BoatService";
import { getBoatTemplate } from "shared/configs/boats";

export = function(context: CommandContext, targetPlayer: Player) {
    const boatService = Dependency<BoatService>();
    
    // Obtener el barco del jugador
    const boat = boatService.getPlayerBoat(targetPlayer);
    if (!boat) {
        return `❌ Error: ${targetPlayer.Name} no tiene datos de barco inicializados.`;
    }

    // Verificar si ya tiene un barco spawneado
    if (boat.isSpawned) {
        return `⚠️ ${targetPlayer.Name} ya tiene su barco spawneado. Usa 'despawnboat' primero.`;
    }

    // Obtener template para mostrar información
    const template = getBoatTemplate(boat.templateId);
    if (!template) {
        return `❌ Error: Template de barco no encontrado: ${boat.templateId}`;
    }

    // Intentar spawnear el barco
    const success = boatService.spawnBoat(targetPlayer);
    
    if (success) {
        const tierEmoji = template.tier === "basic" ? "🔰" : 
                         template.tier === "improved" ? "⚡" : "💎";
        
        return `🚢 ${tierEmoji} Barco spawneado exitosamente!\n` +
               `👤 Jugador: ${targetPlayer.Name}\n` +
               `🛥️ Barco: ${template.displayName}\n` +
               `💚 Salud: ${boat.health}/${boat.currentStats.maxHealth}\n` +
               `🏃 Velocidad: ${boat.currentStats.speed}\n` +
               `💥 Cañones: ${boat.currentStats.cannonCount} (${boat.currentStats.cannonDamage} daño c/u)\n` +
               `🛡️ Armadura: ${boat.currentStats.armor}\n` +
               `📦 Upgrades aplicados: ${boat.upgrades.size()}\n` +
               `🎨 Customizaciones: ${boat.customizations.size()}`;
    } else {
        return `❌ Error al spawnear el barco de ${targetPlayer.Name}. Revisa la consola para más detalles.`;
    }
}; 
