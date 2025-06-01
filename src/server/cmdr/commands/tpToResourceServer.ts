import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ResourceService } from "../../services/ResourceService";
import { RESOURCE_TYPES } from "../../../shared/types/resources";

const resourceService = Dependency<ResourceService>();

function tpToResourceCommand(context: CommandContext, resourceType?: string): string {
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
        
        // Validar resourceType si se proporcionó
        const validResourceTypes = [RESOURCE_TYPES.WOOD, RESOURCE_TYPES.ROPE, RESOURCE_TYPES.CLOTH, RESOURCE_TYPES.IRON];
        if (resourceType) {
            let isValid = false;
            for (const validType of validResourceTypes) {
                if (resourceType === validType) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                return `❌ Tipo de recurso inválido. Tipos válidos: ${validResourceTypes.join(", ")}`;
            }
        }
        
        // Encontrar el nodo más cercano (filtrado por tipo si se especificó)
        let closestNode: { id: string; position: Vector3; distance: number; type: string } | undefined;
        
        resourceNodes.forEach((target, nodeId) => {
            // Si se especificó tipo, filtrar por ese tipo
            // Extraer tipo del nodeId (formato: "wood_node_1")
            const nodeResourceType = nodeId.split("_")[0];
            if (resourceType && nodeResourceType !== resourceType) {
                return; // Skip este nodo
            }
            
            const distance = playerPosition.sub(target.position).Magnitude;
            if (!closestNode || distance < closestNode.distance) {
                closestNode = { 
                    id: nodeId, 
                    position: target.position,
                    distance: distance,
                    type: nodeResourceType
                };
            }
        });
        
        if (!closestNode) {
            const typeFilter = resourceType ? ` de tipo ${resourceType}` : "";
            return `❌ No se encontró nodo de recursos${typeFilter}`;
        }
        
        // Teletransportar al jugador cerca del nodo
        const teleportPosition = closestNode.position.add(new Vector3(0, 5, 5)); // Un poco arriba y al lado
        character.SetPrimaryPartCFrame(new CFrame(teleportPosition));
        
        let result = `🚀 Teletransportado exitosamente!\n`;
        result += `📍 Nodo: ${closestNode.id}\n`;
        result += `🌿 Tipo: ${closestNode.type}\n`;
        result += `📏 Distancia original: ${math.floor(closestNode.distance)} studs\n`;
        result += `💡 TIP: Usa /testHarvest para golpear este nodo`;
        
        return result;
        
    } catch (error) {
        return `❌ Error durante teletransporte: ${error}`;
    }
}

export = tpToResourceCommand; 
