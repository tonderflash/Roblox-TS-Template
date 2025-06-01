# 🏴‍☠️ PROJECT_PLAN.md - "Pirate Islands: Fast-Paced PvP Adventure"

**Active-Phase: 1**

## 📋 Resumen Ejecutivo

**Objetivo:** Juego pirata fast-paced con múltiples islas pequeñas, barcos personalizables, raids por isla, construcción de bases y PvP intenso diseñado para maximizar revenue.

**Público Objetivo:** 12-18 años (Gen Z / Alpha tardía)

**Core Gameplay Loop:**

1. **Raids en islas temáticas** → conseguir materiales/loot
2. **Construir/mejorar barco** → mejor navegación y combate naval
3. **Construir base en isla mesh** → storage y respawn personalizado
4. **Defender/atacar bases** → PvP raids por loot de otros jugadores
5. **Repetir con mejor gear** → progresión infinita

**Diferenciadores Clave:**

- **Sesiones de 10-15 min** → perfect for mobile
- **Barcos 100% personalizables** → monetización premium
- **Base building + PvP raids** → engagement social alto
- **Loot-driven economy** → trading y FOMO
- **Fast respawn/rebuild** → low frustration, high action

---

## 🎯 FASE 1: CORE ISLAND SYSTEM (6-8 semanas)

_"Islas + Barcos + Combat Básico"_

### 🏝️ **Sistema de Islas Multiple**

**Completions requeridas:**

- [x] Arquitectura técnica base
- [x] Sistema de combate básico
- [x] Sistema de stats y daño
- [x] **1 isla básica con spawn** (isla SpawnIsland de 200x200 studs)
- [x] **5 NPCs básicos para farmeo** (Pirate Thug, Bandit Rookie, Marine Soldier, etc.)
- [x] **Sistema de respawn automático** (30-120 segundos)
- [x] **Detección y IA básica** (NPCs atacan jugadores en rango)
- [x] **6-8 islas pequeñas temáticas** (5-10 min para clear)
  - [x] Isla Pirata (enemies básicos, loot común) - Bahía Pirata
  - [x] Isla Marina (enemies fuertes, loot militar) - Base Marina
  - [x] Isla Volcán (fire theme, rare materials) - Forja del Volcán
  - [x] Isla Hielo (ice theme, building materials) - Cavernas de Hielo
  - [x] Isla Jungla (nature theme, frutas raras) - Templo de la Jungla
  - [x] Isla Desierto (sand theme, treasure chests) - Ruinas del Desierto
- [x] **Navegación fluida entre islas** (<3s load time)
- [x] **Sistema de spawn/teleport** rápido

### 🚢 **Sistema de Barcos Personalizables**

**Completions requeridas:**

- [x] **Barco base funcional** (movement + health)
- [x] **Sistema de navegación tipo ARK**
  - [x] Deck walkable para caminar libremente en el barco
  - [x] Timón/Helm para control de navegación
  - [x] Barandas de seguridad y cañones en deck
  - [x] Sistema anti-volcado y navegación suave
  - [x] Seat opcional para control del barco
- [ ] **Sistema de upgrades**:
  - Speed boost (+20/40/60% speed)
  - Armor plating (+50/100/150% HP)
  - Cannons (básico/avanzado/legendario)
  - Storage expansion (más loot capacity)
- [ ] **Customización visual**:
  - 5+ colores de vela ($99-199 Robux)
  - 3+ diseños de casco ($199-299 Robux)
  - Figureheads premium ($299-499 Robux)
- [ ] **Combate naval básico** (cannon vs cannon)

### ⚔️ **Combat System Optimizado**

**Completions requeridas:**

- [x] Sistema de combate básico funcionando
- [x] 5 frutas míticas con habilidades
- [x] **Sistema de level y experiencia** (EXP por matar NPCs, level ups automáticos)
- [x] **Integración NPC-Player combat** (jugadores pueden atacar NPCs)
- [x] **Stats scaling por nivel** (+50 HP, +10 damage por level)
- [x] **Sistema de targeting automático** (jugadores y NPCs en rango)
- [ ] **Balancing para PvP rápido**:
  - TTK (Time to Kill) de 5-10 segundos
  - Combos simples pero satisfactorios
  - Escape mechanics para evitar spawn camping
