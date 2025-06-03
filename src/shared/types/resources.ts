// Sistema de recursos para construcción de barcos

export interface Resource {
    id: string;
    name: string;
    displayName: string;
    icon: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    description: string;
    stackSize: number;
}

export interface ResourceStack {
    resourceId: string;
    amount: number;
}

export interface CraftingRecipe {
    id: string;
    name: string;
    resultId: string; // ID del barco que se crea
    resultType: "boat" | "upgrade" | "item";
    requirements: ResourceStack[]; // Materiales necesarios
    craftingTime: number; // En segundos
    description: string;
    unlockLevel?: number; // Nivel mínimo requerido
}

// ACTUALIZADO: Tipo para hotbar items importado desde network
import { HotbarItem } from "shared/network";

export interface PlayerResources {
    resources: Map<string, number>; // resourceId -> cantidad
    hotbar?: (HotbarItem | undefined)[]; // NUEVO: Hotbar opcional para compatibilidad
    lastUpdated: number;
}

// NUEVO: Interface para operaciones transaccionales
export interface InventoryTransaction {
    type: "MOVE" | "COPY" | "SWAP";
    sourceType: "INVENTORY" | "HOTBAR";
    targetType: "INVENTORY" | "HOTBAR";
    itemId: string;
    amount: number;
    sourceSlot?: number;
    targetSlot?: number;
}

// NUEVO: Resultado de transacción
export interface TransactionResult {
    success: boolean;
    error?: string;
    rollbackData?: any;
}

// Tipos de recursos básicos
export const RESOURCE_TYPES = {
    // Recursos básicos - aparecen en el spawn island
    WOOD: "wood",
    ROPE: "rope", 
    CLOTH: "cloth",
    IRON: "iron",
    
    // Recursos raros - aparecen en islas específicas  
    HARDWOOD: "hardwood",
    STEEL: "steel",
    CANVAS: "canvas",
    GOLD: "gold",
    
    // Recursos legendarios - bosses/eventos
    DRAGON_SCALE: "dragon_scale",
    GHOST_ESSENCE: "ghost_essence",
    ICE_CRYSTAL: "ice_crystal",
    FIRE_CORE: "fire_core"
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES]; 
