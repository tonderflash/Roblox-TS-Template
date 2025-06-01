import { CommandContext } from "@rbxts/cmdr";
import { ISLAND_TEMPLATES } from "shared/configs/islands";

export = function(context: CommandContext) {
    const output: string[] = [];
    output.push("🏝️ === ISLAS DISPONIBLES ===");
    output.push("");

    // Agrupar por dificultad
    const easyIslands: string[] = [];
    const mediumIslands: string[] = [];
    const hardIslands: string[] = [];

    for (const [id, template] of pairs(ISLAND_TEMPLATES)) {
        const islandInfo = `${template.displayName} (${id})`;
        const statsInfo = `  📍 Posición: ${template.position}`;
        const levelInfo = `  🎯 Nivel: ${template.recommendedLevel} | Tema: ${template.theme}`;
        const descInfo = `  📝 ${template.description}`;
        
        if (template.difficulty === "easy") {
            easyIslands.push(islandInfo);
            easyIslands.push(statsInfo);
            easyIslands.push(levelInfo);
            easyIslands.push(descInfo);
            easyIslands.push("");
        } else if (template.difficulty === "medium") {
            mediumIslands.push(islandInfo);
            mediumIslands.push(statsInfo);
            mediumIslands.push(levelInfo);
            mediumIslands.push(descInfo);
            mediumIslands.push("");
        } else if (template.difficulty === "hard") {
            hardIslands.push(islandInfo);
            hardIslands.push(statsInfo);
            hardIslands.push(levelInfo);
            hardIslands.push(descInfo);
            hardIslands.push("");
        }
    }

    // Mostrar por categorías
    output.push("🟢 FÁCILES (Nivel 1-3):");
    easyIslands.forEach(island => output.push(island));

    output.push("🟡 MEDIANAS (Nivel 4-5):");
    mediumIslands.forEach(island => output.push(island));

    output.push("🔴 DIFÍCILES (Nivel 6+):");
    hardIslands.forEach(island => output.push(island));

    output.push("💡 Todas las islas ya están generadas como graybox en el mundo");
    output.push("💡 Usa 'tptoisle [islandId]' para teleportarte a una isla");

    return output.join("\n");
}; 
