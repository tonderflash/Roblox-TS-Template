import { OnStart, Service } from "@flamework/core";
import { Players, RunService, Workspace, TweenService } from "@rbxts/services";
import { Events } from "server/network";
import { PlayerBoat, BoatCombatData, BoatStats } from "shared/types/boat";
import { getBoatTemplate, calculateBoatStats, getBoatUpgrade, getBoatCustomization } from "shared/configs/boats";

interface BoatModel extends Model {
    HumanoidRootPart: Part;
    BodyVelocity: BodyVelocity;
    BodyAngularVelocity: BodyAngularVelocity;
}

@Service()
export class BoatService implements OnStart {
    private playerBoats = new Map<Player, PlayerBoat>();
    private boatModels = new Map<Player, BoatModel>();
    private boatCombatData = new Map<Player, BoatCombatData>();
    private activeTweens = new Map<Player, Tween>();

    onStart(): void {
        this.setupPlayerEvents();
        this.setupBoatEvents();
        this.startBoatLoop();
        print("🚢 BoatService iniciado correctamente!");
    }

    private setupPlayerEvents(): void {
        Players.PlayerAdded.Connect((player) => {
            this.initializePlayerBoat(player);
        });

        Players.PlayerRemoving.Connect((player) => {
            this.cleanupPlayerBoat(player);
        });
    }

    private setupBoatEvents(): void {
        Events.spawnBoat.connect((player) => {
            this.spawnBoat(player);
        });

        Events.despawnBoat.connect((player) => {
            this.despawnBoat(player);
        });

        Events.upgradeBoat.connect((player, upgradeId) => {
            this.upgradeBoat(player, upgradeId);
        });

        Events.customizeBoat.connect((player, customizationId) => {
            this.customizeBoat(player, customizationId);
        });

        Events.fireCannonAt.connect((player, targetPosition) => {
            this.fireCannonAt(player, targetPosition);
        });

        Events.repairBoat.connect((player) => {
            this.repairBoat(player);
        });
    }

    private initializePlayerBoat(player: Player): void {
        // Todos los jugadores empiezan con el Starter Sloop
        const starterBoat: PlayerBoat = {
            templateId: "starter_sloop",
            currentStats: calculateBoatStats("starter_sloop", []),
            upgrades: [],
            customizations: [],
            health: 100,
            isSpawned: false,
            lastUsed: 0
        };

        const combatData: BoatCombatData = {
            isInCombat: false,
            lastFiredTime: 0,
            cannonCooldown: 2.0 // 2 segundos base de cooldown
        };

        this.playerBoats.set(player, starterBoat);
        this.boatCombatData.set(player, combatData);

        print(`🚢 Barco inicializado para ${player.Name} - Starter Sloop`);
    }

    private cleanupPlayerBoat(player: Player): void {
        this.despawnBoat(player);
        this.playerBoats.delete(player);
        this.boatCombatData.delete(player);
        
        // Cancelar tweens activos
        const activeTween = this.activeTweens.get(player);
        if (activeTween) {
            activeTween.Cancel();
            this.activeTweens.delete(player);
        }
    }

    public spawnBoat(player: Player): boolean {
        const boat = this.playerBoats.get(player);
        if (!boat || boat.isSpawned) return false;

        const template = getBoatTemplate(boat.templateId);
        if (!template) {
            warn(`❌ Template de barco no encontrado: ${boat.templateId}`);
            return false;
        }

        // Crear modelo del barco
        const boatModel = this.createBoatModel(template, boat);
        
        // Posicionar cerca del jugador o en spawn por defecto
        const spawnPosition = boat.position || new Vector3(50, 10, 50);
        boatModel.SetPrimaryPartCFrame(new CFrame(spawnPosition));

        // Registrar el barco
        this.boatModels.set(player, boatModel);
        boat.isSpawned = true;
        boat.lastUsed = tick();

        print(`🚢 ${player.Name} spawneó su ${template.displayName}`);
        return true;
    }

    public despawnBoat(player: Player): boolean {
        const boat = this.playerBoats.get(player);
        const boatModel = this.boatModels.get(player);

        if (!boat || !boat.isSpawned || !boatModel) return false;

        // Guardar posición actual
        const rootPart = boatModel.FindFirstChild("HumanoidRootPart") as Part;
        if (rootPart) {
            boat.position = rootPart.Position;
            boat.rotation = rootPart.CFrame;
        }

        // Destruir modelo
        boatModel.Destroy();
        this.boatModels.delete(player);
        boat.isSpawned = false;

        print(`🚢 ${player.Name} despawneó su barco`);
        return true;
    }

