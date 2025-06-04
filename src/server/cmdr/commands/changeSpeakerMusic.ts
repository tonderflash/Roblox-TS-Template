import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "changeSpeakerMusic",
    Aliases: ["changeMusic", "setMusic", "musicaBocina"],
    Description: "Cambia la música de la bocina del barco",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuya música cambiar",
            Optional: true
        },
        {
            Type: "string",
            Name: "soundId",
            Description: "ID del sonido de Roblox"
        },
        {
            Type: "string",
            Name: "musicName",
            Description: "Nombre de la música",
            Optional: true
        }
    ]
}); 
