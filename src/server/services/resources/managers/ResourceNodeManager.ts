import { RunService, Workspace, TweenService } from "@rbxts/services";
import { getResource } from "shared/configs/resources";
import { RESOURCE_TYPES } from "shared/types/resources";
import { ResourceNodeData, ResourceTarget } from "shared/types/harvesting";
import { 
    IResourceNodeManager,
    IResourceUIManager,
    ResourceSpawnConfig,
    RESOURCE_CONFIG,
    ISLAND_CENTERS
} from "../types/ResourceServiceTypes";

export class ResourceNodeManager implements IResourceNodeManager {
    private resourceNodes = new Map<string, ResourceNodeData>();
    private nodeIdCounter = 0;
    private uiManager: IResourceUIManager;

    constructor(uiManager: IResourceUIManager) {
        this.uiManager = uiManager;
        this.startResourceLoop();
    }

    public spawnInitialResources(): void {
        // Spawn recursos básicos alrededor del área de spawn
        this.spawnResourceType(RESOURCE_TYPES.WOOD, 6, "🪵");
        this.spawnResourceType(RESOURCE_TYPES.ROPE, 4, "🪢");
        this.spawnResourceType(RESOURCE_TYPES.CLOTH, 5, "🧵");
        this.spawnResourceType(RESOURCE_TYPES.IRON, 3, "🔩");
        
        print("🌲 Recursos iniciales spawneados en el mundo");
    }

    private spawnResourceType(resourceType: string, count: number, emoji: string): void {
        const resource = getResource(resourceType);
        if (!resource) return;

        for (let i = 0; i < count; i++) {
            const nodeData = this.createResourceNode(resourceType, emoji);
            if (nodeData) {
                this.resourceNodes.set(nodeData.id, nodeData);
            }
        }
    }

    public createResourceNode(resourceType: string, emoji: string): ResourceNodeData | undefined {
        const resource = getResource(resourceType);
        if (!resource) return undefined;

        // Generar ID único para el nodo
        const nodeId = `${resourceType}_node_${this.nodeIdCounter++}`;

        // Crear modelo del nodo de recurso
        const model = new Instance("Model");
        model.Name = `${resource.displayName}_Node_${nodeId}`;
        model.Parent = Workspace;

        // Crear parte principal
        const part = new Instance("Part");
        part.Name = "ResourcePart";
        part.Size = new Vector3(4, 4, 4);
        part.Material = this.getMaterialForResource(resourceType);
        part.BrickColor = this.getColorForResource(resourceType);
        part.Anchored = true;
        part.CanCollide = true;
        part.Parent = model;

        // Buscar posición válida usando raycast
        const validPosition = this.findValidSpawnPosition();
        if (!validPosition) {
            // Si no se encuentra posición válida, usar posición de respaldo
            model.Destroy();
            print(`⚠️ No se pudo encontrar posición válida para ${resourceType}, reintentando...`);
            return undefined;
        }

        part.Position = validPosition;

        // Establecer PrimaryPart
        model.PrimaryPart = part;

        // Calcular health basado en el tipo de recurso
        const maxHealth = this.getHealthForResource(resourceType);
        const baseYield = this.getBaseYieldForResource(resourceType);

        // Crear datos del nodo con sistema de health
        const nodeData: ResourceNodeData = {
            id: nodeId,
            resourceType: resourceType,
            health: maxHealth,
            maxHealth: maxHealth,
            position: part.Position,
            model: model,
            baseYield: baseYield,
            qualityMultiplier: 1.0,
            respawnTime: 0,
            isAlive: true,
            lastDamagedTime: 0
        };

        // Agregar ID del nodo al modelo para referencia
        const nodeIdValue = new Instance("StringValue");
        nodeIdValue.Name = "NodeId";
        nodeIdValue.Value = nodeId;
        nodeIdValue.Parent = model;

        // Configurar UI visual
        this.uiManager.setupResourceUI(nodeData, emoji);

        return nodeData;
    }

