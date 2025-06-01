// ===== BOAT NAVIGATION CONTROLLER - CONTROL DE NAVEGACIÓN =====
// Maneja la navegación y control de barcos con sistema MODERNO

import { RunService } from "@rbxts/services";
import { BoatModel, BoatController, NavigationControls, BOAT_CONFIG } from "./types/BoatTypes";

export class BoatNavigationController {
    private activeControllers = new Map<Player, BoatController>();
    private heartbeatConnection?: RBXScriptConnection;
    
    constructor() {
        this.setupHeartbeat();
        print("🚢 BoatNavigationController inicializado con sistema MODERNO");
    }
    
    /**
     * Inicia el control de un barco para un jugador (MODERNIZADO)
     */
    public startBoatControl(player: Player, boatModel: BoatModel): boolean {
        // Verificar que el barco tiene los componentes modernos necesarios
        if (!this.validateModernBoatModel(boatModel)) {
            warn(`❌ Modelo de barco moderno inválido para ${player.Name}`);
            return false;
        }
        
        const hull = boatModel.HumanoidRootPart;
        
        // Crear controlador moderno
        const controller: BoatController = {
            player: player,
            boatModel: boatModel,
            isControlling: true,
            controls: this.createDefaultControls(),
            // MODERNO: Usar LinearVelocity y AngularVelocity
            linearVelocity: hull.FindFirstChild("BoatLinearVelocity") as LinearVelocity,
            angularVelocity: hull.FindFirstChild("BoatAngularVelocity") as AngularVelocity,
            attachment: hull.FindFirstChild("MovementAttachment") as Attachment
        };
        
        this.activeControllers.set(player, controller);
        print(`🎮 ${player.Name} tomó control de su barco (SISTEMA MODERNO)`);
        return true;
    }
    
    /**
     * Detiene el control de un barco
     */
    public stopBoatControl(player: Player): boolean {
        const controller = this.activeControllers.get(player);
        if (!controller) return false;
        
        // Detener movimiento moderno
        this.stopModernBoatMovement(controller);
        
        // Remover controlador
        this.activeControllers.delete(player);
        print(`🛑 ${player.Name} dejó de controlar su barco`);
        return true;
    }
    
    /**
     * Actualiza los controles de un jugador
     */
    public updateControls(player: Player, controls: NavigationControls): void {
        const controller = this.activeControllers.get(player);
        if (!controller) return;
        
        controller.controls = controls;
        print(`🕹️ Controles actualizados para ${player.Name}: F=${controls.forward}, B=${controls.backward}, L=${controls.turnLeft}, R=${controls.turnRight}`);
    }
    
    /**
     * Configuración del bucle de actualización
     */
    private setupHeartbeat(): void {
        this.heartbeatConnection = RunService.Heartbeat.Connect(() => {
            this.updateAllBoats();
        });
    }
    
    /**
     * Actualiza todos los barcos activos
     */
    private updateAllBoats(): void {
        this.activeControllers.forEach((controller) => {
            if (controller.isControlling) {
                this.updateModernBoatMovement(controller);
            }
        });
    }
    
    /**
     * Actualiza el movimiento de un barco específico (MODERNIZADO)
     */
    private updateModernBoatMovement(controller: BoatController): void {
        if (!controller.linearVelocity || !controller.angularVelocity) {
            warn(`❌ Componentes de movimiento moderno faltantes para ${controller.player.Name}`);
            return;
        }
        
        const hull = controller.boatModel.HumanoidRootPart;
        const controls = controller.controls;
        
        // Calcular velocidad basada en controles usando vectores relativos al barco
        let moveVector = new Vector3(0, 0, 0);
        let turnSpeed = 0;
        
        // Movimiento adelante/atrás relativo a la orientación del barco
        if (controls.forward) {
            // LookVector es hacia donde "mira" el barco
            moveVector = moveVector.add(hull.CFrame.LookVector.mul(BOAT_CONFIG.MAX_SPEED));
        }
        if (controls.backward) {
            // Reversa a la mitad de velocidad
            moveVector = moveVector.add(hull.CFrame.LookVector.mul(-BOAT_CONFIG.MAX_SPEED * 0.5));
        }
        
        // Rotación izquierda/derecha
        if (controls.turnLeft) {
            turnSpeed = -BOAT_CONFIG.BASE_TURN_SPEED;
        }
        if (controls.turnRight) {
            turnSpeed = BOAT_CONFIG.BASE_TURN_SPEED;
        }
        
        // Freno - reduce velocidad y rotación
        if (controls.brake) {
            moveVector = moveVector.mul(0.1);
            turnSpeed = turnSpeed * 0.1;
        }
        
        // Aplicar movimiento usando sistema moderno
        controller.linearVelocity.VectorVelocity = moveVector;
        controller.angularVelocity.AngularVelocity = new Vector3(0, turnSpeed, 0);
        
        // Debug info (solo si hay movimiento)
        if (moveVector.Magnitude > 0 || math.abs(turnSpeed) > 0) {
            const velocity = math.floor(moveVector.Magnitude * 10) / 10; // Redondear a 1 decimal
            const rotation = math.floor(turnSpeed * 10) / 10; // Redondear a 1 decimal
            print(`🚢 ${controller.player.Name}: Vel=${velocity}, Rot=${rotation}`);
        }
    }
    
