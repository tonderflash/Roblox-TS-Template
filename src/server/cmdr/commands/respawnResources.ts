import { CommandDefinition } from "@rbxts/cmdr";

const respawnResourcesDefinition: CommandDefinition = {
    Name: "respawnResources",
    Aliases: ["respawnres", "resetres"],
    Description: "Respawnea todos los recursos con posiciones mejoradas usando raycast",
    Group: "Dev",
    Args: []
};

export = respawnResourcesDefinition; 
