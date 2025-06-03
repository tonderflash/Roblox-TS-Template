import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "toggleSpeaker",
    Aliases: ["pauseMusic", "playMusic", "toggleBocina"],
    Description: "Pausa/reanuda la música de la bocina del barco",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player", 
            Description: "Jugador cuya bocina controlar",
            Optional: true
        }
    ]
}); 
