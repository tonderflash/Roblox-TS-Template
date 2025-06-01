import { OnStart, Service } from "@flamework/core";
import { Dependency } from "@flamework/core";
import { CombatService } from "./CombatService";
import { ResourceService } from "./ResourceService";
import { ToolService } from "./ToolService";
import { NPCService } from "./NPCService";
import { InventoryService } from "./InventoryService";

@Service()
export class GameService implements OnStart {
    onStart(): void {
        this.initializeServices();
        print("🎮 GameService iniciado correctamente - Todos los servicios conectados!");
    }

    private initializeServices(): void {
        // Obtener referencias de los servicios usando Dependency() en métodos para evitar circular dependencies
        const combatService = Dependency<CombatService>();
        const resourceService = Dependency<ResourceService>();
        const toolService = Dependency<ToolService>();
        const npcService = Dependency<NPCService>();
        const inventoryService = Dependency<InventoryService>();
        
        // Configurar dependencias para evitar circular dependencies
        
        // CombatService necesita NPCService y ResourceService
        combatService.setNPCService(npcService);
        combatService.setResourceService(resourceService);
        
        // ResourceService necesita ToolService, CombatService e InventoryService
        resourceService.setToolService(toolService);
        resourceService.setCombatService(combatService);
        resourceService.setInventoryService(inventoryService);

        print("🔗 Dependencias de servicios configuradas:");
        print("  ✅ CombatService ↔ NPCService");
        print("  ✅ CombatService ↔ ResourceService");
        print("  ✅ ResourceService ↔ ToolService");
        print("  ✅ ResourceService ↔ CombatService");
        print("  ✅ ResourceService ↔ InventoryService");
    }
} 
