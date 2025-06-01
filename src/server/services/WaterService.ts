import { OnStart, Service } from "@flamework/core";
import { Players, RunService, Workspace } from "@rbxts/services";

@Service()
export class WaterService implements OnStart {
    private readonly WATER_LEVEL = 5; // Nivel constante del agua
    private playersInWater = new Set<Player>();

    onStart(): void {
        this.setupWaterMonitoring();
        print("🌊 WaterService iniciado - Monitoreando flotación de jugadores");
    }

    private setupWaterMonitoring(): void {
        // Monitorear jugadores en el agua cada frame
        RunService.Heartbeat.Connect(() => {
            Players.GetPlayers().forEach((player) => {
                this.updatePlayerWaterState(player);
            });
        });
    }

    private updatePlayerWaterState(player: Player): void {
        const character = player.Character;
        if (!character) return;

        const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
        const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
        
        if (!humanoidRootPart || !humanoid) return;

        const playerY = humanoidRootPart.Position.Y;
        // CORREGIDO: Solo aplicar efectos de natación si está BAJO el nivel del agua
        // Si está caminando sobre la superficie (Y >= 5), no es natación
        const isActuallySwimming = playerY < this.WATER_LEVEL; // Solo si está bajo el nivel 5

        if (isActuallySwimming && !this.playersInWater.has(player)) {
            // Jugador acaba de caer bajo el agua (natación real)
            this.onPlayerEnterWater(player, humanoidRootPart, humanoid);
            this.playersInWater.add(player);
        } else if (!isActuallySwimming && this.playersInWater.has(player)) {
            // Jugador salió del agua o está sobre la superficie
            this.onPlayerExitWater(player, humanoidRootPart, humanoid);
            this.playersInWater.delete(player);
        }

        // Si está realmente nadando (bajo el agua), aplicar efectos continuos
        if (isActuallySwimming) {
            this.applyWaterEffects(player, humanoidRootPart, humanoid);
        }
    }

    private onPlayerEnterWater(player: Player, rootPart: Part, humanoid: Humanoid): void {
        print(`🏊 ${player.Name} está nadando (bajo el agua)`);
        
        // Efectos de entrada al agua - más suaves
        humanoid.JumpPower = 25; // Menor poder de salto en agua
        humanoid.WalkSpeed = math.max(6, humanoid.WalkSpeed * 0.5); // Movimiento más lento en agua
        
        // Crear efecto de flotación suave
        const waterFloat = new Instance("BodyVelocity");
        waterFloat.Name = "WaterFloat";
        waterFloat.MaxForce = new Vector3(0, 2000, 0); // Fuerza vertical moderada
        waterFloat.Velocity = new Vector3(0, 5, 0); // Impulso inicial hacia arriba suave
        waterFloat.Parent = rootPart;
    }

    private onPlayerExitWater(player: Player, rootPart: Part, humanoid: Humanoid): void {
        print(`🚶 ${player.Name} salió del agua`);
        
        // Restaurar valores normales
        humanoid.JumpPower = 50; // Valor normal
        humanoid.WalkSpeed = 16; // Velocidad normal
        
        // Remover efectos de flotación
        const waterFloat = rootPart.FindFirstChild("WaterFloat");
        if (waterFloat) {
            waterFloat.Destroy();
        }
    }

    private applyWaterEffects(player: Player, rootPart: Part, humanoid: Humanoid): void {
        const waterFloat = rootPart.FindFirstChild("WaterFloat") as BodyVelocity;
        if (!waterFloat) return;

        // Flotación suave hacia la superficie del agua
        const currentY = rootPart.Position.Y;
        const targetY = this.WATER_LEVEL + 1; // Flotar 1 stud sobre el agua (no muy alto)
        
        if (currentY < targetY) {
            // Aplicar fuerza hacia arriba para flotar suavemente
            const floatForce = (targetY - currentY) * 300; // Fuerza más suave
            waterFloat.Velocity = new Vector3(0, math.min(floatForce, 25), 0); // Velocidad máxima más baja
        } else {
            // Si está en la superficie, mantener flotación mínima
            waterFloat.Velocity = new Vector3(0, 2, 0); // Flotación mínima
        }
    }

    // Método público para verificar si un jugador está en el agua
    public isPlayerInWater(player: Player): boolean {
        return this.playersInWater.has(player);
    }

    // Método público para obtener el nivel del agua
    public getWaterLevel(): number {
        return this.WATER_LEVEL;
    }

    // Método para forzar flotación (usado por barcos y otros objetos)
    public getFloatingHeight(): number {
        return this.WATER_LEVEL + 1; // Altura estándar de flotación ajustada
    }
} 
