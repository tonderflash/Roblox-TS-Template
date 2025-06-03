import { Controller, OnStart } from "@flamework/core";
import { Players, UserInputService, Workspace, TweenService } from "@rbxts/services";
import { Events } from "client/network";
import { HotbarItem } from "shared/network";
import { PIRATE_THEME, DeviceSpecs, DEVICE_CONFIGS } from "shared/types/gui";

@Controller({})
export class PlayerHUDController implements OnStart {
    private gui: ScreenGui | undefined;
    private levelLabel: TextLabel | undefined;
    private hotbarFrame: Frame | undefined;
    private hotbarSlots: Frame[] = [];
    private deviceSpecs: DeviceSpecs = DEVICE_CONFIGS.PC;
    
    // Player stats
    private level = 1;
    private experience = 0;
    private nextLevelExp = 100;
    
    // Hotbar data
    private hotbarItems: (HotbarItem | undefined)[] = [];
    private selectedSlot = 0;
    private readonly HOTBAR_SIZE = 9; // Como Minecraft

    onStart(): void {
        this.detectDeviceType();
        this.createHUD();
        this.setupInputHandling();
        this.setupNetworkEvents();
        this.initializeHotbar();
        
        print("🎮 PlayerHUDController iniciado - Dispositivo:", this.deviceSpecs.deviceType);
    }

    private detectDeviceType(): void {
        const camera = Workspace.CurrentCamera;
        if (!camera) {
            this.deviceSpecs = DEVICE_CONFIGS.PC;
            return;
        }

        const viewportSize = camera.ViewportSize;
        const isTouchEnabled = UserInputService.TouchEnabled;
        const isGamepadEnabled = UserInputService.GamepadEnabled;

        if (isTouchEnabled && !isGamepadEnabled) {
            if (viewportSize.X < 500) {
                this.deviceSpecs = DEVICE_CONFIGS.Mobile;
            } else {
                this.deviceSpecs = DEVICE_CONFIGS.Tablet;
            }
        } else if (isGamepadEnabled) {
            this.deviceSpecs = DEVICE_CONFIGS.Console;
        } else {
            this.deviceSpecs = DEVICE_CONFIGS.PC;
        }

        print(`📱 Dispositivo detectado para HUD: ${this.deviceSpecs.deviceType} (${viewportSize.X}x${viewportSize.Y})`);
    }

    private createHUD(): void {
        const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

        // Main ScreenGui
        this.gui = new Instance("ScreenGui");
        this.gui.Name = "PlayerHUD";
        this.gui.DisplayOrder = 50;
        this.gui.IgnoreGuiInset = true;
        this.gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
        this.gui.Parent = playerGui;

        this.createLevelDisplay();
        this.createHotbar();
        this.applyResponsiveScaling();
    }

    private createLevelDisplay(): void {
        if (!this.gui) return;

        // Container para el nivel (esquina superior izquierda)
        const levelContainer = new Instance("Frame");
        levelContainer.Name = "LevelContainer";
        levelContainer.Size = new UDim2(0, 150, 0, 40);
        levelContainer.Position = new UDim2(0, 20, 0, 20);
        levelContainer.BackgroundColor3 = PIRATE_THEME.backgroundColor;
        levelContainer.BorderColor3 = PIRATE_THEME.borderColor;
        levelContainer.BorderSizePixel = 2;
        levelContainer.Parent = this.gui;

        // Gradiente para el fondo
        const gradient = new Instance("UIGradient");
        gradient.Color = new ColorSequence([
            new ColorSequenceKeypoint(0, PIRATE_THEME.backgroundColor),
            new ColorSequenceKeypoint(1, PIRATE_THEME.secondaryColor)
        ]);
        gradient.Rotation = 45;
        gradient.Parent = levelContainer;

        // Esquinas redondeadas
        const corner = new Instance("UICorner");
        corner.CornerRadius = new UDim(0, 8);
        corner.Parent = levelContainer;

        // Label del nivel
        this.levelLabel = new Instance("TextLabel");
        this.levelLabel.Name = "LevelLabel";
        this.levelLabel.Size = new UDim2(1, -10, 1, 0);
        this.levelLabel.Position = new UDim2(0, 5, 0, 0);
        this.levelLabel.BackgroundTransparency = 1;
        this.levelLabel.Text = `⭐ Nivel ${this.level}`;
        this.levelLabel.TextColor3 = PIRATE_THEME.textColor;
        this.levelLabel.TextScaled = true;
        this.levelLabel.Font = Enum.Font.SourceSansBold;
        this.levelLabel.TextStrokeTransparency = 0;
        this.levelLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
        this.levelLabel.Parent = levelContainer;
    }

