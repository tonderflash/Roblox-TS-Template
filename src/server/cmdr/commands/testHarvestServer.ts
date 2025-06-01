import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ResourceService } from "../../services/ResourceService";
import { ToolService } from "../../services/ToolService";

const resourceService = Dependency<ResourceService>();
const toolService = Dependency<ToolService>();

function testHarvestCommand(context: CommandContext, damage?: number): string {
    const player = context.Executor;
    const character = player.Character;
    
    if (!character || !character.PrimaryPart) {
        return "❌ Character no encontrado o sin PrimaryPart";
    }
    
    try {
        const playerPosition = character.PrimaryPart.Position;
        const resourceNodes = resourceService.getAllResourceNodes();
        
        if (resourceNodes.size() === 0) {
            return "❌ No hay nodos de recursos disponibles";
        }
        
        // Encontrar el nodo más cercano
        let closestNode: { id: string; distance: number } | undefined;
        
        resourceNodes.forEach((target, nodeId) => {
            const distance = playerPosition.sub(target.position).Magnitude;
            if (!closestNode || distance < closestNode.distance) {
                closestNode = { id: nodeId, distance: distance };
            }
        });
        
        if (!closestNode) {
            return "❌ No se pudo encontrar nodo cercano";
        }
        
        // Calcular damage
        const currentTool = toolService.getPlayerTool(player);
        const toolData = toolService.getToolData(currentTool);
        const actualDamage = damage || toolData?.damage || 25;
        
        // Aplicar daño al nodo
        const nodeDestroyed = resourceService.damageResourceNode(
            closestNode.id, 
            actualDamage, 
            player, 
            currentTool
        );
        
        let result = `⛏️ Hit exitoso en nodo ${closestNode.id}\n`;
        result += `🔨 Herramienta usada: ${toolData?.displayName || "Desconocida"}\n`;
        result += `💥 Daño aplicado: ${actualDamage}\n`;
        result += `📏 Distancia: ${math.floor(closestNode.distance)} studs\n`;
        
        if (nodeDestroyed) {
            result += `💥 ¡Nodo destruido! Se respawneará en 60-120 segundos`;
        } else {
            result += `🟢 Nodo aún vivo`;
        }
        
        return result;
        
    } catch (error) {
        return `❌ Error durante harvest: ${error}`;
    }
}

export = testHarvestCommand; 
