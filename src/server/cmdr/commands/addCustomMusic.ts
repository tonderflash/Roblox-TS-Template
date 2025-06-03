import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "addCustomMusic",
    Aliases: ["addMusic", "musicaPersonalizada"],
    Description: "Agrega una nueva canción personalizada al sistema de bocinas",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "string",
            Name: "musicName",
            Description: "Nombre para identificar la música"
        },
        {
            Type: "string", 
            Name: "musicId",
            Description: "ID de Roblox del audio (solo números)"
        }
    ]
}); 
