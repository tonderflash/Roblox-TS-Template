import { OnStart, Service, Dependency } from "@flamework/core";
import { Players, RunService, Workspace, TweenService } from "@rbxts/services";
import { Events } from "server/network";
import { PlayerBoat, BoatCombatData, BoatStats } from "shared/types/boat";
import { getBoatTemplate, calculateBoatStats, getBoatUpgrade, getBoatCustomization } from "shared/configs/boats";
import { IslandService } from "./IslandService";

// Importar servicios del nuevo sistema
import { BoatDataService } from "./boat/core/BoatDataService";
import { BoatSpawnService } from "./boat/core/BoatSpawnService";
import { BoatController } from "./boat/controllers/BoatController";

// Importar tipos del nuevo sistema
// import { BoatData, BoatModel } from "./boat/types/BoatTypes";

interface BoatModel extends Model {
    HumanoidRootPart: Part;
    BodyVelocity: BodyVelocity;
    BodyAngularVelocity: BodyAngularVelocity;
}

/**
 * BoatService refactorizado que actúa como adaptador del nuevo sistema modular
 * Mantiene compatibilidad con la API existente mientras usa la nueva arquitectura
 */
@Service()
export class BoatService implements OnStart {
    // Referencias al nuevo sistema
    private boatController!: BoatController;
    private boatDataService!: BoatDataService;
    private boatSpawnService!: BoatSpawnService;
    
    // Maps para compatibilidad temporal (deprecated)
    private playerBoats = new Map<Player, PlayerBoat>();
    private boatModels = new Map<Player, any>();
    private boatCombatData = new Map<Player, BoatCombatData>();
    private activeTweens = new Map<Player, Tween>();

    onStart(): void {
        this.initializeNewSystem();
        this.setupLegacyCompatibility();
        this.setupBoatEvents();
        this.startBoatLoop();
        print("🚢 BoatService refactorizado iniciado - Usando sistema modular");
    }
    
    /**
     * Inicializa el nuevo sistema modular
     */
    private initializeNewSystem(): void {
        this.boatController = Dependency<BoatController>();
        this.boatDataService = Dependency<BoatDataService>();
        this.boatSpawnService = Dependency<BoatSpawnService>();
        
        print("🔄 Nuevo sistema de barcos inicializado en BoatService");
    }
    
    /**
     * Configura compatibilidad con el sistema legacy
     */
    private setupLegacyCompatibility(): void {
        // Sincronizar datos del nuevo sistema con maps legacy
        this.syncLegacyData();
        
        print("🔄 Compatibilidad legacy configurada");
    }
    
    /**
     * Sincroniza datos entre el nuevo sistema y legacy maps
     */
    private syncLegacyData(): void {
        // Convertir datos del nuevo sistema al formato legacy
        const activePlayers = this.boatDataService.getActivePlayers();
        
        for (const player of activePlayers) {
            const newBoatData = this.boatDataService.getBoatData(player);
            if (newBoatData) {
                // Convertir BoatData a PlayerBoat legacy
                const legacyBoat: PlayerBoat = {
                    templateId: newBoatData.templateId,
                    currentStats: newBoatData.currentStats,
                    upgrades: newBoatData.upgrades,
                    customizations: newBoatData.customizations,
                    health: newBoatData.health,
                    isSpawned: newBoatData.isSpawned,
                    position: newBoatData.position,
                    rotation: newBoatData.rotation,
                    lastUsed: newBoatData.lastUsed
                };
                
                this.playerBoats.set(player, legacyBoat);
                
                // Crear combat data por defecto
                const combatData: BoatCombatData = {
                    isInCombat: false,
                    lastFiredTime: 0,
                    cannonCooldown: 2.0
                };
                this.boatCombatData.set(player, combatData);
            }
        }
    }
    
