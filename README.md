# Spain 90

`Spain 90` es un juego beat 'em up 2D con pixel art, inspirado en la energia urbana de la Espana de mediados de los 90.

## De que va el proyecto

Controlas a un ex-boxeador de barrio que vuelve a su distrito y encuentra las calles tomadas por bandas, extorsion y negocios tapadera.  
La historia avanza zona a zona: limpias la calle, derrotas cabecillas y recuperas el control del barrio.

Incluye:
- Combate con estados (idle, walk, hit, knockdown, getup, ataques y especial)
- Sistema de spawn por zonas con barreras temporales
- Escenario con tilemap, props y parallax
- HUD de vida/objetivo y ayudas de control
- Debug visual (`F1`) y editor de nivel en runtime (`F2`)
- Tests de configuracion, layout y consistencia visual de sprites/crops

## Lore y ambientacion

### Espana, 1995

El pais vive una mezcla de modernizacion y tension social:
- periferias industriales en cambio
- carteles de neones, bares de barrio, recreativos y mercado nocturno
- choque entre cultura local, influencias punk, rap y electronica

En ese contexto, el barrio del protagonista esta dividido en "zonas calientes".  
Cada zona tiene su propio control territorial, su estilo visual y su ritmo de combate.

### Tono narrativo

- Callejero y directo
- Violencia arcade estilizada, no realista
- Heroe de barrio contra estructuras corruptas
- Progresion de "calle libre" hacia "territorio recuperado"

### Facciones (base narrativa)

- **La Cadena**: matones de extorsion y control de comercios.
- **Norte 32**: pandilla agresiva ligada a almacenes y rutas nocturnas.
- **Los Grises**: seguridad privada corrupta que protege a los jefes.

Estas facciones pueden convertirse en enemigos y jefes por zona en futuras iteraciones.

## Direccion artistica

### Estilo visual

- Pixel art 16-bit con escala x3 para personajes
- Paleta nocturna: azules frios, magentas, rojos de ladrillo y neones puntuales
- Escenarios urbanos densos: persianas metalicas, muros de ladrillo, calle sucia y mobiliario de barrio
- Parallax para dar profundidad sin perder lectura del combate

### Estilo sonoro

- Loops arcade/retro para exploracion y combate
- SFX secos y contundentes para golpes, salto y knockdown
- Ritmo general rapido, con identidad de recreativa noventera

## Stack tecnico

- `TypeScript`
- `Phaser 3`
- `Vite`
- `Vitest`

## Estructura principal

- `src/scenes/`: escenas de juego (`Boot`, `Preload`, `Street`)
- `src/entities/`: entidades jugables (`BaseFighter`, `Player`, `EnemyBasic`)
- `src/systems/`: sistemas de combate, colision, profundidad, spawn, audio, etc.
- `src/config/`: constantes, niveles, assets y perfiles visuales
- `public/assets/external/`: sprites, fondos y audio en runtime
- `ASSETS.md`: trazabilidad legal/licencias de assets

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Como ejecutar

```bash
npm install
npm run dev
```

Compilar produccion:

```bash
npm run build
```

Previsualizar build:

```bash
npm run preview
```

Ejecutar tests:

```bash
npm test
```

## Controles

Teclado:
- Mover: `Flechas`
- Ataque: `Z`
- Salto: `X`
- Especial: `C` (consume vida)
- Pausa/Ayuda: `ESC`
- Debug hitboxes/visuales: `F1`
- Editor de nivel: `F2`

Gamepad:
- Mover: `D-Pad / Stick izquierdo`
- Ataque: `A / Cross`
- Salto: `B / Circle`
- Especial: `X / Square / LT`
- Pausa: `Start / Options`

## Estado del proyecto

Proyecto orientado a pulido visual y estabilidad de gameplay base.
Si vas a anadir contenido nuevo (niveles, enemigos, animaciones), revisa primero:
- `src/config/levels/street95Zone1.ts`
- `src/config/visual/fighterVisualProfiles.ts`
- `src/config/assets/assetManifest.ts`
- `src/config/assets/derivedTextureCrops.ts`