    private createHotbar(): void {
        if (!this.gui) return;

        // Container del hotbar (parte inferior central)
        this.hotbarFrame = new Instance("Frame");
        this.hotbarFrame.Name = "HotbarFrame";
        this.hotbarFrame.Size = new UDim2(0, this.HOTBAR_SIZE * 60 + 20, 0, 80);
        this.hotbarFrame.Position = new UDim2(0.5, -(this.HOTBAR_SIZE * 60 + 20) / 2, 1, -100);
        this.hotbarFrame.BackgroundColor3 = PIRATE_THEME.backgroundColor;
        this.hotbarFrame.BorderColor3 = PIRATE_THEME.borderColor;
        this.hotbarFrame.BorderSizePixel = 2;
        this.hotbarFrame.Parent = this.gui;

        // Esquinas redondeadas
        const corner = new Instance("UICorner");
        corner.CornerRadius = new UDim(0, 10);
        corner.Parent = this.hotbarFrame;

        // Layout para los slots
        const layout = new Instance("UIListLayout");
        layout.FillDirection = Enum.FillDirection.Horizontal;
        layout.HorizontalAlignment = Enum.HorizontalAlignment.Center;
        layout.VerticalAlignment = Enum.VerticalAlignment.Center;
        layout.Padding = new UDim(0, 5);
        layout.Parent = this.hotbarFrame;

        // Crear slots del hotbar
        this.createHotbarSlots();
    }

    private createHotbarSlots(): void {
        if (!this.hotbarFrame) return;

        for (let i = 0; i < this.HOTBAR_SIZE; i++) {
            const slot = this.createHotbarSlot(i);
            this.hotbarSlots.push(slot);
        }
    }

    private createHotbarSlot(index: number): Frame {
        const slot = new Instance("Frame");
        slot.Name = `HotbarSlot_${index}`;
        slot.Size = new UDim2(0, 50, 0, 50);
        slot.BackgroundColor3 = index === this.selectedSlot ? 
            PIRATE_THEME.accentColor : PIRATE_THEME.secondaryColor;
        slot.BorderColor3 = PIRATE_THEME.borderColor;
        slot.BorderSizePixel = 2;
        slot.Parent = this.hotbarFrame;

        // Esquinas redondeadas
        const corner = new Instance("UICorner");
        corner.CornerRadius = new UDim(0, 6);
        corner.Parent = slot;

        // Número del slot
        const slotNumber = new Instance("TextLabel");
        slotNumber.Name = "SlotNumber";
        slotNumber.Size = new UDim2(0, 15, 0, 15);
        slotNumber.Position = new UDim2(0, 2, 0, 2);
        slotNumber.BackgroundTransparency = 1;
        slotNumber.Text = tostring(index + 1);
        slotNumber.TextColor3 = PIRATE_THEME.textColor;
        slotNumber.TextScaled = true;
        slotNumber.Font = Enum.Font.SourceSansBold;
        slotNumber.TextStrokeTransparency = 0;
        slotNumber.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
        slotNumber.Parent = slot;

        // Icon del item
        const icon = new Instance("TextLabel");
        icon.Name = "Icon";
        icon.Size = new UDim2(0.6, 0, 0.6, 0);
        icon.Position = new UDim2(0.2, 0, 0.1, 0);
        icon.BackgroundTransparency = 1;
        icon.Text = "";
        icon.TextColor3 = PIRATE_THEME.textColor;
        icon.TextScaled = false;
        icon.TextSize = 20;
        icon.Font = Enum.Font.SourceSans;
        icon.TextXAlignment = Enum.TextXAlignment.Center;
        icon.TextYAlignment = Enum.TextYAlignment.Center;
        icon.Parent = slot;

        // Cantidad del item
        const amount = new Instance("TextLabel");
        amount.Name = "Amount";
        amount.Size = new UDim2(0, 15, 0, 12);
        amount.Position = new UDim2(1, -17, 1, -14);
        amount.BackgroundTransparency = 1;
        amount.Text = "";
        amount.TextColor3 = PIRATE_THEME.textColor;
        amount.TextScaled = true;
        amount.Font = Enum.Font.SourceSansBold;
        amount.TextStrokeTransparency = 0;
        amount.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
        amount.Parent = slot;

        // Click handler
        const button = new Instance("TextButton");
        button.Name = "ClickDetector";
        button.Size = new UDim2(1, 0, 1, 0);
        button.BackgroundTransparency = 1;
        button.Text = "";
        button.Parent = slot;

        button.MouseButton1Click.Connect(() => {
            this.selectHotbarSlot(index);
        });

        return slot;
    }

