import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        if (!simpleBoatService.hasBoat(player)) {
            return `❌ ${player.Name} no tiene un barco spawneado`;
        }
        
        const success = simpleBoatService.despawnBoat(player);
        
        if (success) {
            return `✅ Barco de ${player.Name} despawneado exitosamente`;
        } else {
            return `❌ Error despawneando barco de ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
