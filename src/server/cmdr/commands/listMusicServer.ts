import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext) {
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Obtener lista de música disponible
        const musicList = simpleBoatService.listAvailableMusic();
        
        return musicList;
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
