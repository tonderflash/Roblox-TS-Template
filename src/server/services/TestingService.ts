import { Service, OnStart, Dependency } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import { Events } from "server/network";
import { ResourceService } from "./ResourceService";
import { TransactionResult } from "shared/types/resources";
import { 
    safeValidate, 
    validateExperienceAmount, 
    validatePlayerLevel 
} from "./resources/types/ResourceServiceTypes";

@Service({})
export class TestingService implements OnStart {
    private playerLevels = new Map<Player, number>();
    private playerExperience = new Map<Player, number>();
    
    // SIMPLIFICADO: Solo usar ResourceService como Single Source of Truth
    private resourceService = Dependency<ResourceService>();

    onStart(): void {
        this.setupTestingEvents();
        this.setupPlayerManagement();
        print("🧪 TestingService iniciado - Delegando inventario/hotbar a ResourceService");
        print("🔧 Para comandos usa CMDR: testDrag, diagDrag, debugHotbar, clearHotbar");
    }

    private setupTestingEvents(): void {
        // Eventos de experiencia y nivel (mantenidos en TestingService)
        Events.addExperience.connect((player, amount) => {
            const validAmount = safeValidate(
                validateExperienceAmount,
                amount,
                "addExperience.amount"
            );

            if (!validAmount) {
                warn(`[TestingService] addExperience: Amount inválido de ${player.Name}`);
                return;
            }

            this.addExperience(player, validAmount);
        });

        Events.setLevel.connect((player, level) => {
            const validLevel = safeValidate(
                validatePlayerLevel,
                level,
                "setLevel.level"
            );

            if (!validLevel) {
                warn(`[TestingService] setLevel: Level inválido de ${player.Name}`);
                return;
            }

            this.setPlayerLevel(player, validLevel);
        });

        // SIMPLIFICADO: Los eventos de hotbar ahora van directamente a ResourceService
        // El ResourceService ya maneja estos eventos:
        // - Events.useHotbarSlot
        // - Events.moveItemToHotbar  
        // - Events.moveHotbarSlot

        print("✅ TestingService configurado - Hotbar delegado a ResourceService");
    }

    private setupPlayerManagement(): void {
        // Cuando un jugador entra
        Players.PlayerAdded.Connect((player) => {
            this.initializePlayer(player);
        });

        // Limpiar cuando sale
        Players.PlayerRemoving.Connect((player) => {
            this.playerLevels.delete(player);
            this.playerExperience.delete(player);
        });

        // Para jugadores que ya están en el juego
        for (const player of Players.GetPlayers()) {
            this.initializePlayer(player);
        }
    }

    private initializePlayer(player: Player): void {
        // Solo inicializar stats de nivel/experiencia
        this.playerLevels.set(player, 1);
        this.playerExperience.set(player, 0);

        // Esperar un momento para que ResourceService inicialice el inventario/hotbar
        wait(1.5);

        // Enviar estado inicial de stats únicamente
        Events.onStatsUpdated.fire(player, 1, 0, 100);

        print(`✅ Player ${player.Name} initialized - Level/XP in TestingService, Inventory/Hotbar in ResourceService`);
    }

    private addExperience(player: Player, amount: number): void {
        const currentExp = this.playerExperience.get(player) || 0;
        const currentLevel = this.playerLevels.get(player) || 1;
        const newExp = currentExp + amount;

        // XP necesaria para siguiente nivel (formula simple)
        const expForNextLevel = currentLevel * 100;

        this.playerExperience.set(player, newExp);
        Events.onExperienceGained.fire(player, amount, newExp);

        // Verificar si sube de nivel
        if (newExp >= expForNextLevel) {
            this.setPlayerLevel(player, currentLevel + 1);
            this.playerExperience.set(player, newExp - expForNextLevel); // Excess XP
        } else {
            Events.onStatsUpdated.fire(player, currentLevel, newExp, expForNextLevel);
        }
    }

    private setPlayerLevel(player: Player, level: number): void {
        const oldLevel = this.playerLevels.get(player) || 1;
        this.playerLevels.set(player, level);
        
        const currentExp = this.playerExperience.get(player) || 0;
        const nextLevelExp = level * 100;

        if (level > oldLevel) {
            Events.onLevelUp.fire(player, level, currentExp);
            print(`🎉 ${player.Name} leveled up to ${level}!`);
        }

        Events.onStatsUpdated.fire(player, level, currentExp, nextLevelExp);
    }

    // ==============================================
    // API PÚBLICA PARA DEBUGGING/TESTING
    // ==============================================

    public getPlayerLevel(player: Player): number {
        return this.playerLevels.get(player) || 1;
    }

    public getPlayerExperience(player: Player): number {
        return this.playerExperience.get(player) || 0;
    }

    // SIMPLIFICADO: Métodos de hotbar delegados a ResourceService
    public getPlayerHotbar(player: Player) {
        return this.resourceService.getPlayerHotbar(player);
    }

    public debugPlayerData(player: Player): void {
        const level = this.getPlayerLevel(player);
        const experience = this.getPlayerExperience(player);
        const hotbar = this.getPlayerHotbar(player);
        const resources = this.resourceService.getPlayerResources(player);

        print(`🔍 DEBUG DATA for ${player.Name}:`);
        print(`  📊 Level: ${level}, Experience: ${experience}`);
        print(`  🎒 Resources:`, resources?.resources);
        print(`  🔧 Hotbar:`, hotbar);
    }

    // Método de utilidad para comandos CMDR
    public testDragAndDrop(player: Player, itemId: string, toSlot: number): boolean {
        print(`🧪 TESTING: Simulating drag ${itemId} to slot ${toSlot} for ${player.Name}`);
        
        // Usar la API profesional de ResourceService
        const result: TransactionResult = this.resourceService.handleInventoryTransaction(player, {
            type: "MOVE",
            sourceType: "INVENTORY",
            targetType: "HOTBAR", 
            itemId: itemId,
            amount: 1,
            sourceSlot: -1, // No importa para inventory
            targetSlot: toSlot
        });

        if (result.success) {
            print(`✅ Test successful: ${itemId} moved to hotbar slot ${toSlot + 1}`);
            return true;
        } else {
            print(`❌ Test failed: ${result.error}`);
            return false;
        }
    }

    public clearHotbar(player: Player): void {
        print(`🧹 Clearing hotbar for ${player.Name}`);
        
        for (let i = 0; i < 9; i++) {
            this.resourceService.setHotbarSlot(player, i, undefined);
        }
        
        print(`✅ Hotbar cleared for ${player.Name}`);
    }

    public diagnosticReport(player: Player): void {
        print(`📋 DIAGNOSTIC REPORT for ${player.Name}`);
        print(`====================================`);
        
        this.debugPlayerData(player);
        
        const hotbar = this.getPlayerHotbar(player);
        let occupiedSlots = 0;
        for (const item of hotbar) {
            if (item !== undefined) occupiedSlots++;
        }
        
        print(`📊 Hotbar Status: ${occupiedSlots}/9 slots occupied`);
        print(`📊 System: Using ResourceService as Single Source of Truth`);
        print(`====================================`);
    }
} 
