// ===== SIMPLE BOAT SERVICE - SISTEMA MÍNIMO Y FUNCIONAL =====
// Basado en: https://devforum.roblox.com/t/realistic-boat-system-floats-on-terrain-water-optimized-free/3541235

import { OnStart, Service } from "@flamework/core";
import { Workspace, RunService } from "@rbxts/services";

interface SimpleBoat {
    model: Model;
    hull: Part;
    deck: Part;
    seat: VehicleSeat;
    bodyPosition: BodyPosition;
    bodyVelocity: BodyVelocity;
    bodyGyro: BodyGyro;
    bodyAngularVelocity: BodyAngularVelocity;
    owner: Player;
    connection?: RBXScriptConnection;
}

@Service()
export class SimpleBoatService implements OnStart {
    private spawnedBoats = new Map<Player, SimpleBoat>();
    private readonly WATER_LEVEL = 5; // Nivel fijo del agua (de IslandService)
    
    // Configuración de controles
    private readonly MAX_SPEED = 50; // Velocidad máxima
    private readonly TURN_SPEED = 5; // Velocidad de giro
    
    onStart(): void {
        print("🚢 SimpleBoatService iniciado - Sistema estable y funcional con controles restringidos a agua");
    }
    
    /**
     * Detecta si el barco está sobre agua usando raycast
     * Esta es la mejor práctica según DevForum de Roblox
     */
    private isBoatInWater(boat: SimpleBoat): boolean {
        const hull = boat.hull;
        const hullPosition = hull.Position;
        
        // MÉTODO 1: Verificación simple de altura (rápido)
        // Si está muy por debajo del nivel del agua, definitivamente no está en agua navegable
        if (hullPosition.Y < this.WATER_LEVEL - 2) {
            return false;
        }
        
        // MÉTODO 2: Raycast hacia abajo para detectar qué hay debajo del barco
        const raycastParams = new RaycastParams();
        raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
        raycastParams.FilterDescendantsInstances = [boat.model]; // Excluir el propio barco
        
        // Raycast desde el centro del hull hacia abajo
        const rayOrigin = hullPosition.add(new Vector3(0, 2, 0)); // 2 studs arriba del hull
        const rayDirection = new Vector3(0, -10, 0); // 10 studs hacia abajo
        
        const raycastResult = Workspace.Raycast(rayOrigin, rayDirection, raycastParams);
        
        if (raycastResult && raycastResult.Instance) {
            const hitInstance = raycastResult.Instance;
            const hitPosition = raycastResult.Position;
            
            // VERIFICACIONES PARA DETERMINAR SI ES AGUA:
            
            // 1. Si toca el océano creado por IslandService
            if (hitInstance.Name === "Ocean" && hitInstance.Material === Enum.Material.Water) {
                return true;
            }
            
            // 2. Si toca cualquier material de agua
            if (raycastResult.Material === Enum.Material.Water) {
                return true;
            }
            
            // 3. Si el raycast toca algo sólido muy cerca del nivel del agua, NO es agua navegable
            if (hitPosition.Y > this.WATER_LEVEL - 1) {
                return false; // Hay terreno sólido cerca de la superficie
            }
        }
        
        // MÉTODO 3: Si no toca nada sólido y está cerca del nivel del agua, probablemente es agua
        if (hullPosition.Y >= this.WATER_LEVEL - 1 && hullPosition.Y <= this.WATER_LEVEL + 3) {
            return true;
        }
        
        // Por defecto, si hay dudas, no permitir movimiento
        return false;
    }
    
