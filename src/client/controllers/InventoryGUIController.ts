import { Controller, OnStart } from "@flamework/core";
import { Players, UserInputService, GuiService, RunService, Workspace } from "@rbxts/services";
import { Events } from "client/network";
import { HotbarItem } from "shared/network";
import { 
    GUIState, 
    GUITab, 
    InventoryCategory, 
    DeviceSpecs, 
    DEVICE_CONFIGS, 
    PIRATE_THEME,
    InventorySlot 
} from "shared/types/gui";
import { RESOURCES, getResource } from "shared/configs/resources";

@Controller({})
export class InventoryGUIController implements OnStart {
    private gui: ScreenGui | undefined;
    private mainFrame: Frame | undefined;
    private inventoryTab: ScrollingFrame | undefined;
    private craftingTab: ScrollingFrame | undefined;
    private currentTab: GUITab = GUITab.INVENTORY;
    private isOpen = false;
    private deviceSpecs: DeviceSpecs = DEVICE_CONFIGS.PC;
    private inventorySlots: Frame[] = [];
    
    // NUEVO: Map para trackear qué tipo de recurso está en qué slot
    private resourceSlotMapping = new Map<string, number>();
    
    // MEJORADO: Sistema de Drag & Drop completamente reescrito
    private isDragging = false;
    private dragFrame: Frame | undefined;
    private dragStartSlot: Frame | undefined;
    private dragItem: HotbarItem | undefined;
    private lastClickTime = 0;
    private readonly DOUBLE_CLICK_TIME = 0.3; // Reducido a 300ms para mejor detección
    private dragConnection: RBXScriptConnection | undefined; // Para RunService
    private dragOffset = new Vector2(0, 0); // Offset del mouse cuando inicia el drag
    
    // NUEVO: Para solucionar ClipDescendants problema
    private dragSurface: Frame | undefined; // Frame sin ClipDescendants para drag
    
    private playerResources = new Map<string, number>([
        ["wood", 0],
        ["rope", 0], 
        ["cloth", 0],
        ["iron", 0]
    ]);

    onStart(): void {
        this.detectDeviceType();
        this.createGUI();
        this.setupInputHandling();
        this.setupNetworkEvents();
        
        print("🖥️ InventoryGUIController iniciado - Dispositivo:", this.deviceSpecs.deviceType);
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

        // Detectar tipo de dispositivo basado en viewport y input methods
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

        print(`📱 Dispositivo detectado: ${this.deviceSpecs.deviceType} (${viewportSize.X}x${viewportSize.Y})`);
    }

    private createGUI(): void {
        const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

        // Main ScreenGui
        this.gui = new Instance("ScreenGui");
        this.gui.Name = "InventorySystem";
        this.gui.DisplayOrder = 100;
        this.gui.IgnoreGuiInset = true;
        this.gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
        this.gui.Parent = playerGui;

        // Main Frame con theme pirata
        this.mainFrame = new Instance("Frame");
        this.mainFrame.Name = "MainFrame";
        this.mainFrame.Size = new UDim2(0, 600, 0, 450);
        this.mainFrame.Position = new UDim2(0.5, -300, 0.5, -225);
        this.mainFrame.BackgroundColor3 = PIRATE_THEME.backgroundColor;
        this.mainFrame.BorderColor3 = PIRATE_THEME.borderColor;
        this.mainFrame.BorderSizePixel = 3;
        this.mainFrame.Visible = false;
        this.mainFrame.Parent = this.gui;

        // Border ornamentado estilo pirata
        const borderFrame = new Instance("Frame");
        borderFrame.Name = "BorderFrame";
        borderFrame.Size = new UDim2(1, 6, 1, 6);
        borderFrame.Position = new UDim2(0, -3, 0, -3);
        borderFrame.BackgroundColor3 = PIRATE_THEME.accentColor;
        borderFrame.BorderSizePixel = 0;
        borderFrame.ZIndex = this.mainFrame.ZIndex - 1;
        borderFrame.Parent = this.mainFrame;

        // Title Bar
        this.createTitleBar();
        
        // Tab Buttons
        this.createTabButtons();
        
        // Inventory Tab
        this.createInventoryTab();
        
        // Crafting Tab  
        this.createCraftingTab();

        // Responsive scaling
        this.applyResponsiveScaling();
    }

    private createTitleBar(): void {
        if (!this.mainFrame) return;

        const titleBar = new Instance("Frame");
        titleBar.Name = "TitleBar";
        titleBar.Size = new UDim2(1, 0, 0, 50);
        titleBar.BackgroundColor3 = PIRATE_THEME.primaryColor;
        titleBar.BorderSizePixel = 0;
        titleBar.Parent = this.mainFrame;

        const title = new Instance("TextLabel");
        title.Name = "Title";
        title.Size = new UDim2(1, -100, 1, 0);
        title.Position = new UDim2(0, 10, 0, 0);
        title.BackgroundTransparency = 1;
        title.Text = "🏴‍☠️ INVENTARIO PIRATA";
        title.TextColor3 = PIRATE_THEME.textColor;
        title.TextScaled = true;
        title.Font = Enum.Font.SourceSansBold;
        title.TextXAlignment = Enum.TextXAlignment.Left;
        title.Parent = titleBar;

        // Close Button
        const closeButton = new Instance("TextButton");
        closeButton.Name = "CloseButton";
        closeButton.Size = new UDim2(0, 40, 0, 40);
        closeButton.Position = new UDim2(1, -50, 0, 5);
        closeButton.BackgroundColor3 = PIRATE_THEME.errorColor;
        closeButton.Text = "✕";
        closeButton.TextColor3 = PIRATE_THEME.textColor;
        closeButton.TextScaled = true;
        closeButton.Font = Enum.Font.SourceSansBold;
        closeButton.Parent = titleBar;

        closeButton.MouseButton1Click.Connect(() => {
            this.closeInventory();
        });
    }

