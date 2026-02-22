import type { StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";

export const puertoRojoLayout: StageLayoutConfig = {
  stageId: "puerto_rojo",
  displayName: "PUERTO ROJO",
  tileSize: 32,
  mapWidthTiles: 80,
  mapHeightTiles: 8,
  sourceTilesPerRow: 46,
  tilesetKey: "street_clean_tileset",
  cameraYOffset: 0,
  walkLane: {
    topY: 158,
    bottomY: 226,
    playerSpawnY: 204,
  },
  layers: [
    { id: "facade", depth: 82, alpha: 0.96, targetRows: [1, 2, 3], sourceRows: [0, 2, 4] },
    { id: "sidewalk", depth: 92, alpha: 1, targetRows: [4], sourceRows: [6] },
    { id: "road", depth: 106, alpha: 1, targetRows: [5, 6], sourceRows: [8, 9] },
    { id: "foreground_deco", depth: 236, alpha: 0.95, targetRows: [7], sourceRows: [10] },
  ],
  props: [
    { id: "booth_harbor", textureKey: "prop_booth", x: 510, y: 214, originX: 0.5, originY: 1, scale: 2, depthOffset: 0 },
    { id: "car_harbor", textureKey: "prop_car", x: 1260, y: 220, originX: 0.5, originY: 1, scale: 2, depthOffset: 0 },
  ],
  breakableProps: [
    { id: "crate_final_1", textureKey: "prop_crate", x: 930, y: 214, originX: 0.5, originY: 1, scale: 2, maxHp: 28, points: 180 },
    { id: "crate_final_2", textureKey: "prop_crate", x: 1760, y: 214, originX: 0.5, originY: 1, scale: 2, maxHp: 28, points: 180 },
  ],
  collisionFootprints: [
    { id: "booth_harbor_feet", x: 510, y: 214, width: 106, height: 14, color: 0x65d9ff },
    { id: "car_harbor_feet", x: 1260, y: 220, width: 72, height: 14, color: 0xff7998 },
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
  ambientFx: {
    rain: true,
    fogAlpha: 0.16,
    colorGrade: 0x201220,
  },
};

export const puertoRojoSpawns: StageSpawnZoneConfig[] = [
  {
    id: "puerto_zone_1",
    triggerX: 360,
    leftBarrierX: 108,
    rightBarrierX: 920,
    spawns: [
      { x: 640, y: 210, archetype: "brawler" },
      { x: 780, y: 198, archetype: "bat_wielder" },
      { x: 870, y: 206, archetype: "agile_f" },
    ],
  },
  {
    id: "puerto_zone_2",
    triggerX: 1180,
    leftBarrierX: 1140,
    rightBarrierX: 1880,
    spawns: [
      { x: 1460, y: 212, archetype: "rusher" },
      { x: 1620, y: 198, archetype: "tank" },
      { x: 1780, y: 208, archetype: "mini_boss" },
    ],
  },
];
