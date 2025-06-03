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
        
        // Remover la bocina
        const success = simpleBoatService.removeSpeakerFromBoat(player);
        
        if (success) {
            return `🗑️ ${player.Name}: Bocina removida del barco exitosamente`;
        } else {
            return `❌ ${player.Name} no tiene bocina en su barco para remover`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
