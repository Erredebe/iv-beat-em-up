import type { FighterState } from "../../types/combat";
import {
  ANIMATION_CLIP_IDS,
  ANIMATION_OWNERS,
  FIGHTER_STATES,
  getFighterSpriteSpec,
  type AnimationClipId,
  type AnimationOwner,
} from "./fighterSpriteSpecs";
import {
  FIGHTER_SCALE_REFERENCE,
  resolveScaleReference,
  type ScaleTier,
  type SpriteSpecId,
} from "./scaleSystem";

export interface SpritePixelOffset {
  x: number;
  y: number;
}

export interface SpritePivot {
  x: number;
  y: number;
}

export interface FighterVisualProfile {
  scaleTier: ScaleTier;
  spriteSpecId: SpriteSpecId;
  scale: number;
  shadowWidth: number;
  shadowHeight: number;
  spriteAnchorOffsetY: number;
  spritePivot: SpritePivot;
  shadowOffsetY: number;
  baselineOffsetByState?: Record<FighterState, number>;
  stateOffsetByState: Record<FighterState, SpritePixelOffset>;
  frameOffsetByClip: Partial<Record<AnimationClipId, SpritePixelOffset[]>>;
  clipScaleByClip?: Partial<Record<AnimationClipId, number>>;
}

function cloneStateOffsets(
  input: Record<FighterState, { x: number; y: number }>,
): Record<FighterState, SpritePixelOffset> {
  const map = {} as Record<FighterState, SpritePixelOffset>;
  for (const state of FIGHTER_STATES) {
    map[state] = {
      x: input[state].x,
      y: input[state].y,
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

const LEGACY_SOURCE_TO_LOGICAL_SCALE = 0.5;

function createFootLockOffsets(bottomPaddingByFrame: number[], lockedPad: number): SpritePixelOffset[] {
  return bottomPaddingByFrame.map((bottomPad) => ({
    x: 0,
    y: Math.round((bottomPad - lockedPad) * LEGACY_SOURCE_TO_LOGICAL_SCALE),
  }));
}

const KASTRO_KNOCKDOWN_BOTTOM_PADDING = [40, 38, 34, 30, 30, 30, 34, 34, 34, 34] as const;
const MARINA_KNOCKDOWN_BOTTOM_PADDING = [41, 39, 35, 31, 31, 31, 35, 35, 35, 35] as const;
const MENEILLOS_KNOCKDOWN_BOTTOM_PADDING = [40, 38, 34, 30, 30, 30, 34, 34, 34, 34] as const;
const ENEMY_KNOCKDOWN_BOTTOM_PADDING = [76, 74, 70, 66, 66, 66, 70, 70, 70, 70] as const;
const GENERIC_GETUP_BOTTOM_PADDING = [10, 10, 10, 13, 13, 17, 17, 20, 20, 20] as const;
const MARINA_GETUP_BOTTOM_PADDING = [11, 11, 11, 14, 14, 18, 18, 21, 21, 21] as const;

function createVisualProfile(
  owner: AnimationOwner,
  options: {
    shadowWidth: number;
    shadowHeight: number;
    shadowOffsetY: number;
    clipScaleByClip?: Partial<Record<AnimationClipId, number>>;
  },
): FighterVisualProfile {
  const fighterSpec = getFighterSpriteSpec(owner);
  const scaleTier = FIGHTER_SCALE_REFERENCE.scaleTier;
  const spriteSpecId = FIGHTER_SCALE_REFERENCE.spriteSpecId;
  return {
    scaleTier,
    spriteSpecId,
    scale: resolveScaleReference({ scaleTier, spriteSpecId }),
    shadowWidth: options.shadowWidth,
    shadowHeight: options.shadowHeight,
    spriteAnchorOffsetY: fighterSpec.anchorOffsetY,
    spritePivot: {
      x: fighterSpec.pivot.x,
      y: fighterSpec.pivot.y,
    },
    shadowOffsetY: options.shadowOffsetY,
    stateOffsetByState: cloneStateOffsets(fighterSpec.baseStateOffsetByState),
    frameOffsetByClip: {
      idle: createFrameOffsets(fighterSpec.requiredClips.idle.frameCount, 0),
      walk: createFrameOffsets(fighterSpec.requiredClips.walk.frameCount, 0),
    },
    clipScaleByClip: options.clipScaleByClip,
  };
}

export const fighterVisualProfiles: Record<AnimationOwner, FighterVisualProfile> = {
  kastro: createVisualProfile("kastro", {
    shadowWidth: 38,
    shadowHeight: 10,
    shadowOffsetY: 1,
    clipScaleByClip: {
      walk: 0.98,
      attack1: 0.98,
      attack2: 0.98,
      special: 0.97,
      hurt: 0.98,
      knockdown: 1.08,
      getup: 1.04,
    },
  }),
  marina: createVisualProfile("marina", {
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
      knockdown: 1.08,
      getup: 1.04,
    },
  }),
  meneillos: createVisualProfile("meneillos", {
    shadowWidth: 36,
    shadowHeight: 10,
    shadowOffsetY: 1,
    clipScaleByClip: {
      walk: 0.99,
      attack1: 0.99,
      attack2: 0.99,
      special: 0.99,
      hurt: 0.99,
      knockdown: 1.08,
      getup: 1.04,
    },
  }),
  enemy: createVisualProfile("enemy", {
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
      knockdown: 1.08,
      getup: 1.04,
    },
  }),
};

fighterVisualProfiles.kastro.frameOffsetByClip.idle = createFootLockOffsets([9, 5, 3, 3, 5, 9, 13, 15, 15, 13], 9);
fighterVisualProfiles.marina.frameOffsetByClip.idle = createFootLockOffsets([10, 6, 4, 4, 6, 10, 14, 16, 16, 14], 10);
fighterVisualProfiles.meneillos.frameOffsetByClip.idle = createFootLockOffsets([9, 5, 3, 3, 5, 9, 13, 15, 15, 13], 9);
fighterVisualProfiles.enemy.frameOffsetByClip.idle = createFootLockOffsets([9, 3, 0, 0, 3, 9, 15, 19, 19, 15], 9);
fighterVisualProfiles.kastro.frameOffsetByClip.knockdown = createFootLockOffsets([...KASTRO_KNOCKDOWN_BOTTOM_PADDING], 30);
fighterVisualProfiles.kastro.frameOffsetByClip.getup = createFootLockOffsets([...GENERIC_GETUP_BOTTOM_PADDING], 10);
fighterVisualProfiles.marina.frameOffsetByClip.knockdown = createFootLockOffsets([...MARINA_KNOCKDOWN_BOTTOM_PADDING], 31);
fighterVisualProfiles.marina.frameOffsetByClip.getup = createFootLockOffsets([...MARINA_GETUP_BOTTOM_PADDING], 11);
fighterVisualProfiles.meneillos.frameOffsetByClip.knockdown = createFootLockOffsets([...MENEILLOS_KNOCKDOWN_BOTTOM_PADDING], 30);
fighterVisualProfiles.meneillos.frameOffsetByClip.getup = createFootLockOffsets([...GENERIC_GETUP_BOTTOM_PADDING], 10);
fighterVisualProfiles.enemy.frameOffsetByClip.knockdown = createFootLockOffsets([...ENEMY_KNOCKDOWN_BOTTOM_PADDING], 66);
fighterVisualProfiles.enemy.frameOffsetByClip.getup = createFootLockOffsets([...GENERIC_GETUP_BOTTOM_PADDING], 10);

function validateVisualProfilesAgainstSpriteSpecs(
  profiles: Record<AnimationOwner, FighterVisualProfile>,
): void {
  const knownOwners = new Set<string>(ANIMATION_OWNERS);
  const knownClipIds = new Set<string>(ANIMATION_CLIP_IDS);

  for (const owner of ANIMATION_OWNERS) {
    if (!profiles[owner]) {
      throw new Error(`Missing visual profile for owner ${owner}`);
    }
  }

  for (const ownerId of Object.keys(profiles)) {
    if (!knownOwners.has(ownerId)) {
      throw new Error(`Unexpected visual profile owner ${ownerId}`);
    }
    const owner = ownerId as AnimationOwner;
    const profile = profiles[owner];
    const spec = getFighterSpriteSpec(owner);

    if (profile.spriteAnchorOffsetY !== spec.anchorOffsetY) {
      throw new Error(
        `Anchor offset mismatch for ${owner}: expected ${spec.anchorOffsetY}, got ${profile.spriteAnchorOffsetY}`,
      );
    }
    if (profile.spritePivot.x !== spec.pivot.x || profile.spritePivot.y !== spec.pivot.y) {
      throw new Error(
        `Pivot mismatch for ${owner}: expected (${spec.pivot.x}, ${spec.pivot.y}), got (${profile.spritePivot.x}, ${profile.spritePivot.y})`,
      );
    }

    for (const state of FIGHTER_STATES) {
      const expected = spec.baseStateOffsetByState[state];
      const actual = profile.stateOffsetByState[state];
      if (!actual || actual.x !== expected.x || actual.y !== expected.y) {
        throw new Error(
          `State offset mismatch for ${owner}.${state}: expected (${expected.x}, ${expected.y}), got (${actual?.x ?? "?"}, ${actual?.y ?? "?"})`,
        );
      }
    }

    for (const clipId of ANIMATION_CLIP_IDS) {
      const offsets = profile.frameOffsetByClip[clipId];
      if (!offsets || offsets.length === 0) {
        continue;
      }
      const expectedFrameCount = spec.requiredClips[clipId].frameCount;
      if (offsets.length !== expectedFrameCount) {
        throw new Error(
          `Frame offset length mismatch for ${owner}.${clipId}: expected ${expectedFrameCount}, got ${offsets.length}`,
        );
      }
    }

    for (const clipId of Object.keys(profile.clipScaleByClip ?? {})) {
      if (!knownClipIds.has(clipId)) {
        throw new Error(`Unknown clip scale key ${clipId} in profile ${owner}`);
      }
    }
  }
}

validateVisualProfilesAgainstSpriteSpecs(fighterVisualProfiles);