    private createBoatModel(template: import("shared/types/boat").BoatTemplate, boat: PlayerBoat): BoatModel {
        // Crear modelo básico del barco
        const model = new Instance("Model");
        model.Name = `${template.displayName}_${tick()}`;
        model.Parent = Workspace;

        // Crear parte principal (HumanoidRootPart)
        const rootPart = new Instance("Part");
        rootPart.Name = "HumanoidRootPart";
        rootPart.Size = new Vector3(8, 3, 16); // Tamaño base del barco
        rootPart.Material = Enum.Material.Wood;
        rootPart.BrickColor = new BrickColor("Brown");
        rootPart.Anchored = false;
        rootPart.CanCollide = true;
        rootPart.Parent = model;

        // Crear vela
        const sail = new Instance("Part");
        sail.Name = "Sail";
        sail.Size = new Vector3(0.2, 12, 8);
        sail.Material = Enum.Material.Fabric;
        sail.BrickColor = new BrickColor("White"); // Color por defecto
        sail.Anchored = false;
        sail.CanCollide = false;
        sail.Parent = model;

        // Conectar vela al barco
        const sailWeld = new Instance("WeldConstraint");
        sailWeld.Part0 = rootPart;
        sailWeld.Part1 = sail;
        sailWeld.Parent = rootPart;

        // Posicionar vela
        sail.Position = rootPart.Position.add(new Vector3(0, 7, 0));

        // Crear mastil
        const mast = new Instance("Part");
        mast.Name = "Mast";
        mast.Size = new Vector3(0.5, 14, 0.5);
        mast.Material = Enum.Material.Wood;
        mast.BrickColor = new BrickColor("Dark orange");
        mast.Anchored = false;
        mast.CanCollide = false;
        mast.Parent = model;

        const mastWeld = new Instance("WeldConstraint");
        mastWeld.Part0 = rootPart;
        mastWeld.Part1 = mast;
        mastWeld.Parent = rootPart;

        mast.Position = rootPart.Position.add(new Vector3(0, 8, 0));

        // Crear cañones según el template
        for (let i = 0; i < boat.currentStats.cannonCount; i++) {
            const cannon = this.createCannon(rootPart, i);
            cannon.Parent = model;
        }

        // Agregar BodyVelocity y BodyAngularVelocity para movimiento
        const bodyVelocity = new Instance("BodyVelocity");
        bodyVelocity.MaxForce = new Vector3(4000, 0, 4000);
        bodyVelocity.Velocity = new Vector3(0, 0, 0);
        bodyVelocity.Parent = rootPart;

        const bodyAngularVelocity = new Instance("BodyAngularVelocity");
        bodyAngularVelocity.MaxTorque = new Vector3(0, 4000, 0);
        bodyAngularVelocity.AngularVelocity = new Vector3(0, 0, 0);
        bodyAngularVelocity.Parent = rootPart;

        // Aplicar customizaciones
        this.applyCustomizations(model, boat.customizations);

        // Establecer PrimaryPart
        model.PrimaryPart = rootPart;

        return model as BoatModel;
    }

    private createCannon(rootPart: Part, index: number): Part {
        const cannon = new Instance("Part");
        cannon.Name = `Cannon_${index}`;
        cannon.Size = new Vector3(1, 1, 3);
        cannon.Material = Enum.Material.Metal;
        cannon.BrickColor = new BrickColor("Dark stone grey");
        cannon.Anchored = false;
        cannon.CanCollide = false;

        const cannonWeld = new Instance("WeldConstraint");
        cannonWeld.Part0 = rootPart;
        cannonWeld.Part1 = cannon;
        cannonWeld.Parent = rootPart;

        // Posicionar cañones a los lados del barco
        const side = index % 2 === 0 ? 1 : -1;
        cannon.Position = rootPart.Position.add(new Vector3(side * 4, 1, 2 - index * 2));

        return cannon;
    }

    private applyCustomizations(model: Model, customizationIds: string[]): void {
        customizationIds.forEach(customizationId => {
            const customization = getBoatCustomization(customizationId);
            if (!customization) return;

            switch (customization.type) {
                case "sail_color":
                    const sail = model.FindFirstChild("Sail") as Part;
                    if (sail) {
                        // Mapear colores básicos
                        if (customization.id === "red_sail") {
                            sail.BrickColor = new BrickColor("Bright red");
                        } else if (customization.id === "black_sail") {
                            sail.BrickColor = new BrickColor("Really black");
                        } else if (customization.id === "gold_sail") {
                            sail.BrickColor = new BrickColor("Gold");
                        }
                    }
                    break;

                case "hull_design":
                    const rootPart = model.FindFirstChild("HumanoidRootPart") as Part;
                    if (rootPart) {
                        if (customization.id === "skull_hull") {
                            rootPart.BrickColor = new BrickColor("Really black");
                        } else if (customization.id === "dragon_hull") {
                            rootPart.BrickColor = new BrickColor("Bright red");
                        }
                    }
                    break;

                // Más customizaciones se pueden agregar aquí
            }
        });
    }

