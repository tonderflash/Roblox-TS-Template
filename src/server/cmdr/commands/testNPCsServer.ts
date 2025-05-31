import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { NPCService } from "server/services/NPCService";

const npcService = Dependency<NPCService>();

function testNPCsServer(context: CommandContext): string {
	const player = context.Executor;
	
	print(`🤖 ${player.Name} solicitó información de NPCs`);
	
	const npcModels = npcService.getAllNPCModels();
	const npcCount = npcModels.size();
	
	if (npcCount === 0) {
		return "❌ No hay NPCs activos en el servidor";
	}
	
	print(`📊 NPCs activos: ${npcCount}`);
	
	npcModels.forEach((model, npcId) => {
		const npc = npcService.getNPC(npcId);
		if (npc) {
			const status = npc.isAlive ? "VIVO" : "MUERTO";
			const health = npc.isAlive ? `${npc.health}/${npc.maxHealth}` : "0";
			print(`  🤖 ${npc.name} (${npcId}) - Nivel ${npc.level} - ${status} - HP: ${health}`);
		}
	});
	
	return `✅ Información de ${npcCount} NPCs mostrada en la consola`;
}

export = testNPCsServer; 
