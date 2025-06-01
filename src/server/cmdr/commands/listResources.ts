import { CommandDefinition } from "@rbxts/cmdr";

const listResourcesDefinition: CommandDefinition = {
	Name: "listResources",
	Aliases: ["listres", "lr"],
	Description: "Lista todos los nodos de recursos activos y sus posiciones",
	Group: "Dev",
	Args: []
};

export = listResourcesDefinition; 
