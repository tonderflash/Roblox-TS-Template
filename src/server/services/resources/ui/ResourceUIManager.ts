import { TweenService, Workspace } from "@rbxts/services";
import { getResource } from "shared/configs/resources";
import { RESOURCE_TYPES } from "shared/types/resources";
import { ResourceNodeData } from "shared/types/harvesting";
import { IResourceUIManager } from "../types/ResourceServiceTypes";

export class ResourceUIManager implements IResourceUIManager {
    
    public setupResourceUI(nodeData: ResourceNodeData, emoji: string): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        const resource = getResource(nodeData.resourceType);
        if (!resource) return;

        // Agregar texto flotante
        const gui = new Instance("BillboardGui");
        gui.Size = UDim2.fromScale(4, 3);
        gui.StudsOffset = new Vector3(0, 3, 0);
        gui.Parent = part;

        // Label principal con info del recurso
        const nameLabel = new Instance("TextLabel");
        nameLabel.Size = UDim2.fromScale(1, 0.5);
        nameLabel.Position = UDim2.fromScale(0, 0);
        nameLabel.BackgroundTransparency = 1;
        nameLabel.Text = `${emoji} ${resource.displayName}`;
        nameLabel.TextColor3 = new Color3(1, 1, 1);
        nameLabel.TextScaled = true;
        nameLabel.Font = Enum.Font.SourceSansBold;
        nameLabel.Parent = gui;

        // Health bar
        const healthFrame = new Instance("Frame");
        healthFrame.Size = UDim2.fromScale(1, 0.2);
        healthFrame.Position = UDim2.fromScale(0, 0.6);
        healthFrame.BackgroundColor3 = Color3.fromRGB(50, 50, 50);
        healthFrame.BorderSizePixel = 1;
        healthFrame.Parent = gui;

        const healthBar = new Instance("Frame");
        healthBar.Name = "HealthBar";
        healthBar.Size = UDim2.fromScale(1, 1);
        healthBar.Position = UDim2.fromScale(0, 0);
        healthBar.BackgroundColor3 = this.getHealthBarColor(nodeData.resourceType);
        healthBar.BorderSizePixel = 0;
        healthBar.Parent = healthFrame;

        // Health text
        const healthLabel = new Instance("TextLabel");
        healthLabel.Size = UDim2.fromScale(1, 0.3);
        healthLabel.Position = UDim2.fromScale(0, 0.8);
        healthLabel.BackgroundTransparency = 1;
        healthLabel.Text = `${nodeData.health}/${nodeData.maxHealth} HP`;
        healthLabel.TextColor3 = new Color3(1, 1, 1);
        healthLabel.TextScaled = true;
        healthLabel.Font = Enum.Font.SourceSans;
        healthLabel.Parent = gui;
    }

    public updateResourceUI(nodeData: ResourceNodeData): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        const gui = part.FindFirstChild("BillboardGui") as BillboardGui;
        if (!gui) return;

        // Actualizar health bar
        const healthFrame = gui.FindFirstChild("Frame") as Frame;
        const healthBar = healthFrame?.FindFirstChild("HealthBar") as Frame;
        if (healthBar) {
            const healthPercentage = nodeData.health / nodeData.maxHealth;
            healthBar.Size = UDim2.fromScale(healthPercentage, 1);
        }

        // Actualizar health text
        const healthLabel = gui.FindFirstChild("TextLabel") as TextLabel;
        const healthTextLabels = gui.GetChildren().filter(child => child.IsA("TextLabel")) as TextLabel[];
        const healthTextLabel = healthTextLabels[healthTextLabels.size() - 1]; // Último label es el de health
        if (healthTextLabel) {
            healthTextLabel.Text = `${nodeData.health}/${nodeData.maxHealth} HP`;
        }
    }

    public playHarvestEffects(nodeData: ResourceNodeData, damage: number, isCrit: boolean): void {
        const part = nodeData.model.PrimaryPart;
        if (!part) return;

        // Efecto de golpe
        const effectColor = isCrit ? Color3.fromRGB(255, 255, 0) : Color3.fromRGB(255, 255, 255);
        
        // Crear efecto de partículas simple
        const effectPart = new Instance("Part");
        effectPart.Size = new Vector3(1, 1, 1);
        effectPart.Position = part.Position.add(new Vector3(0, 2, 0));
        effectPart.Color = effectColor;
        effectPart.Material = Enum.Material.Neon;
        effectPart.Anchored = true;
        effectPart.CanCollide = false;
        effectPart.Parent = Workspace;

        // Animar efecto
        const tween = TweenService.Create(effectPart,
            new TweenInfo(0.5, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
            { 
                Size: new Vector3(3, 3, 3),
                Transparency: 1,
                Position: effectPart.Position.add(new Vector3(0, 3, 0))
            }
        );
        tween.Play();
        tween.Completed.Connect(() => {
            effectPart.Destroy();
        });

        // Shake effect en el resource node
        const originalPosition = part.Position;
        const shakeIntensity = isCrit ? 0.3 : 0.1;
        
        for (let i = 0; i < 5; i++) {
            task.wait(0.05);
            const randomOffset = new Vector3(
                (math.random() - 0.5) * shakeIntensity,
                (math.random() - 0.5) * shakeIntensity,
                (math.random() - 0.5) * shakeIntensity
            );
            part.Position = originalPosition.add(randomOffset);
        }
        
        part.Position = originalPosition;
    }

    private getHealthBarColor(resourceType: string): Color3 {
        switch (resourceType) {
            case RESOURCE_TYPES.WOOD: return Color3.fromRGB(139, 69, 19);   // Brown
            case RESOURCE_TYPES.ROPE: return Color3.fromRGB(255, 215, 0);   // Gold
            case RESOURCE_TYPES.CLOTH: return Color3.fromRGB(255, 255, 255); // White
            case RESOURCE_TYPES.IRON: return Color3.fromRGB(128, 128, 128);  // Gray
            default: return Color3.fromRGB(0, 255, 0);                       // Green
        }
    }
} 
