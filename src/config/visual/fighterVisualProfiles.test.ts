import { describe, expect, it } from "vitest";
import { fighterVisualProfiles } from "./fighterVisualProfiles";

describe("fighter visual profiles", () => {
  it("define anchor and shadow offsets for all fighters", () => {
    for (const [fighterId, profile] of Object.entries(fighterVisualProfiles)) {
      expect(
        typeof profile.spriteAnchorOffsetY,
        `${fighterId} is missing spriteAnchorOffsetY`,
      ).toBe("number");
      expect(typeof profile.shadowOffsetY, `${fighterId} is missing shadowOffsetY`).toBe("number");
      expect(profile.shadowOffsetY, `${fighterId} shadowOffsetY should stay near the feet`).toBeGreaterThanOrEqual(-2);
      expect(profile.shadowOffsetY, `${fighterId} shadowOffsetY should stay near the feet`).toBeLessThanOrEqual(6);
      expect(profile.stateOffsetByState.IDLE, `${fighterId} is missing stateOffsetByState`).toBeDefined();
      expect(profile.frameOffsetByClip, `${fighterId} is missing frameOffsetByClip`).toBeDefined();
    }
  });
});
