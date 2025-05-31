import { Resource, CraftingRecipe, RESOURCE_TYPES } from "shared/types/resources";

// ================================
// DEFINICIÓN DE RECURSOS
// ================================

export const RESOURCES: Record<string, Resource> = {
    // RECURSOS BÁSICOS (Aparecen en Spawn Island)
    [RESOURCE_TYPES.WOOD]: {
        id: RESOURCE_TYPES.WOOD,
        name: "wood",
        displayName: "Madera",
        icon: "🪵",
        rarity: "common",
        description: "Madera común para construcción básica de barcos",
        stackSize: 100
    },

    [RESOURCE_TYPES.ROPE]: {
        id: RESOURCE_TYPES.ROPE,
        name: "rope",
        displayName: "Cuerda",
        icon: "🪢",
        rarity: "common", 
        description: "Cuerda resistente para amarrar y velas",
        stackSize: 50
    },

    [RESOURCE_TYPES.CLOTH]: {
        id: RESOURCE_TYPES.CLOTH,
        name: "cloth",
        displayName: "Tela",
        icon: "🧵",
        rarity: "common",
        description: "Tela básica para confeccionar velas",
        stackSize: 75
    },

    [RESOURCE_TYPES.IRON]: {
        id: RESOURCE_TYPES.IRON,
        name: "iron",
        displayName: "Hierro",
        icon: "🔩",
        rarity: "uncommon",
        description: "Hierro para cañones y refuerzos",
        stackSize: 50
    },

    // RECURSOS RAROS (Islas específicas)
    [RESOURCE_TYPES.HARDWOOD]: {
        id: RESOURCE_TYPES.HARDWOOD,
        name: "hardwood", 
        displayName: "Madera Dura",
        icon: "🌳",
        rarity: "rare",
        description: "Madera resistente para barcos avanzados",
        stackSize: 50
    },

    [RESOURCE_TYPES.STEEL]: {
        id: RESOURCE_TYPES.STEEL,
        name: "steel",
        displayName: "Acero",
        icon: "⚙️",
        rarity: "rare",
        description: "Acero forjado para armadura de barcos",
        stackSize: 25
    },

    [RESOURCE_TYPES.CANVAS]: {
        id: RESOURCE_TYPES.CANVAS,
        name: "canvas",
        displayName: "Lona",
        icon: "⛵",
        rarity: "rare",
        description: "Lona de alta calidad para velas resistentes",
        stackSize: 30
    },

    [RESOURCE_TYPES.GOLD]: {
        id: RESOURCE_TYPES.GOLD,
        name: "gold",
        displayName: "Oro",
        icon: "🪙",
        rarity: "epic",
        description: "Oro para decoraciones y mejoras premium",
        stackSize: 10
    },

    // RECURSOS LEGENDARIOS (Bosses/eventos)
    [RESOURCE_TYPES.DRAGON_SCALE]: {
        id: RESOURCE_TYPES.DRAGON_SCALE,
        name: "dragon_scale",
        displayName: "Escama de Dragón",
        icon: "🐲",
        rarity: "legendary",
        description: "Escama mágica para barcos legendarios de fuego",
        stackSize: 5
    },

    [RESOURCE_TYPES.GHOST_ESSENCE]: {
        id: RESOURCE_TYPES.GHOST_ESSENCE,
        name: "ghost_essence",
        displayName: "Esencia Fantasma",
        icon: "👻",
        rarity: "legendary",
        description: "Esencia etérea para barcos fantasmales",
        stackSize: 5
    },

    [RESOURCE_TYPES.ICE_CRYSTAL]: {
        id: RESOURCE_TYPES.ICE_CRYSTAL,
        name: "ice_crystal",
        displayName: "Cristal de Hielo",
        icon: "❄️",
        rarity: "legendary", 
        description: "Cristal helado para barcos rompehielos",
        stackSize: 5
    },

    [RESOURCE_TYPES.FIRE_CORE]: {
        id: RESOURCE_TYPES.FIRE_CORE,
        name: "fire_core",
        displayName: "Núcleo de Fuego",
        icon: "🔥",
        rarity: "legendary",
        description: "Núcleo ardiente para cañones incendiarios",
        stackSize: 3
    }
};

