import { defineStageLayout, type StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";
import { createStageVisualProfile } from "./stageVisualPresets";

export const market95Layout: StageLayoutConfig = defineStageLayout({
  stageId: "market_95",
  displayName: "MERCADO 95",
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
    { id: "facade", depth: 10, alpha: 1, targetRows: [1, 2, 3], sourceRows: [0, 1, 1] },
    { id: "sidewalk", depth: 11, alpha: 1, targetRows: [4], sourceRows: [10] },
    { id: "road", depth: 12, alpha: 1, targetRows: [5, 6], sourceRows: [11, 11] },
    { id: "foreground_deco", depth: 500, alpha: 0.94, targetRows: [7], sourceRows: [9] },
  ],
  objects: [
    {
      id: "booth_a",
      visual: {
        textureKey: "prop_booth_front",
        scaleTier: "tiny",
        spriteSpecId: "stage_prop_arcade",
      },
      transform: {
        x: 560,
        y: 220,
        originX: 0.5,
        originY: 1,
        depthAnchorY: 236,
        depthOffset: 0,
      },
      collision: {
        blocksMovement: true,
        color: 0x00c5ff,
        footprint: {
          mode: "explicit",
          width: 48,
          height: 12,
          offsetY: -1,
        },
      },
      behavior: {
        type: "static",
      },
    },
    {
      id: "container_a",
      visual: {
        textureKey: "prop_container_green",
        scaleTier: "tiny",
        spriteSpecId: "stage_prop_arcade",
      },
      transform: {
        x: 1110,
        y: 220,
        originX: 0.5,
        originY: 1,
        depthAnchorY: 224,
        depthOffset: 2,
      },
      collision: {
        blocksMovement: true,
        color: 0xff5f7c,
        footprint: {
          mode: "explicit",
          width: 36,
          height: 10,
        },
      },
      behavior: {
        type: "static",
      },
    },
    {
      id: "crate_1",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 810,
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
        points: 120,
        drop: {
          type: "small_heal",
          chance: 1,
          healAmount: 26,
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
      id: "crate_2",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 1530,
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
        points: 120,
        drop: {
          type: "medium_heal",
          chance: 0.8,
          healAmount: 40,
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
      id: "crate_3",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 460,
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
        maxHp: 24,
        points: 110,
        drop: {
          type: "small_heal",
          chance: 0.75,
          healAmount: 24,
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
      id: "crate_4",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 1200,
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
        maxHp: 24,
        points: 110,
        drop: {
          type: "small_heal",
          chance: 0.8,
          healAmount: 24,
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
    { id: "skyline_far", textureKey: "city_far_band", y: 0, height: 88, depth: 2, alpha: 0.56, scrollFactor: 0.06 },
    { id: "skyline_mid", textureKey: "city_mid_band", y: 14, height: 92, depth: 3, alpha: 0.68, scrollFactor: 0.12 },
    { id: "skyline_close", textureKey: "city_close_band", y: 24, height: 98, depth: 4, alpha: 0.78, scrollFactor: 0.2 },
  ],
  neonLabels: [
    { x: 220, y: 72, text: "MERCADO SUR", color: "#ff4cb4", fontSize: "12px" },
    { x: 822, y: 76, text: "FRUTA 24H", color: "#5cc9ff", fontSize: "10px" },
    { x: 1390, y: 80, text: "BAR NAVAJA", color: "#ffe273", fontSize: "10px" },
  ],
  visualProfile: createStageVisualProfile("industrialWarm", {
    rainIntensity: 0.12,
    fogAlpha: 0.05,
    neonIntensity: 0.82,
    neonPulseHz: 1.1,
  }),
});

export const market95Spawns: StageSpawnZoneConfig[] = [
  {
    id: "market_zone_1",
    triggerX: 340,
    lockType: "full_lock",
    objective: {
      type: "clear_all",
    },
    reinforcementPolicy: "none",
    leftBarrierX: 92,
    rightBarrierX: 880,
    spawns: [
      { x: 620, y: 204, archetype: "brawler" },
      { x: 792, y: 198, archetype: "knife_fighter" },
    ],
  },
  {
    id: "market_zone_2",
    triggerX: 1060,
    lockType: "partial_lock",
    objective: {
      type: "break_cache",
      cacheObjectIds: ["crate_2", "crate_4"],
    },
    reinforcementPolicy: "staggered",
    barrier: {
      openRailIds: ["rail_mid"],
    },
    leftBarrierX: 1020,
    rightBarrierX: 1710,
    spawns: [
      { x: 1310, y: 208, archetype: "brawler" },
      { x: 1450, y: 194, archetype: "rusher" },
      { x: 1600, y: 210, archetype: "knife_fighter" },
    ],
  },
];
