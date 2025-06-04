import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player, volume?: number) {
    const player = targetPlayer || context.Executor;
    
    if (volume === undefined) {
        return "❌ Debes proporcionar un valor de volumen (0-100)";
    }
    
    if (volume < 0 || volume > 100) {
        return "❌ El volumen debe estar entre 0 y 100";
    }
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Verificar que el jugador tenga un barco
        if (!simpleBoatService.isBoatSpawned(player)) {
            return `❌ ${player.Name} no tiene ningún barco spawneado`;
        }
        
        // Cambiar volumen (convertir de 0-100 a 0-1)
        const normalizedVolume = volume / 100;
        const success = simpleBoatService.setSpeakerVolume(player, normalizedVolume);
        
        if (success) {
            return `🔊 ${player.Name}: Volumen cambiado a ${volume}%`;
        } else {
            return `❌ ${player.Name} no tiene bocina en su barco`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
