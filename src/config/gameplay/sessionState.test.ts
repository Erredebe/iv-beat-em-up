import { describe, expect, it } from "vitest";
import { normalizeSelectedCharacter } from "./sessionState";

describe("session state character migration", () => {
  it("accepts current character ids", () => {
    expect(normalizeSelectedCharacter("kastro")).toBe("kastro");
    expect(normalizeSelectedCharacter("marina")).toBe("marina");
    expect(normalizeSelectedCharacter("meneillos")).toBe("meneillos");
  });

  it("maps legacy ids to current ids", () => {
    expect(normalizeSelectedCharacter("boxeador")).toBe("kastro");
    expect(normalizeSelectedCharacter("veloz")).toBe("marina");
    expect(normalizeSelectedCharacter("tecnico")).toBe("meneillos");
  });

  it("falls back safely for unknown values", () => {
    expect(normalizeSelectedCharacter("unknown")).toBe("kastro");
    expect(normalizeSelectedCharacter(null)).toBe("kastro");
  });
});
