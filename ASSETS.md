# ASSETS Runtime - Spain 90

Politica aplicada:
- pack runtime unico: `arcade_90`
- sin fallback legacy en runtime
- solo recursos `CC0` o `CC-BY`
- trazabilidad legal en `src/config/assets/packs/arcadeManifest.ts`

## Runtime (`arcade_90`)

### Personajes (64x128, strips de 10 frames)
`kastro_idle_strip10, kastro_walk_strip10, kastro_attack1_strip10, kastro_attack2_strip10, kastro_attack3_strip10, kastro_air_attack_strip10, kastro_special_strip10, kastro_hurt_strip10, kastro_knockdown_strip10, kastro_getup_strip10`

`marina_idle_strip10, marina_walk_strip10, marina_attack1_strip10, marina_attack2_strip10, marina_attack3_strip10, marina_air_attack_strip10, marina_special_strip10, marina_hurt_strip10, marina_knockdown_strip10, marina_getup_strip10`

`meneillos_idle_strip10, meneillos_walk_strip10, meneillos_attack1_strip10, meneillos_attack2_strip10, meneillos_attack3_strip10, meneillos_air_attack_strip10, meneillos_special_strip10, meneillos_hurt_strip10, meneillos_knockdown_strip10, meneillos_getup_strip10`

`enemy_idle_strip10, enemy_walk_strip10, enemy_attack1_strip10, enemy_attack2_strip10, enemy_attack3_strip10, enemy_air_attack_strip10, enemy_special_strip10, enemy_hurt_strip10, enemy_knockdown_strip10, enemy_getup_strip10`

### Escenario, fondos y UI
`street_sheet, street_tileset, street_props, police_car_sheet, city_far, city_mid, city_close, portrait_kastro, portrait_marina, portrait_meneillos`

### Audio
`theme_a, theme_b, sfx_hit, sfx_hit_alt, sfx_jump, sfx_special_kastro, sfx_special_marina, sfx_special_meneillos, sfx_knockdown, sfx_break, sfx_ui`

### Derivaciones runtime
`street_clean_tileset, prop_booth_front, prop_container, prop_window_panel, prop_crate, city_far_band, city_mid_band, city_close_band, hud_frame, ui_btn, hit_spark`

## Fuentes y licencia

- Sprites/fondos runtime del proyecto: `CC0`, autor `Spain 90 Team`.
- Audio base: OpenGameArt (`bart`, `Binarpilot`, `Devlos`, `qubodup`) bajo `CC0/CC-BY`.

## Ubicacion runtime

- `public/assets/external/arcade/`

## Guia de arte tecnico para nuevos stages

1. **Elegir mood base** en `src/config/levels/stageVisualPresets.ts` (`wetNight`, `industrialWarm`, `neonCoast`, `crimsonHarbor`).
2. **Crear `visualProfile` en el layout** con `createStageVisualProfile(...)`; usar overrides solo para diferenciar identidad del stage.
3. **Calibrar gradiente y grade**: deja el fondo con contraste, sin oscurecer sprites jugables ni efectos de impacto.
4. **Afinar acentos de primer plano** (`facade`, `foregroundDeco`, skyline y crates) para separar capas y mejorar lectura de profundidad.
5. **Validar legibilidad**: run `npm test` + sesion manual Title → Select → Street revisando HUD, personajes y hit effects.
