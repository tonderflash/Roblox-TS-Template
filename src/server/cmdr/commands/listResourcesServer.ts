import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { ResourceService } from "server/services/ResourceService";
import { getResource } from "shared/configs/resources";

export = function(context: CommandContext, targetPlayer: Player) {
    const resourceService = Dependency<ResourceService>();
    
    const playerResources = resourceService.getPlayerResources(targetPlayer);
    if (!playerResources) {
        return `❌ No se encontraron datos de recursos para ${targetPlayer.Name}`;
    }

    const output: string[] = [];
    output.push(`🎒 === RECURSOS DE ${targetPlayer.Name.upper()} ===`);
    output.push("");

    // Agrupar por tipo de rareza
    const commonResources: string[] = [];
    const uncommonResources: string[] = [];
    const rareResources: string[] = [];
    const epicResources: string[] = [];
    const legendaryResources: string[] = [];

    for (const [resourceId, amount] of pairs(playerResources.resources)) {
        if (amount <= 0) continue;
        
        const resource = getResource(resourceId);
        if (!resource) continue;

        const resourceLine = `${resource.icon} ${resource.displayName}: ${amount}/${resource.stackSize}`;
        
        switch (resource.rarity) {
            case "common":
                commonResources.push(resourceLine);
                break;
            case "uncommon":
                uncommonResources.push(resourceLine);
                break;
            case "rare":
                rareResources.push(resourceLine);
                break;
            case "epic":
                epicResources.push(resourceLine);
                break;
            case "legendary":
                legendaryResources.push(resourceLine);
                break;
        }
    }

    // Mostrar por categorías
    if (commonResources.size() > 0) {
        output.push("🔰 RECURSOS COMUNES:");
        commonResources.forEach(res => output.push(`  ${res}`));
        output.push("");
    }

    if (uncommonResources.size() > 0) {
        output.push("🔸 RECURSOS POCO COMUNES:");
        uncommonResources.forEach(res => output.push(`  ${res}`));
        output.push("");
    }

    if (rareResources.size() > 0) {
        output.push("⚡ RECURSOS RAROS:");
        rareResources.forEach(res => output.push(`  ${res}`));
        output.push("");
    }

    if (epicResources.size() > 0) {
        output.push("💎 RECURSOS ÉPICOS:");
        epicResources.forEach(res => output.push(`  ${res}`));
        output.push("");
    }

    if (legendaryResources.size() > 0) {
        output.push("🌟 RECURSOS LEGENDARIOS:");
        legendaryResources.forEach(res => output.push(`  ${res}`));
        output.push("");
    }

    if (commonResources.size() === 0 && uncommonResources.size() === 0 && 
        rareResources.size() === 0 && epicResources.size() === 0 && 
        legendaryResources.size() === 0) {
        output.push("📦 No hay recursos en el inventario");
        output.push("");
    }

    output.push("💡 Usa 'craftboat [jugador] [recipeId]' para craftear barcos");
    output.push("💡 Usa 'listrecipes' para ver todas las recetas disponibles");

    return output.join("\n");
}; 
