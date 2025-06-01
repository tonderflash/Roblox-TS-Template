import { CommandDefinition } from "@rbxts/cmdr";

const tpToResourceCommand: CommandDefinition = {
    Name: "tpToResource",
    Aliases: ["tpres", "gotoResource"],
    Description: "Teletransporta al nodo de recursos más cercano",
    Group: "DefaultDev",
    Args: [
        {
            Type: "string",
            Name: "resourceType",
            Description: "Tipo de recurso específico (opcional: wood, rope, cloth, iron)",
            Optional: true
        }
    ]
};

export = tpToResourceCommand; 
