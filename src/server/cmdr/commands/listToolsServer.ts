import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ToolService } from "../../services/ToolService";

const toolService = Dependency<ToolService>();

function listToolsCommand(context: CommandContext): string {
    const player = context.Executor;
    
    try {
        const currentTool = toolService.getPlayerTool(player);
        const currentToolData = toolService.getToolData(currentTool);
        const allTools = toolService.getAllTools();
        
        let result = `🔨 === HERRAMIENTAS DISPONIBLES PARA ${player.Name} ===\n\n`;
        result += `🎯 HERRAMIENTA ACTUAL: ${currentToolData?.displayName || "Desconocida"}\n\n`;
        
        result += "📋 TODAS LAS HERRAMIENTAS:\n";
        
        allTools.forEach((toolData, toolType) => {
            const isEquipped = toolType === currentTool;
            const status = isEquipped ? " [EQUIPADA]" : "";
            
            result += `\n🔧 ${toolData.displayName}${status}\n`;
            result += `   ID: ${toolData.id}\n`;
            result += `   Daño: ${toolData.damage}\n`;
            result += `   Descripción: ${toolData.description}\n`;
            
            // Mostrar multiplicadores de recursos
            result += "   Multiplicadores:\n";
            toolData.resourceMultipliers.forEach((multiplier, resourceType) => {
                const icon = multiplier > 1.0 ? "📈" : multiplier < 1.0 ? "📉" : "➖";
                result += `     ${icon} ${resourceType}: ${multiplier}x\n`;
            });
        });
        
        return result;
    } catch (error) {
        return `❌ Error al listar herramientas: ${error}`;
    }
}

export = listToolsCommand; 
