import { Players } from "@rbxts/services";
import { Events } from "server/network";
import { RESOURCE_TYPES } from "shared/types/resources";
import { getResource } from "shared/configs/resources";
import { HotbarItem } from "shared/network";
import { 
    ExtendedPlayerResources, 
    IPlayerResourcesManager,
    InventoryServiceInterface,
    RESOURCE_CONFIG
} from "../types/ResourceServiceTypes";

export class PlayerResourcesManager implements IPlayerResourcesManager {
    private playerResources = new Map<Player, ExtendedPlayerResources>();
    private inventoryService?: InventoryServiceInterface;

    constructor() {
        this.setupPlayerEvents();
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

    public initializePlayerResources(player: Player): void {
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

        // Notificar estados iniciales al cliente
        wait(1); // Esperar que el cliente esté listo
        this.syncPlayerData(player);
        
        print(`🎒 Recursos y hotbar inicializados para ${player.Name}`);
    }

    public cleanupPlayerResources(player: Player): void {
        this.playerResources.delete(player);
    }

    public getPlayerResources(player: Player): ExtendedPlayerResources | undefined {
        return this.playerResources.get(player);
    }

    public syncPlayerData(player: Player): void {
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

    public giveResourceToPlayer(player: Player, resourceType: string, amount: number): void {
        // Usar InventoryService si está disponible, sino usar sistema local como fallback
        if (this.inventoryService) {
            this.inventoryService.addResource(player, resourceType, amount);
        } else {
            // Fallback al sistema local con validación de stacking
            const playerRes = this.playerResources.get(player);
            if (!playerRes) return;

            // Obtener información del recurso para validar stackSize
            const resourceInfo = getResource(resourceType);
            const maxStack = resourceInfo ? math.min(resourceInfo.stackSize, 100) : 100; // Límite máximo de 100

            const currentAmount = playerRes.resources.get(resourceType) || 0;
            const newAmount = math.min(currentAmount + amount, maxStack);
            const actualAdded = newAmount - currentAmount;
            
            playerRes.resources.set(resourceType, newAmount);
            playerRes.lastUpdated = tick();
            
            // Mensaje más informativo con validación de stack
            if (actualAdded < amount) {
                print(`📦 [Fallback] ${player.Name} obtuvo ${actualAdded}x ${resourceType} (Total: ${newAmount}) - ${amount - actualAdded} perdido por límite de stack`);
            } else {
                print(`📦 [Fallback] ${player.Name} obtuvo ${actualAdded}x ${resourceType} (Total: ${newAmount})`);
            }
        }
    }

    // Métodos de utilidad para hotbar
    private createEmptyHotbar(): (HotbarItem | undefined)[] {
        const hotbar: (HotbarItem | undefined)[] = [];
        for (let i = 0; i < RESOURCE_CONFIG.HOTBAR_SIZE; i++) {
            hotbar[i] = undefined;
        }
        return hotbar;
    }

    public findEmptyHotbarSlot(hotbar: (HotbarItem | undefined)[]): number {
        for (let i = 0; i < hotbar.size(); i++) {
            if (hotbar[i] === undefined) {
                return i;
            }
        }
        return -1;
    }

    public getPlayerHotbar(player: Player): (HotbarItem | undefined)[] {
        const playerRes = this.playerResources.get(player);
        return playerRes ? playerRes.hotbar : this.createEmptyHotbar();
    }

    public setHotbarSlot(player: Player, slotIndex: number, item: HotbarItem | undefined): boolean {
        const playerRes = this.playerResources.get(player);
        if (!playerRes || slotIndex < 0 || slotIndex >= RESOURCE_CONFIG.HOTBAR_SIZE) return false;

        playerRes.hotbar[slotIndex] = item;
        playerRes.lastUpdated = tick();
        this.syncPlayerData(player);
        return true;
    }

    public useHotbarSlot(player: Player, slotIndex: number): void {
        const playerRes = this.playerResources.get(player);
        if (!playerRes || slotIndex < 0 || slotIndex >= RESOURCE_CONFIG.HOTBAR_SIZE) return;

        const item = playerRes.hotbar[slotIndex];
        if (item) {
            Events.onHotbarSlotUsed.fire(player, slotIndex, item);
            print(`🔧 ${player.Name} usó ${item.displayName} desde slot ${slotIndex + 1}`);
        }
    }

    // Métodos de ayuda para items
    public getItemType(itemId: string): "resource" | "tool" | "weapon" | "consumable" {
        const resourceTypes = ["wood", "rope", "cloth", "iron", "hardwood", "steel", "canvas", "gold"];
        const toolTypes = ["stone_pick", "stone_hatchet", "wood_axe"];
        const weaponTypes = ["sword", "cutlass", "pistol"];
        
        if (resourceTypes.includes(itemId)) return "resource";
        if (toolTypes.includes(itemId)) return "tool";
        if (weaponTypes.includes(itemId)) return "weapon";
        return "consumable";
    }

    public getItemDisplayName(itemId: string): string {
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

    public getItemIcon(itemId: string): string {
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
} 
