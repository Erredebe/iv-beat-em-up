import { defineStageLayout, type StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";
import { createStageVisualProfile } from "./stageVisualPresets";

export const metroSurLayout: StageLayoutConfig = defineStageLayout({
  stageId: "metro_sur",
  displayName: "METRO SUR",
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
    { id: "facade", depth: 82, alpha: 0.95, targetRows: [1, 2, 3], sourceRows: [0, 2, 1] },
    { id: "sidewalk", depth: 92, alpha: 1, targetRows: [4], sourceRows: [10] },
    { id: "road", depth: 106, alpha: 1, targetRows: [5, 6], sourceRows: [11, 11] },
    { id: "foreground_deco", depth: 236, alpha: 0.92, targetRows: [7], sourceRows: [9] },
  ],
  objects: [
    {
      id: "booth_ticket",
      visual: {
        textureKey: "prop_booth_front",
        scaleTier: "tiny",
        spriteSpecId: "stage_prop_arcade",
      },
      transform: {
        x: 704,
        y: 220,
        originX: 0.5,
        originY: 1,
        depthAnchorY: 236,
        depthOffset: 0,
      },
      collision: {
        blocksMovement: true,
        color: 0x66d1ff,
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
      id: "container_service",
      visual: {
        textureKey: "prop_container_green",
        scaleTier: "tiny",
        spriteSpecId: "stage_prop_arcade",
      },
      transform: {
        x: 1760,
        y: 220,
        originX: 0.5,
        originY: 1,
        depthAnchorY: 224,
        depthOffset: 2,
      },
      collision: {
        blocksMovement: true,
        color: 0xff7e98,
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
      id: "barrel_1",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 940,
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
        maxHp: 30,
        points: 160,
        drop: {
          type: "small_heal",
          chance: 1,
          healAmount: 30,
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
      id: "barrel_2",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 1320,
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
        maxHp: 30,
        points: 160,
        drop: {
          type: "medium_heal",
          chance: 0.9,
          healAmount: 46,
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
      id: "barrel_3",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 540,
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
        points: 140,
        drop: {
          type: "small_heal",
          chance: 0.82,
          healAmount: 28,
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
      id: "barrel_4",
      visual: {
        textureKey: "prop_crate",
        scaleTier: "tiny",
        spriteSpecId: "stage_breakable_arcade",
      },
      transform: {
        x: 1720,
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
        points: 140,
        drop: {
          type: "small_heal",
          chance: 0.85,
          healAmount: 30,
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
    { id: "skyline_far", textureKey: "city_far_band", y: 0, height: 92, depth: 2, alpha: 0.54, scrollFactor: 0.07 },
    { id: "skyline_mid", textureKey: "city_mid_band", y: 16, height: 98, depth: 3, alpha: 0.64, scrollFactor: 0.13 },
    { id: "skyline_close", textureKey: "city_close_band", y: 28, height: 98, depth: 4, alpha: 0.74, scrollFactor: 0.2 },
  ],
  neonLabels: [
    { x: 282, y: 74, text: "METRO SUR", color: "#4ee0ff", fontSize: "12px" },
    { x: 1006, y: 78, text: "ULTIMO TREN", color: "#ffd768", fontSize: "10px" },
    { x: 1480, y: 78, text: "VIA 6", color: "#ff5eb3", fontSize: "10px" },
  ],
  visualProfile: createStageVisualProfile("wetNight", {
    rainIntensity: 0.86,
    rainDriftSpeed: 0.9,
    fogAlpha: 0.1,
    neonPulseHz: 1.9,
    colorGrade: { color: 0x121a2c, alpha: 0.1 },
  }),
});

export const metroSurSpawns: StageSpawnZoneConfig[] = [
  {
    id: "metro_zone_1",
    triggerX: 360,
    lockType: "full_lock",
    objective: {
      type: "hold_line",
      holdDurationSec: 20,
    },
    reinforcementPolicy: "staggered",
    leftBarrierX: 108,
    rightBarrierX: 920,
    spawns: [
      { x: 620, y: 210, archetype: "brawler" },
      { x: 760, y: 200, archetype: "rusher" },
      { x: 870, y: 210, archetype: "rusher" },
    ],
  },
  {
    id: "metro_zone_2",
    triggerX: 1180,
    lockType: "partial_lock",
    objective: {
      type: "clear_all",
    },
    reinforcementPolicy: "burst",
    barrier: {
      openRailIds: ["rail_west"],
    },
    leftBarrierX: 1140,
    rightBarrierX: 1820,
    spawns: [
      { x: 1380, y: 212, archetype: "brawler" },
      { x: 1530, y: 198, archetype: "agile_f" },
      { x: 1680, y: 208, archetype: "bat_wielder" },
    ],
  },
];
