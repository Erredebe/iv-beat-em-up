import type { StageId } from "../gameplay/campaign";
import type { ScaleTier, SpriteSpecId } from "../visual/scaleSystem";

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
  scaleTier: ScaleTier;
  spriteSpecId: SpriteSpecId;
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
  scaleTier: ScaleTier;
  spriteSpecId: SpriteSpecId;
  maxHp: number;
  points: number;
  dropType?: "none" | "small_heal" | "medium_heal";
  dropChance?: number;
  healAmount?: number;
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

export interface StageWalkRailConfig {
  id: string;
  xStart: number;
  xEnd: number;
  topY: number;
  bottomY: number;
  preferredY?: number;
}

export interface StageBaseGradientConfig {
  topColor: number;
  bottomColor: number;
}

export interface StageColorGradeConfig {
  color: number;
  alpha: number;
}

export interface StageForegroundAccentsConfig {
  skylineFar: number;
  skylineMid: number;
  skylineClose: number;
  facade: number;
  foregroundDeco: number;
  crateTint: number;
  crateAlpha: number;
}

export interface StageVisualProfile {
  baseGradient: StageBaseGradientConfig;
  colorGrade: StageColorGradeConfig;
  rainIntensity: number;
  neonIntensity: number;
  foregroundAccents: StageForegroundAccentsConfig;
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
  walkRails?: StageWalkRailConfig[];
  layers: StageLayerConfig[];
  props: StagePropConfig[];
  breakableProps: StageBreakablePropConfig[];
  collisionFootprints: StageCollisionFootprint[];
  parallaxBands: StageParallaxBand[];
  neonLabels: StageNeonLabel[];
  visualProfile: StageVisualProfile;
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
    walkRails: getStageWalkRails(layout).map((rail) => ({
      id: rail.id,
      xStart: rail.xStart,
      xEnd: rail.xEnd,
      topY: rail.topY,
      bottomY: rail.bottomY,
      preferredY: rail.preferredY,
    })),
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
      scaleTier: prop.scaleTier,
      spriteSpecId: prop.spriteSpecId,
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
      scaleTier: prop.scaleTier,
      spriteSpecId: prop.spriteSpecId,
      maxHp: prop.maxHp,
      points: prop.points,
      dropType: prop.dropType,
      dropChance: prop.dropChance,
      healAmount: prop.healAmount,
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
    visualProfile: {
      baseGradient: {
        topColor: layout.visualProfile.baseGradient.topColor,
        bottomColor: layout.visualProfile.baseGradient.bottomColor,
      },
      colorGrade: {
        color: layout.visualProfile.colorGrade.color,
        alpha: layout.visualProfile.colorGrade.alpha,
      },
      rainIntensity: layout.visualProfile.rainIntensity,
      neonIntensity: layout.visualProfile.neonIntensity,
      foregroundAccents: {
        skylineFar: layout.visualProfile.foregroundAccents.skylineFar,
        skylineMid: layout.visualProfile.foregroundAccents.skylineMid,
        skylineClose: layout.visualProfile.foregroundAccents.skylineClose,
        facade: layout.visualProfile.foregroundAccents.facade,
        foregroundDeco: layout.visualProfile.foregroundAccents.foregroundDeco,
        crateTint: layout.visualProfile.foregroundAccents.crateTint,
        crateAlpha: layout.visualProfile.foregroundAccents.crateAlpha,
      },
    },
  };
}

export function getStageWalkRails(layout: StageLayoutConfig): StageWalkRailConfig[] {
  if (layout.walkRails && layout.walkRails.length > 0) {
    return layout.walkRails;
  }

  if (layout.walkLane) {
    const mapWidthPx = layout.mapWidthTiles * layout.tileSize;
    return [
      {
        id: "fallback_lane",
        xStart: 0,
        xEnd: mapWidthPx,
        topY: layout.walkLane.topY,
        bottomY: layout.walkLane.bottomY,
        preferredY: layout.walkLane.playerSpawnY,
      },
    ];
  }

  return [];
}
