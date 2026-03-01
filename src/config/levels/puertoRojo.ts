import { defineStageLayout, type StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";
import { createStageVisualProfile } from "./stageVisualPresets";

export const puertoRojoLayout: StageLayoutConfig = defineStageLayout({
  stageId: "puerto_rojo",
  displayName: "PUERTO ROJO",
  tileSize: 32,
  mapWidthTiles: 80,
  mapHeightTiles: 8,
  sourceTilesPerRow: 20,
  tilesetKey: "street_clean_tileset",
  cameraYOffset: 0,
  walkRails: [
    { id: "rail_west", xStart: 0, xEnd: 860, topY: 180, bottomY: 222, preferredY: 202 },
    { id: "rail_mid", xStart: 860, xEnd: 1640, topY: 184, bottomY: 228, preferredY: 206 },
    { id: "rail_east", xStart: 1640, xEnd: 2560, topY: 178, bottomY: 224, preferredY: 201 },
  ],
  layers: [
    { id: "facade", depth: 82, alpha: 0.96, targetRows: [1, 2, 3], sourceRows: [0, 1, 2] },
    { id: "sidewalk", depth: 92, alpha: 1, targetRows: [4], sourceRows: [10] },
    { id: "road", depth: 106, alpha: 1, targetRows: [5, 6], sourceRows: [11, 11] },
    { id: "foreground_deco", depth: 236, alpha: 0.95, targetRows: [7], sourceRows: [9] },
  ],
  objects: [
    {
      id: "booth_harbor",
      visual: {
        textureKey: "prop_booth_front",
        scaleTier: "standard",
        spriteSpecId: "stage_prop_arcade",
      },
      transform: {
        x: 510,
        y: 220,
        originX: 0.5,
        originY: 1,
        depthAnchorY: 236,
        depthOffset: 0,
      },
      collision: {
        blocksMovement: true,
        color: 0x65d9ff,
        footprint: {
          mode: "explicit",
          width: 66,
          height: 14,
          offsetY: -2,
        },
      },
      behavior: {
        type: "static",
      },
    },
    {
      id: "container_harbor",
      visual: {
        textureKey: "prop_container",
        scaleTier: "standard",
        spriteSpecId: "stage_prop_arcade",
      },
      transform: {
        x: 1260,
        y: 220,
        originX: 0.5,
        originY: 1,
        depthAnchorY: 224,
        depthOffset: 2,
      },
      collision: {
        blocksMovement: true,
        color: 0xff7998,
        footprint: {
          mode: "explicit",
          width: 96,
          height: 16,
        },
      },
      behavior: {
        type: "static",
      },
    },
    {
      id: "crate_final_1",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "compact",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 930,
        y: 220,
        originX: 0.5,
        originY: 1,
      },
      collision: {
        blocksMovement: true,
        color: 0xffcc66,
        footprint: {
          mode: "rule",
          rule: "sprite_base_band",
          widthRatio: 0.58,
          minWidth: 18,
          maxWidthRatio: 1,
          height: 14,
          baselineOffset: 7,
        },
      },
      behavior: {
        type: "breakable",
        maxHp: 28,
        points: 180,
        drop: {
          type: "small_heal",
          chance: 1,
          healAmount: 38,
        },
        hurtbox: {
          mode: "rule",
          rule: "sprite_bounds",
        },
        intactTint: 0xb8c7d2,
        hitTint: 0xffd2d2,
      },
    },
    {
      id: "crate_final_2",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "compact",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 1760,
        y: 220,
        originX: 0.5,
        originY: 1,
      },
      collision: {
        blocksMovement: true,
        color: 0xffcc66,
        footprint: {
          mode: "rule",
          rule: "sprite_base_band",
          widthRatio: 0.58,
          minWidth: 18,
          maxWidthRatio: 1,
          height: 14,
          baselineOffset: 7,
        },
      },
      behavior: {
        type: "breakable",
        maxHp: 28,
        points: 180,
        drop: {
          type: "medium_heal",
          chance: 1,
          healAmount: 58,
        },
        hurtbox: {
          mode: "rule",
          rule: "sprite_bounds",
        },
        intactTint: 0xb8c7d2,
        hitTint: 0xffd2d2,
      },
    },
    {
      id: "crate_final_3",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "compact",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 560,
        y: 220,
        originX: 0.5,
        originY: 1,
      },
      collision: {
        blocksMovement: true,
        color: 0xffcc66,
        footprint: {
          mode: "rule",
          rule: "sprite_base_band",
          widthRatio: 0.58,
          minWidth: 18,
          maxWidthRatio: 1,
          height: 14,
          baselineOffset: 7,
        },
      },
      behavior: {
        type: "breakable",
        maxHp: 26,
        points: 160,
        drop: {
          type: "small_heal",
          chance: 0.86,
          healAmount: 34,
        },
        hurtbox: {
          mode: "rule",
          rule: "sprite_bounds",
        },
        intactTint: 0xb8c7d2,
        hitTint: 0xffd2d2,
      },
    },
    {
      id: "crate_final_4",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "compact",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 1400,
        y: 220,
        originX: 0.5,
        originY: 1,
      },
      collision: {
        blocksMovement: true,
        color: 0xffcc66,
        footprint: {
          mode: "rule",
          rule: "sprite_base_band",
          widthRatio: 0.58,
          minWidth: 18,
          maxWidthRatio: 1,
          height: 14,
          baselineOffset: 7,
        },
      },
      behavior: {
        type: "breakable",
        maxHp: 26,
        points: 160,
        drop: {
          type: "small_heal",
          chance: 0.9,
          healAmount: 36,
        },
        hurtbox: {
          mode: "rule",
          rule: "sprite_bounds",
        },
        intactTint: 0xb8c7d2,
        hitTint: 0xffd2d2,
      },
    },
  ],
  parallaxBands: [
    { id: "skyline_far", textureKey: "city_far_band", y: 0, height: 90, depth: 2, alpha: 0.56, scrollFactor: 0.07 },
    { id: "skyline_mid", textureKey: "city_mid_band", y: 14, height: 94, depth: 3, alpha: 0.66, scrollFactor: 0.14 },
    { id: "skyline_close", textureKey: "city_close_band", y: 28, height: 98, depth: 4, alpha: 0.78, scrollFactor: 0.21 },
  ],
  neonLabels: [
    { x: 208, y: 76, text: "PUERTO ROJO", color: "#ff5fb5", fontSize: "12px" },
    { x: 1014, y: 82, text: "MUELLE 9", color: "#62d5ff", fontSize: "10px" },
    { x: 1508, y: 80, text: "LOS GRISES", color: "#ffe783", fontSize: "10px" },
  ],
  visualProfile: createStageVisualProfile("crimsonHarbor", {
    rainIntensity: 0.7,
    rainDriftSpeed: 0.7,
    fogAlpha: 0.05,
    neonPulseHz: 1.4,
    colorGrade: { color: 0x201220, alpha: 0.12 },
  }),
});

