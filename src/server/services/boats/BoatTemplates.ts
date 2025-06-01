// ===== BOAT TEMPLATES - CONFIGURACIONES PREDEFINIDAS =====
// Templates de barcos con configuraciones específicas

import { BoatTemplate } from "./types/BoatTypes";

export const BOAT_TEMPLATES: Record<string, BoatTemplate> = {
    starter_sloop: {
        id: "starter_sloop",
        displayName: "Balandro Básico",
        description: "Un barco pequeño y ágil, perfecto para comenzar",
        stats: {
            health: 100,
            maxHealth: 100,
            speed: 20,
            acceleration: 8,
            turnSpeed: 6,
            durability: 50
        },
        size: new Vector3(12, 4, 20),
        components: {
            hull: {
                size: new Vector3(12, 3, 20),
                position: new Vector3(0, 0, 0),
                material: Enum.Material.Wood,
                color: "Brown",
                anchored: false,
                canCollide: true
            },
            deck: {
                size: new Vector3(10, 0.5, 18),
                position: new Vector3(0, 2, 0),
                material: Enum.Material.Wood,
                color: "Dark orange",
                anchored: false,
                canCollide: true
            },
            helm: {
                size: new Vector3(2, 3, 2),
                position: new Vector3(0, 2.5, -7),
                material: Enum.Material.Wood,
                color: "Really black",
                anchored: false,
                canCollide: true
            }
        }
    },

    war_galleon: {
        id: "war_galleon",
        displayName: "Galeón de Guerra",
        description: "Un barco grande y resistente, ideal para batallas",
        stats: {
            health: 300,
            maxHealth: 300,
            speed: 15,
            acceleration: 5,
            turnSpeed: 3,
            durability: 150
        },
        size: new Vector3(18, 6, 30),
        components: {
            hull: {
                size: new Vector3(18, 4, 30),
                position: new Vector3(0, 0, 0),
                material: Enum.Material.Wood,
                color: "Dark orange",
                anchored: false,
                canCollide: true
            },
            deck: {
                size: new Vector3(16, 0.5, 28),
                position: new Vector3(0, 2.5, 0),
                material: Enum.Material.Wood,
                color: "Brown",
                anchored: false,
                canCollide: true
            },
            helm: {
                size: new Vector3(3, 4, 3),
                position: new Vector3(0, 3, -12),
                material: Enum.Material.Wood,
                color: "Really black",
                anchored: false,
                canCollide: true
            }
        }
    },

    speed_cutter: {
        id: "speed_cutter",
        displayName: "Cortavientos Veloz",
        description: "Un barco ligero y rápido para exploración",
        stats: {
            health: 75,
            maxHealth: 75,
            speed: 35,
            acceleration: 12,
            turnSpeed: 10,
            durability: 30
        },
        size: new Vector3(8, 3, 18),
        components: {
            hull: {
                size: new Vector3(8, 2, 18),
                position: new Vector3(0, 0, 0),
                material: Enum.Material.Wood,
                color: "Bright blue",
                anchored: false,
                canCollide: true
            },
            deck: {
                size: new Vector3(6, 0.5, 16),
                position: new Vector3(0, 1.5, 0),
                material: Enum.Material.Wood,
                color: "Light blue",
                anchored: false,
                canCollide: true
            },
            helm: {
                size: new Vector3(1.5, 2, 1.5),
                position: new Vector3(0, 2, -6),
                material: Enum.Material.Wood,
                color: "Really black",
                anchored: false,
                canCollide: true
            }
        }
    },

    fishing_boat: {
        id: "fishing_boat",
        displayName: "Barco Pesquero",
        description: "Diseñado para la pesca y el transporte de carga",
        stats: {
            health: 150,
            maxHealth: 150,
            speed: 12,
            acceleration: 6,
            turnSpeed: 4,
            durability: 80
        },
        size: new Vector3(14, 4, 22),
        components: {
            hull: {
                size: new Vector3(14, 3, 22),
                position: new Vector3(0, 0, 0),
                material: Enum.Material.Wood,
                color: "Reddish brown",
                anchored: false,
                canCollide: true
            },
            deck: {
                size: new Vector3(12, 0.5, 20),
                position: new Vector3(0, 2, 0),
                material: Enum.Material.Wood,
                color: "Brown",
                anchored: false,
                canCollide: true
            },
            helm: {
                size: new Vector3(2.5, 3, 2.5),
                position: new Vector3(0, 2.5, -8),
                material: Enum.Material.Wood,
                color: "Really black",
                anchored: false,
                canCollide: true
            }
        }
    }
};

/**
 * Obtiene un template de barco por su ID
 */
export function getBoatTemplate(templateId: string): BoatTemplate | undefined {
    return BOAT_TEMPLATES[templateId];
}

/**
 * Obtiene todos los templates disponibles
 */
export function getAllBoatTemplates(): BoatTemplate[] {
    const templates: BoatTemplate[] = [];
    for (const [_, template] of pairs(BOAT_TEMPLATES)) {
        templates.push(template);
    }
    return templates;
}

/**
 * Verifica si un template existe
 */
export function templateExists(templateId: string): boolean {
    return templateId in BOAT_TEMPLATES;
}

/**
 * Obtiene los IDs de todos los templates
 */
export function getBoatTemplateIds(): string[] {
    const ids: string[] = [];
    for (const [id, _] of pairs(BOAT_TEMPLATES)) {
        ids.push(id);
    }
    return ids;
} 
