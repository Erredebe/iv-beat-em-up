import type { AttackFrameData, AttackId } from "../types/combat";

export const BASE_WIDTH = 426;
export const BASE_HEIGHT = 240;
export const WORLD_WIDTH = 2556;

export const LANE_TOP = 96;
export const LANE_BOTTOM = 220;

export const PLAYER_SPAWN_X = 112;
export const PLAYER_SPAWN_Y = 194;

export const PLAYER_MAX_HP = 120;
export const PLAYER_MOVE_SPEED = 132;
export const ENEMY_MAX_HP = 100;
export const ENEMY_MOVE_SPEED = 96;

export const FOOT_COLLIDER_WIDTH = 14;
export const FOOT_COLLIDER_HEIGHT = 8;
export const VISUAL_FEET_OFFSET = 18;

export const JUMP_INITIAL_VELOCITY = 360;
export const JUMP_GRAVITY = 860;

export const ATTACK_FRAME_MS = 1000 / 60;
export const INPUT_BUFFER_MS = 100;
export const DEFAULT_HITSTOP_MS = 80;
export const SPECIAL_HP_COST_RATIO = 0.1;
export const SPECIAL_COOLDOWN_MS = 900;

export const DEBUG_TOGGLE_KEY = "F1";

export const DEFAULT_ATTACK_DATA: AttackFrameData = {
  totalFrames: 18,
  activeStart: 5,
  activeEnd: 7,
  recoveryStart: 8,
  comboWindowStart: 11,
  comboWindowEnd: 16,
  damage: 12,
  knockbackX: 90,
  causesKnockdown: false,
  hitStopMs: DEFAULT_HITSTOP_MS,
  iFrameMs: 180,
  hitStunMs: 220,
  knockdownDurationMs: 900,
  hitbox: {
    offsetX: 16,
    offsetY: -30,
    width: 20,
    height: 14,
  },
};

export const ENEMY_ATTACK_DATA: Record<AttackId, AttackFrameData> = {
  ENEMY_ATTACK: {
    totalFrames: 22,
    activeStart: 8,
    activeEnd: 10,
    recoveryStart: 11,
    damage: 10,
    knockbackX: 86,
    causesKnockdown: false,
    hitStopMs: DEFAULT_HITSTOP_MS,
    iFrameMs: 170,
    hitStunMs: 240,
    knockdownDurationMs: 900,
    hitbox: {
      offsetX: 15,
      offsetY: -29,
      width: 18,
      height: 14,
    },
  },
  ATTACK_1: DEFAULT_ATTACK_DATA,
  ATTACK_2: DEFAULT_ATTACK_DATA,
  ATTACK_3: DEFAULT_ATTACK_DATA,
  AIR_ATTACK: DEFAULT_ATTACK_DATA,
  SPECIAL: DEFAULT_ATTACK_DATA,
};

