import { CommandDefinition } from "@rbxts/cmdr";

const testHarvestCommand: CommandDefinition = {
    Name: "testHarvest",
    Aliases: ["harvest", "testhit"],
    Description: "Simula un hit de harvesting en el nodo de recursos más cercano",
    Group: "DefaultDev",
    Args: [
        {
            Type: "number",
            Name: "damage",
            Description: "Cantidad de daño a aplicar (opcional, por defecto usa daño de herramienta)",
            Optional: true
        }
    ]
};

export = testHarvestCommand; 