    private createTabButtons(): void {
        if (!this.mainFrame) return;

        const tabContainer = new Instance("Frame");
        tabContainer.Name = "TabContainer";
        tabContainer.Size = new UDim2(1, 0, 0, 40);
        tabContainer.Position = new UDim2(0, 0, 0, 50);
        tabContainer.BackgroundColor3 = PIRATE_THEME.secondaryColor;
        tabContainer.BorderSizePixel = 0;
        tabContainer.Parent = this.mainFrame;

        // Inventory Tab Button
        const inventoryButton = new Instance("TextButton");
        inventoryButton.Name = "InventoryButton";
        inventoryButton.Size = new UDim2(0.5, -2, 1, 0);
        inventoryButton.Position = new UDim2(0, 0, 0, 0);
        inventoryButton.BackgroundColor3 = PIRATE_THEME.accentColor;
        inventoryButton.Text = "📦 INVENTARIO";
        inventoryButton.TextColor3 = PIRATE_THEME.textColor;
        inventoryButton.TextScaled = true;
        inventoryButton.Font = Enum.Font.SourceSansBold;
        inventoryButton.Parent = tabContainer;

        // Crafting Tab Button
        const craftingButton = new Instance("TextButton");
        craftingButton.Name = "CraftingButton";
        craftingButton.Size = new UDim2(0.5, -2, 1, 0);
        craftingButton.Position = new UDim2(0.5, 2, 0, 0);
        craftingButton.BackgroundColor3 = PIRATE_THEME.primaryColor;
        craftingButton.Text = "🔨 CRAFTING";
        craftingButton.TextColor3 = PIRATE_THEME.textColor;
        craftingButton.TextScaled = true;
        craftingButton.Font = Enum.Font.SourceSansBold;
        craftingButton.Parent = tabContainer;

        // Tab switching logic
        inventoryButton.MouseButton1Click.Connect(() => {
            this.switchTab(GUITab.INVENTORY);
            inventoryButton.BackgroundColor3 = PIRATE_THEME.accentColor;
            craftingButton.BackgroundColor3 = PIRATE_THEME.primaryColor;
        });

        craftingButton.MouseButton1Click.Connect(() => {
            this.switchTab(GUITab.CRAFTING);
            craftingButton.BackgroundColor3 = PIRATE_THEME.accentColor;
            inventoryButton.BackgroundColor3 = PIRATE_THEME.primaryColor;
        });
    }

    private createInventoryTab(): void {
        if (!this.mainFrame) return;

        this.inventoryTab = new Instance("ScrollingFrame");
        this.inventoryTab.Name = "InventoryTab";
        this.inventoryTab.Size = new UDim2(1, -20, 1, -120);
        this.inventoryTab.Position = new UDim2(0, 10, 0, 100);
        this.inventoryTab.BackgroundColor3 = PIRATE_THEME.backgroundColor;
        this.inventoryTab.BorderColor3 = PIRATE_THEME.borderColor;
        this.inventoryTab.ScrollBarThickness = 8;
        this.inventoryTab.ScrollBarImageColor3 = PIRATE_THEME.accentColor;
        this.inventoryTab.Parent = this.mainFrame;
        
        // CRÍTICO: Habilitar ClipDescendants para el scrolling normal
        this.inventoryTab.ClipsDescendants = true;

        // NUEVO: Crear superficie de drag sin ClipDescendants
        this.createDragSurface();

        // Grid Layout para slots
        const gridLayout = new Instance("UIGridLayout");
        gridLayout.CellSize = new UDim2(0, this.deviceSpecs.slotSize, 0, this.deviceSpecs.slotSize);
        gridLayout.CellPadding = new UDim2(0, 5, 0, 5);
        gridLayout.FillDirection = Enum.FillDirection.Horizontal;
        gridLayout.SortOrder = Enum.SortOrder.LayoutOrder;
        gridLayout.StartCorner = Enum.StartCorner.TopLeft;
        gridLayout.Parent = this.inventoryTab;

        // Crear slots del inventario
        this.createInventorySlots();
    }

    private createInventorySlots(): void {
        if (!this.inventoryTab) return;

        const totalSlots = this.deviceSpecs.gridSize.X * this.deviceSpecs.gridSize.Y;
        
        for (let i = 0; i < totalSlots; i++) {
            const slot = this.createInventorySlot(i);
            this.inventorySlots.push(slot);
        }
    }

