// Tipos para el sistema de islas temáticas

export interface IslandTemplate {
    id: string;
    name: string;
    displayName: string;
    theme: "spawn" | "pirate" | "marine" | "volcano" | "ice" | "jungle" | "desert";
    size: Vector3; // Tamaño de la isla en studs
    position: Vector3; // Posición en el mundo
    difficulty: "easy" | "medium" | "hard";
    recommendedLevel: number;
    description: string;
    
    // NPCs que spawean en esta isla
    npcSpawns: IslandNPCSpawn[];
    
    // Recursos que aparecen en esta isla
    resourceSpawns: IslandResourceSpawn[];
    
    // Configuración visual
    terrainColor: Color3;
    terrainMaterial: Enum.Material;
    decorations: IslandDecoration[];
    
    // Configuración de agua alrededor
    waterLevel: number;
    hasPortDock: boolean; // Si tiene dock para barcos
}

export interface IslandNPCSpawn {
    npcType: string;
    spawnPoints: Vector3[]; // Múltiples puntos de spawn
    maxActive: number; // Máximo NPCs activos de este tipo
    respawnRadius: number; // Radio alrededor de spawn points
}

export interface IslandResourceSpawn {
    resourceType: string;
    spawnPoints: Vector3[]; // Puntos específicos donde aparece
    maxActive: number;
    respawnRadius: number;
}

export interface IslandDecoration {
    type: "tree" | "rock" | "building" | "structure";
    positions: Vector3[];
    size?: Vector3;
    color?: Color3;
    material?: Enum.Material;
}

export interface IslandData {
    templateId: string;
    model?: Model;
    isLoaded: boolean;
    activeNPCs: string[]; // IDs de NPCs activos
    activeResources: string[]; // IDs de recursos activos
    lastVisited: number;
}

// Eventos de red para islas
export interface IslandNetworkEvents {
    requestIslandTeleport: (player: Player, islandId: string) => void;
    loadIsland: (player: Player, islandId: string) => void;
    unloadIsland: (player: Player, islandId: string) => void;
    getIslandInfo: (player: Player, islandId: string) => void;
} 
