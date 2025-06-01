import { CommandDefinition } from "@rbxts/cmdr";

export = <CommandDefinition>{
    Name: "tptoisle",
    Aliases: ["tpi", "teleportisland"],
    Description: "Teleporta un jugador a una isla específica",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "jugador",
            Description: "El jugador a teleportar"
        },
        {
            Type: "string",
            Name: "islandId",
            Description: "ID de la isla (usa 'listislands' para ver opciones)"
        }
    ]
}; 
