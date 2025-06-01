// ===== BOAT TYPES - DEFINICIONES DE TIPOS =====
// Tipos e interfaces para el sistema completo de barcos MODERNIZADO

export interface BoatTemplate {
    id: string;
    displayName: string;
    description: string;
    stats: BoatStats;
    size: Vector3;
    components: BoatComponents;
}

export interface BoatStats {
    health: number;
    maxHealth: number;
    speed: number;
    acceleration: number;
    turnSpeed: number;
    durability: number;
}

export interface BoatComponents {
    hull: ComponentConfig;
    deck: ComponentConfig;
    helm: ComponentConfig;
    mast?: ComponentConfig;
    sail?: ComponentConfig;
    cannons?: ComponentConfig[];
}

export interface ComponentConfig {
    size: Vector3;
    position: Vector3;
    material: Enum.Material;
    color: string;
    anchored?: boolean;
    canCollide?: boolean;
}

export interface BoatData {
    templateId: string;
    health: number;
    position?: Vector3;
    rotation?: CFrame;
    upgrades: string[];
    customizations: string[];
    isSpawned: boolean;
}

export interface SpawnConfig {
    position: Vector3;
    orientation: CFrame;
    template: BoatTemplate;
    upgrades?: string[];
    customizations?: string[];
}

export interface NavigationControls {
    forward: boolean;
    backward: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    brake: boolean;
}

// MODERNIZADO: BoatController con sistema nuevo
export interface BoatController {
    player: Player;
    boatModel: BoatModel;
    isControlling: boolean;
    controls: NavigationControls;
    
    // MODERNO: Componentes del nuevo sistema de física
    linearVelocity?: LinearVelocity;
    angularVelocity?: AngularVelocity;
    attachment?: Attachment;
    vectorForce?: VectorForce;
    
    // LEGACY: Mantener para compatibilidad hacia atrás
    bodyVelocity?: BodyVelocity;
    bodyAngularVelocity?: BodyAngularVelocity;
}

// MODERNIZADO: Tipo BoatModel con nuevos componentes
export type BoatModel = Model & {
    HumanoidRootPart: Part & {
        // Componentes modernos requeridos
        MovementAttachment: Attachment;
        BoatLinearVelocity: LinearVelocity;
        BoatAngularVelocity: AngularVelocity;
        BoatFloatForce: VectorForce;
        FloatationScript: Script;
        
        // Legacy components (opcional para compatibilidad)
        BodyVelocity?: BodyVelocity;
        BodyAngularVelocity?: BodyAngularVelocity;
        BodyPosition?: BodyPosition;
    };
    Deck: Part;
    Helm: Part;
    HelmSeat: Seat;
};

// Eventos de red para control de barcos
export interface BoatNetworkEvents {
    SpawnBoat: (template: string) => void;
    DespawnBoat: () => void;
    StartNavigation: () => void;
    StopNavigation: () => void;
    UpdateControls: (controls: NavigationControls) => void;
}

// Constantes de configuración MODERNIZADAS
export const BOAT_CONFIG = {
    DEFAULT_SPAWN_DISTANCE: 30,
    DEFAULT_HEIGHT: 8,
    WATER_LEVEL: 5,
    MAX_SPEED: 50,
    BASE_ACCELERATION: 10,
    BASE_TURN_SPEED: 5,
    FLOTATION_FORCE: 15000,
    MOVEMENT_FORCE: 6000,
    ANGULAR_FORCE: 8000,
    
    // NUEVAS constantes para el sistema moderno
    MODERN_LINEAR_FORCE_MULTIPLIER: 1.5,
    MODERN_ANGULAR_FORCE_MULTIPLIER: 1.2,
    FLOTATION_RESPONSIVENESS: 0.8,
    MOVEMENT_SMOOTHING: 0.9
} as const;

// NUEVOS tipos de utilidad
export interface ModernBoatComponents {
    hull: Part;
    attachment: Attachment;
    linearVelocity: LinearVelocity;
    angularVelocity: AngularVelocity;
    vectorForce: VectorForce;
}

export interface BoatMovementState {
    velocity: Vector3;
    angularVelocity: Vector3;
    isMoving: boolean;
    isRotating: boolean;
} 
