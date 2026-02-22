export type Team = "player" | "enemy";

export type FighterState =
  | "IDLE"
  | "WALK"
  | "ATTACK_1"
  | "ATTACK_2"
  | "ATTACK_3"
  | "JUMP"
  | "AIR_ATTACK"
  | "HIT"
  | "KNOCKDOWN"
  | "GETUP"
  | "DEAD"
  | "SPECIAL";

export type AttackId =
  | "ATTACK_1"
  | "ATTACK_2"
  | "ATTACK_3"
  | "AIR_ATTACK"
  | "SPECIAL"
  | "ENEMY_ATTACK";

export type AttackVisualClipId =
  | "attack1"
  | "attack2"
  | "attack3"
  | "airAttack"
  | "special";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitboxShape {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface AttackFrameData {
  totalFrames: number;
  activeStart: number;
  activeEnd: number;
  recoveryStart: number;
  comboWindowStart?: number;
  comboWindowEnd?: number;
  damage: number;
  knockbackX: number;
  causesKnockdown: boolean;
  hitStopMs: number;
  iFrameMs: number;
  hitStunMs: number;
  knockdownDurationMs: number;
  nextAttack?: AttackId;
  hitbox: HitboxShape;
  grantsInvulnMs?: number;
  visualClipId?: AttackVisualClipId;
  hitboxMode?: "forward" | "centered";
  maxHitsPerTarget?: number;
  reHitCooldownFrames?: number;
  selfMoveXPerFrame?: number;
  selfMoveActiveStart?: number;
  selfMoveActiveEnd?: number;
}

export interface DamageEvent {
  damage: number;
  knockbackX: number;
  causesKnockdown: boolean;
  iFrameMs: number;
  hitStunMs: number;
  knockdownDurationMs: number;
  sourceX: number;
}
