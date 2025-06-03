import { InventoryTransaction, TransactionResult } from "shared/types/resources";
import { HotbarItem } from "shared/network";
import { 
    ExtendedPlayerResources,
    PlayerResourcesSnapshot,
    IInventoryTransactionManager,
    IPlayerResourcesManager,
    RESOURCE_CONFIG
} from "../types/ResourceServiceTypes";

export class InventoryTransactionManager implements IInventoryTransactionManager {
    private playerManager: IPlayerResourcesManager;

    constructor(playerManager: IPlayerResourcesManager) {
        this.playerManager = playerManager;
    }

    public handleInventoryTransaction(player: Player, transaction: InventoryTransaction): TransactionResult {
        const playerRes = this.playerManager.getPlayerResources(player);
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
                this.playerManager.syncPlayerData(player);
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

    public validateTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult {
        const { type: transactionType, sourceType, targetType, itemId, amount, sourceSlot, targetSlot } = transaction;

        // Validar slots
        if (sourceType === "HOTBAR" && (sourceSlot === undefined || sourceSlot < 0 || sourceSlot >= RESOURCE_CONFIG.HOTBAR_SIZE)) {
            return { success: false, error: "Invalid source hotbar slot" };
        }
        
        if (targetType === "HOTBAR" && (targetSlot === undefined || targetSlot < 0 || targetSlot >= RESOURCE_CONFIG.HOTBAR_SIZE)) {
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
                itemType: this.playerManager.getItemType(itemId),
                amount: amount,
                displayName: this.playerManager.getItemDisplayName(itemId),
                icon: this.playerManager.getItemIcon(itemId)
            };

            let actualSlot = targetSlot!;
            if (actualSlot === -1) {
                actualSlot = this.playerManager.findEmptyHotbarSlot(playerRes.hotbar);
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
                itemType: this.playerManager.getItemType(itemId),
                amount: amount,
                displayName: this.playerManager.getItemDisplayName(itemId),
                icon: this.playerManager.getItemIcon(itemId)
            };

            let actualSlot = targetSlot!;
            if (actualSlot === -1) {
                actualSlot = this.playerManager.findEmptyHotbarSlot(playerRes.hotbar);
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

    public createSnapshot(playerRes: ExtendedPlayerResources): PlayerResourcesSnapshot {
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

    public restoreSnapshot(playerRes: ExtendedPlayerResources, snapshot: PlayerResourcesSnapshot): void {
        playerRes.resources = snapshot.resources;
        playerRes.hotbar = snapshot.hotbar;
        playerRes.lastUpdated = snapshot.lastUpdated;
    }
} 
