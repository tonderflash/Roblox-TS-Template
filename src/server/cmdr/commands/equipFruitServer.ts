import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { CombatService } from "server/services/CombatService";
import { getAllDevilFruits } from "shared/configs/fruits";

export = function (context: CommandContext, fruitId: string) {
	const combatService = Dependency<CombatService>();
	const player = context.Executor;

	// Validar fruta
	const fruits = getAllDevilFruits();
	const fruit = fruits.find(f => f.id === fruitId);
	
	if (!fruit) {
		const availableFruits = fruits.map(f => f.id).join(", ");
		return `❌ Fruta no encontrada. Disponibles: ${availableFruits}`;
	}

	// Equipar fruta usando método público
	combatService.equipFruitPublic(player, fruitId);

	return `🍎 Has equipado ${fruit.name}`;
}; 
