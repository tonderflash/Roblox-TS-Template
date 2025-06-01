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
        // Para testing, dar recursos suficientes temporalmente si no los tiene
        const playerInventory = inventoryService.getPlayerInventory(player);
        if (!playerInventory) {
            return `❌ ${player.Name} no tiene inventario inicializado`;
        }
        
        // Dar recursos suficientes para craftear
        for (const requirement of recipe.requirements) {
            const needed = requirement.amount;
            const current = playerInventory.resources.get(requirement.resourceId) || 0;
            
            if (current < needed) {
                const toGive = needed - current;
                inventoryService.addResource(player, requirement.resourceId, toGive);
                print(`🎁 Testing: Dado ${toGive}x ${requirement.resourceId} a ${player.Name}`);
            }
        }
        
        // Asegurar que la receta esté desbloqueada añadiéndola directamente
        if (!inventoryService.isRecipeUnlocked(player, recipeId)) {
            // Añadir la receta directamente al inventario del jugador
            playerInventory.unlockedRecipes.add(recipeId);
            print(`🔓 Testing: Desbloqueada receta ${recipeId} para ${player.Name}`);
        }
        
        // Para testing, simular el crafteo directamente sin verificar recursos
        // Esto simulará un craft exitoso
        print(`🔨 Testing: Simulando craft de ${recipe.name} para ${player.Name}`);
        
        return `✅ Test craft completado: ${recipe.name} para ${player.Name} (recursos dados automáticamente)`;
    } catch (error) {
        return `❌ Error en test craft: ${error}`;
    }
}; 
