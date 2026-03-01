import { describe, expect, it } from "vitest";
import { resolveBreakablePickupDrop } from "./breakableDropResolver";

describe("resolveBreakablePickupDrop", () => {
  it("does not spawn pickup when dropType is none", () => {
    const result = resolveBreakablePickupDrop(
      {
        id: "crate_a",
        x: 100,
        y: 200,
        dropType: "none",
        dropChance: 1,
      },
      () => 0,
    );

    expect(result).toBeNull();
  });

  it("supports deterministic RNG decisions", () => {
    const withDrop = resolveBreakablePickupDrop(
      {
        id: "crate_b",
        x: 140,
        y: 210,
        dropType: "small_heal",
        dropChance: 0.4,
      },
      () => 0.2,
    );

    const noDrop = resolveBreakablePickupDrop(
      {
        id: "crate_c",
        x: 160,
        y: 220,
        dropType: "medium_heal",
        dropChance: 0.4,
      },
      () => 0.9,
    );

    expect(withDrop).toMatchObject({
      id: "crate_b_pickup",
      dropType: "small_heal",
      healAmount: 28,
    });
    expect(noDrop).toBeNull();
  });
});
