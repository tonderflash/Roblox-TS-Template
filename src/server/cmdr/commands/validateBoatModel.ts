import { CommandDefinition } from "@rbxts/cmdr";

export = {
    Name: "validateBoatModel",
    Aliases: ["validateboat", "checkboat"],
    Description: "Valida la estructura de un modelo de barco",
    Group: "Admin",
    Args: [
        {
            Type: "string",
            Name: "modelName",
            Description: "Nombre del modelo a validar"
        }
    ],
} as CommandDefinition; 
