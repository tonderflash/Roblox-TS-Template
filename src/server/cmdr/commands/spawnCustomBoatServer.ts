import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player, modelName?: string) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Si no se especifica modelo, mostrar modelos disponibles
        if (!modelName) {
            const availableModels = simpleBoatService.listAvailableModels();
            return `❌ Se requiere nombre del modelo\n\n${availableModels}\n\n📋 Uso: /spawnCustomBoat [jugador] [nombreModelo]`;
        }
        
        // Spawnar modelo específico
        const success = simpleBoatService.spawnCustomBoat(player, modelName);
        
        if (success) {
            // Sentar automáticamente al jugador en el barco
            task.wait(0.5);
            
            const boatModel = simpleBoatService.getPlayerBoat(player);
            const character = player.Character;
            
            if (boatModel && character) {
                const vehicleSeat = boatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
                const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
                
                if (vehicleSeat && humanoid) {
                    vehicleSeat.Sit(humanoid);
                    return `✅ ${player.Name} spawneó barco CUSTOM: ${modelName} y se sentó automáticamente\n🎮 Usa WASD para controlar\n⚡ Sistema: BodyForce + BodyAngularVelocity`;
                }
            }
            
            return `✅ ${player.Name} spawneó barco CUSTOM: ${modelName} - siéntate en el VehicleSeat para conducir`;
        } else {
            const availableModels = simpleBoatService.listAvailableModels();
            return `❌ Error spawneando barco personalizado "${modelName}" para ${player.Name}\n\n${availableModels}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
