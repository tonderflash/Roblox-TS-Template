// Tipos para el sistema de barcos del juego

export interface BoatStats {
    health: number;
    maxHealth: number;
    speed: number;
    armor: number;
    cannonDamage: number;
    cannonCount: number;
    storageCapacity: number;
}

export interface BoatTemplate {
    id: string;
    name: string;
    displayName: string;
    tier: "basic" | "improved" | "legendary";
    baseStats: BoatStats;
    cost: number; // En Robux, 0 para gratis
    description: string;
    modelId?: string; // Para diferentes modelos 3D
}

export interface BoatUpgrade {
    id: string;
    name: string;
    description: string;
    type: "speed" | "armor" | "cannons" | "storage" | "special";
    level: number; // 1, 2, 3 para diferentes niveles del upgrade
    cost: number; // En materiales o Robux
    statBonus: Partial<BoatStats>;
    prerequisites?: string[]; // IDs de upgrades requeridos
}

export interface BoatCustomization {
    id: string;
    name: string;
    type: "sail_color" | "hull_design" | "figurehead" | "special_effect";
    cost: number; // En Robux
    description: string;
    isLimited?: boolean; // Para items de temporada
    rarityLevel: "common" | "rare" | "epic" | "legendary";
}

export interface PlayerBoat {
    templateId: string;
    currentStats: BoatStats;
    upgrades: string[]; // IDs de upgrades aplicados
    customizations: string[]; // IDs de customizaciones aplicadas
    position?: Vector3;
    rotation?: CFrame;
    health: number;
    isSpawned: boolean;
    lastUsed: number;
}

export interface BoatCombatData {
    isInCombat: boolean;
    lastFiredTime: number;
    target?: Player | string; // Player o NPC ID
    cannonCooldown: number;
}

// Eventos de red para barcos
export interface BoatNetworkEvents {
    spawnBoat: (player: Player) => void;
    despawnBoat: (player: Player) => void;
    moveBoat: (player: Player, position: Vector3, rotation: CFrame) => void;
    upgradeBoat: (player: Player, upgradeId: string) => void;
    customizeBoat: (player: Player, customizationId: string) => void;
    fireCannonAt: (player: Player, targetPosition: Vector3) => void;
    repairBoat: (player: Player) => void;
}

export type AttackTarget = Player | { type: "boat"; ownerId: string; boat: PlayerBoat }; 
