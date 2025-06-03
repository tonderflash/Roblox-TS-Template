import { OnStart, Service } from "@flamework/core";
import { Players, RunService, Workspace, TweenService, ReplicatedStorage } from "@rbxts/services";
import { Events } from "server/network";
import { Events as ClientEvents } from "client/network";
import { RESOURCES, CRAFTING_RECIPES, getResource, getCraftingRecipe } from "shared/configs/resources";
import { 
    RESOURCE_TYPES, 
    PlayerResources, 
    ResourceStack, 
    InventoryTransaction, 
    TransactionResult 
} from "shared/types/resources";
import { ResourceNodeData, ResourceTarget, HarvestingResult, HarvestYield } from "shared/types/harvesting";
import { HotbarItem } from "shared/network";
import { 
    safeValidate, 
    validateHotbarSlotIndex, 
    validateItemId, 
    validateSlotIndex, 
    validateInventoryTransaction
} from "./resources/types/ResourceServiceTypes";

// Interfaces para inyección de dependencias
interface ToolServiceInterface {
    getPlayerTool(player: Player): string;
    calculateDamage(player: Player, resourceType: string, baseDamage: number): number;
    getResourceMultiplier(player: Player, resourceType: string): number;
}

interface CombatServiceInterface {
    getPlayerCombatData(player: Player): { stats: { damage: number; level: number } } | undefined;
}

interface InventoryServiceInterface {
    addResource(player: Player, resourceType: string, amount: number): void;
}

// NUEVO: Tipo extendido de PlayerResources que garantiza que hotbar existe
interface ExtendedPlayerResources extends PlayerResources {
    hotbar: (HotbarItem | undefined)[];
}

// NUEVO: Tipo específico para snapshots
interface PlayerResourcesSnapshot {
    resources: Map<string, number>;
    hotbar: (HotbarItem | undefined)[];
    lastUpdated: number;
}

@Service()
export class ResourceService implements OnStart {
    private playerResources = new Map<Player, ExtendedPlayerResources>();
    private resourceNodes = new Map<string, ResourceNodeData>();
    private readonly SPAWN_RADIUS = 200; // Radio alrededor del spawn para recursos
    private readonly MAX_NODES_PER_TYPE = 8; // Máximo nodos por tipo de recurso
    private nodeIdCounter = 0;
    private toolService?: ToolServiceInterface;
    private combatService?: CombatServiceInterface;
    private inventoryService?: InventoryServiceInterface;

    onStart(): void {
        this.setupPlayerEvents();
        this.setupResourceEvents();
        this.spawnInitialResources();
        this.startResourceLoop();
        this.setupInventorySync();
        print("🌲 ResourceService iniciado correctamente con sistema ARK-style!");
    }

    // Métodos para inyectar servicios (evita circular dependency)
    public setToolService(toolService: ToolServiceInterface): void {
        this.toolService = toolService;
    }

    public setCombatService(combatService: CombatServiceInterface): void {
        this.combatService = combatService;
    }

    public setInventoryService(inventoryService: InventoryServiceInterface): void {
        this.inventoryService = inventoryService;
    }

    private setupPlayerEvents(): void {
        Players.PlayerAdded.Connect((player) => {
            this.initializePlayerResources(player);
        });

        Players.PlayerRemoving.Connect((player) => {
            this.cleanupPlayerResources(player);
        });
    }

    private setupResourceEvents(): void {
        // TODO: Agregar eventos de red para recursos cuando se implemente la UI
        // Events.collectResource.connect((player, resourceNodeId) => {
        //     this.collectResource(player, resourceNodeId);
        // });
        
        // Events.craftBoat.connect((player, recipeId) => {
        //     this.craftBoat(player, recipeId);
        // });
    }

