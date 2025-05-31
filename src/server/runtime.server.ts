import { Flamework } from "@flamework/core";

// Importar y inicializar el sistema Cmdr
import { initializeCmdr } from "./cmdr/startup";

Flamework.addPaths("src/server/components");
Flamework.addPaths("src/server/services");
Flamework.addPaths("src/shared/components");

Flamework.ignite();

// Inicializar el sistema de comandos Cmdr después de que Flamework esté listo
initializeCmdr();