- [ ] **Respawn instantáneo** en barco o base

---

## 🎯 FASE 2: BASE BUILDING & PVP (4-6 semanas)

_"Construcción + Raids + Monetización Premium"_

### 🏗️ **Sistema de Base Building**

**Completions requeridas:**

- [ ] **5-8 islas mesh para construcción** (solo terrain básico)
- [ ] **Building system simple**:
  - Walls (madera/piedra/metal)
  - Storage chests (pequeño/mediano/grande)
  - Spawn point personalizado
  - Defensive turrets (auto-attack)
- [ ] **Claim system**: 1 isla por player, expira en 7 días sin login
- [ ] **Resource requirements**: materiales de raids para building

### 🏴‍☠️ **Sistema de Crews Fast-Paced**

**Completions requeridas:**

- [ ] **Crews de 3-8 players** (óptimo para raids)
- [ ] **Shared base building** en crew islands
- [ ] **Crew raids coordinados** (attack/defend bases)
- [ ] **Loot sharing automático** en crew raids
- [ ] **Crew wars**: invasiones programadas de 15-20 min

### 💰 **Monetización Base Building**

**Completions requeridas:**

- [ ] **Build Passes**:
  - Advanced Building Kit ($499 Robux)
  - Instant Build Pass ($299 Robux)
  - Premium Materials Pack ($399 Robux)
- [ ] **Defense Passes**:
  - Auto-Turret Pack ($699 Robux)
  - Shield Generator ($799 Robux)
  - Alarm System ($199 Robux)

---

## 🎯 FASE 3: ECONOMY & RAIDS EXPANSION (4-5 semanas)

_"Trading + Events + Revenue Optimization"_

### 💎 **Loot-Driven Economy**

**Completions requeridas:**

- [ ] **Material tiers**: Common → Rare → Epic → Legendary
- [ ] **Trading system** entre players
- [ ] **Auction house** básico para rare items
- [ ] **Daily/Weekly material demands** (dynamic economy)
- [ ] **Limited time materials** en eventos especiales

### 🎯 **Raid Events & Challenges**

**Completions requeridas:**

- [ ] **Boss raids semanales** (require crews, 20-30 min)
- [ ] **Daily challenges** con material rewards
- [ ] **Invasion events**: NPCs attack player bases
- [ ] **Double loot weekends** para retention
- [ ] **Seasonal events** con exclusive materials

### 💸 **Revenue Maximization**

**Completions requeridas:**

- [ ] **Loot Boosters**:
  - 2x Materials ($199 Robux, 24h)
  - Rare Drop Chance ($299 Robux, 48h)
  - Build Speed 5x ($99 Robux, 2h)
- [ ] **Convenience Features**:
  - Fast Travel Between Islands ($399 Robux)
  - Base Protection 24h ($199 Robux)
  - Inventory Expansion ($299 Robux)

---

## 🎯 FASE 4: SOCIAL & ENDGAME (3-4 semanas)

_"Leaderboards + Competitions + Long-term Retention"_

### 🏆 **Competitive Systems**

**Completions requeridas:**

- [ ] **Crew leaderboards**: Most successful raids
- [ ] **Individual leaderboards**: Best builders, fighters
- [ ] **Seasonal rankings** con exclusive rewards
- [ ] **Tournament system**: Crew vs Crew championships
- [ ] **Hall of Fame**: Top crews/players display

### 🎮 **Endgame Content**

**Completions requeridas:**

- [ ] **Prestige system**: Rebuild base with bonuses
- [ ] **Legendary ship upgrades**: Super expensive, game-changing
- [ ] **Master Builder status**: Unlock exclusive building materials
- [ ] **Crew legacy features**: Multi-generational crew progression

