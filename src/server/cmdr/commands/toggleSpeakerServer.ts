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
        
        // Alternar estado de la bocina
        const success = simpleBoatService.toggleSpeaker(player);
        
        if (success) {
            return `🎵 ${player.Name}: Estado de música alternado en la bocina`;
        } else {
            return `❌ ${player.Name} no tiene bocina en su barco`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
