import { OnStart, Service } from "@flamework/core";
import { Players, RunService, Workspace } from "@rbxts/services";
import { Events } from "server/network";
import { AttackType, DamageInfo, PlayerCombatData, CombatStats } from "shared/types/combat";
import { getDevilFruit } from "shared/configs/fruits";

// Forward declaration para evitar circular dependency
interface NPCServiceInterface {
	damageNPC(npcId: string, damage: number, attacker: Player): boolean;
	getAllNPCModels(): Map<string, Model>;
}

type CombatTarget = Player | { type: "npc"; id: string; model: Model };

@Service()
export class CombatService implements OnStart {
	private playerCombatData = new Map<Player, PlayerCombatData>();
	private activeCooldowns = new Map<Player, Map<string, number>>();
	private npcService?: NPCServiceInterface;

	onStart(): void {
		this.setupPlayerEvents();
		this.setupCombatEvents();
		this.startCombatLoop();
		print("🥊 CombatService iniciado correctamente!");
	}

	// Método para inyectar NPCService (evita circular dependency)
	public setNPCService(npcService: NPCServiceInterface): void {
		this.npcService = npcService;
	}

	private setupPlayerEvents(): void {
		Players.PlayerAdded.Connect((player) => {
			this.initializePlayerCombat(player);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.playerCombatData.delete(player);
			this.activeCooldowns.delete(player);
		});
	}

	private setupCombatEvents(): void {
		Events.performAttack.connect((player, attackType, target) => {
			this.performAttack(player, attackType, target);
		});

		Events.equipFruit.connect((player, fruitId) => {
			this.equipFruit(player, fruitId);
		});

		Events.unequipFruit.connect((player) => {
			this.unequipFruit(player);
		});
	}

	private initializePlayerCombat(player: Player): void {
		const stats: CombatStats = {
			health: 1000,
			maxHealth: 1000,
			damage: 100,
			speed: 16,
			level: 1,
			experience: 0
		};

		const combatData: PlayerCombatData = {
			stats: stats,
			lastAttackTime: 0,
			isInCombat: false
		};

		this.playerCombatData.set(player, combatData);
		this.activeCooldowns.set(player, new Map());

		print(`⚔️ Combate inicializado para ${player.Name} - Salud: ${stats.health}/${stats.maxHealth}`);
	}

	private performAttack(player: Player, attackType: AttackType, targetPosition?: Vector3): void {
		const combatData = this.playerCombatData.get(player);
		if (!combatData) return;

		// Verificar cooldown básico de M1
		const currentTime = tick();
		if (attackType === "M1" && currentTime - combatData.lastAttackTime < 0.5) {
			return; // M1 cooldown de 0.5 segundos
		}

		let damage = 0;
		let range = 0;
		let cooldown = 0;

		switch (attackType) {
			case "M1":
				damage = combatData.stats.damage;
				range = 8;
				cooldown = 0.5;
				break;
			
			case "Skill1":
			case "Skill2":
				if (!combatData.currentFruit) {
					print(`❌ ${player.Name} no tiene fruta equipada`);
					return;
				}
				
				const abilityIndex = attackType === "Skill1" ? 0 : 1;
				const ability = combatData.currentFruit.abilities[abilityIndex];
				
				// Verificar cooldown de habilidad
				const playerCooldowns = this.activeCooldowns.get(player);
				if (playerCooldowns?.has(ability.id)) {
					const timeLeft = playerCooldowns.get(ability.id)! - currentTime;
					if (timeLeft > 0) {
						print(`⏰ ${player.Name} debe esperar ${string.format("%.1f", timeLeft)}s para ${ability.name}`);
						return;
					}
				}

				damage = ability.damage;
				range = ability.range;
				cooldown = ability.cooldown;

				// Aplicar cooldown
				if (!playerCooldowns) {
					this.activeCooldowns.set(player, new Map());
				}
				this.activeCooldowns.get(player)!.set(ability.id, currentTime + cooldown);
				print(`🔥 ${player.Name} usó ${ability.name} (cooldown: ${cooldown}s)`);
				break;
		}

		// Aplicar efecto pasivo de la fruta al daño
		if (combatData.currentFruit?.passiveEffect?.type === "damage") {
			damage *= (1 + combatData.currentFruit.passiveEffect.value / 100);
		}

		// Encontrar enemigos en rango (jugadores y NPCs)
		const attackPosition = targetPosition || (player.Character?.FindFirstChild("HumanoidRootPart") as Part)?.Position;
		if (!attackPosition) return;

		const targets = this.findTargetsInRange(player, attackPosition, range);
		
		print(`💥 ${player.Name} atacó con ${attackType} - Daño: ${math.floor(damage)} - Objetivos: ${targets.size()}`);
		
		// Aplicar daño a cada objetivo
		targets.forEach((target) => {
			this.dealDamageToTarget(player, target, damage, attackType, attackPosition);
		});

		// Actualizar último tiempo de ataque
		combatData.lastAttackTime = currentTime;
	}

