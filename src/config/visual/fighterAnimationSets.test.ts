import { describe, expect, it } from "vitest";
import { getFighterAnimationSet, type AnimationClipId, type AnimationOwner } from "./fighterAnimationSets";

const REQUIRED_CLIPS: AnimationClipId[] = [
  "idle",
  "walk",
  "attack1",
  "attack2",
  "attack3",
  "airAttack",
  "special",
  "hurt",
  "knockdown",
  "getup",
];

describe("fighter animation sets", () => {
  it("defines all required clips with 10+ frames in arcade set", () => {
    for (const fighterId of ["kastro", "marina", "meneillos", "enemy"] as AnimationOwner[]) {
      const set = getFighterAnimationSet(fighterId);
      for (const clipId of REQUIRED_CLIPS) {
        const clip = set.clips[clipId];
        expect(clip, `${fighterId} missing clip ${clipId}`).toBeDefined();
        expect(clip.frameCount, `${fighterId} ${clipId} must be fluid`).toBeGreaterThanOrEqual(10);
      }
    }
  });
});
