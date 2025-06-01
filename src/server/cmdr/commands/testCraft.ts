export = {
    Name: "testCraft",
    Aliases: ["craft", "forceCraft"],
    Description: "Testear crafting sin verificar recursos (solo para testing)",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador que hará el craft"
        },
        {
            Type: "string",
            Name: "recipeId",
            Description: "ID de la receta a craftear"
        }
    ]
}; 
