import type { FighterState } from "../../types/combat";
import { isFeatureEnabled } from "../features";
import type { AnimationClipId } from "./fighterAnimationSets";

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
  frameOffsetByClip: Partial<Record<AnimationClipId, SpritePixelOffset[]>>;
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

function createFrameOffsets(frameCount: number, wave = 0): SpritePixelOffset[] {
  return Array.from({ length: frameCount }, (_, frame) => ({
    x: 0,
    y: Math.round(Math.sin((frame / Math.max(1, frameCount - 1)) * Math.PI * 2) * wave),
  }));
}

const isArcade = isFeatureEnabled("arcadeArt");
const idleFrameCount = isArcade ? 10 : 4;
const walkFrameCount = isArcade ? 10 : 4;

const playerStateOffsets = createStateOffsets({
  ATTACK_1: { x: -5, y: 0 },
  ATTACK_2: { x: -4, y: 0 },
  ATTACK_3: { x: -4, y: 0 },
  AIR_ATTACK: { x: -6, y: 2 },
  SPECIAL: { x: -8, y: 0 },
  HIT: { x: 3, y: 0 },
  KNOCKDOWN: { x: -10, y: isArcade ? 18 : 9 },
  DEAD: { x: -10, y: isArcade ? 18 : 9 },
});

const enemyStateOffsets = createStateOffsets({
  ATTACK_1: { x: -5, y: 0 },
  ATTACK_2: { x: -4, y: 0 },
  ATTACK_3: { x: -4, y: 0 },
  AIR_ATTACK: { x: -6, y: 2 },
  SPECIAL: { x: -8, y: 0 },
  HIT: { x: 3, y: 0 },
  KNOCKDOWN: { x: -10, y: isArcade ? 18 : 12 },
  DEAD: { x: -10, y: isArcade ? 18 : 12 },
});

export const fighterVisualProfiles: Record<"player" | "enemy", FighterVisualProfile> = {
  player: {
    scale: isArcade ? 1 : 3,
    shadowWidth: isArcade ? 36 : 24,
    shadowHeight: isArcade ? 10 : 8,
    spriteAnchorOffsetY: 0,
    shadowOffsetY: 1,
    baselineOffsetByState: createLegacyBaselineOffsets(playerStateOffsets),
    stateOffsetByState: playerStateOffsets,
    frameOffsetByClip: {
      idle: createFrameOffsets(idleFrameCount, isArcade ? 1 : 0),
      walk: createFrameOffsets(walkFrameCount, 0),
    },
  },
  enemy: {
    scale: isArcade ? 1 : 3,
    shadowWidth: isArcade ? 36 : 24,
    shadowHeight: isArcade ? 10 : 8,
    spriteAnchorOffsetY: 0,
    shadowOffsetY: 1,
    baselineOffsetByState: createLegacyBaselineOffsets(enemyStateOffsets),
    stateOffsetByState: enemyStateOffsets,
    frameOffsetByClip: {
      idle: createFrameOffsets(idleFrameCount, isArcade ? 1 : 0),
      walk: createFrameOffsets(walkFrameCount, 0),
    },
  },
};
