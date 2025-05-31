import { CommandDefinition } from "@rbxts/cmdr";

export = <CommandDefinition>{
	Name: "listresources",
	Aliases: ["resources", "listres"],
	Description: "Muestra los recursos de un jugador",
	Group: "DefaultAdmin",
	Args: [
		{
			Type: "player",
			Name: "player",
			Description: "Jugador del cual ver recursos"
		}
	]
}; 
