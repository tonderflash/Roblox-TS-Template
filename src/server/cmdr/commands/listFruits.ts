import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
	Name: "listfruits",
	Aliases: ["fruits"],
	Description: "Lista todas las frutas del diablo disponibles",
	Group: "DefaultUtil",
	Args: [],
}); 
