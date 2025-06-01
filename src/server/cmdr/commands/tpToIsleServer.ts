import { CommandContext } from "@rbxts/cmdr";
import { getIslandTemplate } from "shared/configs/islands";

export = function(context: CommandContext, targetPlayer: Player, islandId: string) {
    // Verificar que la isla existe
    const template = getIslandTemplate(islandId);
    if (!template) {
        return `❌ Isla no encontrada: ${islandId}. Usa 'listislands' para ver opciones.`;
    }

    // Verificar que el jugador tiene un personaje
    const character = targetPlayer.Character;
    if (!character) {
        return `❌ ${targetPlayer.Name} no tiene un personaje activo.`;
    }

    const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
    if (!humanoidRootPart) {
        return `❌ No se puede teleportar a ${targetPlayer.Name}.`;
    }

    // Calcular posición de teleport (un poco arriba de la isla)
    const teleportPosition = template.position.add(new Vector3(0, template.size.Y + 10, 0));
    
    // Teleportar al jugador
    humanoidRootPart.CFrame = new CFrame(teleportPosition);

    const difficultyEmoji = template.difficulty === "easy" ? "🟢" : 
                           template.difficulty === "medium" ? "🟡" : "🔴";
    
    return `🏝️ ${difficultyEmoji} ${targetPlayer.Name} teleportado a ${template.displayName}\n` +
           `📍 Posición: ${template.position}\n` +
           `🎯 Nivel recomendado: ${template.recommendedLevel}\n` +
           `📝 ${template.description}\n` +
           `💡 Puedes usar 'spawnboat ${targetPlayer.Name}' para invocar tu barco aquí`;
}; 
