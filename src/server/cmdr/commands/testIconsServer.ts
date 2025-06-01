import { Dependency } from "@flamework/core";
import { CommandContext } from "@rbxts/cmdr";
import { InventoryService } from "../../services/InventoryService";
import { RESOURCES } from "shared/configs/resources";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        // Dar 1 de cada recurso básico para probar iconos
        const basicResources = ["wood", "rope", "cloth", "iron"];
        
        let result = "🎨 Prueba de iconos para recursos básicos:\n\n";
        
        for (const resourceType of basicResources) {
            const resource = RESOURCES[resourceType];
            if (resource) {
                inventoryService.addResource(player, resourceType, 1);
                result += `${resource.icon} ${resource.displayName} (${resourceType}): ${resource.icon}\n`;
            }
        }
        
        result += "\n📋 INFORMACIÓN DE DEBUG:";
        result += "\n🪵 Madera: debería mostrarse como tronco";
        result += "\n🪢 Cuerda: debería mostrarse como nudo"; 
        result += "\n🧵 Tela: debería mostrarse como hilo";
        result += "\n🔩 Hierro: debería mostrarse como tornillo";
        
        result += "\n\n📦 Abre tu inventario (tecla P) para verificar si los iconos se muestran correctamente.";
        result += "\nSi ves cuadrados blancos o símbolos extraños, el emoji no es compatible.";
        result += "\nRevisa la consola del cliente para mensajes de debug detallados.";
        
        return result;
        
    } catch (error) {
        return `❌ Error testing icons: ${error}`;
    }
}; 