    private findValidSpawnPosition(): Vector3 | undefined {
        const maxAttempts = 20;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Elegir una isla aleatoria como centro
            const randomIsland = ISLAND_CENTERS[math.floor(math.random() * ISLAND_CENTERS.size())];
            
            // Generar posición aleatoria en un radio más pequeño alrededor de la isla
            const islandRadius = 100; // Radio más pequeño ya que estamos en una isla
            const randomAngle = math.random() * math.pi * 2;
            const randomDistance = math.random() * islandRadius;
            
            const testX = randomIsland.X + math.cos(randomAngle) * randomDistance;
            const testZ = randomIsland.Z + math.sin(randomAngle) * randomDistance;
            
            // Hacer raycast desde arriba hacia abajo para encontrar el suelo
            const raycastParams = new RaycastParams();
            raycastParams.FilterType = Enum.RaycastFilterType.Blacklist;
            raycastParams.FilterDescendantsInstances = []; // Podemos filtrar objetos específicos si es necesario
            
            const rayStart = new Vector3(testX, randomIsland.Y + 100, testZ); // Empezar desde arriba de la isla
            const rayDirection = new Vector3(0, -200, 0); // Raycast hacia abajo
            
            const raycastResult = Workspace.Raycast(rayStart, rayDirection, raycastParams);
            
            if (raycastResult && raycastResult.Instance) {
                // Verificar que el hit es en una superficie válida (no muy inclinada)
                const surfaceNormal = raycastResult.Normal;
                const angleFromVertical = math.acos(surfaceNormal.Dot(new Vector3(0, 1, 0)));
                
                // Solo aceptar superficies con menos de 45 grados de inclinación (más permisivo)
                if (angleFromVertical <= math.rad(45)) {
                    // Verificar que no está demasiado cerca de otros recursos
                    const proposedPosition = raycastResult.Position.add(new Vector3(0, 2, 0)); // 2 studs arriba de la superficie
                    
                    if (this.isPositionFarFromOtherResources(proposedPosition, 10)) { // Distancia mínima reducida
                        print(`✅ Recurso spawneado en isla en posición: ${proposedPosition}`);
                        return proposedPosition;
                    }
                }
            }
        }
        
        // Si no se encuentra posición válida, usar posición de respaldo en una isla aleatoria
        const fallbackIsland = ISLAND_CENTERS[math.floor(math.random() * ISLAND_CENTERS.size())];
        const fallbackPosition = fallbackIsland.add(new Vector3(
            (math.random() - 0.5) * 20, // Área más pequeña alrededor de la isla
            5, // Un poco arriba
            (math.random() - 0.5) * 20
        ));
        
