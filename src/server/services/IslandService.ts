import { OnStart, Service } from "@flamework/core";
import { Dependency } from "@flamework/core";
import { Workspace } from "@rbxts/services";
import { ISLAND_TEMPLATES, getIslandTemplate } from "shared/configs/islands";
import { IslandTemplate, IslandData } from "shared/types/island";
import { NPCService } from "./NPCService";
import { ResourceService } from "./ResourceService";

@Service()
export class IslandService implements OnStart {
    private loadedIslands = new Map<string, IslandData>();
    private oceanFloor?: Part;

    onStart(): void {
        this.createOceanFloor();
        this.generateAllIslands();
        print("🏝️ IslandService iniciado - Islas graybox generadas!");
    }

    private createOceanFloor(): void {
        // CORREGIDO: Crear océano funcional a nivel 5 studs
        const ocean = new Instance("Part");
        ocean.Name = "Ocean";
        ocean.Size = new Vector3(4000, 10, 4000); // Océano masivo pero más delgado
        ocean.Position = new Vector3(0, 0, 0); // Nivel del agua a 5 studs (centro en Y=0, tope en Y=5)
        ocean.Anchored = true;
        ocean.Material = Enum.Material.Water;
        ocean.BrickColor = new BrickColor("Deep blue");
        ocean.Transparency = 0.3;
        ocean.CanCollide = false; // Solo visual, no bloquea nada
        ocean.Parent = Workspace;

        // === SUPERFICIE DE AGUA SÓLIDA PARA FLOTACIÓN ===
        const waterSurface = new Instance("Part");
        waterSurface.Name = "WaterSurface";
        waterSurface.Size = new Vector3(4000, 1, 4000); // Superficie más gruesa para flotación
        waterSurface.Position = new Vector3(0, 5, 0); // Exactamente en el nivel 5
        waterSurface.Anchored = true;
        waterSurface.Material = Enum.Material.Water;
        waterSurface.BrickColor = new BrickColor("Bright blue");
        waterSurface.Transparency = 0.9; // Casi invisible pero sólida
        waterSurface.CanCollide = true; // CRÍTICO: Permite que jugadores y barcos floten
        waterSurface.Parent = Workspace;

        // === EFECTO VISUAL DE ONDAS ===
        const waterGlow = new Instance("PointLight");
        waterGlow.Name = "WaterGlow";
        waterGlow.Color = new Color3(0.2, 0.6, 1);
        waterGlow.Brightness = 0.5;
        waterGlow.Range = 50;
        waterGlow.Parent = waterSurface;

        this.oceanFloor = ocean;
        print("🌊 Océano funcional creado - Nivel del agua: 5 studs - Flotación habilitada");
    }

    private generateAllIslands(): void {
        for (const [islandId, template] of pairs(ISLAND_TEMPLATES)) {
            this.generateBasicIsland(template);
        }
    }

