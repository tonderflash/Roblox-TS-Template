import { DevilFruit } from "../types/combat";

// 5 Frutas Míticas Básicas para el MVP
export const DEVIL_FRUITS: Record<string, DevilFruit> = {
	// 1. Mera Mera no Mi (Fuego)
	fire: {
		id: "fire",
		name: "Mera Mera no Mi",
		description: "Permite al usuario crear y controlar fuego",
		rarity: "Mythical",
		abilities: [
			{
				id: "fire_fist",
				name: "Fire Fist",
				description: "Lanza un puño de fuego que causa daño en área",
				cooldown: 3,
				damage: 150,
				manaCost: 25,
				range: 20,
				effects: [{ type: "damage", value: 150 }]
			},
			{
				id: "flame_pillar",
				name: "Flame Pillar",
				description: "Crea una columna de fuego desde el suelo",
				cooldown: 5,
				damage: 250,
				manaCost: 40,
				range: 15,
				effects: [{ type: "damage", value: 250 }, { type: "knockback", value: 10 }]
			}
		],
		passiveEffect: { type: "damage", value: 10 } // +10% damage
	},

	// 2. Goro Goro no Mi (Rayo)
	lightning: {
		id: "lightning",
		name: "Goro Goro no Mi", 
		description: "Permite al usuario crear y controlar electricidad",
		rarity: "Mythical",
		abilities: [
			{
				id: "thunder_strike",
				name: "Thunder Strike",
				description: "Golpea con electricidad que aturde al enemigo",
				cooldown: 4,
				damage: 120,
				manaCost: 30,
				range: 25,
				effects: [{ type: "damage", value: 120 }, { type: "stun", value: 1, duration: 2 }]
			},
			{
				id: "lightning_storm",
				name: "Lightning Storm",
				description: "Crea múltiples rayos que golpean en área",
				cooldown: 7,
				damage: 200,
				manaCost: 50,
				range: 30,
				effects: [{ type: "damage", value: 200 }]
			}
		],
		passiveEffect: { type: "speed", value: 15 } // +15% speed
	},

	// 3. Hie Hie no Mi (Hielo)
	ice: {
		id: "ice",
		name: "Hie Hie no Mi",
		description: "Permite al usuario crear y controlar hielo",
		rarity: "Mythical", 
		abilities: [
			{
				id: "ice_spear",
				name: "Ice Spear",
				description: "Lanza lanzas de hielo que ralentizan",
				cooldown: 3,
				damage: 130,
				manaCost: 20,
				range: 35,
				effects: [{ type: "damage", value: 130 }, { type: "speed", value: -20, duration: 3 }]
			},
			{
				id: "frozen_domain", 
				name: "Frozen Domain",
				description: "Congela el área alrededor causando daño continuo",
				cooldown: 8,
				damage: 180,
				manaCost: 45,
				range: 20,
				effects: [{ type: "damage", value: 180 }, { type: "speed", value: -50, duration: 4 }]
			}
		]
	},

	// 4. Yami Yami no Mi (Oscuridad)
	darkness: {
		id: "darkness",
		name: "Yami Yami no Mi",
		description: "Permite al usuario controlar la oscuridad y gravedad",
		rarity: "Mythical",
		abilities: [
			{
				id: "dark_vortex",
				name: "Dark Vortex",
				description: "Crea un vórtice que atrae y daña enemigos",
				cooldown: 5,
				damage: 140,
				manaCost: 35,
				range: 25,
				effects: [{ type: "damage", value: 140 }, { type: "knockback", value: -15 }] // Knockback negativo = atrae
			},
			{
				id: "black_hole",
				name: "Black Hole", 
				description: "Crea un agujero negro que causa daño masivo",
				cooldown: 10,
				damage: 300,
				manaCost: 60,
				range: 20,
				effects: [{ type: "damage", value: 300 }, { type: "stun", value: 1, duration: 1 }]
			}
		]
	},

	// 5. Pika Pika no Mi (Luz)
	light: {
		id: "light",
		name: "Pika Pika no Mi",
		description: "Permite al usuario moverse a la velocidad de la luz",
		rarity: "Mythical",
		abilities: [
			{
				id: "light_beam",
				name: "Light Beam", 
				description: "Dispara un rayo de luz de alta velocidad",
				cooldown: 2,
				damage: 110,
				manaCost: 20,
				range: 50,
				effects: [{ type: "damage", value: 110 }]
			},
			{
				id: "light_explosion",
				name: "Light Explosion",
				description: "Crea una explosión de luz cegadora",
				cooldown: 6,
				damage: 220,
				manaCost: 40,
				range: 25,
				effects: [{ type: "damage", value: 220 }, { type: "stun", value: 1, duration: 1.5 }]
			}
		],
		passiveEffect: { type: "speed", value: 25 } // +25% speed
	}
};

// Helper para obtener una fruta por ID
export function getDevilFruit(id: string): DevilFruit | undefined {
	return DEVIL_FRUITS[id];
}

// Lista de todas las frutas disponibles
export function getAllDevilFruits(): DevilFruit[] {
	const fruits: DevilFruit[] = [];
	for (const [, fruit] of pairs(DEVIL_FRUITS)) {
		fruits.push(fruit);
	}
	return fruits;
} 
