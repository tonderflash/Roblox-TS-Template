export = {
    Name: "giveResource",
    Aliases: ["giveRes", "give"],
    Description: "Dar recursos a un jugador para testing del inventario",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador que recibirá los recursos"
        },
        {
            Type: "string", 
            Name: "resourceType",
            Description: "Tipo de recurso (wood, rope, cloth, iron)"
        },
        {
            Type: "integer",
            Name: "amount",
            Description: "Cantidad de recursos a dar"
        }
    ]
}; 
