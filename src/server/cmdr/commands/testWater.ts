import { CommandDefinition } from "@rbxts/cmdr";

export = <CommandDefinition>{
	Name: "testwater",
	Aliases: ["testagua", "water"],
	Description: "Prueba el sistema de agua y reporta el estado",
	Group: "DefaultAdmin",
	Args: [
		{
			Type: "player",
			Name: "player",
			Description: "Jugador a testear (opcional)",
			Optional: true
		}
	],
}; 
