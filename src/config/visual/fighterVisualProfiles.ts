import type { FighterState } from "../../types/combat";

export interface FighterVisualProfile {
  scale: 1 | 2 | 3;
  shadowWidth: number;
  shadowHeight: number;
  baselineOffsetByState: Record<FighterState, number>;
}

function createBaselineOffsets(
  overrides: Partial<Record<FighterState, number>>,
  defaultOffset = 0,
): Record<FighterState, number> {
  const states: FighterState[] = [
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

  const map = {} as Record<FighterState, number>;
  for (const state of states) {
    map[state] = overrides[state] ?? defaultOffset;
  }
  return map;
}

export const fighterVisualProfiles: Record<"player" | "enemy", FighterVisualProfile> = {
  player: {
    scale: 3,
    shadowWidth: 24,
    shadowHeight: 8,
    baselineOffsetByState: createBaselineOffsets({
      ATTACK_1: 1,
      ATTACK_2: 1,
      ATTACK_3: 2,
      AIR_ATTACK: 0,
      SPECIAL: 2,
      HIT: 1,
      KNOCKDOWN: 4,
      GETUP: 2,
      DEAD: 4,
    }),
  },
  enemy: {
    scale: 3,
    shadowWidth: 24,
    shadowHeight: 8,
    baselineOffsetByState: createBaselineOffsets({
      ATTACK_1: 1,
      ATTACK_2: 1,
      ATTACK_3: 2,
      AIR_ATTACK: 0,
      SPECIAL: 2,
      HIT: 1,
      KNOCKDOWN: 4,
      GETUP: 2,
      DEAD: 4,
    }),
  },
};
