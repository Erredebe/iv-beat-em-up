# AGENTS.md — Guía para agentes de IA en `iv-beat-em-up`

Este documento define cómo debe trabajar un agente de IA dentro de este repositorio.

## 1) Contexto del proyecto

- **Nombre del juego:** Spain 90
- **Género:** Beat 'em up 2D arcade
- **Stack:** TypeScript + Phaser 3 + Vite + Vitest
- **Objetivo técnico:** mantener una experiencia arcade fluida, legible y consistente con estética retro/pixel-art.
- **Producción (web desplegada):** https://iv-beat.netlify.app/

## 2) Arquitectura (mapa rápido)

- `src/scenes/`: flujo principal del juego (`Boot`, `Preload`, `Title`, `CharacterSelect`, `Intro`, `Street`).
- `src/entities/`: entidades jugables y enemigas (`BaseFighter`, `Player`, `EnemyBasic`).
- `src/systems/`: sistemas desacoplados (combate, colisiones, spawn, profundidad, audio, render de stage, breakables).
- `src/config/gameplay/`: configuración de roster, campaña y sesión.
- `src/config/levels/`: catálogo y layouts de escenarios.
- `src/config/assets/`: manifiestos y definición de assets/crops.
- `public/assets/external/arcade/`: assets runtime.
- `scripts/`: utilidades de pipeline (incluyendo build de imágenes runtime).

### Principio de diseño

Priorizar cambios **data-driven** (configuración) sobre hardcode en escenas/sistemas cuando sea razonable.

## 3) Cómo debe interactuar un agente con el proyecto

1. **Leer primero el contexto existente** antes de editar (README, configs, escenas/sistemas afectados).
2. **Respetar la arquitectura actual**: no mover responsabilidades entre escenas/sistemas sin justificación fuerte.
3. **Evitar cambios masivos innecesarios**; hacer parches pequeños, coherentes y reversibles.
4. **No romper contratos públicos internos** (tipos, interfaces y shape de config consumida por escenas/sistemas).
5. **Si un comportamiento depende de flags**, usar/ajustar `src/config/features.ts` en lugar de forks ad hoc.
6. **Documentar decisiones no obvias** en comentarios breves o en el PR.

## 4) Buenas prácticas de código

- Mantener TypeScript estricto, nombres claros y funciones cortas.
- Evitar lógica duplicada entre personajes/enemigos: extraer helpers o config común.
- Separar claramente:
  - lógica de estado,
  - reglas de combate,
  - render/animación,
  - input.
- No introducir “magia numérica” sin contexto: crear constantes con nombre semántico.
- Mantener coherencia con convenciones existentes del repo antes de imponer nuevas.
- Si tocas balance/frame-data, justificar cambios con impacto de gameplay.

## 5) Reglas de gameplay y sensibilidad de beat 'em up

Cuando el cambio afecte combate, movimiento o IA:

- Preservar **game feel arcade** (respuesta rápida de input, feedback claro y timings consistentes).
- Cuidar ventanas de acción: startup/active/recovery, hitstun, knockback, invulnerabilidad.
- Evitar cambios que generen situaciones injustas (stunlock infinito, daño imposible de leer, colisiones ambiguas).
- Mantener legibilidad del combate con múltiples enemigos en pantalla.
- Si hay trade-offs entre realismo y jugabilidad, priorizar jugabilidad.

## 6) Criterios visuales y pixel-perfect

- Respetar estética retro/pixel-art:
  - evitar escalados no uniformes,
  - evitar coordenadas fraccionales cuando rompan nitidez,
  - preservar siluetas y contraste del personaje respecto al fondo.
- Validar alineación de HUD, retratos, barras y textos en resoluciones objetivo.
- Cualquier cambio visual debe buscar consistencia entre escenas (Title, Select, Intro, Street).
- No mezclar estilos de assets incompatibles sin justificación.

## 7) Tests y validación obligatoria

Antes de cerrar cambios, ejecutar como mínimo:

```bash
npm test
```

Y cuando aplique:

```bash
npm run build
npm run dev
```

Si se tocan assets/pipeline visual:

```bash
npm run build:runtime-images
```

### Checklist de QA para agentes

- [ ] El juego arranca sin errores de consola críticos.
- [ ] El flujo base (Title → selección → intro/street) sigue operativo.
- [ ] HUD y cámara se mantienen estables.
- [ ] No hay regresiones obvias en colisiones, daño o animaciones.
- [ ] Tests automáticos relevantes en verde.

## 8) Política de cambios

- Si el cambio es grande, dividir en pasos lógicos y explicarlo en el PR.
- Incluir en el PR:
  - qué se cambió,
  - por qué,
  - riesgos,
  - cómo se probó.
- Evitar mezclar refactor + feature + tuning en un solo commit si complica revisión.

## 9) Prioridades del proyecto (orden sugerido)

1. Estabilidad y jugabilidad.
2. Legibilidad visual y feedback de combate.
3. Rendimiento.
4. Mantenibilidad del código.
5. Extensión de contenido.

---
Si hay conflicto entre esta guía y una instrucción explícita del usuario o de sistema, prevalece la instrucción de mayor prioridad.
