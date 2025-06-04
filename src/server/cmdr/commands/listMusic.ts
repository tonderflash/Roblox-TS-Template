import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "listMusic",
    Aliases: ["music", "musicList", "listaMusica"],
    Description: "Muestra una lista de música popular disponible para las bocinas",
    Group: "DefaultAdmin",
    Args: []
}); 
