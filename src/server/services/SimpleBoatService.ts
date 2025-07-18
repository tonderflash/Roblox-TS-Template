// ===== SIMPLE BOAT SERVICE - SISTEMA SIMPLE Y ROBUSTO =====
// Sistema minimalista basado en VehicleSeat + BodyForce + BodyTorque

import { OnStart, Service } from "@flamework/core";
import { Workspace, ReplicatedStorage, RunService, SoundService } from "@rbxts/services";

interface SimpleBoat {
    model: Model;
    vehicleSeat: VehicleSeat;
    owner: Player;
    type: "simple" | "custom";
    modelName?: string; // Para barcos custom
    speaker?: Part; // Bocina del barco
    sound?: Sound; // Sonido actual de la bocina
    musicData?: {
        soundId: string;
        name: string;
        volume: number;
        isPlaying: boolean;
    };
    controlConnection?: RBXScriptConnection; // Conexión del control del barco
}

@Service()
export class SimpleBoatService implements OnStart {
    private spawnedBoats = new Map<Player, SimpleBoat>();
    private readonly WATER_LEVEL = 5; // Nivel del agua de IslandService
    
    // Configuración de fuerzas (equivalente al script Lua)
    private readonly FORCE = 25000;      // 25,000
    private readonly TORQUE = 150000;    // 150,000
    
    // Configuración para modelos personalizados
    private readonly CUSTOM_BOAT_MODELS_FOLDER = "BoatModels";
    
    // Configuración de bocinas
    private readonly DEFAULT_MUSIC_VOLUME = 0.5;
    private readonly SPEAKER_SIZE = new Vector3(2, 2, 2);
    
    onStart(): void {
        print("🚢 SimpleBoatService iniciado - Sistema limpio y robusto");
        print("⚡ 2 tipos de barcos: Simple y Custom");
        print("🔧 Sistema escalable con herencia de funcionalidades");
        print("🎵 Sistema de bocinas integrado");
    }
    
    /**
     * Spawna un barco simple generado por código
     */
    public spawnSimpleBoat(player: Player): boolean {
        try {
            // Limpiar barco anterior
            this.despawnBoat(player);
            
            const character = player.Character;
            if (!character) return false;
            
            const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
            if (!humanoidRootPart) return false;
            
            // Calcular posición delante del jugador basada en su orientación
            const playerCFrame = humanoidRootPart.CFrame;
            const lookDirection = playerCFrame.LookVector;
            const spawnDistance = 15; // Distancia delante del jugador
            
            const spawnPosition = new Vector3(
                playerCFrame.Position.X + (lookDirection.X * spawnDistance),
                this.WATER_LEVEL + 2,
                playerCFrame.Position.Z + (lookDirection.Z * spawnDistance)
            );
            
            print(`🎯 Spawneando barco delante de ${player.Name} en: (${math.floor(spawnPosition.X)}, ${math.floor(spawnPosition.Y)}, ${math.floor(spawnPosition.Z)})`);
            
            // Crear modelo del barco simple
            const boatModel = this.createSimpleBoatModel(player.Name, spawnPosition);
            const vehicleSeat = boatModel.FindFirstChild("VehicleSeat") as VehicleSeat;
            
            if (!vehicleSeat) {
                boatModel.Destroy();
                return false;
            }
            
            // Registrar barco
            const boat: SimpleBoat = {
                model: boatModel,
                vehicleSeat: vehicleSeat,
                owner: player,
                type: "simple"
            };
            
            // Configurar sistema de fuerzas Y guardar la conexión en el objeto boat
            boat.controlConnection = this.setupBoatPhysics(vehicleSeat);
            
            this.spawnedBoats.set(player, boat);
            
            print(`🚢 ${player.Name} spawneó barco SIMPLE exitosamente`);
            return true;
            
        } catch (error) {
            warn(`❌ Error spawneando barco simple: ${error}`);
            return false;
        }
    }
    
