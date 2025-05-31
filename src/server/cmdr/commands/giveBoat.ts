export = {
	Name: "giveboat",
	Aliases: ["gb"],
	Description: "Da un barco específico a un jugador",
	Group: "DefaultAdmin",
	Args: [
		{
			Type: "player",
			Name: "jugador",
			Description: "El jugador que recibirá el barco"
		},
		{
			Type: "string",
			Name: "barcoId",
			Description: "ID del barco a dar (usa 'listboats' para ver opciones)"
		}
	],
}; 
