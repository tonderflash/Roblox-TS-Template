import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer: Player | undefined, musicIndex: number) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Verificar que el jugador tenga un barco
        if (!simpleBoatService.isBoatSpawned(player)) {
            return `❌ ${player.Name} no tiene ningún barco spawneado`;
        }
        
        // Cambiar la música
        const success = simpleBoatService.changeSpeakerMusic(player, musicIndex);
        
        if (success) {
            return `🎵 ${player.Name}: Música cambiada exitosamente (índice ${musicIndex})`;
        } else {
            return `❌ No se pudo cambiar la música de ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
