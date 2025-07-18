/* eslint-disable no-unused-vars */
import { Networking } from "@flamework/networking";
import { BroadcastAction } from "@rbxts/reflex";
import { PlayerData } from "./store/slices/players/types";
import { Setting } from "./configs/Settings";
import { AttackType, DamageInfo } from "./types/combat";

// Import Vector3, Player, and Map from Roblox types
declare global {
	interface Vector3 {
		X: number;
		Y: number;
		Z: number;
	}
	interface Player {
		Name: string;
		UserId: number;
	}
	interface Map<K, V> {
		get(key: K): V | undefined;
		set(key: K, value: V): void;
		has(key: K): boolean;
		delete(key: K): boolean;
		clear(): void;
		size(): number;
	}
}

// Definimos un tipo para el inventario que coincida con los datos enviados desde InventoryService
interface PlayerInventory {
	resources: Record<string, number>; // Se serializa como objeto, no Map
	unlockedRecipes: string[]; // Se serializa como array, no Set
	lastUpdated: number;
}

// NUEVO: Tipos para el hotbar
interface HotbarItem {
	itemId: string;
	itemType: "resource" | "tool" | "weapon" | "consumable";
	amount: number;
	displayName: string;
	icon: string;
}

interface ServerEvents {
	reflex: {
		start: () => void;
	}

	toggleSetting: (setting: Setting) => void;
	
	// Combat Events
	performAttack: (attackType: AttackType, target?: Vector3) => void;
	equipFruit: (fruitId: string) => void;
	unequipFruit: () => void;
	
	// Boat Events
	spawnBoat: () => void;
	despawnBoat: () => void;
	upgradeBoat: (upgradeId: string) => void;
	customizeBoat: (customizationId: string) => void;
	fireCannonAt: (targetPosition: Vector3) => void;
	repairBoat: () => void;
	
	// Boat Navigation Events
	startBoatNavigation: (direction: Vector3) => void;
	stopBoatNavigation: () => void;
	
	// GUI Events
	openInventory: () => void;
	closeInventory: () => void;
	craftItem: (recipeId: string) => void;
	giveResource: (resourceType: string, amount: number) => void;
	unlockRecipe: (recipeId: string) => void;
	resetInventory: () => void;
	
	// NUEVO: Hotbar Events
	useHotbarSlot: (slotIndex: number) => void;
	moveItemToHotbar: (itemId: string, fromSlot: number, toSlot: number) => void;
	moveHotbarSlot: (fromSlot: number, toSlot: number) => void;
	removeItemFromHotbar: (slotIndex: number) => void;
	
	// NUEVO: Player Stats Events
	addExperience: (amount: number) => void;
	setLevel: (level: number) => void;
}

interface ServerFunctions {}

interface ClientEvents {
	reflex: {
		dispatch: (actions: Array<BroadcastAction>) => void;
		hydrate: (actions: PlayerData) => void;
		start: () => void;
	}
	
	// Combat Events
	onDamageDealt: (damageInfo: DamageInfo) => void;
	onAttackPerformed: (attacker: Player, attackType: AttackType, position: Vector3) => void;
	onPlayerDeath: (player: Player, killer?: Player) => void;
	onHealthChanged: (player: Player, newHealth: number, maxHealth: number) => void;
	
	// Boat Events
	onBoatSpawned: (player: Player, boatTemplateId: string) => void;
	onBoatDespawned: (player: Player) => void;
	onBoatUpgraded: (player: Player, upgradeId: string) => void;
	onBoatCustomized: (player: Player, customizationId: string) => void;
	onCannonFired: (player: Player, fromPosition: Vector3, targetPosition: Vector3) => void;
	onBoatDamaged: (player: Player, damage: number, newHealth: number, maxHealth: number) => void;
	onBoatDestroyed: (player: Player, destroyer?: Player) => void;
	
	// GUI Events
	onInventoryUpdated: (inventory: PlayerInventory) => void;
	onInventoryOpened: () => void;
	onInventoryClosed: () => void;
	onResourceAdded: (resourceType: string, amount: number) => void;
	onResourceUpdated: (resources: Map<string, number>) => void;
	onCraftingCompleted: (recipeId: string, success: boolean) => void;
	onRecipeUnlocked: (recipeId: string) => void;
	
	// NUEVO: Player Stats Events
	onLevelUp: (newLevel: number, totalExperience: number) => void;
	onExperienceGained: (experienceGained: number, totalExperience: number) => void;
	onStatsUpdated: (level: number, experience: number, nextLevelExp: number) => void;
	
	// NUEVO: Hotbar Events
	onHotbarUpdated: (hotbarItems: (HotbarItem | undefined)[]) => void;
	onHotbarSlotUsed: (slotIndex: number, item: HotbarItem) => void;
	onItemEquipped: (item: HotbarItem) => void;
	onItemUnequipped: (slotIndex: number) => void;
}

interface ClientFunctions {}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();

// Exports con nombres más simples para mayor comodidad
export const Events = GlobalEvents;
export const Functions = GlobalFunctions;

// NUEVO: Export del tipo HotbarItem para usar en otros archivos
export type { HotbarItem };
