import { OnStart, Service, Dependency } from "@flamework/core";
import { Players } from "@rbxts/services";
import { Events } from "server/network";
import { ResourceService } from "./ResourceService";
import { getCraftingRecipe, CRAFTING_RECIPES, getResource } from "shared/configs/resources";
import { CraftingRecipe, ResourceStack } from "shared/types/resources";
import { 
    safeValidate, 
    validateRecipeId, 
    validateResourceType, 
    validateResourceAmount 
} from "./resources/types/ResourceServiceTypes";

export interface PlayerInventory {
    resources: Map<string, number>;
    unlockedRecipes: Set<string>;
    lastUpdated: number;
}

@Service()
export class InventoryService implements OnStart {
    private playerInventories = new Map<Player, PlayerInventory>();
    private resourceService?: ResourceService;
    
    onStart(): void {
        // Obtener ResourceService usando el patrón del proyecto
        this.resourceService = Dependency<ResourceService>();
        
        this.setupPlayerEvents();
        this.setupInventoryEvents();
        print("📦 InventoryService iniciado - Ready for crafting!");
    }

    private setupPlayerEvents(): void {
        Players.PlayerAdded.Connect((player) => {
            this.initializePlayerInventory(player);
        });

        Players.PlayerRemoving.Connect((player) => {
            this.cleanupPlayerInventory(player);
        });
    }

    private setupInventoryEvents(): void {
        // GUI Events
        Events.openInventory.connect((player) => {
            this.openInventory(player);
        });

        Events.closeInventory.connect((player) => {
            this.closeInventory(player);
        });

        // Crafting Events
        Events.craftItem.connect((player, recipeId) => {
            const validRecipeId = safeValidate(
                validateRecipeId,
                recipeId,
                "craftItem.recipeId"
            );

            if (!validRecipeId) {
                warn(`[InventoryService] craftItem: RecipeId inválido de ${player.Name}`);
                return;
            }

            this.craftItem(player, validRecipeId);
        });

        // Testing Events
        Events.giveResource.connect((player, resourceType, amount) => {
            const validResourceType = safeValidate(
                validateResourceType,
                resourceType,
                "giveResource.resourceType"
            );

            if (!validResourceType) {
                warn(`[InventoryService] giveResource: ResourceType inválido de ${player.Name}`);
                return;
            }

            const validAmount = safeValidate(
                validateResourceAmount,
                amount,
                "giveResource.amount"
            );

            if (!validAmount) {
                warn(`[InventoryService] giveResource: Amount inválido de ${player.Name}`);
                return;
            }

            this.giveResource(player, validResourceType, validAmount);
        });

        Events.unlockRecipe.connect((player, recipeId) => {
            const validRecipeId = safeValidate(
                validateRecipeId,
                recipeId,
                "unlockRecipe.recipeId"
            );

            if (!validRecipeId) {
                warn(`[InventoryService] unlockRecipe: RecipeId inválido de ${player.Name}`);
                return;
            }

            this.unlockRecipe(player, validRecipeId);
        });

        Events.resetInventory.connect((player) => {
            this.resetInventory(player);
        });
    }

    private initializePlayerInventory(player: Player): void {
        const inventory: PlayerInventory = {
            resources: new Map<string, number>([
                ["wood", 0],
                ["rope", 0], 
                ["cloth", 0],
                ["iron", 0]
            ]),
            unlockedRecipes: new Set<string>([
                "stone_pick",      // Básicos desbloqueados por defecto
                "stone_hatchet",
                "simple_boat"
            ]),
            lastUpdated: tick()
        };

        this.playerInventories.set(player, inventory);
        
        // Sincronizar con ResourceService
        this.syncWithResourceService(player);
        
        print(`📦 Inventario inicializado para ${player.Name}`);
    }

    private cleanupPlayerInventory(player: Player): void {
        this.playerInventories.delete(player);
        print(`🗑️ Inventario limpiado para ${player.Name}`);
    }

    private syncWithResourceService(player: Player): void {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return;

        // Obtener recursos actuales del ResourceService
        const playerResources = this.resourceService?.getPlayerResources(player);
        if (playerResources) {
            for (const [resourceId, amount] of playerResources.resources) {
                inventory.resources.set(resourceId, amount);
            }
        }
    }

