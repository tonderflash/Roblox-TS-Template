import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, musicName: string) {
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Remover música personalizada
        const success = simpleBoatService.removeCustomMusic(musicName);
        
        if (success) {
            return `🗑️ Música personalizada removida: ${musicName}
📋 Usa /listMusic para ver los índices actualizados`;
        } else {
            return `❌ No se encontró música personalizada con nombre: ${musicName}`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
