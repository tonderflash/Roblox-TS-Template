import { CommandDefinition } from "@rbxts/cmdr";

const listToolsCommand: CommandDefinition = {
    Name: "listTools",
    Aliases: ["ltools", "tools"],
    Description: "Lista todas las herramientas disponibles y la herramienta equipada actual",
    Group: "DefaultDev",
    Args: []
};

export = listToolsCommand; 