    private openInventory(player: Player): void {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return;

        // Sincronizar recursos antes de abrir
        this.syncWithResourceService(player);

        // Enviar datos actualizados al cliente
        this.sendInventoryUpdate(player);
        
        Events.onInventoryOpened.fire(player);
        print(`📖 ${player.Name} abrió el inventario`);
    }

    private closeInventory(player: Player): void {
        Events.onInventoryClosed.fire(player);
        print(`📕 ${player.Name} cerró el inventario`);
    }

    private craftItem(player: Player, recipeId: string): void {
        const inventory = this.playerInventories.get(player);
        if (!inventory) {
            print(`❌ ${player.Name} no tiene inventario inicializado`);
            Events.onCraftingCompleted.fire(player, recipeId, false);
            return;
        }

        // Verificar que la receta esté desbloqueada
        if (!inventory.unlockedRecipes.has(recipeId)) {
            print(`🔒 ${player.Name} no tiene desbloqueada la receta: ${recipeId}`);
            Events.onCraftingCompleted.fire(player, recipeId, false);
            return;
        }

        // Obtener la receta
        const recipe = getCraftingRecipe(recipeId);
        if (!recipe) {
            print(`❌ Receta no encontrada: ${recipeId}`);
            Events.onCraftingCompleted.fire(player, recipeId, false);
            return;
        }

        // Verificar recursos necesarios
        if (!this.hasRequiredResources(player, recipe.requirements)) {
            print(`💸 ${player.Name} no tiene suficientes recursos para ${recipeId}`);
            Events.onCraftingCompleted.fire(player, recipeId, false);
            return;
        }

        // Consumir recursos
        if (!this.consumeResources(player, recipe.requirements)) {
            print(`❌ Error consumiendo recursos para ${recipeId}`);
            Events.onCraftingCompleted.fire(player, recipeId, false);
            return;
        }

        // Dar el item crafteado
        this.giveRecipeResult(player, recipe);

        // Actualizar timestamp
        inventory.lastUpdated = tick();

        // Notificar éxito
        Events.onCraftingCompleted.fire(player, recipeId, true);
        this.sendInventoryUpdate(player);

        print(`🔨 ${player.Name} crafteó exitosamente: ${recipe.name}`);
    }

    private hasRequiredResources(player: Player, requirements: ResourceStack[]): boolean {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return false;

        for (const requirement of requirements) {
            const currentAmount = inventory.resources.get(requirement.resourceId) || 0;
            if (currentAmount < requirement.amount) {
                return false;
            }
        }
        return true;
    }

    private consumeResources(player: Player, requirements: ResourceStack[]): boolean {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return false;

        // Verificar nuevamente antes de consumir
        if (!this.hasRequiredResources(player, requirements)) {
            return false;
        }

        // Consumir recursos del inventario local
        for (const requirement of requirements) {
            const currentAmount = inventory.resources.get(requirement.resourceId) || 0;
            inventory.resources.set(requirement.resourceId, currentAmount - requirement.amount);
        }

        // Sincronizar con ResourceService usando su método existente
        const success = this.resourceService?.consumeResources(player, requirements);
        
        if (!success) {
            // Revertir cambios locales si falló en ResourceService
            for (const requirement of requirements) {
                const currentAmount = inventory.resources.get(requirement.resourceId) || 0;
                inventory.resources.set(requirement.resourceId, currentAmount + requirement.amount);
            }
            return false;
        }

        return true;
    }

    private giveRecipeResult(player: Player, recipe: CraftingRecipe): void {
        // Manejar diferentes tipos de resultados según el plan
        if (recipe.resultType === "boat") {
            // TODO: Integrar con BoatService para dar barco al jugador
            print(`⛵ ${player.Name} recibió barco: ${recipe.resultId}`);
        } else if (recipe.resultType === "item") {
            // Para herramientas y otros items
            // TODO: Integrar con ToolService cuando sea necesario
            print(`🔧 ${player.Name} recibió item: ${recipe.resultId}`);
        } else if (recipe.resultType === "upgrade") {
            // Para upgrades de barcos
            print(`⚡ ${player.Name} recibió upgrade: ${recipe.resultId}`);
        } else {
            print(`📦 ${player.Name} recibió: ${recipe.resultId}`);
        }
    }