    /**
     * Spawna un barco usando modelo personalizado
     */
    public spawnCustomBoat(player: Player, modelName: string): boolean {
        try {
            // Limpiar barco anterior
            this.despawnBoat(player);
            
            const character = player.Character;
            if (!character) {
                warn(`❌ ${player.Name} no tiene character`);
                return false;
            }
            
            const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
            if (!humanoidRootPart) {
                warn(`❌ ${player.Name} no tiene HumanoidRootPart`);
                return false;
            }
            
            // Obtener modelo personalizado
            const customModel = this.getCustomBoatModel(modelName);
            if (!customModel) {
                warn(`❌ Modelo no encontrado: ${modelName}`);
                return false;
            }
            
            print(`✅ Modelo ${modelName} encontrado exitosamente`);
            
            // DEBUG INTENSIVO: Información del jugador
            const playerPos = humanoidRootPart.Position;
            const playerCFrame = humanoidRootPart.CFrame;
            print(`👤 Posición del jugador: (${math.floor(playerPos.X)}, ${math.floor(playerPos.Y)}, ${math.floor(playerPos.Z)})`);
            print(`🧭 CFrame del jugador: ${playerCFrame}`);
            
            // Calcular posición usando método más simple y directo
            const lookDirection = playerCFrame.LookVector;
            print(`👁️ LookVector original: (${lookDirection.X}, ${lookDirection.Y}, ${lookDirection.Z})`);
            
            // Simplificar el cálculo - usar solo X y Z, ignorar Y para la dirección
            const flatLookDirection = new Vector3(lookDirection.X, 0, lookDirection.Z).Unit;
            print(`👁️ LookVector plano: (${flatLookDirection.X}, ${flatLookDirection.Y}, ${flatLookDirection.Z})`);
            
            const spawnDistance = 20; // Aumentar distancia para test
            
            // Método directo de cálculo
            const spawnPosition = new Vector3(
                playerPos.X + (flatLookDirection.X * spawnDistance),
                this.WATER_LEVEL + 3, // Elevar un poco más
                playerPos.Z + (flatLookDirection.Z * spawnDistance)
            );
            
            print(`🎯 POSICIÓN OBJETIVO: (${math.floor(spawnPosition.X)}, ${math.floor(spawnPosition.Y)}, ${math.floor(spawnPosition.Z)})`);
            
            // Calcular distancia del jugador para verificar
            const distanceFromPlayer = playerPos.sub(spawnPosition).Magnitude;
            print(`📏 Distancia del jugador: ${math.floor(distanceFromPlayer)} studs`);
            
            // Clonar y configurar modelo
            const boatModel = customModel.Clone();
            boatModel.Name = `${player.Name}_CustomBoat`;
            
            // MÉTODO ALTERNATIVO: Posicionar ANTES de añadir al workspace
            print(`🔧 Posicionando modelo ANTES de añadir al workspace...`);
            
            // Encontrar todas las partes y desanclarlas
            const allParts = boatModel.GetDescendants().filter(descendant => descendant.IsA("BasePart")) as BasePart[];
            print(`🔍 Encontradas ${allParts.size()} partes en el modelo`);
            
            for (const part of allParts) {
                if (part.Anchored) {
                    part.Anchored = false;
                    print(`🔓 Desanclada: ${part.Name}`);
                }
            }
            
            // Configurar PrimaryPart ANTES de posicionar
            if (!boatModel.PrimaryPart && allParts.size() > 0) {
                let primaryPart = allParts[0];
                // Buscar mejor candidato para PrimaryPart
                for (const part of allParts) {
                    const partName = part.Name.lower();
                    if (partName.find("hull")[0] || partName.find("main")[0] || partName.find("base")[0] || partName.find("primary")[0]) {
                        primaryPart = part;
                        break;
                    }
                }
                boatModel.PrimaryPart = primaryPart;
                print(`🎯 PrimaryPart configurada: ${primaryPart.Name}`);
            }
            
            // POSICIONAMIENTO DIRECTO CON CFRAME
            if (boatModel.PrimaryPart) {
                const targetCFrame = new CFrame(spawnPosition);
                print(`🎯 Aplicando CFrame: ${targetCFrame}`);
                
                // Posicionar ANTES de añadir al workspace
                boatModel.SetPrimaryPartCFrame(targetCFrame);
                print(`📍 Modelo posicionado ANTES del workspace`);
            } else {
                warn(`⚠️ No se pudo configurar PrimaryPart`);
            }
            
            // Ahora añadir al workspace
            boatModel.Parent = Workspace;
            print(`🌍 Modelo añadido al Workspace`);
            
            // Verificar posición después de añadir al workspace
            if (boatModel.PrimaryPart) {
                const actualPos = boatModel.PrimaryPart.Position;
                print(`📍 Posición ACTUAL después del workspace: (${math.floor(actualPos.X)}, ${math.floor(actualPos.Y)}, ${math.floor(actualPos.Z)})`);
                
                const actualDistance = spawnPosition.sub(actualPos).Magnitude;
                print(`📏 Diferencia con objetivo: ${math.floor(actualDistance)} studs`);
                
                // Si no está en la posición correcta, forzar de nuevo
                if (actualDistance > 5) {
                    print(`🔨 FORZANDO posición de nuevo...`);
                    boatModel.SetPrimaryPartCFrame(new CFrame(spawnPosition));
                    
                    // Verificar una vez más
                    const finalPos = boatModel.PrimaryPart.Position;
                    const finalDistance = spawnPosition.sub(finalPos).Magnitude;
                    print(`📍 Posición FINAL: (${math.floor(finalPos.X)}, ${math.floor(finalPos.Y)}, ${math.floor(finalPos.Z)})`);
                    print(`📏 Distancia final del objetivo: ${math.floor(finalDistance)} studs`);
                }
            }
            
            // Buscar VehicleSeat
            const vehicleSeat = this.findVehicleSeatInModel(boatModel);
            if (!vehicleSeat) {
                warn(`❌ El modelo ${modelName} no tiene VehicleSeat`);
                boatModel.Destroy();
                return false;
            }
            
            print(`✅ VehicleSeat encontrado en: (${math.floor(vehicleSeat.Position.X)}, ${math.floor(vehicleSeat.Position.Y)}, ${math.floor(vehicleSeat.Position.Z)})`);
            
            // Registrar barco
            const boat: SimpleBoat = {
                model: boatModel,
                vehicleSeat: vehicleSeat,
                owner: player,
                type: "custom",
                modelName: modelName
            };
            
            // Configurar sistema de fuerzas (HERENCIA DE FUNCIONALIDAD) Y guardar conexión
            boat.controlConnection = this.setupBoatPhysics(vehicleSeat);
            
            this.spawnedBoats.set(player, boat);
            
            print(`🎨 ${player.Name} spawneó barco CUSTOM (${modelName}) exitosamente`);
            print(`🔍 RESUMEN FINAL:`);
            print(`   - Posición objetivo: (${math.floor(spawnPosition.X)}, ${math.floor(spawnPosition.Y)}, ${math.floor(spawnPosition.Z)})`);
            print(`   - VehicleSeat en: (${math.floor(vehicleSeat.Position.X)}, ${math.floor(vehicleSeat.Position.Y)}, ${math.floor(vehicleSeat.Position.Z)})`);
            print(`   - Distancia del jugador: ${math.floor(playerPos.sub(vehicleSeat.Position).Magnitude)} studs`);
            return true;
            
        } catch (error) {
            warn(`❌ Error spawneando barco custom: ${error}`);
            return false;
        }
    }
    
