import { describe, expect, it } from "vitest";
import { buildStreetHudPayload, projectWorldToHud } from "./hudPayloadAdapter";

describe("hud payload adapter", () => {
  it("projects world coordinates into HUD space with camera zoom", () => {
    expect(projectWorldToHud({ scrollX: 100, scrollY: 40, width: 426, height: 240, zoom: 1.08 }, 140, 120)).toEqual({
      x: 43.2,
      y: 86.4,
    });
  });

  it("filters enemies by visible world width and projects their bar positions", () => {
    const payload = buildStreetHudPayload({
      nowMs: 2000,
      camera: { scrollX: 100, scrollY: 20, width: 426, height: 240, zoom: 1.08 },
      player: {
        hp: 100,
        maxHp: 120,
        getSpecialCooldownRatio: () => 0.5,
      } as never,
      selectedCharacter: { displayName: "KASTRO", portraitKey: "portrait_kastro" },
      enemies: [
        { id: "near", hp: 20, maxHp: 40, x: 200, y: 190, isAlive: () => true },
        { id: "far", hp: 20, maxHp: 40, x: 530, y: 190, isAlive: () => true },
      ] as never,
      score: 1000,
      stageName: "MERCADO 95",
      stageStartedAt: 0,
      stageTimeLimitMs: 60000,
      zoneId: null,
      targetEnemy: null,
      controlsHintVisible: false,
      isPaused: false,
      isGameOver: false,
      zoneMessage: null,
      objectiveText: "",
      objectiveProgress: null,
      threatLevel: "low",
      radioMessage: null,
      bindingHints: { keyboard: [], gamepad: [] },
    });

    expect(payload.visibleEnemies).toHaveLength(1);
    expect(payload.visibleEnemies[0]).toMatchObject({
      id: "near",
      x: 108,
      y: 95.04,
    });
  });
});
