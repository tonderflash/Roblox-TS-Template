import { OnStart, Service } from "@flamework/core";
import { Dependency } from "@flamework/core";
import { Workspace } from "@rbxts/services";
import { NPCData, NPCTemplate } from "shared/types/npc";
import { getNPCTemplate } from "shared/configs/npcs";
import { getIslandTemplate } from "shared/configs/islands";
import { IslandService } from "./IslandService";

@Service()
export class NPCService implements OnStart {
	private activeNPCs = new Map<string, NPCData>();
	private npcModels = new Map<string, Model>();

	onStart(): void {
		this.setupWorld();
		print("🤖 NPCService iniciado correctamente!");
	}

	private setupWorld(): void {
		task.wait(1);
		this.spawnInitialNPCs();
	}

	private spawnInitialNPCs(): void {
		// SPAWN NPCs EN ISLA DE INICIO usando RAYCAST
		print("🔍 Iniciando spawn de NPCs con raycast en Isla de Inicio...");
		
		const spawnPositions = [
			new Vector3(30, 50, 30),    // Empezar desde arriba, raycast encontrará la superficie
			new Vector3(-30, 50, 30),
			new Vector3(30, 50, -30),
			new Vector3(-30, 50, -30),
			new Vector3(50, 50, 0)
		];

		const npcTypes = ["pirate_thug", "bandit_rookie", "pirate_thug", "bandit_rookie", "marine_soldier"];

		spawnPositions.forEach((basePosition, index) => {
			const npcType = npcTypes[index];
			if (npcType) {
				// Usar raycast para encontrar superficie real
				const validPosition = this.findValidNPCSpawnPosition(basePosition, 15);
				
				if (validPosition) {
					this.spawnNPC(npcType, validPosition);
					print(`🤖 NPC inicial ${npcType} spawneado en superficie real: ${validPosition}`);
				} else {
					// Respaldo: posición MUY ALTA para que sea visible
					const highPosition = basePosition.add(new Vector3(0, 100, 0));
					this.spawnNPC(npcType, highPosition);
					warn(`⚠️ NPC ${npcType} spawneado en posición elevada: ${highPosition}`);
				}
			}
		});

		// TAMBIÉN SPAWNEAR NPCs EN OTRAS ISLAS
		print("🔍 Spawneando NPCs en todas las islas...");
		
		const islandIds = ["pirate_cove", "marine_base", "jungle_temple", "desert_ruins", "ice_caverns", "volcano_forge"];
		
		islandIds.forEach((islandId) => {
			this.spawnNPCsOnIsland(islandId);
		});

		print("🤖 Todos los NPCs spawneados usando sistema de raycast");
	}

	public spawnNPCsOnIsland(islandId: string): void {
		const islandService = Dependency<IslandService>();
		const islandData = islandService.getIslandData(islandId);
		
		if (!islandData || !islandData.model) {
			warn(`❌ No se puede spawnear NPCs en isla: ${islandId}`);
			return;
		}

		// Obtener template de la isla para los spawn points originales
		const template = getIslandTemplate(islandId);
		if (!template) {
			warn(`❌ Template de isla no encontrado: ${islandId}`);
			return;
		}

		// Spawnear NPCs usando raycast para encontrar superficie real
		for (const npcSpawn of template.npcSpawns) {
			for (let i = 0; i < npcSpawn.maxActive; i++) {
				// Usar el spawn point original como centro aproximado
				const originalSpawnPoint = npcSpawn.spawnPoints[i % npcSpawn.spawnPoints.size()];
				
				// Buscar superficie real con raycast
				const validPosition = this.findValidNPCSpawnPosition(originalSpawnPoint, npcSpawn.respawnRadius);
				
				if (validPosition) {
					this.spawnNPC(npcSpawn.npcType, validPosition);
					print(`🤖 NPC ${npcSpawn.npcType} spawneado en ${islandId} en superficie real: ${validPosition}`);
				} else {
					warn(`⚠️ No se pudo encontrar superficie válida para NPC ${npcSpawn.npcType} en ${islandId}`);
				}
			}
		}
	}

