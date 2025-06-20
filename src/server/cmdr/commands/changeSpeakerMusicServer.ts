import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player, soundId?: string, musicName?: string) {
    const player = targetPlayer || context.Executor;
    
    if (!soundId) {
        return "❌ Debes proporcionar un ID de sonido";
    }
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Verificar que el jugador tenga un barco
        if (!simpleBoatService.isBoatSpawned(player)) {
            return `❌ ${player.Name} no tiene ningún barco spawneado`;
        }
        
        // Cambiar música de la bocina
        const success = simpleBoatService.changeSpeakerMusic(player, soundId, musicName);
        
        if (success) {
            const name = musicName || `Música ${soundId}`;
            return `🎵 ${player.Name}: Música cambiada a "${name}" (ID: ${soundId})`;
        } else {
            return `❌ ${player.Name} no tiene bocina en su barco`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