export const puertoRojoSpawns: StageSpawnZoneConfig[] = [
  {
    id: "puerto_zone_1",
    triggerX: 360,
    lockType: "full_lock",
    objective: {
      type: "break_cache",
      cacheObjectIds: ["crate_final_1", "crate_final_3"],
    },
    reinforcementPolicy: "staggered",
    leftBarrierX: 108,
    rightBarrierX: 920,
    spawns: [
      { x: 620, y: 210, archetype: "brawler" },
      { x: 730, y: 198, archetype: "rusher" },
      { x: 820, y: 206, archetype: "agile_f" },
      { x: 900, y: 198, archetype: "bat_wielder" },
    ],
  },
  {
    id: "puerto_zone_2",
    triggerX: 1180,
    lockType: "partial_lock",
    objective: {
      type: "clear_all",
    },
    reinforcementPolicy: "burst",
    barrier: {
      openRailIds: ["rail_east"],
    },
    leftBarrierX: 1140,
    rightBarrierX: 1880,
    spawns: [
      { x: 1360, y: 212, archetype: "rusher" },
      { x: 1480, y: 198, archetype: "brawler" },
      { x: 1600, y: 208, archetype: "agile_f" },
      { x: 1700, y: 206, archetype: "bat_wielder" },
      { x: 1780, y: 208, archetype: "brawler" },
      { x: 1840, y: 206, archetype: "mini_boss" },
    ],
  },
];
