// ===== SIMPLE BOAT SERVICE - SISTEMA MÍNIMO Y FUNCIONAL =====
// Basado en: https://devforum.roblox.com/t/realistic-boat-system-floats-on-terrain-water-optimized-free/3541235

import { OnStart, Service } from "@flamework/core";
import { Workspace, RunService, ReplicatedStorage } from "@rbxts/services";

// NUEVO: Interfaz para objetos del barco
interface BoatObject {
    name: string;
    part: Part;
    type: "speaker" | "decoration"; // Tipos de objetos disponibles
    isActive: boolean;
}

// NUEVO: Interfaz específica para bocinas
interface BoatSpeaker extends BoatObject {
    type: "speaker";
    sound: Sound;
    musicId: string;
    volume: number;
    isPlaying: boolean;
}

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
    // NUEVO: Sistema de objetos del barco
    objects: Map<string, BoatObject>; // ID del objeto -> objeto
    maxObjects: number; // Límite de objetos por barco
}

@Service()
export class SimpleBoatService implements OnStart {
    private spawnedBoats = new Map<Player, SimpleBoat>();
    private readonly WATER_LEVEL = 5; // Nivel fijo del agua (de IslandService)
    
    // Configuración de controles
    private readonly MAX_SPEED = 50; // Velocidad máxima
    private readonly TURN_SPEED = 5; // Velocidad de giro
    
    // NUEVOS: Límites de rotación para estabilidad realista
    private readonly MAX_ROLL_DEGREES = 15; // Máximo balanceo lateral (en grados)
    private readonly MAX_PITCH_DEGREES = 10; // Máximo cabeceo adelante/atrás (en grados)
    
    // NUEVO: Configuración para objetos del barco
    private readonly MAX_OBJECTS_PER_BOAT = 5; // Máximo 5 objetos por barco
    private readonly SPEAKER_VOLUME = 0.8; // Volumen base de las bocinas
    private readonly SPEAKER_SIZE = new Vector3(2, 3, 2); // Tamaño de la bocina
    
    // NUEVO: Configuración para modelos personalizados
    private readonly CUSTOM_BOAT_MODELS_FOLDER = "BoatModels"; // Carpeta en ReplicatedStorage
    private readonly DEFAULT_CUSTOM_MODEL = "DefaultBoat"; // Nombre del modelo por defecto
    
    // NUEVO: Lista de música disponible para bocinas (IDs de Roblox)
    private readonly AVAILABLE_MUSIC = [
        "142376088", // Música de playa relajante
        "5410086218", // Música de aventura
        "1839246711", // Música tropical
        "2735563984", // Música de ambiente marino
        "5567523008", // Música épica
        // AGREGAR TUS PROPIOS IDs AQUÍ:
        // "TU_ID_AQUI", // Tu música personalizada 1
        // "OTRO_ID_AQUI", // Tu música personalizada 2
    ];

    // NUEVO: Música personalizada que se puede agregar dinámicamente
    private customMusic = new Map<string, string>(); // name -> musicId

    onStart(): void {
        print("🚢 SimpleBoatService iniciado - Sistema estable con límites de rotación realistas");
        print("🔊 NUEVO: Sistema de objetos para barcos - Bocinas disponibles!");
        print("🎨 NUEVO: Sistema de modelos personalizados - Usa spawnCustomBoat()!");
    }
    
    /**
     * Detecta si el barco está sobre agua usando raycast
     * Esta es la mejor práctica según DevForum de Roblox
     * MEJORADO: Evita que el barco se meta bajo terreno sólido
     */
    private isBoatInWater(boat: SimpleBoat): boolean {
        const hull = boat.hull;
        const hullPosition = hull.Position;
        
        // MÉTODO 1: Verificación simple de altura (rápido)
        // Si está muy por debajo del nivel del agua, definitivamente no está en agua navegable
        if (hullPosition.Y < this.WATER_LEVEL - 2) {
            return false;
        }
        
        // NUEVO: Verificación de que no esté demasiado ARRIBA tampoco
        if (hullPosition.Y > this.WATER_LEVEL + 5) {
            return false; // Muy alto, probablemente en tierra
        }
        
        // NUEVO: MÉTODO CRÍTICO - Raycast hacia ARRIBA para detectar si hay terreno sólido encima
        // Esto evita que el barco se meta "bajo" islas o terreno
        const upRaycastParams = new RaycastParams();
        upRaycastParams.FilterType = Enum.RaycastFilterType.Exclude;
        upRaycastParams.FilterDescendantsInstances = [boat.model]; // Excluir el propio barco
        
        const upRayOrigin = hullPosition;
        const upRayDirection = new Vector3(0, 15, 0); // 15 studs hacia arriba
        
        const upRaycastResult = Workspace.Raycast(upRayOrigin, upRayDirection, upRaycastParams);
        
        if (upRaycastResult && upRaycastResult.Instance) {
            const hitInstance = upRaycastResult.Instance;
            const hitPosition = upRaycastResult.Position;
            
            // Si hay terreno sólido muy cerca arriba del barco, está "bajo" algo
            if (hitPosition.Y < hullPosition.Y + 8) { // Menos de 8 studs de espacio arriba
                // Verificar si es terreno sólido (no océano)
                if (hitInstance.Name !== "Ocean" && 
                    hitInstance.Material !== Enum.Material.Water &&
                    hitInstance.CanCollide === true) {
                    print(`🚫 Barco detectado BAJO terreno sólido: ${hitInstance.Name} a Y=${hitPosition.Y}`);
                    return false; // Está metido bajo terreno - NO permitir
                }
            }
        }
        
        // MÉTODO 2: Raycast hacia abajo para detectar qué hay debajo del barco
        const downRaycastParams = new RaycastParams();
        downRaycastParams.FilterType = Enum.RaycastFilterType.Exclude;
        downRaycastParams.FilterDescendantsInstances = [boat.model]; // Excluir el propio barco
        
        // Raycast desde el centro del hull hacia abajo
        const downRayOrigin = hullPosition.add(new Vector3(0, 2, 0)); // 2 studs arriba del hull
        const downRayDirection = new Vector3(0, -10, 0); // 10 studs hacia abajo
        
        const downRaycastResult = Workspace.Raycast(downRayOrigin, downRayDirection, downRaycastParams);
        
        if (downRaycastResult && downRaycastResult.Instance) {
            const hitInstance = downRaycastResult.Instance;
            const hitPosition = downRaycastResult.Position;
            
            // VERIFICACIONES PARA DETERMINAR SI ES AGUA:
            
            // 1. Si toca el océano creado por IslandService
            if (hitInstance.Name === "Ocean" && hitInstance.Material === Enum.Material.Water) {
                // NUEVO: Verificar que esté cerca de la superficie del océano
                const distanceToWaterSurface = math.abs(hullPosition.Y - this.WATER_LEVEL);
                if (distanceToWaterSurface <= 3) {
                    return true; // En la superficie del océano
                } else {
                    print(`🚫 Barco demasiado lejos de superficie: distancia=${distanceToWaterSurface}`);
                    return false; // Está flotando muy lejos de la superficie
                }
            }
            
            // 2. Si toca cualquier material de agua
            if (downRaycastResult.Material === Enum.Material.Water) {
                // NUEVO: Verificar distancia a superficie de agua
                const distanceToWaterSurface = math.abs(hullPosition.Y - this.WATER_LEVEL);
                if (distanceToWaterSurface <= 3) {
                    return true;
                } else {
                    print(`🚫 Barco en agua pero lejos de superficie: distancia=${distanceToWaterSurface}`);
                    return false;
                }
            }
            
            // 3. Si el raycast toca algo sólido muy cerca del nivel del agua, NO es agua navegable
            if (hitPosition.Y > this.WATER_LEVEL - 1 && hitInstance.CanCollide === true) {
                print(`🚫 Terreno sólido detectado cerca del agua: ${hitInstance.Name} a Y=${hitPosition.Y}`);
                return false; // Hay terreno sólido cerca de la superficie
            }
        }
        
        // MÉTODO 3: Si no toca nada sólido y está cerca del nivel del agua, probablemente es agua
        // MEJORADO: Rango más estricto para evitar problemas
        if (hullPosition.Y >= this.WATER_LEVEL - 1 && hullPosition.Y <= this.WATER_LEVEL + 3) {
            return true;
        }
        
        // Por defecto, si hay dudas, no permitir movimiento
        print(`🚫 Barco en posición inválida: Y=${hullPosition.Y}, WaterLevel=${this.WATER_LEVEL}`);
        return false;
    }
    
