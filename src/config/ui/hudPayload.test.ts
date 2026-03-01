import { describe, expect, it } from "vitest";
import type { HudPayload } from "./hudPayload";

describe("hud payload contract", () => {
  it("requires arcade HUD fields", () => {
    const payload: HudPayload = {
      playerHp: 120,
      playerMaxHp: 138,
      playerName: "KASTRO",
      playerPortraitKey: "portrait_kastro",
      score: 1200,
      timeRemainingSec: 99,
      specialCooldownRatio: 0.5,
      stageName: "MERCADO 95",
      zoneId: "market_zone_1",
      targetEnemy: null,
      visibleEnemies: [],
      controlsHintVisible: true,
      isPaused: false,
      isGameOver: false,
      zoneMessage: null,
      bindingHints: { keyboard: [], gamepad: [] },
      objectiveText: "",
      objectiveProgress: null,
      threatLevel: "low",
      radioMessage: null,
    };

    expect(payload.playerName.length).toBeGreaterThan(0);
    expect(payload.timeRemainingSec).toBeGreaterThanOrEqual(0);
    expect(payload.specialCooldownRatio).toBeGreaterThanOrEqual(0);
    expect(payload.specialCooldownRatio).toBeLessThanOrEqual(1);
  });
});
