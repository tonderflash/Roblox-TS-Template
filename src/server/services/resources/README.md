# ResourceService - Arquitectura Modular

El `ResourceService` ha sido refactorizado de un archivo monolítico de 1158 líneas a una arquitectura modular siguiendo principios de responsabilidad única y patrones de diseño utilizados en estudios AAA.

## 📁 Estructura del Proyecto

```
src/server/services/resources/
├── ResourceService.ts          # Coordinador principal (Facade Pattern)
├── index.ts                   # Exportaciones centralizadas
├── README.md                  # Esta documentación
├── SECURITY.md               # 🔒 Documentación de seguridad
├── types/
│   └── ResourceServiceTypes.ts   # Interfaces y tipos compartidos
├── managers/
│   ├── PlayerResourcesManager.ts # Gestión de datos del jugador
│   ├── ResourceNodeManager.ts    # Gestión de nodos en el mundo 3D
│   └── InventoryTransactionManager.ts # Sistema de transacciones atómicas
├── engines/
│   └── HarvestingEngine.ts      # Lógica de cosecha y damage
└── ui/
    └── ResourceUIManager.ts     # Interfaz de usuario y efectos visuales
```

## 🔒 Seguridad - RemoteEvent Protection

**⚠️ CRÍTICO:** Este proyecto implementa las mejores prácticas de seguridad de roblox-ts:

- ✅ **Todos los parámetros de eventos** usan `unknown` type
- ✅ **Validación con `typeIs`** antes de procesar datos
- ✅ **Prevención de crashes** por datos malformados de exploiters
- ✅ **Logging de intentos de exploit** para monitoreo

```typescript
// ❌ INSEGURO - No hagas esto
Events.useHotbarSlot.connect((player: Player, slotIndex: number) => {
  // Exploiter puede enviar nil y crashear el servidor!
});

// ✅ SEGURO - Implementación actual
Events.useHotbarSlot.connect((player: Player, slotIndex: unknown) => {
  const validSlot = safeValidate(
    validateHotbarSlotIndex,
    slotIndex,
    "useHotbarSlot"
  );
  if (!validSlot) return; // Terminar si hay exploit
  // ... procesar seguramente
});
```

**📚 Ver [SECURITY.md](./SECURITY.md) para documentación completa de seguridad.**

## 🏗️ Patrones de Diseño Implementados

### 1. **Facade Pattern**

- `ResourceService` actúa como fachada, manteniendo la misma API pública
- Delega responsabilidades a managers especializados
- Garantiza compatibilidad con código existente

### 2. **Composition Pattern**

- ResourceService compone múltiples managers
- Cada manager tiene una responsabilidad específica
- Comunicación a través de interfaces bien definidas

### 3. **Dependency Injection**

- Servicios externos se inyectan en lugar de crear dependencias circulares
- Interfaces claramente definidas para cada servicio
- Permite testing y mocking fácil

### 4. **Transaction Script Pattern**

- `InventoryTransactionManager` implementa transacciones atómicas
- Sistema de snapshots para rollback en caso de errores
- Validación previa antes de ejecutar cambios

## 📋 Responsabilidades de cada Módulo

### ResourceService.ts (Coordinador)

- ✅ Punto de entrada único
- ✅ Coordinación entre managers
- ✅ Mantenimiento de API pública
- ✅ **Validación segura de eventos de red**

### PlayerResourcesManager.ts

- ✅ Gestión de datos de recursos del jugador
- ✅ Sincronización con cliente
- ✅ Manejo del hotbar
- ✅ Validación de stacking

### ResourceNodeManager.ts

- ✅ Spawning de nodos de recursos
- ✅ Sistema de respawn inteligente
- ✅ Posicionamiento con raycast
- ✅ Gestión del ciclo de vida de nodos

### ResourceUIManager.ts

- ✅ Creación y actualización de GUI
- ✅ Efectos visuales de cosecha
- ✅ Animaciones y feedback visual
- ✅ Health bars y displays

### HarvestingEngine.ts

- ✅ Cálculo de damage efectivo
- ✅ Sistema de yields ARK-style
- ✅ Críticos y recursos raros
- ✅ Integración con herramientas

### InventoryTransactionManager.ts

- ✅ Transacciones atómicas
- ✅ Sistema de validación
- ✅ Snapshots para rollback
- ✅ Drag & drop profesional

## 🔧 Ventajas de la Nueva Arquitectura

### **Mantenibilidad**

- Cada archivo tiene menos de 300 líneas
- Responsabilidades claramente separadas
- Fácil de encontrar y modificar código específico

### **Testabilidad**

- Cada manager se puede testear independientemente
- Mocking fácil a través de interfaces
- Inyección de dependencias permite testing aislado

### **Escalabilidad**

- Fácil agregar nuevos managers
- Extensión sin modificar código existente
- Patrones consistentes para nuevas funcionalidades

### **Seguridad**

- **Validación rigurosa** de todos los datos del cliente
- **Prevención de exploits** y crashes del servidor
- **Logging automático** de intentos maliciosos

### **Legibilidad**

- Nombres descriptivos y organizados
- Separación clara de responsabilidades
- Documentación integrada

## 🚀 Uso y Integración

### Importación Simple

```typescript
import { ResourceService } from "server/services/resources";
```

### Importación Específica

```typescript
import {
  PlayerResourcesManager,
  HarvestingEngine,
  ExtendedPlayerResources,
} from "server/services/resources";
```

### Compatibilidad

El `ResourceService` mantiene **100% de compatibilidad** con la API existente:

- ✅ Todos los métodos públicos funcionan igual
- ✅ Mismos tipos de retorno
- ✅ Misma funcionalidad
- ✅ **Seguridad mejorada** sin cambios en el código cliente
- ✅ No se requieren cambios en código existente

## 📊 Estadísticas de Refactorización

| Métrica                     | Antes     | Después  |
| --------------------------- | --------- | -------- |
| Líneas por archivo          | 1158      | < 300    |
| Responsabilidades por clase | 8+        | 1        |
| Acoplamiento                | Alto      | Bajo     |
| Testabilidad                | Difícil   | Fácil    |
| Mantenibilidad              | Difícil   | Fácil    |
| **Seguridad**               | **Media** | **Alta** |

## 🔄 Migración

### Sin Cambios Requeridos

El refactor mantiene compatibilidad total. No se requieren cambios en:

- ✅ CombatService
- ✅ ToolService
- ✅ InventoryService
- ✅ Cliente/UI código

### Archivo de Backup

El archivo original se guardó como `ResourceService.backup.ts` por seguridad.

---

_Esta arquitectura sigue las mejores prácticas utilizadas en estudios AAA como Epic Games, Blizzard y Riot Games para sistemas de inventario y recursos._
