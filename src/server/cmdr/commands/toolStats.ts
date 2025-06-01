import { CommandDefinition } from "@rbxts/cmdr";

const toolStatsCommand: CommandDefinition = {
    Name: "toolStats",
    Aliases: ["tstats", "toolinfo"],
    Description: "Muestra estadísticas detalladas de una herramienta específica",
    Group: "DefaultDev",
    Args: [
        {
            Type: "string",
            Name: "toolId",
            Description: "ID de la herramienta (bare_hands, stone_pick, stone_hatchet, metal_pick, metal_hatchet)"
        }
    ]
};

export = toolStatsCommand; 
