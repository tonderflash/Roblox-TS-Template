export = {
    Name: "unlockRecipe",
    Aliases: ["unlock", "recipe"],
    Description: "Desbloquear una receta específica para un jugador",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador que recibirá la receta"
        },
        {
            Type: "string",
            Name: "recipeId", 
            Description: "ID de la receta (stone_pick, stone_hatchet, simple_boat)"
        }
    ]
}; 
