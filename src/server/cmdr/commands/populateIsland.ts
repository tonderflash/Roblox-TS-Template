import { CommandDefinition } from "@rbxts/cmdr";

export = <CommandDefinition>{
	Name: "populateisland",
	Aliases: ["populate", "spawnnpcs"],
	Description: "Puebla una isla específica con NPCs",
	Group: "DefaultAdmin",
	Args: [
		{
			Type: "string",
			Name: "islandId",
			Description: "ID de la isla donde spawnear NPCs (ej: pirate_cove)"
		}
	]
}; 
