import { describe, expect, it } from "vitest";
import { playableCharacters, playableRoster } from "./playableRoster";

describe("playable roster", () => {
  it("defines exactly 3 playable archetypes", () => {
    expect(playableCharacters.length).toBe(3);
    expect(Object.keys(playableRoster)).toEqual(["kastro", "marina", "meneillos"]);
  });

  it("keeps core stat identity coherent", () => {
    expect(playableRoster.kastro.maxHp).toBeGreaterThan(playableRoster.marina.maxHp);
    expect(playableRoster.marina.moveSpeed).toBeGreaterThan(playableRoster.kastro.moveSpeed);
    expect(playableRoster.meneillos.comboWindowBonusFrames).toBeGreaterThanOrEqual(4);
    expect(playableRoster.kastro.animationOwner).not.toBe(playableRoster.marina.animationOwner);
    expect(playableRoster.kastro.specialProfileId).not.toBe(playableRoster.marina.specialProfileId);
    expect(playableRoster.marina.specialSfxKey).not.toBe(playableRoster.meneillos.specialSfxKey);
  });
});