    public upgradeBoat(player: Player, upgradeId: string): boolean {
        const boat = this.playerBoats.get(player);
        if (!boat) return false;

        const upgrade = getBoatUpgrade(upgradeId);
        if (!upgrade) {
            warn(`❌ Upgrade de barco no encontrado: ${upgradeId}`);
            return false;
        }

        // Verificar si ya tiene el upgrade
        if (boat.upgrades.includes(upgradeId)) {
            print(`⚠️ ${player.Name} ya tiene el upgrade: ${upgrade.name}`);
            return false;
        }

        // Verificar prerequisitos
        if (upgrade.prerequisites) {
            for (const prereq of upgrade.prerequisites) {
                if (!boat.upgrades.includes(prereq)) {
                    print(`❌ ${player.Name} no tiene el prerequisito: ${prereq}`);
                    return false;
                }
            }
        }

        // TODO: Verificar que el jugador tenga suficiente dinero/materiales
        // Por ahora, simplemente aplicar el upgrade

        // Aplicar upgrade
        boat.upgrades.push(upgradeId);
        boat.currentStats = calculateBoatStats(boat.templateId, boat.upgrades);

        // Si el barco está spawneado, actualizar salud
        if (boat.isSpawned) {
            boat.health = math.min(boat.health, boat.currentStats.maxHealth);
        }

        print(`🔧 ${player.Name} aplicó upgrade: ${upgrade.name}`);
        return true;
    }

    public customizeBoat(player: Player, customizationId: string): boolean {
        const boat = this.playerBoats.get(player);
        if (!boat) return false;

        const customization = getBoatCustomization(customizationId);
        if (!customization) {
            warn(`❌ Customización de barco no encontrada: ${customizationId}`);
            return false;
        }

        // Verificar si ya tiene la customización
        if (boat.customizations.includes(customizationId)) {
            print(`⚠️ ${player.Name} ya tiene la customización: ${customization.name}`);
            return false;
        }

        // TODO: Verificar que el jugador tenga suficiente Robux
        // Por ahora, simplemente aplicar la customización

        // Aplicar customización
        boat.customizations.push(customizationId);

        // Si el barco está spawneado, aplicar cambios visuales
        if (boat.isSpawned) {
            const boatModel = this.boatModels.get(player);
            if (boatModel) {
                this.applyCustomizations(boatModel, boat.customizations);
            }
        }

        print(`🎨 ${player.Name} aplicó customización: ${customization.name}`);
        return true;
    }

    public fireCannonAt(player: Player, targetPosition: Vector3): boolean {
        const boat = this.playerBoats.get(player);
        const boatModel = this.boatModels.get(player);
        const combatData = this.boatCombatData.get(player);

        if (!boat || !boat.isSpawned || !boatModel || !combatData) return false;

        const currentTime = tick();
        
        // Verificar cooldown
        if (currentTime - combatData.lastFiredTime < combatData.cannonCooldown) {
            const timeLeft = combatData.cannonCooldown - (currentTime - combatData.lastFiredTime);
            print(`⏰ ${player.Name} debe esperar ${string.format("%.1f", timeLeft)}s para disparar`);
            return false;
        }

        const rootPart = boatModel.FindFirstChild("HumanoidRootPart") as Part;
        if (!rootPart) return false;

        // Calcular distancia y verificar rango
        const distance = rootPart.Position.sub(targetPosition).Magnitude;
        const maxRange = 100; // Rango máximo de cañones

        if (distance > maxRange) {
            print(`❌ ${player.Name} objetivo fuera de rango: ${math.floor(distance)}/${maxRange}`);
            return false;
        }

        // Crear proyectil de cañón
        this.createCannonball(rootPart.Position, targetPosition, boat.currentStats.cannonDamage, player);

        // Actualizar cooldown
        combatData.lastFiredTime = currentTime;
        combatData.isInCombat = true;

        print(`💥 ${player.Name} disparó cañón - Daño: ${boat.currentStats.cannonDamage}`);
        return true;
    }

