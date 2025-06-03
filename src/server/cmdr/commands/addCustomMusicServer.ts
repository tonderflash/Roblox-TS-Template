import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { SimpleBoatService } from "server/services/SimpleBoatService";

export = function (context: CommandContext, musicName: string, musicId: string) {
    try {
        const simpleBoatService = Dependency<SimpleBoatService>();
        
        // Agregar música personalizada
        const success = simpleBoatService.addCustomMusic(musicName, musicId);
        
        if (success) {
            return `✅ Música personalizada agregada: ${musicName} (ID: ${musicId})
📋 Usa /listMusic para ver el nuevo índice
🎵 Usa /changeSpeakerMusic [jugador] [nuevoÍndice] para usarla`;
        } else {
            return `❌ No se pudo agregar la música personalizada`;
        }
        
    } catch (error) {
        return `❌ Error: ${error}`;
    }
}; 
