import { describe, expect, it } from "vitest";
import { street95Zone1Layout } from "./street95Zone1";

describe("stage layout calibration", () => {
  it("keeps walk lane and layer depth ordering coherent", () => {
    const lane = street95Zone1Layout.walkLane;
    expect(lane).toBeDefined();
    if (!lane) {
      return;
    }

    const mapHeightPx = street95Zone1Layout.mapHeightTiles * street95Zone1Layout.tileSize;
    expect(lane.topY).toBeGreaterThanOrEqual(0);
    expect(lane.bottomY).toBeLessThanOrEqual(mapHeightPx);
    expect(lane.topY).toBeLessThan(lane.bottomY);
    expect(lane.playerSpawnY).toBeGreaterThanOrEqual(lane.topY);
    expect(lane.playerSpawnY).toBeLessThanOrEqual(lane.bottomY);

    const foreground = street95Zone1Layout.layers.find((layer) => layer.id === "foreground_deco");
    expect(foreground).toBeDefined();
    expect(foreground!.depth).toBeGreaterThan(lane.bottomY);

    const backLayers = ["facade", "sidewalk", "road"] as const;
    for (const id of backLayers) {
      const layer = street95Zone1Layout.layers.find((candidate) => candidate.id === id);
      expect(layer).toBeDefined();
      expect(layer!.depth).toBeLessThan(lane.topY);
    }
  });
});
