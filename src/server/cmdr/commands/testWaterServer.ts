import { CommandContext } from "@rbxts/cmdr";
import { Dependency } from "@flamework/core";
import { Workspace } from "@rbxts/services";
import { WaterService } from "server/services/WaterService";

export = function(context: CommandContext, targetPlayer?: Player) {
    const waterService = Dependency<WaterService>();
    const executor = context.Executor;
    const testPlayer = targetPlayer || executor;

    // Verificar que el jugador existe
    if (!testPlayer || !testPlayer.Character) {
        return `❌ Jugador no encontrado o sin personaje activo.`;
    }

    const humanoidRootPart = testPlayer.Character.FindFirstChild("HumanoidRootPart") as Part;
    if (!humanoidRootPart) {
        return `❌ ${testPlayer.Name} no tiene HumanoidRootPart.`;
    }

    // === DIAGNÓSTICO DEL AGUA ===
    let diagnosticResult = `🌊 DIAGNÓSTICO DEL AGUA - ${testPlayer.Name}\n`;
    diagnosticResult += `=====================================\n`;

    // Verificar elementos del agua
    const ocean = Workspace.FindFirstChild("Ocean") as Part;
    const waterSurface = Workspace.FindFirstChild("WaterSurface") as Part;

    if (!ocean) {
        diagnosticResult += `❌ FALTA: Part "Ocean" no encontrada\n`;
    } else {
        diagnosticResult += `✅ Ocean encontrado - Pos: ${ocean.Position}, Tamaño: ${ocean.Size}\n`;
        diagnosticResult += `   Material: ${ocean.Material}, CanCollide: ${ocean.CanCollide}\n`;
    }

    if (!waterSurface) {
        diagnosticResult += `❌ FALTA: Part "WaterSurface" no encontrada\n`;
    } else {
        diagnosticResult += `✅ WaterSurface encontrado - Pos: ${waterSurface.Position}, Tamaño: ${waterSurface.Size}\n`;
        diagnosticResult += `   Material: ${waterSurface.Material}, CanCollide: ${waterSurface.CanCollide}\n`;
        diagnosticResult += `   Transparency: ${waterSurface.Transparency}\n`;
    }

    // Estado del jugador
    const playerY = humanoidRootPart.Position.Y;
    const waterLevel = waterService.getWaterLevel();
    const floatingHeight = waterService.getFloatingHeight();
    const isInWater = waterService.isPlayerInWater(testPlayer);

    diagnosticResult += `\n👤 ESTADO DEL JUGADOR:\n`;
    diagnosticResult += `   Posición Y: ${math.floor(playerY * 100) / 100}\n`;
    diagnosticResult += `   Nivel agua: ${waterLevel}\n`;
    diagnosticResult += `   Altura flotación: ${floatingHeight}\n`;
    diagnosticResult += `   En agua: ${isInWater ? "SÍ" : "NO"}\n`;

    // Verificar BodyVelocity de flotación
    const waterFloat = humanoidRootPart.FindFirstChild("WaterFloat") as BodyVelocity;
    if (waterFloat) {
        diagnosticResult += `   BodyVelocity activo: SÍ - Velocidad: ${waterFloat.Velocity}\n`;
    } else {
        diagnosticResult += `   BodyVelocity activo: NO\n`;
    }

    // === RECOMENDACIONES ===
    diagnosticResult += `\n💡 RECOMENDACIONES:\n`;
    
    if (!waterSurface || !waterSurface.CanCollide) {
        diagnosticResult += `❌ CRÍTICO: WaterSurface debe tener CanCollide = true\n`;
    }

    if (playerY < waterLevel) {
        diagnosticResult += `⚠️ Jugador bajo el agua - debería flotar automáticamente\n`;
    }

    if (playerY > floatingHeight + 10) {
        diagnosticResult += `⚠️ Jugador muy alto - usa /tptoisle para ir al agua\n`;
    }

    // === PRUEBA DE FLOTACIÓN ===
    if (isInWater) {
        diagnosticResult += `\n🏊 JUGADOR EN AGUA - SISTEMA ACTIVO\n`;
    } else {
        diagnosticResult += `\n🚶 Jugador fuera del agua\n`;
        diagnosticResult += `   Para probar: Camina hacia el océano (Y=5) o usa /tptoisle\n`;
    }

    // === COMANDOS ÚTILES ===
    diagnosticResult += `\n🛠️ COMANDOS PARA TESTING:\n`;
    diagnosticResult += `   /spawnboat ${testPlayer.Name} - Probar flotación de barcos\n`;
    diagnosticResult += `   /tptoisle ${testPlayer.Name} pirate_cove - Ir a una isla\n`;
    diagnosticResult += `   /testwater ${testPlayer.Name} - Repetir diagnóstico\n`;

    return diagnosticResult;
}; 
