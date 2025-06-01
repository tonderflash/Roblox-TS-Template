/* eslint-disable no-unused-vars */
import { Networking } from "@flamework/networking";
import { BroadcastAction } from "@rbxts/reflex";
import { PlayerData } from "./store/slices/players/types";
import { Setting } from "./configs/Settings";
import { AttackType, DamageInfo } from "./types/combat";

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
}

interface ClientFunctions {}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();

// Exports con nombres más simples para mayor comodidad
export const Events = GlobalEvents;
export const Functions = GlobalFunctions;
