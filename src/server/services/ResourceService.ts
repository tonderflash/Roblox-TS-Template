import { OnStart, Service } from "@flamework/core";
import { Events } from "server/network";
import { ResourceStack } from "shared/types/resources";
import { ResourceTarget } from "shared/types/harvesting";
import { HotbarItem } from "shared/network";

// Importar los managers especializados
import { PlayerResourcesManager } from "./resources/managers/PlayerResourcesManager";
import { ResourceNodeManager } from "./resources/managers/ResourceNodeManager";
import { InventoryTransactionManager } from "./resources/managers/InventoryTransactionManager";
import { HarvestingEngine } from "./resources/engines/HarvestingEngine";
import { ResourceUIManager } from "./resources/ui/ResourceUIManager";

// Importar tipos e interfaces
import { 
    ExtendedPlayerResources,
    ToolServiceInterface,
    CombatServiceInterface,
    InventoryServiceInterface,
    validateHotbarSlotIndex,
    validateItemId,
    validateSlotIndex,
    validateInventoryTransaction,
    safeValidate
} from "./resources/types/ResourceServiceTypes";

/**
 * ResourceService refactorizado - Actúa como coordinador principal
 * Mantiene la misma API pública para compatibilidad, pero delega
 * responsabilidades a módulos especializados.
 */
@Service()
export class ResourceService implements OnStart {
    // Managers especializados
    private playerManager: PlayerResourcesManager;
    private nodeManager: ResourceNodeManager;
    private uiManager: ResourceUIManager;
    private harvestingEngine: HarvestingEngine;
    private transactionManager: InventoryTransactionManager;

    // Servicios inyectados
    private toolService?: ToolServiceInterface;
    private combatService?: CombatServiceInterface;
    private inventoryService?: InventoryServiceInterface;

    constructor() {
        // Inicializar managers en el orden correcto
        this.uiManager = new ResourceUIManager();
        this.playerManager = new PlayerResourcesManager();
        this.nodeManager = new ResourceNodeManager(this.uiManager);
        this.harvestingEngine = new HarvestingEngine(
            this.nodeManager,
            this.uiManager,
            this.playerManager
        );
        this.transactionManager = new InventoryTransactionManager(this.playerManager);
    }

    onStart(): void {
        this.setupResourceEvents();
        this.setupInventorySync();
        this.nodeManager.spawnInitialResources();
        print("🌲 ResourceService refactorizado iniciado correctamente con arquitectura modular!");
    }

    // ==============================================
    // MÉTODOS PARA INYECCIÓN DE DEPENDENCIAS
    // ==============================================

    public setToolService(toolService: ToolServiceInterface): void {
        this.toolService = toolService;
        this.harvestingEngine.setToolService(toolService);
    }

    public setCombatService(combatService: CombatServiceInterface): void {
        this.combatService = combatService;
        this.harvestingEngine.setCombatService(combatService);
    }

    public setInventoryService(inventoryService: InventoryServiceInterface): void {
        this.inventoryService = inventoryService;
        this.playerManager.setInventoryService(inventoryService);
    }

    // ==============================================
    // CONFIGURACIÓN DE EVENTOS CON VALIDACIÓN SEGURA
    // ==============================================

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
        // ⚠️ VALIDACIÓN SEGURA: Event para drag & drop profesional
        Events.moveItemToHotbar.connect((player: Player, itemId: unknown, fromSlot: unknown, toSlot: unknown) => {
            // Validar todos los parámetros antes de procesar
            const validItemId = safeValidate(validateItemId, itemId, "moveItemToHotbar.itemId");
            const validFromSlot = safeValidate(validateSlotIndex, fromSlot, "moveItemToHotbar.fromSlot");
            const validToSlot = safeValidate(validateSlotIndex, toSlot, "moveItemToHotbar.toSlot");

            if (!validItemId || !validFromSlot || !validToSlot) {
                warn(`[ResourceService] moveItemToHotbar: Parámetros inválidos de ${player.Name}`);
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

        // ⚠️ VALIDACIÓN SEGURA: Event para uso de hotbar
        Events.useHotbarSlot.connect((player: Player, slotIndex: unknown) => {
            const validSlotIndex = safeValidate(validateHotbarSlotIndex, slotIndex, "useHotbarSlot.slotIndex");
            
            if (!validSlotIndex) {
                warn(`[ResourceService] useHotbarSlot: SlotIndex inválido de ${player.Name}`);
                return;
            }

            this.playerManager.useHotbarSlot(player, validSlotIndex);
        });

        // ⚠️ VALIDACIÓN SEGURA: Event para mover entre slots de hotbar
        Events.moveHotbarSlot.connect((player: Player, fromSlot: unknown, toSlot: unknown) => {
            const validFromSlot = safeValidate(validateHotbarSlotIndex, fromSlot, "moveHotbarSlot.fromSlot");
            const validToSlot = safeValidate(validateHotbarSlotIndex, toSlot, "moveHotbarSlot.toSlot");

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

    // ==============================================
    // API PÚBLICA PARA COMPATIBILIDAD
    // ==============================================

    public damageResourceNode(nodeId: string, damage: number, attacker: Player, toolType: string): boolean {
        return this.harvestingEngine.damageResourceNode(nodeId, damage, attacker, toolType);
    }

    public getAllResourceNodes(): Map<string, ResourceTarget> {
        return this.nodeManager.getAllResourceNodes();
    }

    public getPlayerResources(player: Player): ExtendedPlayerResources | undefined {
        return this.playerManager.getPlayerResources(player);
    }

    public hasResources(player: Player, requirements: ResourceStack[]): boolean {
        const playerRes = this.playerManager.getPlayerResources(player);
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

        const playerRes = this.playerManager.getPlayerResources(player);
        if (!playerRes) return false;

        // Consumir recursos
        for (const requirement of requirements) {
            const currentAmount = playerRes.resources.get(requirement.resourceId) || 0;
            playerRes.resources.set(requirement.resourceId, currentAmount - requirement.amount);
        }

        playerRes.lastUpdated = tick();
        this.playerManager.syncPlayerData(player);
        print(`💸 ${player.Name} consumió recursos para crafting`);
        return true;
    }

    public respawnAllResources(): void {
        this.nodeManager.respawnAllResources();
    }
    
    public forceRespawnResource(nodeId: string): boolean {
        return this.nodeManager.forceRespawnResource(nodeId);
    }

    public handleInventoryTransaction(player: Player, transaction: unknown): any {
        // ⚠️ VALIDACIÓN SEGURA: Validar transacción antes de procesar
        const validTransaction = safeValidate(validateInventoryTransaction, transaction, "handleInventoryTransaction");
        
        if (!validTransaction) {
            warn(`[ResourceService] handleInventoryTransaction: Transacción inválida de ${player.Name}`);
            return { success: false, error: "Invalid transaction data" };
        }

        return this.transactionManager.handleInventoryTransaction(player, validTransaction);
    }

    public getPlayerHotbar(player: Player): (HotbarItem | undefined)[] {
        return this.playerManager.getPlayerHotbar(player);
    }

    public setHotbarSlot(player: Player, slotIndex: number, item: HotbarItem | undefined): boolean {
        return this.playerManager.setHotbarSlot(player, slotIndex, item);
    }
} 
