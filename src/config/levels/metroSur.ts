import type { StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";

export const metroSurLayout: StageLayoutConfig = {
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
  props: [
    {
      id: "booth_ticket",
      textureKey: "prop_booth_front",
      x: 704,
      y: 220,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthAnchorY: 236,
      depthOffset: 0,
    },
    {
      id: "container_service",
      textureKey: "prop_container",
      x: 1760,
      y: 220,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthAnchorY: 224,
      depthOffset: 2,
    },
  ],
  breakableProps: [
    { id: "barrel_1", textureKey: "prop_crate", x: 940, y: 220, originX: 0.5, originY: 1, scale: 1, maxHp: 30, points: 160 },
    { id: "barrel_2", textureKey: "prop_crate", x: 1320, y: 220, originX: 0.5, originY: 1, scale: 1, maxHp: 30, points: 160 },
  ],
  collisionFootprints: [
    { id: "booth_ticket_feet", x: 704, y: 218, width: 66, height: 14, color: 0x66d1ff },
    { id: "container_service_feet", x: 1760, y: 220, width: 96, height: 16, color: 0xff7e98 },
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
  ambientFx: {
    rain: true,
    fogAlpha: 0.14,
    colorGrade: 0x121a2c,
  },
};

export const metroSurSpawns: StageSpawnZoneConfig[] = [
  {
    id: "metro_zone_1",
    triggerX: 360,
    lockType: "full_lock",
    leftBarrierX: 108,
    rightBarrierX: 920,
    spawns: [
      { x: 640, y: 210, archetype: "rusher" },
      { x: 760, y: 200, archetype: "agile_f" },
      { x: 870, y: 210, archetype: "bat_wielder" },
    ],
  },
  {
    id: "metro_zone_2",
    triggerX: 1180,
    lockType: "partial_lock",
    barrier: {
      openRailIds: ["rail_west"],
    },
    leftBarrierX: 1140,
    rightBarrierX: 1820,
    spawns: [
      { x: 1410, y: 212, archetype: "tank" },
      { x: 1550, y: 198, archetype: "brawler" },
      { x: 1690, y: 208, archetype: "mini_boss" },
    ],
  },
];
