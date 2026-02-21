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

export function cloneStageLayoutConfig(layout: StageLayoutConfig): StageLayoutConfig {
  return {
    tileSize: layout.tileSize,
    mapWidthTiles: layout.mapWidthTiles,
    mapHeightTiles: layout.mapHeightTiles,
    sourceTilesPerRow: layout.sourceTilesPerRow,
    tilesetKey: layout.tilesetKey,
    walkLane: layout.walkLane
      ? {
          topY: layout.walkLane.topY,
          bottomY: layout.walkLane.bottomY,
          playerSpawnY: layout.walkLane.playerSpawnY,
        }
      : undefined,
    layers: layout.layers.map((layer) => ({
      id: layer.id,
      depth: layer.depth,
      alpha: layer.alpha,
      targetRows: [...layer.targetRows],
      sourceRows: [...layer.sourceRows],
    })),
    props: layout.props.map((prop) => ({
      id: prop.id,
      textureKey: prop.textureKey,
      x: prop.x,
      y: prop.y,
      originX: prop.originX,
      originY: prop.originY,
      scale: prop.scale,
      depthOffset: prop.depthOffset,
    })),
    collisionFootprints: layout.collisionFootprints.map((footprint) => ({
      id: footprint.id,
      x: footprint.x,
      y: footprint.y,
      width: footprint.width,
      height: footprint.height,
      color: footprint.color,
    })),
    parallaxBands: layout.parallaxBands.map((band) => ({
      id: band.id,
      textureKey: band.textureKey,
      y: band.y,
      height: band.height,
      depth: band.depth,
      alpha: band.alpha,
      scrollFactor: band.scrollFactor,
    })),
    neonLabels: layout.neonLabels.map((label) => ({
      x: label.x,
      y: label.y,
      text: label.text,
      color: label.color,
      fontSize: label.fontSize,
    })),
  };
}

export const street95Zone1Layout: StageLayoutConfig = {
  tileSize: 16,
  mapWidthTiles: 160,
  mapHeightTiles: 15,
  sourceTilesPerRow: 46,
  tilesetKey: "street_clean_tileset",
  walkLane: {
    topY: 152,
    bottomY: 224,
    playerSpawnY: 198,
  },
  layers: [
    {
      id: "facade",
      depth: 80,
      alpha: 1,
      targetRows: [3, 4, 5, 6, 7, 8],
      sourceRows: [0, 1, 2, 3, 4, 5],
    },
    {
      id: "sidewalk",
      depth: 92,
      alpha: 1,
      targetRows: [9],
      sourceRows: [6],
    },
    {
      id: "road",
      depth: 104,
      alpha: 1,
      targetRows: [10, 11, 12, 13],
      sourceRows: [8, 9, 10, 11],
    },
    {
      id: "foreground_deco",
      depth: 232,
      alpha: 0.94,
      targetRows: [14],
      sourceRows: [10],
    },
  ],
  props: [
    {
      id: "booth",
      textureKey: "prop_booth",
      x: 532,
      y: 212,
      originX: 0.5,
      originY: 1,
      scale: 3,
      depthOffset: 0,
    },
    {
      id: "crate",
      textureKey: "prop_crate",
      x: 932,
      y: 196,
      originX: 0.5,
      originY: 1,
      scale: 1,
      depthOffset: -10,
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
      x: 532,
      y: 212,
      width: 72,
      height: 14,
      color: 0x00c5ff,
    },
    {
      id: "crate_feet",
      x: 932,
      y: 197,
      width: 24,
      height: 8,
      color: 0x6eff66,
    },
    {
      id: "car_feet",
      x: 1010,
      y: 214,
      width: 44,
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
      color: "#5cbfd1",
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
