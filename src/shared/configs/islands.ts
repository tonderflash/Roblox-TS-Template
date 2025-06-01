import { IslandTemplate } from "shared/types/island";
import { RESOURCE_TYPES } from "shared/types/resources";

// Configuración de las islas temáticas según el plan del proyecto

export const ISLAND_TEMPLATES: Record<string, IslandTemplate> = {
    // ==========================================
    // ISLA SPAWN (Ya existente - referencia)
    // ==========================================
    spawn_island: {
        id: "spawn_island",
        name: "spawn_island",
        displayName: "Isla de Inicio",
        theme: "spawn",
        size: new Vector3(200, 20, 200),
        position: new Vector3(0, 0, 0),
        difficulty: "easy",
        recommendedLevel: 1,
        description: "Isla segura para nuevos piratas. Recursos básicos y NPCs de práctica.",
        
        npcSpawns: [
            {
                npcType: "pirate_thug",
                spawnPoints: [
                    new Vector3(30, 15, 30),
                    new Vector3(-30, 15, 30)
                ],
                maxActive: 3,
                respawnRadius: 10
            },
            {
                npcType: "bandit_rookie",
                spawnPoints: [
                    new Vector3(30, 15, -30),
                    new Vector3(-30, 15, -30)
                ],
                maxActive: 2,
                respawnRadius: 10
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.WOOD,
                spawnPoints: [
                    new Vector3(50, 10, 50),
                    new Vector3(-50, 10, 50),
                    new Vector3(50, 10, -50),
                    new Vector3(-50, 10, -50),
                    new Vector3(70, 10, 0),
                    new Vector3(-70, 10, 0)
                ],
                maxActive: 6,
                respawnRadius: 5
            },
            {
                resourceType: RESOURCE_TYPES.ROPE,
                spawnPoints: [
                    new Vector3(40, 10, 0),
                    new Vector3(-40, 10, 0),
                    new Vector3(0, 10, 40),
                    new Vector3(0, 10, -40)
                ],
                maxActive: 4,
                respawnRadius: 5
            }
        ],
        
        terrainColor: Color3.fromRGB(76, 153, 76),
        terrainMaterial: Enum.Material.Grass,
        decorations: [],
        waterLevel: 2,
        hasPortDock: true
    },

    // ==========================================
    // ISLA PIRATA - Enemies básicos, loot común
    // ==========================================
    pirate_cove: {
        id: "pirate_cove",
        name: "pirate_cove",
        displayName: "Bahía Pirata",
        theme: "pirate",
        size: new Vector3(150, 25, 180),
        position: new Vector3(500, 0, 300), // Al noreste del spawn
        difficulty: "easy",
        recommendedLevel: 2,
        description: "Una bahía controlada por piratas novatos. Perfecto para conseguir loot básico y ganar experiencia.",
        
        npcSpawns: [
            {
                npcType: "pirate_thug",
                spawnPoints: [
                    new Vector3(520, 15, 320),
                    new Vector3(480, 15, 320),
                    new Vector3(500, 15, 340),
                    new Vector3(500, 15, 280)
                ],
                maxActive: 5,
                respawnRadius: 15
            },
            {
                npcType: "pirate_captain",
                spawnPoints: [
                    new Vector3(500, 25, 300) // Centro de la isla, elevado
                ],
                maxActive: 1,
                respawnRadius: 20
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.WOOD,
                spawnPoints: [
                    new Vector3(530, 12, 330),
                    new Vector3(470, 12, 330),
                    new Vector3(530, 12, 270)
                ],
                maxActive: 3,
                respawnRadius: 8
            },
            {
                resourceType: RESOURCE_TYPES.ROPE,
                spawnPoints: [
                    new Vector3(510, 12, 285),
                    new Vector3(490, 12, 315)
                ],
                maxActive: 2,
                respawnRadius: 8
            },
            {
                resourceType: RESOURCE_TYPES.GOLD,
                spawnPoints: [
                    new Vector3(500, 25, 300) // Cerca del captain
                ],
                maxActive: 1,
                respawnRadius: 5
            }
        ],
        
        terrainColor: Color3.fromRGB(139, 115, 85), // Sandy brown
        terrainMaterial: Enum.Material.Sand,
        decorations: [
            {
                type: "structure",
                positions: [
                    new Vector3(500, 20, 300), // Pequeña torre pirata
                    new Vector3(485, 12, 290), // Barril
                    new Vector3(515, 12, 310)  // Barril
                ]
            }
        ],
        waterLevel: 2,
        hasPortDock: true
    },

    // ==========================================
    // ISLA MARINA - Enemies fuertes, loot militar
    // ==========================================
    marine_base: {
        id: "marine_base",
        name: "marine_base", 
        displayName: "Base Marina",
        theme: "marine",
        size: new Vector3(160, 30, 160),
        position: new Vector3(-400, 0, 400), // Al noroeste del spawn
        difficulty: "medium",
        recommendedLevel: 4,
        description: "Base militar fortificada. Los Marines son duros pero dropean equipo militar valioso.",
        
        npcSpawns: [
            {
                npcType: "marine_soldier",
                spawnPoints: [
                    new Vector3(-380, 15, 420),
                    new Vector3(-420, 15, 420),
                    new Vector3(-380, 15, 380),
                    new Vector3(-420, 15, 380)
                ],
                maxActive: 6,
                respawnRadius: 12
            },
            {
                npcType: "marine_officer",
                spawnPoints: [
                    new Vector3(-400, 25, 400)
                ],
                maxActive: 1,
                respawnRadius: 25
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.IRON,
                spawnPoints: [
                    new Vector3(-390, 15, 410),
                    new Vector3(-410, 15, 410),
                    new Vector3(-390, 15, 390),
                    new Vector3(-410, 15, 390)
                ],
                maxActive: 4,
                respawnRadius: 6
            },
            {
                resourceType: RESOURCE_TYPES.STEEL,
                spawnPoints: [
                    new Vector3(-400, 25, 400), // Centro fortificado
                    new Vector3(-395, 20, 395)
                ],
                maxActive: 2,
                respawnRadius: 5
            }
        ],
        
        terrainColor: Color3.fromRGB(105, 105, 105), // Gray
        terrainMaterial: Enum.Material.Concrete,
        decorations: [
            {
                type: "building",
                positions: [
                    new Vector3(-400, 20, 400), // Torre de comando
                    new Vector3(-385, 15, 385), // Barraca
                    new Vector3(-415, 15, 415)  // Barraca
                ]
            }
        ],
        waterLevel: 2,
        hasPortDock: true
    },

    // ==========================================
    // ISLA VOLCÁN - Fire theme, rare materials
    // ==========================================
    volcano_forge: {
        id: "volcano_forge",
        name: "volcano_forge",
        displayName: "Forja del Volcán",
        theme: "volcano",
        size: new Vector3(140, 45, 140),
        position: new Vector3(300, 0, -500), // Al sureste del spawn
        difficulty: "hard",
        recommendedLevel: 6,
        description: "Isla volcánica con forjas naturales. Los enemigos son resistentes al fuego y dropean materiales raros.",
        
        npcSpawns: [
            {
                npcType: "fire_elemental",
                spawnPoints: [
                    new Vector3(320, 20, -480),
                    new Vector3(280, 20, -480),
                    new Vector3(320, 20, -520),
                    new Vector3(280, 20, -520)
                ],
                maxActive: 4,
                respawnRadius: 15
            },
            {
                npcType: "volcano_shaman",
                spawnPoints: [
                    new Vector3(300, 35, -500) // En la cima del volcán
                ],
                maxActive: 1,
                respawnRadius: 30
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.FIRE_CORE,
                spawnPoints: [
                    new Vector3(300, 35, -500), // Cima del volcán
                    new Vector3(295, 30, -495)
                ],
                maxActive: 2,
                respawnRadius: 8
            },
            {
                resourceType: RESOURCE_TYPES.STEEL,
                spawnPoints: [
                    new Vector3(310, 25, -490),
                    new Vector3(290, 25, -510),
                    new Vector3(315, 20, -515)
                ],
                maxActive: 3,
                respawnRadius: 10
            }
        ],
        
        terrainColor: Color3.fromRGB(139, 69, 19), // Dark red/brown
        terrainMaterial: Enum.Material.Rock,
        decorations: [
            {
                type: "rock",
                positions: [
                    new Vector3(300, 40, -500), // Pico volcánico
                    new Vector3(305, 20, -485), // Rocas volcánicas
                    new Vector3(295, 20, -515)
                ]
            }
        ],
        waterLevel: 2,
        hasPortDock: true
    },

    // ==========================================
    // ISLA HIELO - Ice theme, building materials
    // ==========================================
    ice_caverns: {
        id: "ice_caverns",
        name: "ice_caverns",
        displayName: "Cavernas de Hielo",
        theme: "ice",
        size: new Vector3(170, 35, 170),
        position: new Vector3(-300, 0, -400), // Al suroeste del spawn
        difficulty: "medium",
        recommendedLevel: 5,
        description: "Isla congelada con cavernas de cristal. Fuente principal de materiales para construcción.",
        
        npcSpawns: [
            {
                npcType: "ice_warrior",
                spawnPoints: [
                    new Vector3(-280, 20, -380),
                    new Vector3(-320, 20, -380),
                    new Vector3(-280, 20, -420),
                    new Vector3(-320, 20, -420)
                ],
                maxActive: 5,
                respawnRadius: 12
            },
            {
                npcType: "frost_giant",
                spawnPoints: [
                    new Vector3(-300, 30, -400)
                ],
                maxActive: 1,
                respawnRadius: 35
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.ICE_CRYSTAL,
                spawnPoints: [
                    new Vector3(-300, 25, -400),
                    new Vector3(-285, 20, -385),
                    new Vector3(-315, 20, -415)
                ],
                maxActive: 3,
                respawnRadius: 8
            },
            {
                resourceType: RESOURCE_TYPES.HARDWOOD,
                spawnPoints: [
                    new Vector3(-290, 18, -390),
                    new Vector3(-310, 18, -410),
                    new Vector3(-305, 22, -385),
                    new Vector3(-295, 22, -415)
                ],
                maxActive: 4,
                respawnRadius: 6
            }
        ],
        
        terrainColor: Color3.fromRGB(176, 224, 230), // Light blue
        terrainMaterial: Enum.Material.Ice,
        decorations: [
            {
                type: "rock",
                positions: [
                    new Vector3(-300, 25, -400), // Cristal gigante central
                    new Vector3(-290, 15, -390), // Cristales menores
                    new Vector3(-310, 15, -410)
                ]
            }
        ],
        waterLevel: 2,
        hasPortDock: true
    },

    // ==========================================
    // ISLA JUNGLA - Nature theme, frutas raras
    // ==========================================
    jungle_temple: {
        id: "jungle_temple",
        name: "jungle_temple",
        displayName: "Templo de la Jungla",
        theme: "jungle",
        size: new Vector3(190, 40, 190),
        position: new Vector3(600, 0, -200), // Al este del spawn
        difficulty: "medium",
        recommendedLevel: 4,
        description: "Jungla densa con templo ancestral. Rica en frutas del diablo y materiales naturales.",
        
        npcSpawns: [
            {
                npcType: "jungle_guardian",
                spawnPoints: [
                    new Vector3(620, 18, -180),
                    new Vector3(580, 18, -180),
                    new Vector3(620, 18, -220),
                    new Vector3(580, 18, -220)
                ],
                maxActive: 4,
                respawnRadius: 18
            },
            {
                npcType: "temple_priest",
                spawnPoints: [
                    new Vector3(600, 35, -200)
                ],
                maxActive: 1,
                respawnRadius: 40
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.HARDWOOD,
                spawnPoints: [
                    new Vector3(615, 20, -185),
                    new Vector3(585, 20, -185),
                    new Vector3(615, 20, -215),
                    new Vector3(585, 20, -215),
                    new Vector3(600, 25, -200)
                ],
                maxActive: 5,
                respawnRadius: 8
            },
            {
                resourceType: RESOURCE_TYPES.CANVAS,
                spawnPoints: [
                    new Vector3(605, 18, -195),
                    new Vector3(595, 18, -205)
                ],
                maxActive: 2,
                respawnRadius: 6
            }
        ],
        
        terrainColor: Color3.fromRGB(34, 139, 34), // Forest green
        terrainMaterial: Enum.Material.Grass,
        decorations: [
            {
                type: "tree",
                positions: [
                    new Vector3(610, 20, -190),
                    new Vector3(590, 20, -190),
                    new Vector3(610, 20, -210),
                    new Vector3(590, 20, -210),
                    new Vector3(600, 30, -200) // Templo central
                ]
            }
        ],
        waterLevel: 2,
        hasPortDock: true
    },

    // ==========================================
    // ISLA DESIERTO - Sand theme, treasure chests
    // ==========================================
    desert_ruins: {
        id: "desert_ruins",
        name: "desert_ruins",
        displayName: "Ruinas del Desierto",
        theme: "desert",
        size: new Vector3(200, 25, 180),
        position: new Vector3(-600, 0, 100), // Al oeste del spawn
        difficulty: "easy",
        recommendedLevel: 3,
        description: "Ruinas ancestrales en el desierto. Tesoros enterrados y enemigos del desierto.",
        
        npcSpawns: [
            {
                npcType: "desert_bandit",
                spawnPoints: [
                    new Vector3(-580, 15, 120),
                    new Vector3(-620, 15, 120),
                    new Vector3(-580, 15, 80),
                    new Vector3(-620, 15, 80)
                ],
                maxActive: 4,
                respawnRadius: 20
            },
            {
                npcType: "mummy_lord",
                spawnPoints: [
                    new Vector3(-600, 20, 100)
                ],
                maxActive: 1,
                respawnRadius: 50
            }
        ],
        
        resourceSpawns: [
            {
                resourceType: RESOURCE_TYPES.GOLD,
                spawnPoints: [
                    new Vector3(-600, 18, 100), // Centro de las ruinas
                    new Vector3(-590, 15, 110),
                    new Vector3(-610, 15, 90),
                    new Vector3(-585, 15, 85),
                    new Vector3(-615, 15, 115)
                ],
                maxActive: 5,
                respawnRadius: 6
            },
            {
                resourceType: RESOURCE_TYPES.CLOTH,
                spawnPoints: [
                    new Vector3(-595, 15, 105),
                    new Vector3(-605, 15, 95)
                ],
                maxActive: 2,
                respawnRadius: 8
            }
        ],
        
        terrainColor: Color3.fromRGB(238, 203, 173), // Sandy color
        terrainMaterial: Enum.Material.Sand,
        decorations: [
            {
                type: "structure",
                positions: [
                    new Vector3(-600, 18, 100), // Ruina central
                    new Vector3(-590, 12, 110), // Columnas caídas
                    new Vector3(-610, 12, 90)
                ]
            }
        ],
        waterLevel: 2,
        hasPortDock: true
    }
};

