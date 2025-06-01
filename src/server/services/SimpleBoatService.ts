// ===== SIMPLE BOAT SERVICE - SISTEMA MÍNIMO Y FUNCIONAL =====
// Basado en: https://devforum.roblox.com/t/realistic-boat-system-floats-on-terrain-water-optimized-free/3541235

import { OnStart, Service } from "@flamework/core";
import { Workspace, RunService } from "@rbxts/services";

interface SimpleBoat {
    model: Model;
    hull: Part;
    bodyPosition: BodyPosition;
    bodyAngularVelocity: BodyAngularVelocity;
    owner: Player;
}

@Service()
export class SimpleBoatService implements OnStart {
    private spawnedBoats = new Map<Player, SimpleBoat>();
    private readonly WATER_LEVEL = 5; // Nivel fijo del agua (de IslandService)
    
    onStart(): void {
        print("🚢 SimpleBoatService iniciado - Sistema mínimo y funcional");
    }
    
    /**
     * Spawna un barco simple que FUNCIONA
     */
    public spawnSimpleBoat(player: Player): boolean {
        try {
            // Despawnar barco anterior si existe
            if (this.spawnedBoats.has(player)) {
                this.despawnBoat(player);
            }
            
            const character = player.Character;
            if (!character) return false;
            
            const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
            if (!humanoidRootPart) return false;
            
            // Calcular posición de spawn
            const playerPosition = humanoidRootPart.Position;
            const playerCFrame = humanoidRootPart.CFrame;
            const spawnOffset = playerCFrame.LookVector.mul(20);
            const spawnPosition = new Vector3(
                playerPosition.X + spawnOffset.X,
                this.WATER_LEVEL + 2, // 2 studs arriba del agua
                playerPosition.Z + spawnOffset.Z
            );
            
            // CREAR BARCO SIMPLE
            const boatModel = new Instance("Model");
            boatModel.Name = `${player.Name}_Boat`;
            boatModel.Parent = Workspace;
            
            // Hull (casco) - PARTE PRINCIPAL
            const hull = new Instance("Part");
            hull.Name = "Hull";
            hull.Size = new Vector3(8, 2, 16); // Barco básico
            hull.Position = spawnPosition;
            hull.Material = Enum.Material.Wood;
            hull.BrickColor = new BrickColor("Brown");
            hull.Shape = Enum.PartType.Block;
            hull.Anchored = false;
            hull.CanCollide = true;
            hull.Parent = boatModel;
            
            // PrimaryPart para el modelo
            boatModel.PrimaryPart = hull;
            
            // FLOTACIÓN SIMPLE usando BodyPosition
            const bodyPosition = new Instance("BodyPosition");
            bodyPosition.MaxForce = new Vector3(0, math.huge, 0); // Solo Y
            bodyPosition.Position = new Vector3(spawnPosition.X, this.WATER_LEVEL + 1, spawnPosition.Z);
            bodyPosition.D = 2000; // Damping
            bodyPosition.P = 10000; // Power
            bodyPosition.Parent = hull;
            
            // ESTABILIDAD usando BodyAngularVelocity
            const bodyAngularVelocity = new Instance("BodyAngularVelocity");
            bodyAngularVelocity.MaxTorque = new Vector3(math.huge, 0, math.huge);
            bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
            bodyAngularVelocity.P = 3000;
            bodyAngularVelocity.Parent = hull;
            
            // Registrar barco
            const simpleBoat: SimpleBoat = {
                model: boatModel,
                hull: hull,
                bodyPosition: bodyPosition,
                bodyAngularVelocity: bodyAngularVelocity,
                owner: player
            };
            
            this.spawnedBoats.set(player, simpleBoat);
            
            print(`🚢 ${player.Name} spawneó barco simple en Y=${spawnPosition.Y}`);
            return true;
            
        } catch (error) {
            warn(`❌ Error spawneando barco simple: ${error}`);
            return false;
        }
    }
    
    /**
     * Despawnea un barco
     */
    public despawnBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        boat.model.Destroy();
        this.spawnedBoats.delete(player);
        
        print(`🗑️ ${player.Name} despawneó su barco`);
        return true;
    }
    
    /**
     * Obtiene el barco de un jugador
     */
    public getPlayerBoat(player: Player): Model | undefined {
        const boat = this.spawnedBoats.get(player);
        return boat ? boat.model : undefined;
    }
    
    /**
     * Verifica si el jugador tiene un barco
     */
    public isBoatSpawned(player: Player): boolean {
        return this.spawnedBoats.has(player);
    }
} 
