import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ResourceService } from "../../services/ResourceService";

const resourceService = Dependency<ResourceService>();

function listResourcesCommand(context: CommandContext): string {
    try {
        const resourceNodes = resourceService.getAllResourceNodes();
        
        if (resourceNodes.size() === 0) {
            return "❌ No hay nodos de recursos activos";
        }
        
        let result = `📦 Recursos activos (${resourceNodes.size()}):\n`;
        
        resourceNodes.forEach((target, nodeId) => {
            const pos = target.position;
            const resourceType = nodeId.split("_")[0];
            result += `  🌿 ${nodeId} (${resourceType}) - Pos: ${math.floor(pos.X)}, ${math.floor(pos.Y)}, ${math.floor(pos.Z)}\n`;
        });
        
        return result;
    } catch (error) {
        return `❌ Error al listar recursos: ${error}`;
    }
}

export = listResourcesCommand; 
