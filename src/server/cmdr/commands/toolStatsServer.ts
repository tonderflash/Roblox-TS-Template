import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ToolService } from "../../services/ToolService";
import { TOOL_TYPES, ToolType } from "../../../shared/types/harvesting";

const toolService = Dependency<ToolService>();

function toolStatsCommand(context: CommandContext, toolId: string): string {
    const player = context.Executor;
    
    // Verificar que la herramienta es válida
    const validTools = [
        TOOL_TYPES.BARE_HANDS,
        TOOL_TYPES.STONE_PICK,
        TOOL_TYPES.STONE_HATCHET,
        TOOL_TYPES.METAL_PICK,
        TOOL_TYPES.METAL_HATCHET
    ];
    
    if (!validTools.includes(toolId as ToolType)) {
        return `❌ Herramienta inválida. Herramientas disponibles: ${validTools.join(", ")}`;
    }
    
    try {
        const toolData = toolService.getToolData(toolId as ToolType);
        const currentTool = toolService.getPlayerTool(player);
        
        if (!toolData) {
            return `❌ No se encontraron datos para la herramienta: ${toolId}`;
        }
        
        const isEquipped = toolId === currentTool;
        
        let result = `🔧 === ESTADÍSTICAS DE ${string.upper(toolData.displayName)} ===\n\n`;
        result += `📋 ID: ${toolData.id}\n`;
        result += `🏷️ Nombre: ${toolData.displayName}\n`;
        result += `⚡ Daño Base: ${toolData.damage}\n`;
        result += `📝 Descripción: ${toolData.description}\n`;
        result += `🎯 Estado: ${isEquipped ? "EQUIPADA" : "No equipada"}\n\n`;
        
        result += "📊 MULTIPLICADORES POR RECURSO:\n";
        toolData.resourceMultipliers.forEach((multiplier, resourceType) => {
            const effectiveness = multiplier > 1.5 ? "Excelente" : 
                                 multiplier > 1.0 ? "Buena" : 
                                 multiplier > 0.5 ? "Regular" : "Mala";
            const icon = multiplier > 1.5 ? "🟢" : 
                        multiplier > 1.0 ? "🟡" : 
                        multiplier > 0.5 ? "🟠" : "🔴";
            
            // Crear padding manual para el nombre del recurso
            const paddedResourceType = resourceType + "        ".sub(1, math.max(0, 8 - resourceType.size()));
            result += `${icon} ${paddedResourceType}: ${multiplier}x (${effectiveness})\n`;
        });
        
        result += `\n💡 TIP: Use esta herramienta para recursos con multiplicadores altos (🟢🟡)`;
        
        return result;
    } catch (error) {
        return `❌ Error al obtener estadísticas: ${error}`;
    }
}

export = toolStatsCommand; 
