import { Dependency } from "@flamework/core";
import { InventoryService } from "../../services/InventoryService";
import { getCraftingRecipe } from "shared/configs/resources";
import { CommandContext } from "@rbxts/cmdr";

const inventoryService = Dependency<InventoryService>();

export = function(context: CommandContext, player: Player, recipeId: string) {
    // Validar que la receta existe
    const recipe = getCraftingRecipe(recipeId);
    if (!recipe) {
        const validRecipes = ["stone_pick", "stone_hatchet", "simple_boat", "basic_fishing_boat", "merchant_sloop"];
        return `❌ Receta no encontrada. Recetas válidas: ${validRecipes.join(", ")}`;
    }
    
    try {
        // Verificar si ya está desbloqueada
        if (inventoryService.isRecipeUnlocked(player, recipeId)) {
            return `⚠️ ${player.Name} ya tiene desbloqueada la receta: ${recipe.name}`;
        }
        
        // Usar el método público para admin
        inventoryService.unlockRecipeAdmin(player, recipeId);
        
        return `🔓 Receta ${recipe.name} desbloqueada para ${player.Name}`;
    } catch (error) {
        return `❌ Error desbloqueando receta: ${error}`;
    }
}; 