    private initializeHotbar(): void {
        // Inicializar hotbar vacío
        for (let i = 0; i < this.HOTBAR_SIZE; i++) {
            this.hotbarItems[i] = undefined;
        }
    }

    private applyResponsiveScaling(): void {
        if (!this.hotbarFrame || !this.levelLabel) return;

        // Ajustar tamaños según dispositivo
        if (this.deviceSpecs.deviceType === "Mobile") {
            // Hotbar más pequeño para móviles
            this.hotbarFrame.Size = new UDim2(0, this.HOTBAR_SIZE * 45 + 15, 0, 60);
            this.hotbarFrame.Position = new UDim2(0.5, -(this.HOTBAR_SIZE * 45 + 15) / 2, 1, -80);
            
            // Ajustar tamaño de slots
            for (let i = 0; i < this.hotbarSlots.size(); i++) {
                this.hotbarSlots[i].Size = new UDim2(0, 40, 0, 40);
            }
            
            // Level label más pequeño
            const levelContainer = this.levelLabel.Parent as Frame;
            levelContainer.Size = new UDim2(0, 120, 0, 30);
            
        } else if (this.deviceSpecs.deviceType === "Console") {
            // Hotbar más grande para consola
            this.hotbarFrame.Size = new UDim2(0, this.HOTBAR_SIZE * 70 + 25, 0, 90);
            this.hotbarFrame.Position = new UDim2(0.5, -(this.HOTBAR_SIZE * 70 + 25) / 2, 1, -120);
            
            // Ajustar tamaño de slots
            for (let i = 0; i < this.hotbarSlots.size(); i++) {
                this.hotbarSlots[i].Size = new UDim2(0, 60, 0, 60);
            }
        }
    }

