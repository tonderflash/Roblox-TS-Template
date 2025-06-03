import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "addSpeaker",
    Aliases: ["speaker", "addBocina", "bocina"],
    Description: "Agrega una bocina con música al barco para audio por proximidad",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player", 
            Name: "player",
            Description: "Jugador al que agregar la bocina al barco",
            Optional: true
        },
        {
            Type: "number",
            Name: "musicIndex", 
            Description: "Índice de música (0-4, opcional - aleatorio si no se especifica)",
            Optional: true
        }
    ]
}); 