    /**
     * CORAZÓN DEL SISTEMA: Configura la física del barco
     * Basado en el script simple de BodyVelocity + BodyAngularVelocity para mejor control
     */
    private setupBoatPhysics(vehicleSeat: VehicleSeat): RBXScriptConnection {
        // Crear BodyVelocity para movimiento más controlado
        const bodyVelocity = new Instance("BodyVelocity");
        bodyVelocity.Name = "BV";
        bodyVelocity.Velocity = new Vector3(0, 0, 0);
        bodyVelocity.MaxForce = new Vector3(this.FORCE, 0, this.FORCE);
        bodyVelocity.Parent = vehicleSeat;
        
        // Crear BodyAngularVelocity para giro
        const bodyAngularVelocity = new Instance("BodyAngularVelocity");
        bodyAngularVelocity.Name = "BAV";
        bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
        bodyAngularVelocity.MaxTorque = new Vector3(0, this.TORQUE, 0);
        bodyAngularVelocity.Parent = vehicleSeat;
        
        print(`⚙️ Física configurada: BodyVelocity + BodyAngularVelocity (MEJORADO)`);
        print(`🔧 NOTA: Sistema de velocidad directa para mejor respuesta`);
        
        // Implementar control mejorado y devolver la conexión
        const controlConnection = this.startBoatControlImproved(vehicleSeat, bodyVelocity, bodyAngularVelocity);
        
        return controlConnection;
    }
    
