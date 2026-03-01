import { describe, expect, it } from "vitest";
import { getFighterAnimationSet, type AnimationClipId } from "./fighterAnimationSets";
import { ANIMATION_CLIP_IDS, ANIMATION_OWNERS, getFighterSpriteSpec } from "./fighterSpriteSpecs";

describe("fighter animation sets", () => {
  it("stay aligned with fighter sprite specs", () => {
    for (const fighterId of ANIMATION_OWNERS) {
      const set = getFighterAnimationSet(fighterId);
      const spriteSpec = getFighterSpriteSpec(fighterId);
      expect(ANIMATION_CLIP_IDS.includes(set.idleClip), `${fighterId} has invalid idleClip`).toBe(true);

      for (const clipId of ANIMATION_CLIP_IDS) {
        const clip = set.clips[clipId];
        expect(clip, `${fighterId} missing clip ${clipId}`).toBeDefined();
        expect(clip.textureKey, `${fighterId} ${clipId} texture mismatch`).toBe(
          spriteSpec.requiredClips[clipId].textureKey,
        );
        expect(clip.frameCount, `${fighterId} ${clipId} frame count mismatch`).toBe(
          spriteSpec.requiredClips[clipId].frameCount,
        );
      }

      const clipIds = Object.keys(set.clips) as AnimationClipId[];
      expect(clipIds.length, `${fighterId} has unexpected number of clips`).toBe(ANIMATION_CLIP_IDS.length);
      for (const clipId of clipIds) {
        expect(ANIMATION_CLIP_IDS.includes(clipId), `${fighterId} has unknown clip ${clipId}`).toBe(true);
      }
    }
  });
});
