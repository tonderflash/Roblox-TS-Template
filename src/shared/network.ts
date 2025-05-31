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
}

interface ClientFunctions {}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();