    /**
     * Spawna un barco simple ESTABLE que FUNCIONA y se puede conducir
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
            
            // CREAR BARCO ESTABLE
            const boatModel = new Instance("Model");
            boatModel.Name = `${player.Name}_Boat`;
            boatModel.Parent = Workspace;
            
            // Hull (casco) - PARTE PRINCIPAL MÁS GRANDE Y PESADA
            const hull = new Instance("Part");
            hull.Name = "Hull";
            hull.Size = new Vector3(12, 3, 20); // Barco más grande y profundo
            hull.Position = spawnPosition;
            hull.Material = Enum.Material.Wood;
            hull.BrickColor = new BrickColor("Brown");
            hull.Shape = Enum.PartType.Block;
            hull.Anchored = false;
            hull.CanCollide = true;
            hull.Parent = boatModel;
            
            // PROPIEDADES FÍSICAS CUSTOMIZADAS - MÁS MASA Y DENSIDAD
            const hullPhysics = new PhysicalProperties(
                2.0,    // Density (más denso = más pesado)
                0.8,    // Friction
                0.2,    // ElasticityWeight  
                1,      // FrictionWeight
                1       // ElasticityWeight
            );
            hull.CustomPhysicalProperties = hullPhysics;
            
            // DECK (cubierta) - SUPERFICIE PARA CAMINAR MÁS GRANDE
            const deck = new Instance("Part");
            deck.Name = "Deck";
            deck.Size = new Vector3(11, 0.5, 19); // Superficie más grande para caminar
            deck.Position = new Vector3(spawnPosition.X, spawnPosition.Y + 2, spawnPosition.Z);
            deck.Material = Enum.Material.Wood;
            deck.BrickColor = new BrickColor("Dark orange");
            deck.Shape = Enum.PartType.Block;
            deck.Anchored = false;
            deck.CanCollide = true;
            deck.Parent = boatModel;
            
            // Soldar deck al hull
            const deckWeld = new Instance("WeldConstraint");
            deckWeld.Part0 = hull;
            deckWeld.Part1 = deck;
            deckWeld.Parent = hull;
            
            // ASIENTO DE VEHÍCULO para controles
            const vehicleSeat = new Instance("VehicleSeat");
            vehicleSeat.Name = "DriverSeat";
            vehicleSeat.Size = new Vector3(2, 1, 2);
            vehicleSeat.Position = new Vector3(spawnPosition.X, spawnPosition.Y + 3, spawnPosition.Z + 6); // Parte trasera
            vehicleSeat.Material = Enum.Material.Fabric;
            vehicleSeat.BrickColor = new BrickColor("Really red");
            vehicleSeat.Anchored = false;
            vehicleSeat.CanCollide = false;
            vehicleSeat.Parent = boatModel;
            
            // Soldar el asiento al deck
            const seatWeld = new Instance("WeldConstraint");
            seatWeld.Part0 = deck;
            seatWeld.Part1 = vehicleSeat;
            seatWeld.Parent = deck;
            
            // PrimaryPart para el modelo
            boatModel.PrimaryPart = hull;
            
            // FLOTACIÓN SIMPLE usando BodyPosition
            const bodyPosition = new Instance("BodyPosition");
            bodyPosition.MaxForce = new Vector3(0, math.huge, 0); // Solo Y
            bodyPosition.Position = new Vector3(spawnPosition.X, this.WATER_LEVEL + 1.5, spawnPosition.Z);
            bodyPosition.D = 3000; // Más damping para estabilidad
            bodyPosition.P = 15000; // Más power para mantener flotación
            bodyPosition.Parent = hull;
            
            // ESTABILIZACIÓN ROTACIONAL usando BodyGyro (CLAVE PARA ESTABILIDAD)
            const bodyGyro = new Instance("BodyGyro");
            bodyGyro.MaxTorque = new Vector3(math.huge, 0, math.huge); // Estabilizar X y Z, permitir Y
            bodyGyro.CFrame = hull.CFrame; // Mantener orientación inicial
            bodyGyro.D = 5000; // Alto damping para resistir movimientos bruscos
            bodyGyro.P = 8000; // Power para mantener estabilidad
            bodyGyro.Parent = hull;
            
            // MOVIMIENTO usando BodyVelocity
            const bodyVelocity = new Instance("BodyVelocity");
            bodyVelocity.MaxForce = new Vector3(math.huge, 0, math.huge); // Solo X y Z
            bodyVelocity.Velocity = new Vector3(0, 0, 0);
            bodyVelocity.Parent = hull;
            
            // GIRO usando BodyAngularVelocity
            const bodyAngularVelocity = new Instance("BodyAngularVelocity");
            bodyAngularVelocity.MaxTorque = new Vector3(0, math.huge, 0); // Solo Y (giro)
            bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
            bodyAngularVelocity.P = 3000;
            bodyAngularVelocity.Parent = hull;
            
            // Registrar barco
            const simpleBoat: SimpleBoat = {
                model: boatModel,
                hull: hull,
                deck: deck,
                seat: vehicleSeat,
                bodyPosition: bodyPosition,
                bodyVelocity: bodyVelocity,
                bodyGyro: bodyGyro,
                bodyAngularVelocity: bodyAngularVelocity,
                owner: player
            };
            
            // SISTEMA DE CONTROLES Y ESTABILIZACIÓN CON RESTRICCIÓN DE AGUA
            const controlConnection = RunService.Heartbeat.Connect(() => {
                this.updateBoatControls(simpleBoat);
            });
            
            simpleBoat.connection = controlConnection;
            this.spawnedBoats.set(player, simpleBoat);
            
            print(`🚢 ${player.Name} spawneó barco estable con restricción de agua en Y=${spawnPosition.Y}`);
            print(`🌊 Controles: WASD para mover SOLO EN AGUA`);
            print(`⚖️ Estabilidad: BodyGyro + detección de agua + masa custom`);
            return true;
            
        } catch (error) {
            warn(`❌ Error spawneando barco estable: ${error}`);
            return false;
        }
    }
    
    /**
     * Actualiza los controles del barco CON RESTRICCIÓN DE AGUA y mantiene estabilidad
     */
    private updateBoatControls(boat: SimpleBoat): void {
        const seat = boat.seat;
        const hull = boat.hull;
        
        // Solo procesar si alguien está sentado
        if (!seat.Occupant) {
            boat.bodyVelocity.Velocity = new Vector3(0, 0, 0);
            boat.bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
            return;
        }
        
        // 🌊 VERIFICAR SI EL BARCO ESTÁ EN AGUA ANTES DE PERMITIR MOVIMIENTO
        const isInWater = this.isBoatInWater(boat);
        
        if (!isInWater) {
            // ❌ NO ESTÁ EN AGUA - DETENER MOVIMIENTO
            boat.bodyVelocity.Velocity = new Vector3(0, 0, 0);
            boat.bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
            
            // Opcional: Mostrar feedback visual o de audio
            // Esto se podría mover a un evento para el cliente
            if (math.random() < 0.01) { // Solo ocasionalmente para no spamear
                print(`🚫 ${boat.owner.Name}: Barco no puede moverse fuera del agua`);
            }
            
            // Mantener flotación aunque no se pueda mover
            const currentPos = hull.Position;
            boat.bodyPosition.Position = new Vector3(currentPos.X, this.WATER_LEVEL + 1.5, currentPos.Z);
            
            // Mantener estabilidad
            const currentCFrame = hull.CFrame;
            const uprightCFrame = new CFrame(currentCFrame.Position, currentCFrame.Position.add(currentCFrame.LookVector));
            boat.bodyGyro.CFrame = uprightCFrame;
            
            return; // Salir temprano - no permitir movimiento
        }
        
        // ✅ ESTÁ EN AGUA - PERMITIR MOVIMIENTO NORMAL
        
        // Obtener inputs del VehicleSeat
        const throttle = seat.Throttle; // -1 a 1 (W/S)
        const steer = seat.Steer;       // -1 a 1 (A/D)
        
        // Calcular movimiento hacia adelante/atrás
        const forwardVector = hull.CFrame.LookVector;
        const targetVelocity = forwardVector.mul(throttle * this.MAX_SPEED);
        
        // Aplicar movimiento
        boat.bodyVelocity.Velocity = targetVelocity;
        
        // Aplicar giro (solo cuando se está moviendo)
        const angularVelocity = math.abs(throttle) > 0.1 ? steer * this.TURN_SPEED : 0;
        boat.bodyAngularVelocity.AngularVelocity = new Vector3(0, angularVelocity, 0);
        
        // Mantener flotación
        const currentPos = hull.Position;
        boat.bodyPosition.Position = new Vector3(currentPos.X, this.WATER_LEVEL + 1.5, currentPos.Z);
        
        // MANTENER ESTABILIDAD - Actualizar BodyGyro para resistir volcadas
        const currentCFrame = hull.CFrame;
        const uprightCFrame = new CFrame(currentCFrame.Position, currentCFrame.Position.add(currentCFrame.LookVector));
        boat.bodyGyro.CFrame = uprightCFrame; // Mantener barco derecho
    }
    
