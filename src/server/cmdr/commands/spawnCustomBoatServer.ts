import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player, modelName?: string) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Si no se especifica modelo, listar modelos disponibles
        if (!modelName) {
            const availableModels = simpleBoatService.listAvailableBoatModels();
            const success = simpleBoatService.spawnCustomBoat(player); // Usa modelo por defecto
            
            if (success) {
                // Sentar automáticamente al jugador en el barco
                task.wait(0.5);
                
                const boatSeat = simpleBoatService.getPlayerBoatSeat(player);
                const character = player.Character;
                
                if (boatSeat && character) {
                    const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
                    if (humanoid) {
                        boatSeat.Sit(humanoid);
                    }
                }
                
                return `✅ ${player.Name} spawneó barco personalizado (modelo por defecto)\n🎮 Usa WASD para mover\n\n${availableModels}`;
            } else {
                return `❌ Error spawneando barco personalizado para ${player.Name}\n\n${availableModels}`;
            }
        }
        
        // Spawnar modelo específico
        const success = simpleBoatService.spawnCustomBoat(player, modelName);
        
        if (success) {
            // Sentar automáticamente al jugador en el barco
            task.wait(0.5);
            
            const boatSeat = simpleBoatService.getPlayerBoatSeat(player);
            const character = player.Character;
            
            if (boatSeat && character) {
                const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
                if (humanoid) {
                    boatSeat.Sit(humanoid);
                    return `✅ ${player.Name} spawneó barco personalizado: ${modelName} y se sentó automáticamente\n🎮 Usa WASD para mover el barco`;
                }
            }
            
            return `✅ ${player.Name} spawneó barco personalizado: ${modelName} - siéntate en el DriverSeat para conducir`;
        } else {
            return `❌ Error spawneando barco personalizado "${modelName}" para ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
