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
            
            const boatModel = simpleBoatService.getPlayerBoat(player);
            const character = player.Character;
            
            if (boatModel && character) {
                const vehicleSeat = boatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
                const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
                
                if (vehicleSeat && humanoid) {
                    vehicleSeat.Sit(humanoid);
                    return `✅ ${player.Name} spawneó barco SIMPLE y se sentó automáticamente\n🎮 Usa WASD para controlar\n⚡ Sistema: BodyForce + BodyAngularVelocity`;
                }
            }
            
            return `✅ ${player.Name} spawneó barco SIMPLE - siéntate en el VehicleSeat para conducir`;
        } else {
            return `❌ Error spawneando barco simple para ${player.Name}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