// Función helper para obtener template de isla
export function getIslandTemplate(islandId: string): IslandTemplate | undefined {
    return ISLAND_TEMPLATES[islandId];
}

// Función para obtener todas las islas ordenadas por dificultad
export function getIslandsByDifficulty(): IslandTemplate[] {
    const islands: IslandTemplate[] = [];
    for (const [, template] of pairs(ISLAND_TEMPLATES)) {
        islands.push(template);
    }
    
    // Ordenamiento manual por dificultad
    const difficultyOrder: Record<string, number> = { "easy": 1, "medium": 2, "hard": 3 };
    
    // Bubble sort simple para compatibilidad con Roblox TS
    for (let i = 0; i < islands.size(); i++) {
        for (let j = 0; j < islands.size() - 1 - i; j++) {
            if (difficultyOrder[islands[j].difficulty] > difficultyOrder[islands[j + 1].difficulty]) {
                const temp = islands[j];
                islands[j] = islands[j + 1];
                islands[j + 1] = temp;
            }
        }
    }
    
    return islands;
}

// Función para obtener islas por nivel recomendado
export function getIslandsForLevel(playerLevel: number): IslandTemplate[] {
    const filteredIslands: IslandTemplate[] = [];
    for (const [, island] of pairs(ISLAND_TEMPLATES)) {
        if (island.recommendedLevel <= playerLevel + 2) { // Permitir islas hasta 2 niveles superiores
            filteredIslands.push(island);
        }
    }
    return filteredIslands;
} 
