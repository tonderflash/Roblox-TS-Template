// ===== BOAT FACTORY - CONSTRUCCIÓN DE BARCOS =====
// Factory pattern para crear barcos con componentes modulares

import { Workspace } from "@rbxts/services";
import { BoatTemplate, BoatModel, SpawnConfig, ComponentConfig, BoatStats, BOAT_CONFIG } from "./types/BoatTypes";

export class BoatFactory {
    private static instance: BoatFactory;
    
    public static getInstance(): BoatFactory {
        if (!BoatFactory.instance) {
            BoatFactory.instance = new BoatFactory();
        }
        return BoatFactory.instance;
    }
    
    private constructor() {}
    
    /**
     * Crea un barco completo basado en la configuración de spawn
     */
    public createBoat(spawnConfig: SpawnConfig): BoatModel {
        const model = new Instance("Model");
        model.Name = `${spawnConfig.template.displayName}_${tick()}`;
        model.Parent = Workspace;
        
        // Crear casco principal (HumanoidRootPart) - COLOR BRILLANTE PARA DEBUGGING
        const hull = this.createComponent("HumanoidRootPart", spawnConfig.template.components.hull);
        // CAMBIO: Color brillante para identificar el piso del barco fácilmente
        hull.Color = new Color3(1, 0, 1); // Magenta brillante para debugging
        hull.Material = Enum.Material.Neon; // Material neón para que destaque más
        hull.Parent = model;
        model.PrimaryPart = hull;
        
        // Crear deck
        const deck = this.createComponent("Deck", spawnConfig.template.components.deck);
        deck.Parent = model;
        this.weldToPrimary(hull, deck, spawnConfig.template.components.deck.position);
        
        // Crear timón
        const helm = this.createComponent("Helm", spawnConfig.template.components.helm);
        helm.Parent = model;
        this.weldToPrimary(hull, helm, spawnConfig.template.components.helm.position);
        
        // Crear asiento de control
        const helmSeat = this.createHelmSeat();
        helmSeat.Parent = model;
        this.weldToPrimary(hull, helmSeat, spawnConfig.template.components.helm.position.add(new Vector3(0, -1, 1)));
        
        // Agregar ClickDetector al timón
        this.addHelmClickDetector(helm);
        
        // Configurar sistemas de flotación y navegación MODERNOS
        this.setupModernNavigationSystems(hull, spawnConfig.template.stats);
        
        // Aplicar posición y orientación final
        model.SetPrimaryPartCFrame(spawnConfig.orientation);
        
        print(`⚓ BoatFactory: Creado ${spawnConfig.template.displayName} con HULL MAGENTA para debugging`);
        return model as BoatModel;
    }
    
    /**
     * Crea un componente basado en su configuración
     */
    private createComponent(name: string, config: ComponentConfig): Part {
        const part = new Instance("Part");
        part.Name = name;
        part.Size = config.size;
        part.Material = config.material;
        part.Color = this.getColorFromName(config.color);
        part.Anchored = config.anchored ?? false;
        part.CanCollide = config.canCollide ?? true;
        part.Shape = Enum.PartType.Block;
        
        return part;
    }
    
    /**
     * Crea el asiento para controlar el barco
     */
    private createHelmSeat(): Seat {
        const seat = new Instance("Seat");
        seat.Name = "HelmSeat";
        seat.Size = new Vector3(2, 1, 2);
        seat.Material = Enum.Material.Wood;
        seat.Color = this.getColorFromName("Brown");
        seat.Anchored = false;
        seat.CanCollide = true;
        
        return seat;
    }
    
    /**
     * Convierte nombres de colores a Color3
     */
    private getColorFromName(colorName: string): Color3 {
        // Colores comunes según la documentación oficial
        const colors: Record<string, Color3> = {
            "Brown": new Color3(0.647, 0.164, 0.164),
            "Dark orange": new Color3(1, 0.549, 0),
            "Really black": new Color3(0.105, 0.164, 0.207),
            "Bright blue": new Color3(0.0509, 0.411, 0.674),
            "Light blue": new Color3(0.678, 0.847, 0.901),
            "Reddish brown": new Color3(0.647, 0.164, 0.164),
            "Bright red": new Color3(1, 0, 0),
            "Bright green": new Color3(0, 1, 0),
            "Magenta": new Color3(1, 0, 1) // Para debugging
        };
        
        return colors[colorName] || new Color3(0.5, 0.5, 0.5); // Gris por defecto
    }
    
    /**
     * Agrega ClickDetector al timón para control manual
     */
    private addHelmClickDetector(helm: Part): void {
        const clickDetector = new Instance("ClickDetector");
        clickDetector.MaxActivationDistance = 10;
        clickDetector.Parent = helm;
    }
    
    /**
     * Une un componente al casco principal
     */
    private weldToPrimary(primary: Part, part: Part, offset: Vector3): void {
        const weld = new Instance("WeldConstraint");
        weld.Part0 = primary;
        weld.Part1 = part;
        weld.Parent = primary;
        
        // Aplicar offset relativo al casco
        part.CFrame = primary.CFrame.mul(new CFrame(offset));
    }
    
