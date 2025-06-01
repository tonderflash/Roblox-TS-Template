import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ResourceService } from "../../services/ResourceService";

const resourceService = Dependency<ResourceService>();

function respawnResourcesCommand(context: CommandContext): string {
    try {
        resourceService.respawnAllResources();
        return "✅ Todos los recursos han sido respawneados con posiciones mejoradas!";
    } catch (error) {
        return `❌ Error al respawnear recursos: ${error}`;
    }
}

export = respawnResourcesCommand; 
