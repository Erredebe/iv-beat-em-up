import { describe, expect, it } from "vitest";
import { playableCharacters, playableRoster } from "./playableRoster";

describe("playable roster", () => {
  it("defines exactly 3 playable archetypes", () => {
    expect(playableCharacters.length).toBe(3);
    expect(Object.keys(playableRoster)).toEqual(["boxeador", "veloz", "tecnico"]);
  });

  it("keeps core stat identity coherent", () => {
    expect(playableRoster.boxeador.maxHp).toBeGreaterThan(playableRoster.veloz.maxHp);
    expect(playableRoster.veloz.moveSpeed).toBeGreaterThan(playableRoster.boxeador.moveSpeed);
    expect(playableRoster.tecnico.comboWindowBonusFrames).toBeGreaterThanOrEqual(2);
  });
});
