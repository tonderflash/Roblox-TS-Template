import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "removeCustomMusic",
    Aliases: ["removeMusic", "deleteMusic"],
    Description: "Remueve una canción personalizada del sistema",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "string",
            Name: "musicName",
            Description: "Nombre de la música a remover"
        }
    ]
}); 
