import type { FighterState } from "../../types/combat";
import type { AnimationClipId, AnimationOwner } from "./fighterAnimationSets";

export interface SpritePixelOffset {
  x: number;
  y: number;
}

export interface FighterVisualProfile {
  scale: number;
  shadowWidth: number;
  shadowHeight: number;
  spriteAnchorOffsetY: number;
  shadowOffsetY: number;
  baselineOffsetByState?: Record<FighterState, number>;
  stateOffsetByState: Record<FighterState, SpritePixelOffset>;
  frameOffsetByClip: Partial<Record<AnimationClipId, SpritePixelOffset[]>>;
  clipScaleByClip?: Partial<Record<AnimationClipId, number>>;
}

const ALL_STATES: FighterState[] = [
  "IDLE",
  "WALK",
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

function createStateOffsets(
  overrides: Partial<Record<FighterState, Partial<SpritePixelOffset>>>,
  defaultOffset: SpritePixelOffset = { x: 0, y: 0 },
): Record<FighterState, SpritePixelOffset> {
  const map = {} as Record<FighterState, SpritePixelOffset>;
  for (const state of ALL_STATES) {
    map[state] = {
      x: overrides[state]?.x ?? defaultOffset.x,
      y: overrides[state]?.y ?? defaultOffset.y,
    };
  }
  return map;
}

function createFrameOffsets(frameCount: number, bobAmplitude = 0): SpritePixelOffset[] {
  return Array.from({ length: frameCount }, (_, frameIndex) => ({
    x: 0,
    y: Math.round(Math.sin((frameIndex / Math.max(1, frameCount - 1)) * Math.PI * 2) * bobAmplitude),
  }));
}

function createConstantFrameOffsets(frameCount: number, yOffset: number): SpritePixelOffset[] {
  return Array.from({ length: frameCount }, () => ({
    x: 0,
    y: yOffset,
  }));
}

function createFootLockOffsets(bottomPaddingByFrame: number[], lockedPad: number): SpritePixelOffset[] {
  return bottomPaddingByFrame.map((bottomPad) => ({
    x: 0,
    y: bottomPad - lockedPad,
  }));
}

function createVisualProfile(
  stateOffsets: Partial<Record<FighterState, Partial<SpritePixelOffset>>>,
  options: {
    shadowWidth: number;
    shadowHeight: number;
    shadowOffsetY: number;
    clipScaleByClip?: Partial<Record<AnimationClipId, number>>;
  },
): FighterVisualProfile {
  return {
    scale: 0.5,
    shadowWidth: options.shadowWidth,
    shadowHeight: options.shadowHeight,
    spriteAnchorOffsetY: 8,
    shadowOffsetY: options.shadowOffsetY,
    stateOffsetByState: createStateOffsets(stateOffsets),
    frameOffsetByClip: {
      idle: createFrameOffsets(10, 0),
      walk: createFrameOffsets(10, 0),
    },
    clipScaleByClip: options.clipScaleByClip,
  };
}

export const fighterVisualProfiles: Record<AnimationOwner, FighterVisualProfile> = {
  kastro: createVisualProfile(
    {
      ATTACK_1: { x: -3, y: 0 },
      ATTACK_2: { x: -3, y: 0 },
      ATTACK_3: { x: -4, y: 0 },
      AIR_ATTACK: { x: -4, y: 1 },
      SPECIAL: { x: -5, y: 0 },
      KNOCKDOWN: { x: -8, y: 17 },
      DEAD: { x: -8, y: 17 },
    },
    {
      shadowWidth: 38,
      shadowHeight: 10,
      shadowOffsetY: 1,
      clipScaleByClip: {
        walk: 0.98,
        attack1: 0.98,
        attack2: 0.98,
        special: 0.97,
        hurt: 0.98,
      },
    },
  ),
  marina: createVisualProfile(
    {
      ATTACK_1: { x: -4, y: -1 },
      ATTACK_2: { x: -4, y: -1 },
      ATTACK_3: { x: -5, y: -1 },
      AIR_ATTACK: { x: -6, y: 0 },
      SPECIAL: { x: -6, y: -1 },
      HIT: { x: 2, y: 0 },
      KNOCKDOWN: { x: -8, y: 16 },
      DEAD: { x: -8, y: 16 },
    },
    {
      shadowWidth: 34,
      shadowHeight: 9,
      shadowOffsetY: 1,
      clipScaleByClip: {
        walk: 0.99,
        attack1: 1.02,
        attack2: 1.02,
        attack3: 1.02,
        airAttack: 1.03,
        special: 1.01,
      },
    },
  ),
  meneillos: createVisualProfile(
    {
      ATTACK_1: { x: -2, y: 0 },
      ATTACK_2: { x: -3, y: 0 },
      ATTACK_3: { x: -4, y: 0 },
      AIR_ATTACK: { x: -4, y: 1 },
      SPECIAL: { x: -4, y: 0 },
      HIT: { x: 2, y: 0 },
      KNOCKDOWN: { x: -8, y: 17 },
      DEAD: { x: -8, y: 17 },
    },
    {
      shadowWidth: 36,
      shadowHeight: 10,
      shadowOffsetY: 1,
      clipScaleByClip: {
        walk: 0.99,
        attack1: 0.99,
        attack2: 0.99,
        special: 0.99,
        hurt: 0.99,
      },
    },
  ),
  enemy: createVisualProfile(
    {
      ATTACK_1: { x: -3, y: 0 },
      ATTACK_2: { x: -3, y: 0 },
      ATTACK_3: { x: -4, y: 0 },
      AIR_ATTACK: { x: -4, y: 1 },
      SPECIAL: { x: -5, y: 0 },
      HIT: { x: 3, y: 0 },
      KNOCKDOWN: { x: -8, y: 17 },
      DEAD: { x: -8, y: 17 },
    },
    {
      shadowWidth: 36,
      shadowHeight: 10,
      shadowOffsetY: 1,
      clipScaleByClip: {
        walk: 0.99,
        attack1: 1.01,
        attack2: 1.01,
        attack3: 1.02,
        airAttack: 1.02,
        hurt: 0.95,
      },
    },
  ),
};

fighterVisualProfiles.kastro.frameOffsetByClip.idle = createFootLockOffsets([9, 5, 3, 3, 5, 9, 13, 15, 15, 13], 9);
fighterVisualProfiles.marina.frameOffsetByClip.idle = createFootLockOffsets([10, 6, 4, 4, 6, 10, 14, 16, 16, 14], 10);
fighterVisualProfiles.meneillos.frameOffsetByClip.idle = createFootLockOffsets([9, 5, 3, 3, 5, 9, 13, 15, 15, 13], 9);
fighterVisualProfiles.enemy.frameOffsetByClip.idle = createFootLockOffsets([9, 3, 0, 0, 3, 9, 15, 19, 19, 15], 9);
fighterVisualProfiles.marina.frameOffsetByClip.knockdown = createConstantFrameOffsets(10, 15);
fighterVisualProfiles.enemy.frameOffsetByClip.knockdown = createConstantFrameOffsets(10, 15);
