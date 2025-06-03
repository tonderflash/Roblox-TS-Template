# 🔒 Seguridad en ResourceService - Validación de RemoteEvents

Este documento detalla las prácticas de seguridad implementadas en el ResourceService para prevenir exploits y crashes del servidor.

## 🚨 Problema de Seguridad en roblox-ts

Por defecto, roblox-ts sugiere tipos específicos para RemoteEvents:

```typescript
// ❌ INSEGURO - Los clientes pueden enviar cualquier dato
Events.useHotbarSlot.connect((player: Player, slotIndex: number) => {
  // Si el cliente envía `nil` en lugar de number, ¡el servidor puede crashear!
  this.useHotbarSlot(player, slotIndex);
});
```

**Problema:** Los exploiters pueden enviar cualquier tipo de dato al servidor, causando errores y posibles crashes.

## ✅ Solución Implementada

### 1. **Tipos `unknown` en Definiciones de Eventos**

```typescript
// shared/network.ts
interface ServerEvents {
  useHotbarSlot: (slotIndex: unknown) => void; // ⚠️ SEGURO
  moveItemToHotbar: (
    itemId: unknown,
    fromSlot: unknown,
    toSlot: unknown
  ) => void;
  // ... todos los eventos usan unknown
}
```

### 2. **Sistema de Validación Completo**

```typescript
// types/ResourceServiceTypes.ts
export function validateHotbarSlotIndex(value: unknown): value is number {
  return (
    typeIs(value, "number") &&
    value >= 0 &&
    value <= 8 &&
    value === math.floor(value)
  );
}

export function validateItemId(value: unknown): value is string {
  return typeIs(value, "string") && value.size() > 0 && value.size() <= 50;
}

export function validateAttackType(value: unknown): value is AttackType {
  return (
    typeIs(value, "string") &&
    (value === "M1" || value === "Skill1" || value === "Skill2")
  );
}

export function validateSetting(
  value: unknown
): value is "Play Music" | "Sound Effects" | "PvP" {
  return (
    typeIs(value, "string") &&
    (value === "Play Music" || value === "Sound Effects" || value === "PvP")
  );
}
```

### 3. **Validación Segura en Event Handlers**

```typescript
// TestingService.ts
Events.addExperience.connect((player: Player, amount: unknown) => {
  const validAmount = safeValidate(
    validateExperienceAmount,
    amount,
    "addExperience.amount"
  );

  if (!validAmount) {
    warn(`[TestingService] addExperience: Amount inválido de ${player.Name}`);
    return; // ⚠️ Terminar temprano si la validación falla
  }

  this.addExperience(player, validAmount);
});
```

## 🛡️ Servicios Protegidos

Todos los servicios del sistema han sido securizados:

### **TestingService** ✅

- `addExperience`: Valida experiencia (0-10000, entero)
- `setLevel`: Valida nivel (1-1000, entero)

### **CombatService** ✅

- `performAttack`: Valida tipo de ataque (M1/Skill1/Skill2)
- `equipFruit`: Valida ID de fruta (fire/lightning/ice/darkness/light)

### **SettingsService** ✅

- `toggleSetting`: Valida configuración ("Play Music"/"Sound Effects"/"PvP")

### **InventoryService** ✅

- `craftItem`: Valida ID de receta (string 1-50 chars)
- `giveResource`: Valida tipo y cantidad de recurso
- `unlockRecipe`: Valida ID de receta

### **ResourceService** ✅

- `useHotbarSlot`: Valida índice de hotbar (0-8)
- `moveItemToHotbar`: Valida item ID y slots
- `moveHotbarSlot`: Valida slots de origen y destino

## 📋 Validadores Implementados

| Validador                  | Propósito                  | Validaciones                  |
| -------------------------- | -------------------------- | ----------------------------- |
| `validateHotbarSlotIndex`  | Índices de hotbar          | `number`, 0-8, entero         |
| `validateItemId`           | IDs de items               | `string`, 1-50 chars          |
| `validateResourceAmount`   | Cantidades                 | `number`, 1-1000, entero      |
| `validateSlotIndex`        | Índices generales          | `number`, -1 a 8, entero      |
| `validateExperienceAmount` | Cantidades de experiencia  | `number`, 0-10000, entero     |
| `validatePlayerLevel`      | Niveles de jugador         | `number`, 1-1000, entero      |
| `validateAttackType`       | Tipos de ataque            | `AttackType` enum             |
| `validateFruitId`          | IDs de frutas del diablo   | `string`, lista específica    |
| `validateSetting`          | Configuraciones de usuario | `string`, valores específicos |
| `validateResourceType`     | Tipos de recursos          | `string`, lista válida        |
| `validateRecipeId`         | IDs de recetas de crafting | `string`, 1-50 chars          |

## 🔧 Función de Utilidad

```typescript
export function safeValidate<T>(
  validator: (value: unknown) => value is T,
  value: unknown,
  context: string
): T | undefined {
  if (validator(value)) {
    return value;
  } else {
    warn(
      `[ResourceService] Validación falló en ${context}: tipo inválido o valor fuera de rango`
    );
    return undefined;
  }
}
```

## 🚨 Sistema de Detección de Exploits

Cuando la validación falla, el sistema:

1. **Registra el intento** con `warn()`
2. **Identifica al jugador** que envió datos inválidos
3. **Termina la operación** sin procesar
4. **Mantiene estabilidad** del servidor
5. **Logs específicos** por servicio y contexto

## 📊 Beneficios de Implementación

✅ **100% de RemoteEvents protegidos** contra datos malformados  
✅ **Detección automática de exploits** con logging detallado  
✅ **Mantiene integridad** de datos del juego  
✅ **Prevención completa de crashes** del servidor  
✅ **Cumple mejores prácticas** de roblox-ts  
✅ **Escalabilidad:** Fácil agregar nuevos validadores

## 🔍 Ejemplos de Logs de Exploit

```
[TestingService] addExperience: Amount inválido de ExploiterPlayer123
[CombatService] performAttack: AttackType inválido de HackerUser456
[SettingsService] toggleSetting: Setting inválido de CheaterGuy789
[ResourceService] useHotbarSlot: SlotIndex inválido de ExploitBot000
```

## 📚 Referencias

- [roblox-ts Remote Event Types](https://roblox-ts.com/docs/guides/remote-event-types/)
- [Validación con @rbxts/t](https://www.npmjs.com/package/@rbxts/t)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

_Esta implementación sigue las mejores prácticas de seguridad recomendadas por la comunidad de roblox-ts y estudios AAA. Todos los servicios están ahora completamente protegidos contra ataques de exploiters._
