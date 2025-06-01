import { Cmdr } from "@rbxts/cmdr";

export function initializeCmdr() {
    print("🚀 Iniciando CMDR...");
    
    const parent = <Folder>script.Parent
    print("📁 Parent encontrado:", parent);

    print("📋 Registrando comandos por defecto...");
    Cmdr.RegisterDefaultCommands()
    
    const commandsFolder = <Folder>parent.FindFirstChild("commands");
    print("📂 Carpeta de comandos:", commandsFolder);
    
    print("📋 Registrando comandos personalizados...");
    Cmdr.RegisterCommandsIn(commandsFolder)
    
    const typesFolder = <Folder>parent.FindFirstChild("types");
    print("📂 Carpeta de tipos:", typesFolder);
    
    print("📋 Registrando tipos personalizados...");
    Cmdr.RegisterTypesIn(typesFolder)
    
    print("✅ CMDR inicializado completamente!");
}
