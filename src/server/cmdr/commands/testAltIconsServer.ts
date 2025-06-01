import { Dependency } from "@flamework/core";
import { CommandContext } from "@rbxts/cmdr";
import { InventoryService } from "../../services/InventoryService";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        // Dar recursos básicos para probar iconos alternativos
        const basicResources = ["wood", "rope", "cloth", "iron"];
        
        let result = "🔄 Prueba de iconos ALTERNATIVOS para recursos básicos:\n\n";
        
        for (const resourceType of basicResources) {
            inventoryService.addResource(player, resourceType, 1);
        }
        
        result += "🌲 Madera: debería mostrarse como árbol (alternativo a 🪵)";
        result += "\n🎗️ Cuerda: debería mostrarse como cinta (alternativo a 🪢)"; 
        result += "\n🧶 Tela: debería mostrarse como ovillo (alternativo a 🧵)";
        result += "\n⚫ Hierro: debería mostrarse como círculo negro (alternativo a 🔩)";
        
        result += "\n\n📦 Abre tu inventario (tecla P) para verificar si estos iconos alternativos funcionan mejor.";
        result += "\nEste comando agrega más recursos para testing de iconos.";
        result += "\nUsa /resetInventory si necesitas limpiar el inventario.";
        
        return result;
        
    } catch (error) {
        return `❌ Error testing alternative icons: ${error}`;
    }
}; 