    /**
     * Control mejorado del barco usando BodyVelocity
     */
    private startBoatControlImproved(vehicleSeat: VehicleSeat, bodyVelocity: BodyVelocity, bodyAngularVelocity: BodyAngularVelocity): RBXScriptConnection {
        print(`🎮 Iniciando control MEJORADO de barco`);
        
        const connection = RunService.Heartbeat.Connect(() => {
            if (!vehicleSeat.Parent) {
                connection.Disconnect();
                return;
            }
            
            const throttle = vehicleSeat.Throttle;
            const steer = vehicleSeat.Steer;
            
            // Debug cuando hay input
            if (throttle !== 0 || steer !== 0) {
                print(`🎮 Input - Throttle: ${throttle}, Steer: ${steer}`);
            }
            
            // Velocidad máxima del barco
            const maxSpeed = 50;
            const maxTurnSpeed = 5;
            
            // Calcular velocidad basada en la orientación del VehicleSeat
            const lookVector = vehicleSeat.CFrame.LookVector;
            const rightVector = vehicleSeat.CFrame.RightVector;
            
            // Velocidad hacia adelante/atrás
            const forwardVelocity = lookVector.mul(maxSpeed * throttle);
            // Velocidad lateral para maniobras
            const steerVelocity = rightVector.mul(maxSpeed * 0.3 * steer);
            
            // Combinar velocidades
            const totalVelocity = forwardVelocity.add(steerVelocity);
            bodyVelocity.Velocity = totalVelocity;
            
            // Velocidad angular para girar
            const turnVelocity = maxTurnSpeed * steer;
            bodyAngularVelocity.AngularVelocity = new Vector3(0, turnVelocity, 0);
            
            // Debug
            if (throttle !== 0 || steer !== 0) {
                print(`🔧 Velocity: ${totalVelocity}, AngularVel: ${turnVelocity}`);
            }
        });
        
        print(`✅ Control MEJORADO conectado`);
        return connection;
    }
    
    /**
     * Crea el modelo del barco simple
     */
    private createSimpleBoatModel(playerName: string, spawnPosition: Vector3): Model {
        const boatModel = new Instance("Model");
        boatModel.Name = `${playerName}_SimpleBoat`;
        boatModel.Parent = Workspace;
        
        // Hull principal
        const hull = new Instance("Part");
        hull.Name = "Hull";
        hull.Size = new Vector3(12, 3, 20);
        hull.Position = spawnPosition;
        hull.Material = Enum.Material.Wood;
        hull.BrickColor = new BrickColor("Brown");
        hull.Anchored = false;
        hull.CanCollide = true;
        hull.Parent = boatModel;
        
        // Deck
        const deck = new Instance("Part");
        deck.Name = "Deck";
        deck.Size = new Vector3(11, 0.5, 19);
        deck.Position = new Vector3(spawnPosition.X, spawnPosition.Y + 2, spawnPosition.Z);
        deck.Material = Enum.Material.Wood;
        deck.BrickColor = new BrickColor("Dark orange");
        deck.Anchored = false;
        deck.CanCollide = true;
        deck.Parent = boatModel;
        
        // VehicleSeat
        const vehicleSeat = new Instance("VehicleSeat");
        vehicleSeat.Name = "VehicleSeat";
        vehicleSeat.Size = new Vector3(2, 1, 2);
        vehicleSeat.Position = new Vector3(spawnPosition.X, spawnPosition.Y + 3, spawnPosition.Z + 6);
        vehicleSeat.Material = Enum.Material.Fabric;
        vehicleSeat.BrickColor = new BrickColor("Really red");
        vehicleSeat.Anchored = false;
        vehicleSeat.CanCollide = false;
        vehicleSeat.Parent = boatModel;
        
        // Soldar partes
        const deckWeld = new Instance("WeldConstraint");
        deckWeld.Part0 = hull;
        deckWeld.Part1 = deck;
        deckWeld.Parent = hull;
        
        const seatWeld = new Instance("WeldConstraint");
        seatWeld.Part0 = deck;
        seatWeld.Part1 = vehicleSeat;
        seatWeld.Parent = deck;
        
        // PrimaryPart
        boatModel.PrimaryPart = hull;
        
        return boatModel;
    }
    