        print(`⚠️ No se encontró posición válida con raycast, usando posición de respaldo en isla: ${fallbackPosition}`);
        return fallbackPosition;
    }

    private isPositionFarFromOtherResources(position: Vector3, minDistance: number): boolean {
        for (const [_, nodeData] of this.resourceNodes) {
            if (nodeData.isAlive) {
                const distance = position.sub(nodeData.position).Magnitude;
                if (distance < minDistance) {
                    return false;
                }
            }
        }
        return true;
    }

    public destroyResourceNode(nodeData: ResourceNodeData): void {
        nodeData.isAlive = false;
        const part = nodeData.model.PrimaryPart;
        
        if (part) {
            // Efecto de destrucción
            const tween = TweenService.Create(part,
                new TweenInfo(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.In),
                { 
                    Size: new Vector3(0.1, 0.1, 0.1),
                    Transparency: 1
                }
            );
            tween.Play();

            // Ocultar GUI
            const gui = part.FindFirstChild("BillboardGui") as BillboardGui;
            if (gui) gui.Enabled = false;
        }

        // Programar respawn en 60-120 segundos
        nodeData.respawnTime = tick() + math.random(RESOURCE_CONFIG.RESPAWN_TIME_MIN, RESOURCE_CONFIG.RESPAWN_TIME_MAX);
        print(`💥 Nodo ${nodeData.id} destruido - respawn en ${math.floor(nodeData.respawnTime - tick())}s`);
    }

    public respawnResourceNode(nodeData: ResourceNodeData): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        // Restaurar health completa
        nodeData.health = nodeData.maxHealth;
        nodeData.isAlive = true;
        
        // Restaurar visibilidad
        part.Transparency = 0;
        part.CanCollide = true;

        // Restaurar GUI
        const gui = part.FindFirstChild("BillboardGui") as BillboardGui;
        if (gui) gui.Enabled = true;

        // Actualizar UI con health completa
        this.uiManager.updateResourceUI(nodeData);

        // Restaurar tamaño completo
        part.Size = new Vector3(4, 4, 4);

        print(`🔄 Nodo de recurso respawneado: ${nodeData.model.Name}`);
    }

    private startResourceLoop(): void {
        RunService.Heartbeat.Connect(() => {
            this.updateResourceNodes();
        });
    }

    public updateResourceNodes(): void {
        const currentTime = tick();
        
        this.resourceNodes.forEach((nodeData) => {
            // Verificar respawn de nodos destruidos
            if (!nodeData.isAlive && nodeData.respawnTime > 0 && currentTime >= nodeData.respawnTime) {
                this.respawnResourceNode(nodeData);
                nodeData.respawnTime = 0;
            }
        });
    }

    public getAllResourceNodes(): Map<string, ResourceTarget> {
        const resourceTargets = new Map<string, ResourceTarget>();
        
        this.resourceNodes.forEach((nodeData, nodeId) => {
            if (nodeData.isAlive) {
                resourceTargets.set(nodeId, {
                    type: "resource",
                    id: nodeId,
                    model: nodeData.model,
                    position: nodeData.position
                });
            }
        });

        return resourceTargets;
    }

    public getResourceNode(nodeId: string): ResourceNodeData | undefined {
        return this.resourceNodes.get(nodeId);
    }

    public respawnAllResources(): void {
        print("🔄 Respawneando todos los recursos con posiciones mejoradas...");
        
        // Destruir todos los nodos existentes
        this.resourceNodes.forEach((nodeData) => {
            if (nodeData.model && nodeData.model.Parent) {
                nodeData.model.Destroy();
            }
        });
        
        // Limpiar el mapa
        this.resourceNodes.clear();
        this.nodeIdCounter = 0;
        
        // Crear nuevos recursos con el sistema mejorado
        this.spawnInitialResources();
        
        print("✅ Todos los recursos han sido respawneados con posiciones mejoradas!");
    }

    public forceRespawnResource(nodeId: string): boolean {
        const nodeData = this.resourceNodes.get(nodeId);
        if (!nodeData) return false;
        
        // Destruir el nodo actual
        if (nodeData.model && nodeData.model.Parent) {
            nodeData.model.Destroy();
        }
        
        // Buscar nueva posición
        const newPosition = this.findValidSpawnPosition();
        if (!newPosition) return false;
        
        // Recrear el modelo
        const resource = getResource(nodeData.resourceType);
        if (!resource) return false;
        
        const model = new Instance("Model");
        model.Name = `${resource.displayName}_Node_${nodeData.id}`;
        model.Parent = Workspace;
        
        const part = new Instance("Part");
        part.Name = "ResourcePart";
        part.Size = new Vector3(4, 4, 4);
        part.Material = this.getMaterialForResource(nodeData.resourceType);
        part.BrickColor = this.getColorForResource(nodeData.resourceType);
        part.Anchored = true;
        part.CanCollide = true;
        part.Position = newPosition;
        part.Parent = model;
        
        model.PrimaryPart = part;
        
        // Actualizar datos del nodo
        nodeData.model = model;
        nodeData.position = newPosition;
        nodeData.health = nodeData.maxHealth;
        nodeData.isAlive = true;
        
        // Agregar ID del nodo al modelo
        const nodeIdValue = new Instance("StringValue");
        nodeIdValue.Name = "NodeId";
        nodeIdValue.Value = nodeData.id;
        nodeIdValue.Parent = model;
        
        // Configurar UI
        const emoji = this.getEmojiForResource(nodeData.resourceType);
        this.uiManager.setupResourceUI(nodeData, emoji);
        
        print(`🔄 Nodo ${nodeId} respawneado en nueva posición: ${newPosition}`);
        return true;
    }

    // Métodos de configuración para recursos
    private getHealthForResource(resourceType: string): number {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return 100;   // Fácil de cortar
            case RESOURCE_TYPES.ROPE: return 60;    // Fibras fáciles
            case RESOURCE_TYPES.CLOTH: return 80;   // Medio
            case RESOURCE_TYPES.IRON: return 150;   // Más difícil de minar
            default: return 100;
        }
    }

    private getBaseYieldForResource(resourceType: string): number {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return 8;
            case RESOURCE_TYPES.ROPE: return 6;
            case RESOURCE_TYPES.CLOTH: return 7;
            case RESOURCE_TYPES.IRON: return 4;
            default: return 5;
        }
    }

    private getMaterialForResource(resourceType: string): Enum.Material {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return Enum.Material.Wood;
            case RESOURCE_TYPES.IRON: return Enum.Material.Metal;
            case RESOURCE_TYPES.ROPE: return Enum.Material.Fabric;
            case RESOURCE_TYPES.CLOTH: return Enum.Material.Fabric;
            default: return Enum.Material.Plastic;
        }
    }

    private getColorForResource(resourceType: string): BrickColor {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return new BrickColor("Brown");
            case RESOURCE_TYPES.IRON: return new BrickColor("Dark stone grey");
            case RESOURCE_TYPES.ROPE: return new BrickColor("Cool yellow");
            case RESOURCE_TYPES.CLOTH: return new BrickColor("White");
            default: return new BrickColor("Medium stone grey");
        }
    }

    private getEmojiForResource(resourceType: string): string {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return "🪵";
            case RESOURCE_TYPES.ROPE: return "🪢";
            case RESOURCE_TYPES.CLOTH: return "🧵";
            case RESOURCE_TYPES.IRON: return "🔩";
            default: return "❓";
        }
    }
} 
