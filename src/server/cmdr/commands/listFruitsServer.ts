import { CommandContext } from "@rbxts/cmdr";
import { getAllDevilFruits } from "shared/configs/fruits";

export = function (context: CommandContext) {
	const fruits = getAllDevilFruits();
	
	let result = "🍎 **Frutas del Diablo Disponibles:**\n\n";
	
	fruits.forEach((fruit) => {
		result += `**${fruit.name}** (${fruit.id})\n`;
		result += `   ${fruit.description}\n`;
		result += `   🔥 ${fruit.abilities[0].name}: ${fruit.abilities[0].description}\n`;
		result += `   ⚡ ${fruit.abilities[1].name}: ${fruit.abilities[1].description}\n`;
		if (fruit.passiveEffect) {
			const effectText = fruit.passiveEffect.type === "damage" ? 
				`+${fruit.passiveEffect.value}% Daño` : 
				`+${fruit.passiveEffect.value}% Velocidad`;
			result += `   💫 Pasivo: ${effectText}\n`;
		}
		result += `\n`;
	});
	
	result += "Para equipar: `/equipfruit [id]`\n";
	result += "Para desequipar: `/unequipfruit`";
	
	return result;
}; 
