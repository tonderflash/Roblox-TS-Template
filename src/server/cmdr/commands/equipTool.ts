import { CommandDefinition } from "@rbxts/cmdr";

const equipToolCommand: CommandDefinition = {
    Name: "equipTool",
    Aliases: ["etool", "equip"],
    Description: "Equipa una herramienta específica",
    Group: "DefaultDev",
    Args: [
        {
            Type: "string",
            Name: "toolId",
            Description: "ID de la herramienta a equipar (bare_hands, stone_pick, stone_hatchet, metal_pick, metal_hatchet)"
        }
    ]
};

export = equipToolCommand; 
