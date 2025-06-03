import { ResourceNodeData, HarvestingResult, HarvestYield } from "shared/types/harvesting";
import { 
    IHarvestingEngine,
    IResourceNodeManager,
    IResourceUIManager,
    IPlayerResourcesManager,
    ToolServiceInterface,
    CombatServiceInterface
} from "../types/ResourceServiceTypes";

export class HarvestingEngine implements IHarvestingEngine {
    private nodeManager: IResourceNodeManager;
    private uiManager: IResourceUIManager;
    private playerManager: IPlayerResourcesManager;
    private toolService?: ToolServiceInterface;
    private combatService?: CombatServiceInterface;

    constructor(
        nodeManager: IResourceNodeManager,
        uiManager: IResourceUIManager,
        playerManager: IPlayerResourcesManager
    ) {
        this.nodeManager = nodeManager;
        this.uiManager = uiManager;
        this.playerManager = playerManager;
    }

    public setToolService(toolService: ToolServiceInterface): void {
        this.toolService = toolService;
    }

    public setCombatService(combatService: CombatServiceInterface): void {
        this.combatService = combatService;
    }

    public damageResourceNode(nodeId: string, damage: number, attacker: Player, toolType: string): boolean {
        const nodeData = this.nodeManager.getResourceNode(nodeId);
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
            this.playerManager.giveResourceToPlayer(attacker, yieldData.resourceId, yieldData.amount);
        });

        // Actualizar UI
        this.uiManager.updateResourceUI(nodeData);

        // Efectos visuales
        this.uiManager.playHarvestEffects(nodeData, effectiveDamage, harvestResult.criticalHit);

        print(`⛏️ ${attacker.Name} dañó ${nodeData.resourceType} por ${effectiveDamage} (${previousHealth} → ${nodeData.health})`);
        
        if (harvestResult.yields.size() > 0) {
            const totalYield = harvestResult.yields.reduce((total, yieldData) => total + yieldData.amount, 0);
            print(`📦 ${attacker.Name} obtuvo ${totalYield}x ${nodeData.resourceType}`);
        }

        // Verificar si el nodo fue destruido
        if (nodeData.health <= 0) {
            this.nodeManager.destroyResourceNode(nodeData);
            return true; // Nodo destruido
        }

        return false; // Nodo aún vivo
    }

    public calculateEffectiveDamage(player: Player, resourceType: string, baseDamage: number): number {
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

    public calculateHarvestYield(player: Player, nodeData: ResourceNodeData, damageDealt: number): HarvestingResult {
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
} 