    private generateBasicIsland(template: IslandTemplate): void {
        // Crear modelo contenedor para la isla
        const islandModel = new Instance("Model");
        islandModel.Name = template.displayName;
        islandModel.Parent = Workspace;

        // CORREGIDO: Calcular altura correcta de la isla por encima del agua
        const waterLevel = 5; // Nivel del agua FIJO en 5
        const islandHeight = waterLevel + (template.size.Y / 2) + 2; // Isla 2 studs por encima del agua
        const correctedPosition = new Vector3(
            template.position.X, 
            islandHeight, 
            template.position.Z
        );

        // Crear la plataforma base de la isla (graybox)
        const basePlatform = new Instance("Part");
        basePlatform.Name = "IslandBase";
        basePlatform.Size = template.size;
        basePlatform.Position = correctedPosition;
        basePlatform.Anchored = true;
        basePlatform.Material = template.terrainMaterial;
        basePlatform.Color = template.terrainColor;
        basePlatform.Parent = islandModel;

        // Agregar etiqueta informativa
        const label = new Instance("StringValue");
        label.Name = "IslandInfo";
        label.Value = `${template.displayName} - Nivel ${template.recommendedLevel} (${template.difficulty})`;
        label.Parent = basePlatform;

        // === CREAR COSTA/PLAYA ALREDEDOR DE LA ISLA ===
        const beach = new Instance("Part");
        beach.Name = "Beach";
        beach.Size = new Vector3(template.size.X + 20, 3, template.size.Z + 20); // Un poco más grande que la isla
        beach.Position = new Vector3(template.position.X, waterLevel + 1.5, template.position.Z); // Justo encima del agua
        beach.Anchored = true;
        beach.Material = Enum.Material.Sand;
        beach.BrickColor = new BrickColor("Bright yellow");
        beach.Parent = islandModel;

        // Crear dock para barcos si tiene uno
        if (template.hasPortDock) {
            this.createImprovedDock(template, islandModel, waterLevel);
        }

        // Crear marcadores de spawn
        this.createSpawnMarkers(template, islandModel, correctedPosition);

        // Registrar isla
        const islandData: IslandData = {
            templateId: template.id,
            model: islandModel,
            isLoaded: true,
            activeNPCs: [],
            activeResources: [],
            lastVisited: tick()
        };

        this.loadedIslands.set(template.id, islandData);
        print(`🏝️ Isla generada: ${template.displayName} en ${correctedPosition} (${waterLevel + 2} studs sobre el agua)`);
    }

    private createImprovedDock(template: IslandTemplate, islandModel: Model, waterLevel: number): void {
        // === DOCK FUNCIONAL PARA BARCOS ===
        const dock = new Instance("Part");
        dock.Name = "Dock";
        dock.Size = new Vector3(15, 2, 25); // Dock más grande para barcos
        dock.Position = new Vector3(
            template.position.X + (template.size.X / 2) + 10, // Al lado de la isla
            waterLevel + 1, // Justo encima del agua
            template.position.Z
        );
        dock.Anchored = true;
        dock.Material = Enum.Material.Wood;
        dock.BrickColor = new BrickColor("Brown");
        dock.Parent = islandModel;

        // === PILARES DEL DOCK ===
        for (let i = 0; i < 3; i++) {
            const pillar = new Instance("Part");
            pillar.Name = `DockPillar_${i}`;
            pillar.Size = new Vector3(2, 8, 2);
            pillar.Position = new Vector3(
                dock.Position.X + (i - 1) * 6,
                waterLevel - 2, // Sumergido en el agua
                dock.Position.Z
            );
            pillar.Anchored = true;
            pillar.Material = Enum.Material.Wood;
            pillar.BrickColor = new BrickColor("Dark orange");
            pillar.Parent = islandModel;
        }

        // === MARCADOR DE SPAWN PARA BARCOS ===
        const boatSpawn = new Instance("Part");
        boatSpawn.Name = "BoatSpawnPoint";
        boatSpawn.Size = new Vector3(3, 0.5, 3);
        boatSpawn.Position = new Vector3(
            dock.Position.X + 20, // Un poco alejado del dock
            waterLevel + 0.25, // En la superficie del agua
            dock.Position.Z
        );
        boatSpawn.Anchored = true;
        boatSpawn.Material = Enum.Material.Neon;
        boatSpawn.BrickColor = new BrickColor("Bright blue");
        boatSpawn.Transparency = 0.5;
        boatSpawn.CanCollide = false;
        boatSpawn.Parent = islandModel;

        print(`⚓ Dock funcional creado para ${template.displayName} en nivel del agua`);
    }

