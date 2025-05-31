import { BoatTemplate, BoatUpgrade, BoatCustomization } from "shared/types/boat";

// Plantillas de barcos según el plan del proyecto

export const BOAT_TEMPLATES: Record<string, BoatTemplate> = {
    // TIER 1: Barcos Básicos (Gratis con crafting O starter gratuito)
    starter_sloop: {
        id: "starter_sloop",
        name: "starter_sloop",
        displayName: "Starter Sloop",
        tier: "basic",
        baseStats: {
            health: 100,
            maxHealth: 100,
            speed: 16, // Velocidad base de walking
            armor: 0,
            cannonDamage: 25,
            cannonCount: 1,
            storageCapacity: 10
        },
        cost: 0,
        description: "Un sloop básico perfecto para empezar tu aventura pirata. Gratis para todos los jugadores.",
        isCraftable: false // Este se da gratis al empezar
    },

    // NUEVOS BARCOS BÁSICOS CRAFTEABLES
    basic_fishing_boat: {
        id: "basic_fishing_boat",
        name: "basic_fishing_boat",
        displayName: "Bote de Pesca Básico",
        tier: "basic",
        baseStats: {
            health: 80,
            maxHealth: 80,
            speed: 18, // Más rápido que starter
            armor: 0,
            cannonDamage: 20,
            cannonCount: 1,
            storageCapacity: 15 // Más almacenamiento
        },
        cost: 0, // Gratis con crafting
        description: "Bote básico construible con materiales comunes. Más rápido y con más almacenamiento que el starter.",
        isCraftable: true,
        craftingRecipeId: "basic_fishing_boat"
    },

    merchant_sloop: {
        id: "merchant_sloop",
        name: "merchant_sloop",
        displayName: "Sloop Mercante",
        tier: "basic",
        baseStats: {
            health: 120,
            maxHealth: 120,
            speed: 15, // Más lento pero más resistente
            armor: 5,
            cannonDamage: 30,
            cannonCount: 1,
            storageCapacity: 25 // Mucho almacenamiento
        },
        cost: 0, // Gratis con crafting
        description: "Sloop robusto con gran almacenamiento. Perfecto para comercio y raids largos.",
        isCraftable: true,
        craftingRecipeId: "merchant_sloop"
    },

    // TIER 2: Barcos Mejorados (Crafteable O $299-699 Robux para instant)
    war_galleon: {
        id: "war_galleon",
        name: "war_galleon", 
        displayName: "War Galleon",
        tier: "improved",
        baseStats: {
            health: 200,
            maxHealth: 200,
            speed: 22, // +40% speed del base (16 * 1.4 = 22.4)
            armor: 25,
            cannonDamage: 35,
            cannonCount: 2,
            storageCapacity: 20
        },
        cost: 499, // Instant purchase OR crafting
        description: "Galeón de guerra robusto con cañones duales. Perfecto para combate naval serio.",
        isCraftable: true,
        craftingRecipeId: "war_galleon_craft"
    },

    speed_cutter: {
        id: "speed_cutter",
        name: "speed_cutter",
        displayName: "Speed Cutter", 
        tier: "improved",
        baseStats: {
            health: 150,
            maxHealth: 150,
            speed: 29, // +80% speed del base (16 * 1.8 = 28.8)
            armor: 10,
            cannonDamage: 20,
            cannonCount: 1,
            storageCapacity: 8
        },
        cost: 299, // Instant purchase OR crafting
        description: "Cortador rápido diseñado para escapadas rápidas y raids sorpresa.",
        isCraftable: true,
        craftingRecipeId: "speed_cutter_craft"
    },

    tank_frigate: {
        id: "tank_frigate", 
        name: "tank_frigate",
        displayName: "Tank Frigate",
        tier: "improved",
        baseStats: {
            health: 300, // +100% HP del base
            maxHealth: 300,
            speed: 13, // -20% speed del base (16 * 0.8 = 12.8)
            armor: 50,
            cannonDamage: 40,
            cannonCount: 4,
            storageCapacity: 30
        },
        cost: 699, // Instant purchase OR crafting
        description: "Fragata pesada con armadura máxima. Lenta pero devastadoramente poderosa.",
        isCraftable: true,
        craftingRecipeId: "tank_frigate_craft"
    },

    // TIER 3: Barcos Legendarios (Crafteable con materiales legendarios O $999-1499 Robux)
    ghost_ship: {
        id: "ghost_ship",
        name: "ghost_ship",
        displayName: "Ghost Ship",
        tier: "legendary",
        baseStats: {
            health: 250,
            maxHealth: 250,
            speed: 25,
            armor: 30,
            cannonDamage: 50,
            cannonCount: 3,
            storageCapacity: 25
        },
        cost: 1299, // Premium instant purchase OR crafting
        description: "Barco fantasma legendario con habilidad de invisibilidad. Solo los piratas más temidos lo poseen.",
        isCraftable: true,
        craftingRecipeId: "ghost_ship_craft"
    },

    fire_drake: {
        id: "fire_drake",
        name: "fire_drake", 
        displayName: "Fire Drake",
        tier: "legendary",
        baseStats: {
            health: 280,
            maxHealth: 280,
            speed: 24,
            armor: 35,
            cannonDamage: 60, // + DOT fire damage
            cannonCount: 2,
            storageCapacity: 20
        },
        cost: 1499, // Premium instant purchase OR crafting
        description: "Draco de fuego que dispara cañones incendiarios. Sus enemigos arden en llamas.",
        isCraftable: true,
        craftingRecipeId: "fire_drake_craft"
    },

    ice_breaker: {
        id: "ice_breaker",
        name: "ice_breaker",
        displayName: "Ice Breaker", 
        tier: "legendary",
        baseStats: {
            health: 320,
            maxHealth: 320,
            speed: 20,
            armor: 45,
            cannonDamage: 45, // + freeze effect
            cannonCount: 3,
            storageCapacity: 35
        },
        cost: 999, // Premium instant purchase OR crafting
        description: "Rompehielos legendario que congela a sus enemigos. La dominación ártica absoluta.",
        isCraftable: true,
        craftingRecipeId: "ice_breaker_craft"
    }
};

