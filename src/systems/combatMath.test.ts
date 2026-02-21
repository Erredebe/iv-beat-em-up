import { describe, expect, it } from "vitest";
import { isFrameActive, isFrameInComboWindow, rectIntersects } from "./combatMath";
import type { AttackFrameData } from "../types/combat";

const sampleData: AttackFrameData = {
  totalFrames: 18,
  activeStart: 5,
  activeEnd: 7,
  recoveryStart: 8,
  comboWindowStart: 11,
  comboWindowEnd: 16,
  damage: 10,
  knockbackX: 90,
  causesKnockdown: false,
  hitStopMs: 80,
  iFrameMs: 120,
  hitStunMs: 200,
  knockdownDurationMs: 900,
  hitbox: {
    offsetX: 18,
    offsetY: -30,
    width: 20,
    height: 14,
  },
};

describe("combatMath", () => {
  it("detects AABB intersection", () => {
    expect(
      rectIntersects(
        { x: 10, y: 10, width: 20, height: 20 },
        { x: 24, y: 24, width: 20, height: 20 },
      ),
    ).toBe(true);
    expect(
      rectIntersects(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 20, width: 4, height: 4 },
      ),
    ).toBe(false);
  });

  it("flags active and combo frames correctly", () => {
    expect(isFrameActive(5, sampleData)).toBe(true);
    expect(isFrameActive(8, sampleData)).toBe(false);
    expect(isFrameInComboWindow(12, sampleData)).toBe(true);
    expect(isFrameInComboWindow(17, sampleData)).toBe(false);
  });
});

