import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, targetPlayer?: Player) {
    const player = targetPlayer || context.Executor;
    
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        const success = simpleBoatService.spawnSimpleBoat(player);
        
        if (success) {
            // Sentar automáticamente al jugador en el barco
            task.wait(0.5); // Esperar un momento para que el barco se spawne completamente
            
            const boatSeat = simpleBoatService.getPlayerBoatSeat(player);
            const character = player.Character;
            
            if (boatSeat && character) {
                const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
                if (humanoid) {
                    boatSeat.Sit(humanoid);
                    return `✅ ${player.Name} spawneó barco conducible y se sentó automáticamente\n🎮 Usa WASD para mover el barco`;
                }
            }
            
            return `✅ ${player.Name} spawneó barco conducible - siéntate en el asiento rojo para conducir`;
        } else {
            return `❌ Error spawneando barco simple para ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