	private findTargetsInRange(attacker: Player, position: Vector3, range: number): CombatTarget[] {
		const targets: CombatTarget[] = [];
		
		// Buscar jugadores en rango
		Players.GetPlayers().forEach((player) => {
			if (player === attacker) return;
			
			const character = player.Character;
			const humanoidRootPart = character?.FindFirstChild("HumanoidRootPart") as Part;
			
			if (humanoidRootPart) {
				const distance = position.sub(humanoidRootPart.Position).Magnitude;
				if (distance <= range) {
					targets.push(player);
				}
			}
		});

		// Buscar NPCs en rango
		if (this.npcService) {
			const npcModels = this.npcService.getAllNPCModels();
			npcModels.forEach((model, npcId) => {
				const humanoidRootPart = model.FindFirstChild("HumanoidRootPart") as Part;
				if (humanoidRootPart) {
					const distance = position.sub(humanoidRootPart.Position).Magnitude;
					if (distance <= range) {
						targets.push({ type: "npc", id: npcId, model: model });
					}
				}
			});
		}

		return targets;
	}

	private dealDamageToTarget(attacker: Player, target: CombatTarget, damage: number, attackType: AttackType, position: Vector3): void {
		// Calcular daño crítico (10% chance)
		const isCrit = math.random() < 0.1;
		if (isCrit) {
			damage *= 1.5;
		}

		if (this.isNPCTarget(target)) {
			// Dañar NPC
			if (this.npcService) {
				const npcKilled = this.npcService.damageNPC(target.id, damage, attacker);
				if (npcKilled) {
					// NPC murió, dar experiencia al jugador
					this.giveExperience(attacker, 25); // Experiencia básica por ahora
				}
			}
		} else {
			// Dañar jugador (código existente)
			this.dealDamageToPlayer(attacker, target, damage, attackType, position, isCrit);
		}
	}

	private isNPCTarget(target: CombatTarget): target is { type: "npc"; id: string; model: Model } {
		return typeIs(target, "table") && (target as unknown as { type: string }).type === "npc";
	}

	private dealDamageToPlayer(attacker: Player, target: Player, damage: number, attackType: AttackType, position: Vector3, isCrit: boolean): void {
		const targetCombatData = this.playerCombatData.get(target);
		if (!targetCombatData) return;

		// Aplicar daño
		const previousHealth = targetCombatData.stats.health;
		targetCombatData.stats.health = math.max(0, targetCombatData.stats.health - damage);

		print(`💔 ${target.Name} recibió ${math.floor(damage)} de daño ${isCrit ? "(CRÍTICO)" : ""} - Salud: ${targetCombatData.stats.health}/${targetCombatData.stats.maxHealth}`);

		// Verificar muerte
		if (targetCombatData.stats.health <= 0) {
			this.handlePlayerDeath(target, attacker);
		}
	}

	private giveExperience(player: Player, amount: number): void {
		const combatData = this.playerCombatData.get(player);
		if (!combatData) return;

		combatData.stats.experience += amount;
		
		// Calcular si subió de nivel (simple: cada 100 EXP = 1 level)
		const newLevel = math.floor(combatData.stats.experience / 100) + 1;
		
		if (newLevel > combatData.stats.level) {
			const oldLevel = combatData.stats.level;
			combatData.stats.level = newLevel;
			
			// Aumentar stats al subir de nivel
			combatData.stats.maxHealth += 50;
			combatData.stats.health = combatData.stats.maxHealth; // Heal completo al subir
			combatData.stats.damage += 10;
			
			print(`🎉 ${player.Name} subió al nivel ${newLevel}! (${oldLevel} → ${newLevel})`);
			print(`📈 Nuevos stats - HP: ${combatData.stats.maxHealth}, Daño: ${combatData.stats.damage}`);
		}

		print(`✨ ${player.Name} ganó ${amount} EXP - Total: ${combatData.stats.experience} (Nivel ${combatData.stats.level})`);
	}