    private setupBoatEvents(): void {
        // Los eventos ahora son manejados por BoatController
        // Mantenemos estos para compatibilidad temporal
        Events.spawnBoat.connect((player) => {
            this.spawnBoat(player);
        });

        Events.despawnBoat.connect((player) => {
            this.despawnBoat(player);
        });

        Events.upgradeBoat.connect((player, upgradeId) => {
            this.upgradeBoat(player, upgradeId);
        });

        Events.customizeBoat.connect((player, customizationId) => {
            this.customizeBoat(player, customizationId);
        });

        Events.fireCannonAt.connect((player, targetPosition) => {
            this.fireCannonAt(player, targetPosition);
        });

        Events.repairBoat.connect((player) => {
            this.repairBoat(player);
        });

        // Navegación manejada por el nuevo sistema
        Events.startBoatNavigation.connect((player, direction) => {
            this.startNavigation(player, direction);
        });

        Events.stopBoatNavigation.connect((player) => {
            this.stopNavigation(player);
        });
    }
    
    // === LEGACY API METHODS (Adaptadores al nuevo sistema) ===
    
    /**
     * Spawnea un barco usando el nuevo sistema
     */
    public spawnBoat(player: Player): boolean {
        try {
            // Usar el nuevo sistema de spawn
            this.boatController.forceSpawnBoat(player);
            
            // Sincronizar datos legacy
            this.updateLegacyDataForPlayer(player);
            
            return true;
        } catch (error) {
            warn(`❌ Error en spawnBoat legacy para ${player.Name}: ${error}`);
            return false;
        }
    }
    
    /**
     * Despawnea un barco usando el nuevo sistema
     */
    public despawnBoat(player: Player): boolean {
        try {
            // Usar el nuevo sistema de despawn
            this.boatController.forceDespawnBoat(player);
            
            // Limpiar datos legacy
            this.boatModels.delete(player);
            const legacyBoat = this.playerBoats.get(player);
            if (legacyBoat) {
                legacyBoat.isSpawned = false;
            }
            
            return true;
        } catch (error) {
            warn(`❌ Error en despawnBoat legacy para ${player.Name}: ${error}`);
            return false;
        }
    }
    
    /**
     * Actualiza datos legacy para un jugador específico
     */
    private updateLegacyDataForPlayer(player: Player): void {
        const newBoatData = this.boatDataService.getBoatData(player);
        const boatModel = this.boatSpawnService.getBoatModel(player);
        
        if (newBoatData) {
            // Actualizar legacy boat data
            const legacyBoat: PlayerBoat = {
                templateId: newBoatData.templateId,
                currentStats: newBoatData.currentStats,
                upgrades: newBoatData.upgrades,
                customizations: newBoatData.customizations,
                health: newBoatData.health,
                isSpawned: newBoatData.isSpawned,
                position: newBoatData.position,
                rotation: newBoatData.rotation,
                lastUsed: newBoatData.lastUsed
            };
            
            this.playerBoats.set(player, legacyBoat);
        }
        
        if (boatModel) {
            this.boatModels.set(player, boatModel);
        }
    }
    
    /**
     * Aplica upgrade usando el nuevo sistema
     */
    public upgradeBoat(player: Player, upgradeId: string): boolean {
        try {
            // TODO: Usar BoatUpgradeService cuando esté implementado
            // Por ahora usar el sistema de datos
            const success = this.boatDataService.addUpgrade(player, upgradeId);
            
            if (success) {
                this.updateLegacyDataForPlayer(player);
                print(`🔧 ${player.Name} aplicó upgrade legacy: ${upgradeId}`);
            }
            
            return success;
        } catch (error) {
            warn(`❌ Error en upgradeBoat legacy: ${error}`);
            return false;
        }
    }
    
    /**
     * Aplica customización usando el nuevo sistema
     */
    public customizeBoat(player: Player, customizationId: string): boolean {
        try {
            // TODO: Usar BoatCustomizationService cuando esté implementado
            // Por ahora usar el sistema de datos
            const success = this.boatDataService.addCustomization(player, customizationId);
            
            if (success) {
                this.updateLegacyDataForPlayer(player);
                print(`🎨 ${player.Name} aplicó customización legacy: ${customizationId}`);
            }
            
            return success;
        } catch (error) {
            warn(`❌ Error en customizeBoat legacy: ${error}`);
            return false;
        }
    }
    
