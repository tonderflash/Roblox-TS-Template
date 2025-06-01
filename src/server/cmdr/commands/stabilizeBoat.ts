import { CommandDefinition } from "@rbxts/cmdr";

export = {
    Name: "stabilizeBoat",
    Aliases: ["stabilize", "fixboat"],
    Description: "Estabiliza un barco que se haya volteado",
    Group: "Admin",
    Args: [
        {
            Type: "player",
            Name: "player",
            Description: "Jugador cuyo barco estabilizar",
            Optional: true
        }
    ],
} as CommandDefinition; 