---

## 💡 **FEATURES CLAVE PARA FAST-PACED GAMEPLAY**

### ⚡ **Speed Optimization**

- ✅ **Respawn en 3 segundos** máximo
- ✅ **Load times <5 segundos** entre islas
- ✅ **Combat TTK 5-10 segundos** para PvP dinámico
- ✅ **Building placement instant** con materials

### 💰 **Monetización de Alta Frecuencia**

- ✅ **Boosters consumibles** cada 2-4 horas
- ✅ **Emergency repairs** cuando base está bajo ataque
- ✅ **Instant upgrades** para impatient players
- ✅ **Premium materials** solo disponibles con Robux

### 🎯 **Engagement Loops**

- ✅ **Sessions de 10-15 min** perfect length
- ✅ **Immediate rewards** tras cada raid
- ✅ **Social pressure** de crew raids
- ✅ **FOMO events** semanales

---

## 🚢 **SISTEMA DE BARCOS DETALLADO**

### **Tier 1: Barcos Básicos** (Gratis)

- Starter Sloop: Velocidad base, 100 HP
- Basic Cannon: 25 damage por shot

### **Tier 2: Barcos Mejorados** ($299-699 Robux)

- War Galleon: +40% speed, 200 HP, 2 cannons
- Speed Cutter: +80% speed, 150 HP, escape focused
- Tank Frigate: +100% HP, -20% speed, 4 cannons

### **Tier 3: Barcos Legendarios** ($999-1499 Robux)

- Ghost Ship: Invisible por 30s cooldown
- Fire Drake: Fire cannons con DOT damage
- Ice Breaker: Freeze enemies por 5s

### **Customización Premium**

- **Visual Upgrades**: $99-499 Robux
- **Performance Mods**: $199-799 Robux
- **Special Effects**: $299-999 Robux

---

## 🏝️ **ISLAND TYPES & REVENUE**

### **Raid Islands** (PvE Content)

1. **Pirate Cove**: Easy loot, perfect for beginners
2. **Marine Base**: Military gear, medium difficulty
3. **Volcano Forge**: Fire weapons, high difficulty
4. **Ice Caverns**: Building materials, puzzle elements
5. **Jungle Temple**: Rare fruits, exploration based
6. **Desert Ruins**: Treasure hunting, hidden chests

### **Build Islands** (Player Bases)

- **Small Islands**: 1-2 players ($0 - claim free)
- **Medium Islands**: 3-5 players ($499 Robux permanent)
- **Large Islands**: 6-8 players ($999 Robux permanent)
- **Premium Islands**: Special themes ($1299 Robux)

---

## 🏆 **MÉTRICAS DE ÉXITO FAST-PACED**

### **Engagement Metrics:**

- ✅ **Session time: 12-18 min average**
- ✅ **Raids per session: 3-5**
- ✅ **PvP encounters: 2-3 per session**
- ✅ **Base attacks: 1-2 per day**

### **Revenue Targets:**

- ✅ **Month 1**: $100-300 USD (barcos + boosters)
- ✅ **Month 3**: $300-800 USD (base building boom)
- ✅ **Month 6**: $500-1500 USD (competitive scene)

### **Retention Targets:**

- ✅ **D1: 25%+** (fast action hooks players)
- ✅ **D7: 15%+** (base building creates investment)
- ✅ **D30: 8%+** (crew social bonds)

---

## ⏱️ **TIMELINE OPTIMIZADO**

### **Semanas 1-3:** Core island system + basic boats

### **Semanas 4-6:** Combat balancing + PvP testing

### **Semanas 7-8:** Base building MVP + crew system

### **Semanas 9-12:** Economy + trading + monetization

### **Semanas 13-16:** Events + competitions + endgame

### **Semanas 17-20:** Polish + marketing + scaling

**Target MVP Launch:** 8 semanas (islas + barcos + combat)
**Target Full Release:** 20 semanas

---