    private createSpawnMarkers(template: IslandTemplate, islandModel: Model, islandPosition: Vector3): void {
        // Crear marcadores para spawn points de NPCs CON ALTURA CORREGIDA
        for (const npcSpawn of template.npcSpawns) {
            for (let i = 0; i < npcSpawn.spawnPoints.size(); i++) {
                const originalSpawnPoint = npcSpawn.spawnPoints[i];
                // CORREGIDO: Ajustar altura de spawn points a la superficie de la isla
                const correctedSpawnPoint = new Vector3(
                    originalSpawnPoint.X,
                    islandPosition.Y + (template.size.Y / 2) + 2, // En la superficie de la isla
                    originalSpawnPoint.Z
                );
                
                const marker = new Instance("Part");
                marker.Name = `NPC_Spawn_${npcSpawn.npcType}_${i}`;
                marker.Size = new Vector3(2, 1, 2);
                marker.Position = correctedSpawnPoint;
                marker.Anchored = true;
                marker.Material = Enum.Material.Neon;
                marker.BrickColor = new BrickColor("Bright red");
                marker.Transparency = 0.7;
                marker.CanCollide = false;
                marker.Parent = islandModel;

                // Info del NPC
                const npcInfo = new Instance("StringValue");
                npcInfo.Name = "NPCInfo";
                npcInfo.Value = `NPC: ${npcSpawn.npcType} - Max: ${npcSpawn.maxActive}`;
                npcInfo.Parent = marker;
            }
        }

        // Crear marcadores para spawn points de recursos CON ALTURA CORREGIDA
        for (const resourceSpawn of template.resourceSpawns) {
            for (let i = 0; i < resourceSpawn.spawnPoints.size(); i++) {
                const originalSpawnPoint = resourceSpawn.spawnPoints[i];
                // CORREGIDO: Ajustar altura de spawn points a la superficie de la isla
                const correctedSpawnPoint = new Vector3(
                    originalSpawnPoint.X,
                    islandPosition.Y + (template.size.Y / 2) + 1, // En la superficie de la isla
                    originalSpawnPoint.Z
                );
                
                const marker = new Instance("Part");
                marker.Name = `Resource_Spawn_${resourceSpawn.resourceType}_${i}`;
                marker.Size = new Vector3(1.5, 1, 1.5);
                marker.Position = correctedSpawnPoint;
                marker.Anchored = true;
                marker.Material = Enum.Material.Neon;
                marker.BrickColor = new BrickColor("Bright green");
                marker.Transparency = 0.7;
                marker.CanCollide = false;
                marker.Parent = islandModel;

                // Info del recurso
                const resourceInfo = new Instance("StringValue");
                resourceInfo.Name = "ResourceInfo";
                resourceInfo.Value = `Recurso: ${resourceSpawn.resourceType} - Max: ${resourceSpawn.maxActive}`;
                resourceInfo.Parent = marker;
            }
        }
    }

    // Método público para obtener información de islas
    public getIslandData(islandId: string): IslandData | undefined {
        return this.loadedIslands.get(islandId);
    }

    // Método para listar todas las islas cargadas
    public getAllLoadedIslands(): IslandData[] {
        const islands: IslandData[] = [];
        for (const [, island] of pairs(this.loadedIslands)) {
            islands.push(island);
        }
        return islands;
    }

    // Método para obtener la posición del dock más cercano CON ALTURA CORREGIDA
    public getNearestDockPosition(playerPosition: Vector3): Vector3 | undefined {
        let nearestDock: Vector3 | undefined;
        let nearestDistance = math.huge;

        for (const [, islandData] of pairs(this.loadedIslands)) {
            if (!islandData.model) continue;

            const dock = islandData.model.FindFirstChild("Dock") as Part;
            if (dock) {
                const distance = playerPosition.sub(dock.Position).Magnitude;
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    // CORREGIDO: Posicionar barco en el agua junto al dock
                    nearestDock = new Vector3(dock.Position.X + 15, 8, dock.Position.Z); // Al lado del dock en el agua
                }
            }
        }

        return nearestDock;
    }

    // Método para spawnar NPCs y recursos en una isla específica
    public populateIsland(islandId: string): void {
        const template = getIslandTemplate(islandId);
        const islandData = this.loadedIslands.get(islandId);
        
        if (!template || !islandData) {
            warn(`❌ No se puede poblar la isla: ${islandId}`);
            return;
        }

        const npcService = Dependency<NPCService>();
        const resourceService = Dependency<ResourceService>();

        // TODO: Implementar spawning de NPCs y recursos basado en los marcadores
        // Por ahora solo registramos que la isla está poblada

        print(`👥 Isla ${template.displayName} lista para ser poblada con NPCs y recursos`);
    }
} 
