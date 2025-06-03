import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "speakerInfo",
    Aliases: ["bocina", "musicInfo"],
    Description: "Muestra información de la bocina del barco",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuya bocina consultar",
            Optional: true
        }
    ]
}); 
