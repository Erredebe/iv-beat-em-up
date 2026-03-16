# Stage Visual QA Skill

Guia reutilizable para agentes que necesiten validar composicion, escala y legibilidad visual de escenarios con evidencia real por captura.

## Objetivo

No confiar solo en `scaleTier`, offsets o intuicion visual al leer configs. Este flujo genera capturas reproducibles del juego real y reportes JSON para tomar decisiones con evidencia.

## Cuando usarlo

- Si cambias `src/config/levels/*.ts`
- Si tocas `src/systems/StageRenderer.ts`
- Si ajustas props, fondos, HUD o composicion de escenario
- Si una captura del usuario muestra problemas de escala o lectura

## Comandos

Preparar build y preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Capturar escala de props contra fighter:

```bash
npm run qa:stage-scales
```

Capturar composicion general de escenario:

```bash
npm run qa:stage-composition
```

## Salidas

- Escala de props: `artifacts/stage-scale-captures/`
- Reporte de escala: `artifacts/stage-scale-captures/report.json`
- Composicion por escenario: `artifacts/stage-composition-captures/`
- Reporte de composicion: `artifacts/stage-composition-captures/report.json`

## Como interpretar resultados

- `booth_front` deberia sentirse como prop medio, no competir con el fighter
- `container` y `dumpster` deben pesar mas que el fighter, pero no taparlo entero sin intencion
- Si una captura muestra mucho muro vacio o suelo sin ritmo, el problema es de composicion, no solo de escala
- Si el escenario no se identifica rapido, faltan props medianos, signage o silueta de fondo

## Flujo recomendado para agentes

1. Generar capturas
2. Leer `report.json`
3. Abrir 3-6 PNGs clave
4. Ajustar `x`, `y`, `scaleOverride`, `alpha`, `tint` o props en `src/config/levels/*.ts`
5. Repetir capturas hasta que la composicion tenga sentido
6. Cerrar con `npm test` y `npm run build`

## Limites actuales

- El pipeline detecta muy bien problemas de escala y vacio compositivo
- No reemplaza la necesidad de nuevos assets cuando un escenario no tiene vocabulario visual suficiente
- `playa_noche` sigue necesitando arte costero especifico para verse profesional
