// Types para sistema de recolección ARK-style
export interface ResourceNodeData {
    id: string;
    resourceType: string; // "wood", "rope", "cloth", "iron", etc.
    health: number;
    maxHealth: number;
    position: Vector3;
    model: Model;
    baseYield: number; // cantidad base de recursos por hit completo
    qualityMultiplier: number; // para resources raros (1.0 = normal)
    respawnTime: number; // tiempo en segundos para respawn
    isAlive: boolean;
    lastDamagedTime: number;
}

export interface ToolData {
    id: string;
    name: string;
    displayName: string;
    damage: number; // damage base que hace la herramienta
    resourceMultipliers: Map<string, number>; // multiplicador por tipo de recurso
    durability?: number; // para futuras mejoras
    description: string;
}

export interface HarvestYield {
    resourceId: string;
    amount: number;
    rare?: { resourceId: string; amount: number; }; // recursos raros ocasionales
}

export interface HarvestingResult {
    yields: HarvestYield[];
    damageDealt: number;
    resourceNodeDestroyed: boolean;
    criticalHit: boolean;
}

// Enum para tool types más fácil de manejar
export const TOOL_TYPES = {
    BARE_HANDS: "bare_hands",
    STONE_PICK: "stone_pick", 
    STONE_HATCHET: "stone_hatchet",
    METAL_PICK: "metal_pick",
    METAL_HATCHET: "metal_hatchet"
} as const;

export type ToolType = typeof TOOL_TYPES[keyof typeof TOOL_TYPES];

// Para extender el CombatTarget existente
export interface ResourceTarget {
    type: "resource";
    id: string;
    model: Model;
    position: Vector3;
} 
