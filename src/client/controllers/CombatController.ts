import { Controller, OnStart } from "@flamework/core";
import { Players, UserInputService, TweenService, RunService } from "@rbxts/services";
import { Events } from "client/network";
import { AttackType, DamageInfo } from "shared/types/combat";

@Controller()
export class CombatController implements OnStart {
	private player = Players.LocalPlayer;
	private mouse = this.player.GetMouse();
	private attacking = false;

	onStart(): void {
		this.setupInput();
		this.setupEventHandlers();
	}

	private setupInput(): void {
		// M1 - Click izquierdo
		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				this.performAttack("M1");
			}
		});

		// Habilidades con teclas
		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			
			if (input.KeyCode === Enum.KeyCode.Q) {
				this.performAttack("Skill1");
			} else if (input.KeyCode === Enum.KeyCode.E) {
				this.performAttack("Skill2");
			}
		});
	}

	private setupEventHandlers(): void {
		// Escuchar eventos de combate del servidor
		Events.onDamageDealt.connect((damageInfo) => {
			this.showDamageEffect(damageInfo);
		});

		Events.onAttackPerformed.connect((attacker, attackType, position) => {
			this.showAttackEffect(attacker, attackType, position);
		});

		Events.onPlayerDeath.connect((player, killer) => {
			this.showDeathEffect(player, killer);
		});

		Events.onHealthChanged.connect((player, newHealth, maxHealth) => {
			this.updateHealthDisplay(player, newHealth, maxHealth);
		});
	}

	private performAttack(attackType: AttackType): void {
		if (this.attacking) return;
		
		this.attacking = true;
		
		// Obtener posición del mouse para skills dirigidas
		const targetPosition = attackType !== "M1" ? this.mouse.Hit.Position : undefined;
		
		// Enviar evento al servidor
		Events.performAttack.fire(attackType, targetPosition);
		
		// Cooldown visual básico
		task.wait(0.1);
		this.attacking = false;
	}

	private showDamageEffect(damageInfo: DamageInfo): void {
		// Crear GUI de daño flotante
		const damageGui = new Instance("ScreenGui");
		const playerGui = this.player.FindFirstChild("PlayerGui") as PlayerGui;
		if (!playerGui) return;
		
		damageGui.Parent = playerGui;
		
		const damageLabel = new Instance("TextLabel");
		damageLabel.Parent = damageGui;
		damageLabel.Size = new UDim2(0, 100, 0, 50);
		damageLabel.Position = new UDim2(0.5, -50, 0.5, -25);
		damageLabel.BackgroundTransparency = 1;
		damageLabel.Font = Enum.Font.SourceSansBold;
		damageLabel.TextSize = damageInfo.isCrit ? 36 : 24;
		damageLabel.TextColor3 = damageInfo.isCrit ? Color3.fromRGB(255, 100, 100) : Color3.fromRGB(255, 255, 255);
		damageLabel.Text = `${math.floor(damageInfo.damage)}`;
		damageLabel.TextStrokeTransparency = 0;
		damageLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);

		// Animación de daño
		const tweenInfo = new TweenInfo(
			1.5,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out
		);

		const tween = TweenService.Create(damageLabel, tweenInfo, {
			Position: new UDim2(0.5, -50, 0.3, -25),
			TextTransparency: 1
		});

		tween.Play();
		tween.Completed.Connect(() => {
			damageGui.Destroy();
		});
	}

	private showAttackEffect(attacker: Player, attackType: AttackType, position: Vector3): void {
		// Solo mostrar efectos para otros jugadores (no para el jugador local)
		if (attacker === this.player) return;

		// Efectos visuales básicos según el tipo de ataque
		let effectColor = Color3.fromRGB(255, 255, 255);
		let effectSize = 5;

		switch (attackType) {
			case "M1":
				effectColor = Color3.fromRGB(200, 200, 200);
				effectSize = 3;
				break;
			case "Skill1":
				effectColor = Color3.fromRGB(100, 150, 255);
				effectSize = 7;
				break;
			case "Skill2":
				effectColor = Color3.fromRGB(255, 100, 100);
				effectSize = 10;
				break;
		}

		this.createExplosionEffect(position, effectColor, effectSize);
	}

	private createExplosionEffect(position: Vector3, color: Color3, size: number): void {
		const effect = new Instance("Explosion");
		effect.Position = position;
		effect.BlastRadius = size;
		effect.BlastPressure = 0; // Sin física para evitar molestar
		effect.Parent = game.Workspace;
	}

	private showDeathEffect(player: Player, killer?: Player): void {
		if (player === this.player) {
			// Mostrar mensaje de muerte para el jugador local
			const gui = new Instance("ScreenGui");
			const playerGui = this.player.FindFirstChild("PlayerGui") as PlayerGui;
			if (!playerGui) return;
			
			gui.Parent = playerGui;
			
			const frame = new Instance("Frame");
			frame.Parent = gui;
			frame.Size = new UDim2(1, 0, 1, 0);
			frame.BackgroundColor3 = Color3.fromRGB(255, 0, 0);
			frame.BackgroundTransparency = 0.7;
			
			const label = new Instance("TextLabel");
			label.Parent = frame;
			label.Size = new UDim2(1, 0, 0, 100);
			label.Position = new UDim2(0, 0, 0.5, -50);
			label.BackgroundTransparency = 1;
			label.Font = Enum.Font.SourceSansBold;
			label.TextSize = 48;
			label.TextColor3 = Color3.fromRGB(255, 255, 255);
			label.Text = killer ? `Killed by ${killer.Name}` : "You died!";
			label.TextStrokeTransparency = 0;
			
			// Remover después de 3 segundos
			task.wait(3);
			gui.Destroy();
		}
	}

	private updateHealthDisplay(player: Player, newHealth: number, maxHealth: number): void {
		if (player !== this.player) return;
		
		// Aquí puedes implementar una UI de salud
		// Por ahora solo imprimir en consola para debug
		print(`Health: ${newHealth}/${maxHealth} (${math.floor((newHealth/maxHealth) * 100)}%)`);
	}

	// Métodos públicos para otras partes del cliente
	public equipFruit(fruitId: string): void {
		Events.equipFruit.fire(fruitId);
	}

	public unequipFruit(): void {
		Events.unequipFruit.fire();
	}
} 
