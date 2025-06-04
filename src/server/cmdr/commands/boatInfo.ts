export = {
    Name: "boatInfo",
    Aliases: ["boatinfo", "barco"],
    Description: "Obtiene información del barco del jugador",
    Group: "Admin",
    Args: [
        {
            Type: "player",
            Name: "jugador",
            Description: "Jugador objetivo (opcional)",
            Optional: true
        }
    ]
}; 