	private findValidNPCSpawnPosition(centerPosition: Vector3, searchRadius: number): Vector3 | undefined {
		const maxAttempts = 15;
		
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			// Generar posición aleatoria en un radio alrededor del punto original
			const randomAngle = math.random() * math.pi * 2;
			const randomDistance = math.random() * searchRadius;
			
			const testX = centerPosition.X + math.cos(randomAngle) * randomDistance;
			const testZ = centerPosition.Z + math.sin(randomAngle) * randomDistance;
			
			// MÉTODO SIMPLE Y PROBADO: Raycast desde MUY ARRIBA hacia abajo
			const rayOrigin = new Vector3(testX, centerPosition.Y + 300, testZ); // 300 studs arriba
			const rayDirection = new Vector3(0, -500, 0); // 500 studs hacia abajo
			
			// Sin filtros complejos - permitir que detecte TODO
			const raycastParams = new RaycastParams();
			raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
			raycastParams.FilterDescendantsInstances = []; // NO filtrar nada inicialmente
			
			const raycastResult = Workspace.Raycast(rayOrigin, rayDirection, raycastParams);
			
			if (raycastResult && raycastResult.Instance) {
				const hitInstance = raycastResult.Instance;
				const hitPosition = raycastResult.Position;
				
				print(`🔍 RAYCAST HIT: ${hitInstance.Name} (${hitInstance.ClassName}) at Y=${hitPosition.Y}`);
				
				// VERIFICACIONES SIMPLES Y DIRECTAS:
				
				// 1. Debe estar por ENCIMA del nivel del agua (Y > 8)
				if (hitPosition.Y <= 8) {
					print(`❌ Posición demasiado baja (Y=${hitPosition.Y}) - probablemente agua`);
					continue;
				}
				
				// 2. NO debe ser océano
				if (hitInstance.Name === "Ocean" || hitInstance.Material === Enum.Material.Water) {
					print(`❌ Detectó agua: ${hitInstance.Name}`);
					continue;
				}
				
				// 3. Verificar superficie no muy inclinada (menos de 45 grados)
				const surfaceNormal = raycastResult.Normal;
				const angleFromVertical = math.acos(surfaceNormal.Dot(new Vector3(0, 1, 0)));
				
				if (angleFromVertical > math.rad(45)) {
					print(`❌ Superficie muy inclinada: ${math.deg(angleFromVertical)}°`);
					continue;
				}
				
				// 4. Verificar que no esté muy cerca de otros NPCs
				const proposedPosition = hitPosition.add(new Vector3(0, 3, 0)); // 3 studs arriba
				
				if (!this.isPositionFarFromOtherNPCs(proposedPosition, 8)) {
					print(`❌ Muy cerca de otro NPC`);
					continue;
				}
				
				// ✅ POSICIÓN VÁLIDA ENCONTRADA
				print(`✅ POSICIÓN VÁLIDA: ${proposedPosition} - Superficie: ${hitInstance.Name} (${hitInstance.ClassName})`);
				return proposedPosition;
			} else {
				print(`❌ Raycast no detectó nada en (${testX}, ${testZ})`);
			}
		}
		
		// RESPALDO: Si no encuentra nada, usar altura fija MUY ALTA
		const fallbackPosition = centerPosition.add(new Vector3(
			(math.random() - 0.5) * 10,
			100, // MUY ARRIBA para que sea visible
			(math.random() - 0.5) * 10
		));
		
