import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext) {
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        return simpleBoatService.listAvailableBoatModels();
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
