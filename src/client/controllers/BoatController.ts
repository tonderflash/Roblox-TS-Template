import { Controller, OnStart } from "@flamework/core";
import { Players, UserInputService, Workspace, RunService } from "@rbxts/services";
import { Events } from "client/network";

@Controller()
export class BoatController implements OnStart {
    private localPlayer = Players.LocalPlayer;
    private currentBoat: Model | undefined;
    private isControlling = false;
    private connection: RBXScriptConnection | undefined;
    private inputConnections: RBXScriptConnection[] = [];

    onStart(): void {
        this.setupBoatDetection();
        this.setupInputHandling();
        print("🚢 BoatController iniciado - Cliente listo para controlar barcos");
    }

    private setupBoatDetection(): void {
        // Detectar cuando el jugador hace clic en un timón
        Workspace.ChildAdded.Connect((child) => {
            if (child.IsA("Model") && child.Name.find("Sloop")[0] !== undefined) {
                this.connectToBoat(child);
            }
        });

        // Revisar barcos existentes
        for (const child of Workspace.GetChildren()) {
            if (child.IsA("Model") && child.Name.find("Sloop")[0] !== undefined) {
                this.connectToBoat(child);
            }
        }
    }

    private connectToBoat(boatModel: Model): void {
        const helm = boatModel.FindFirstChild("Helm") as Part;
        if (!helm) return;

        const clickDetector = helm.FindFirstChild("ClickDetector") as ClickDetector;
        if (!clickDetector) return;

        const helmSeat = boatModel.FindFirstChild("HelmSeat") as Seat;
        if (!helmSeat) return;

        // Conectar evento de clic en el timón
        clickDetector.MouseClick.Connect((player) => {
            if (player === this.localPlayer) {
                if (this.isControlling && this.currentBoat === boatModel) {
                    this.stopControlling();
                } else {
                    this.startControlling(boatModel);
                }
            }
        });

        // Conectar eventos del asiento
        helmSeat.GetPropertyChangedSignal("Occupant").Connect(() => {
            const humanoid = helmSeat.Occupant;
            if (humanoid && humanoid.Parent === this.localPlayer.Character) {
                // El jugador se sentó en el timón
                if (!this.isControlling) {
                    this.startControlling(boatModel);
                }
            } else if (this.currentBoat === boatModel && this.isControlling) {
                // El jugador se levantó del timón
                this.stopControlling();
            }
        });
    }

    private startControlling(boatModel: Model): void {
        if (this.isControlling) {
            this.stopControlling();
        }

        this.currentBoat = boatModel;
        this.isControlling = true;

        // Mostrar UI de control
        this.showControlUI(true);

        // Configurar controles
        this.setupMovementControls();

        print(`🧭 Controlando barco: ${boatModel.Name}`);
    }

    private stopControlling(): void {
        if (!this.isControlling) return;

        this.isControlling = false;

        // Detener movimiento
        if (this.currentBoat) {
            Events.stopBoatNavigation();
        }

        // Limpiar conexiones
        this.cleanupInputs();

        // Ocultar UI
        this.showControlUI(false);

        this.currentBoat = undefined;
        print("⚓ Control de barco detenido");
    }

    private setupInputHandling(): void {
        // Detectar cuando el jugador presiona X para salir del control
        UserInputService.InputBegan.Connect((input, gameProcessed) => {
            if (gameProcessed || !this.isControlling) return;

            if (input.KeyCode === Enum.KeyCode.X) {
                this.stopControlling();
            }
        });
    }

    private setupMovementControls(): void {
        if (!this.isControlling || !this.currentBoat) return;

        // Conexión principal de movimiento
        this.connection = RunService.Heartbeat.Connect(() => {
            if (!this.isControlling || !this.currentBoat) {
                this.cleanupInputs();
                return;
            }

            const direction = this.getMovementInput();
            
            if (direction.Magnitude > 0) {
                Events.startBoatNavigation(direction);
            } else {
                Events.stopBoatNavigation();
            }
        });
    }

    private getMovementInput(): Vector3 {
        let direction = new Vector3(0, 0, 0);

        // Detectar teclas presionadas
        const camera = Workspace.CurrentCamera;
        if (!camera) return direction;

        // WASD para navegación
        if (UserInputService.IsKeyDown(Enum.KeyCode.W)) {
            direction = direction.add(new Vector3(0, 0, 1)); // Adelante
        }
        if (UserInputService.IsKeyDown(Enum.KeyCode.S)) {
            direction = direction.add(new Vector3(0, 0, -1)); // Atrás
        }
        if (UserInputService.IsKeyDown(Enum.KeyCode.A)) {
            direction = direction.add(new Vector3(-1, 0, 0)); // Izquierda (timón)
        }
        if (UserInputService.IsKeyDown(Enum.KeyCode.D)) {
            direction = direction.add(new Vector3(1, 0, 0)); // Derecha (timón)
        }

        // Teclas de flecha alternativas
        if (UserInputService.IsKeyDown(Enum.KeyCode.Up)) {
            direction = direction.add(new Vector3(0, 0, 1));
        }
        if (UserInputService.IsKeyDown(Enum.KeyCode.Down)) {
            direction = direction.add(new Vector3(0, 0, -1));
        }
        if (UserInputService.IsKeyDown(Enum.KeyCode.Left)) {
            direction = direction.add(new Vector3(-1, 0, 0));
        }
        if (UserInputService.IsKeyDown(Enum.KeyCode.Right)) {
            direction = direction.add(new Vector3(1, 0, 0));
        }

        return direction;
    }

    private showControlUI(show: boolean): void {
        // TODO: Implementar UI de control del barco
        if (show) {
            print("🎮 CONTROLES DEL BARCO:");
            print("📱 W/S o ↑/↓ - Acelerar/Reversa");
            print("🧭 A/D o ←/→ - Girar timón");
            print("❌ X - Salir del control");
            print("🪑 Siéntate en el timón para control automático");
        }
    }

    private cleanupInputs(): void {
        if (this.connection) {
            this.connection.Disconnect();
            this.connection = undefined;
        }

        for (const connection of this.inputConnections) {
            connection.Disconnect();
        }
        this.inputConnections = [];
    }
} 