    private createInventorySlot(index: number): Frame {
        const slot = new Instance("Frame");
        slot.Name = `Empty_Slot_${index}`;
        slot.BackgroundColor3 = PIRATE_THEME.secondaryColor;
        slot.BorderColor3 = PIRATE_THEME.borderColor;
        slot.BorderSizePixel = 2;
        slot.LayoutOrder = index;
        slot.Parent = this.inventoryTab;

        // NUEVO: Inicializar atributos como vacío explícitamente
        slot.SetAttribute("ResourceType", "");
        slot.SetAttribute("Amount", 0);
        slot.SetAttribute("DisplayName", "");

        // Icon - MEJORADO: Configuración específica para emojis
        const icon = new Instance("TextLabel");
        icon.Name = "Icon";
        icon.Size = new UDim2(0.7, 0, 0.6, 0);
        icon.Position = new UDim2(0.15, 0, 0.05, 0);
        icon.BackgroundTransparency = 1;
        icon.Text = ""; // Will be set with emoji when item is added
        icon.TextColor3 = PIRATE_THEME.textColor;
        icon.TextScaled = false; // CAMBIADO: No escalar para mejor renderizado
        icon.TextSize = 28; // CAMBIADO: Reducido para mejor compatibilidad
        icon.Font = Enum.Font.SourceSans; // CAMBIADO: Font más compatible con emojis en Roblox
        icon.TextXAlignment = Enum.TextXAlignment.Center;
        icon.TextYAlignment = Enum.TextYAlignment.Center;
        icon.Parent = slot;

        // Amount Label
        const amount = new Instance("TextLabel");
        amount.Name = "Amount";
        amount.Size = new UDim2(0.8, 0, 0.25, 0);
        amount.Position = new UDim2(0.1, 0, 0.7, 0);
        amount.BackgroundTransparency = 1;
        amount.Text = "";
        amount.TextColor3 = PIRATE_THEME.textColor;
        amount.TextScaled = true;
        amount.Font = Enum.Font.SourceSansBold;
        amount.TextXAlignment = Enum.TextXAlignment.Center;
        amount.Parent = slot;

        // MEJORADO: Detector de eventos más robusto
        const detector = new Instance("TextButton");
        detector.Name = "EventDetector";
        detector.Size = new UDim2(1, 0, 1, 0);
        detector.BackgroundTransparency = 1;
        detector.Text = "";
        detector.Parent = slot;

        // MEJORADO: Manejo de clicks más preciso
        detector.MouseButton1Click.Connect(() => {
            this.handleSlotClick(slot);
        });

        // MEJORADO: Drag iniciado con MouseButton1Down
        detector.MouseButton1Down.Connect((x: number, y: number) => {
            this.handleDragStart(slot, new Vector2(x, y));
        });

        return slot;
    }

    private createCraftingTab(): void {
        if (!this.mainFrame) return;

        this.craftingTab = new Instance("ScrollingFrame");
        this.craftingTab.Name = "CraftingTab";
        this.craftingTab.Size = new UDim2(1, -20, 1, -120);
        this.craftingTab.Position = new UDim2(0, 10, 0, 100);
        this.craftingTab.BackgroundColor3 = PIRATE_THEME.backgroundColor;
        this.craftingTab.BorderColor3 = PIRATE_THEME.borderColor;
        this.craftingTab.ScrollBarThickness = 8;
        this.craftingTab.ScrollBarImageColor3 = PIRATE_THEME.accentColor;
        this.craftingTab.Visible = false;
        this.craftingTab.Parent = this.mainFrame;

        // Crear recipes básicos
        this.createBasicRecipes();
    }

    private createBasicRecipes(): void {
        // Stone Pick Recipe
        this.createRecipeSlot("stone_pick", "🔨 Stone Pick", {
            wood: 25,
            iron: 15, 
            rope: 10
        });

        // Stone Hatchet Recipe  
        this.createRecipeSlot("stone_hatchet", "🪓 Stone Hatchet", {
            wood: 20,
            iron: 10,
            rope: 15
        });

        // Simple Boat Recipe
        this.createRecipeSlot("simple_boat", "⛵ Simple Boat", {
            wood: 100,
            rope: 50,
            cloth: 25,
            iron: 10
        });
    }

    private createRecipeSlot(recipeId: string, recipeName: string, requirements: Record<string, number>): void {
        if (!this.craftingTab) return;

        const recipeFrame = new Instance("Frame");
        recipeFrame.Name = recipeId;
        recipeFrame.Size = new UDim2(1, -10, 0, 120);
        recipeFrame.BackgroundColor3 = PIRATE_THEME.secondaryColor;
        recipeFrame.BorderColor3 = PIRATE_THEME.borderColor;
        recipeFrame.BorderSizePixel = 2;
        recipeFrame.Parent = this.craftingTab;

        // Recipe Title
        const title = new Instance("TextLabel");
        title.Size = new UDim2(1, 0, 0, 30);
        title.BackgroundTransparency = 1;
        title.Text = recipeName;
        title.TextColor3 = PIRATE_THEME.textColor;
        title.TextScaled = true;
        title.Font = Enum.Font.SourceSansBold;
        title.Parent = recipeFrame;

        // Requirements
        const reqContainer = new Instance("Frame");
        reqContainer.Size = new UDim2(1, 0, 0, 60);
        reqContainer.Position = new UDim2(0, 0, 0, 30);
        reqContainer.BackgroundTransparency = 1;
        reqContainer.Parent = recipeFrame;

        let reqIndex = 0;
        for (const [resource, amount] of pairs(requirements)) {
            const reqLabel = new Instance("TextLabel");
            reqLabel.Size = new UDim2(0.25, -5, 1, 0);
            reqLabel.Position = new UDim2(reqIndex * 0.25, 5, 0, 0);
            reqLabel.BackgroundTransparency = 1;
            reqLabel.Text = `${resource}: ${amount}`;
            reqLabel.TextColor3 = this.hasEnoughResources(resource, amount) ? 
                PIRATE_THEME.successColor : PIRATE_THEME.errorColor;
            reqLabel.TextScaled = true;
            reqLabel.Font = Enum.Font.SourceSans;
            reqLabel.Parent = reqContainer;
            reqIndex++;
        }

        // Craft Button
        const craftButton = new Instance("TextButton");
        craftButton.Size = new UDim2(0.3, 0, 0, 25);
        craftButton.Position = new UDim2(0.35, 0, 0, 90);
        craftButton.BackgroundColor3 = this.canCraftRecipe(requirements) ? 
            PIRATE_THEME.successColor : PIRATE_THEME.errorColor;
        craftButton.Text = "CRAFT";
        craftButton.TextColor3 = PIRATE_THEME.textColor;
        craftButton.TextScaled = true;
        craftButton.Font = Enum.Font.SourceSansBold;
        craftButton.Parent = recipeFrame;

        craftButton.MouseButton1Click.Connect(() => {
            if (this.canCraftRecipe(requirements)) {
                this.craftItem(recipeId, requirements);
            }
        });
    }

