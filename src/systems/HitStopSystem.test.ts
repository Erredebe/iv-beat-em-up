import { beforeAll, describe, expect, it } from "vitest";

let HitStopSystem: typeof import("./HitStopSystem").HitStopSystem;

beforeAll(async () => {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent: "vitest" },
    configurable: true,
  });
  ({ HitStopSystem } = await import("./HitStopSystem"));
});

describe("HitStopSystem", () => {
  it("tracks active windows using the provided timestamp", () => {
    const scene = {
      time: {
        now: 100,
      },
    };

    const system = new HitStopSystem(scene as never);
    system.trigger(20);

    expect(system.isActiveAt(110)).toBe(true);

    system.update(121);
    expect(system.isActiveAt(121)).toBe(false);
  });
});
