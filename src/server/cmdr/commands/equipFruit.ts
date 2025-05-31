import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
	Name: "equipfruit",
	Aliases: ["equip"],
	Description: "Equipa una fruta del diablo",
	Group: "Admin",
	Args: [
		{
			Type: "string",
			Name: "fruitId",
			Description: "ID de la fruta (fire, lightning, ice, darkness, light)"
		}
	],
}); 
