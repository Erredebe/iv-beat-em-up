import { describe, expect, it } from "vitest";
import { restoreHpClamped } from "./fighterHealth";

describe("restoreHpClamped", () => {
  it("caps healing at maxHp", () => {
    const result = restoreHpClamped(78, 90, 20);

    expect(result.restored).toBe(12);
    expect(result.hp).toBe(90);
  });
});
