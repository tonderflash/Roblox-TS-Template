# Sistema de Barcos - Roblox-TS

## Descripción General

Sistema modular y escalable para gestionar barcos en el juego, implementado con TypeScript y siguiendo las mejores prácticas de Roblox-TS.

## Estructura del Sistema

```
/boats/
├── types/
│   └── BoatTypes.ts          # Tipos e interfaces del sistema
├── BoatFactory.ts            # Factory para crear barcos
├── BoatNavigationController.ts # Control de navegación
├── BoatTemplates.ts          # Templates predefinidos
└── README.md                 # Esta documentación
```

## Componentes Principales

### 1. BoatService (Principal)

- **Archivo**: `src/server/services/BoatService.ts`
- **Propósito**: Servicio principal que coordina todo el sistema
- **Funciones clave**:
  - `spawnBoat(player, templateId?)` - Spawnea un barco
  - `despawnBoat(player)` - Despawnea un barco
  - `startBoatNavigation(player)` - Inicia control del barco
  - `stopBoatNavigation(player)` - Detiene control del barco

### 2. BoatFactory

- **Propósito**: Crea barcos con componentes modulares
- **Patrón**: Singleton Factory
- **Funciones**:
  - `createBoat(spawnConfig)` - Crea un barco completo
  - `destroyBoat(model)` - Destruye un barco
  - `updateBoatStats(model, stats)` - Modifica estadísticas

### 3. BoatNavigationController

- **Propósito**: Maneja el movimiento y control de barcos
- **Características**:
  - Sistema de controles en tiempo real
  - Flotación automática
  - Validación de componentes

### 4. BoatTemplates

- **Propósito**: Define configuraciones predefinidas de barcos
- **Templates disponibles**:
  - `starter_sloop` - Balandro básico
  - `war_galleon` - Galeón de guerra
  - `speed_cutter` - Cortavientos veloz
  - `fishing_boat` - Barco pesquero

## Uso Básico

### Spawnear un Barco

```typescript
import { Dependency } from "@flamework/core";
import { BoatService } from "./services/BoatService";

const boatService = Dependency<BoatService>();

// Spawnear barco por defecto
boatService.spawnBoat(player);

// Spawnear barco específico
boatService.spawnBoat(player, "war_galleon");
```

### Controlar un Barco

```typescript
// El jugador puede:
// 1. Hacer click en el timón
// 2. Sentarse en el asiento del timón
// 3. Usar programáticamente:
boatService.startBoatNavigation(player);
```

### Controles de Navegación

- **W/↑**: Adelante
- **S/↓**: Atrás
- **A/←**: Girar izquierda
- **D/→**: Girar derecha
- **X**: Salir del control

## Comandos Disponibles

### Comandos de Admin

```
/spawnboat [player] [templateId?]  - Spawnea un barco
/despawnboat [player]              - Despawnea un barco
/giveboat [player] [templateId]    - Da un barco a un jugador
/listboats                         - Lista todos los templates
```

## Configuración

### Constantes Principales

```typescript
export const BOAT_CONFIG = {
  DEFAULT_SPAWN_DISTANCE: 30, // Distancia de spawn del jugador
  DEFAULT_HEIGHT: 8, // Altura de flotación
  WATER_LEVEL: 5, // Nivel del agua
  MAX_SPEED: 50, // Velocidad máxima
  BASE_ACCELERATION: 10, // Aceleración base
  BASE_TURN_SPEED: 5, // Velocidad de giro base
  FLOTATION_FORCE: 15000, // Fuerza de flotación
  MOVEMENT_FORCE: 6000, // Fuerza de movimiento
  ANGULAR_FORCE: 8000, // Fuerza angular
};
```

## Extensibilidad

### Agregar Nuevo Template

1. Editar `BoatTemplates.ts`
2. Agregar nueva configuración al objeto `BOAT_TEMPLATES`
3. El sistema lo detectará automáticamente

### Agregar Nuevos Componentes

1. Actualizar `ComponentConfig` en `BoatTypes.ts`
2. Modificar `BoatFactory.createBoat()` para incluir el componente
3. Actualizar templates que lo usen

### Agregar Upgrades/Customizaciones

1. Expandir arrays `upgrades` y `customizations` en `BoatData`
2. Implementar lógica en `BoatFactory.applyUpgrades()`
3. Crear comandos/interfaz para aplicarlos

## Arquitectura Técnica

### Patrones Implementados

- **Factory Pattern**: Para crear barcos
- **Service Pattern**: Para la gestión central
- **Observer Pattern**: Para eventos de interacción
- **Singleton Pattern**: Para instancias únicas

### Flujo de Datos

1. **BoatService** recibe solicitud de spawn
2. **BoatService** calcula configuración de spawn
3. **BoatFactory** crea el modelo físico
4. **BoatNavigationController** maneja la navegación
5. Los datos se sincronizan automáticamente

### Gestión de Memoria

- Limpieza automática al desconectar jugadores
- Destrucción segura de modelos
- Prevención de barcos huérfanos

## Solución de Problemas

### Barco aparece al revés

✅ **Solucionado**: Usando `CFrame.lookAt()` correctamente

### Barco no flota

- Verificar que `WATER_LEVEL` está en 5
- Confirmar que `BodyPosition` está configurado
- Comprobar altura de spawn (`DEFAULT_HEIGHT = 8`)

### Controles no responden

- Verificar que `BoatNavigationController` está funcionando
- Confirmar que `BodyVelocity` y `BodyAngularVelocity` existen
- Revisar conexiones de eventos en `setupBoatInteraction()`

### Performance

- El sistema usa `RunService.Heartbeat` para actualizaciones fluidas
- Solo los barcos con controladores activos se actualizan
- Limpieza automática previene acumulación de recursos

## Compatibilidad

### Comandos Legacy

El nuevo sistema mantiene compatibilidad con comandos existentes a través de métodos bridge:

- `getPlayerBoat()` - Alias para `getSpawnedBoat()`
- `getPlayerBoatData()` - Acceso a datos de barco
- `updatePlayerBoatData()` - Actualización de datos

### Migración

Si migras desde el sistema anterior:

1. Los datos existentes se preservan
2. Los comandos siguen funcionando
3. La funcionalidad mejora automáticamente
