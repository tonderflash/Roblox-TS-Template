// Types para sistema de NPCs
import { CombatStats } from "./combat";

export interface NPCData {
	id: string;
	name: string;
	health: number;
	maxHealth: number;
	damage: number;
	level: number;
	experienceReward: number;
	spawnPosition: Vector3;
	respawnTime: number; // segundos para respawn
	attackRange: number;
	detectionRange: number;
	isAlive: boolean;
	lastAttackedTime: number;
	currentTarget?: Player;
}

export interface NPCTemplate {
	id: string;
	name: string;
	displayName: string;
	health: number;
	damage: number;
	level: number;
	experienceReward: number;
	respawnTime: number;
	attackRange: number;
	detectionRange: number;
	modelId?: number; // ID del modelo en Roblox (opcional)
	description: string;
}

export type NPCType = "Pirate" | "Marine" | "Bandit" | "Beast"; 