		warn(`⚠️ NO SE ENCONTRÓ SUPERFICIE VÁLIDA después de ${maxAttempts} intentos`);
		warn(`🚨 USANDO POSICIÓN ELEVADA: ${fallbackPosition}`);
		warn(`💡 VERIFICA que hay terreno sólido en la isla, no solo plataformas generadas`);
		return fallbackPosition;
	}

	private isPositionFarFromOtherNPCs(position: Vector3, minDistance: number): boolean {
		for (const [, npcModel] of pairs(this.npcModels)) {
			if (npcModel && npcModel.PrimaryPart) {
				const distance = position.sub(npcModel.PrimaryPart.Position).Magnitude;
				if (distance < minDistance) {
					return false; // Demasiado cerca de otro NPC
				}
			}
		}
		return true; // Posición válida
	}

	private spawnNPC(templateId: string, position: Vector3): void {
		const template = getNPCTemplate(templateId);
		if (!template) {
			warn(`❌ Template de NPC no encontrada: ${templateId}`);
			return;
		}

		const npcId = `${templateId}_${tick()}`;
		
		const npcData: NPCData = {
			id: npcId,
			name: template.name,
			health: template.health,
			maxHealth: template.health,
			damage: template.damage,
			level: template.level,
			experienceReward: template.experienceReward,
			spawnPosition: position,
			respawnTime: template.respawnTime,
			attackRange: template.attackRange,
			detectionRange: template.detectionRange,
			isAlive: true,
			lastAttackedTime: 0
		};

		const npcModel = this.createNPCModel(template, position);
		
		this.activeNPCs.set(npcId, npcData);
		this.npcModels.set(npcId, npcModel);

		print(`🤖 NPC spawneado: ${template.displayName} (Nivel ${template.level}) en ${position}`);
	}

	private createNPCModel(template: NPCTemplate, position: Vector3): Model {
		const model = new Instance("Model");
		model.Name = template.name;
		model.Parent = Workspace;

		const humanoid = new Instance("Humanoid");
		humanoid.MaxHealth = template.health;
		humanoid.Health = template.health;
		humanoid.WalkSpeed = 8;
		humanoid.Parent = model;

		const head = new Instance("Part");
		head.Name = "Head";
		head.Size = new Vector3(2, 1, 1);
		head.BrickColor = new BrickColor("Light orange");
		head.TopSurface = Enum.SurfaceType.Smooth;
		head.BottomSurface = Enum.SurfaceType.Smooth;
		head.Parent = model;

		const torso = new Instance("Part");
		torso.Name = "Torso";
		torso.Size = new Vector3(2, 2, 1);
		torso.BrickColor = new BrickColor("Bright blue");
		torso.TopSurface = Enum.SurfaceType.Smooth;
		torso.BottomSurface = Enum.SurfaceType.Smooth;
		torso.Parent = model;

		const humanoidRootPart = new Instance("Part");
		humanoidRootPart.Name = "HumanoidRootPart";
		humanoidRootPart.Size = new Vector3(2, 2, 1);
		humanoidRootPart.Transparency = 1;
		humanoidRootPart.CanCollide = false;
		humanoidRootPart.Parent = model;

		humanoidRootPart.Position = position;
		head.Position = position.add(new Vector3(0, 1.5, 0));
		torso.Position = position;

		const neck = new Instance("Motor6D");
		neck.Name = "Neck";
		neck.Part0 = torso;
		neck.Part1 = head;
		neck.C1 = new CFrame(0, -0.5, 0);
		neck.Parent = torso;

		const rootJoint = new Instance("Motor6D");
		rootJoint.Name = "RootJoint";
		rootJoint.Part0 = humanoidRootPart;
		rootJoint.Part1 = torso;
		rootJoint.Parent = humanoidRootPart;

		const billboardGui = new Instance("BillboardGui");
		billboardGui.Size = new UDim2(0, 200, 0, 50);
		billboardGui.StudsOffset = new Vector3(0, 3, 0);
		billboardGui.Parent = head;

		const nameLabel = new Instance("TextLabel");
		nameLabel.Size = new UDim2(1, 0, 1, 0);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = `${template.displayName} (Lv.${template.level})`;
		nameLabel.TextColor3 = new Color3(1, 1, 1);
		nameLabel.TextScaled = true;
		nameLabel.Font = Enum.Font.SourceSansBold;
		nameLabel.Parent = billboardGui;

		const healthBar = new Instance("Frame");
		healthBar.Size = new UDim2(1, 0, 0.2, 0);
		healthBar.Position = new UDim2(0, 0, 0.8, 0);
		healthBar.BackgroundColor3 = new Color3(1, 0, 0);
		healthBar.BorderSizePixel = 0;
		healthBar.Parent = billboardGui;

		const healthBarBg = new Instance("Frame");
		healthBarBg.Size = new UDim2(1, 2, 1, 2);
		healthBarBg.Position = new UDim2(0, -1, 0, -1);
		healthBarBg.BackgroundColor3 = new Color3(0, 0, 0);
		healthBarBg.BorderSizePixel = 0;
		healthBarBg.ZIndex = healthBar.ZIndex - 1;
		healthBarBg.Parent = healthBar;

		return model;
	}

	// ========================================
	// MÉTODOS PÚBLICOS USADOS POR OTROS SERVICIOS
	// ========================================

	public getNPC(npcId: string): NPCData | undefined {
		return this.activeNPCs.get(npcId);
	}

	public damageNPC(npcId: string, damage: number, attacker: Player): boolean {
		const npcData = this.activeNPCs.get(npcId);
		if (!npcData || !npcData.isAlive) return false;

		npcData.health = math.max(0, npcData.health - damage);
		
		print(`💔 ${npcData.name} recibió ${damage} de daño de ${attacker.Name} - Salud: ${npcData.health}/${npcData.maxHealth}`);

		if (npcData.health <= 0) {
			this.npcKilled(npcId, attacker);
			return true;
		}

		return false;
	}

	public getAllNPCModels(): Map<string, Model> {
		return this.npcModels;
	}

	private npcKilled(npcId: string, killer: Player): void {
		const npcData = this.activeNPCs.get(npcId);
		if (!npcData || !npcData.isAlive) return;

		npcData.isAlive = false;
		
		const npcModel = this.npcModels.get(npcId);
		if (npcModel) {
			npcModel.Destroy();
		}

		print(`💀 ${npcData.name} fue derrotado por ${killer.Name} - EXP: +${npcData.experienceReward}`);
	}
} 