    /**
     * Dispara cañón usando el nuevo sistema
     */
    public fireCannonAt(player: Player, targetPosition: Vector3): boolean {
        try {
            // TODO: Usar BoatCombatService cuando esté implementado
            // Por ahora simular disparo
            const combatData = this.boatCombatData.get(player);
            if (!combatData) return false;
            
            const currentTime = tick();
            if (currentTime - combatData.lastFiredTime < combatData.cannonCooldown) {
                return false;
            }
            
            combatData.lastFiredTime = currentTime;
            combatData.isInCombat = true;
            
            print(`💥 ${player.Name} disparó cañón legacy hacia ${targetPosition}`);
            return true;
            
        } catch (error) {
            warn(`❌ Error en fireCannonAt legacy: ${error}`);
            return false;
        }
    }
    
    /**
     * Repara barco usando el nuevo sistema
     */
    public repairBoat(player: Player): boolean {
        try {
            const success = this.boatDataService.repairBoat(player);
            
            if (success) {
                this.updateLegacyDataForPlayer(player);
                print(`🔧 ${player.Name} reparó su barco legacy`);
            }
            
            return success;
        } catch (error) {
            warn(`❌ Error en repairBoat legacy: ${error}`);
            return false;
        }
    }
    
    /**
     * Inicia navegación usando el nuevo sistema
     */
    public startNavigation(player: Player, direction: Vector3): boolean {
        try {
            // TODO: Usar BoatNavigationService cuando esté implementado
            // Por ahora simular navegación
            print(`🧭 ${player.Name} iniciando navegación legacy hacia ${direction}`);
            return true;
        } catch (error) {
            warn(`❌ Error en startNavigation legacy: ${error}`);
            return false;
        }
    }
    
    /**
     * Detiene navegación usando el nuevo sistema
     */
    public stopNavigation(player: Player): boolean {
        try {
            // TODO: Usar BoatNavigationService cuando esté implementado
            print(`⚓ ${player.Name} deteniendo navegación legacy`);
            return true;
        } catch (error) {
            warn(`❌ Error en stopNavigation legacy: ${error}`);
            return false;
        }
    }
    
    /**
     * Teleporta a dock más cercano usando el nuevo sistema
     */
    public teleportToNearestDock(player: Player): boolean {
        try {
            // TODO: Implementar usando BoatSpawnService
            print(`⚓ ${player.Name} teleportando a dock usando sistema legacy`);
            return true;
        } catch (error) {
            warn(`❌ Error en teleportToNearestDock legacy: ${error}`);
            return false;
        }
    }
    
    // === LEGACY COMPATIBILITY GETTERS ===
    
    /**
     * Obtiene datos del barco (legacy compatibility)
     */
    public getPlayerBoat(player: Player): PlayerBoat | undefined {
        // Sincronizar datos antes de retornar
        this.updateLegacyDataForPlayer(player);
        return this.playerBoats.get(player);
    }
    
    /**
     * Verifica si jugador está en barco (legacy compatibility)
     */
    public isPlayerInBoat(player: Player): boolean {
        return this.boatController.isPlayerBoatSpawned(player);
    }
    
    /**
     * Obtiene modelo del barco (legacy compatibility)
     */
    public getBoatModel(player: Player): any | undefined {
        return this.boatSpawnService.getBoatModel(player);
    }
    
    private startBoatLoop(): void {
        RunService.Heartbeat.Connect(() => {
            this.updateBoats();
        });
    }
    
    private updateBoats(): void {
        const currentTime = tick();
        
        // Actualizar estado de combate legacy
        this.boatCombatData.forEach((combatData, player) => {
            if (combatData.isInCombat && currentTime - combatData.lastFiredTime > 10) {
                combatData.isInCombat = false;
            }
        });
        
        // Sincronizar datos con el nuevo sistema periódicamente
        if (currentTime % 5 < 0.1) { // Cada 5 segundos
            this.syncLegacyData();
        }
    }
    
    // === NEW SYSTEM API EXPOSURE ===
    
    /**
     * Expone el nuevo BoatController para uso avanzado
     */
    public getBoatController(): BoatController {
        return this.boatController;
    }
    
    /**
     * Obtiene estadísticas del sistema completo
     */
    public getSystemStats(): any {
        return this.boatController.getSystemStatistics();
    }
    
    /**
     * Limpia el sistema (mantenimiento)
     */
    public cleanupSystem(): any {
        return this.boatController.cleanupSystem();
    }
} 
