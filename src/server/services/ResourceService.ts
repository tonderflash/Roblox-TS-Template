import { OnStart, Service } from "@flamework/core";
import { Players, RunService, Workspace, TweenService } from "@rbxts/services";
import { Events } from "server/network";
import { RESOURCES, CRAFTING_RECIPES, getResource, getCraftingRecipe } from "shared/configs/resources";
import { RESOURCE_TYPES, PlayerResources, ResourceStack } from "shared/types/resources";

@Service()
export class ResourceService implements OnStart {
    private playerResources = new Map<Player, PlayerResources>();
    private activeResourceNodes = new Set<Model>();
    private readonly SPAWN_RADIUS = 200; // Radio alrededor del spawn para recursos
    private readonly MAX_NODES_PER_TYPE = 8; // Máximo nodos por tipo de recurso

    onStart(): void {
        this.setupPlayerEvents();
        this.setupResourceEvents();
        this.spawnInitialResources();
        this.startResourceLoop();
        print("🌲 ResourceService iniciado correctamente!");
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

    private initializePlayerResources(player: Player): void {
        const playerRes: PlayerResources = {
            resources: new Map<string, number>(),
            lastUpdated: tick()
        };

        // Dar algunos recursos iniciales para testing
        playerRes.resources.set(RESOURCE_TYPES.WOOD, 50);
        playerRes.resources.set(RESOURCE_TYPES.ROPE, 25);
        playerRes.resources.set(RESOURCE_TYPES.CLOTH, 30);
        playerRes.resources.set(RESOURCE_TYPES.IRON, 10);

        this.playerResources.set(player, playerRes);
        print(`🎒 Recursos inicializados para ${player.Name}`);
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
            const node = this.createResourceNode(resourceType, emoji);
            if (node) {
                this.activeResourceNodes.add(node as Model);
            }
        }
    }

    private createResourceNode(resourceType: string, emoji: string): Model | undefined {
        const resource = getResource(resourceType);
        if (!resource) return undefined;

        // Crear modelo del nodo de recurso
        const model = new Instance("Model");
        model.Name = `${resource.displayName}_Node`;
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

        // Agregar texto flotante
        const gui = new Instance("BillboardGui");
        gui.Size = UDim2.fromScale(4, 2);
        gui.StudsOffset = new Vector3(0, 3, 0);
        gui.Parent = part;

        const label = new Instance("TextLabel");
        label.Size = UDim2.fromScale(1, 1);
        label.BackgroundTransparency = 1;
        label.Text = `${emoji} ${resource.displayName}`;
        label.TextColor3 = new Color3(1, 1, 1);
        label.TextScaled = true;
        label.Font = Enum.Font.SourceSansBold;
        label.Parent = gui;

        // Agregar valores para tracking
        const resourceTypeValue = new Instance("StringValue");
        resourceTypeValue.Name = "ResourceType";
        resourceTypeValue.Value = resourceType;
        resourceTypeValue.Parent = model;

        const amountValue = new Instance("IntValue");
        amountValue.Name = "Amount";
        amountValue.Value = this.getAmountForResource(resourceType);
        amountValue.Parent = model;

        const respawnTimeValue = new Instance("NumberValue");
        respawnTimeValue.Name = "RespawnTime";
        respawnTimeValue.Value = 0;
        respawnTimeValue.Parent = model;

        // Posicionar en área de spawn
        const spawnCenter = new Vector3(0, 20, 0);
        const randomOffset = new Vector3(
            (math.random() - 0.5) * this.SPAWN_RADIUS,
            0,
            (math.random() - 0.5) * this.SPAWN_RADIUS
        );
        part.Position = spawnCenter.add(randomOffset);

        // Configurar detección de click/touch
        this.setupResourceCollection(model, part);

        // Establecer PrimaryPart
        model.PrimaryPart = part;

        return model;
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

    private getAmountForResource(resourceType: string): number {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return math.random(5, 15);
            case RESOURCE_TYPES.IRON: return math.random(2, 8);
            case RESOURCE_TYPES.ROPE: return math.random(3, 10);
            case RESOURCE_TYPES.CLOTH: return math.random(4, 12);
            default: return math.random(1, 5);
        }
    }

    private setupResourceCollection(model: Model, part: Part): void {
        // Configurar ClickDetector para recolección
        const clickDetector = new Instance("ClickDetector");
        clickDetector.MaxActivationDistance = 10;
        clickDetector.Parent = part;

        clickDetector.MouseClick.Connect((player) => {
            this.collectResourceNode(player, model);
        });

        // Efecto visual cuando el jugador está cerca
        const proximityPrompt = new Instance("ProximityPrompt");
        proximityPrompt.ActionText = "Recolectar";
        proximityPrompt.KeyboardKeyCode = Enum.KeyCode.E;
        proximityPrompt.MaxActivationDistance = 8;
        proximityPrompt.HoldDuration = 1; // 1 segundo para recolectar
        proximityPrompt.Parent = part;

        proximityPrompt.Triggered.Connect((player) => {
            this.collectResourceNode(player, model);
        });
    }

