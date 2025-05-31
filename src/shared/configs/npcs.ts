import { NPCTemplate } from "../types/npc";

// Configuración de NPCs básicos para farmeo
export const NPC_TEMPLATES: Record<string, NPCTemplate> = {
	// NIVEL 1-10: Enemigos básicos
	pirate_thug: {
		id: "pirate_thug",
		name: "Pirate Thug",
		displayName: "🏴‍☠️ Pirate Thug",
		health: 150,
		damage: 25,
		level: 3,
		experienceReward: 15,
		respawnTime: 30,
		attackRange: 6,
		detectionRange: 15,
		description: "Un pirata novato con poca experiencia en combate"
	},

	bandit_rookie: {
		id: "bandit_rookie",
		name: "Bandit Rookie", 
		displayName: "🗡️ Bandit Rookie",
		health: 200,
		damage: 35,
		level: 5,
		experienceReward: 25,
		respawnTime: 45,
		attackRange: 8,
		detectionRange: 18,
		description: "Un bandido principiante buscando problemas"
	},

	// NIVEL 10-25: Enemigos intermedios
	marine_soldier: {
		id: "marine_soldier",
		name: "Marine Soldier",
		displayName: "⚓ Marine Soldier", 
		health: 400,
		damage: 60,
		level: 15,
		experienceReward: 50,
		respawnTime: 60,
		attackRange: 10,
		detectionRange: 20,
		description: "Un soldado de la Marina con entrenamiento básico"
	},

	pirate_fighter: {
		id: "pirate_fighter",
		name: "Pirate Fighter",
		displayName: "🏴‍☠️ Pirate Fighter",
		health: 600,
		damage: 85,
		level: 20,
		experienceReward: 75,
		respawnTime: 90,
		attackRange: 12,
		detectionRange: 25,
		description: "Un pirata experimentado con habilidades de combate"
	},

	// NIVEL 25+: Enemigos avanzados
	marine_captain: {
		id: "marine_captain",
		name: "Marine Captain",
		displayName: "⚓ Marine Captain",
		health: 1000,
		damage: 120,
		level: 30,
		experienceReward: 150,
		respawnTime: 120,
		attackRange: 15,
		detectionRange: 30,
		description: "Un capitán de la Marina con gran experiencia en batalla"
	}
};

// Función para obtener template de NPC
export function getNPCTemplate(npcId: string): NPCTemplate | undefined {
	return NPC_TEMPLATES[npcId];
}

// Función para obtener NPCs por nivel recomendado
export function getNPCsByLevel(playerLevel: number): NPCTemplate[] {
	const templates: NPCTemplate[] = [];
	
	// Iterar manualmente sobre las templates (roblox-ts no tiene Object.values)
	for (const [key, template] of pairs(NPC_TEMPLATES)) {
		templates.push(template);
	}
	
	return templates.filter((npc: NPCTemplate) => {
		const levelDiff = npc.level - playerLevel;
		return levelDiff >= -5 && levelDiff <= 10; // NPCs hasta 5 niveles below y 10 above
	});
} 
