import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        if (!simpleBoatService.hasBoat(player)) {
            return `❌ ${player.Name} no tiene un barco spawneado\n\n🎮 Comandos disponibles:\n/spawnSimpleBoat - Spawna barco básico\n/spawnCustomBoat [modelo] - Spawna barco personalizado\n/listModels - Lista modelos disponibles`;
        }
        
        const boatInfo = simpleBoatService.getBoatInfo(player);
        
        if (boatInfo) {
            return boatInfo;
        } else {
            return `❌ Error obteniendo información del barco de ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
