import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { NPCService } from "server/services/NPCService";
import { IslandService } from "server/services/IslandService";
import { getIslandTemplate } from "shared/configs/islands";

export = function(context: CommandContext, islandId: string) {
    const npcService = Dependency<NPCService>();
    const islandService = Dependency<IslandService>();
    
    // Verificar que la isla existe
    const template = getIslandTemplate(islandId);
    if (!template) {
        return `❌ Isla no encontrada: ${islandId}. Usa 'listislands' para ver opciones.`;
    }
    
    // Verificar que la isla está cargada
    const islandData = islandService.getIslandData(islandId);
    if (!islandData) {
        return `❌ Isla no está cargada: ${template.displayName}`;
    }
    
    // Poblar isla con NPCs
    try {
        npcService.spawnNPCsOnIsland(islandId);
        
        const npcTypes = template.npcSpawns.map(spawn => spawn.npcType);
        const totalNPCs = template.npcSpawns.reduce((total, spawn) => total + spawn.maxActive, 0);
        
        return `✅ Isla poblada exitosamente!\n` +
               `🏝️ Isla: ${template.displayName}\n` +
               `🤖 NPCs spawneados: ${totalNPCs}\n` +
               `👾 Tipos: ${npcTypes.join(", ")}\n` +
               `📍 Posición: ${template.position}\n` +
               `💡 Los NPCs están en alturas corregidas por encima del agua`;
               
    } catch (error) {
        return `❌ Error al poblar isla: ${error}`;
    }
}; 
