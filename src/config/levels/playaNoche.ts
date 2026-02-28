import type { StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";

export const playaNocheLayout: StageLayoutConfig = {
  stageId: "playa_noche",
  displayName: "PLAYA NOCHE",
  tileSize: 32,
  mapWidthTiles: 80,
  mapHeightTiles: 8,
  sourceTilesPerRow: 20,
  tilesetKey: "street_clean_tileset",
  cameraYOffset: 0,
  walkRails: [
    { id: "rail_west", xStart: 0, xEnd: 880, topY: 178, bottomY: 220, preferredY: 200 },
    { id: "rail_mid", xStart: 880, xEnd: 1680, topY: 182, bottomY: 226, preferredY: 204 },
    { id: "rail_east", xStart: 1680, xEnd: 2560, topY: 176, bottomY: 222, preferredY: 199 },
  ],
  layers: [
    { id: "facade", depth: 78, alpha: 0.92, targetRows: [1, 2, 3], sourceRows: [1, 2, 0] },
    { id: "sidewalk", depth: 92, alpha: 1, targetRows: [4], sourceRows: [10] },
    { id: "road", depth: 106, alpha: 1, targetRows: [5, 6], sourceRows: [11, 11] },
    { id: "foreground_deco", depth: 236, alpha: 0.9, targetRows: [7], sourceRows: [9] },
  ],
  props: [
    {
      id: "booth_beach",
      textureKey: "prop_booth_front",
      x: 630,
      y: 218,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthAnchorY: 234,
      depthOffset: 0,
    },
    {
      id: "container_beach",
      textureKey: "prop_container",
      x: 1460,
      y: 216,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthAnchorY: 222,
      depthOffset: 2,
    },
  ],
  breakableProps: [
    { id: "table_1", textureKey: "prop_crate", x: 870, y: 216, originX: 0.5, originY: 1, scale: 1, maxHp: 24, points: 150 },
    { id: "table_2", textureKey: "prop_crate", x: 1610, y: 216, originX: 0.5, originY: 1, scale: 1, maxHp: 24, points: 150 },
  ],
  collisionFootprints: [
    { id: "booth_beach_feet", x: 630, y: 216, width: 66, height: 14, color: 0x74dcff },
    { id: "container_beach_feet", x: 1460, y: 216, width: 96, height: 16, color: 0xff8bb0 },
  ],
  parallaxBands: [
    { id: "skyline_far", textureKey: "city_far_band", y: 0, height: 86, depth: 2, alpha: 0.62, scrollFactor: 0.05 },
    { id: "skyline_mid", textureKey: "city_mid_band", y: 12, height: 90, depth: 3, alpha: 0.7, scrollFactor: 0.11 },
    { id: "skyline_close", textureKey: "city_close_band", y: 24, height: 96, depth: 4, alpha: 0.78, scrollFactor: 0.18 },
  ],
  neonLabels: [
    { x: 230, y: 74, text: "MALECON", color: "#ff67c7", fontSize: "12px" },
    { x: 1060, y: 78, text: "CHIRINGUITO", color: "#8ce8ff", fontSize: "10px" },
    { x: 1520, y: 76, text: "RUTA NORTE", color: "#ffe773", fontSize: "10px" },
  ],
  ambientFx: {
    rain: false,
    fogAlpha: 0.12,
    colorGrade: 0x111b2a,
  },
};

export const playaNocheSpawns: StageSpawnZoneConfig[] = [
  {
    id: "playa_zone_1",
    triggerX: 360,
    lockType: "full_lock",
    barrier: {
      topGap: 54,
      bottomGap: 126,
    },
    leftBarrierX: 104,
    rightBarrierX: 930,
    spawns: [
      { x: 620, y: 206, archetype: "agile_f" },
      { x: 760, y: 194, archetype: "rusher" },
      { x: 860, y: 210, archetype: "brawler" },
    ],
  },
  {
    id: "playa_zone_2",
    triggerX: 1160,
    lockType: "soft_lock",
    leftBarrierX: 1120,
    rightBarrierX: 1840,
    spawns: [
      { x: 1430, y: 212, archetype: "bat_wielder" },
      { x: 1590, y: 198, archetype: "tank" },
      { x: 1730, y: 206, archetype: "mini_boss" },
    ],
  },
];
