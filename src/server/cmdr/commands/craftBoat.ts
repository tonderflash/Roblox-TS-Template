import { CommandDefinition } from "@rbxts/cmdr";

export = <CommandDefinition>{
	Name: "craftboat",
	Aliases: ["craft"],
	Description: "Craftea un barco usando materiales del jugador",
	Group: "DefaultAdmin",
	Args: [
		{
			Type: "player",
			Name: "player",
			Description: "Jugador que crafteará el barco"
		},
		{
			Type: "string",
			Name: "recipeId", 
			Description: "ID de la receta de crafting (ej: basic_fishing_boat)"
		}
	]
}; 
