import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "listMusic",
    Aliases: ["music", "songs"],
    Description: "Lista toda la música disponible para bocinas de barcos",
    Group: "DefaultAdmin",
    Args: []
}); 