    private setupInventorySync(): void {
        // NUEVO: Event para mover item del inventario al hotbar
        Events.moveItemToHotbar.connect((player, itemId, fromSlot, toSlot) => {
            const validItemId = safeValidate(
                validateItemId,
                itemId,
                "moveItemToHotbar.itemId"
            );

            if (!validItemId) {
                warn(`[ResourceService] moveItemToHotbar: ItemId inválido de ${player.Name}`);
                return;
            }

            const validFromSlot = safeValidate(
                validateSlotIndex,
                fromSlot,
                "moveItemToHotbar.fromSlot"
            );

            const validToSlot = safeValidate(
                validateHotbarSlotIndex,
                toSlot,
                "moveItemToHotbar.toSlot"
            );

            if (validFromSlot === undefined || !validToSlot) {
                warn(`[ResourceService] moveItemToHotbar: Slots inválidos de ${player.Name}`);
                return;
            }

            this.handleInventoryTransaction(player, {
                type: "MOVE",
                sourceType: "INVENTORY", 
                targetType: "HOTBAR",
                itemId: validItemId,
                amount: 1, // Por defecto 1, se puede modificar
                sourceSlot: validFromSlot,
                targetSlot: validToSlot
            });
        });

        // NUEVO: Event para uso de hotbar
        Events.useHotbarSlot.connect((player, slotIndex) => {
            const validSlotIndex = safeValidate(
                validateHotbarSlotIndex,
                slotIndex,
                "useHotbarSlot.slotIndex"
            );

            if (!validSlotIndex) {
                warn(`[ResourceService] useHotbarSlot: SlotIndex inválido de ${player.Name}`);
                return;
            }

            this.useHotbarSlot(player, validSlotIndex);
        });

        // NUEVO: Event para mover entre slots de hotbar
        Events.moveHotbarSlot.connect((player, fromSlot, toSlot) => {
            const validFromSlot = safeValidate(
                validateHotbarSlotIndex,
                fromSlot,
                "moveHotbarSlot.fromSlot"
            );

            const validToSlot = safeValidate(
                validateHotbarSlotIndex,
                toSlot,
                "moveHotbarSlot.toSlot"
            );

            if (!validFromSlot || !validToSlot) {
                warn(`[ResourceService] moveHotbarSlot: Slots inválidos de ${player.Name}`);
                return;
            }

            this.handleInventoryTransaction(player, {
                type: "MOVE",
                sourceType: "HOTBAR",
                targetType: "HOTBAR", 
                itemId: "", // Se determina desde el slot
                amount: 1,
                sourceSlot: validFromSlot,
                targetSlot: validToSlot
            });
        });
    }

    private initializePlayerResources(player: Player): void {
        const playerRes: ExtendedPlayerResources = {
            resources: new Map<string, number>(),
            hotbar: this.createEmptyHotbar(),
            lastUpdated: tick()
        };

        // Dar algunos recursos iniciales para testing
        playerRes.resources.set(RESOURCE_TYPES.WOOD, 50);
        playerRes.resources.set(RESOURCE_TYPES.ROPE, 25);
        playerRes.resources.set(RESOURCE_TYPES.CLOTH, 30);
        playerRes.resources.set(RESOURCE_TYPES.IRON, 10);

        this.playerResources.set(player, playerRes);

        // NUEVO: Notificar estados iniciales al cliente
        wait(1); // Esperar que el cliente esté listo
        this.syncPlayerData(player);
        
        print(`🎒 Recursos y hotbar inicializados para ${player.Name}`);
    }

    private cleanupPlayerResources(player: Player): void {
        this.playerResources.delete(player);
    }

