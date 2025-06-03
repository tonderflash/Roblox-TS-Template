// Exportar el servicio principal
export { ResourceService } from "../ResourceService";

// Exportar tipos e interfaces compartidos
export * from "./types/ResourceServiceTypes";

// Exportar managers especializados para uso externo si es necesario
export { PlayerResourcesManager } from "./managers/PlayerResourcesManager";
export { ResourceNodeManager } from "./managers/ResourceNodeManager";
export { InventoryTransactionManager } from "./managers/InventoryTransactionManager";

// Exportar engines
export { HarvestingEngine } from "./engines/HarvestingEngine";

// Exportar UI managers
export { ResourceUIManager } from "./ui/ResourceUIManager"; 
