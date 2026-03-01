import type Phaser from "phaser";
import {
  ANIMATION_CLIP_IDS,
  ANIMATION_OWNERS,
  getFighterSpriteSpec,
  type AnimationClipId,
  type AnimationOwner,
} from "./fighterSpriteSpecs";

export type { AnimationClipId, AnimationOwner } from "./fighterSpriteSpecs";

export interface AnimationClipConfig {
  clipId: AnimationClipId;
  textureKey: string;
  frameCount: number;
  frameRate: number;
  repeat: number;
}

export interface FighterAnimationSet {
  idleClip: AnimationClipId;
  clips: Record<AnimationClipId, AnimationClipConfig>;
}

interface OwnerTempo {
  idle: number;
  walk: number;
  attack: number;
  hurt: number;
  knockdown: number;
}

const OWNER_TEMPO: Record<AnimationOwner, OwnerTempo> = {
  kastro: { idle: 11, walk: 12, attack: 14, hurt: 11, knockdown: 9 },
  marina: { idle: 13, walk: 16, attack: 18, hurt: 13, knockdown: 11 },
  meneillos: { idle: 12, walk: 14, attack: 16, hurt: 12, knockdown: 10 },
  enemy: { idle: 12, walk: 14, attack: 15, hurt: 12, knockdown: 10 },
};

function createSet(owner: AnimationOwner): FighterAnimationSet {
  const tempo = OWNER_TEMPO[owner];
  const spriteSpec = getFighterSpriteSpec(owner);
  const clips = {} as Record<AnimationClipId, AnimationClipConfig>;
  for (const clipId of ANIMATION_CLIP_IDS) {
    const requiredClip = spriteSpec.requiredClips[clipId];
    const frameRate =
      clipId === "idle"
        ? tempo.idle
        : clipId === "walk"
          ? tempo.walk
          : clipId === "hurt"
            ? tempo.hurt
            : clipId === "knockdown" || clipId === "getup"
              ? tempo.knockdown
              : tempo.attack;

    clips[clipId] = {
      clipId,
      textureKey: requiredClip.textureKey,
      frameCount: requiredClip.frameCount,
      frameRate,
      repeat: clipId === "idle" || clipId === "walk" ? -1 : 0,
    };
  }
  return {
    idleClip: "idle",
    clips,
  };
}

const ACTIVE_SETS = Object.fromEntries(
  ANIMATION_OWNERS.map((owner) => [owner, createSet(owner)]),
) as Record<AnimationOwner, FighterAnimationSet>;

function validateAnimationSetsAgainstSpecs(sets: Record<AnimationOwner, FighterAnimationSet>): void {
  const knownClipIds = new Set<string>(ANIMATION_CLIP_IDS);
  for (const owner of ANIMATION_OWNERS) {
    const set = sets[owner];
    const spec = getFighterSpriteSpec(owner);
    if (!set) {
      throw new Error(`Missing animation set for owner ${owner}`);
    }
    if (!set.clips[set.idleClip]) {
      throw new Error(`Invalid idle clip ${set.idleClip} for owner ${owner}`);
    }

    const clipIds = Object.keys(set.clips) as AnimationClipId[];
    for (const clipId of clipIds) {
      if (!knownClipIds.has(clipId)) {
        throw new Error(`Unexpected clip ${clipId} for owner ${owner}`);
      }
    }

    for (const clipId of ANIMATION_CLIP_IDS) {
      const requiredClip = spec.requiredClips[clipId];
      const clip = set.clips[clipId];
      if (!clip) {
        throw new Error(`Missing clip ${clipId} for owner ${owner}`);
      }
      if (clip.textureKey !== requiredClip.textureKey) {
        throw new Error(
          `Texture mismatch for ${owner}.${clipId}: expected ${requiredClip.textureKey}, got ${clip.textureKey}`,
        );
      }
      if (clip.frameCount !== requiredClip.frameCount) {
        throw new Error(
          `Frame count mismatch for ${owner}.${clipId}: expected ${requiredClip.frameCount}, got ${clip.frameCount}`,
        );
      }
    }
  }
}

validateAnimationSetsAgainstSpecs(ACTIVE_SETS);

function animationKey(owner: AnimationOwner, clipId: AnimationClipId): string {
  return `${owner}_${clipId}`;
}

export function getFighterAnimationSet(owner: AnimationOwner): FighterAnimationSet {
  return ACTIVE_SETS[owner];
}

export function getAnimationKey(owner: AnimationOwner, clipId: AnimationClipId): string {
  return animationKey(owner, clipId);
}

export function ensureFighterAnimations(scene: Phaser.Scene): void {
  for (const owner of ANIMATION_OWNERS) {
    const set = getFighterAnimationSet(owner);
    for (const clipId of ANIMATION_CLIP_IDS) {
      const clip = set.clips[clipId];
      const key = animationKey(owner, clipId);
      if (scene.anims.exists(key)) {
        continue;
      }

      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(clip.textureKey, {
          start: 0,
          end: clip.frameCount - 1,
        }),
        frameRate: clip.frameRate,
        repeat: clip.repeat,
      });
    }
  }
}
