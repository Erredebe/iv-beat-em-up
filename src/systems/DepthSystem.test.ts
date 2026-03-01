import { describe, expect, it } from "vitest";
import { depthPriorities, resolveBreakableDynamicY, resolveStagePropDynamicY } from "../config/visual/depthLayers";
import { DepthSystem } from "./DepthSystem";

type DepthObject = Phaser.GameObjects.GameObject & { y: number; depth: number };

function makeDepthObject(y: number): DepthObject {
  return { y, depth: 0 } as DepthObject;
}

describe("DepthSystem", () => {
  it("keeps fighter shadow/outline/sprite ordering stable at the same y", () => {
    const system = new DepthSystem();
    const shadow = makeDepthObject(208);
    const outline = makeDepthObject(208);
    const fighter = makeDepthObject(208);

    system.register(shadow, {
      layer: "FIGHTER_SHADOW",
      dynamicY: () => shadow.y,
      priority: depthPriorities.FIGHTER_SHADOW,
    });
    system.register(outline, {
      layer: "FIGHTER_OUTLINE",
      dynamicY: () => outline.y,
      priority: depthPriorities.FIGHTER_OUTLINE,
    });
    system.register(fighter, {
      layer: "FIGHTER",
      dynamicY: () => fighter.y,
      priority: depthPriorities.FIGHTER,
    });

    system.update();

    expect(shadow.depth).toBeLessThan(outline.depth);
    expect(outline.depth).toBeLessThan(fighter.depth);
    expect(system.getResolvedDepth(fighter)).toBeCloseTo(fighter.depth, 6);
  });

  it("applies depthAnchorY + depthOffset rules for stage props in a deterministic way", () => {
    const system = new DepthSystem();
    const fighter = makeDepthObject(228);
    const anchoredProp = makeDepthObject(220);
    const freeProp = makeDepthObject(220);

    system.register(fighter, {
      layer: "FIGHTER",
      dynamicY: () => fighter.y,
      priority: depthPriorities.FIGHTER,
    });
    system.register(anchoredProp, {
      layer: "STAGE_PROP",
      dynamicY: () => resolveStagePropDynamicY(anchoredProp.y, 236, 0),
      priority: depthPriorities.STAGE_PROP,
    });
    system.register(freeProp, {
      layer: "STAGE_PROP",
      dynamicY: () => resolveStagePropDynamicY(freeProp.y, undefined, 2),
      priority: depthPriorities.STAGE_PROP,
    });

    system.update();

    expect(anchoredProp.depth).toBeGreaterThan(fighter.depth);
    expect(freeProp.depth).toBeLessThan(fighter.depth);
  });

  it("keeps breakables deterministic against fighters around y ties", () => {
    const system = new DepthSystem();
    const fighter = makeDepthObject(220);
    const breakable = makeDepthObject(220);

    system.register(fighter, {
      layer: "FIGHTER",
      dynamicY: () => fighter.y,
      priority: depthPriorities.FIGHTER,
    });
    system.register(breakable, {
      layer: "BREAKABLE",
      dynamicY: () => resolveBreakableDynamicY(breakable.y),
      priority: depthPriorities.BREAKABLE,
    });

    system.update();
    expect(fighter.depth).toBeGreaterThan(breakable.depth);

    breakable.y = 226;
    system.update();
    expect(breakable.depth).toBeGreaterThan(fighter.depth);
  });
});
