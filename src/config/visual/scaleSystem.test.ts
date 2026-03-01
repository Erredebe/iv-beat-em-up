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

  it("keeps stage props and breakables using valid specs with expected effective scales", () => {
    for (const bundle of Object.values(stageCatalog)) {
      for (const prop of bundle.layout.props) {
        expect(getSpriteSpec(prop.spriteSpecId).id, `${bundle.id}:${prop.id} sprite spec is invalid`).toBe(
          prop.spriteSpecId,
        );
        expect(
          resolveScaleReference({
            scaleTier: prop.scaleTier,
            spriteSpecId: prop.spriteSpecId,
          }),
          `${bundle.id}:${prop.id} effective prop scale drifted`,
        ).toBe(1);
      }

      for (const breakable of bundle.layout.breakableProps) {
        expect(
          getSpriteSpec(breakable.spriteSpecId).id,
          `${bundle.id}:${breakable.id} sprite spec is invalid`,
        ).toBe(breakable.spriteSpecId);
        expect(
          resolveScaleReference({
            scaleTier: breakable.scaleTier,
            spriteSpecId: breakable.spriteSpecId,
          }),
          `${bundle.id}:${breakable.id} effective breakable scale drifted`,
        ).toBe(0.5);
      }
    }
  });
});
