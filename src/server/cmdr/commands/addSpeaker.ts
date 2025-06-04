import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "addSpeaker",
    Aliases: ["addBocina", "installSpeaker", "bocina"],
    Description: "Añade una bocina al barco para reproducir música",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador al que añadir bocina",
            Optional: true
        }
    ]
}); 
