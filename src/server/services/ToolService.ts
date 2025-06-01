import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { ToolData, TOOL_TYPES, ToolType } from "shared/types/harvesting";
import { RESOURCE_TYPES } from "shared/types/resources";

@Service()
export class ToolService implements OnStart {
    private tools = new Map<ToolType, ToolData>();
    private playerEquippedTools = new Map<Player, ToolType>();

    onStart(): void {
        this.initializeTools();
        this.setupPlayerEvents();
        print("🔨 ToolService iniciado correctamente!");
    }

    private initializeTools(): void {
        // Bare Hands (default)
        const bareHands: ToolData = {
            id: TOOL_TYPES.BARE_HANDS,
            name: "bare_hands",
            displayName: "Manos Desnudas",
            damage: 25, // damage base bajo
            resourceMultipliers: new Map([
                [RESOURCE_TYPES.WOOD, 0.5],
                [RESOURCE_TYPES.ROPE, 0.8],
                [RESOURCE_TYPES.CLOTH, 0.7],
                [RESOURCE_TYPES.IRON, 0.3]
            ]),
            description: "Tus manos. No muy eficientes para recolectar."
        };

        // Stone Pick - mejor para minerales
        const stonePick: ToolData = {
            id: TOOL_TYPES.STONE_PICK,
            name: "stone_pick",
            displayName: "Pico de Piedra",
            damage: 50,
            resourceMultipliers: new Map([
                [RESOURCE_TYPES.WOOD, 0.8],
                [RESOURCE_TYPES.ROPE, 1.0],
                [RESOURCE_TYPES.CLOTH, 0.9],
                [RESOURCE_TYPES.IRON, 1.5]
            ]),
            description: "Excelente para minerales, regular para madera."
        };

        // Stone Hatchet - mejor para madera
        const stoneHatchet: ToolData = {
            id: TOOL_TYPES.STONE_HATCHET,
            name: "stone_hatchet",
            displayName: "Hacha de Piedra",
            damage: 50,
            resourceMultipliers: new Map([
                [RESOURCE_TYPES.WOOD, 1.5],
                [RESOURCE_TYPES.ROPE, 1.2],
                [RESOURCE_TYPES.CLOTH, 1.0],
                [RESOURCE_TYPES.IRON, 0.8]
            ]),
            description: "Perfecta para cortar madera y fibras."
        };

        // Metal Pick - versión mejorada del stone pick
        const metalPick: ToolData = {
            id: TOOL_TYPES.METAL_PICK,
            name: "metal_pick",
            displayName: "Pico de Metal",
            damage: 75,
            resourceMultipliers: new Map([
                [RESOURCE_TYPES.WOOD, 1.0],
                [RESOURCE_TYPES.ROPE, 1.3],
                [RESOURCE_TYPES.CLOTH, 1.2],
                [RESOURCE_TYPES.IRON, 2.0]
            ]),
            description: "Herramienta de metal superior para minerales."
        };

        // Metal Hatchet - versión mejorada del stone hatchet
        const metalHatchet: ToolData = {
            id: TOOL_TYPES.METAL_HATCHET,
            name: "metal_hatchet",
            displayName: "Hacha de Metal",
            damage: 75,
            resourceMultipliers: new Map([
                [RESOURCE_TYPES.WOOD, 2.0],
                [RESOURCE_TYPES.ROPE, 1.5],
                [RESOURCE_TYPES.CLOTH, 1.3],
                [RESOURCE_TYPES.IRON, 1.0]
            ]),
            description: "Herramienta de metal superior para madera."
        };

        // Registrar todas las herramientas
        this.tools.set(TOOL_TYPES.BARE_HANDS, bareHands);
        this.tools.set(TOOL_TYPES.STONE_PICK, stonePick);
        this.tools.set(TOOL_TYPES.STONE_HATCHET, stoneHatchet);
        this.tools.set(TOOL_TYPES.METAL_PICK, metalPick);
        this.tools.set(TOOL_TYPES.METAL_HATCHET, metalHatchet);

        print(`🔨 ${this.tools.size()} herramientas inicializadas`);
    }

    private setupPlayerEvents(): void {
        Players.PlayerAdded.Connect((player) => {
            // Por defecto, todos empiezan con manos desnudas
            this.playerEquippedTools.set(player, TOOL_TYPES.BARE_HANDS);
            print(`🖐️ ${player.Name} comenzó con manos desnudas`);
        });

        Players.PlayerRemoving.Connect((player) => {
            this.playerEquippedTools.delete(player);
        });
    }

    // Métodos públicos
    public getToolData(toolType: ToolType): ToolData | undefined {
        return this.tools.get(toolType);
    }

    public getPlayerTool(player: Player): ToolType {
        return this.playerEquippedTools.get(player) || TOOL_TYPES.BARE_HANDS;
    }

    public equipTool(player: Player, toolType: ToolType): boolean {
        const tool = this.tools.get(toolType);
        if (!tool) {
            print(`❌ Herramienta no encontrada: ${toolType}`);
            return false;
        }

        this.playerEquippedTools.set(player, toolType);
        print(`🔨 ${player.Name} equipó ${tool.displayName}`);
        return true;
    }

    public calculateDamage(player: Player, resourceType: string, baseDamage: number): number {
        const toolType = this.getPlayerTool(player);
        const tool = this.getToolData(toolType);
        
        if (!tool) {
            return baseDamage; // fallback
        }

        const multiplier = tool.resourceMultipliers.get(resourceType) || 1.0;
        const finalDamage = tool.damage * multiplier;

        return finalDamage;
    }

    public getResourceMultiplier(player: Player, resourceType: string): number {
        const toolType = this.getPlayerTool(player);
        const tool = this.getToolData(toolType);
        
        if (!tool) {
            return 1.0; // fallback
        }

        return tool.resourceMultipliers.get(resourceType) || 1.0;
    }

    public getAllTools(): Map<ToolType, ToolData> {
        return this.tools;
    }

    // Método para comandos de testing
    public giveToolToPlayer(player: Player, toolType: ToolType): void {
        this.equipTool(player, toolType);
    }

    public listPlayerTools(player: Player): void {
        const currentTool = this.getPlayerTool(player);
        const toolData = this.getToolData(currentTool);
        
        print(`🔨 ${player.Name} tiene equipado: ${toolData?.displayName || "Desconocido"}`);
        
        print("🛠️ Herramientas disponibles:");
        this.tools.forEach((tool, toolType) => {
            const equipped = toolType === currentTool ? " [EQUIPADO]" : "";
            print(`  - ${tool.displayName}${equipped}: ${tool.description}`);
        });
    }
} 