// Upgrades para barcos
export const BOAT_UPGRADES: Record<string, BoatUpgrade> = {
    // Speed Upgrades
    speed_boost_1: {
        id: "speed_boost_1",
        name: "Speed Boost I",
        description: "+20% velocidad de navegación",
        type: "speed",
        level: 1,
        cost: 199,
        statBonus: { speed: 3.2 } // 20% of base 16
    },

    speed_boost_2: {
        id: "speed_boost_2", 
        name: "Speed Boost II",
        description: "+40% velocidad de navegación",
        type: "speed",
        level: 2,
        cost: 299,
        statBonus: { speed: 6.4 }, // 40% of base 16
        prerequisites: ["speed_boost_1"]
    },

    speed_boost_3: {
        id: "speed_boost_3",
        name: "Speed Boost III", 
        description: "+60% velocidad de navegación",
        type: "speed",
        level: 3,
        cost: 499,
        statBonus: { speed: 9.6 }, // 60% of base 16
        prerequisites: ["speed_boost_2"]
    },

    // Armor Upgrades
    armor_plating_1: {
        id: "armor_plating_1",
        name: "Armor Plating I",
        description: "+50% resistencia al daño",
        type: "armor",
        level: 1,
        cost: 299,
        statBonus: { armor: 25, maxHealth: 50 }
    },

    armor_plating_2: {
        id: "armor_plating_2",
        name: "Armor Plating II", 
        description: "+100% resistencia al daño",
        type: "armor",
        level: 2,
        cost: 499,
        statBonus: { armor: 50, maxHealth: 100 },
        prerequisites: ["armor_plating_1"]
    },

    armor_plating_3: {
        id: "armor_plating_3",
        name: "Armor Plating III",
        description: "+150% resistencia al daño",
        type: "armor", 
        level: 3,
        cost: 799,
        statBonus: { armor: 75, maxHealth: 150 },
        prerequisites: ["armor_plating_2"]
    },

    // Cannon Upgrades
    cannon_upgrade_basic: {
        id: "cannon_upgrade_basic",
        name: "Basic Cannon Upgrade",
        description: "Mejores cañones con +50% daño",
        type: "cannons",
        level: 1,
        cost: 399,
        statBonus: { cannonDamage: 15 }
    },

    cannon_upgrade_advanced: {
        id: "cannon_upgrade_advanced", 
        name: "Advanced Cannon Upgrade",
        description: "Cañones avanzados con +100% daño",
        type: "cannons",
        level: 2,
        cost: 699,
        statBonus: { cannonDamage: 30 },
        prerequisites: ["cannon_upgrade_basic"]
    },

    cannon_upgrade_legendary: {
        id: "cannon_upgrade_legendary",
        name: "Legendary Cannon Upgrade",
        description: "Cañones legendarios devastadores",
        type: "cannons",
        level: 3,
        cost: 999,
        statBonus: { cannonDamage: 50, cannonCount: 1 },
        prerequisites: ["cannon_upgrade_advanced"]
    },

    // Storage Upgrades
    storage_expansion_1: {
        id: "storage_expansion_1",
        name: "Storage Expansion I",
        description: "+50% capacidad de almacenamiento",
        type: "storage",
        level: 1,
        cost: 199,
        statBonus: { storageCapacity: 5 }
    },

    storage_expansion_2: {
        id: "storage_expansion_2",
        name: "Storage Expansion II", 
        description: "+100% capacidad de almacenamiento",
        type: "storage",
        level: 2,
        cost: 399,
        statBonus: { storageCapacity: 10 },
        prerequisites: ["storage_expansion_1"]
    }
};

