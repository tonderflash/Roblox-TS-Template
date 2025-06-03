import { ResourceNodeData, ResourceTarget, HarvestingResult } from "shared/types/harvesting";
import { PlayerResources, InventoryTransaction, TransactionResult } from "shared/types/resources";
import { HotbarItem } from "shared/network";
import t from "@rbxts/t";
import { AttackType } from "shared/types/combat";

// ==============================================
// VALIDADORES SEGUROS PARA EVENTOS DE RED
// ==============================================

// Funciones de validación usando typeIs nativo
export function validateHotbarSlotIndex(value: unknown): value is number {
    return typeIs(value, "number") && value >= 0 && value <= 8 && value === math.floor(value);
}

export function validateItemId(value: unknown): value is string {
    return typeIs(value, "string") && value.size() > 0 && value.size() <= 50;
}

export function validateResourceAmount(value: unknown): value is number {
    return typeIs(value, "number") && value > 0 && value <= 1000 && value === math.floor(value);
}

export function validateSlotIndex(value: unknown): value is number {
    return typeIs(value, "number") && value >= -1 && value <= 8 && value === math.floor(value);
}

export function validateTransactionType(value: unknown): value is "MOVE" | "COPY" | "SWAP" {
    return typeIs(value, "string") && (value === "MOVE" || value === "COPY" || value === "SWAP");
}

export function validateContainerType(value: unknown): value is "INVENTORY" | "HOTBAR" {
    return typeIs(value, "string") && (value === "INVENTORY" || value === "HOTBAR");
}

export function validateItemType(value: unknown): value is "resource" | "tool" | "weapon" | "consumable" {
    return typeIs(value, "string") && (
        value === "resource" || value === "tool" || value === "weapon" || value === "consumable"
    );
}

// Validador completo para transacciones de inventario
export function validateInventoryTransaction(value: unknown): value is InventoryTransaction {
    if (!typeIs(value, "table")) return false;
    
    const transaction = value as Record<string, unknown>;
    
    return validateTransactionType(transaction.type) &&
           validateContainerType(transaction.sourceType) &&
           validateContainerType(transaction.targetType) &&
           validateItemId(transaction.itemId) &&
           validateResourceAmount(transaction.amount) &&
           (transaction.sourceSlot === undefined || validateSlotIndex(transaction.sourceSlot)) &&
           (transaction.targetSlot === undefined || validateSlotIndex(transaction.targetSlot));
}

// Validador para HotbarItem
export function validateHotbarItem(value: unknown): value is HotbarItem {
    if (!typeIs(value, "table")) return false;
    
    const item = value as Record<string, unknown>;
    
    return validateItemId(item.itemId) &&
           validateItemType(item.itemType) &&
           validateResourceAmount(item.amount) &&
           typeIs(item.displayName, "string") &&
           typeIs(item.icon, "string");
}

// Función de utilidad para validar con logging seguro
export function safeValidate<T>(
    validator: (value: unknown) => value is T,
    value: unknown,
    context: string
): T | undefined {
    if (validator(value)) {
        return value;
    } else {
        warn(`[ResourceService] Validación falló en ${context}: tipo inválido o valor fuera de rango`);
        return undefined;
    }
}

// ==============================================
// INTERFACES EXISTENTES
// ==============================================

// Interfaces para inyección de dependencias
export interface ToolServiceInterface {
    getPlayerTool(player: Player): string;
    calculateDamage(player: Player, resourceType: string, baseDamage: number): number;
    getResourceMultiplier(player: Player, resourceType: string): number;
}

export interface CombatServiceInterface {
    getPlayerCombatData(player: Player): { stats: { damage: number; level: number } } | undefined;
}

export interface InventoryServiceInterface {
    addResource(player: Player, resourceType: string, amount: number): void;
}

// Tipo extendido de PlayerResources que garantiza que hotbar existe
export interface ExtendedPlayerResources extends PlayerResources {
    hotbar: (HotbarItem | undefined)[];
}

// Tipo específico para snapshots
export interface PlayerResourcesSnapshot {
    resources: Map<string, number>;
    hotbar: (HotbarItem | undefined)[];
    lastUpdated: number;
}

// Configuración para spawn de recursos
export interface ResourceSpawnConfig {
    resourceType: string;
    count: number;
    emoji: string;
}

// Configuración para nodos de recursos
export interface ResourceNodeConfig {
    health: number;
    baseYield: number;
    material: Enum.Material;
    color: BrickColor;
    healthBarColor: Color3;
}

// Interfaces para managers
export interface IResourceNodeManager {
    spawnInitialResources(): void;
    createResourceNode(resourceType: string, emoji: string): ResourceNodeData | undefined;
    destroyResourceNode(nodeData: ResourceNodeData): void;
    respawnResourceNode(nodeData: ResourceNodeData): void;
    updateResourceNodes(): void;
    getAllResourceNodes(): Map<string, ResourceTarget>;
    getResourceNode(nodeId: string): ResourceNodeData | undefined;
    respawnAllResources(): void;
    forceRespawnResource(nodeId: string): boolean;
}

