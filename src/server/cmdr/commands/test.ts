import { CommandDefinition } from "@rbxts/cmdr";

const testCommand: CommandDefinition = {
    Name: "test",
    Aliases: ["t"],
    Description: "Comando de prueba para verificar si CMDR funciona",
    Group: "DefaultUtil",
    Args: []
};

export = testCommand; 
