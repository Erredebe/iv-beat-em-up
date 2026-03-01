export const depthLayers = {
  BACKGROUND: 0,
  PARALLAX_FAR: 2,
  PARALLAX_MID: 3,
  PARALLAX_NEAR: 4,
  STAGE_NEON: 58,

  FIGHTER_SHADOW: 999,
  FIGHTER_OUTLINE: 999.8,
  FIGHTER: 1000,
  STAGE_PROP: 1000,
  BREAKABLE: 1000,

  PICKUP_OUTLINE: 235,
  PICKUP_MAIN: 236,
  PICKUP_ICON: 237,

  STAGE_COLOR_GRADE: 4500,
  STAGE_RAIN: 4501,
  FX_HIT: 5000,
  FX_FLOATING_TEXT: 5100,

  HUD_STATUS: 5590,
  HUD_MAIN: 5600,
  HUD_ENEMY_BARS: 5750,
  HUD_CONTROLS: 5900,
  HUD_TUTORIAL: 5950,
  HUD_PAUSE_DIM: 5990,
  HUD_PAUSE_MAIN: 6000,
  HUD_CRT: 6035,
  HUD_GAME_OVER_DIM: 6040,
  HUD_GAME_OVER: 6050,

  SCENE_DAMAGE_FLASH: 6095,
  SCENE_FLASH: 6100,
  DEBUG_TEXT: 6200,
  EDITOR_OVERLAY: 6300,
  EDITOR_PANEL_BG: 6340,
  EDITOR_PANEL_TEXT: 6350,
  PERF_OVERLAY: 6400,
} as const;

export const dynamicDepthBaseByLayer = {
  FIGHTER_SHADOW: depthLayers.FIGHTER_SHADOW,
  FIGHTER_OUTLINE: depthLayers.FIGHTER_OUTLINE,
  FIGHTER: depthLayers.FIGHTER,
  STAGE_PROP: depthLayers.STAGE_PROP,
  BREAKABLE: depthLayers.BREAKABLE,
} as const;

export type DynamicDepthLayer = keyof typeof dynamicDepthBaseByLayer;

export const depthPriorities = {
  FIGHTER_SHADOW: -20,
  FIGHTER_OUTLINE: -10,
  STAGE_PROP: 5,
  BREAKABLE: 6,
  FIGHTER: 20,
} as const;

export function resolveStagePropDynamicY(objectY: number, depthAnchorY: number | undefined, depthOffset: number): number {
  const anchorY = depthAnchorY ?? objectY;
  return anchorY + depthOffset;
}

export function resolveBreakableDynamicY(objectY: number): number {
  return objectY;
}
