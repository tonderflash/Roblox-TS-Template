export = {
    Name: "openInventory",
    Aliases: ["inventory", "inv", "open"],
    Description: "Abre el inventario del jugador especificado (o del ejecutor)",
    Group: "Admin",
    Args: [
        {
            Type: "player",
            Name: "targetPlayer",
            Description: "Jugador objetivo (opcional, por defecto el ejecutor)",
            Optional: true
        }
    ]
}; 
