import type { FighterState } from "../../types/combat";

export type TextureStateId =
  | "idle_strip4"
  | "walk_strip4"
  | "punch1"
  | "punch2"
  | "kick1"
  | "kick2"
  | "hurt"
  | "knockdown"
  | "getup";

export interface SpritePixelOffset {
  x: number;
  y: number;
}

export interface FighterVisualProfile {
  scale: 1 | 2 | 3;
  shadowWidth: number;
  shadowHeight: number;
  spriteAnchorOffsetY: number;
  shadowOffsetY: number;
  baselineOffsetByState?: Record<FighterState, number>;
  stateOffsetByState: Record<FighterState, SpritePixelOffset>;
  frameOffsetByTexture: Partial<Record<TextureStateId, SpritePixelOffset[]>>;
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

function createLegacyBaselineOffsets(offsets: Record<FighterState, SpritePixelOffset>): Record<FighterState, number> {
  const map = {} as Record<FighterState, number>;
  for (const state of ALL_STATES) {
    map[state] = offsets[state].y;
  }
  return map;
}

function createFrameOffsets(
  frameCount: number,
  overrides: Partial<Record<number, Partial<SpritePixelOffset>>> = {},
): SpritePixelOffset[] {
  return Array.from({ length: frameCount }, (_, frame) => ({
    x: overrides[frame]?.x ?? 0,
    y: overrides[frame]?.y ?? 0,
  }));
}

const playerStateOffsets = createStateOffsets({
  ATTACK_1: { x: -6, y: 0 },
  ATTACK_2: { x: -3, y: 0 },
  ATTACK_3: { x: -3, y: 0 },
  AIR_ATTACK: { x: -9, y: 3 },
  SPECIAL: { x: -7, y: 0 },
  HIT: { x: 2, y: 0 },
  KNOCKDOWN: { x: -12, y: 9 },
  DEAD: { x: -12, y: 9 },
});

const enemyStateOffsets = createStateOffsets({
  ATTACK_1: { x: -6, y: 0 },
  ATTACK_2: { x: -4, y: 0 },
  ATTACK_3: { x: -4, y: 0 },
  AIR_ATTACK: { x: -8, y: 3 },
  SPECIAL: { x: -7, y: 0 },
  HIT: { x: 2, y: 0 },
  KNOCKDOWN: { x: -11, y: 12 },
  DEAD: { x: -11, y: 12 },
});

export const fighterVisualProfiles: Record<"player" | "enemy", FighterVisualProfile> = {
  player: {
    scale: 3,
    shadowWidth: 24,
    shadowHeight: 8,
    spriteAnchorOffsetY: 0,
    shadowOffsetY: 1,
    baselineOffsetByState: createLegacyBaselineOffsets(playerStateOffsets),
    stateOffsetByState: playerStateOffsets,
    frameOffsetByTexture: {
      idle_strip4: createFrameOffsets(4, {
        2: { x: -1 },
        3: { x: -1 },
      }),
      walk_strip4: createFrameOffsets(4, {
        1: { x: -3 },
        2: { x: -3 },
        3: { x: -3 },
      }),
    },
  },
  enemy: {
    scale: 3,
    shadowWidth: 24,
    shadowHeight: 8,
    spriteAnchorOffsetY: 0,
    shadowOffsetY: 1,
    baselineOffsetByState: createLegacyBaselineOffsets(enemyStateOffsets),
    stateOffsetByState: enemyStateOffsets,
    frameOffsetByTexture: {
      idle_strip4: createFrameOffsets(4, {
        2: { x: -1 },
        3: { x: -1 },
      }),
      walk_strip4: createFrameOffsets(4, {
        1: { x: -3 },
        2: { x: -2 },
        3: { x: -3 },
      }),
    },
  },
};