    /**
     * Despawna un barco
     */
    public despawnBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        // Limpiar conexión de control si existe
        if (boat.controlConnection) {
            boat.controlConnection.Disconnect();
            boat.controlConnection = undefined;
        }
        
        // Parar música si existe
        if (boat.sound && boat.musicData?.isPlaying) {
            boat.sound.Stop();
        }
        
        // Limpiar referencias de sonido para evitar memory leaks
        if (boat.sound) {
            boat.sound.Destroy();
            boat.sound = undefined;
        }
        
        // Limpiar referencias de speaker
        if (boat.speaker) {
            boat.speaker.Destroy();
            boat.speaker = undefined;
        }
        
        // Limpiar datos de música
        boat.musicData = undefined;
        
        boat.model.Destroy();
        this.spawnedBoats.delete(player);
        
        print(`🗑️ ${player.Name} despawneó su barco ${boat.type.upper()}`);
        return true;
    }
    
    /**
     * Obtiene información del barco del jugador
     */
    public getBoatInfo(player: Player): string | undefined {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return undefined;
        
        const position = boat.vehicleSeat.Position;
        const isOccupied = boat.vehicleSeat.Occupant !== undefined;
        const hasSpeaker = boat.speaker !== undefined;
        
        let info = `🚢 Barco de ${player.Name}:
        📦 Tipo: ${boat.type.upper()}${boat.modelName ? ` (${boat.modelName})` : ""}
        📍 Posición: (${math.floor(position.X)}, ${math.floor(position.Y)}, ${math.floor(position.Z)})
        👤 Ocupado: ${isOccupied ? "✅ SÍ" : "❌ NO"}
        ⚙️ Sistema: BodyVelocity + BodyAngularVelocity
        🎵 Bocina: ${hasSpeaker ? "✅ INSTALADA" : "❌ NO"}`;
        
        if (hasSpeaker && boat.musicData) {
            info += `
        🎶 Música: ${boat.musicData.name}
        ⏯️ Estado: ${boat.musicData.isPlaying ? "▶️ REPRODUCIENDO" : "⏸️ PAUSADO"}`;
        }
        
        return info;
    }
    
    /**
     * Verifica si el jugador tiene un barco
     */
    public hasBoat(player: Player): boolean {
        return this.spawnedBoats.has(player);
    }
    
    /**
     * Obtiene el barco del jugador
     */
    public getPlayerBoat(player: Player): Model | undefined {
        const boat = this.spawnedBoats.get(player);
        return boat ? boat.model : undefined;
    }
    
    /**
     * Lista modelos de barcos disponibles
     */
    public listAvailableModels(): string {
        try {
            const folder = ReplicatedStorage.FindFirstChild(this.CUSTOM_BOAT_MODELS_FOLDER);
            if (!folder) {
                return `📂 Carpeta no encontrada: ReplicatedStorage.${this.CUSTOM_BOAT_MODELS_FOLDER}`;
            }
            
            const models: string[] = [];
            for (const child of folder.GetChildren()) {
                if (child.IsA("Model")) {
                    models.push(child.Name);
                }
            }
            
            return models.size() > 0 ? 
                `🎨 Modelos disponibles: ${models.join(", ")}` : 
                `📂 No hay modelos en ${this.CUSTOM_BOAT_MODELS_FOLDER}`;
                
        } catch (error) {
            return `❌ Error: ${error}`;
        }
    }
    
    // ===== MÉTODOS AUXILIARES =====
    
    private getCustomBoatModel(modelName: string): Model | undefined {
        try {
            const folder = ReplicatedStorage.FindFirstChild(this.CUSTOM_BOAT_MODELS_FOLDER);
            if (!folder) return undefined;
            
            const model = folder.FindFirstChild(modelName) as Model;
            return (model && model.IsA("Model")) ? model : undefined;
        } catch {
            return undefined;
        }
    }
    
    private findVehicleSeatInModel(model: Model): VehicleSeat | undefined {
        for (const child of model.GetDescendants()) {
            if (child.IsA("VehicleSeat")) {
                return child;
            }
        }
        return undefined;
    }
    
    private positionBoatModel(model: Model, targetPosition: Vector3): void {
        try {
            print(`🔧 Iniciando posicionamiento del modelo en: (${math.floor(targetPosition.X)}, ${math.floor(targetPosition.Y)}, ${math.floor(targetPosition.Z)})`);
            
            // Método 1: Intentar con PrimaryPart
            if (model.PrimaryPart) {
                print(`✅ Usando PrimaryPart para posicionar`);
                const targetCFrame = new CFrame(targetPosition);
                model.SetPrimaryPartCFrame(targetCFrame);
                
                // Verificar que se movió
                const newPos = model.PrimaryPart.Position;
                print(`📍 Nueva posición PrimaryPart: (${math.floor(newPos.X)}, ${math.floor(newPos.Y)}, ${math.floor(newPos.Z)})`);
                return;
            }
            
            // Método 2: Si no hay PrimaryPart, intentar configurar uno
            print(`⚠️ No hay PrimaryPart, buscando una parte principal...`);
            const parts = model.GetChildren().filter(child => child.IsA("BasePart")) as BasePart[];
            
            if (parts.size() === 0) {
                warn(`❌ No se encontraron BaseParts en el modelo`);
                return;
            }
            
            // Buscar la parte más grande o con nombre específico
            let primaryPart: BasePart = parts[0];
            for (const part of parts) {
                // Priorizar partes con nombres como "Hull", "Main", "Primary", etc.
                const partName = part.Name.lower();
                if (partName.find("hull")[0] || partName.find("main")[0] || partName.find("primary")[0] || partName.find("base")[0]) {
                    primaryPart = part;
                    break;
                }
                // O la parte más grande
                if (part.Size.Magnitude > primaryPart.Size.Magnitude) {
                    primaryPart = part;
                }
            }
            
            print(`🎯 Usando como referencia: ${primaryPart.Name}`);
            
            // Configurar PrimaryPart
            model.PrimaryPart = primaryPart;
            
            // Intentar posicionar de nuevo
            const targetCFrame = new CFrame(targetPosition);
            model.SetPrimaryPartCFrame(targetCFrame);
            
            print(`📍 Modelo posicionado usando nueva PrimaryPart: ${primaryPart.Name}`);
            
            // Verificación final
            const finalPos = primaryPart.Position;
            print(`📍 Posición final: (${math.floor(finalPos.X)}, ${math.floor(finalPos.Y)}, ${math.floor(finalPos.Z)})`);
            
            // Si la distancia es muy grande, algo salió mal
            const distance = targetPosition.sub(finalPos).Magnitude;
            if (distance > 5) {
                warn(`⚠️ El barco no se posicionó correctamente. Distancia del objetivo: ${math.floor(distance)} studs`);
                
                // Método 3: Fuerza bruta - mover cada parte individualmente
                print(`🔨 Aplicando posicionamiento forzado...`);
                const offset = targetPosition.sub(finalPos);
                
                for (const part of parts) {
                    part.Position = part.Position.add(offset);
                }
                
                print(`✅ Posicionamiento forzado completado`);
            }
            
        } catch (error) {
            warn(`❌ Error posicionando barco: ${error}`);
            
            // Método de emergencia: posicionamiento manual de todas las partes
            print(`🚨 Activando método de emergencia...`);
            try {
                const parts = model.GetChildren().filter(child => child.IsA("BasePart")) as BasePart[];
                if (parts.size() > 0) {
                    const firstPart = parts[0];
                    const offset = targetPosition.sub(firstPart.Position);
                    
                    for (const part of parts) {
                        part.Position = part.Position.add(offset);
                    }
                    
                    print(`🆘 Método de emergencia aplicado exitosamente`);
                }
            } catch (emergencyError) {
                warn(`💥 Error en método de emergencia: ${emergencyError}`);
            }
        }
    }
    
    /**
     * Verifica si el jugador tiene un barco spawneado
     */
    public isBoatSpawned(player: Player): boolean {
        return this.spawnedBoats.has(player);
    }
    
    /**
     * Añade una bocina al barco del jugador
     */
    public addSpeakerToBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        // Verificar si ya tiene bocina
        if (boat.speaker) {
            return false; // Ya tiene bocina
        }
        
        try {
            // Crear bocina
            const speaker = new Instance("Part");
            speaker.Name = "Speaker";
            speaker.Size = this.SPEAKER_SIZE;
            speaker.Material = Enum.Material.Plastic;
            speaker.BrickColor = new BrickColor("Really black");
            speaker.Anchored = false;
            speaker.CanCollide = false;
            speaker.Parent = boat.model;
            
            // Posicionar bocina en el barco
            const boatPosition = boat.vehicleSeat.Position;
            speaker.Position = new Vector3(
                boatPosition.X,
                boatPosition.Y + 2,
                boatPosition.Z - 3
            );
            
            // Soldar bocina al barco
            const weld = new Instance("WeldConstraint");
            weld.Part0 = boat.vehicleSeat;
            weld.Part1 = speaker;
            weld.Parent = speaker;
            
            // Crear sonido
            const sound = new Instance("Sound");
            sound.Name = "Music";
            sound.Volume = this.DEFAULT_MUSIC_VOLUME;
            sound.EmitterSize = 10;
            sound.Parent = speaker;
            
            // Actualizar barco
            boat.speaker = speaker;
            boat.sound = sound;
            boat.musicData = {
                soundId: "",
                name: "Sin música",
                volume: this.DEFAULT_MUSIC_VOLUME,
                isPlaying: false
            };
            
            print(`🎵 ${player.Name}: Bocina añadida al barco exitosamente`);
            return true;
            
        } catch (error) {
            warn(`❌ Error añadiendo bocina: ${error}`);
            return false;
        }
    }
    
    /**
     * Remueve la bocina del barco del jugador
     */
    public removeSpeakerFromBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat || !boat.speaker) return false;
        
        try {
            // Parar música si está sonando
            if (boat.sound) {
                boat.sound.Stop();
                boat.sound.Destroy(); // Properly destroy the sound instance
            }
            
            // Destruir bocina
            boat.speaker.Destroy();
            
            // Limpiar referencias
            boat.speaker = undefined;
            boat.sound = undefined;
            boat.musicData = undefined;
            
            print(`🔇 ${player.Name}: Bocina removida del barco exitosamente`);
            return true;
            
        } catch (error) {
            warn(`❌ Error removiendo bocina: ${error}`);
            return false;
        }
    }
    
    /**
     * Establece el volumen de la bocina del barco
     */
    public setSpeakerVolume(player: Player, volume: number): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat || !boat.sound || !boat.musicData) return false;
        
        try {
            // Normalizar volumen entre 0 y 1
            const normalizedVolume = math.max(0, math.min(1, volume));
            
            boat.sound.Volume = normalizedVolume;
            boat.musicData.volume = normalizedVolume;
            
            print(`🔊 ${player.Name}: Volumen de bocina ajustado a ${math.floor(normalizedVolume * 100)}%`);
            return true;
            
        } catch (error) {
            warn(`❌ Error ajustando volumen: ${error}`);
            return false;
        }
    }
    
    /**
     * Obtiene información de la bocina del barco
     */
    public getSpeakerInfo(player: Player): string | undefined {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return `❌ ${player.Name} no tiene barco spawneado`;
        
        if (!boat.speaker || !boat.musicData) {
            return `🔇 ${player.Name}: No tienes bocina instalada
            💡 Usa el comando para añadir bocina a tu barco`;
        }
        
        return `🎵 Bocina de ${player.Name}:
        📻 Música: ${boat.musicData.name}
        🔊 Volumen: ${math.floor(boat.musicData.volume * 100)}%
        ⏯️ Estado: ${boat.musicData.isPlaying ? "▶️ REPRODUCIENDO" : "⏸️ PAUSADO"}
        🎚️ Sound ID: ${boat.musicData.soundId}`;
    }
    
    /**
     * Estabiliza el barco del jugador (resetea física)
     */
    public stabilizeBoat(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        try {
            const vehicleSeat = boat.vehicleSeat;
            
            // Resetear velocidades
            const bodyVelocity = vehicleSeat.FindFirstChild("BV") as BodyVelocity;
            const bodyAngularVelocity = vehicleSeat.FindFirstChild("BAV") as BodyAngularVelocity;
            
            if (bodyVelocity) {
                bodyVelocity.Velocity = new Vector3(0, 0, 0);
            }
            
            if (bodyAngularVelocity) {
                bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
            }
            
            // Resetear rotación del barco
            if (boat.model.PrimaryPart) {
                const currentPosition = boat.model.PrimaryPart.Position;
                const newCFrame = new CFrame(currentPosition.X, this.WATER_LEVEL + 2, currentPosition.Z);
                boat.model.SetPrimaryPartCFrame(newCFrame);
            }
            
            print(`⚖️ ${player.Name}: Barco estabilizado exitosamente`);
            return true;
            
        } catch (error) {
            warn(`❌ Error estabilizando barco: ${error}`);
            return false;
        }
    }
    
    /**
     * Alterna (toggle) la bocina del barco (añadir/quitar)
     */
    public toggleSpeaker(player: Player): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat) return false;
        
        if (boat.speaker) {
            // Quitar bocina
            return this.removeSpeakerFromBoat(player);
        } else {
            // Añadir bocina
            return this.addSpeakerToBoat(player);
        }
    }
    
    /**
     * Valida si un modelo de barco custom existe
     */
    public validateBoatModel(modelName: string): boolean {
        try {
            const model = this.getCustomBoatModel(modelName);
            if (!model) {
                return false;
            }
            
            // Verificar que tiene VehicleSeat
            const vehicleSeat = this.findVehicleSeatInModel(model);
            return vehicleSeat !== undefined;
            
        } catch (error) {
            warn(`❌ Error validando modelo ${modelName}: ${error}`);
            return false;
        }
    }
    
    /**
     * Cambia la música de la bocina del barco
     */
    public changeSpeakerMusic(player: Player, soundId: string, musicName?: string): boolean {
        const boat = this.spawnedBoats.get(player);
        if (!boat || !boat.sound || !boat.musicData) return false;
        
        try {
            // Parar música actual si está sonando
            if (boat.musicData.isPlaying) {
                boat.sound.Stop();
            }
            
            // Limpiar el soundId si viene con "rbxassetid://"
            const cleanSoundId = soundId.gsub("rbxassetid://", "")[0];
            const finalSoundId = `rbxassetid://${cleanSoundId}`;
            
            // Actualizar datos
            boat.sound.SoundId = finalSoundId;
            boat.musicData.soundId = finalSoundId;
            boat.musicData.name = musicName || `Música ${cleanSoundId}`;
            boat.musicData.isPlaying = false;
            
            // Reproducir nueva música
            boat.sound.Play();
            boat.musicData.isPlaying = true;
            
            print(`🎵 ${player.Name}: Música cambiada a "${boat.musicData.name}" (ID: ${cleanSoundId})`);
            return true;
            
        } catch (error) {
            warn(`❌ Error cambiando música: ${error}`);
            return false;
        }
    }
}
