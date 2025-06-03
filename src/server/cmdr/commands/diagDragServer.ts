import { Dependency } from "@flamework/core";
import { CommandContext } from "@rbxts/cmdr";
import { InventoryService } from "../../services/InventoryService";
import { Events } from "../../network";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext) {
    const player = context.Executor;
    
    try {
        print(`🔍 DIAGNÓSTICO COMPLETO DE DRAG & DROP para ${player.Name}`);
        print(`==========================================`);
        
        // 1. Limpiar estado
        print(`📋 1. Limpiando estado del hotbar...`);
        Events.onHotbarUpdated.fire(player, []);
        
        wait(0.5);
        
        // 2. Añadir recursos mínimos para testing
        print(`📋 2. Añadiendo recursos de testing...`);
        inventoryService.addResource(player, "wood", 5);
        inventoryService.addResource(player, "rope", 3);
        
        wait(0.5);
        
        // 3. Abrir inventario
        print(`📋 3. Abriendo inventario...`);
        Events.onInventoryOpened.fire(player);
        
        wait(0.5);
        
        print(`📋 4. Estado listo para diagnóstico`);
        print(`==========================================`);
        
        return `🔍 DIAGNÓSTICO COMPLETO DE DRAG & DROP

📊 ESTADO ACTUAL:
✅ Hotbar limpiado
✅ Recursos añadidos: 5 Wood, 3 Rope
✅ Inventario abierto automáticamente

🎯 PRUEBAS A REALIZAR:

PRUEBA 1 - Doble Click:
→ Haz doble click rápido en un item del inventario
→ Debe moverse automáticamente al hotbar
→ Mira la consola para logs de "🖱️ Doble click detectado"

PRUEBA 2 - Drag & Drop:
→ Mantén click en un item y arrastra
→ Debe aparecer frame visual siguiendo el mouse
→ Mira logs de "🎯 Iniciando drag" y "🎯 Drag iniciado"
→ Suelta sobre hotbar (parte inferior pantalla)
→ Mira logs de "✅ Mouse sobre hotbar" vs "❌ Target inválido"

🔧 DEBUGGING AVANZADO:
Si drag & drop falla, revisa estos logs en consola:
- "📍 Mouse sobre hotbar" = detección posicional OK
- "✅ Target válido" = detección por jerarquía OK
- "❌ Target inválido" = problema de detección

📍 POSICIÓN DEL HOTBAR:
- Debe estar en la parte inferior central de la pantalla
- 9 slots horizontales con números 1-9
- Color de fondo y bordes visibles

🚨 SI PERSISTEN PROBLEMAS:
1. Usa 'debugHotbar' para verificar estado interno
2. Verifica que veas el hotbar en pantalla
3. Prueba con diferentes recursos
4. Mira logs del cliente en Developer Console`;
        
    } catch (error) {
        return `❌ Error en diagnóstico: ${error}`;
    }
}; 