    private collectResourceNode(player: Player, node: Model): void {
        const resourceTypeValue = node.FindFirstChild("ResourceType") as StringValue;
        const amountValue = node.FindFirstChild("Amount") as IntValue;
        
        if (!resourceTypeValue || !amountValue) return;

        const resourceType = resourceTypeValue.Value;
        const amount = amountValue.Value;

        // Dar recursos al jugador
        this.giveResourceToPlayer(player, resourceType, amount);

        // Efectos visuales de recolección
        this.playCollectionEffects(node);

        // Ocultar nodo y programar respawn
        this.hideAndRespawnNode(node);

        print(`⛏️ ${player.Name} recolectó ${amount}x ${resourceType}`);
    }

    private giveResourceToPlayer(player: Player, resourceType: string, amount: number): void {
        const playerRes = this.playerResources.get(player);
        if (!playerRes) return;

        const currentAmount = playerRes.resources.get(resourceType) || 0;
        playerRes.resources.set(resourceType, currentAmount + amount);
        playerRes.lastUpdated = tick();

        // TODO: Notificar al cliente sobre el cambio de recursos
        print(`📦 ${player.Name} ahora tiene ${currentAmount + amount}x ${resourceType}`);
    }

    private playCollectionEffects(node: Model): void {
        // Efecto de recolección simple
        const part = node.PrimaryPart;
        if (!part) return;

        // Tween de escala
        const tween = TweenService.Create(part, 
            new TweenInfo(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.In), 
            { Size: new Vector3(0.1, 0.1, 0.1), Transparency: 1 }
        );
        tween.Play();
    }

    private hideAndRespawnNode(node: Model): void {
        const respawnTimeValue = node.FindFirstChild("RespawnTime") as NumberValue;
        if (!respawnTimeValue) return;

        // Ocultar nodo
        const part = node.PrimaryPart;
        if (part) {
            part.Transparency = 1;
            part.CanCollide = false;
            
            // Ocultar GUI
            const gui = part.FindFirstChild("BillboardGui") as BillboardGui;
            if (gui) gui.Enabled = false;
            
            // Deshabilitar interacción
            const clickDetector = part.FindFirstChild("ClickDetector") as ClickDetector;
            if (clickDetector) clickDetector.MaxActivationDistance = 0;
            
            const proximityPrompt = part.FindFirstChild("ProximityPrompt") as ProximityPrompt;
            if (proximityPrompt) proximityPrompt.Enabled = false;
        }

        // Programar respawn en 60-120 segundos
        respawnTimeValue.Value = tick() + math.random(60, 120);
    }

    private startResourceLoop(): void {
        RunService.Heartbeat.Connect(() => {
            this.updateResourceNodes();
        });
    }

    private updateResourceNodes(): void {
        const currentTime = tick();
        
        for (const node of this.activeResourceNodes) {
            const respawnTimeValue = node.FindFirstChild("RespawnTime") as NumberValue;
            if (!respawnTimeValue) continue;

            // Verificar si debe respawnear
            if (respawnTimeValue.Value > 0 && currentTime >= respawnTimeValue.Value) {
                this.respawnResourceNode(node);
                respawnTimeValue.Value = 0;
            }
        }
    }

    private respawnResourceNode(node: Model): void {
        const part = node.PrimaryPart;
        if (!part) return;

        // Restaurar visibilidad y funcionalidad
        part.Transparency = 0;
        part.CanCollide = true;

        // Restaurar GUI
        const gui = part.FindFirstChild("BillboardGui") as BillboardGui;
        if (gui) gui.Enabled = true;

        // Restaurar interacción
        const clickDetector = part.FindFirstChild("ClickDetector") as ClickDetector;
        if (clickDetector) clickDetector.MaxActivationDistance = 10;

        const proximityPrompt = part.FindFirstChild("ProximityPrompt") as ProximityPrompt;
        if (proximityPrompt) proximityPrompt.Enabled = true;

        // Regenerar cantidad de recurso
        const amountValue = node.FindFirstChild("Amount") as IntValue;
        const resourceTypeValue = node.FindFirstChild("ResourceType") as StringValue;
        if (amountValue && resourceTypeValue) {
            amountValue.Value = this.getAmountForResource(resourceTypeValue.Value);
        }

        print(`🔄 Nodo de recurso respawneado: ${node.Name}`);
    }

    // Funciones públicas para otros servicios
    public getPlayerResources(player: Player): PlayerResources | undefined {
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
} 