    /**
     * Configura los sistemas de flotación y navegación MODERNOS
     * Usa LinearVelocity y AngularVelocity en lugar de Body* deprecated
     */
    private setupModernNavigationSystems(hull: Part, stats: BoatStats): void {
        // Crear attachment para el sistema de movimiento moderno
        const attachment = new Instance("Attachment");
        attachment.Name = "MovementAttachment";
        attachment.Parent = hull;
        
        // LinearVelocity para movimiento horizontal (reemplaza BodyVelocity)
        const linearVelocity = new Instance("LinearVelocity");
        linearVelocity.Name = "BoatLinearVelocity";
        linearVelocity.Attachment0 = attachment;
        linearVelocity.VectorVelocity = new Vector3(0, 0, 0); // Velocidad inicial cero
        linearVelocity.MaxForce = BOAT_CONFIG.MOVEMENT_FORCE * stats.speed; // Fuerza basada en stats
        linearVelocity.RelativeTo = Enum.ActuatorRelativeTo.World;
        linearVelocity.Parent = hull;
        
        // AngularVelocity para rotación (reemplaza BodyAngularVelocity)
        const angularVelocity = new Instance("AngularVelocity");
        angularVelocity.Name = "BoatAngularVelocity";
        angularVelocity.Attachment0 = attachment;
        angularVelocity.AngularVelocity = new Vector3(0, 0, 0); // Rotación inicial cero
        angularVelocity.MaxTorque = BOAT_CONFIG.ANGULAR_FORCE * stats.turnSpeed; // Torque basado en stats
        angularVelocity.RelativeTo = Enum.ActuatorRelativeTo.World;
        angularVelocity.Parent = hull;
        
        // VectorForce para flotación automática (reemplaza BodyPosition)
        const floatForce = new Instance("VectorForce");
        floatForce.Name = "BoatFloatForce";
        floatForce.Attachment0 = attachment;
        floatForce.Force = new Vector3(0, 0, 0); // Se calculará dinámicamente
        floatForce.RelativeTo = Enum.ActuatorRelativeTo.World;
        floatForce.ApplyAtCenterOfMass = true;
        floatForce.Parent = hull;
        
        // Crear script para flotación automática usando ServerScriptService
        this.createFloatationScript(hull);
        
        print(`🚢 Sistemas de navegación MODERNOS configurados para ${hull.Parent?.Name}`);
        print(`⚡ LinearVelocity MaxForce: ${linearVelocity.MaxForce}`);
        print(`🌀 AngularVelocity MaxTorque: ${angularVelocity.MaxTorque}`);
    }
    
    /**
     * Crea el script de flotación automática como un ModuleScript
     */
    private createFloatationScript(hull: Part): void {
        // Crear un script local en el hull que maneje la flotación
        const floatScript = new Instance("Script");
        floatScript.Name = "FloatationScript";
        floatScript.Parent = hull;
        
        // El script se ejecutará automáticamente cuando se cree
        // La lógica de flotación se manejará a través de RunService
        print(`🌊 Script de flotación creado para ${hull.Parent?.Name}`);
    }
    
    /**
     * COMPATIBILIDAD: Mantener método legacy para código existente
     * @deprecated Usar setupModernNavigationSystems en su lugar
     */
    private setupNavigationSystems(hull: Part, stats: BoatStats): void {
        warn("⚠️ setupNavigationSystems está deprecated. Usando setupModernNavigationSystems automáticamente.");
        this.setupModernNavigationSystems(hull, stats);
    }
    
    /**
     * Destruye un barco de forma segura
     */
    public destroyBoat(model: BoatModel): void {
        if (model && model.Parent) {
            model.Destroy();
            print(`⚓ BoatFactory: Barco destruido correctamente`);
        }
    }
    
    /**
     * Modifica las estadísticas de navegación de un barco MODERNIZADO
     */
    public updateBoatStats(model: BoatModel, stats: BoatStats): void {
        const hull = model.FindFirstChild("HumanoidRootPart") as Part;
        if (!hull) return;
        
        // Actualizar LinearVelocity (movimiento)
        const linearVelocity = hull.FindFirstChild("BoatLinearVelocity") as LinearVelocity;
        if (linearVelocity) {
            linearVelocity.MaxForce = BOAT_CONFIG.MOVEMENT_FORCE * stats.speed;
        }
        
        // Actualizar AngularVelocity (rotación)
        const angularVelocity = hull.FindFirstChild("BoatAngularVelocity") as AngularVelocity;
        if (angularVelocity) {
            angularVelocity.MaxTorque = BOAT_CONFIG.ANGULAR_FORCE * stats.turnSpeed;
        }
        
        print(`📊 Stats actualizados: Velocidad=${stats.speed}, Giro=${stats.turnSpeed}`);
    }
    
    /**
     * NUEVO: Método para obtener componentes de movimiento moderno
     */
    public getMovementComponents(model: BoatModel): {
        linearVelocity?: LinearVelocity;
        angularVelocity?: AngularVelocity;
        attachment?: Attachment;
        hull?: Part;
    } {
        const hull = model.FindFirstChild("HumanoidRootPart") as Part;
        if (!hull) return {};
        
        const attachment = hull.FindFirstChild("MovementAttachment") as Attachment;
        const linearVelocity = hull.FindFirstChild("BoatLinearVelocity") as LinearVelocity;
        const angularVelocity = hull.FindFirstChild("BoatAngularVelocity") as AngularVelocity;
        
        return {
            linearVelocity,
            angularVelocity,
            attachment,
            hull
        };
    }
} 
