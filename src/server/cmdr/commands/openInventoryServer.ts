import { CommandContext } from "@rbxts/cmdr";
import { Events } from "server/network";

export = function(context: CommandContext, targetPlayer?: Player) {
    const player = targetPlayer || context.Executor;
    
    try {
        // Disparar evento para abrir inventario en el cliente
        Events.onInventoryOpened.fire(player);
        
        return `📦 Inventario abierto para ${player.Name}. Usa tecla P para cerrar/abrir.`;
        
    } catch (error) {
        return `❌ Error abriendo inventario: ${error}`;
    }
}; 