    private giveResource(player: Player, resourceType: string, amount: number): void {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return;

        // NUEVO: Obtener información del recurso para validar stackSize
        const resourceInfo = getResource(resourceType);
        const maxStack = resourceInfo ? math.min(resourceInfo.stackSize, 100) : 100; // Límite máximo de 100

        // Actualizar inventario local con validación de stack
        const currentAmount = inventory.resources.get(resourceType) || 0;
        const newAmount = math.min(currentAmount + amount, maxStack);
        const actualAdded = newAmount - currentAmount;
        
        inventory.resources.set(resourceType, newAmount);
        inventory.lastUpdated = tick();

        // Sincronizar con ResourceService - usar método que funcione con el ResourceService actual
        const playerResources = this.resourceService?.getPlayerResources(player);
        if (playerResources) {
            const currentResourceAmount = playerResources.resources.get(resourceType) || 0;
            const newResourceAmount = math.min(currentResourceAmount + actualAdded, maxStack);
            playerResources.resources.set(resourceType, newResourceAmount);
            playerResources.lastUpdated = tick();
        }

        // Notificar al cliente
        Events.onResourceAdded.fire(player, resourceType, actualAdded);
        this.sendInventoryUpdate(player);

        // MEJORADO: Mensaje más informativo
        if (actualAdded < amount) {
            print(`📦 Dado a ${player.Name}: ${actualAdded}x ${resourceType} (Total: ${newAmount}) - ${amount - actualAdded} perdido por límite de stack`);
        } else {
            print(`📦 Dado a ${player.Name}: ${actualAdded}x ${resourceType} (Total: ${newAmount})`);
        }
    }

    private unlockRecipe(player: Player, recipeId: string): void {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return;

        // Verificar que la receta existe
        const recipe = getCraftingRecipe(recipeId);
        if (!recipe) {
            print(`❌ Receta no existe: ${recipeId}`);
            return;
        }

        inventory.unlockedRecipes.add(recipeId);
        inventory.lastUpdated = tick();

        Events.onRecipeUnlocked.fire(player, recipeId);
        this.sendInventoryUpdate(player);

        print(`🔓 ${player.Name} desbloqueó receta: ${recipe.name}`);
    }

    private resetInventory(player: Player): void {
        // Reinicializar inventario completamente
        this.initializePlayerInventory(player);
        
        // Reset en ResourceService también - usar método indirecto
        const playerResources = this.resourceService?.getPlayerResources(player);
        if (playerResources) {
            playerResources.resources.clear();
            playerResources.resources.set("wood", 0);
            playerResources.resources.set("rope", 0);
            playerResources.resources.set("cloth", 0);
            playerResources.resources.set("iron", 0);
            playerResources.lastUpdated = tick();
        }

        this.sendInventoryUpdate(player);
        print(`🔄 Inventario de ${player.Name} ha sido reseteado`);
    }

    private sendInventoryUpdate(player: Player): void {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return;

        // Convertir Map a objeto para serialización
        const resourcesObject: Record<string, number> = {};
        for (const [resourceId, amount] of inventory.resources) {
            resourcesObject[resourceId] = amount;
        }

        const inventoryData = {
            resources: resourcesObject,
            unlockedRecipes: [...inventory.unlockedRecipes],
            lastUpdated: inventory.lastUpdated
        };

        Events.onInventoryUpdated.fire(player, inventoryData);
    }

    // Métodos públicos para otros servicios
    public getPlayerInventory(player: Player): PlayerInventory | undefined {
        return this.playerInventories.get(player);
    }

    public hasResource(player: Player, resourceType: string, amount: number): boolean {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return false;

        const currentAmount = inventory.resources.get(resourceType) || 0;
        return currentAmount >= amount;
    }

    public addResource(player: Player, resourceType: string, amount: number): void {
        this.giveResource(player, resourceType, amount);
    }

    public isRecipeUnlocked(player: Player, recipeId: string): boolean {
        const inventory = this.playerInventories.get(player);
        if (!inventory) return false;

        return inventory.unlockedRecipes.has(recipeId);
    }

    // Método público para comandos de admin
    public unlockRecipeAdmin(player: Player, recipeId: string): void {
        this.unlockRecipe(player, recipeId);
    }
} 
