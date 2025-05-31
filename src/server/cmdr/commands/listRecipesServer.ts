import { CommandContext } from "@rbxts/cmdr";
import { CRAFTING_RECIPES, getResource } from "shared/configs/resources";
import { getBoatTemplate } from "shared/configs/boats";

export = function(context: CommandContext) {
    const output: string[] = [];
    output.push("🔨 === RECETAS DE CRAFTING ===");
    output.push("");

    // Agrupar por tier de barco
    const basicRecipes: string[] = [];
    const improvedRecipes: string[] = [];
    const legendaryRecipes: string[] = [];

    for (const [recipeId, recipe] of pairs(CRAFTING_RECIPES)) {
        if (recipe.resultType !== "boat") continue;
        
        const boatTemplate = getBoatTemplate(recipe.resultId);
        if (!boatTemplate) continue;

        let recipeInfo = `🛥️ ${recipe.name} (${recipeId})`;
        recipeInfo += `\n  Resultado: ${boatTemplate.displayName}`;
        recipeInfo += `\n  Tiempo: ${recipe.craftingTime}s`;
        if (recipe.unlockLevel) {
            recipeInfo += ` | Nivel: ${recipe.unlockLevel}`;
        }
        recipeInfo += "\n  Materiales:";
        
        for (const requirement of recipe.requirements) {
            const resource = getResource(requirement.resourceId);
            recipeInfo += `\n    ${requirement.amount}x ${resource ? resource.displayName : requirement.resourceId}`;
        }
        
        recipeInfo += `\n  ${recipe.description}`;

        switch (boatTemplate.tier) {
            case "basic":
                basicRecipes.push(recipeInfo);
                break;
            case "improved":
                improvedRecipes.push(recipeInfo);
                break;
            case "legendary":
                legendaryRecipes.push(recipeInfo);
                break;
        }
    }

    // Mostrar por categorías
    if (basicRecipes.size() > 0) {
        output.push("🔰 TIER 1 - BÁSICOS (Gratis con materiales):");
        basicRecipes.forEach(recipe => {
            output.push(recipe);
            output.push("");
        });
    }

    if (improvedRecipes.size() > 0) {
        output.push("⚡ TIER 2 - MEJORADOS (Materiales raros):");
        improvedRecipes.forEach(recipe => {
            output.push(recipe);
            output.push("");
        });
    }

    if (legendaryRecipes.size() > 0) {
        output.push("💎 TIER 3 - LEGENDARIOS (Materiales legendarios):");
        legendaryRecipes.forEach(recipe => {
            output.push(recipe);
            output.push("");
        });
    }

    output.push("💡 Usa 'craftboat [jugador] [recipeId]' para craftear");
    output.push("💡 Usa 'listresources [jugador]' para ver recursos disponibles");

    return output.join("\n");
}; 