	private handlePlayerDeath(player: Player, killer?: Player): void {
		const combatData = this.playerCombatData.get(player);
		if (!combatData) return;

		// Restaurar salud completa
		combatData.stats.health = combatData.stats.maxHealth;
		
		print(`💀 ${player.Name} murió ${killer ? `asesinado por ${killer.Name}` : ""}`);
		print(`💚 ${player.Name} resucitó con salud completa`);

		// Teleport al spawn (básico)
		const character = player.Character;
		if (character) {
			const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as Part;
			if (humanoidRootPart) {
				humanoidRootPart.Position = new Vector3(0, 50, 0); // Spawn básico
			}
		}
	}

	private equipFruit(player: Player, fruitId: string): void {
		const combatData = this.playerCombatData.get(player);
		if (!combatData) return;

		const fruit = getDevilFruit(fruitId);
		if (!fruit) {
			print(`❌ Fruta no encontrada: ${fruitId}`);
			return;
		}

		combatData.currentFruit = fruit;
		print(`🍎 ${player.Name} equipó ${fruit.name}`);
		
		// Aplicar efectos pasivos
		if (fruit.passiveEffect?.type === "speed") {
			const character = player.Character;
			const humanoid = character?.FindFirstChild("Humanoid") as Humanoid;
			if (humanoid) {
				const baseSpeed = combatData.stats.speed;
				const speedBonus = fruit.passiveEffect.value / 100;
				humanoid.WalkSpeed = baseSpeed * (1 + speedBonus);
				print(`🏃 ${player.Name} obtuvo +${fruit.passiveEffect.value}% velocidad`);
			}
		}
	}

	private unequipFruit(player: Player): void {
		const combatData = this.playerCombatData.get(player);
		if (!combatData) return;

		if (!combatData.currentFruit) {
			print(`❌ ${player.Name} no tiene fruta equipada`);
			return;
		}

		const fruitName = combatData.currentFruit.name;

		// Remover efectos pasivos
		if (combatData.currentFruit?.passiveEffect?.type === "speed") {
			const character = player.Character;
			const humanoid = character?.FindFirstChild("Humanoid") as Humanoid;
			if (humanoid) {
				humanoid.WalkSpeed = combatData.stats.speed;
			}
		}

		combatData.currentFruit = undefined;
		print(`🚫 ${player.Name} desequipó ${fruitName}`);
	}

	private startCombatLoop(): void {
		RunService.Heartbeat.Connect(() => {
			this.updateCombat();
		});
	}

	private updateCombat(): void {
		const currentTime = tick();
		
		// Limpiar cooldowns expirados
		this.activeCooldowns.forEach((playerCooldowns, player) => {
			const expiredCooldowns: string[] = [];
			
			playerCooldowns.forEach((expireTime, abilityId) => {
				if (currentTime >= expireTime) {
					expiredCooldowns.push(abilityId);
				}
			});

			expiredCooldowns.forEach((abilityId) => {
				playerCooldowns.delete(abilityId);
			});
		});
	}

	// Métodos públicos para otros servicios
	public getPlayerCombatData(player: Player): PlayerCombatData | undefined {
		return this.playerCombatData.get(player);
	}

	public healPlayer(player: Player, amount: number): void {
		const combatData = this.playerCombatData.get(player);
		if (!combatData) return;

		combatData.stats.health = math.min(combatData.stats.maxHealth, combatData.stats.health + amount);
		print(`💚 ${player.Name} se curó ${amount} puntos - Salud: ${combatData.stats.health}/${combatData.stats.maxHealth}`);
	}

	// Método para dar fruta a un jugador (para testing)
	public giveTestFruit(player: Player): void {
		this.equipFruit(player, "fire"); // Dar Mera Mera no Mi por defecto
	}

	// Métodos públicos para comandos
	public equipFruitPublic(player: Player, fruitId: string): void {
		this.equipFruit(player, fruitId);
	}

	public unequipFruitPublic(player: Player): void {
		this.unequipFruit(player);
	}
} 
