import { CommandDefinition } from "@rbxts/cmdr";

export = {
    Name: "spawnSimpleBoat",
    Aliases: ["simpleboat", "testboat"],
    Description: "Spawna un barco SIMPLE que FUNCIONA",
    Group: "Admin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador",
            Optional: true
        }
    ],
} as CommandDefinition; 
