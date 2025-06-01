export = {
    Name: "resetInventory",
    Aliases: ["resetInv", "clearInventory"],
    Description: "Resetear completamente el inventario de un jugador",
    Group: "DefaultAdmin", 
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuyo inventario será reseteado"
        }
    ]
}; 
