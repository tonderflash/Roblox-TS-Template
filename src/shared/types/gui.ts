// Sistema de GUI para Inventario y Crafting estilo ARK

import { Resource, ResourceStack, CraftingRecipe } from "./resources";

export interface InventorySlot {
    id: string;
    resourceId?: string;
    amount?: number;
    isEmpty: boolean;
    slotIndex: number;
}

export interface InventoryData {
    slots: InventorySlot[];
    maxSlots: number;
    searchFilter: string;
    selectedCategory: InventoryCategory;
}

export enum InventoryCategory {
    ALL = "all",
    MATERIALS = "materials", 
    TOOLS = "tools",
    FOOD = "food",
    WEAPONS = "weapons",
    MISC = "misc"
}

export interface CraftingSlot {
    recipe: CraftingRecipe;
    canCraft: boolean;
    missingMaterials: ResourceStack[];
    isUnlocked: boolean;
}

export interface GUITheme {
    primaryColor: Color3;
    secondaryColor: Color3;
    accentColor: Color3;
    backgroundColor: Color3;
    textColor: Color3;
    borderColor: Color3;
    errorColor: Color3;
    successColor: Color3;
}

export interface GUIState {
    isOpen: boolean;
    currentTab: GUITab;
    inventory: InventoryData;
    crafting: CraftingSlot[];
    theme: GUITheme;
}

export enum GUITab {
    INVENTORY = "inventory",
    CRAFTING = "crafting"
}

export interface DeviceSpecs {
    screenSize: Vector2;
    deviceType: "PC" | "Mobile" | "Tablet" | "Console";
    gridSize: Vector2; // columns x rows
    slotSize: number;
    fontSize: number;
}

// Eventos de GUI
export interface GUIEvents {
    inventoryOpened: () => void;
    inventoryClosed: () => void;
    tabChanged: (newTab: GUITab) => void;
    itemSelected: (slotId: string) => void;
    craftingStarted: (recipeId: string) => void;
    craftingCompleted: (recipeId: string, success: boolean) => void;
    searchFilterChanged: (filter: string) => void;
    categoryChanged: (category: InventoryCategory) => void;
}

// Configuración de responsive design
export const DEVICE_CONFIGS: Record<string, DeviceSpecs> = {
    PC: {
        screenSize: new Vector2(1920, 1080),
        deviceType: "PC",
        gridSize: new Vector2(6, 8),
        slotSize: 64,
        fontSize: 16
    },
    Mobile: {
        screenSize: new Vector2(375, 667), 
        deviceType: "Mobile",
        gridSize: new Vector2(4, 6),
        slotSize: 80,
        fontSize: 18
    },
    Tablet: {
        screenSize: new Vector2(768, 1024),
        deviceType: "Tablet", 
        gridSize: new Vector2(5, 7),
        slotSize: 72,
        fontSize: 17
    },
    Console: {
        screenSize: new Vector2(1920, 1080),
        deviceType: "Console",
        gridSize: new Vector2(6, 8),
        slotSize: 72,
        fontSize: 20
    }
};

// Theme pirata por defecto
export const PIRATE_THEME: GUITheme = {
    primaryColor: Color3.fromRGB(101, 67, 33),    // Marrón oscuro
    secondaryColor: Color3.fromRGB(139, 115, 85), // Marrón claro
    accentColor: Color3.fromRGB(218, 165, 32),    // Dorado
    backgroundColor: Color3.fromRGB(45, 35, 25),   // Marrón muy oscuro
    textColor: Color3.fromRGB(255, 248, 220),     // Blanco crema
    borderColor: Color3.fromRGB(139, 115, 85),    // Marrón borde
    errorColor: Color3.fromRGB(220, 20, 60),      // Rojo
    successColor: Color3.fromRGB(50, 205, 50)     // Verde
}; 
