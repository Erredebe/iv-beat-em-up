import type { FighterState } from "../../types/combat";

export const ANIMATION_OWNERS = ["kastro", "marina", "meneillos", "enemy"] as const;
export type AnimationOwner = (typeof ANIMATION_OWNERS)[number];

export const ANIMATION_CLIP_IDS = [
  "idle",
  "walk",
  "attack1",
  "attack2",
  "attack3",
  "airAttack",
  "special",
  "hurt",
  "knockdown",
  "getup",
] as const;
export type AnimationClipId = (typeof ANIMATION_CLIP_IDS)[number];

export const FIGHTER_STATES: FighterState[] = [
  "IDLE",
  "WALK",
  "BACKSTEP",
  "ATTACK_1",
  "ATTACK_2",
  "ATTACK_3",
  "JUMP",
  "AIR_ATTACK",
  "HIT",
  "KNOCKDOWN",
  "GETUP",
  "DEAD",
  "SPECIAL",
];

export interface SpritePixelOffsetSpec {
  x: number;
  y: number;
}

export interface SpriteFrameSizeSpec {
  width: number;
  height: number;
}

export interface SpritePivotSpec {
  x: number;
  y: number;
}

export interface RequiredClipSpec {
  clipId: AnimationClipId;
  textureKey: string;
  frameCount: number;
}

export interface FighterSpriteSpec {
  owner: AnimationOwner;
  requiredClips: Record<AnimationClipId, RequiredClipSpec>;
  frameSize: SpriteFrameSizeSpec;
  anchorOffsetY: number;
  pivot: SpritePivotSpec;
  baseStateOffsetByState: Record<FighterState, SpritePixelOffsetSpec>;
}

const CLIP_SUFFIX_BY_ID: Record<AnimationClipId, string> = {
  idle: "idle_strip10",
  walk: "walk_strip10",
  attack1: "attack1_strip10",
  attack2: "attack2_strip10",
  attack3: "attack3_strip10",
  airAttack: "air_attack_strip10",
  special: "special_strip10",
  hurt: "hurt_strip10",
  knockdown: "knockdown_strip10",
  getup: "getup_strip10",
};

const DEFAULT_FRAME_COUNT = 10;
const DEFAULT_FRAME_SIZE: SpriteFrameSizeSpec = {
  width: 128,
  height: 256,
};
const DEFAULT_PIVOT: SpritePivotSpec = {
  x: 0.5,
  y: 1,
};
const DEFAULT_ANCHOR_OFFSET_Y = 8;

function createStateOffsets(
  overrides: Partial<Record<FighterState, SpritePixelOffsetSpec>>,
): Record<FighterState, SpritePixelOffsetSpec> {
  const offsets = {} as Record<FighterState, SpritePixelOffsetSpec>;
  for (const state of FIGHTER_STATES) {
    offsets[state] = {
      x: overrides[state]?.x ?? 0,
      y: overrides[state]?.y ?? 0,
    };
  }
  return offsets;
}

function createRequiredClips(owner: AnimationOwner): Record<AnimationClipId, RequiredClipSpec> {
  const required = {} as Record<AnimationClipId, RequiredClipSpec>;
  for (const clipId of ANIMATION_CLIP_IDS) {
    required[clipId] = {
      clipId,
      textureKey: `${owner}_${CLIP_SUFFIX_BY_ID[clipId]}`,
      frameCount: DEFAULT_FRAME_COUNT,
    };
  }
  return required;
}

function createFighterSpriteSpec(
  owner: AnimationOwner,
  stateOffsetOverrides: Partial<Record<FighterState, SpritePixelOffsetSpec>>,
): FighterSpriteSpec {
  return {
    owner,
    requiredClips: createRequiredClips(owner),
    frameSize: {
      width: DEFAULT_FRAME_SIZE.width,
      height: DEFAULT_FRAME_SIZE.height,
    },
    anchorOffsetY: DEFAULT_ANCHOR_OFFSET_Y,
    pivot: {
      x: DEFAULT_PIVOT.x,
      y: DEFAULT_PIVOT.y,
    },
    baseStateOffsetByState: createStateOffsets(stateOffsetOverrides),
  };
}

export const fighterSpriteSpecs: Record<AnimationOwner, FighterSpriteSpec> = {
  kastro: createFighterSpriteSpec("kastro", {
    ATTACK_1: { x: -3, y: 0 },
    ATTACK_2: { x: -3, y: 0 },
    ATTACK_3: { x: -4, y: 0 },
    AIR_ATTACK: { x: -4, y: 1 },
    SPECIAL: { x: -5, y: 0 },
    KNOCKDOWN: { x: -8, y: 17 },
    DEAD: { x: -8, y: 17 },
  }),
  marina: createFighterSpriteSpec("marina", {
    ATTACK_1: { x: -4, y: -1 },
    ATTACK_2: { x: -4, y: -1 },
    ATTACK_3: { x: -5, y: -1 },
    AIR_ATTACK: { x: -6, y: 0 },
    SPECIAL: { x: -6, y: -1 },
    HIT: { x: 2, y: 0 },
    KNOCKDOWN: { x: -8, y: 16 },
    DEAD: { x: -8, y: 16 },
  }),
  meneillos: createFighterSpriteSpec("meneillos", {
    ATTACK_1: { x: -2, y: 0 },
    ATTACK_2: { x: -3, y: 0 },
    ATTACK_3: { x: -4, y: 0 },
    AIR_ATTACK: { x: -4, y: 1 },
    SPECIAL: { x: -4, y: 0 },
    HIT: { x: 2, y: 0 },
    KNOCKDOWN: { x: -8, y: 17 },
    DEAD: { x: -8, y: 17 },
  }),
  enemy: createFighterSpriteSpec("enemy", {
    ATTACK_1: { x: -3, y: 0 },
    ATTACK_2: { x: -3, y: 0 },
    ATTACK_3: { x: -4, y: 0 },
    AIR_ATTACK: { x: -4, y: 1 },
    SPECIAL: { x: -5, y: 0 },
    HIT: { x: 3, y: 0 },
    KNOCKDOWN: { x: -8, y: 17 },
    DEAD: { x: -8, y: 17 },
  }),
};

export function getFighterSpriteSpec(owner: AnimationOwner): FighterSpriteSpec {
  return fighterSpriteSpecs[owner];
}

export function getRequiredTextureKeysForOwner(owner: AnimationOwner): string[] {
  const spec = getFighterSpriteSpec(owner);
  return ANIMATION_CLIP_IDS.map((clipId) => spec.requiredClips[clipId].textureKey);
}

export function getRequiredTextureKeysForAllOwners(): string[] {
  return ANIMATION_OWNERS.flatMap((owner) => getRequiredTextureKeysForOwner(owner));
}
