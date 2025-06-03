import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, modelName: string) {
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        return simpleBoatService.adaptStoreBoatModel(context.Executor, modelName);
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