## 💰 **ESTRATEGIA DE MONETIZACIÓN AGRESIVA**

### **Week 1-2: Hook Players Fast**

- Ship Starter Pack ($499 Robux) - Better boat immediately
- 2x Loot Booster ($199 Robux) - Get ahead quick
- Fast Travel Pass ($299 Robux) - Convenience addiction

### **Week 3-8: Base Building Rush**

- Advanced Building Kit ($499 Robux) - Better defenses
- Premium Island Claim ($999 Robux) - Status symbol
- Instant Build Pack ($299 Robux) - Impatience monetization

### **Week 9+: Competitive Advantage**

- Legendary Ship ($1499 Robux) - P2W but balanced
- Crew Advantage Pack ($699 Robux) - Team benefits
- Seasonal Exclusives ($299-999 Robux) - FOMO maximization

**Expected Revenue Curve:** $50 → $200 → $500 → $1000+ USD/mes

---

## 🎯 **FEATURES NUEVOS IMPLEMENTADOS - FASE 1**

### 🏝️ **Sistema de Islas Graybox Completado**

**✅ Implementado:**

- **Océano masivo** (4000x4000 studs) para navegación libre
- **7 islas temáticas** generadas como graybox con diferentes temas:
  - 🏴‍☠️ **Bahía Pirata** - Nivel 2, enemies básicos
  - 🛡️ **Base Marina** - Nivel 4, enemies militares
  - 🌋 **Forja del Volcán** - Nivel 6, fire theme
  - ❄️ **Cavernas de Hielo** - Nivel 5, building materials
  - 🌿 **Templo de la Jungla** - Nivel 4, nature theme
  - 🏜️ **Ruinas del Desierto** - Nivel 3, treasure hunting
- **Docks automáticos** en cada isla para atracar barcos
- **Marcadores visuales** para spawn points de NPCs (rojos) y recursos (verdes)
- **Sistema de información** con etiquetas descriptivas en cada isla

### 🚢 **Sistema de Navegación ARK-Style Completado**

**✅ Implementado:**

- **Barcos navegables** con deck walkable de 10x18 studs
- **Timón/Helm funcional** para control de navegación
- **Barandas de seguridad** para evitar caerse del barco
- **Cañones en deck** posicionados en los lados del barco
- **Sistema anti-volcado** para navegación estable
- **Seat opcional** para control cómodo del barco
- **Navegación fluida** con BodyVelocity mejorado (6000 MaxForce)
- **Control de rotación** con BodyAngularVelocity (8000 MaxTorque)

### 🎮 **Comandos de Testing Implementados**

**✅ Comandos disponibles:**

```bash
/listislands                    # Ver todas las islas con info detallada
/tptoisle [player] [islandId]   # Teleportar a isla específica
/spawnboat [player]             # Spawnear barco mejorado con deck
/despawnboat [player]           # Despawnear barco
/listboats                      # Ver barcos disponibles
```

**Flujo de testing recomendado:**

1. **Ver islas**: `/listislands`
2. **Teleportarse**: `/tptoisle TonderFlashh pirate_cove`
3. **Spawnear barco**: `/spawnboat TonderFlashh`
4. **Navegar libremente** caminando en el deck
5. **Probar otras islas**: `/tptoisle TonderFlashh volcano_forge`

### 🎯 **Próximos Pasos para Completar Fase 1**

**Pendientes importantes:**

- [ ] **Sistema de controles de navegación** del lado cliente (WASD para mover barco)
- [ ] **Balancing PvP** (TTK 5-10 segundos)
- [ ] **Respawn en barco** cuando el jugador muere
- [ ] **Sistema de upgrades** de barcos (speed, armor, cannons)
- [ ] **Combate naval** básico (cañón vs cañón)

**🎯 Objetivo inmediato:** Sistema de controles cliente para navegación del barco con WASD + mouse.

_Este template está optimizado para addiction loops, social pressure, y monetización frecuente manteniendo gameplay skill-based y divertido._