// Customizaciones visuales premium
export const BOAT_CUSTOMIZATIONS: Record<string, BoatCustomization> = {
    // Sail Colors ($99-199 Robux)
    red_sail: {
        id: "red_sail",
        name: "Red Sail",
        type: "sail_color",
        cost: 99,
        description: "Vela roja ardiente que intimida a tus enemigos",
        rarityLevel: "common"
    },

    black_sail: {
        id: "black_sail", 
        name: "Black Sail",
        type: "sail_color",
        cost: 149,
        description: "Vela negra clásica de pirata temido",
        rarityLevel: "rare"
    },

    gold_sail: {
        id: "gold_sail",
        name: "Golden Sail",
        type: "sail_color", 
        cost: 199,
        description: "Vela dorada que muestra tu riqueza",
        rarityLevel: "epic"
    },

    // Hull Designs ($199-299 Robux)
    skull_hull: {
        id: "skull_hull",
        name: "Skull Hull Design",
        type: "hull_design",
        cost: 199,
        description: "Casco decorado con calaveras intimidantes",
        rarityLevel: "rare"
    },

    dragon_hull: {
        id: "dragon_hull",
        name: "Dragon Hull Design", 
        type: "hull_design",
        cost: 299,
        description: "Casco con diseño de dragón feroz",
        rarityLevel: "epic"
    },

    // Figureheads ($299-499 Robux)
    kraken_figurehead: {
        id: "kraken_figurehead",
        name: "Kraken Figurehead",
        type: "figurehead",
        cost: 299,
        description: "Mascarón de proa del legendario Kraken",
        rarityLevel: "epic"
    },

    phoenix_figurehead: {
        id: "phoenix_figurehead",
        name: "Phoenix Figurehead",
        type: "figurehead", 
        cost: 499,
        description: "Mascarón de proa del mítico Fénix",
        rarityLevel: "legendary"
    },

    // Special Effects (Premium)
    ghost_aura: {
        id: "ghost_aura",
        name: "Ghost Aura",
        type: "special_effect",
        cost: 799,
        description: "Aura fantasmal que rodea tu barco",
        rarityLevel: "legendary"
    },

    lightning_trail: {
        id: "lightning_trail",
        name: "Lightning Trail", 
        type: "special_effect",
        cost: 999,
        description: "Estela de relámpagos al navegar",
        rarityLevel: "legendary",
        isLimited: true
    }
};

// Función helper para obtener template de barco
export function getBoatTemplate(templateId: string): BoatTemplate | undefined {
    return BOAT_TEMPLATES[templateId];
}

// Función helper para obtener upgrade de barco
export function getBoatUpgrade(upgradeId: string): BoatUpgrade | undefined {
    return BOAT_UPGRADES[upgradeId];
}

// Función helper para obtener customización de barco
export function getBoatCustomization(customizationId: string): BoatCustomization | undefined {
    return BOAT_CUSTOMIZATIONS[customizationId];
}

// Función para calcular stats finales con upgrades
export function calculateBoatStats(templateId: string, upgradeIds: string[]): import("shared/types/boat").BoatStats {
    const template = getBoatTemplate(templateId);
    if (!template) {
        throw `Template de barco no encontrado: ${templateId}`;
    }

    let finalStats = { ...template.baseStats };

    // Aplicar bonuses de upgrades
    upgradeIds.forEach(upgradeId => {
        const upgrade = getBoatUpgrade(upgradeId);
        if (upgrade && upgrade.statBonus) {
            // Aplicar bonuses específicos de manera type-safe
            if (upgrade.statBonus.health !== undefined) {
                finalStats.health += upgrade.statBonus.health;
            }
            if (upgrade.statBonus.maxHealth !== undefined) {
                finalStats.maxHealth += upgrade.statBonus.maxHealth;
            }
            if (upgrade.statBonus.speed !== undefined) {
                finalStats.speed += upgrade.statBonus.speed;
            }
            if (upgrade.statBonus.armor !== undefined) {
                finalStats.armor += upgrade.statBonus.armor;
            }
            if (upgrade.statBonus.cannonDamage !== undefined) {
                finalStats.cannonDamage += upgrade.statBonus.cannonDamage;
            }
            if (upgrade.statBonus.cannonCount !== undefined) {
                finalStats.cannonCount += upgrade.statBonus.cannonCount;
            }
            if (upgrade.statBonus.storageCapacity !== undefined) {
                finalStats.storageCapacity += upgrade.statBonus.storageCapacity;
            }
        }
    });

    return finalStats;
} 