    private setupInputHandling(): void {
        UserInputService.InputBegan.Connect((input, gameProcessed) => {
            if (gameProcessed) return;

            // Hotbar selection con números 1-9
            if (input.KeyCode.Value >= Enum.KeyCode.One.Value && 
                input.KeyCode.Value <= Enum.KeyCode.Nine.Value) {
                const slotIndex = input.KeyCode.Value - Enum.KeyCode.One.Value;
                if (slotIndex < this.HOTBAR_SIZE) {
                    this.selectHotbarSlot(slotIndex);
                }
            }
            
            // Mouse wheel para cambiar slot seleccionado
            else if (input.UserInputType === Enum.UserInputType.MouseWheel) {
                const delta = input.Position.Z;
                if (delta > 0) {
                    this.selectHotbarSlot((this.selectedSlot - 1 + this.HOTBAR_SIZE) % this.HOTBAR_SIZE);
                } else if (delta < 0) {
                    this.selectHotbarSlot((this.selectedSlot + 1) % this.HOTBAR_SIZE);
                }
            }
            
            // Click para usar item del slot seleccionado
            else if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                this.useSelectedHotbarItem();
            }
        });
    }

    private setupNetworkEvents(): void {
        // Eventos de nivel/experiencia (sin parámetro player - Flamework lo maneja automáticamente)
        Events.onLevelUp.connect((newLevel: number, totalExperience: number) => {
            this.updateLevel(newLevel, totalExperience);
            this.animateLevelUp();
        });

        Events.onStatsUpdated.connect((level: number, experience: number, nextLevelExp: number) => {
            this.level = level;
            this.experience = experience;
            this.nextLevelExp = nextLevelExp;
            this.updateLevelDisplay();
        });

        // Eventos del hotbar
        Events.onHotbarUpdated.connect((hotbarItems: (HotbarItem | undefined)[]) => {
            this.updateHotbar(hotbarItems);
        });

        Events.onHotbarSlotUsed.connect((slotIndex: number, item: HotbarItem) => {
            this.animateSlotUse(slotIndex);
        });
    }

    private selectHotbarSlot(slotIndex: number): void {
        if (slotIndex < 0 || slotIndex >= this.HOTBAR_SIZE) return;

        // Actualizar visual del slot anterior
        const oldSlot = this.hotbarSlots[this.selectedSlot];
        if (oldSlot) {
            oldSlot.BackgroundColor3 = PIRATE_THEME.secondaryColor;
        }

        // Actualizar slot seleccionado
        this.selectedSlot = slotIndex;
        const newSlot = this.hotbarSlots[this.selectedSlot];
        if (newSlot) {
            newSlot.BackgroundColor3 = PIRATE_THEME.accentColor;
        }

        print(`🎮 Slot ${slotIndex + 1} seleccionado`);
    }

    private useSelectedHotbarItem(): void {
        const item = this.hotbarItems[this.selectedSlot];
        if (item) {
            Events.useHotbarSlot.fire(this.selectedSlot);
            print(`🔧 Usando item: ${item.displayName} (Slot ${this.selectedSlot + 1})`);
        }
    }

    private updateLevel(newLevel: number, totalExperience: number): void {
        this.level = newLevel;
        this.experience = totalExperience;
        this.updateLevelDisplay();
    }

    private updateLevelDisplay(): void {
        if (this.levelLabel) {
            this.levelLabel.Text = `⭐ Nivel ${this.level}`;
        }
    }

    private updateHotbar(hotbarItems: (HotbarItem | undefined)[]): void {
        this.hotbarItems = hotbarItems;
        
        for (let i = 0; i < this.HOTBAR_SIZE; i++) {
            const slot = this.hotbarSlots[i];
            const item = hotbarItems[i];
            
            if (slot && item) {
                this.updateHotbarSlot(slot, item);
            } else if (slot) {
                this.clearHotbarSlot(slot);
            }
        }
        
        print("🎮 Hotbar actualizado");
    }

    private updateHotbarSlot(slot: Frame, item: HotbarItem): void {
        const icon = slot.FindFirstChild("Icon") as TextLabel;
        const amount = slot.FindFirstChild("Amount") as TextLabel;
        
        if (icon && amount) {
            icon.Text = item.icon;
            amount.Text = item.amount > 1 ? tostring(item.amount) : "";
        }
    }

    private clearHotbarSlot(slot: Frame): void {
        const icon = slot.FindFirstChild("Icon") as TextLabel;
        const amount = slot.FindFirstChild("Amount") as TextLabel;
        
        if (icon && amount) {
            icon.Text = "";
            amount.Text = "";
        }
    }

    private animateLevelUp(): void {
        if (!this.levelLabel) return;

        // Efecto de brillo al subir de nivel
        const originalColor = this.levelLabel.TextColor3;
        
        this.levelLabel.TextColor3 = Color3.fromRGB(255, 215, 0); // Dorado
        
        const tweenInfo = new TweenInfo(
            0.5,
            Enum.EasingStyle.Quad,
            Enum.EasingDirection.Out
        );

        const tween = TweenService.Create(this.levelLabel, tweenInfo, {
            TextColor3: originalColor
        });

        tween.Play();
        
        print(`🎉 ¡Subiste al nivel ${this.level}!`);
    }

    private animateSlotUse(slotIndex: number): void {
        const slot = this.hotbarSlots[slotIndex];
        if (!slot) return;

        // Efecto de "pulso" al usar un item
        const originalSize = slot.Size;
        
        const tweenInfo = new TweenInfo(
            0.1,
            Enum.EasingStyle.Quad,
            Enum.EasingDirection.Out,
            0,
            true // Reverses
        );

        const tween = TweenService.Create(slot, tweenInfo, {
            Size: new UDim2(originalSize.X.Scale * 1.1, originalSize.X.Offset * 1.1, 
                          originalSize.Y.Scale * 1.1, originalSize.Y.Offset * 1.1)
        });

        tween.Play();
    }

    // Métodos públicos para testing
    public addItemToHotbar(slotIndex: number, item: HotbarItem): void {
        if (slotIndex >= 0 && slotIndex < this.HOTBAR_SIZE) {
            this.hotbarItems[slotIndex] = item;
            const slot = this.hotbarSlots[slotIndex];
            if (slot) {
                this.updateHotbarSlot(slot, item);
            }
        }
    }

    public removeItemFromHotbar(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex < this.HOTBAR_SIZE) {
            this.hotbarItems[slotIndex] = undefined;
            const slot = this.hotbarSlots[slotIndex];
            if (slot) {
                this.clearHotbarSlot(slot);
            }
        }
    }

    public simulateLevelUp(newLevel: number): void {
        this.updateLevel(newLevel, this.experience + 100);
        this.animateLevelUp();
    }
} 