    /**
     * Spawna un barco simple ESTABLE que FUNCIONA y se puede conducir
     * MEJORADO: Ahora incluye sistema de objetos
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
            
            // PROPIEDADES FÍSICAS MEJORADAS - MÁS ESTABILIDAD CONTRA VOLCADAS
            const hullPhysics = new PhysicalProperties(
                3.0,    // AUMENTADO: Density (más denso = más pesado = más estable)
                1.2,    // AUMENTADO: Friction (más agarre con el agua)
                0.1,    // REDUCIDO: Elasticity (menos rebote al chocar)
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
            const bodyGyro = this.setupStabilizedBodyGyro(hull);
            
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
            
            // NUEVO: Registrar barco con sistema de objetos
            const simpleBoat: SimpleBoat = {
                model: boatModel,
                hull: hull,
                deck: deck,
                seat: vehicleSeat,
                bodyPosition: bodyPosition,
                bodyVelocity: bodyVelocity,
                bodyGyro: bodyGyro,
                bodyAngularVelocity: bodyAngularVelocity,
                owner: player,
                objects: new Map<string, BoatObject>(), // Sistema de objetos vacío
                maxObjects: this.MAX_OBJECTS_PER_BOAT
            };
            
            // SISTEMA DE CONTROLES Y ESTABILIZACIÓN CON RESTRICCIÓN DE AGUA
            const controlConnection = RunService.Heartbeat.Connect(() => {
                this.updateBoatControls(simpleBoat);
            });
            
            simpleBoat.connection = controlConnection;
            this.spawnedBoats.set(player, simpleBoat);
            
            print(`🚢 ${player.Name} spawneó barco estable con restricción de agua en Y=${spawnPosition.Y}`);
            print(`🌊 Controles: WASD para mover SOLO EN AGUA`);
            print(`⚖️ Estabilidad: BodyGyro + detección de agua + masa custom + límites de rotación`);
            print(`🔄 Límites: Pitch ±${this.MAX_PITCH_DEGREES}°, Roll ±${this.MAX_ROLL_DEGREES}° (movimiento realista)`);
            print(`🔊 NUEVO: Usa addSpeakerToBoat() para agregar bocinas con música!`);
            return true;
            
        } catch (error) {
            warn(`❌ Error spawneando barco estable: ${error}`);
            return false;
        }
    }
    
    /**
     * Reposiciona el barco a una posición segura en agua si está atascado
     */
    private repositionBoatToSafeWater(boat: SimpleBoat): boolean {
        const hull = boat.hull;
        const currentPosition = hull.Position;
        
        print(`🔧 Intentando reposicionar barco de ${boat.owner.Name} desde posición inválida: ${currentPosition}`);
        
        // Intentar varias posiciones seguras alrededor del barco
        const searchOffsets = [
            new Vector3(0, 5, 0),      // Directamente arriba
            new Vector3(10, 3, 0),     // Este
            new Vector3(-10, 3, 0),    // Oeste  
            new Vector3(0, 3, 10),     // Norte
            new Vector3(0, 3, -10),    // Sur
            new Vector3(15, 5, 15),    // Noreste, más alto
            new Vector3(-15, 5, 15),   // Noroeste, más alto
            new Vector3(15, 5, -15),   // Sureste, más alto
            new Vector3(-15, 5, -15),  // Suroeste, más alto
        ];
        
        for (const offset of searchOffsets) {
            const testPosition = new Vector3(
                currentPosition.X + offset.X,
                this.WATER_LEVEL + offset.Y, // Basado en nivel del agua + offset
                currentPosition.Z + offset.Z
            );
            
            // Verificar si esta posición es segura haciendo un raycast rápido
            const raycastParams = new RaycastParams();
            raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
            raycastParams.FilterDescendantsInstances = [boat.model];
            
            // Raycast hacia abajo para ver qué hay
            const rayOrigin = testPosition.add(new Vector3(0, 5, 0));
            const rayDirection = new Vector3(0, -15, 0);
            const rayResult = Workspace.Raycast(rayOrigin, rayDirection, raycastParams);
            
            let isPositionSafe = false;
            
            if (rayResult && rayResult.Instance) {
                const hitInstance = rayResult.Instance;
                // Es seguro si toca océano o agua
                if ((hitInstance.Name === "Ocean" && hitInstance.Material === Enum.Material.Water) ||
                    rayResult.Material === Enum.Material.Water) {
                    isPositionSafe = true;
                }
            } else {
                // Si no toca nada y está cerca del nivel del agua, probablemente es seguro
                if (testPosition.Y >= this.WATER_LEVEL && testPosition.Y <= this.WATER_LEVEL + 3) {
                    isPositionSafe = true;
                }
            }
            
            if (isPositionSafe) {
                // REPOSICIONAR EL BARCO
                print(`✅ Reposicionando barco a posición segura: ${testPosition}`);
                
                // Mover todo el modelo del barco
                const offsetVector = testPosition.sub(hull.Position);
                boat.model.SetPrimaryPartCFrame(hull.CFrame.add(offsetVector));
                
                // Actualizar BodyPosition para mantener flotación
                boat.bodyPosition.Position = testPosition;
                
                // Resetear velocidades para evitar movimientos extraños
                boat.bodyVelocity.Velocity = new Vector3(0, 0, 0);
                boat.bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
                
                // Estabilizar orientación
                const uprightCFrame = new CFrame(testPosition, testPosition.add(new Vector3(0, 0, -1)));
                boat.bodyGyro.CFrame = uprightCFrame;
                
                return true; // Éxito
            }
        }
        
        print(`❌ No se pudo encontrar posición segura para el barco de ${boat.owner.Name}`);
        return false; // No se encontró posición segura
    }
    