// ================================
// RECETAS DE CRAFTING PARA BARCOS
// ================================

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
    // TIER 1 BÁSICOS (Gratis con materiales básicos)
    basic_fishing_boat: {
        id: "basic_fishing_boat",
        name: "Bote de Pesca Básico",
        resultId: "basic_fishing_boat",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.WOOD, amount: 25 },
            { resourceId: RESOURCE_TYPES.ROPE, amount: 10 },
            { resourceId: RESOURCE_TYPES.CLOTH, amount: 15 }
        ],
        craftingTime: 30, // 30 segundos
        description: "Un bote básico perfecto para empezar. Rápido de construir con materiales comunes.",
        unlockLevel: 1
    },

    merchant_sloop: {
        id: "merchant_sloop",
        name: "Sloop Mercante",
        resultId: "merchant_sloop",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.WOOD, amount: 35 },
            { resourceId: RESOURCE_TYPES.ROPE, amount: 15 },
            { resourceId: RESOURCE_TYPES.CLOTH, amount: 20 },
            { resourceId: RESOURCE_TYPES.IRON, amount: 5 }
        ],
        craftingTime: 60, // 1 minuto
        description: "Sloop con más espacio de almacenamiento para comercio.",
        unlockLevel: 3
    },

    // TIER 2 MEJORADOS (Materiales raros + algún Robux opcional)
    war_galleon_craft: {
        id: "war_galleon_craft",
        name: "Galeón de Guerra",
        resultId: "war_galleon",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.HARDWOOD, amount: 40 },
            { resourceId: RESOURCE_TYPES.STEEL, amount: 20 },
            { resourceId: RESOURCE_TYPES.CANVAS, amount: 15 },
            { resourceId: RESOURCE_TYPES.IRON, amount: 25 }
        ],
        craftingTime: 180, // 3 minutos
        description: "Galeón robusto con cañones duales. Requiere materiales avanzados.",
        unlockLevel: 8
    },

    speed_cutter_craft: {
        id: "speed_cutter_craft", 
        name: "Cortador Veloz",
        resultId: "speed_cutter",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.HARDWOOD, amount: 30 },
            { resourceId: RESOURCE_TYPES.CANVAS, amount: 25 },
            { resourceId: RESOURCE_TYPES.ROPE, amount: 20 },
            { resourceId: RESOURCE_TYPES.STEEL, amount: 10 }
        ],
        craftingTime: 150, // 2.5 minutos
        description: "Barco ligero optimizado para velocidad máxima.",
        unlockLevel: 6
    },

    tank_frigate_craft: {
        id: "tank_frigate_craft",
        name: "Fragata Acorazada",
        resultId: "tank_frigate", 
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.HARDWOOD, amount: 50 },
            { resourceId: RESOURCE_TYPES.STEEL, amount: 35 },
            { resourceId: RESOURCE_TYPES.IRON, amount: 40 },
            { resourceId: RESOURCE_TYPES.CANVAS, amount: 10 }
        ],
        craftingTime: 240, // 4 minutos
        description: "Fragata pesada con armadura máxima. El tanque definitivo.",
        unlockLevel: 12
    },

    // TIER 3 LEGENDARIOS (Materiales legendarios + mucho tiempo)
    ghost_ship_craft: {
        id: "ghost_ship_craft",
        name: "Barco Fantasma",
        resultId: "ghost_ship",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.GHOST_ESSENCE, amount: 3 },
            { resourceId: RESOURCE_TYPES.HARDWOOD, amount: 60 },
            { resourceId: RESOURCE_TYPES.CANVAS, amount: 20 },
            { resourceId: RESOURCE_TYPES.STEEL, amount: 25 }
        ],
        craftingTime: 600, // 10 minutos
        description: "Barco legendario con poderes fantasmales. Solo para piratas élite.",
        unlockLevel: 20
    },

    fire_drake_craft: {
        id: "fire_drake_craft",
        name: "Draco de Fuego",
        resultId: "fire_drake",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.FIRE_CORE, amount: 2 },
            { resourceId: RESOURCE_TYPES.DRAGON_SCALE, amount: 5 },
            { resourceId: RESOURCE_TYPES.STEEL, amount: 40 },
            { resourceId: RESOURCE_TYPES.HARDWOOD, amount: 50 }
        ],
        craftingTime: 720, // 12 minutos
        description: "Draco legendario que respira fuego. Devastador en combate.",
        unlockLevel: 25
    },

    ice_breaker_craft: {
        id: "ice_breaker_craft",
        name: "Rompehielos",
        resultId: "ice_breaker",
        resultType: "boat",
        requirements: [
            { resourceId: RESOURCE_TYPES.ICE_CRYSTAL, amount: 4 },
            { resourceId: RESOURCE_TYPES.STEEL, amount: 45 },
            { resourceId: RESOURCE_TYPES.HARDWOOD, amount: 55 },
            { resourceId: RESOURCE_TYPES.CANVAS, amount: 15 }
        ],
        craftingTime: 660, // 11 minutos
        description: "Rompehielos que congela enemigos. Control absoluto del mar.",
        unlockLevel: 22
    }
};

// Helper functions
export function getResource(resourceId: string): Resource | undefined {
    return RESOURCES[resourceId];
}

export function getCraftingRecipe(recipeId: string): CraftingRecipe | undefined {
    return CRAFTING_RECIPES[recipeId];
}

export function getRecipesForBoat(boatId: string): CraftingRecipe[] {
    const recipes: CraftingRecipe[] = [];
    for (const [_, recipe] of pairs(CRAFTING_RECIPES)) {
        if (recipe.resultType === "boat" && recipe.resultId === boatId) {
            recipes.push(recipe);
        }
    }
    return recipes;
}

export function getResourcesByRarity(rarity: string): Resource[] {
    const resources: Resource[] = [];
    for (const [_, resource] of pairs(RESOURCES)) {
        if (resource.rarity === rarity) {
            resources.push(resource);
        }
    }
    return resources;
} 
