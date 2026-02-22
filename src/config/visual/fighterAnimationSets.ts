import type Phaser from "phaser";

export type AnimationOwner = "kastro" | "marina" | "meneillos" | "enemy";

export type AnimationClipId =
  | "idle"
  | "walk"
  | "attack1"
  | "attack2"
  | "attack3"
  | "airAttack"
  | "special"
  | "hurt"
  | "knockdown"
  | "getup";

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

const CLIP_ORDER: AnimationClipId[] = [
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
];

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

function clipSuffix(clipId: AnimationClipId): string {
  if (clipId === "airAttack") {
    return "air_attack_strip10";
  }
  return `${clipId}_strip10`;
}

function createSet(owner: AnimationOwner): FighterAnimationSet {
  const tempo = OWNER_TEMPO[owner];
  const clips = {} as Record<AnimationClipId, AnimationClipConfig>;
  for (const clipId of CLIP_ORDER) {
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
      textureKey: `${owner}_${clipSuffix(clipId)}`,
      frameCount: 10,
      frameRate,
      repeat: clipId === "idle" || clipId === "walk" ? -1 : 0,
    };
  }
  return {
    idleClip: "idle",
    clips,
  };
}

const ACTIVE_SETS: Record<AnimationOwner, FighterAnimationSet> = {
  kastro: createSet("kastro"),
  marina: createSet("marina"),
  meneillos: createSet("meneillos"),
  enemy: createSet("enemy"),
};

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
  for (const owner of Object.keys(ACTIVE_SETS) as AnimationOwner[]) {
    const set = getFighterAnimationSet(owner);
    for (const clipId of Object.keys(set.clips) as AnimationClipId[]) {
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
