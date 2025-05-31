// Types para sistema de combate
export interface CombatStats {
	health: number;
	maxHealth: number;
	damage: number;
	speed: number;
	level: number;
	experience: number;
}

export interface AbilityData {
	id: string;
	name: string;
	description: string;
	cooldown: number;
	damage: number;
	manaCost: number;
	range: number;
	effects?: EffectData[];
}

export interface EffectData {
	type: "damage" | "heal" | "stun" | "speed" | "knockback";
	value: number;
	duration?: number;
}

export interface DevilFruit {
	id: string;
	name: string;
	description: string;
	rarity: "Common" | "Rare" | "Legendary" | "Mythical";
	abilities: [AbilityData, AbilityData]; // Cada fruta tiene exactamente 2 habilidades
	passiveEffect?: EffectData;
	icon?: string;
}

export interface PlayerCombatData {
	stats: CombatStats;
	currentFruit?: DevilFruit;
	lastAttackTime: number;
	isInCombat: boolean;
	combatTarget?: Player;
}

export type AttackType = "M1" | "Skill1" | "Skill2";

export interface DamageInfo {
	attacker: Player;
	target: Player;
	damage: number;
	attackType: AttackType;
	isCrit: boolean;
	position: Vector3;
} 