    private createCannonball(startPosition: Vector3, targetPosition: Vector3, damage: number, shooter: Player): void {
        // Crear proyectil
        const cannonball = new Instance("Part");
        cannonball.Name = "Cannonball";
        cannonball.Size = new Vector3(1, 1, 1);
        cannonball.Shape = Enum.PartType.Ball;
        cannonball.Material = Enum.Material.Metal;
        cannonball.BrickColor = new BrickColor("Really black");
        cannonball.Position = startPosition.add(new Vector3(0, 5, 0));
        cannonball.CanCollide = false;
        cannonball.Parent = Workspace;

        // Agregar BodyVelocity para movimiento
        const bodyVelocity = new Instance("BodyVelocity");
        bodyVelocity.MaxForce = new Vector3(4000, 4000, 4000);
        
        // Calcular velocidad hacia el objetivo
        const direction = targetPosition.sub(startPosition).Unit;
        bodyVelocity.Velocity = direction.mul(50); // Velocidad del proyectil
        bodyVelocity.Parent = cannonball;

        // Efecto de trail
        const attachment0 = new Instance("Attachment");
        attachment0.Parent = cannonball;
        
        const trail = new Instance("Trail");
        trail.Attachment0 = attachment0;
        trail.Attachment1 = attachment0;
        trail.FaceCamera = true;
        trail.Lifetime = 0.5;
        trail.MinLength = 0;
        trail.Color = new ColorSequence(new Color3(1, 0.5, 0));
        trail.Parent = cannonball;

        // Detectar colisión
        cannonball.Touched.Connect((hit) => {
            const hitCharacter = hit.Parent;
            if (hitCharacter && hitCharacter.FindFirstChild("Humanoid")) {
                const hitPlayer = Players.GetPlayerFromCharacter(hitCharacter);
                if (hitPlayer && hitPlayer !== shooter) {
                    // Aplicar daño al jugador
                    this.applyCannonDamage(hitPlayer, damage, shooter);
                }
            }

            // Crear explosión visual
            const explosion = new Instance("Explosion");
            explosion.Position = cannonball.Position;
            explosion.BlastRadius = 10;
            explosion.BlastPressure = 100000;
            explosion.Parent = Workspace;

            // Destruir proyectil
            cannonball.Destroy();
        });

        // Destruir después de 5 segundos si no golpea nada
        task.wait(5);
        if (cannonball.Parent) {
            cannonball.Destroy();
        }
    }

    private applyCannonDamage(targetPlayer: Player, damage: number, attacker: Player): void {
        // Primero verificar si el objetivo tiene un barco spawneado
        const targetBoat = this.playerBoats.get(targetPlayer);
        if (targetBoat && targetBoat.isSpawned) {
            // Aplicar daño al barco
            const effectiveDamage = math.max(1, damage - targetBoat.currentStats.armor);
            targetBoat.health = math.max(0, targetBoat.health - effectiveDamage);

            print(`💥 Barco de ${targetPlayer.Name} recibió ${effectiveDamage} de daño de ${attacker.Name} - Salud: ${targetBoat.health}/${targetBoat.currentStats.maxHealth}`);

            // Si el barco se destruye
            if (targetBoat.health <= 0) {
                this.destroyBoat(targetPlayer, attacker);
            }
        } else {
            // Si no tiene barco, aplicar daño al personaje (integración con CombatService)
            print(`💥 ${targetPlayer.Name} recibió ${damage} de daño de cañón de ${attacker.Name}`);
        }
    }

    private destroyBoat(player: Player, destroyer?: Player): void {
        const boat = this.playerBoats.get(player);
        if (!boat) return;

        // Despawnear barco
        this.despawnBoat(player);

        // Restaurar salud del barco para próximo spawn
        boat.health = boat.currentStats.maxHealth;

        print(`💀 Barco de ${player.Name} fue destruido ${destroyer ? `por ${destroyer.Name}` : ""}`);
        print(`🔧 ${player.Name} puede volver a spawnear su barco`);
    }

    public repairBoat(player: Player): boolean {
        const boat = this.playerBoats.get(player);
        if (!boat) return false;

        // TODO: Verificar materiales/costo de reparación
        
        const healAmount = boat.currentStats.maxHealth * 0.5; // Reparar 50%
        boat.health = math.min(boat.currentStats.maxHealth, boat.health + healAmount);

        print(`🔧 ${player.Name} reparó su barco - Salud: ${boat.health}/${boat.currentStats.maxHealth}`);
        return true;
    }

    private startBoatLoop(): void {
        RunService.Heartbeat.Connect(() => {
            this.updateBoats();
        });
    }

    private updateBoats(): void {
        const currentTime = tick();

        // Limpiar estado de combate después de 10 segundos sin actividad
        this.boatCombatData.forEach((combatData, player) => {
            if (combatData.isInCombat && currentTime - combatData.lastFiredTime > 10) {
                combatData.isInCombat = false;
            }
        });
    }

    // Métodos públicos para otros servicios
    public getPlayerBoat(player: Player): PlayerBoat | undefined {
        return this.playerBoats.get(player);
    }

    public isPlayerInBoat(player: Player): boolean {
        const boat = this.playerBoats.get(player);
        return boat ? boat.isSpawned : false;
    }

    public getBoatModel(player: Player): BoatModel | undefined {
        return this.boatModels.get(player);
    }
} 
