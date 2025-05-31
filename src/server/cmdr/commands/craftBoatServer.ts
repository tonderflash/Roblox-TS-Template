import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { BoatService } from "server/services/BoatService";
import { ResourceService } from "server/services/ResourceService";
import { getCraftingRecipe, getResource } from "shared/configs/resources";
import { getBoatTemplate } from "shared/configs/boats";

export = function(context: CommandContext, targetPlayer: Player, recipeId: string) {
    const boatService = Dependency<BoatService>();
    const resourceService = Dependency<ResourceService>();
    
    // Verificar receta
    const recipe = getCraftingRecipe(recipeId);
    if (!recipe) {
        return `❌ Receta de crafting no encontrada: ${recipeId}`;
    }

    // Verificar que sea una receta de barco
    if (recipe.resultType !== "boat") {
        return `❌ Esta receta no es para un barco: ${recipeId}`;
    }

    // Verificar template del barco
    const boatTemplate = getBoatTemplate(recipe.resultId);
    if (!boatTemplate) {
        return `❌ Template de barco no encontrado: ${recipe.resultId}`;
    }

    // Verificar recursos del jugador
    const hasResources = resourceService.hasResources(targetPlayer, recipe.requirements);
    if (!hasResources) {
        let missingResources = "❌ Recursos insuficientes:\n";
        
        for (const requirement of recipe.requirements) {
            const resource = getResource(requirement.resourceId);
            const playerRes = resourceService.getPlayerResources(targetPlayer);
            const currentAmount = playerRes ? (playerRes.resources.get(requirement.resourceId) || 0) : 0;
            
            missingResources += `  ${resource ? resource.displayName : requirement.resourceId}: ${currentAmount}/${requirement.amount}\n`;
        }
        
        return missingResources;
    }

    // Consumir recursos
    const consumed = resourceService.consumeResources(targetPlayer, recipe.requirements);
    if (!consumed) {
        return `❌ Error al consumir recursos para ${targetPlayer.Name}`;
    }

    // Dar el barco al jugador (actualizar su template)
    const boat = boatService.getPlayerBoat(targetPlayer);
    if (boat) {
        boat.templateId = recipe.resultId;
        boat.currentStats = boatTemplate.baseStats;
        boat.health = boatTemplate.baseStats.maxHealth;
        
        // Si tenía un barco spawneado, despawnearlo para reflejar cambios
        if (boat.isSpawned) {
            boatService.despawnBoat(targetPlayer);
        }
    }

    // Mensaje de éxito
    let successMessage = `🔨✅ ¡Barco crafteado exitosamente!\n`;
    successMessage += `👤 Jugador: ${targetPlayer.Name}\n`;
    successMessage += `🛥️ Nuevo barco: ${boatTemplate.displayName}\n`;
    successMessage += `⏱️ Tiempo de crafting: ${recipe.craftingTime}s\n`;
    successMessage += `📦 Materiales consumidos:\n`;
    
    for (const requirement of recipe.requirements) {
        const resource = getResource(requirement.resourceId);
        successMessage += `  -${requirement.amount}x ${resource ? resource.displayName : requirement.resourceId}\n`;
    }
    
    successMessage += `\n💡 Usa 'spawnboat ${targetPlayer.Name}' para spawnearlo`;
    
    return successMessage;
}; 
