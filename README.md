# Spain 90

`Spain 90` es un beat 'em up 2D arcade con ambientacion de Espana urbana (1995), ahora con pipeline visual tipo CPS, campana por 4 escenarios y roster jugable.

## Que incluye esta version

- 3 protagonistas jugables (`Kastro`, `Marina`, `Meneillos`) con stats y frame-data propios
- 6 clases de enemigos (`brawler`, `rusher`, `tank`, `agile_f`, `bat_wielder`, `mini_boss`)
- 4 escenarios de campana:
  - `market_95`
  - `metro_sur`
  - `playa_noche`
  - `puerto_rojo`
- Seleccion de personaje y escena de introduccion
- HUD arcade ampliado: nombre, retrato, vida, especial, score, tiempo, objetivo y target enemigo
- Props rompibles con puntuacion
- Sistema de features por flags (`src/config/features.ts`) con overrides por query/localStorage
- Pack de assets runtime unico `arcade_90` (sin fallback legacy)
- Tests de manifiesto legal, crops, layouts, roster, animaciones y contratos HUD

## Stack

- `TypeScript`
- `Phaser 3`
- `Vite`
- `Vitest`

## Estructura principal

- `src/scenes/`: `Boot`, `Preload`, `Title`, `CharacterSelect`, `Intro`, `Street`
- `src/entities/`: `BaseFighter`, `Player`, `EnemyBasic`
- `src/systems/`: combate, colision, spawn, profundidad, audio, stage renderer, breakables
- `src/config/gameplay/`: roster jugable, roster enemigo, campana y estado de sesion
- `src/config/levels/`: catalogo y layouts de escenarios
- `src/config/assets/`: manifiesto runtime y crops derivados
- `public/assets/external/arcade/`: pack arcade runtime
- `ASSETS.md`: trazabilidad legal/licencias

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Ejecutar

```bash
npm install
npm run dev
```

Build produccion:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

Regenerar sprites runtime por pipeline:

```bash
npm run build:runtime-images
```

Tests:

```bash
npm test
```

## Controles

Teclado:
- Mover: `Flechas`
- Ataque: `Z`
- Salto: `X`
- Especial: `C`
- Pausa: `ESC`
- Confirmar UI: `ENTER`
- Debug: `F1`
- Editor runtime: `F2`

Gamepad:
- Mover: `D-Pad / Stick izquierdo`
- Ataque: `A / Cross`
- Salto: `B / Circle`
- Especial: `X / Square / LT`
- Pausa: `Start / Options`

## Feature flags (QA)

Archivo: `src/config/features.ts`

- `combatRework`
- `enemyRoster`
- `stagePack`
- `arcadeHud`
- `characterSelect`
- `storyIntro`
- `breakableProps`
- `enhancedSfx`

Override por URL (ejemplo):
- `?ff_storyIntro=0`

## Estado actual

La base tecnica usa un pipeline visual runtime unico (sin rama legacy). Si vas a seguir puliendo contenido final (arte/audio), revisa primero:
- `src/config/assets/packs/arcadeManifest.ts`
- `scripts/art/build-runtime-images.cjs`
- `src/config/visual/fighterAnimationSets.ts`
- `src/config/levels/stageCatalog.ts`
- `src/scenes/StreetScene.ts`

## Guia rapida: calibracion visual de stages

- Perfil por stage en `src/config/levels/*` usando `visualProfile` (baseGradient, colorGrade, rainIntensity, neonIntensity y foregroundAccents).
- Reutiliza moods desde `src/config/levels/stageVisualPresets.ts` y aplica overrides minimos por escenario.
- Mantener overlays legibles: `colorGrade.alpha` recomendado `0.03-0.13`; evitar valores altos que apaguen sprites o hit sparks.
- Ajusta `neonIntensity` entre `0.55-1` para que carteles destaquen sin competir con VFX de combate.
- Usa `rainIntensity` `0-1` y valida en gameplay real (multienemigo + efectos de golpe) antes de cerrar cambios.
