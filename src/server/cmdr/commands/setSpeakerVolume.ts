import { CommandDefinition } from "@rbxts/cmdr";

export = identity<CommandDefinition>({
    Name: "setSpeakerVolume",
    Aliases: ["setVolume", "volumen", "volumeBocina"],
    Description: "Cambia el volumen de la bocina del barco (0-100)",
    Group: "DefaultAdmin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuyo volumen cambiar",
            Optional: true
        },
        {
            Type: "number",
            Name: "volume",
            Description: "Volumen (0-100)"
        }
    ]
}); 
