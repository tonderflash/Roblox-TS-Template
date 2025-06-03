import { CommandDefinition } from "@rbxts/cmdr";

export = {
    Name: "adaptStoreBoat",
    Aliases: ["adaptboat", "fixboat"],
    Description: "Adapta un modelo de barco de la tienda para funcionar con el sistema",
    Group: "Admin",
    Args: [
        {
            Type: "string",
            Name: "modelName",
            Description: "Nombre del modelo en BoatModels a adaptar"
        }
    ],
} as CommandDefinition; 