    private hasEnoughResources(resourceType: string, requiredAmount: number): boolean {
        const currentAmount = this.playerResources.get(resourceType) || 0;
        return currentAmount >= requiredAmount;
    }

    private canCraftRecipe(requirements: Record<string, number>): boolean {
        for (const [resource, amount] of pairs(requirements)) {
            if (!this.hasEnoughResources(resource, amount)) {
                return false;
            }
        }
        return true;
    }

    private craftItem(recipeId: string, requirements: Record<string, number>): void {
        print(`🔨 Crafting ${recipeId}...`);
        Events.craftItem.fire(recipeId);
        
        // Consumir recursos temporalmente (el servidor confirmará)
        for (const [resource, amount] of pairs(requirements)) {
            const current = this.playerResources.get(resource) || 0;
            this.playerResources.set(resource, current - amount);
        }
        
        this.refreshInventoryDisplay();
        this.refreshCraftingDisplay();
    }

    private applyResponsiveScaling(): void {
        if (!this.mainFrame) return;

        // Ajustar tamaño según dispositivo - TAMAÑOS MÁS PEQUEÑOS
        if (this.deviceSpecs.deviceType === "Mobile") {
            this.mainFrame.Size = new UDim2(0.85, 0, 0.65, 0); // REDUCIDO: Era 0.9x0.8, ahora 0.85x0.65
            this.mainFrame.Position = new UDim2(0.075, 0, 0.175, 0); // AJUSTADO: Para centrar
        } else if (this.deviceSpecs.deviceType === "Tablet") {
            this.mainFrame.Size = new UDim2(0.7, 0, 0.6, 0); // REDUCIDO: Era 0.8x0.7, ahora 0.7x0.6
            this.mainFrame.Position = new UDim2(0.15, 0, 0.2, 0); // AJUSTADO: Para centrar
        }
    }

    private switchTab(tab: GUITab): void {
        this.currentTab = tab;
        
        if (this.inventoryTab && this.craftingTab) {
            this.inventoryTab.Visible = tab === GUITab.INVENTORY;
            this.craftingTab.Visible = tab === GUITab.CRAFTING;
        }
        
        print(`📑 Switched to ${tab} tab`);
    }

