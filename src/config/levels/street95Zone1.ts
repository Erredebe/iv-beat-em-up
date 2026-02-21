export interface StageLayerConfig {
  id: "facade" | "sidewalk" | "road" | "foreground_deco";
  depth: number;
  alpha?: number;
  targetRows: number[];
  sourceRows: number[];
}

export interface StagePropConfig {
  id: string;
  textureKey: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  scale: 1 | 2 | 3;
  depthOffset: number;
}

export interface StageCollisionFootprint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}

export interface StageParallaxBand {
  id: "skyline_far" | "skyline_mid" | "skyline_close";
  textureKey: string;
  y: number;
  height: number;
  depth: number;
  alpha: number;
  scrollFactor: number;
}

export interface StageNeonLabel {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: string;
}

export interface StageWalkLaneConfig {
  topY: number;
  bottomY: number;
  playerSpawnY: number;
}

export interface StageLayoutConfig {
  tileSize: number;
  mapWidthTiles: number;
  mapHeightTiles: number;
  sourceTilesPerRow: number;
  tilesetKey: string;
  walkLane?: StageWalkLaneConfig;
  layers: StageLayerConfig[];
  props: StagePropConfig[];
  collisionFootprints: StageCollisionFootprint[];
  parallaxBands: StageParallaxBand[];
  neonLabels: StageNeonLabel[];
}

export const street95Zone1Layout: StageLayoutConfig = {
  tileSize: 16,
  mapWidthTiles: 160,
  mapHeightTiles: 15,
  sourceTilesPerRow: 50,
  tilesetKey: "street_clean_tileset",
  walkLane: {
    topY: 136,
    bottomY: 228,
    playerSpawnY: 204,
  },
  layers: [
    {
      id: "facade",
      depth: 80,
      alpha: 1,
      targetRows: [2, 3, 4, 5, 6, 7],
      sourceRows: [0, 1, 2, 3, 4, 5],
    },
    {
      id: "sidewalk",
      depth: 92,
      alpha: 1,
      targetRows: [8],
      sourceRows: [6],
    },
    {
      id: "road",
      depth: 104,
      alpha: 1,
      targetRows: [9, 10, 11, 12, 13],
      sourceRows: [7, 8, 9, 10, 11],
    },
    {
      id: "foreground_deco",
      depth: 232,
      alpha: 0.94,
      targetRows: [14],
      sourceRows: [11],
    },
  ],
  props: [
    {
      id: "booth",
      textureKey: "prop_booth",
      x: 544,
      y: 212,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthOffset: 0,
    },
    {
      id: "crate",
      textureKey: "prop_crate",
      x: 860,
      y: 212,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthOffset: 0,
    },
    {
      id: "car",
      textureKey: "prop_car",
      x: 1010,
      y: 214,
      originX: 0.5,
      originY: 1,
      scale: 2,
      depthOffset: 0,
    },
  ],
  collisionFootprints: [
    {
      id: "booth_feet",
      x: 544,
      y: 212,
      width: 30,
      height: 10,
      color: 0x00c5ff,
    },
    {
      id: "crate_feet",
      x: 860,
      y: 214,
      width: 32,
      height: 10,
      color: 0x6eff66,
    },
    {
      id: "car_feet",
      x: 1010,
      y: 214,
      width: 34,
      height: 12,
      color: 0xff5f7c,
    },
  ],
  parallaxBands: [
    {
      id: "skyline_far",
      textureKey: "city_far_band",
      y: 0,
      height: 86,
      depth: 2,
      alpha: 0.54,
      scrollFactor: 0.08,
    },
    {
      id: "skyline_mid",
      textureKey: "city_mid_band",
      y: 16,
      height: 92,
      depth: 3,
      alpha: 0.66,
      scrollFactor: 0.14,
    },
    {
      id: "skyline_close",
      textureKey: "city_close_band",
      y: 28,
      height: 96,
      depth: 4,
      alpha: 0.78,
      scrollFactor: 0.22,
    },
  ],
  neonLabels: [
    {
      x: 238,
      y: 74,
      text: "BAR CHISPA",
      color: "#ff4cb4",
      fontSize: "13px",
    },
    {
      x: 688,
      y: 74,
      text: "CONCIERTO PUNK",
      color: "#00ebff",
      fontSize: "10px",
    },
    {
      x: 1186,
      y: 74,
      text: "POLIGONO NORTE",
      color: "#ffe273",
      fontSize: "10px",
    },
  ],
};
