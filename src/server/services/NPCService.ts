import { OnStart, Service } from "@flamework/core";
import { Dependency } from "@flamework/core";
import { Players, RunService, Workspace } from "@rbxts/services";
import { NPCData, NPCTemplate } from "shared/types/npc";
import { getNPCTemplate, NPC_TEMPLATES } from "shared/configs/npcs";
import { CombatService } from "./CombatService";
import { IslandService } from "./IslandService";

@Service()
export class NPCService implements OnStart {
	private activeNPCs = new Map<string, NPCData>();
	private npcModels = new Map<string, Model>();
	private respawnTimers = new Map<string, number>();

	constructor(private combatService: CombatService) {}

	onStart(): void {
		this.setupWorld();
		this.startNPCLoop();
		this.combatService.setNPCService(this);
		print("🤖 NPCService iniciado correctamente!");
	}

	private setupWorld(): void {
		task.wait(1);
		
		this.spawnInitialNPCs();
	}

	private spawnInitialNPCs(): void {
		const spawnPositions = [
			new Vector3(30, 25, 30),
			new Vector3(-30, 25, 30),
			new Vector3(30, 25, -30),
			new Vector3(-30, 25, -30),
			new Vector3(50, 25, 0)
		];

		const npcTypes = ["pirate_thug", "bandit_rookie", "pirate_thug", "bandit_rookie", "marine_soldier"];

		spawnPositions.forEach((position, index) => {
			const npcType = npcTypes[index];
			if (npcType) {
				this.spawnNPC(npcType, position);
			}
		});

		print("🤖 NPCs iniciales spawneados en spawn_island con alturas corregidas");
	}

	public spawnNPCsOnIsland(islandId: string): void {
		const islandService = Dependency<IslandService>();
		const islandData = islandService.getIslandData(islandId);
		
		if (!islandData || !islandData.model) {
			warn(`❌ No se puede spawnear NPCs en isla: ${islandId}`);
			return;
		}

		const npcMarkers: Part[] = [];
		islandData.model.GetChildren().forEach((child) => {
			if (child.IsA("Part") && child.Name.find("NPC_Spawn")[0]) {
				npcMarkers.push(child as Part);
			}
		});

		npcMarkers.forEach((marker) => {
			const markerInfo = marker.FindFirstChild("NPCInfo") as StringValue;
			if (markerInfo) {
				const nameParts = marker.Name.split("_");
				const npcType = nameParts[2];
				
				if (npcType && getNPCTemplate(npcType)) {
					this.spawnNPC(npcType, marker.Position);
					print(`🤖 NPC ${npcType} spawneado en ${islandId} en posición ${marker.Position}`);
				}
			}
		});
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

	private startNPCLoop(): void {
		RunService.Heartbeat.Connect(() => {
			this.updateNPCs();
			this.handleRespawns();
		});
	}

	private updateNPCs(): void {
		this.activeNPCs.forEach((npcData, npcId) => {
			if (!npcData.isAlive) return;

			const npcModel = this.npcModels.get(npcId);
			if (!npcModel) return;

			const nearbyPlayer = this.findNearestPlayer(npcData);
			if (nearbyPlayer) {
				this.handleNPCCombat(npcData, nearbyPlayer, npcModel);
			}
		});
	}

	private findNearestPlayer(npcData: NPCData): Player | undefined {
		let nearestPlayer: Player | undefined;
		let nearestDistance = npcData.detectionRange;

		Players.GetPlayers().forEach((player) => {
			const character = player.Character;
			const humanoidRootPart = character?.FindFirstChild("HumanoidRootPart") as Part;
			
			if (humanoidRootPart) {
				const distance = npcData.spawnPosition.sub(humanoidRootPart.Position).Magnitude;
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearestPlayer = player;
				}
			}
		});

		return nearestPlayer;
	}

	private handleNPCCombat(npcData: NPCData, target: Player, npcModel: Model): void {
		const currentTime = tick();
		
		if (currentTime - npcData.lastAttackedTime < 2) return;

		const character = target.Character;
		const targetRootPart = character?.FindFirstChild("HumanoidRootPart") as Part;
		if (!targetRootPart) return;

		const distance = npcData.spawnPosition.sub(targetRootPart.Position).Magnitude;
		
		if (distance <= npcData.attackRange) {
			npcData.lastAttackedTime = currentTime;
			
			this.npcAttackPlayer(npcData, target);
			
			print(`⚔️ ${npcData.name} atacó a ${target.Name} por ${npcData.damage} de daño`);
		}
	}

	private npcAttackPlayer(npcData: NPCData, target: Player): void {
		const combatData = this.combatService.getPlayerCombatData(target);
		if (!combatData) return;

		const damage = npcData.damage;
		combatData.stats.health = math.max(0, combatData.stats.health - damage);
		
		print(`💔 ${target.Name} recibió ${damage} de daño de ${npcData.name} - Salud: ${combatData.stats.health}/${combatData.stats.maxHealth}`);

		if (combatData.stats.health <= 0) {
			print(`💀 ${target.Name} fue derrotado por ${npcData.name}`);
		}
	}

	private handleRespawns(): void {
		const currentTime = tick();
		
		this.respawnTimers.forEach((respawnTime, npcId) => {
			if (currentTime >= respawnTime) {
				this.respawnNPC(npcId);
				this.respawnTimers.delete(npcId);
			}
		});
	}

	private respawnNPC(npcId: string): void {
		const npcData = this.activeNPCs.get(npcId);
		if (!npcData) return;

		npcData.isAlive = true;
		npcData.health = npcData.maxHealth;
		npcData.currentTarget = undefined;

		const oldModel = this.npcModels.get(npcId);
		if (oldModel) {
			oldModel.Destroy();
		}

		const template = getNPCTemplate(npcData.name.lower().gsub(" ", "_")[0] as string);
		if (template) {
			const newModel = this.createNPCModel(template, npcData.spawnPosition);
			this.npcModels.set(npcId, newModel);
		}

		print(`🔄 ${npcData.name} ha respawneado`);
	}

	public npcKilled(npcId: string, killer: Player): void {
		const npcData = this.activeNPCs.get(npcId);
		if (!npcData || !npcData.isAlive) return;

		npcData.isAlive = false;
		
		const npcModel = this.npcModels.get(npcId);
		if (npcModel) {
			npcModel.Destroy();
		}

		print(`💀 ${npcData.name} fue derrotado por ${killer.Name} - EXP: +${npcData.experienceReward}`);

		const respawnTime = tick() + npcData.respawnTime;
		this.respawnTimers.set(npcId, respawnTime);

		print(`⏰ ${npcData.name} respawneará en ${npcData.respawnTime} segundos`);
	}

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
} 
