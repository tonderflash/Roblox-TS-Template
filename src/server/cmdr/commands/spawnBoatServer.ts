import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        const success = simpleBoatService.spawnSimpleBoat(player);
        
        if (success) {
            return `✅ ${player.Name} spawneó barco exitosamente`;
        } else {
            return `❌ Error spawneando barco para ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
