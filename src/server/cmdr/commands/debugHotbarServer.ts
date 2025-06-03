import { CommandContext } from "@rbxts/cmdr";
import { Events } from "../../network";

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        print(`🔍 DEBUG HOTBAR STATE for ${player.Name}`);
        
        // Enviar comando para que el cliente reporte su estado
        Events.onHotbarUpdated.fire(player, []);
        
        return `🔍 DEBUG HOTBAR for ${player.Name}

📊 VERIFICACIONES REALIZADAS:
✅ Comando enviado al cliente
✅ Hotbar debería actualizarse en pantalla

🎯 QUE VERIFICAR VISUALMENTE:
1. ¿Ves el hotbar en la parte inferior de la pantalla?
2. ¿Tiene 9 slots numerados del 1 al 9?
3. ¿Los slots están vacíos o tienen items?
4. ¿El hotbar tiene colores/bordes visibles?

🔧 SIGUIENTE PASO:
Si el hotbar NO es visible:
- Usa 'clearHotbar' para forzar recreación
- Verifica que PlayerHUDController esté funcionando
- Mira logs del cliente para errores de GUI

Si el hotbar ES visible pero drag & drop no funciona:
- Usa 'diagDrag' para testing completo
- Verifica detección de posición del mouse`;
        
    } catch (error) {
        return `❌ Error debugging hotbar: ${error}`;
    }
}; 
