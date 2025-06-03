import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "changeSpeakerMusic",
    Aliases: ["changeMusic", "cambiarMusica"],
    Description: "Cambia la música de la bocina del barco",
    Group: "DefaultAdmin", 
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuya bocina cambiar música",
            Optional: true
        },
        {
            Type: "number",
            Name: "musicIndex",
            Description: "Índice de música (0-4)"
        }
    ]
}); 
