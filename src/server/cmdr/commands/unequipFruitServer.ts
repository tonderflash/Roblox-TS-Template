import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { CombatService } from "server/services/CombatService";

export = function (context: CommandContext) {
	const combatService = Dependency<CombatService>();
	const player = context.Executor;

	// Desequipar fruta
	combatService.unequipFruitPublic(player);

	return `🚫 Has desequipado tu fruta del diablo`;
}; 