    /**
     * Detiene completamente el movimiento de un barco (MODERNIZADO)
     */
    private stopModernBoatMovement(controller: BoatController): void {
        if (controller.linearVelocity) {
            controller.linearVelocity.VectorVelocity = new Vector3(0, 0, 0);
        }
        if (controller.angularVelocity) {
            controller.angularVelocity.AngularVelocity = new Vector3(0, 0, 0);
        }
        print(`⛔ Movimiento detenido para ${controller.player.Name}`);
    }
    
    /**
     * Valida que un modelo de barco tiene todos los componentes MODERNOS necesarios
     */
    private validateModernBoatModel(boatModel: BoatModel): boolean {
        const requiredParts = ["HumanoidRootPart", "Deck", "Helm", "HelmSeat"];
        
        for (const partName of requiredParts) {
            if (!boatModel.FindFirstChild(partName)) {
                warn(`❌ Falta componente: ${partName}`);
                return false;
            }
        }
        
        // Verificar componentes modernos
        const hull = boatModel.HumanoidRootPart;
        const modernComponents = [
            "MovementAttachment",
            "BoatLinearVelocity", 
            "BoatAngularVelocity",
            "BoatFloatForce"
        ];
        
        for (const componentName of modernComponents) {
            if (!hull.FindFirstChild(componentName)) {
                warn(`❌ Falta componente moderno: ${componentName}`);
                return false;
            }
        }
        
        print(`✅ Validación de barco moderno exitosa para ${boatModel.Name}`);
        return true;
    }
    
    /**
     * COMPATIBILIDAD: Mantener método legacy pero mostrar advertencia
     * @deprecated Usar validateModernBoatModel en su lugar
     */
    private validateBoatModel(boatModel: BoatModel): boolean {
        warn("⚠️ validateBoatModel está deprecated. Usando validateModernBoatModel automáticamente.");
        return this.validateModernBoatModel(boatModel);
    }
    
    /**
     * Crea controles por defecto
     */
    private createDefaultControls(): NavigationControls {
        return {
            forward: false,
            backward: false,
            turnLeft: false,
            turnRight: false,
            brake: false
        };
    }
    
    /**
     * Obtiene el controlador activo de un jugador
     */
    public getActiveController(player: Player): BoatController | undefined {
        return this.activeControllers.get(player);
    }
    
    /**
     * Verifica si un jugador está controlando un barco
     */
    public isPlayerControlling(player: Player): boolean {
        return this.activeControllers.has(player);
    }
    
    /**
     * Obtiene estadísticas de navegación
     */
    public getNavigationStats(): { activeControllers: number; controllingPlayers: string[] } {
        const controllingPlayers: string[] = [];
        this.activeControllers.forEach((_, player) => {
            controllingPlayers.push(player.Name);
        });
        
        return {
            activeControllers: this.activeControllers.size(),
            controllingPlayers: controllingPlayers
        };
    }
    
    /**
     * NUEVO: Método para forzar actualización de un barco específico (debugging)
     */
    public debugUpdateBoat(player: Player, controls: NavigationControls): void {
        const controller = this.activeControllers.get(player);
        if (!controller) {
            warn(`❌ No se encontró controlador para ${player.Name}`);
            return;
        }
        
        controller.controls = controls;
        this.updateModernBoatMovement(controller);
        print(`🔧 Debug: Actualización forzada para ${player.Name}`);
    }
    
    /**
     * Limpia recursos al destruir
     */
    public cleanup(): void {
        if (this.heartbeatConnection) {
            this.heartbeatConnection.Disconnect();
        }
        
        // Detener todos los controladores
        this.activeControllers.forEach((controller) => {
            this.stopModernBoatMovement(controller);
        });
        
        this.activeControllers.clear();
        print("🧹 BoatNavigationController limpiado");
    }
} 
