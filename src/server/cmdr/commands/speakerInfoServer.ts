import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Verificar que el jugador tenga un barco
        if (!simpleBoatService.isBoatSpawned(player)) {
            return `❌ ${player.Name} no tiene ningún barco spawneado`;
        }
        
        // Obtener información de la bocina
        const info = simpleBoatService.getSpeakerInfo(player);
        
        if (info) {
            return info;
        } else {
            return `❌ Error obteniendo información de la bocina de ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
