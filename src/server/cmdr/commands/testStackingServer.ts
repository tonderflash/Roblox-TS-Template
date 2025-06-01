import { Dependency } from "@flamework/core";
import { CommandContext } from "@rbxts/cmdr";
import { InventoryService } from "../../services/InventoryService";
import { getResource } from "shared/configs/resources";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext, resourceType: string, amount?: number) {
    const player = context.Executor;
    
    // Validar que el tipo de recurso existe
    const resource = getResource(string.lower(resourceType));
    if (!resource) {
        return `❌ Tipo de recurso inválido: ${resourceType}. Ejemplo: wood, rope, cloth, iron`;
    }
    
    // Usar cantidad que exceda el stack para probar límites
    const testAmount = amount || 150; // Por defecto 150 para probar límite de 100
    
    try {
        // Usar el método del InventoryService que ya maneja stacking
        inventoryService.addResource(player, resource.id, testAmount);
        
        return `✅ Test de stacking: Intentando dar ${testAmount}x ${resource.displayName} (${resource.icon}) a ${player.Name}
📦 Stack limit: ${resource.stackSize}
⚠️ Máximo efectivo: ${math.min(resource.stackSize, 100)}`;
    } catch (error) {
        return `❌ Error en test de stacking: ${error}`;
    }
}; 
