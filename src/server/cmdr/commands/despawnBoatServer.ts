import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { BoatService } from "server/services/BoatService";

export = function(context: CommandContext, targetPlayer: Player) {
    const boatService = Dependency<BoatService>();
    
    // Obtener el barco del jugador
    const boat = boatService.getPlayerBoat(targetPlayer);
    if (!boat) {
        return `❌ Error: ${targetPlayer.Name} no tiene datos de barco inicializados.`;
    }

    // Verificar si tiene un barco spawneado
    if (!boat.isSpawned) {
        return `⚠️ ${targetPlayer.Name} no tiene ningún barco spawneado.`;
    }

    // Intentar despawnear el barco
    const success = boatService.despawnBoat(targetPlayer);
    
    if (success) {
        return `🚢 ✅ Barco despawneado exitosamente!\n` +
               `👤 Jugador: ${targetPlayer.Name}\n` +
               `💾 El barco fue guardado y puede ser spawneado nuevamente con 'spawnboat'`;
    } else {
        return `❌ Error al despawnear el barco de ${targetPlayer.Name}. Revisa la consola para más detalles.`;
    }
}; 
