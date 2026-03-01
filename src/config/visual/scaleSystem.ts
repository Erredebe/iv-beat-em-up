export type ScaleTier = "tiny" | "compact" | "standard" | "large" | "hero";
export type PixelUnit = "px1";
export type SpriteSpecId = "fighter_arcade" | "stage_prop_arcade" | "stage_breakable_arcade";

export interface SpriteSpec {
  id: SpriteSpecId;
  pixelUnit: PixelUnit;
  sourcePixelsPerUnit: number;
}

export interface SpriteScaleReference {
  scaleTier: ScaleTier;
  spriteSpecId: SpriteSpecId;
}

export const SCALE_TIER_ORDER: ScaleTier[] = ["tiny", "compact", "standard", "large", "hero"];

const PIXEL_UNIT_VALUE: Record<PixelUnit, number> = {
  px1: 1,
};

const SCALE_TIER_UNITS: Record<ScaleTier, number> = {
  tiny: 0.4,
  compact: 1,
  standard: 2,
  large: 3,
  hero: 4,
};

const SPRITE_SPECS: Record<SpriteSpecId, SpriteSpec> = {
  fighter_arcade: {
    id: "fighter_arcade",
    pixelUnit: "px1",
    sourcePixelsPerUnit: 2,
  },
  stage_prop_arcade: {
    id: "stage_prop_arcade",
    pixelUnit: "px1",
    sourcePixelsPerUnit: 2,
  },
  stage_breakable_arcade: {
    id: "stage_breakable_arcade",
    pixelUnit: "px1",
    sourcePixelsPerUnit: 2,
  },
};

export const FIGHTER_SCALE_REFERENCE: SpriteScaleReference = {
  scaleTier: "compact",
  spriteSpecId: "fighter_arcade",
};

export const STAGE_PROP_SCALE_REFERENCE: SpriteScaleReference = {
  scaleTier: "standard",
  spriteSpecId: "stage_prop_arcade",
};

export const BREAKABLE_PROP_SCALE_REFERENCE: SpriteScaleReference = {
  scaleTier: "compact",
  spriteSpecId: "stage_breakable_arcade",
};

export function getSpriteSpec(spriteSpecId: SpriteSpecId): SpriteSpec {
  return SPRITE_SPECS[spriteSpecId];
}

export function resolveSpriteScale(scaleTier: ScaleTier, spriteSpecId: SpriteSpecId): number {
  const spec = getSpriteSpec(spriteSpecId);
  const logicalUnits = SCALE_TIER_UNITS[scaleTier];
  const pixelUnitValue = PIXEL_UNIT_VALUE[spec.pixelUnit];
  return (logicalUnits * pixelUnitValue) / spec.sourcePixelsPerUnit;
}

export function resolveScaleReference(reference: SpriteScaleReference): number {
  return resolveSpriteScale(reference.scaleTier, reference.spriteSpecId);
}
