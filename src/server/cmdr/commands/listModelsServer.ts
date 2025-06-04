import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext) {
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        const availableModels = simpleBoatService.listAvailableModels();
        
        return `🎨 MODELOS DE BARCOS DISPONIBLES:\n\n${availableModels}\n\n📋 Uso: /spawnCustomBoat [jugador] [nombreModelo]\n📋 Ejemplo: /spawnCustomBoat TonderFlashh PirateShip`;
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
