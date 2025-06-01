import { Dependency } from "@flamework/core";
import { CommandContext } from "@rbxts/cmdr";
import { InventoryService } from "../../services/InventoryService";
import { RESOURCE_TYPES } from "shared/types/resources";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext, resourceType: string, amount: number) {
    const player = context.Executor;
    
    // Validar que el tipo de recurso existe
    const validResources = ["wood", "rope", "cloth", "iron"];
    const normalizedResourceType = string.lower(resourceType);
    
    if (!validResources.includes(normalizedResourceType)) {
        return `❌ Tipo de recurso inválido. Tipos válidos: ${validResources.join(", ")}`;
    }
    
    // Validar cantidad
    if (amount <= 0 || amount > 1000) {
        return "❌ La cantidad debe estar entre 1 y 1000";
    }
    
    try {
        // Usar el método del InventoryService
        inventoryService.addResource(player, normalizedResourceType, amount);
        
        return `✅ Dado ${amount}x ${resourceType} a ${player.Name}`;
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
