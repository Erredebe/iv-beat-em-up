import { describe, expect, it } from "vitest";
import { SPECIAL_SFX_KEYS, type SpecialSfxKey } from "../config/audio/specialSfx";

describe("audio system special sfx contract", () => {
  it("keeps exactly one special key per protagonist", () => {
    const expected: SpecialSfxKey[] = ["sfx_special_kastro", "sfx_special_marina", "sfx_special_meneillos"];
    expect(SPECIAL_SFX_KEYS).toEqual(expected);
    expect(new Set(SPECIAL_SFX_KEYS).size).toBe(3);
  });
});