    /**
     * Despawnea un barco
     */
    public despawnBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        // Desconectar el sistema de controles
        if (boat.connection) {
            boat.connection.Disconnect();
        }
        
        boat.model.Destroy();
        this.spawnedBoats.delete(player);
        
        print(`🗑️ ${player.Name} despawneó su barco con restricción de agua`);
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
    
    /**
     * Obtiene el asiento del barco de un jugador (para teleportar al jugador)
     */
    public getPlayerBoatSeat(player: Player): VehicleSeat | undefined {
        const boat = this.spawnedBoats.get(player);
        return boat ? boat.seat : undefined;
    }
    
    /**
     * Fuerza la estabilización del barco (útil si se voltea)
     */
    public stabilizeBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        // Resetear orientación
        const currentPos = boat.hull.Position;
        const uprightCFrame = new CFrame(
            currentPos,
            currentPos.add(new Vector3(0, 0, -1)) // Mirar hacia adelante
        );
        
        boat.hull.CFrame = uprightCFrame;
        boat.bodyGyro.CFrame = uprightCFrame;
        
        print(`⚖️ ${player.Name}: Barco estabilizado manualmente`);
        return true;
    }
    
    /**
     * Método público para verificar si un barco específico está en agua
     * Útil para debugging o UI
     */
    public isPlayerBoatInWater(player: Player): boolean | undefined {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return undefined;
        
        return this.isBoatInWater(boat);
    }
} 
