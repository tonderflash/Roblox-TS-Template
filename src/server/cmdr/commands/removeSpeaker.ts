import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "removeSpeaker", 
    Aliases: ["removeBocina", "deleteSpeaker"],
    Description: "Remueve la bocina del barco",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuya bocina remover",
            Optional: true
        }
    ]
}); 