export interface IPlayerResourcesManager {
    initializePlayerResources(player: Player): void;
    cleanupPlayerResources(player: Player): void;
    getPlayerResources(player: Player): ExtendedPlayerResources | undefined;
    syncPlayerData(player: Player): void;
    giveResourceToPlayer(player: Player, resourceType: string, amount: number): void;
    findEmptyHotbarSlot(hotbar: (HotbarItem | undefined)[]): number;
    getPlayerHotbar(player: Player): (HotbarItem | undefined)[];
    setHotbarSlot(player: Player, slotIndex: number, item: HotbarItem | undefined): boolean;
    useHotbarSlot(player: Player, slotIndex: number): void;
    getItemType(itemId: string): "resource" | "tool" | "weapon" | "consumable";
    getItemDisplayName(itemId: string): string;
    getItemIcon(itemId: string): string;
}

export interface IResourceUIManager {
    setupResourceUI(nodeData: ResourceNodeData, emoji: string): void;
    updateResourceUI(nodeData: ResourceNodeData): void;
    playHarvestEffects(nodeData: ResourceNodeData, damage: number, isCrit: boolean): void;
}

export interface IHarvestingEngine {
    damageResourceNode(nodeId: string, damage: number, attacker: Player, toolType: string): boolean;
    calculateEffectiveDamage(player: Player, resourceType: string, baseDamage: number): number;
    calculateHarvestYield(player: Player, nodeData: ResourceNodeData, damageDealt: number): HarvestingResult;
}

export interface IInventoryTransactionManager {
    handleInventoryTransaction(player: Player, transaction: InventoryTransaction): TransactionResult;
    validateTransaction(playerRes: ExtendedPlayerResources, transaction: InventoryTransaction): TransactionResult;
    createSnapshot(playerRes: ExtendedPlayerResources): PlayerResourcesSnapshot;
    restoreSnapshot(playerRes: ExtendedPlayerResources, snapshot: PlayerResourcesSnapshot): void;
}

// Constantes
export const RESOURCE_CONFIG = {
    SPAWN_RADIUS: 200,
    MAX_NODES_PER_TYPE: 8,
    HOTBAR_SIZE: 9,
    RESPAWN_TIME_MIN: 60,
    RESPAWN_TIME_MAX: 120
} as const;

export const ISLAND_CENTERS = [
    new Vector3(0, 17, 0),      // Isla de Inicio
    new Vector3(500, 19.5, 300), // Bahía Pirata
    new Vector3(-400, 22, 400),  // Base Marina
    new Vector3(600, 27, -200),  // Templo de la Jungla
    new Vector3(-600, 19.5, 100), // Ruinas del Desierto
    new Vector3(-300, 24.5, -400), // Cavernas de Hielo
    new Vector3(300, 29.5, -500)  // Forja del Volcán
] as const;

// ==============================================
// VALIDADORES PARA TODOS LOS SERVICIOS
// ==============================================

// TESTING SERVICE VALIDATORS
export function validateExperienceAmount(value: unknown): value is number {
    return (
        typeIs(value, "number") &&
        value >= 0 &&
        value <= 10000 &&
        value === math.floor(value)
    );
}

export function validatePlayerLevel(value: unknown): value is number {
    return (
        typeIs(value, "number") &&
        value >= 1 &&
        value <= 1000 &&
        value === math.floor(value)
    );
}

// COMBAT SERVICE VALIDATORS
export function validateAttackType(value: unknown): value is AttackType {
    return (
        typeIs(value, "string") &&
        (value === "M1" || value === "Skill1" || value === "Skill2")
    );
}

export function validateFruitId(value: unknown): value is string {
    return (
        typeIs(value, "string") &&
        value.size() > 0 &&
        value.size() <= 30 &&
        // Lista de frutas válidas
        (value === "fire" || value === "lightning" || value === "ice" || 
         value === "darkness" || value === "light")
    );
}

export function validateCombatTarget(value: unknown): value is Vector3 {
    return typeIs(value, "Vector3");
}

// SETTINGS SERVICE VALIDATORS
export function validateSetting(value: unknown): value is "Play Music" | "Sound Effects" | "PvP" {
    return (
        typeIs(value, "string") &&
        (value === "Play Music" || value === "Sound Effects" || value === "PvP")
    );
}

// BOAT SERVICE VALIDATORS (para futuro uso)
export function validateDirection(value: unknown): value is string {
    return (
        typeIs(value, "string") &&
        (value === "forward" || value === "backward" || value === "left" || value === "right")
    );
}

export function validateUpgradeId(value: unknown): value is string {
    return typeIs(value, "string") && value.size() > 0 && value.size() <= 50;
}

export function validateTargetPosition(value: unknown): value is Vector3 {
    return typeIs(value, "Vector3");
}

// GENERAL VALIDATORS
export function validateResourceType(value: unknown): value is string {
    return (
        typeIs(value, "string") &&
        value.size() > 0 &&
        value.size() <= 20 &&
        // Lista de tipos de recursos válidos
        ["wood", "stone", "iron", "food", "cloth"].includes(value)
    );
}

export function validateRecipeId(value: unknown): value is string {
    return typeIs(value, "string") && value.size() > 0 && value.size() <= 50;
}

// ==============================================
// IMPORTAR TIPOS DE COMBAT
// ==============================================
