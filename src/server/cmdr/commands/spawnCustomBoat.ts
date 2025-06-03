import { CommandDefinition } from "@rbxts/cmdr";

export = {
    Name: "spawnCustomBoat",
    Aliases: ["customboat", "myboat"],
    Description: "Spawna un barco personalizado desde ReplicatedStorage/BoatModels",
    Group: "Admin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador",
            Optional: true
        },
        {
            Type: "string",
            Name: "modelName",
            Description: "Nombre del modelo (opcional)",
            Optional: true
        }
    ],
} as CommandDefinition; 