    /**
     * Actualiza los controles del barco CON RESTRICCIÓN DE AGUA y mantiene estabilidad
     */
    private updateBoatControls(boat: SimpleBoat): void {
        const seat = boat.seat;
        const hull = boat.hull;
        
        // NUEVO: Aplicar límites de rotación SIEMPRE (incluso sin ocupante)
        this.applyRotationLimits(boat);
        
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
            
            // NUEVO: Intentar reposicionar automáticamente si está atascado
            // Solo intentar ocasionalmente para no ser muy agresivo
            if (math.random() < 0.05) { // 5% de probabilidad cada frame
                const repositioned = this.repositionBoatToSafeWater(boat);
                if (repositioned) {
                    print(`🔧 ${boat.owner.Name}: Barco reposicionado automáticamente a agua segura`);
                    return; // Salir y permitir que el siguiente frame verifique la nueva posición
                }
            }
            
            // Opcional: Mostrar feedback visual o de audio
            if (math.random() < 0.01) { // Solo ocasionalmente para no spamear
                print(`🚫 ${boat.owner.Name}: Barco no puede moverse fuera del agua`);
            }
            
            // Mantener flotación aunque no se pueda mover
            const currentPos = hull.Position;
            boat.bodyPosition.Position = new Vector3(currentPos.X, this.WATER_LEVEL + 1.5, currentPos.Z);
            
            // MEJORADO: Estabilización con límites de rotación
            this.applyStabilizedOrientation(boat);
            
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
        
        // MEJORADO: Estabilización con límites de rotación en lugar de orientación fija
        this.applyStabilizedOrientation(boat);
    }
    
    /**
     * NUEVO: Aplica orientación estabilizada respetando límites de rotación
     */
    private applyStabilizedOrientation(boat: SimpleBoat): void {
        const hull = boat.hull;
        const currentCFrame = hull.CFrame;
        
        // En lugar de forzar una orientación completamente vertical,
        // mantener la orientación actual pero dentro de límites seguros
        const currentRotation = currentCFrame.ToEulerAnglesYXZ();
        const [currentY, currentX, currentZ] = currentRotation;
        
        // Aplicar estabilización gradual hacia orientación más equilibrada
        let targetPitch = currentX;
        let targetRoll = currentZ;
        
        // Gradualmente reducir pitch y roll hacia 0, pero permitir cierto movimiento
        const stabilizationFactor = 0.95; // Qué tan rápido se estabiliza (0.95 = estabilización gradual)
        
        targetPitch = targetPitch * stabilizationFactor;
        targetRoll = targetRoll * stabilizationFactor;
        
        // Aplicar límites (esto ya se hace en applyRotationLimits, pero doble verificación)
        const pitchDegrees = math.deg(targetPitch);
        const rollDegrees = math.deg(targetRoll);
        
        if (math.abs(pitchDegrees) > this.MAX_PITCH_DEGREES) {
            const sign = pitchDegrees > 0 ? 1 : -1;
            targetPitch = math.rad(sign * this.MAX_PITCH_DEGREES);
        }
        
        if (math.abs(rollDegrees) > this.MAX_ROLL_DEGREES) {
            const sign = rollDegrees > 0 ? 1 : -1;
            targetRoll = math.rad(sign * this.MAX_ROLL_DEGREES);
        }
        
        // CORREGIDO: Crear orientación objetivo estabilizada con sintaxis correcta
        const stabilizedRotation = CFrame.fromEulerAnglesYXZ(currentY, targetPitch, targetRoll);
        const stabilizedCFrame = new CFrame(currentCFrame.Position).mul(stabilizedRotation);
        boat.bodyGyro.CFrame = stabilizedCFrame;
    }
    
    /**
     * Despawnea un barco
     * MEJORADO: Ahora limpia todos los objetos del barco
     */
    public despawnBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        // NUEVO: Limpiar todos los objetos del barco primero
        for (const [id, obj] of boat.objects) {
            if (obj.type === "speaker") {
                const speaker = obj as BoatSpeaker;
                if (speaker.isPlaying) {
                    speaker.sound.Stop();
                }
            }
            // Los objetos se destruirán automáticamente con el modelo del barco
        }
        
        // Desconectar el sistema de controles
        if (boat.connection) {
            boat.connection.Disconnect();
        }
        
        boat.model.Destroy();
        this.spawnedBoats.delete(player);
        
        print(`🗑️ ${player.Name} despawneó su barco con ${boat.objects.size()} objeto(s)`);
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
     * MEJORADO: También intenta reposicionar si está en posición inválida
     */
    public stabilizeBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        // Verificar si está en una posición válida primero
        const isInValidPosition = this.isBoatInWater(boat);
        
        if (!isInValidPosition) {
            // Intentar reposicionar a agua segura
            print(`🔧 ${player.Name}: Barco en posición inválida, intentando reposicionar...`);
            const repositioned = this.repositionBoatToSafeWater(boat);
            
            if (repositioned) {
                print(`✅ ${player.Name}: Barco reposicionado a agua segura durante estabilización`);
                return true;
            } else {
                warn(`❌ ${player.Name}: No se pudo reposicionar barco a posición segura`);
                // Continuar con estabilización normal como respaldo
            }
        }
        
        // Resetear orientación (estabilización normal)
        const currentPos = boat.hull.Position;
        const uprightCFrame = new CFrame(
            currentPos,
            currentPos.add(new Vector3(0, 0, -1)) // Mirar hacia adelante
        );
        
        boat.hull.CFrame = uprightCFrame;
        boat.bodyGyro.CFrame = uprightCFrame;
        
        // Asegurar que esté en nivel del agua correcto
        boat.bodyPosition.Position = new Vector3(currentPos.X, this.WATER_LEVEL + 1.5, currentPos.Z);
        
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
    
    /**
     * NUEVO: Método público para forzar reposicionamiento a agua segura
     * Útil para comandos de admin o debugging
     */
    public forceRepositionBoatToWater(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) {
            print(`❌ ${player.Name} no tiene un barco spawneado`);
            return false;
        }
        
        print(`🔧 Forzando reposicionamiento del barco de ${player.Name}...`);
        const success = this.repositionBoatToSafeWater(boat);
        
