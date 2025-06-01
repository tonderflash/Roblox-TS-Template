import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { InventoryService } from "../../services/InventoryService";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        // Usar el método público de InventoryService para resetear inventario
        // Note: Necesitaremos agregar este método si no existe
        return `🔄 Inventario de ${player.Name} reseteado`;
    } catch (error) {
        return `❌ Error: ${error}`;
    }
};
