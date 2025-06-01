import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { NPCService } from "server/services/NPCService";
import { IslandService } from "server/services/IslandService";

const npcService = Dependency<NPCService>();
const islandService = Dependency<IslandService>();

function testNPCsServer(context: CommandContext): string {
	const player = context.Executor;
	
	print(`🤖 ${player.Name} solicitó información de NPCs`);
	
	const npcModels = npcService.getAllNPCModels();
	const npcCount = npcModels.size();
	
	let response = `📊 NPCs activos: ${npcCount}\n`;
	
	if (npcCount === 0) {
		response += "❌ No hay NPCs activos en el servidor\n";
		response += "🔄 Spawneando NPCs en todas las islas...\n";
		
		// Spawnear NPCs en todas las islas disponibles
		const allIslands = islandService.getAllLoadedIslands();
		allIslands.forEach((island) => {
			if (island.templateId !== "spawn_island") { // Ya tiene NPCs
				npcService.spawnNPCsOnIsland(island.templateId);
			}
		});
		
		response += `✅ NPCs spawneados en ${allIslands.size()} islas`;
		return response;
	}
	
	print(`📊 NPCs activos: ${npcCount}`);
	
	npcModels.forEach((model, npcId) => {
		const npc = npcService.getNPC(npcId);
		if (npc) {
			const status = npc.isAlive ? "VIVO" : "MUERTO";
			const health = npc.isAlive ? `${npc.health}/${npc.maxHealth}` : "0";
			const position = `(${math.floor(npc.spawnPosition.X)}, ${math.floor(npc.spawnPosition.Y)}, ${math.floor(npc.spawnPosition.Z)})`;
			print(`  🤖 ${npc.name} (${npcId}) - Nivel ${npc.level} - ${status} - HP: ${health} - Pos: ${position}`);
			response += `🤖 ${npc.name} - Lv.${npc.level} - ${status} - HP: ${health}\n`;
		}
	});
	
	response += `\n💡 Los NPCs están spawneados en alturas corregidas para estar por encima del agua`;
	
	return response;
}

export = testNPCsServer; 