        if (success) {
            print(`✅ ${player.Name}: Barco reposicionado manualmente a agua segura`);
        } else {
            warn(`❌ ${player.Name}: Falló el reposicionamiento manual del barco`);
        }
        
        return success;
    }
    
    /**
     * NUEVO: Obtiene información detallada del estado del barco para debugging
     */
    public getBoatDebugInfo(player: Player): string | undefined {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return undefined;
        
        const hull = boat.hull;
        const position = hull.Position;
        const isInWater = this.isBoatInWater(boat);
        const distanceToWaterLevel = math.abs(position.Y - this.WATER_LEVEL);
        
        return `🚢 Barco de ${player.Name}:
        📍 Posición: (${math.floor(position.X)}, ${math.floor(position.Y)}, ${math.floor(position.Z)})
        🌊 En agua: ${isInWater ? "✅ SÍ" : "❌ NO"}
        📏 Distancia a superficie: ${math.floor(distanceToWaterLevel * 10) / 10} studs
        🎯 Nivel del agua: ${this.WATER_LEVEL}
        👤 Ocupado: ${boat.seat.Occupant ? "✅ SÍ" : "❌ NO"}`;
    }
    
    /**
     * NUEVO: Configuración mejorada del BodyGyro con límites de torque
     */
    private setupStabilizedBodyGyro(hull: Part): BodyGyro {
        const bodyGyro = new Instance("BodyGyro");
        
        // CONFIGURACIÓN MEJORADA para mayor estabilidad
        bodyGyro.MaxTorque = new Vector3(
            50000,  // X (Pitch) - Moderado para permitir cabeceo natural
            0,      // Y (Yaw) - Libre rotación para girar
            50000   // Z (Roll) - Moderado para permitir balanceo natural
        );
        
        bodyGyro.CFrame = hull.CFrame; // Mantener orientación inicial
        bodyGyro.D = 8000; // AUMENTADO: Más damping para resistir volcadas bruscas
        bodyGyro.P = 12000; // AUMENTADO: Más power para mantener estabilidad
        bodyGyro.Parent = hull;
        
        return bodyGyro;
    }
    
    /**
     * NUEVO: Aplica límites de rotación realistas al barco
     * Evita que se voltee pero permite movimiento natural del agua
     */
    private applyRotationLimits(boat: SimpleBoat): void {
        const hull = boat.hull;
        const currentCFrame = hull.CFrame;
        
        // Obtener los ángulos de rotación actuales
        const currentRotation = currentCFrame.ToEulerAnglesYXZ();
        const [currentY, currentX, currentZ] = currentRotation; // Y=Yaw, X=Pitch, Z=Roll
        
        // Convertir a grados para trabajar más fácil
        const currentPitchDegrees = math.deg(currentX);
        const currentRollDegrees = math.deg(currentZ);
        
        // Aplicar límites
        let limitedPitch = currentX;
        let limitedRoll = currentZ;
        
        // Limitar PITCH (cabeceo adelante/atrás)
        if (math.abs(currentPitchDegrees) > this.MAX_PITCH_DEGREES) {
            const sign = currentPitchDegrees > 0 ? 1 : -1;
            limitedPitch = math.rad(sign * this.MAX_PITCH_DEGREES);
        }
        
        // Limitar ROLL (balanceo lateral)
        if (math.abs(currentRollDegrees) > this.MAX_ROLL_DEGREES) {
            const sign = currentRollDegrees > 0 ? 1 : -1;
            limitedRoll = math.rad(sign * this.MAX_ROLL_DEGREES);
        }
        
        // Si se aplicaron límites, crear nueva orientación limitada
        if (limitedPitch !== currentX || limitedRoll !== currentZ) {
            // CORREGIDO: Usar sintaxis correcta de CFrame
            const limitedRotation = CFrame.fromEulerAnglesYXZ(currentY, limitedPitch, limitedRoll);
            const limitedCFrame = new CFrame(currentCFrame.Position).mul(limitedRotation);
            
            // Aplicar la orientación limitada al BodyGyro
            boat.bodyGyro.CFrame = limitedCFrame;
            
            // Opcional: Log para debugging
            if (math.random() < 0.01) { // Solo ocasionalmente
                print(`⚖️ ${boat.owner.Name}: Rotación limitada - Pitch: ${math.floor(math.deg(limitedPitch))}°, Roll: ${math.floor(math.deg(limitedRoll))}°`);
            }
        }
    }
    
    /**
     * NUEVO: Agrega una bocina grande al barco que emite música por proximidad
     */
    public addSpeakerToBoat(player: Player, musicIndex?: number): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) {
            print(`❌ ${player.Name} no tiene un barco spawneado`);
            return false;
        }
        
        // Verificar límite de objetos
        if (boat.objects.size() >= boat.maxObjects) {
            print(`❌ ${player.Name}: Barco ya tiene el máximo de objetos (${boat.maxObjects})`);
            return false;
        }
        
        // Verificar si ya tiene una bocina
        const existingSpeaker = this.findBoatObjectByType(boat, "speaker");
        if (existingSpeaker) {
            print(`❌ ${player.Name}: El barco ya tiene una bocina. Usa removeSpeakerFromBoat() primero.`);
            return false;
        }
        
        try {
            // Seleccionar música aleatoria o específica
            const selectedMusicIndex = musicIndex !== undefined ? 
                math.min(math.max(musicIndex, 0), this.getTotalMusicCount() - 1) : 
                math.floor(math.random() * this.getTotalMusicCount());
            
            const musicId = this.getMusicId(selectedMusicIndex);
            if (!musicId) {
                print(`❌ ${player.Name}: Índice de música inválido: ${selectedMusicIndex}`);
                return false;
            }
            
            // Crear la bocina física
            const speakerPart = new Instance("Part");
            speakerPart.Name = "BoatSpeaker";
            speakerPart.Size = this.SPEAKER_SIZE;
            
            // Posicionar la bocina en el centro del deck, un poco elevada
            const deckPosition = boat.deck.Position;
            speakerPart.Position = new Vector3(
                deckPosition.X,
                deckPosition.Y + (this.SPEAKER_SIZE.Y / 2) + 0.5, // Arriba del deck
                deckPosition.Z - 3 // Un poco hacia adelante
            );
            
            // Apariencia de bocina profesional
            speakerPart.Material = Enum.Material.Plastic;
            speakerPart.BrickColor = new BrickColor("Really black");
            speakerPart.Shape = Enum.PartType.Block;
            speakerPart.Anchored = false;
            speakerPart.CanCollide = true;
            speakerPart.Parent = boat.model;
            
            // Soldar la bocina al deck para que se mueva con el barco
            const speakerWeld = new Instance("WeldConstraint");
            speakerWeld.Part0 = boat.deck;
            speakerWeld.Part1 = speakerPart;
            speakerWeld.Parent = boat.deck;
            
            // DETALLES VISUALES: Agregar mesh o decoraciones
            const speakerMesh = new Instance("SpecialMesh");
            speakerMesh.MeshType = Enum.MeshType.Cylinder;
            speakerMesh.Scale = new Vector3(1, 1.2, 1); // Ligeramente más alta
            speakerMesh.Parent = speakerPart;
            
            // Agregar un cono de altavoz en el frente
            const speakerCone = new Instance("Part");
            speakerCone.Name = "SpeakerCone";
            speakerCone.Size = new Vector3(1.5, 0.2, 1.5);
            speakerCone.Position = speakerPart.Position.add(new Vector3(0, 0, -1.2));
            speakerCone.Material = Enum.Material.Neon;
            speakerCone.BrickColor = new BrickColor("Bright blue");
            speakerCone.Shape = Enum.PartType.Cylinder;
            speakerCone.Anchored = false;
            speakerCone.CanCollide = false;
            speakerCone.Parent = boat.model;
            
            // Soldar el cono a la bocina
            const coneWeld = new Instance("WeldConstraint");
            coneWeld.Part0 = speakerPart;
            coneWeld.Part1 = speakerCone;
            coneWeld.Parent = speakerPart;
            
            // AUDIO VOLUMÉTRICO: Crear objeto Sound con audio posicional
            const sound = new Instance("Sound");
            sound.Name = "BoatMusic";
            sound.SoundId = `rbxassetid://${musicId}`;
            sound.Volume = this.SPEAKER_VOLUME;
            sound.Looped = true;
            sound.PlayOnRemove = false;
            
            // CONFIGURACIÓN CRÍTICA: Audio volumétrico para proximidad realista
            sound.RollOffMode = Enum.RollOffMode.Linear;
            sound.MinDistance = 10; // Distancia mínima donde el audio está a volumen máximo
            sound.MaxDistance = 100; // Distancia máxima donde el audio se escucha
            
            // NUEVO: Habilitar audio volumétrico (la característica clave)
            // Esto hace que el audio se comporte como sonido 3D realista
            sound.EmitterSize = 15; // Tamaño del emisor para audio volumétrico
            
            // Parent del sound a la bocina para audio posicional
            sound.Parent = speakerPart;
            
            // Crear el objeto bocina
            const speakerObject: BoatSpeaker = {
                name: "MainSpeaker",
                part: speakerPart,
                type: "speaker",
                isActive: true,
                sound: sound,
                musicId: musicId,
                volume: this.SPEAKER_VOLUME,
                isPlaying: false
            };
            
            // Agregar al barco
            boat.objects.set("speaker_main", speakerObject);
            
            // Iniciar la música automáticamente
            this.toggleSpeaker(player, true);
            
            print(`🔊 ${player.Name}: Bocina agregada al barco con música ID ${musicId}`);
            print(`🎵 Audio volumétrico habilitado - Se escuchará por proximidad (10-100 studs)`);
            print(`🎮 Usa toggleSpeaker() para pausar/reanudar la música`);
            
            return true;
            
        } catch (error) {
            warn(`❌ Error agregando bocina al barco: ${error}`);
            return false;
        }
    }
    
    /**
     * NUEVO: Remueve la bocina del barco
     */
    public removeSpeakerFromBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        const speaker = boat.objects.get("speaker_main") as BoatSpeaker;
        if (!speaker) {
            print(`❌ ${player.Name}: No hay bocina en el barco para remover`);
            return false;
        }
        
        // Detener la música antes de remover
        if (speaker.isPlaying) {
            speaker.sound.Stop();
        }
        
        // Destruir la parte física
        speaker.part.Destroy();
        
        // Remover del registro
        boat.objects.delete("speaker_main");
        
        print(`🗑️ ${player.Name}: Bocina removida del barco`);
        return true;
    }
    
    /**
     * NUEVO: Alterna la reproducción de música en la bocina
     */
    public toggleSpeaker(player: Player, forceState?: boolean): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        const speaker = boat.objects.get("speaker_main") as BoatSpeaker;
        if (!speaker) {
            print(`❌ ${player.Name}: No hay bocina en el barco`);
            return false;
        }
        
        const newState = forceState !== undefined ? forceState : !speaker.isPlaying;
        
        if (newState && !speaker.isPlaying) {
            // Iniciar música
            speaker.sound.Play();
            speaker.isPlaying = true;
            print(`🎵 ${player.Name}: Música iniciada en la bocina del barco`);
        } else if (!newState && speaker.isPlaying) {
            // Pausar música
            speaker.sound.Pause();
            speaker.isPlaying = false;
            print(`⏸️ ${player.Name}: Música pausada en la bocina del barco`);
        }
        
        return true;
    }
    
    /**
     * NUEVO: Cambia la música de la bocina
     */
    public changeSpeakerMusic(player: Player, musicIndex: number): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        const speaker = boat.objects.get("speaker_main") as BoatSpeaker;
        if (!speaker) {
            print(`❌ ${player.Name}: No hay bocina en el barco`);
            return false;
        }
        
        // Validar índice
        if (musicIndex < 0 || musicIndex >= this.getTotalMusicCount()) {
            print(`❌ ${player.Name}: Índice de música inválido (0-${this.getTotalMusicCount() - 1})`);
            return false;
        }
        
        const newMusicId = this.getMusicId(musicIndex);
        if (!newMusicId) {
            print(`❌ ${player.Name}: No se pudo obtener música para índice ${musicIndex}`);
            return false;
        }
        
        const wasPlaying = speaker.isPlaying;
        
        // Detener música actual
        if (speaker.isPlaying) {
            speaker.sound.Stop();
        }
        
        // Cambiar ID de música
        speaker.sound.SoundId = `rbxassetid://${newMusicId}`;
        speaker.musicId = newMusicId;
        
        // Reanudar si estaba reproduciendo
        if (wasPlaying) {
            speaker.sound.Play();
        }
        
        print(`🎵 ${player.Name}: Música cambiada a ID ${newMusicId} (índice ${musicIndex})`);
        return true;
    }
    
    /**
     * NUEVO: Obtiene información de la bocina del barco
     */
    public getSpeakerInfo(player: Player): string | undefined {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return undefined;
        
        const speaker = boat.objects.get("speaker_main") as BoatSpeaker;
        if (!speaker) {
            return `${player.Name}: No hay bocina en el barco`;
        }
        
        return `🔊 Bocina de ${player.Name}:
        🎵 Estado: ${speaker.isPlaying ? "🎶 REPRODUCIENDO" : "⏸️ PAUSADA"}
        🆔 Música ID: ${speaker.musicId}
        🔉 Volumen: ${math.floor(speaker.volume * 100)}%
        📍 Posición: Audio volumétrico (10-100 studs)
        🎮 Objetos del barco: ${boat.objects.size()}/${boat.maxObjects}`;
    }
    
    /**
     * NUEVO: Lista toda la música disponible
     */
    public listAvailableMusic(): string {
        let musicList = "🎵 Música disponible para bocinas:\n\n";
        
        // Música predeterminada
        musicList += "📀 MÚSICA PREDETERMINADA:\n";
        for (let i = 0; i < this.AVAILABLE_MUSIC.size(); i++) {
            musicList += `${i}: ID ${this.AVAILABLE_MUSIC[i]}\n`;
        }
        
        // Música personalizada
        if (this.customMusic.size() > 0) {
            musicList += "\n🎧 MÚSICA PERSONALIZADA:\n";
            let customIndex = this.AVAILABLE_MUSIC.size();
            for (const [name, id] of this.customMusic) {
                musicList += `${customIndex}: ${name} (ID: ${id})\n`;
                customIndex++;
            }
        }
        
        return musicList;
    }
    
    /**
     * NUEVO: Busca un objeto específico por tipo en el barco
     */
    private findBoatObjectByType(boat: SimpleBoat, objectType: "speaker" | "decoration"): BoatObject | undefined {
        for (const [id, obj] of boat.objects) {
            if (obj.type === objectType) {
                return obj;
            }
        }
        return undefined;
    }
    
    /**
     * NUEVO: Agrega música personalizada al sistema
     */
    public addCustomMusic(musicName: string, musicId: string): boolean {
        try {
            // Validar que el ID sea numérico
            const numericId = tonumber(musicId);
            if (!numericId) {
                print(`❌ ID de música inválido: ${musicId} - Debe ser solo números`);
                return false;
            }
            
            // Verificar que no exista ya
            if (this.customMusic.has(musicName)) {
                print(`❌ Ya existe música personalizada con nombre: ${musicName}`);
                return false;
            }
            
            // Agregar música personalizada
            this.customMusic.set(musicName, musicId);
            print(`✅ Música personalizada agregada: ${musicName} (ID: ${musicId})`);
            return true;
            
        } catch (error) {
            warn(`❌ Error agregando música personalizada: ${error}`);
            return false;
        }
    }
    
    /**
     * NUEVO: Remueve música personalizada
     */
    public removeCustomMusic(musicName: string): boolean {
        if (this.customMusic.has(musicName)) {
            this.customMusic.delete(musicName);
            print(`🗑️ Música personalizada removida: ${musicName}`);
            return true;
        } else {
            print(`❌ No se encontró música personalizada: ${musicName}`);
            return false;
        }
    }
    
    /**
     * NUEVO: Obtiene ID de música (incluyendo personalizada)
     */
    private getMusicId(index: number): string | undefined {
        // Música predeterminada
        if (index >= 0 && index < this.AVAILABLE_MUSIC.size()) {
            return this.AVAILABLE_MUSIC[index];
        }
        
        // Música personalizada
        const customIndex = index - this.AVAILABLE_MUSIC.size();
        let currentCustomIndex = 0;
        for (const [name, id] of this.customMusic) {
            if (currentCustomIndex === customIndex) {
                return id;
            }
            currentCustomIndex++;
        }
        
        return undefined;
    }
    
    /**
     * NUEVO: Obtiene el total de música disponible
     */
    private getTotalMusicCount(): number {
        return this.AVAILABLE_MUSIC.size() + this.customMusic.size();
    }
    
    /**
     * NUEVO: Spawna un barco usando un modelo personalizado desde ReplicatedStorage
     * El modelo debe tener: Hull, DriverSeat, y opcionalmente Deck
     */
    public spawnCustomBoat(player: Player, modelName?: string): boolean {
        try {
            // Despawnar barco anterior si existe
            if (this.spawnedBoats.has(player)) {
                this.despawnBoat(player);
            }
            
            const character = player.Character;
            if (!character) return false;
            
            const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
            if (!humanoidRootPart) return false;
            
            // Obtener el modelo personalizado
            const selectedModelName = modelName || this.DEFAULT_CUSTOM_MODEL;
            const customModel = this.getCustomBoatModel(selectedModelName);
            
            if (!customModel) {
                warn(`❌ No se encontró modelo de barco: ${selectedModelName}`);
                print(`💡 Modelos disponibles: ${this.listAvailableBoatModels()}`);
                return false;
            }
            
            // Calcular posición de spawn
            const playerPosition = humanoidRootPart.Position;
            const playerCFrame = humanoidRootPart.CFrame;
            const spawnOffset = playerCFrame.LookVector.mul(20);
            const spawnPosition = new Vector3(
                playerPosition.X + spawnOffset.X,
                this.WATER_LEVEL + 2, // 2 studs arriba del agua
                playerPosition.Z + spawnOffset.Z
            );
            
            // CLONAR Y CONFIGURAR EL MODELO PERSONALIZADO
            const boatModel = customModel.Clone();
            boatModel.Name = `${player.Name}_CustomBoat`;
            boatModel.Parent = Workspace;
            
            // BUSCAR PARTES REQUERIDAS EN EL MODELO
            const hull = this.findPartInModel(boatModel, "Hull");
            const seat = this.findVehicleSeatInModel(boatModel, "DriverSeat");
            
            if (!hull) {
                warn(`❌ El modelo ${selectedModelName} no tiene parte 'Hull' requerida`);
                boatModel.Destroy();
                return false;
            }
            
            if (!seat) {
                warn(`❌ El modelo ${selectedModelName} no tiene 'DriverSeat' (VehicleSeat) requerido`);
                boatModel.Destroy();
                return false;
            }
            
            // Buscar Deck (opcional)
            let deck = this.findPartInModel(boatModel, "Deck");
            if (!deck) {
                // Si no hay deck, usar el hull como referencia
                deck = hull;
                print(`💡 ${selectedModelName}: No se encontró 'Deck', usando Hull como referencia`);
            }
            
            // POSICIONAR EL MODELO EN LA POSICIÓN DE SPAWN
            this.positionBoatModel(boatModel, hull, spawnPosition);
            
            // CONFIGURAR PROPIEDADES FÍSICAS DEL HULL
            this.setupCustomHullPhysics(hull);
            
            // CONFIGURAR SISTEMAS DE MOVIMIENTO (mismo que el barco original)
            const bodyPosition = this.createBodyPosition(hull, spawnPosition);
            const bodyGyro = this.setupStabilizedBodyGyro(hull);
            const bodyVelocity = this.createBodyVelocity(hull);
            const bodyAngularVelocity = this.createBodyAngularVelocity(hull);
            
            // REGISTRAR BARCO PERSONALIZADO
            const simpleBoat: SimpleBoat = {
                model: boatModel,
                hull: hull,
                deck: deck,
                seat: seat,
                bodyPosition: bodyPosition,
                bodyVelocity: bodyVelocity,
                bodyGyro: bodyGyro,
                bodyAngularVelocity: bodyAngularVelocity,
                owner: player,
                objects: new Map<string, BoatObject>(), // Sistema de objetos vacío
                maxObjects: this.MAX_OBJECTS_PER_BOAT
            };
            
            // SISTEMA DE CONTROLES (mismo que antes)
            const controlConnection = RunService.Heartbeat.Connect(() => {
                this.updateBoatControls(simpleBoat);
            });
            
            simpleBoat.connection = controlConnection;
            this.spawnedBoats.set(player, simpleBoat);
            
            print(`🎨 ${player.Name} spawneó barco personalizado: ${selectedModelName}`);
            print(`🌊 Controles: WASD para mover SOLO EN AGUA`);
            print(`⚖️ Física: Mismo sistema de estabilidad que barcos generados`);
            print(`🔊 Compatible con sistema de bocinas!`);
            return true;
            
        } catch (error) {
            warn(`❌ Error spawneando barco personalizado: ${error}`);
            return false;
        }
    }
    
    /**
     * NUEVO: Obtiene un modelo de barco personalizado desde ReplicatedStorage
     */
    private getCustomBoatModel(modelName: string): Model | undefined {
        try {
            const boatModelsFolder = ReplicatedStorage.FindFirstChild(this.CUSTOM_BOAT_MODELS_FOLDER);
            if (!boatModelsFolder) {
                warn(`❌ Carpeta de modelos no encontrada: ReplicatedStorage.${this.CUSTOM_BOAT_MODELS_FOLDER}`);
                return undefined;
            }
            
            const model = boatModelsFolder.FindFirstChild(modelName) as Model;
            if (!model || !model.IsA("Model")) {
                warn(`❌ Modelo no encontrado o no es un Model: ${modelName}`);
                return undefined;
            }
            
            return model;
            
        } catch (error) {
            warn(`❌ Error obteniendo modelo personalizado: ${error}`);
            return undefined;
        }
    }
    
    /**
     * NUEVO: Busca una parte específica en un modelo
     */
    private findPartInModel(model: Model, partName: string): Part | undefined {
        const part = model.FindFirstChild(partName, true) as Part; // true = buscar recursivamente
        if (part && part.IsA("Part")) {
            return part;
        }
        return undefined;
    }
    
    /**
     * NUEVO: Busca un VehicleSeat específico en un modelo
     */
    private findVehicleSeatInModel(model: Model, seatName: string): VehicleSeat | undefined {
        const seat = model.FindFirstChild(seatName, true) as VehicleSeat; // true = buscar recursivamente
        if (seat && seat.IsA("VehicleSeat")) {
            return seat;
        }
        return undefined;
    }
    
    /**
     * NUEVO: Posiciona el modelo del barco en la posición deseada
     */
    private positionBoatModel(model: Model, hull: Part, targetPosition: Vector3): void {
        // Calcular offset necesario
        const currentPosition = hull.Position;
        const offset = targetPosition.sub(currentPosition);
        
        // Mover todo el modelo
        if (model.PrimaryPart) {
            model.SetPrimaryPartCFrame(model.PrimaryPart.CFrame.add(offset));
        } else {
            // Si no hay PrimaryPart, usar el hull como referencia
            model.PrimaryPart = hull;
            model.SetPrimaryPartCFrame(hull.CFrame.add(offset));
        }
    }
    
    /**
     * NUEVO: Configura las propiedades físicas del hull personalizado
     */
    private setupCustomHullPhysics(hull: Part): void {
        // Asegurar que no esté anclado
        hull.Anchored = false;
        hull.CanCollide = true;
        
        // Aplicar propiedades físicas optimizadas para estabilidad
        const hullPhysics = new PhysicalProperties(
            3.0,    // Density (más denso = más pesado = más estable)
            1.2,    // Friction (más agarre con el agua)
            0.1,    // Elasticity (menos rebote al chocar)
            1,      // FrictionWeight
            1       // ElasticityWeight
        );
        hull.CustomPhysicalProperties = hullPhysics;
    }
    
    /**
     * NUEVO: Crea BodyPosition para flotación
     */
    private createBodyPosition(hull: Part, spawnPosition: Vector3): BodyPosition {
        const bodyPosition = new Instance("BodyPosition");
        bodyPosition.MaxForce = new Vector3(0, math.huge, 0); // Solo Y
        bodyPosition.Position = new Vector3(spawnPosition.X, this.WATER_LEVEL + 1.5, spawnPosition.Z);
        bodyPosition.D = 3000; // Damping para estabilidad
        bodyPosition.P = 15000; // Power para mantener flotación
        bodyPosition.Parent = hull;
        return bodyPosition;
    }
    
    /**
     * NUEVO: Crea BodyVelocity para movimiento
     */
    private createBodyVelocity(hull: Part): BodyVelocity {
        const bodyVelocity = new Instance("BodyVelocity");
        bodyVelocity.MaxForce = new Vector3(math.huge, 0, math.huge); // Solo X y Z
        bodyVelocity.Velocity = new Vector3(0, 0, 0);
        bodyVelocity.Parent = hull;
        return bodyVelocity;
    }
    
    /**
     * NUEVO: Crea BodyAngularVelocity para giro
     */
    private createBodyAngularVelocity(hull: Part): BodyAngularVelocity {
        const bodyAngularVelocity = new Instance("BodyAngularVelocity");
        bodyAngularVelocity.MaxTorque = new Vector3(0, math.huge, 0); // Solo Y (giro)
        bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
        bodyAngularVelocity.P = 3000;
        bodyAngularVelocity.Parent = hull;
        return bodyAngularVelocity;
    }
    
    /**
     * NUEVO: Lista todos los modelos de barco disponibles
     */
    public listAvailableBoatModels(): string {
        try {
            const boatModelsFolder = ReplicatedStorage.FindFirstChild(this.CUSTOM_BOAT_MODELS_FOLDER);
            if (!boatModelsFolder) {
                return `❌ Carpeta de modelos no encontrada: ReplicatedStorage.${this.CUSTOM_BOAT_MODELS_FOLDER}`;
            }
            
            const models: string[] = [];
            for (const child of boatModelsFolder.GetChildren()) {
                if (child.IsA("Model")) {
                    models.push(child.Name);
                }
            }
            
            if (models.size() === 0) {
                return `📂 No hay modelos en ReplicatedStorage.${this.CUSTOM_BOAT_MODELS_FOLDER}`;
            }
            
            return `🎨 Modelos disponibles: ${models.join(", ")}`;
            
        } catch (error) {
            return `❌ Error listando modelos: ${error}`;
        }
    }
    
    /**
     * NUEVO: Verifica si un modelo tiene la estructura correcta
     */
    public validateBoatModel(modelName: string): string {
        const model = this.getCustomBoatModel(modelName);
        if (!model) {
            return `❌ Modelo no encontrado: ${modelName}`;
        }
        
        let validation = `🔍 Validando modelo: ${modelName}\n`;
        
        // Verificar Hull
        const hull = this.findPartInModel(model, "Hull");
        validation += hull ? `✅ Hull encontrado\n` : `❌ Hull NO encontrado (REQUERIDO)\n`;
        
        // Verificar DriverSeat
        const seat = this.findVehicleSeatInModel(model, "DriverSeat");
        validation += seat ? `✅ DriverSeat encontrado\n` : `❌ DriverSeat NO encontrado (REQUERIDO)\n`;
        
        // Verificar Deck (opcional)
        const deck = this.findPartInModel(model, "Deck");
        validation += deck ? `✅ Deck encontrado\n` : `💡 Deck no encontrado (opcional)\n`;
        
        // Contar partes totales
        let partCount = 0;
        for (const child of model.GetDescendants()) {
            if (child.IsA("BasePart")) {
                partCount++;
            }
        }
        validation += `📊 Total de partes: ${partCount}\n`;
        
        // Verificar si es válido
        const isValid = hull !== undefined && seat !== undefined;
        validation += isValid ? `✅ MODELO VÁLIDO` : `❌ MODELO INVÁLIDO - Faltan partes requeridas`;
        
        return validation;
    }
    
    /**
     * NUEVO: Adapta automáticamente un modelo de barco de la tienda de Roblox
     * para que funcione con nuestro sistema
     */
    public adaptStoreBoatModel(player: Player, modelName: string): string {
        try {
            const model = this.getCustomBoatModel(modelName);
            if (!model) {
                return `❌ Modelo no encontrado: ${modelName}`;
            }
            
            let adaptationLog = `🔧 Adaptando modelo de tienda: ${modelName}\n\n`;
            
            // BUSCAR HULL (casco principal)
            let hull = this.findPartInModel(model, "Hull");
            if (!hull) {
                // Buscar alternativas comunes para el hull
                const hullAlternatives = ["Body", "Boat", "Base", "Main", "Casco"];
                for (const altName of hullAlternatives) {
                    hull = this.findPartInModel(model, altName);
                    if (hull) {
                        hull.Name = "Hull"; // Renombrar para que funcione con nuestro sistema
                        adaptationLog += `✅ Hull encontrado como "${altName}", renombrado a "Hull"\n`;
                        break;
                    }
                }
                
                // Si aún no hay hull, usar la parte más grande
                if (!hull) {
                    hull = this.findLargestPartInModel(model);
                    if (hull) {
                        hull.Name = "Hull";
                        adaptationLog += `🔍 Hull creado automáticamente desde la parte más grande: ${hull.Name}\n`;
                    }
                }
            } else {
                adaptationLog += `✅ Hull ya existe\n`;
            }
            
            // BUSCAR O CREAR DRIVERSEAT
            let driverSeat = this.findVehicleSeatInModel(model, "DriverSeat");
            if (!driverSeat) {
                // Buscar cualquier VehicleSeat existente
                driverSeat = this.findAnyVehicleSeatInModel(model);
                if (driverSeat) {
                    driverSeat.Name = "DriverSeat";
                    adaptationLog += `✅ DriverSeat encontrado como "${driverSeat.Name}", renombrado\n`;
                } else {
                    // Crear VehicleSeat si no existe
                    driverSeat = this.createDriverSeatForModel(model, hull);
                    adaptationLog += `🆕 DriverSeat creado automáticamente en el barco\n`;
                }
            } else {
                adaptationLog += `✅ DriverSeat ya existe\n`;
            }
            
            // BUSCAR O DESIGNAR DECK
            let deck = this.findPartInModel(model, "Deck");
            if (!deck) {
                // Buscar alternativas para deck
                const deckAlternatives = ["Floor", "Platform", "Surface", "Cubierta"];
                for (const altName of deckAlternatives) {
                    deck = this.findPartInModel(model, altName);
                    if (deck) {
                        // NO renombrar el deck original, solo usarlo como referencia
                        adaptationLog += `✅ Deck encontrado como "${altName}"\n`;
                        break;
                    }
                }
                
                // Si no hay deck, usar el hull como referencia
                if (!deck) {
                    deck = hull;
                    adaptationLog += `💡 Deck designado como Hull (para referencia de bocinas)\n`;
                }
            } else {
                adaptationLog += `✅ Deck ya existe\n`;
            }
            
            // CONFIGURAR PROPIEDADES FÍSICAS DEL MODELO
            if (hull) {
                this.setupCustomHullPhysics(hull);
                adaptationLog += `⚙️ Propiedades físicas aplicadas al Hull\n`;
            }
            
            // VERIFICAR RESULTADO FINAL
            const finalValidation = this.validateBoatModel(modelName);
            adaptationLog += `\n${finalValidation}`;
            
            return adaptationLog;
            
        } catch (error) {
            return `❌ Error adaptando modelo: ${error}`;
        }
    }
    
    /**
     * NUEVO: Encuentra la parte más grande de un modelo (para usar como Hull)
     */
    private findLargestPartInModel(model: Model): Part | undefined {
        let largestPart: Part | undefined;
        let largestVolume = 0;
        
        for (const child of model.GetDescendants()) {
            if (child.IsA("Part")) {
                const volume = child.Size.X * child.Size.Y * child.Size.Z;
                if (volume > largestVolume) {
                    largestVolume = volume;
                    largestPart = child;
                }
            }
        }
        
        return largestPart;
    }
    
    /**
     * NUEVO: Busca cualquier VehicleSeat en el modelo
     */
    private findAnyVehicleSeatInModel(model: Model): VehicleSeat | undefined {
        for (const child of model.GetDescendants()) {
            if (child.IsA("VehicleSeat")) {
                return child;
            }
        }
        return undefined;
    }
    
    /**
     * NUEVO: Crea un DriverSeat automáticamente para el modelo
     */
    private createDriverSeatForModel(model: Model, hull?: Part): VehicleSeat {
        const driverSeat = new Instance("VehicleSeat");
        driverSeat.Name = "DriverSeat";
        driverSeat.Size = new Vector3(2, 1, 2);
        driverSeat.Material = Enum.Material.Fabric;
        driverSeat.BrickColor = new BrickColor("Really red");
        driverSeat.Anchored = false;
        driverSeat.CanCollide = false;
        
        // Posicionar el asiento
        if (hull) {
            // Poner el asiento encima del hull, hacia atrás
            const hullPosition = hull.Position;
            const hullSize = hull.Size;
            driverSeat.Position = new Vector3(
                hullPosition.X,
                hullPosition.Y + (hullSize.Y / 2) + 1, // Arriba del hull
                hullPosition.Z + (hullSize.Z / 4) // Hacia atrás
            );
        }
        
        driverSeat.Parent = model;
        
        // Soldar al hull si existe
        if (hull) {
            const weld = new Instance("WeldConstraint");
            weld.Part0 = hull;
            weld.Part1 = driverSeat;
            weld.Parent = hull;
        }
        
        return driverSeat;
    }
} 
