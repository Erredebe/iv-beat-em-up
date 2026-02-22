# ASSETS Runtime - Spain 90

Politica aplicada:
- pack activo por defecto: `arcade_90`
- fallback de compatibilidad: `legacy_sms`
- solo recursos `CC0` o `CC-BY`
- trazabilidad legal mantenida en `src/config/assets/assetManifest.ts`

## Pack activo (`arcade_90`)

### Personajes (64x128 / strips de 10 frames)
`player_idle_strip10, player_walk_strip10, player_attack1_strip10, player_attack2_strip10, player_attack3_strip10, player_air_attack_strip10, player_special_strip10, player_hurt_strip10, player_knockdown_strip10, player_getup_strip10`

`enemy_idle_strip10, enemy_walk_strip10, enemy_attack1_strip10, enemy_attack2_strip10, enemy_attack3_strip10, enemy_air_attack_strip10, enemy_special_strip10, enemy_hurt_strip10, enemy_knockdown_strip10, enemy_getup_strip10`

### Escenario / fondos / UI
`street_sheet, street_tileset, street_props, police_car_sheet, city_far, city_mid, city_close, portrait_boxeador, portrait_veloz, portrait_tecnico`

### Audio
`theme_a, theme_b, sfx_hit, sfx_hit_alt, sfx_jump, sfx_special, sfx_knockdown, sfx_break, sfx_ui`

### Derivaciones internas runtime
`street_clean_tileset, prop_booth, prop_crate, prop_car, city_far_band, city_mid_band, city_close_band, hud_frame, ui_btn, hit_spark`

## Fuentes y licencia

- Base SMS OpenGameArt de chasersgaming (CC0) para la version legacy y material de referencia visual.
- Fondos base de Quintus (CC0) en OpenGameArt.
- Audio base de bart, Binarpilot, Devlos y qubodup (CC0/CC-BY) en OpenGameArt.
- Pack `arcade_90` generado y adaptado para runtime del proyecto sobre material permitido.

## Ubicacion runtime

- Legacy: `public/assets/external/`
- Arcade: `public/assets/external/arcade/`
