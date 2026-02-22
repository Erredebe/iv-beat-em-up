import type { StageId } from "../gameplay/campaign";

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
  scale: 1 | 2 | 3 | 4;
  depthAnchorY?: number;
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

export interface StageBreakablePropConfig {
  id: string;
  textureKey: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  scale: 1 | 2 | 3 | 4;
  maxHp: number;
  points: number;
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

export interface StageAmbientFxConfig {
  rain?: boolean;
  fogAlpha?: number;
  colorGrade?: number;
}

export interface StageLayoutConfig {
  stageId: StageId;
  displayName: string;
  tileSize: number;
  mapWidthTiles: number;
  mapHeightTiles: number;
  sourceTilesPerRow: number;
  tilesetKey: string;
  cameraYOffset: number;
  walkLane?: StageWalkLaneConfig;
  layers: StageLayerConfig[];
  props: StagePropConfig[];
  breakableProps: StageBreakablePropConfig[];
  collisionFootprints: StageCollisionFootprint[];
  parallaxBands: StageParallaxBand[];
  neonLabels: StageNeonLabel[];
  ambientFx: StageAmbientFxConfig;
}

export function cloneStageLayoutConfig(layout: StageLayoutConfig): StageLayoutConfig {
  return {
    stageId: layout.stageId,
    displayName: layout.displayName,
    tileSize: layout.tileSize,
    mapWidthTiles: layout.mapWidthTiles,
    mapHeightTiles: layout.mapHeightTiles,
    sourceTilesPerRow: layout.sourceTilesPerRow,
    tilesetKey: layout.tilesetKey,
    cameraYOffset: layout.cameraYOffset,
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
      depthAnchorY: prop.depthAnchorY,
      depthOffset: prop.depthOffset,
    })),
    breakableProps: layout.breakableProps.map((prop) => ({
      id: prop.id,
      textureKey: prop.textureKey,
      x: prop.x,
      y: prop.y,
      originX: prop.originX,
      originY: prop.originY,
      scale: prop.scale,
      maxHp: prop.maxHp,
      points: prop.points,
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
    ambientFx: {
      rain: Boolean(layout.ambientFx.rain),
      fogAlpha: layout.ambientFx.fogAlpha,
      colorGrade: layout.ambientFx.colorGrade,
    },
  };
}
