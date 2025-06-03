import { Dependency } from "@flamework/core";
import { CommandContext } from "@rbxts/cmdr";
import { InventoryService } from "../../services/InventoryService";
import { Events } from "../../network";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        print(`🎯 Setting up drag & drop test for ${player.Name}`);
        
        // 1. Limpiar hotbar (enviar evento para limpiar en cliente)
        Events.onHotbarUpdated.fire(player, []);
        
        // 2. Dar recursos para testing con delays
        inventoryService.addResource(player, "wood", 25);
        wait(0.2);
        inventoryService.addResource(player, "rope", 15);
        wait(0.2);
        inventoryService.addResource(player, "cloth", 10);
        wait(0.2);
        inventoryService.addResource(player, "iron", 8);
        
        // 3. Abrir inventario automáticamente
        wait(0.5);
        Events.onInventoryOpened.fire(player);
        
        return `✅ Drag & Drop Test Setup Complete for ${player.Name}

📦 Inventory opened automatically
🎯 Resources added: 25 Wood, 15 Rope, 10 Cloth, 8 Iron

🎮 INSTRUCCIONES:
1. Doble-click en cualquier item del inventario → debe moverse al hotbar
2. Drag & drop: Mantén click y arrastra item al hotbar
3. Verifica que el hotbar esté visible en la parte inferior (9 slots)

🔧 Si no funciona:
- Usa 'diagDrag' para diagnóstico completo
- Usa 'debugHotbar' para ver estado del hotbar
- Verifica que el hotbar sea visible en pantalla`;
        
    } catch (error) {
        return `❌ Error setting up drag & drop test: ${error}`;
    }
}; 
