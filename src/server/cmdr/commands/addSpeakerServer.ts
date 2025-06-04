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
        
        // Añadir bocina al barco
        const success = simpleBoatService.addSpeakerToBoat(player);
        
        if (success) {
            return `🎵 ${player.Name}: Bocina añadida al barco exitosamente`;
        } else {
            return `❌ ${player.Name} ya tiene una bocina en su barco`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
