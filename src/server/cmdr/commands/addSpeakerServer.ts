import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player, musicIndex?: number) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Verificar que el jugador tenga un barco
        if (!simpleBoatService.isBoatSpawned(player)) {
            return `❌ ${player.Name} no tiene ningún barco spawneado. Usa spawnBoat primero.`;
        }
        
        // Agregar la bocina
        const success = simpleBoatService.addSpeakerToBoat(player, musicIndex);
        
        if (success) {
            return `🔊 ${player.Name}: Bocina agregada al barco con música por proximidad!`;
        } else {
            return `❌ No se pudo agregar la bocina al barco de ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
