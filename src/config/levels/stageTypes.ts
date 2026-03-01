import { derivedTextureCrops } from "../assets/derivedTextureCrops";
import type { StageId } from "../gameplay/campaign";
import { resolveScaleReference, type ScaleTier, type SpriteSpecId } from "../visual/scaleSystem";

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
  // Optional virtual feet anchor used by DepthSystem for deterministic ordering vs fighters.
  depthAnchorY?: number;
  // Fine-tune offset applied on top of y/depthAnchorY when resolving dynamic depth.
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

export type StageBreakableDropType = "none" | "small_heal" | "medium_heal";

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
  // Breakables are depth-sorted by their own y using the BREAKABLE dynamic layer.
  dropType?: StageBreakableDropType;
  dropChance?: number;
  healAmount?: number;
}

export interface StageObjectVisualIdentity {
  textureKey: string;
  scaleTier: ScaleTier;
  spriteSpecId: SpriteSpecId;
}

export interface StageObjectTransformDefinition {
  x: number;
  y: number;
  originX: number;
  originY: number;
  depthAnchorY?: number;
  depthOffset?: number;
}

export interface StageObjectFootprintExplicitDefinition {
  mode: "explicit";
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

export interface StageObjectFootprintSpriteBandRule {
  mode: "rule";
  rule: "sprite_base_band";
  widthRatio: number;
  minWidth?: number;
  maxWidthRatio?: number;
  height: number;
  baselineOffset: number;
  offsetX?: number;
  offsetY?: number;
}

export type StageObjectFootprintDefinition =
  | StageObjectFootprintExplicitDefinition
  | StageObjectFootprintSpriteBandRule;

export interface StageObjectCollisionConfig {
  id?: string;
  blocksMovement: boolean;
  color?: number;
  footprint: StageObjectFootprintDefinition;
}

export interface StageObjectHurtboxExplicitDefinition {
  mode: "explicit";
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface StageObjectHurtboxSpriteBoundsRule {
  mode: "rule";
  rule: "sprite_bounds";
  insetX?: number;
  insetTop?: number;
  insetBottom?: number;
}

export type StageObjectHurtboxDefinition =
  | StageObjectHurtboxExplicitDefinition
  | StageObjectHurtboxSpriteBoundsRule;

export interface StageBreakableDropConfig {
  type: StageBreakableDropType;
  chance?: number;
  healAmount?: number;
}

export interface StageObjectStaticBehavior {
  type: "static";
}

export interface StageObjectDecorativeBehavior {
  type: "decorative";
}

export interface StageObjectBreakableBehavior {
  type: "breakable";
  maxHp: number;
  points: number;
  hurtbox: StageObjectHurtboxDefinition;
  drop?: StageBreakableDropConfig;
  intactTint?: number;
  hitTint?: number;
}

export type StageObjectBehavior = StageObjectStaticBehavior | StageObjectDecorativeBehavior | StageObjectBreakableBehavior;

export interface StageObjectDefinition {
  id: string;
  visual: StageObjectVisualIdentity;
  transform: StageObjectTransformDefinition;
  collision?: StageObjectCollisionConfig;
  behavior: StageObjectBehavior;
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
  objects: StageObjectDefinition[];
  // Legacy collections kept for editor/debug compatibility.
  props: StagePropConfig[];
  breakableProps: StageBreakablePropConfig[];
  collisionFootprints: StageCollisionFootprint[];
  parallaxBands: StageParallaxBand[];
  neonLabels: StageNeonLabel[];
  visualProfile: StageVisualProfile;
}

export type StageLayoutDefinition = Omit<StageLayoutConfig, "props" | "breakableProps" | "collisionFootprints">;

export interface StageObjectRenderMetrics {
  width: number;
  height: number;
}

export interface StageResolvedObjectRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function cloneStageObjectFootprintDefinition(
  footprint: StageObjectFootprintDefinition,
): StageObjectFootprintDefinition {
  if (footprint.mode === "explicit") {
    return {
      mode: "explicit",
      width: footprint.width,
      height: footprint.height,
      offsetX: footprint.offsetX,
      offsetY: footprint.offsetY,
    };
  }
  return {
    mode: "rule",
    rule: "sprite_base_band",
    widthRatio: footprint.widthRatio,
    minWidth: footprint.minWidth,
    maxWidthRatio: footprint.maxWidthRatio,
    height: footprint.height,
    baselineOffset: footprint.baselineOffset,
    offsetX: footprint.offsetX,
    offsetY: footprint.offsetY,
  };
}

function cloneStageObjectHurtboxDefinition(hurtbox: StageObjectHurtboxDefinition): StageObjectHurtboxDefinition {
  if (hurtbox.mode === "explicit") {
    return {
      mode: "explicit",
      offsetX: hurtbox.offsetX,
      offsetY: hurtbox.offsetY,
      width: hurtbox.width,
      height: hurtbox.height,
    };
  }
  return {
    mode: "rule",
    rule: "sprite_bounds",
    insetX: hurtbox.insetX,
    insetTop: hurtbox.insetTop,
    insetBottom: hurtbox.insetBottom,
  };
}

function cloneStageObjectBehavior(behavior: StageObjectBehavior): StageObjectBehavior {
  if (behavior.type === "breakable") {
    return {
      type: "breakable",
      maxHp: behavior.maxHp,
      points: behavior.points,
      hurtbox: cloneStageObjectHurtboxDefinition(behavior.hurtbox),
      drop: behavior.drop
        ? {
            type: behavior.drop.type,
            chance: behavior.drop.chance,
            healAmount: behavior.drop.healAmount,
          }
        : undefined,
      intactTint: behavior.intactTint,
      hitTint: behavior.hitTint,
    };
  }
  return {
    type: behavior.type,
  };
}

function cloneStageObjectDefinition(object: StageObjectDefinition): StageObjectDefinition {
  return {
    id: object.id,
    visual: {
      textureKey: object.visual.textureKey,
      scaleTier: object.visual.scaleTier,
      spriteSpecId: object.visual.spriteSpecId,
    },
    transform: {
      x: object.transform.x,
      y: object.transform.y,
      originX: object.transform.originX,
      originY: object.transform.originY,
      depthAnchorY: object.transform.depthAnchorY,
      depthOffset: object.transform.depthOffset,
    },
    collision: object.collision
      ? {
          id: object.collision.id,
          blocksMovement: object.collision.blocksMovement,
          color: object.collision.color,
          footprint: cloneStageObjectFootprintDefinition(object.collision.footprint),
        }
      : undefined,
    behavior: cloneStageObjectBehavior(object.behavior),
  };
}

function cloneStageLayoutDefinition(layout: StageLayoutDefinition): StageLayoutDefinition {
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
    walkRails: layout.walkRails?.map((rail) => ({
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
    objects: layout.objects.map((object) => cloneStageObjectDefinition(object)),
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

function getObjectTopLeft(
  transform: StageObjectTransformDefinition,
  metrics: StageObjectRenderMetrics,
): { x: number; y: number } {
  return {
    x: transform.x - metrics.width * transform.originX,
    y: transform.y - metrics.height * transform.originY,
  };
}

export function isBreakableStageObject(
  object: StageObjectDefinition,
): object is StageObjectDefinition & { behavior: StageObjectBreakableBehavior } {
  return object.behavior.type === "breakable";
}

export function getStageObjects(layout: StageLayoutConfig): StageObjectDefinition[] {
  return layout.objects;
}

export function resolveStageObjectRenderMetricsFromTexture(object: StageObjectDefinition): StageObjectRenderMetrics {
  const crop = derivedTextureCrops.find((entry) => entry.targetKey === object.visual.textureKey);
  if (!crop) {
    throw new Error(`Missing crop entry for textureKey: ${object.visual.textureKey}`);
  }
  const scale = resolveScaleReference({
    scaleTier: object.visual.scaleTier,
    spriteSpecId: object.visual.spriteSpecId,
  });
  return {
    width: crop.width * scale,
    height: crop.height * scale,
  };
}

export function resolveStageObjectCollisionFootprint(
  object: StageObjectDefinition,
  metrics: StageObjectRenderMetrics,
): StageCollisionFootprint | null {
  const collision = object.collision;
  if (!collision || !collision.blocksMovement) {
    return null;
  }

  const id = collision.id ?? `${object.id}_feet`;
  const color = collision.color ?? 0x0088ff;
  if (collision.footprint.mode === "explicit") {
    return {
      id,
      x: object.transform.x + (collision.footprint.offsetX ?? 0),
      y: object.transform.y + (collision.footprint.offsetY ?? 0),
      width: Math.max(1, collision.footprint.width),
      height: Math.max(1, collision.footprint.height),
      color,
    };
  }

  const topLeft = getObjectTopLeft(object.transform, metrics);
  const minWidth = Math.max(1, collision.footprint.minWidth ?? 1);
  const maxWidth = Math.max(minWidth, metrics.width * (collision.footprint.maxWidthRatio ?? 1));
  const candidateWidth = Math.round(metrics.width * collision.footprint.widthRatio);
  const width = clamp(candidateWidth, minWidth, maxWidth);
  const height = Math.max(1, collision.footprint.height);

  return {
    id,
    x: object.transform.x + (collision.footprint.offsetX ?? 0),
    y: topLeft.y + metrics.height - collision.footprint.baselineOffset + (collision.footprint.offsetY ?? 0),
    width,
    height,
    color,
  };
}

export function resolveStageObjectHurtboxRect(
  object: StageObjectDefinition,
  metrics: StageObjectRenderMetrics,
): StageResolvedObjectRect | null {
  if (!isBreakableStageObject(object)) {
    return null;
  }

  const topLeft = getObjectTopLeft(object.transform, metrics);
  const definition = object.behavior.hurtbox;
  if (definition.mode === "explicit") {
    return {
      x: topLeft.x + definition.offsetX,
      y: topLeft.y + definition.offsetY,
      width: Math.max(1, definition.width),
      height: Math.max(1, definition.height),
    };
  }

  const insetX = Math.max(0, definition.insetX ?? 0);
  const insetTop = Math.max(0, definition.insetTop ?? 0);
  const insetBottom = Math.max(0, definition.insetBottom ?? 0);
  return {
    x: topLeft.x + insetX,
    y: topLeft.y + insetTop,
    width: Math.max(1, metrics.width - insetX * 2),
    height: Math.max(1, metrics.height - insetTop - insetBottom),
  };
}

function buildLegacyCollectionsFromObjects(objects: StageObjectDefinition[]): {
  props: StagePropConfig[];
  breakableProps: StageBreakablePropConfig[];
  collisionFootprints: StageCollisionFootprint[];
} {
  const props: StagePropConfig[] = [];
  const breakableProps: StageBreakablePropConfig[] = [];
  const collisionFootprints: StageCollisionFootprint[] = [];

  for (const object of objects) {
    const metrics = resolveStageObjectRenderMetricsFromTexture(object);
    const footprint = resolveStageObjectCollisionFootprint(object, metrics);
    if (footprint) {
      collisionFootprints.push(footprint);
    }

    if (isBreakableStageObject(object)) {
      breakableProps.push({
        id: object.id,
        textureKey: object.visual.textureKey,
        x: object.transform.x,
        y: object.transform.y,
        originX: object.transform.originX,
        originY: object.transform.originY,
        scaleTier: object.visual.scaleTier,
        spriteSpecId: object.visual.spriteSpecId,
        maxHp: object.behavior.maxHp,
        points: object.behavior.points,
        dropType: object.behavior.drop?.type ?? "none",
        dropChance: object.behavior.drop?.chance,
        healAmount: object.behavior.drop?.healAmount,
      });
      continue;
    }

    props.push({
      id: object.id,
      textureKey: object.visual.textureKey,
      x: object.transform.x,
      y: object.transform.y,
      originX: object.transform.originX,
      originY: object.transform.originY,
      scaleTier: object.visual.scaleTier,
      spriteSpecId: object.visual.spriteSpecId,
      depthAnchorY: object.transform.depthAnchorY,
      depthOffset: object.transform.depthOffset ?? 0,
    });
  }

  return {
    props,
    breakableProps,
    collisionFootprints,
  };
}

export function defineStageLayout(layout: StageLayoutDefinition): StageLayoutConfig {
  const cloned = cloneStageLayoutDefinition(layout);
  const legacy = buildLegacyCollectionsFromObjects(cloned.objects);
  return {
    ...cloned,
    props: legacy.props,
    breakableProps: legacy.breakableProps,
    collisionFootprints: legacy.collisionFootprints,
  };
}

export function cloneStageLayoutConfig(layout: StageLayoutConfig): StageLayoutConfig {
  const rails = getStageWalkRails(layout);
  return defineStageLayout({
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
    walkRails: rails.length > 0
      ? rails.map((rail) => ({
          id: rail.id,
          xStart: rail.xStart,
          xEnd: rail.xEnd,
          topY: rail.topY,
          bottomY: rail.bottomY,
          preferredY: rail.preferredY,
        }))
      : undefined,
    layers: layout.layers.map((layer) => ({
      id: layer.id,
      depth: layer.depth,
      alpha: layer.alpha,
      targetRows: [...layer.targetRows],
      sourceRows: [...layer.sourceRows],
    })),
    objects: layout.objects.map((object) => cloneStageObjectDefinition(object)),
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
  });
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