    private spawnInitialResources(): void {
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

    private createResourceNode(resourceType: string, emoji: string): ResourceNodeData | undefined {
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
        this.setupResourceUI(nodeData, emoji);

        return nodeData;
    }

    private findValidSpawnPosition(): Vector3 | undefined {
        // Centros de las islas donde hay terreno sólido
        const islandCenters = [
            new Vector3(0, 17, 0),      // Isla de Inicio
            new Vector3(500, 19.5, 300), // Bahía Pirata
            new Vector3(-400, 22, 400),  // Base Marina
            new Vector3(600, 27, -200),  // Templo de la Jungla
            new Vector3(-600, 19.5, 100), // Ruinas del Desierto
            new Vector3(-300, 24.5, -400), // Cavernas de Hielo
            new Vector3(300, 29.5, -500)  // Forja del Volcán
        ];
        
        const maxAttempts = 20;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Elegir una isla aleatoria como centro
            const randomIsland = islandCenters[math.floor(math.random() * islandCenters.size())];
            
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
        const fallbackIsland = islandCenters[math.floor(math.random() * islandCenters.size())];
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

    private setupResourceUI(nodeData: ResourceNodeData, emoji: string): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        const resource = getResource(nodeData.resourceType);
        if (!resource) return;

        // Agregar texto flotante
        const gui = new Instance("BillboardGui");
        gui.Size = UDim2.fromScale(4, 3);
        gui.StudsOffset = new Vector3(0, 3, 0);
        gui.Parent = part;

        // Label principal con info del recurso
        const nameLabel = new Instance("TextLabel");
        nameLabel.Size = UDim2.fromScale(1, 0.5);
        nameLabel.Position = UDim2.fromScale(0, 0);
        nameLabel.BackgroundTransparency = 1;
        nameLabel.Text = `${emoji} ${resource.displayName}`;
        nameLabel.TextColor3 = new Color3(1, 1, 1);
        nameLabel.TextScaled = true;
        nameLabel.Font = Enum.Font.SourceSansBold;
        nameLabel.Parent = gui;

        // Health bar
        const healthFrame = new Instance("Frame");
        healthFrame.Size = UDim2.fromScale(1, 0.2);
        healthFrame.Position = UDim2.fromScale(0, 0.6);
        healthFrame.BackgroundColor3 = Color3.fromRGB(50, 50, 50);
        healthFrame.BorderSizePixel = 1;
        healthFrame.Parent = gui;

        const healthBar = new Instance("Frame");
        healthBar.Name = "HealthBar";
        healthBar.Size = UDim2.fromScale(1, 1);
        healthBar.Position = UDim2.fromScale(0, 0);
        healthBar.BackgroundColor3 = this.getHealthBarColor(nodeData.resourceType);
        healthBar.BorderSizePixel = 0;
        healthBar.Parent = healthFrame;

        // Health text
        const healthLabel = new Instance("TextLabel");
        healthLabel.Size = UDim2.fromScale(1, 0.3);
        healthLabel.Position = UDim2.fromScale(0, 0.8);
        healthLabel.BackgroundTransparency = 1;
        healthLabel.Text = `${nodeData.health}/${nodeData.maxHealth} HP`;
        healthLabel.TextColor3 = new Color3(1, 1, 1);
        healthLabel.TextScaled = true;
        healthLabel.Font = Enum.Font.SourceSans;
        healthLabel.Parent = gui;
    }

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

    private getHealthBarColor(resourceType: string): Color3 {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return Color3.fromRGB(139, 69, 19);   // Brown
            case RESOURCE_TYPES.ROPE: return Color3.fromRGB(255, 215, 0);   // Gold
            case RESOURCE_TYPES.CLOTH: return Color3.fromRGB(255, 255, 255); // White
            case RESOURCE_TYPES.IRON: return Color3.fromRGB(128, 128, 128);  // Gray
            default: return Color3.fromRGB(0, 255, 0);                       // Green
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

    private startResourceLoop(): void {
        RunService.Heartbeat.Connect(() => {
            this.updateResourceNodes();
        });
    }

    private updateResourceNodes(): void {
        const currentTime = tick();
        
        this.resourceNodes.forEach((nodeData) => {
            // Verificar respawn de nodos destruidos
            if (!nodeData.isAlive && nodeData.respawnTime > 0 && currentTime >= nodeData.respawnTime) {
                this.respawnResourceNode(nodeData);
                nodeData.respawnTime = 0;
            }
        });
    }

    private respawnResourceNode(nodeData: ResourceNodeData): void {
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
        this.updateResourceUI(nodeData);

        // Restaurar tamaño completo
        part.Size = new Vector3(4, 4, 4);

        print(`🔄 Nodo de recurso respawneado: ${nodeData.model.Name}`);
    }

    // Método principal para dañar recursos (ARK-style)
    public damageResourceNode(nodeId: string, damage: number, attacker: Player, toolType: string): boolean {
        const nodeData = this.resourceNodes.get(nodeId);
        if (!nodeData || !nodeData.isAlive) return false;

        // Calcular damage efectivo con herramientas
        const effectiveDamage = this.calculateEffectiveDamage(attacker, nodeData.resourceType, damage);
        
        // Aplicar daño
        const previousHealth = nodeData.health;
        nodeData.health = math.max(0, nodeData.health - effectiveDamage);
        nodeData.lastDamagedTime = tick();

        // Calcular yield basado en damage
        const harvestResult = this.calculateHarvestYield(attacker, nodeData, effectiveDamage);
        
        // Dar recursos al jugador
        harvestResult.yields.forEach((yieldData) => {
            this.giveResourceToPlayer(attacker, yieldData.resourceId, yieldData.amount);
        });

        // Actualizar UI
        this.updateResourceUI(nodeData);

        // Efectos visuales
        this.playHarvestEffects(nodeData, effectiveDamage, harvestResult.criticalHit);

        print(`⛏️ ${attacker.Name} dañó ${nodeData.resourceType} por ${effectiveDamage} (${previousHealth} → ${nodeData.health})`);
        
        if (harvestResult.yields.size() > 0) {
            const totalYield = harvestResult.yields.reduce((total, yieldData) => total + yieldData.amount, 0);
            print(`📦 ${attacker.Name} obtuvo ${totalYield}x ${nodeData.resourceType}`);
        }

        // Verificar si el nodo fue destruido
        if (nodeData.health <= 0) {
            this.destroyResourceNode(nodeData);
            return true; // Nodo destruido
        }

        return false; // Nodo aún vivo
    }

    private calculateEffectiveDamage(player: Player, resourceType: string, baseDamage: number): number {
        if (!this.toolService || !this.combatService) {
            return baseDamage; // fallback
        }

        // Obtener datos del jugador
        const combatData = this.combatService.getPlayerCombatData(player);
        const playerMeleeMultiplier = combatData ? (combatData.stats.damage / 100) : 1.0;

        // Calcular damage con herramienta
        const toolDamage = this.toolService.calculateDamage(player, resourceType, baseDamage);
        
        // Damage final = Tool Damage × Player Melee Multiplier
        const finalDamage = toolDamage * playerMeleeMultiplier;

        return math.floor(finalDamage);
    }

    private calculateHarvestYield(player: Player, nodeData: ResourceNodeData, damageDealt: number): HarvestingResult {
        // Calcular yield basado en la fórmula ARK: (Damage / Max Health) × Base Yield × Quality × Tool Multiplier
        const damageRatio = damageDealt / nodeData.maxHealth;
        const baseYield = nodeData.baseYield * damageRatio * nodeData.qualityMultiplier;
        
        // Aplicar multiplicador de herramienta
        const toolMultiplier = this.toolService?.getResourceMultiplier(player, nodeData.resourceType) || 1.0;
        let finalYield = baseYield * toolMultiplier;

        // Chance de crítico (5% base)
        const isCrit = math.random() < 0.05;
        if (isCrit) {
            finalYield *= 1.5;
        }

        // Asegurar que siempre se dé al menos algo por hit
        const minYield = 1;
        const yieldAmount = math.max(minYield, math.floor(finalYield));

        const yields: HarvestYield[] = [{
            resourceId: nodeData.resourceType,
            amount: yieldAmount
        }];

        // Chance de recurso raro (2% chance)
        if (math.random() < 0.02) {
            yields.push({
                resourceId: nodeData.resourceType,
                amount: 1,
                rare: { resourceId: nodeData.resourceType + "_rare", amount: 1 }
            });
        }

        return {
            yields: yields,
            damageDealt: damageDealt,
            resourceNodeDestroyed: nodeData.health <= damageDealt,
            criticalHit: isCrit
        };
    }

    private updateResourceUI(nodeData: ResourceNodeData): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        const gui = part.FindFirstChild("BillboardGui") as BillboardGui;
        if (!gui) return;

        // Actualizar health bar
        const healthFrame = gui.FindFirstChild("Frame") as Frame;
        const healthBar = healthFrame?.FindFirstChild("HealthBar") as Frame;
        if (healthBar) {
            const healthPercentage = nodeData.health / nodeData.maxHealth;
            healthBar.Size = UDim2.fromScale(healthPercentage, 1);
        }

        // Actualizar health text
        const healthLabel = gui.FindFirstChild("TextLabel") as TextLabel;
        const healthTextLabels = gui.GetChildren().filter(child => child.IsA("TextLabel")) as TextLabel[];
        const healthTextLabel = healthTextLabels[healthTextLabels.size() - 1]; // Último label es el de health
        if (healthTextLabel) {
            healthTextLabel.Text = `${nodeData.health}/${nodeData.maxHealth} HP`;
        }
    }

    private playHarvestEffects(nodeData: ResourceNodeData, damage: number, isCrit: boolean): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        // Efecto de golpe
        const effectColor = isCrit ? Color3.fromRGB(255, 255, 0) : Color3.fromRGB(255, 255, 255);
        
        // Crear efecto de partículas simple
        const effectPart = new Instance("Part");
        effectPart.Size = new Vector3(1, 1, 1);
        effectPart.Position = part.Position.add(new Vector3(0, 2, 0));
        effectPart.Color = effectColor;
        effectPart.Material = Enum.Material.Neon;
        effectPart.Anchored = true;
        effectPart.CanCollide = false;
        effectPart.Parent = Workspace;

        // Animar efecto
        const tween = TweenService.Create(effectPart,
            new TweenInfo(0.5, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
            { 
                Size: new Vector3(3, 3, 3),
                Transparency: 1,
                Position: effectPart.Position.add(new Vector3(0, 3, 0))
            }
        );
        tween.Play();
        tween.Completed.Connect(() => {
            effectPart.Destroy();
        });

        // Shake effect en el resource node
        const originalPosition = part.Position;
        const shakeIntensity = isCrit ? 0.3 : 0.1;
        
        for (let i = 0; i < 5; i++) {
            task.wait(0.05);
            const randomOffset = new Vector3(
                (math.random() - 0.5) * shakeIntensity,
                (math.random() - 0.5) * shakeIntensity,
                (math.random() - 0.5) * shakeIntensity
            );
            part.Position = originalPosition.add(randomOffset);
        }
        
        part.Position = originalPosition;
    }

    private destroyResourceNode(nodeData: ResourceNodeData): void {
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
        nodeData.respawnTime = tick() + math.random(60, 120);
        print(`💥 Nodo ${nodeData.id} destruido - respawn en ${math.floor(nodeData.respawnTime - tick())}s`);
    }

    private giveResourceToPlayer(player: Player, resourceType: string, amount: number): void {
        // Usar InventoryService si está disponible, sino usar sistema local como fallback
        if (this.inventoryService) {
            this.inventoryService.addResource(player, resourceType, amount);
        } else {
            // MEJORADO: Fallback al sistema local con validación de stacking
            const playerRes = this.playerResources.get(player);
            if (!playerRes) return;

            // NUEVO: Obtener información del recurso para validar stackSize
            const resourceInfo = getResource(resourceType);
            const maxStack = resourceInfo ? math.min(resourceInfo.stackSize, 100) : 100; // Límite máximo de 100

            const currentAmount = playerRes.resources.get(resourceType) || 0;
            const newAmount = math.min(currentAmount + amount, maxStack);
            const actualAdded = newAmount - currentAmount;
            
            playerRes.resources.set(resourceType, newAmount);
            playerRes.lastUpdated = tick();
            
            // MEJORADO: Mensaje más informativo con validación de stack
            if (actualAdded < amount) {
                print(`📦 [Fallback] ${player.Name} obtuvo ${actualAdded}x ${resourceType} (Total: ${newAmount}) - ${amount - actualAdded} perdido por límite de stack`);
            } else {
                print(`📦 [Fallback] ${player.Name} obtuvo ${actualAdded}x ${resourceType} (Total: ${newAmount})`);
            }
        }
    }

    // Métodos públicos para integración con CombatService
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

    // Funciones públicas para otros servicios (mantenidas para compatibilidad)
    public getPlayerResources(player: Player): ExtendedPlayerResources | undefined {
        return this.playerResources.get(player);
    }

    public hasResources(player: Player, requirements: ResourceStack[]): boolean {
        const playerRes = this.getPlayerResources(player);
        if (!playerRes) return false;

        for (const requirement of requirements) {
            const playerAmount = playerRes.resources.get(requirement.resourceId) || 0;
            if (playerAmount < requirement.amount) {
                return false;
            }
        }
        return true;
    }

    public consumeResources(player: Player, requirements: ResourceStack[]): boolean {
        if (!this.hasResources(player, requirements)) return false;

        const playerRes = this.getPlayerResources(player);
        if (!playerRes) return false;

        // Consumir recursos
        for (const requirement of requirements) {
            const currentAmount = playerRes.resources.get(requirement.resourceId) || 0;
            playerRes.resources.set(requirement.resourceId, currentAmount - requirement.amount);
        }

        playerRes.lastUpdated = tick();
        print(`💸 ${player.Name} consumió recursos para crafting`);
        return true;
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
        this.setupResourceUI(nodeData, emoji);
        
        print(`🔄 Nodo ${nodeId} respawneado en nueva posición: ${newPosition}`);
        return true;
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

    // ==============================================
    // SISTEMA DE TRANSACCIONES PROFESIONAL
    // ==============================================

    /**
     * Maneja todas las transacciones de inventario de forma atómica
     * Implementa el patrón Transaction Script usado en estudios AAA
     */
    public handleInventoryTransaction(player: Player, transaction: InventoryTransaction): TransactionResult {
        const playerRes = this.playerResources.get(player);
        if (!playerRes) {
            return { success: false, error: "Player data not found" };
        }

        print(`🔄 TRANSACTION: ${transaction.type} ${transaction.itemId} from ${transaction.sourceType} to ${transaction.targetType}`);

        // PASO 1: Validación previa
        const validation = this.validateTransaction(playerRes, transaction);
        if (!validation.success) {
            print(`❌ TRANSACTION FAILED: ${validation.error}`);
            return validation;
        }

        // PASO 2: Crear snapshot para rollback
        const snapshot = this.createSnapshot(playerRes);

        try {
            // PASO 3: Ejecutar transacción
            const result = this.executeTransaction(playerRes, transaction);
            
            if (result.success) {
                // PASO 4: Commit - Actualizar timestamp y notificar cliente
                playerRes.lastUpdated = tick();
                this.syncPlayerData(player);
                print(`✅ TRANSACTION SUCCESS: ${transaction.type} completed`);
                return result;
            } else {
                // PASO 5: Rollback
                this.restoreSnapshot(playerRes, snapshot);
                print(`🔄 TRANSACTION ROLLBACK: ${result.error}`);
                return result;
            }
        } catch (error) {
            // PASO 6: Emergency rollback
            this.restoreSnapshot(playerRes, snapshot);
            print(`💥 TRANSACTION ERROR: ${error}`);
            return { success: false, error: `Unexpected error: ${error}` };
        }
    }

    private validateTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult {
        const { type: transactionType, sourceType, targetType, itemId, amount, sourceSlot, targetSlot } = transaction;

        // Validar slots
        if (sourceType === "HOTBAR" && (sourceSlot === undefined || sourceSlot < 0 || sourceSlot >= 9)) {
            return { success: false, error: "Invalid source hotbar slot" };
        }
        
        if (targetType === "HOTBAR" && (targetSlot === undefined || targetSlot < 0 || targetSlot >= 9)) {
            return { success: false, error: "Invalid target hotbar slot" };
        }

        // Validar disponibilidad en fuente
        if (sourceType === "INVENTORY") {
            const availableAmount = playerRes.resources.get(itemId) || 0;
            if (availableAmount < amount) {
                return { success: false, error: `Insufficient ${itemId}: need ${amount}, have ${availableAmount}` };
            }
        } else if (sourceType === "HOTBAR" && sourceSlot !== undefined) {
            const sourceItem = playerRes.hotbar[sourceSlot];
            if (!sourceItem) {
                return { success: false, error: "Source hotbar slot is empty" };
            }
            if (sourceItem.amount < amount) {
                return { success: false, error: `Insufficient amount in hotbar slot: need ${amount}, have ${sourceItem.amount}` };
            }
        }

        return { success: true };
    }

    private executeTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult {
        const { type: transactionType, sourceType, targetType, itemId, amount, sourceSlot, targetSlot } = transaction;

        if (transactionType === "MOVE") {
            return this.executeMoveTransaction(playerRes, transaction);
        } else if (transactionType === "COPY") {
            return this.executeCopyTransaction(playerRes, transaction);
        } else if (transactionType === "SWAP") {
            return this.executeSwapTransaction(playerRes, transaction);
        }

        return { success: false, error: "Unknown transaction type" };
    }

    private executeMoveTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult {
        const { sourceType, targetType, itemId, amount, sourceSlot, targetSlot } = transaction;

        // INVENTORY -> HOTBAR
        if (sourceType === "INVENTORY" && targetType === "HOTBAR") {
            // Quitar del inventario
            const currentAmount = playerRes.resources.get(itemId) || 0;
            const newAmount = currentAmount - amount;
            
            if (newAmount <= 0) {
                playerRes.resources.delete(itemId);
            } else {
                playerRes.resources.set(itemId, newAmount);
            }

            // Agregar al hotbar
            const hotbarItem: HotbarItem = {
                itemId: itemId,
                itemType: this.getItemType(itemId),
                amount: amount,
                displayName: this.getItemDisplayName(itemId),
                icon: this.getItemIcon(itemId)
            };

            let actualSlot = targetSlot!;
            if (actualSlot === -1) {
                actualSlot = this.findEmptyHotbarSlot(playerRes.hotbar);
                if (actualSlot === -1) {
                    return { success: false, error: "No empty hotbar slots available" };
                }
            }

            playerRes.hotbar[actualSlot] = hotbarItem;
            return { success: true };
        }

        // HOTBAR -> INVENTORY  
        else if (sourceType === "HOTBAR" && targetType === "INVENTORY") {
            const sourceItem = playerRes.hotbar[sourceSlot!];
            if (!sourceItem) {
                return { success: false, error: "Source hotbar slot is empty" };
            }

            // Agregar al inventario
            const currentAmount = playerRes.resources.get(sourceItem.itemId) || 0;
            playerRes.resources.set(sourceItem.itemId, currentAmount + sourceItem.amount);

            // Quitar del hotbar
            playerRes.hotbar[sourceSlot!] = undefined;
            return { success: true };
        }

        // HOTBAR -> HOTBAR
        else if (sourceType === "HOTBAR" && targetType === "HOTBAR") {
            const sourceItem = playerRes.hotbar[sourceSlot!];
            const targetItem = playerRes.hotbar[targetSlot!];

            // Swap items
            playerRes.hotbar[targetSlot!] = sourceItem;
            playerRes.hotbar[sourceSlot!] = targetItem;
            return { success: true };
        }

        return { success: false, error: "Unsupported move operation" };
    }

    private executeCopyTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult {
        // Para operaciones que no remueven del origen (ej: crafting)
        const { sourceType, targetType, itemId, amount, targetSlot } = transaction;

        if (sourceType === "INVENTORY" && targetType === "HOTBAR") {
            const hotbarItem: HotbarItem = {
                itemId: itemId,
                itemType: this.getItemType(itemId),
                amount: amount,
                displayName: this.getItemDisplayName(itemId),
                icon: this.getItemIcon(itemId)
            };

            let actualSlot = targetSlot!;
            if (actualSlot === -1) {
                actualSlot = this.findEmptyHotbarSlot(playerRes.hotbar);
                if (actualSlot === -1) {
                    return { success: false, error: "No empty hotbar slots available" };
                }
            }

            playerRes.hotbar[actualSlot] = hotbarItem;
            return { success: true };
        }

        return { success: false, error: "Unsupported copy operation" };
    }

    private executeSwapTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult {
        // Para intercambiar items entre slots
        return { success: false, error: "Swap not implemented yet" };
    }

    // ==============================================
    // SISTEMA DE SNAPSHOTS PARA ROLLBACK
    // ==============================================

    private createSnapshot(playerRes: ExtendedPlayerResources): PlayerResourcesSnapshot {
        // Crear una copia profunda del Map usando iteración manual
        const resourcesCopy = new Map<string, number>();
        playerRes.resources.forEach((value, key) => {
            resourcesCopy.set(key, value);
        });
        
        return {
            resources: resourcesCopy,
            hotbar: [...playerRes.hotbar],
            lastUpdated: playerRes.lastUpdated
        };
    }

    private restoreSnapshot(playerRes: ExtendedPlayerResources, snapshot: PlayerResourcesSnapshot): void {
        playerRes.resources = snapshot.resources;
        playerRes.hotbar = snapshot.hotbar;
        playerRes.lastUpdated = snapshot.lastUpdated;
    }

    // ==============================================
    // MÉTODOS DE UTILIDAD PARA HOTBAR
    // ==============================================

    private createEmptyHotbar(): (HotbarItem | undefined)[] {
        const hotbar: (HotbarItem | undefined)[] = [];
        for (let i = 0; i < 9; i++) {
            hotbar[i] = undefined;
        }
        return hotbar;
    }

    private findEmptyHotbarSlot(hotbar: (HotbarItem | undefined)[]): number {
        for (let i = 0; i < hotbar.size(); i++) {
            if (hotbar[i] === undefined) {
                return i;
            }
        }
        return -1;
    }

    private useHotbarSlot(player: Player, slotIndex: number): void {
        const playerRes = this.playerResources.get(player);
        if (!playerRes || slotIndex < 0 || slotIndex >= 9) return;

        const item = playerRes.hotbar[slotIndex];
        if (item) {
            Events.onHotbarSlotUsed.fire(player, slotIndex, item);
            print(`🔧 ${player.Name} used ${item.displayName} from slot ${slotIndex + 1}`);
        }
    }

    // Métodos de ayuda para items
    private getItemType(itemId: string): "resource" | "tool" | "weapon" | "consumable" {
        const resourceTypes = ["wood", "rope", "cloth", "iron", "hardwood", "steel", "canvas", "gold"];
        const toolTypes = ["stone_pick", "stone_hatchet", "wood_axe"];
        const weaponTypes = ["sword", "cutlass", "pistol"];
        
        if (resourceTypes.includes(itemId)) return "resource";
        if (toolTypes.includes(itemId)) return "tool";
        if (weaponTypes.includes(itemId)) return "weapon";
        return "consumable";
    }

    private getItemDisplayName(itemId: string): string {
        const names: Record<string, string> = {
            wood: "Madera",
            rope: "Cuerda", 
            cloth: "Tela",
            iron: "Hierro",
            stone_pick: "Pico de Piedra",
            stone_hatchet: "Hacha de Piedra"
        };
        return names[itemId] || itemId;
    }

    private getItemIcon(itemId: string): string {
        const icons: Record<string, string> = {
            wood: "🪵",
            rope: "🪢",
            cloth: "🧵", 
            iron: "🔩",
            stone_pick: "🔨",
            stone_hatchet: "🪓"
        };
        return icons[itemId] || "❓";
    }

    // ==============================================
    // SINCRONIZACIÓN CON CLIENTE
    // ==============================================

    private syncPlayerData(player: Player): void {
        const playerRes = this.playerResources.get(player);
        if (!playerRes) return;

        // Sincronizar inventario
        Events.onResourceUpdated?.fire?.(player, playerRes.resources);
        
        // Sincronizar hotbar
        Events.onHotbarUpdated.fire(player, playerRes.hotbar);
        
        // Sincronizar stats (nivel, experiencia)
        const level = 1; // TODO: Implementar sistema de nivel
        const experience = 0;
        const nextLevelExp = 100;
        Events.onStatsUpdated.fire(player, level, experience, nextLevelExp);
    }

    // ==============================================
    // API PÚBLICA PARA OTROS SERVICIOS
    // ==============================================

    public getPlayerHotbar(player: Player): (HotbarItem | undefined)[] {
        const playerRes = this.playerResources.get(player);
        return playerRes ? playerRes.hotbar : this.createEmptyHotbar();
    }

    public setHotbarSlot(player: Player, slotIndex: number, item: HotbarItem | undefined): boolean {
        const playerRes = this.playerResources.get(player);
        if (!playerRes || slotIndex < 0 || slotIndex >= 9) return false;

        playerRes.hotbar[slotIndex] = item;
        playerRes.lastUpdated = tick();
        this.syncPlayerData(player);
        return true;
    }
} 
