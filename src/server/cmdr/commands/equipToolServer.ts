import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ToolService } from "../../services/ToolService";
import { TOOL_TYPES, ToolType } from "../../../shared/types/harvesting";

const toolService = Dependency<ToolService>();

function equipToolCommand(context: CommandContext, toolId: string): string {
    const player = context.Executor;
    
    // Lista de herramientas válidas usando los valores directamente
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
        const success = toolService.equipTool(player, toolId as ToolType);
        
        if (success) {
            return `✅ ${player.Name} ahora tiene equipada: ${toolId}`;
        } else {
            return `❌ Error al equipar la herramienta: ${toolId}`;
        }
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}

export = equipToolCommand; 
