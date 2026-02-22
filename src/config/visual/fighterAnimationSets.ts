import type Phaser from "phaser";
import { isFeatureEnabled } from "../features";

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

const LEGACY_PLAYER_SET: FighterAnimationSet = {
  idleClip: "idle",
  clips: {
    idle: { clipId: "idle", textureKey: "player_idle_strip4", frameCount: 4, frameRate: 8, repeat: -1 },
    walk: { clipId: "walk", textureKey: "player_walk_strip4", frameCount: 4, frameRate: 10, repeat: -1 },
    attack1: { clipId: "attack1", textureKey: "player_punch1", frameCount: 1, frameRate: 1, repeat: 0 },
    attack2: { clipId: "attack2", textureKey: "player_punch2", frameCount: 1, frameRate: 1, repeat: 0 },
    attack3: { clipId: "attack3", textureKey: "player_punch2", frameCount: 1, frameRate: 1, repeat: 0 },
    airAttack: { clipId: "airAttack", textureKey: "player_kick1", frameCount: 1, frameRate: 1, repeat: 0 },
    special: { clipId: "special", textureKey: "player_kick2", frameCount: 1, frameRate: 1, repeat: 0 },
    hurt: { clipId: "hurt", textureKey: "player_hurt", frameCount: 1, frameRate: 1, repeat: 0 },
    knockdown: { clipId: "knockdown", textureKey: "player_knockdown", frameCount: 1, frameRate: 1, repeat: 0 },
    getup: { clipId: "getup", textureKey: "player_getup", frameCount: 1, frameRate: 1, repeat: 0 },
  },
};

const LEGACY_ENEMY_SET: FighterAnimationSet = {
  idleClip: "idle",
  clips: {
    idle: { clipId: "idle", textureKey: "enemy_idle_strip4", frameCount: 4, frameRate: 8, repeat: -1 },
    walk: { clipId: "walk", textureKey: "enemy_walk_strip4", frameCount: 4, frameRate: 10, repeat: -1 },
    attack1: { clipId: "attack1", textureKey: "enemy_punch1", frameCount: 1, frameRate: 1, repeat: 0 },
    attack2: { clipId: "attack2", textureKey: "enemy_punch2", frameCount: 1, frameRate: 1, repeat: 0 },
    attack3: { clipId: "attack3", textureKey: "enemy_punch2", frameCount: 1, frameRate: 1, repeat: 0 },
    airAttack: { clipId: "airAttack", textureKey: "enemy_kick1", frameCount: 1, frameRate: 1, repeat: 0 },
    special: { clipId: "special", textureKey: "enemy_kick2", frameCount: 1, frameRate: 1, repeat: 0 },
    hurt: { clipId: "hurt", textureKey: "enemy_hurt", frameCount: 1, frameRate: 1, repeat: 0 },
    knockdown: { clipId: "knockdown", textureKey: "enemy_knockdown", frameCount: 1, frameRate: 1, repeat: 0 },
    getup: { clipId: "getup", textureKey: "enemy_getup", frameCount: 1, frameRate: 1, repeat: 0 },
  },
};

const ARCADE_PLAYER_SET: FighterAnimationSet = {
  idleClip: "idle",
  clips: {
    idle: { clipId: "idle", textureKey: "player_idle_strip10", frameCount: 10, frameRate: 12, repeat: -1 },
    walk: { clipId: "walk", textureKey: "player_walk_strip10", frameCount: 10, frameRate: 14, repeat: -1 },
    attack1: { clipId: "attack1", textureKey: "player_attack1_strip10", frameCount: 10, frameRate: 16, repeat: 0 },
    attack2: { clipId: "attack2", textureKey: "player_attack2_strip10", frameCount: 10, frameRate: 16, repeat: 0 },
    attack3: { clipId: "attack3", textureKey: "player_attack3_strip10", frameCount: 10, frameRate: 16, repeat: 0 },
    airAttack: { clipId: "airAttack", textureKey: "player_air_attack_strip10", frameCount: 10, frameRate: 16, repeat: 0 },
    special: { clipId: "special", textureKey: "player_special_strip10", frameCount: 10, frameRate: 16, repeat: 0 },
    hurt: { clipId: "hurt", textureKey: "player_hurt_strip10", frameCount: 10, frameRate: 12, repeat: 0 },
    knockdown: { clipId: "knockdown", textureKey: "player_knockdown_strip10", frameCount: 10, frameRate: 10, repeat: 0 },
    getup: { clipId: "getup", textureKey: "player_getup_strip10", frameCount: 10, frameRate: 10, repeat: 0 },
  },
};

const ARCADE_ENEMY_SET: FighterAnimationSet = {
  idleClip: "idle",
  clips: {
    idle: { clipId: "idle", textureKey: "enemy_idle_strip10", frameCount: 10, frameRate: 12, repeat: -1 },
    walk: { clipId: "walk", textureKey: "enemy_walk_strip10", frameCount: 10, frameRate: 14, repeat: -1 },
    attack1: { clipId: "attack1", textureKey: "enemy_attack1_strip10", frameCount: 10, frameRate: 15, repeat: 0 },
    attack2: { clipId: "attack2", textureKey: "enemy_attack2_strip10", frameCount: 10, frameRate: 15, repeat: 0 },
    attack3: { clipId: "attack3", textureKey: "enemy_attack3_strip10", frameCount: 10, frameRate: 15, repeat: 0 },
    airAttack: { clipId: "airAttack", textureKey: "enemy_air_attack_strip10", frameCount: 10, frameRate: 15, repeat: 0 },
    special: { clipId: "special", textureKey: "enemy_special_strip10", frameCount: 10, frameRate: 15, repeat: 0 },
    hurt: { clipId: "hurt", textureKey: "enemy_hurt_strip10", frameCount: 10, frameRate: 12, repeat: 0 },
    knockdown: { clipId: "knockdown", textureKey: "enemy_knockdown_strip10", frameCount: 10, frameRate: 10, repeat: 0 },
    getup: { clipId: "getup", textureKey: "enemy_getup_strip10", frameCount: 10, frameRate: 10, repeat: 0 },
  },
};

const ACTIVE_SETS = isFeatureEnabled("arcadeArt")
  ? { player: ARCADE_PLAYER_SET, enemy: ARCADE_ENEMY_SET }
  : { player: LEGACY_PLAYER_SET, enemy: LEGACY_ENEMY_SET };

function animationKey(fighterId: "player" | "enemy", clipId: AnimationClipId): string {
  return `${fighterId}_${clipId}`;
}

export function getFighterAnimationSet(fighterId: "player" | "enemy"): FighterAnimationSet {
  return ACTIVE_SETS[fighterId];
}

export function getAnimationKey(fighterId: "player" | "enemy", clipId: AnimationClipId): string {
  return animationKey(fighterId, clipId);
}

export function ensureFighterAnimations(scene: Phaser.Scene): void {
  for (const fighterId of ["player", "enemy"] as const) {
    const set = getFighterAnimationSet(fighterId);
    for (const clipId of Object.keys(set.clips) as AnimationClipId[]) {
      const clip = set.clips[clipId];
      const key = animationKey(fighterId, clipId);
      if (scene.anims.exists(key)) {
        continue;
      }

      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(clip.textureKey, {
          start: 0,
          end: Math.max(0, clip.frameCount - 1),
        }),
        frameRate: clip.frameRate,
        repeat: clip.repeat,
      });
    }
  }
}