    private setupInputHandling(): void {
        UserInputService.InputBegan.Connect((input, gameProcessed) => {
            if (gameProcessed) return;

            if (input.KeyCode === Enum.KeyCode.P) {
                this.toggleInventory();
            } else if (input.KeyCode === Enum.KeyCode.Escape && this.isOpen) {
                this.closeInventory();
            }
        });

        // MEJORADO: Manejo global de mouse up para drag & drop
        UserInputService.InputEnded.Connect((input, gameProcessed) => {
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                if (this.isDragging) {
                    this.handleDragEnd();
                }
            }
        });
    }

    private setupNetworkEvents(): void {
        Events.onInventoryOpened.connect(() => {
            this.openInventory();
        });

        Events.onInventoryClosed.connect(() => {
            this.closeInventory();
        });

        Events.onResourceAdded.connect((resourceType: string, amount: number) => {
            this.addResource(resourceType, amount);
        });

        Events.onCraftingCompleted.connect((recipeId: string, success: boolean) => {
            if (success) {
                print(`✅ Successfully crafted ${recipeId}`);
            } else {
                print(`❌ Failed to craft ${recipeId}`);
            }
            this.refreshCraftingDisplay();
        });
    }

    public toggleInventory(): void {
        if (this.isOpen) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    public openInventory(): void {
        if (!this.mainFrame) return;
        
        this.isOpen = true;
        this.mainFrame.Visible = true;
        
        // Animación de entrada
        this.mainFrame.Size = new UDim2(0, 0, 0, 0);
        this.mainFrame.TweenSize(
            new UDim2(0, 600, 0, 450),
            Enum.EasingDirection.Out,
            Enum.EasingStyle.Back,
            0.3
        );
        
        this.refreshInventoryDisplay();
        print("📦 Inventory opened");
    }

    public closeInventory(): void {
        if (!this.mainFrame) return;
        
        this.isOpen = false;
        
        // Animación de salida
        this.mainFrame.TweenSize(
            new UDim2(0, 0, 0, 0),
            Enum.EasingDirection.In,
            Enum.EasingStyle.Back,
            0.2,
            false,
            () => {
                this.mainFrame!.Visible = false;
            }
        );
        
        print("📦 Inventory closed");
    }

    public addResource(resourceType: string, amount: number): void {
        const current = this.playerResources.get(resourceType) || 0;
        
        // NUEVO: Obtener información del recurso para validar stackSize
        const resourceInfo = getResource(resourceType);
        const maxStack = resourceInfo ? math.min(resourceInfo.stackSize, 100) : 100; // Límite máximo de 100
        
        // NUEVO: Validar que no exceda el límite de stack
        const newAmount = math.min(current + amount, maxStack);
        const actualAdded = newAmount - current;
        
        this.playerResources.set(resourceType, newAmount);
        
        // MEJORADO: Debugging detallado para detectar problemas de stackeo
        print(`📦 Added ${actualAdded}x ${resourceType} (Total: ${newAmount})`);
        print(`🔍 DEBUG: Current slot mapping:`, this.resourceSlotMapping);
        print(`🔍 DEBUG: All resources:`, this.playerResources);
        
        // NUEVO: Verificar integridad del mapping antes de refresh
        this.validateSlotMapping();
        
        // MEJORADO: Mensaje más informativo
        if (actualAdded < amount) {
            print(`📦 Added ${actualAdded}x ${resourceType} (Total: ${newAmount}) - ${amount - actualAdded} lost due to stack limit`);
        } else {
            print(`📦 Added ${actualAdded}x ${resourceType} (Total: ${newAmount})`);
        }
        
        this.refreshInventoryDisplay();
        this.refreshCraftingDisplay();
    }

    // NUEVO: Método para validar que el mapping está correcto
    private validateSlotMapping(): void {
        for (const [resourceType, slotIndex] of this.resourceSlotMapping) {
            const slot = this.inventorySlots[slotIndex];
            if (!slot) {
                print(`❌ ERROR: Slot ${slotIndex} for ${resourceType} doesn't exist!`);
                this.resourceSlotMapping.delete(resourceType);
                continue;
            }
            
            const slotResourceType = slot.GetAttribute("ResourceType") as string;
            if (slotResourceType && slotResourceType !== resourceType) {
                print(`❌ ERROR: Slot ${slotIndex} mapping mismatch! Expected: ${resourceType}, Found: ${slotResourceType}`);
                // Corregir el mapping
                this.resourceSlotMapping.delete(resourceType);
            }
        }
    }

    private refreshInventoryDisplay(): void {
        // ARREGLADO: Lógica completamente reescrita para prevenir stackeo incorrecto
        
        // Paso 1: Actualizar slots existentes y limpiar los que ya no tienen recursos
        for (const [resourceType, slotIndex] of this.resourceSlotMapping) {
            const amount = this.playerResources.get(resourceType) || 0;
            const slot = this.inventorySlots[slotIndex];
            
            if (amount > 0) {
                // Actualizar slot existente
                this.updateSlotDisplay(slot, resourceType, amount, slotIndex);
            } else {
                // Limpiar slot vacío y remover del mapping
                this.clearSlot(slot, slotIndex);
                this.resourceSlotMapping.delete(resourceType);
            }
        }
        
        // Paso 2: Asignar nuevos recursos a slots vacíos
        for (const [resourceType, amount] of this.playerResources) {
            if (amount > 0 && !this.resourceSlotMapping.has(resourceType)) {
                // Buscar el primer slot vacío
                const emptySlotIndex = this.findEmptySlotIndex();
                if (emptySlotIndex !== -1) {
                    const slot = this.inventorySlots[emptySlotIndex];
                    this.updateSlotDisplay(slot, resourceType, amount, emptySlotIndex);
                    this.resourceSlotMapping.set(resourceType, emptySlotIndex);
                } else {
                    print(`⚠️ No hay slots vacíos para ${resourceType}, cantidad: ${amount}`);
                }
            }
        }
    }

    // NUEVO: Método helper para actualizar la visualización de un slot
    private updateSlotDisplay(slot: Frame, resourceType: string, amount: number, slotIndex: number): void {
        const amountLabel = slot.FindFirstChild("Amount") as TextLabel;
        const icon = slot.FindFirstChild("Icon") as TextLabel;
        
        if (amountLabel && icon) {
            amountLabel.Text = tostring(amount);
            icon.Text = this.getResourceIcon(resourceType);
            slot.BackgroundColor3 = PIRATE_THEME.accentColor;
            
            // MEJORADO: Añadir metadatos al slot para debugging
            slot.Name = `${resourceType}_Slot_${slotIndex}`;
            slot.SetAttribute("ResourceType", resourceType);
            slot.SetAttribute("Amount", amount);
            
            // NUEVO: Tooltip con información del recurso
            const resourceInfo = getResource(resourceType);
            if (resourceInfo) {
                slot.SetAttribute("DisplayName", resourceInfo.displayName);
            }
        }
    }

    // NUEVO: Método helper para limpiar un slot
    private clearSlot(slot: Frame, slotIndex: number): void {
        const amountLabel = slot.FindFirstChild("Amount") as TextLabel;
        const icon = slot.FindFirstChild("Icon") as TextLabel;
        
        if (amountLabel && icon) {
            amountLabel.Text = "";
            icon.Text = "";
            slot.BackgroundColor3 = PIRATE_THEME.secondaryColor;
            slot.Name = `Empty_Slot_${slotIndex}`;
            
            // Limpiar atributos
            slot.SetAttribute("ResourceType", undefined);
            slot.SetAttribute("Amount", undefined);
            slot.SetAttribute("DisplayName", undefined);
        }
    }

    // NUEVO: Método helper para encontrar el primer slot vacío
    private findEmptySlotIndex(): number {
        for (let i = 0; i < this.inventorySlots.size(); i++) {
            const slot = this.inventorySlots[i];
            const resourceType = slot.GetAttribute("ResourceType") as string;
            
            // Si el slot no tiene tipo de recurso asignado, está vacío
            if (!resourceType || resourceType === "") {
                return i;
            }
        }
        return -1; // No se encontró slot vacío
    }

    private refreshCraftingDisplay(): void {
        if (!this.craftingTab) return;
        
        // Actualizar colores de botones de crafting
        for (const child of this.craftingTab.GetChildren()) {
            if (child.IsA("Frame")) {
                const craftButton = child.FindFirstChild("TextButton") as TextButton;
                if (craftButton) {
                    // Determinar si se puede craftear (esto debería mejorarse con datos reales)
                    const canCraft = true; // Placeholder
                    craftButton.BackgroundColor3 = canCraft ? 
                        PIRATE_THEME.successColor : PIRATE_THEME.errorColor;
                }
            }
        }
    }

    private getResourceIcon(resourceType: string): string {
        // MEJORADO: Debug logging y mejor manejo de iconos
        print(`🔍 DEBUG: Getting icon for resource: ${resourceType}`);
        
        const resourceInfo = getResource(resourceType);
        if (resourceInfo && resourceInfo.icon) {
            print(`✅ DEBUG: Found resource config with icon: ${resourceInfo.icon}`);
            return resourceInfo.icon;
        }
        
        // MEJORADO: Sistema de fallback más completo
        const primaryIcons: Record<string, string> = {
            wood: "🪵",      // Madera - emoji más universalmente soportado
            rope: "🪢",      // Cuerda - emoji específico
            cloth: "🧵",     // Tela - hilo
            iron: "🔩",      // Hierro - tornillo de metal
            hardwood: "🌳",  // Madera dura - árbol
            steel: "⚙️",     // Acero - engranaje
            canvas: "⛵",    // Lona - vela de barco
            gold: "🪙",      // Oro - moneda
            dragon_scale: "🐲",   // Escama dragón
            ghost_essence: "👻",  // Esencia fantasma
            ice_crystal: "❄️",    // Cristal hielo
            fire_core: "🔥"       // Núcleo fuego
        };
        
        // Iconos alternativos si los primarios no funcionan
        const alternativeIcons: Record<string, string> = {
            wood: "🌲",      // Árbol como alternativa a 🪵
            rope: "🎗️",      // Cinta como alternativa a 🪢
            cloth: "🧶",     // Ovillo como alternativa a 🧵
            iron: "⚫",      // Círculo negro como alternativa
            hardwood: "🌴",  // Palmera como alternativa
            steel: "🔧",     // Llave inglesa como alternativa
            canvas: "🏳️",    // Bandera como alternativa
            gold: "💰",      // Bolsa dinero como alternativa
            dragon_scale: "🦎",   // Lagarto como alternativa
            ghost_essence: "💀",  // Calavera como alternativa  
            ice_crystal: "🧊",    // Cubo hielo como alternativa
            fire_core: "🔴"       // Círculo rojo como alternativa
        };
        
        // Fallback simple con letras si emojis fallan completamente
        const textFallback: Record<string, string> = {
            wood: "W",
            rope: "R", 
            cloth: "C",
            iron: "I",
            hardwood: "H",
            steel: "S",
            canvas: "Ca",
            gold: "G",
            dragon_scale: "D",
            ghost_essence: "Gh",
            ice_crystal: "Ic",
            fire_core: "F"
        };
        
        // Probar iconos en orden de preferencia
        const primaryIcon = primaryIcons[resourceType];
        const altIcon = alternativeIcons[resourceType];
        const textIcon = textFallback[resourceType];
        
        const result = primaryIcon || altIcon || textIcon || "?";
        
        print(`🎯 DEBUG: Using icon for ${resourceType}: ${result} (Primary: ${primaryIcon}, Alt: ${altIcon}, Text: ${textIcon})`);
        return result;
    }

    // COMPLETAMENTE REESCRITO: Sistema de Drag & Drop mejorado
    private handleSlotClick(slot: Frame): void {
        const currentTime = tick();
        const resourceType = slot.GetAttribute("ResourceType") as string;
        
        if (!resourceType || resourceType === "") {
            return; // Slot vacío, no hacer nada
        }

        // MEJORADO: Detectar doble click con mejor timing y cancelar drag
        if (currentTime - this.lastClickTime < this.DOUBLE_CLICK_TIME) {
            print(`🖱️ Doble click detectado en ${resourceType}`);
            
            // NUEVO: Cancelar cualquier drag en progreso
            if (this.isDragging) {
                this.cleanupDrag();
            }
            
            this.moveItemToHotbar(slot);
            // Reset el tiempo para evitar triple clicks accidentales
            this.lastClickTime = 0;
        } else {
            // NUEVO: Solo iniciar tracking de tiempo, no iniciar drag aquí
            this.lastClickTime = currentTime;
        }
    }

    private handleDragStart(slot: Frame, mousePosition: Vector2): void {
        const resourceType = slot.GetAttribute("ResourceType") as string;
        const amount = slot.GetAttribute("Amount") as number;
        
        if (!resourceType || resourceType === "" || amount <= 0) {
            return; // Slot vacío, no se puede arrastrar
        }

        print(`🎯 Iniciando drag para: ${resourceType} x${amount}`);

        this.isDragging = true;
        this.dragStartSlot = slot;
        
        // NUEVO: Mostrar superficie de drag
        if (this.dragSurface) {
            this.dragSurface.Visible = true;
        }
        
        // ARREGLADO: No calcular offset - el frame debe seguir exactamente al mouse
        this.dragOffset = new Vector2(0, 0); // Sin offset para centrar en cursor
        
        // Crear item para drag
        const resourceInfo = getResource(resourceType);
        this.dragItem = {
            itemId: resourceType,
            itemType: "resource",
            amount: amount,
            displayName: resourceInfo ? resourceInfo.displayName : resourceType,
            icon: this.getResourceIcon(resourceType)
        };

        // Crear frame visual de drag
        this.createDragFrame();
        
        // NUEVO: Iniciar el tracking del mouse con RunService
        this.startDragTracking();
        
        print(`🎯 Drag iniciado: ${resourceType} x${amount}`);
    }

    private startDragTracking(): void {
        // Limpiar conexión anterior si existe
        if (this.dragConnection) {
            this.dragConnection.Disconnect();
        }

        // NUEVO: Usar RunService para tracking suave del mouse
        this.dragConnection = RunService.Heartbeat.Connect(() => {
            if (this.isDragging && this.dragFrame) {
                this.updateDragPosition();
            }
        });
    }

    private updateDragPosition(): void {
        if (!this.dragFrame || !this.isDragging) return;

        // ARREGLADO: Obtener posición actual del mouse
        const mouse = Players.LocalPlayer.GetMouse();
        const mousePos = new Vector2(mouse.X, mouse.Y);
        
        // ARREGLADO: Usar el GUI principal como parent para posicionamiento absoluto
        if (this.dragFrame.Parent !== this.gui) {
            this.dragFrame.Parent = this.gui; // CRÍTICO: Parent directo al ScreenGui para posición absoluta
        }
        
        // ARREGLADO: Centrar el frame en el cursor (frame de 60x60, así que -30 para centrar)
        const centerOffset = 30; // Mitad del tamaño del frame (60/2)
        const finalPos = new Vector2(mousePos.X - centerOffset, mousePos.Y - centerOffset);
        
        // ARREGLADO: Usar absolute position relativo al ScreenGui (que está en 0,0)
        this.dragFrame.Position = new UDim2(0, finalPos.X, 0, finalPos.Y);
    }

    private handleDragEnd(): void {
        if (!this.isDragging) return;

        print(`🎯 Finalizando drag...`);

        // MEJORADO: Detección de drop con slot específico
        const mouse = Players.LocalPlayer.GetMouse();
        const target = mouse.Target;
        
        const dropResult = this.isValidDropTarget(target);
        
        if (dropResult.isValid && dropResult.slotIndex >= 0) {
            print(`📍 Drop válido detectado en slot: ${dropResult.slotIndex + 1} (${target?.Name || "unknown"})`);
            this.moveItemToHotbarSlot(this.dragStartSlot!, dropResult.slotIndex);
        } else {
            print(`📍 Drop inválido o fuera del hotbar`);
        }

        // Limpiar drag state
        this.cleanupDrag();
    }

    private createDragFrame(): void {
        if (!this.dragItem) return;

        // ARREGLADO: Parent directo al ScreenGui para posicionamiento absoluto
        const parentFrame = this.gui;
        if (!parentFrame) return;

        this.dragFrame = new Instance("Frame");
        this.dragFrame.Name = "DragFrame";
        this.dragFrame.Size = new UDim2(0, 60, 0, 60); // Ligeramente más grande
        this.dragFrame.BackgroundColor3 = PIRATE_THEME.accentColor;
        this.dragFrame.BorderColor3 = PIRATE_THEME.borderColor;
        this.dragFrame.BorderSizePixel = 3;
        this.dragFrame.ZIndex = 10000; // ZIndex muy alto para estar encima de todo
        this.dragFrame.Parent = parentFrame; // ARREGLADO: Parent directo al ScreenGui

        // NUEVO: Hacer el frame semi-transparente
        this.dragFrame.BackgroundTransparency = 0.1;

        // Icon del item siendo arrastrado
        const icon = new Instance("TextLabel");
        icon.Name = "DragIcon";
        icon.Size = new UDim2(0.7, 0, 0.7, 0);
        icon.Position = new UDim2(0.15, 0, 0.1, 0);
        icon.BackgroundTransparency = 1;
        icon.Text = this.dragItem.icon;
        icon.TextColor3 = PIRATE_THEME.textColor;
        icon.TextScaled = false;
        icon.TextSize = 32; // Más grande para mejor visibilidad
        icon.Font = Enum.Font.SourceSansBold;
        icon.TextXAlignment = Enum.TextXAlignment.Center;
        icon.TextYAlignment = Enum.TextYAlignment.Center;
        icon.ZIndex = 10001;
        icon.Parent = this.dragFrame;

        // Cantidad con mejor visibilidad
        const amount = new Instance("TextLabel");
        amount.Name = "DragAmount";
        amount.Size = new UDim2(0.5, 0, 0.3, 0);
        amount.Position = new UDim2(0.5, 0, 0.7, 0);
        amount.BackgroundColor3 = PIRATE_THEME.primaryColor;
        amount.BackgroundTransparency = 0.2;
        amount.Text = tostring(this.dragItem.amount);
        amount.TextColor3 = PIRATE_THEME.textColor;
        amount.TextScaled = true;
        amount.Font = Enum.Font.SourceSansBold;
        amount.BorderSizePixel = 0;
        amount.ZIndex = 10001;
        amount.Parent = this.dragFrame;

        // NUEVO: Esquinas redondeadas para el fondo de cantidad
        const corner = new Instance("UICorner");
        corner.CornerRadius = new UDim(0, 4);
        corner.Parent = amount;
    }

    private isValidDropTarget(target: BasePart | undefined): { isValid: boolean, slotIndex: number } {
        if (!target || !target.Parent) return { isValid: false, slotIndex: -1 };
        
        // NUEVO: Método mejorado - detectar slot específico del hotbar
        const mouse = Players.LocalPlayer.GetMouse();
        const mousePos = new Vector2(mouse.X, mouse.Y);
        
        // Buscar directamente el HotbarFrame en PlayerGUI
        const playerGui = Players.LocalPlayer.FindFirstChild("PlayerGui") as PlayerGui;
        if (playerGui) {
            const playerHUD = playerGui.FindFirstChild("PlayerHUD") as ScreenGui;
            if (playerHUD) {
                const hotbarFrame = playerHUD.FindFirstChild("HotbarFrame") as Frame;
                if (hotbarFrame && hotbarFrame.Visible) {
                    // NUEVO: Buscar todos los slots del hotbar y detectar sobre cuál está el mouse
                    for (let i = 1; i <= 9; i++) {
                        const slotName = `HotbarSlot_${i}`;
                        const slot = hotbarFrame.FindFirstChild(slotName) as Frame;
                        
                        if (slot) {
                            const slotPos = slot.AbsolutePosition;
                            const slotSize = slot.AbsoluteSize;
                            
                            const isWithinX = mousePos.X >= slotPos.X && mousePos.X <= slotPos.X + slotSize.X;
                            const isWithinY = mousePos.Y >= slotPos.Y && mousePos.Y <= slotPos.Y + slotSize.Y;
                            
                            if (isWithinX && isWithinY) {
                                print(`🎯 Mouse sobre slot específico: ${i} - Posición: ${mousePos.X}, ${mousePos.Y}`);
                                print(`📍 Slot ${i} área: ${slotPos.X}-${slotPos.X + slotSize.X}, ${slotPos.Y}-${slotPos.Y + slotSize.Y}`);
                                return { isValid: true, slotIndex: i - 1 }; // -1 porque slots del servidor son 0-indexed
                            }
                        }
                    }
                    
                    // FALLBACK: Si está dentro del hotbar pero no detectó slot específico
                    const hotbarPos = hotbarFrame.AbsolutePosition;
                    const hotbarSize = hotbarFrame.AbsoluteSize;
                    
                    const isWithinX = mousePos.X >= hotbarPos.X && mousePos.X <= hotbarPos.X + hotbarSize.X;
                    const isWithinY = mousePos.Y >= hotbarPos.Y && mousePos.Y <= hotbarPos.Y + hotbarSize.Y;
                    
                    if (isWithinX && isWithinY) {
                        // NUEVO: Calcular slot basado en posición relativa
                        const relativeX = mousePos.X - hotbarPos.X;
                        const slotWidth = hotbarSize.X / 9; // 9 slots
                        const calculatedSlot = math.floor(relativeX / slotWidth);
                        const clampedSlot = math.clamp(calculatedSlot, 0, 8);
                        
                        print(`🎯 Mouse sobre hotbar (cálculo): slot ${clampedSlot + 1} - Posición: ${mousePos.X}, ${mousePos.Y}`);
                        print(`📍 Hotbar área: ${hotbarPos.X}-${hotbarPos.X + hotbarSize.X}, ${hotbarPos.Y}-${hotbarPos.Y + hotbarSize.Y}`);
                        print(`📊 Calculado: relativeX=${relativeX}, slotWidth=${slotWidth}, slot=${clampedSlot}`);
                        return { isValid: true, slotIndex: clampedSlot };
                    } else {
                        print(`📍 Mouse fuera del hotbar - Mouse: ${mousePos.X}, ${mousePos.Y} | Hotbar: ${hotbarPos.X}-${hotbarPos.X + hotbarSize.X}, ${hotbarPos.Y}-${hotbarPos.Y + hotbarSize.Y}`);
                    }
                }
            }
        }
        
        print(`❌ Target inválido: ${target.Name} (no es hotbar)`);
        return { isValid: false, slotIndex: -1 };
    }

    private moveItemToHotbarSlot(sourceSlot: Frame, targetSlot: number): void {
        if (!sourceSlot) return;

        const resourceType = sourceSlot.GetAttribute("ResourceType") as string;
        const amount = sourceSlot.GetAttribute("Amount") as number;
        
        if (!resourceType || amount <= 0) return;

        print(`📦➡️🎮 Moviendo ${resourceType} x${amount} al hotbar slot ${targetSlot + 1}`);

        // Crear HotbarItem
        const resourceInfo = getResource(resourceType);
        const hotbarItem: HotbarItem = {
            itemId: resourceType,
            itemType: "resource",
            amount: amount,
            displayName: resourceInfo ? resourceInfo.displayName : resourceType,
            icon: this.getResourceIcon(resourceType)
        };

        // ARREGLADO: Disparar evento con slot específico
        Events.moveItemToHotbar.fire(hotbarItem.itemId, this.getSlotIndex(sourceSlot), targetSlot);
        
        // Remover del inventario
        this.removeResourceFromInventory(resourceType, amount);
    }

    private moveItemToHotbar(sourceSlot: Frame): void {
        // WRAPPER: Usar -1 para que el servidor elija el slot automáticamente
        this.moveItemToHotbarSlot(sourceSlot, -1);
    }

    private removeResourceFromInventory(resourceType: string, amount: number): void {
        const current = this.playerResources.get(resourceType) || 0;
        const newAmount = math.max(0, current - amount);
        
        if (newAmount > 0) {
            this.playerResources.set(resourceType, newAmount);
        } else {
            this.playerResources.delete(resourceType);
            this.resourceSlotMapping.delete(resourceType);
        }
        
        this.refreshInventoryDisplay();
    }

    private getSlotIndex(slot: Frame): number {
        for (let i = 0; i < this.inventorySlots.size(); i++) {
            if (this.inventorySlots[i] === slot) {
                return i;
            }
        }
        return -1;
    }

    private cleanupDrag(): void {
        this.isDragging = false;
        this.dragStartSlot = undefined;
        this.dragItem = undefined;
        this.dragOffset = new Vector2(0, 0);
        
        // NUEVO: Ocultar superficie de drag
        if (this.dragSurface) {
            this.dragSurface.Visible = false;
        }
        
        // NUEVO: Desconectar RunService
        if (this.dragConnection) {
            this.dragConnection.Disconnect();
            this.dragConnection = undefined;
        }
        
        if (this.dragFrame) {
            this.dragFrame.Destroy();
            this.dragFrame = undefined;
        }
        
        print(`🎯 Drag cleanup completado`);
    }

    // NUEVO: Crear superficie de drag sin ClipDescendants
    private createDragSurface(): void {
        if (!this.mainFrame) return;

        // Frame transparente que cubre toda el área de la ventana para drag libre
        this.dragSurface = new Instance("Frame");
        this.dragSurface.Name = "DragSurface";
        this.dragSurface.Size = new UDim2(1, 0, 1, 0);
        this.dragSurface.Position = new UDim2(0, 0, 0, 0);
        this.dragSurface.BackgroundTransparency = 1;
        this.dragSurface.ClipsDescendants = false; // CRÍTICO: Permite drag libre
        this.dragSurface.ZIndex = 5000; // Encima del contenido normal
        this.dragSurface.Visible = false; // Solo visible durante drag
        this.dragSurface.Parent = this.mainFrame;
    }
} 
