import { CommandContext } from "@rbxts/cmdr";
import { Events } from "../../network";

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        print(`🧹 Clearing hotbar for ${player.Name}`);
        
        // Crear hotbar vacío (9 slots undefined)
        const emptyHotbar = [];
        for (let i = 0; i < 9; i++) {
            emptyHotbar[i] = undefined;
        }
        
        // Enviar múltiples veces para asegurar
        Events.onHotbarUpdated.fire(player, emptyHotbar);
        wait(0.1);
        Events.onHotbarUpdated.fire(player, emptyHotbar);
        wait(0.1);
        Events.onHotbarUpdated.fire(player, emptyHotbar);
        
        return `✅ Hotbar cleared for ${player.Name}

📦 ESTADO ACTUAL:
✅ Todos los 9 slots del hotbar están vacíos
✅ Enviado 3 veces para asegurar sincronización
✅ Hotbar listo para testing de drag & drop

🎯 SIGUIENTE PASO:
1. Verifica que veas el hotbar vacío en pantalla
2. Usa 'testDrag' para añadir recursos y probar
3. Usa 'diagDrag' si necesitas diagnóstico completo`;
        
    } catch (error) {
        return `❌ Error clearing hotbar: ${error}`;
    }
}; 
