import { describe, expect, it } from "vitest";
import { fighterVisualProfiles } from "./fighterVisualProfiles";
import {
  ANIMATION_CLIP_IDS,
  ANIMATION_OWNERS,
  FIGHTER_STATES,
  getFighterSpriteSpec,
  type AnimationClipId,
} from "./fighterSpriteSpecs";
import { getSpriteSpec, resolveScaleReference } from "./scaleSystem";

describe("fighter visual profiles", () => {
  it("stay aligned with fighter sprite specs and scale system", () => {
    expect(Object.keys(fighterVisualProfiles).sort()).toEqual([...ANIMATION_OWNERS].sort());

    for (const fighterId of ANIMATION_OWNERS) {
      const profile = fighterVisualProfiles[fighterId];
      const spriteSpec = getFighterSpriteSpec(fighterId);
      expect(
        typeof profile.spriteAnchorOffsetY,
        `${fighterId} is missing spriteAnchorOffsetY`,
      ).toBe("number");
      expect(profile.spriteAnchorOffsetY, `${fighterId} anchor mismatch`).toBe(spriteSpec.anchorOffsetY);
      expect(profile.spritePivot, `${fighterId} pivot mismatch`).toEqual(spriteSpec.pivot);
      expect(typeof profile.shadowOffsetY, `${fighterId} is missing shadowOffsetY`).toBe("number");
      expect(profile.shadowOffsetY, `${fighterId} shadowOffsetY should stay near the feet`).toBeGreaterThanOrEqual(-2);
      expect(profile.shadowOffsetY, `${fighterId} shadowOffsetY should stay near the feet`).toBeLessThanOrEqual(6);
      expect(getSpriteSpec(profile.spriteSpecId).id, `${fighterId} has invalid spriteSpecId`).toBe(profile.spriteSpecId);
      expect(
        profile.scale,
        `${fighterId} scale should come from the central scale resolver`,
      ).toBe(
        resolveScaleReference({
          scaleTier: profile.scaleTier,
          spriteSpecId: profile.spriteSpecId,
        }),
      );
      for (const state of FIGHTER_STATES) {
        expect(profile.stateOffsetByState[state], `${fighterId} missing state offset ${state}`).toEqual(
          spriteSpec.baseStateOffsetByState[state],
        );
      }
      expect(profile.frameOffsetByClip, `${fighterId} is missing frameOffsetByClip`).toBeDefined();

      for (const clipId of ANIMATION_CLIP_IDS) {
        const frameOffsets = profile.frameOffsetByClip[clipId];
        if (!frameOffsets || frameOffsets.length === 0) {
          continue;
        }
        expect(frameOffsets.length, `${fighterId} ${clipId} frame offsets length mismatch`).toBe(
          spriteSpec.requiredClips[clipId].frameCount,
        );
      }

      const scaledClipIds = Object.keys(profile.clipScaleByClip ?? {}) as AnimationClipId[];
      for (const clipId of scaledClipIds) {
        expect(ANIMATION_CLIP_IDS.includes(clipId), `${fighterId} has invalid clipScale key ${clipId}`).toBe(true);
      }
    }
  });
});
