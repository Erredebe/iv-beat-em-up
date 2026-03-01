import { describe, expect, it } from "vitest";
import { stageCatalog } from "../levels/stageCatalog";
import type { AnimationOwner } from "./fighterAnimationSets";
import { fighterVisualProfiles } from "./fighterVisualProfiles";
import { getSpriteSpec, resolveScaleReference } from "./scaleSystem";

const FIGHTER_IDS: AnimationOwner[] = ["kastro", "marina", "meneillos", "enemy"];

describe("scale system contracts", () => {
  it("keeps every fighter profile bound to a valid sprite spec and expected effective scale", () => {
    for (const fighterId of FIGHTER_IDS) {
      const profile = fighterVisualProfiles[fighterId];
      expect(getSpriteSpec(profile.spriteSpecId).id, `${fighterId} sprite spec is invalid`).toBe(profile.spriteSpecId);

      const effectiveScale = resolveScaleReference({
        scaleTier: profile.scaleTier,
        spriteSpecId: profile.spriteSpecId,
      });

      expect(profile.scale, `${fighterId} profile scale must match resolver`).toBe(effectiveScale);
      expect(effectiveScale, `${fighterId} effective scale drifted from baseline`).toBe(0.5);
    }
  });

  it("keeps stage objects using valid specs with expected effective scales", () => {
    const expectedScaleByTier = {
      tiny: 0.2,
      compact: 0.5,
      standard: 1,
      large: 1.5,
      hero: 2,
    } as const;

    for (const bundle of Object.values(stageCatalog)) {
      for (const object of bundle.layout.objects) {
        const expectedScale = expectedScaleByTier[object.visual.scaleTier];
        expect(
          getSpriteSpec(object.visual.spriteSpecId).id,
          `${bundle.id}:${object.id} sprite spec is invalid`,
        ).toBe(object.visual.spriteSpecId);
        expect(
          resolveScaleReference({
            scaleTier: object.visual.scaleTier,
            spriteSpecId: object.visual.spriteSpecId,
          }),
          `${bundle.id}:${object.id} effective scale drifted`,
        ).toBe(expectedScale);
      }
    }
  });
});
