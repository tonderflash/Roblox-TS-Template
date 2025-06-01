import { CommandDefinition } from "@rbxts/cmdr";

export = <CommandDefinition>{
	Name: "despawnboat",
	Aliases: ["db", "despawn"],
	Description: "Despawnea el barco de un jugador",
	Group: "DefaultAdmin",
	Args: [
		{
			Type: "player",
			Name: "jugador",
			Description: "El jugador cuyo barco será despawneado"
		}
	],
}; 
