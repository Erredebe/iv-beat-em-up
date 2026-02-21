import { describe, expect, it } from "vitest";
import { derivedTextureCrops } from "../assets/derivedTextureCrops";
import { street95Zone1Layout } from "./street95Zone1";

const propToCropKey: Record<string, string> = {
  booth: "prop_booth",
  crate: "prop_crate",
  car: "prop_car",
};

function getPropSourceSize(propId: string): { width: number; height: number } {
  const targetKey = propToCropKey[propId];
  if (!targetKey) {
    throw new Error(`Unknown prop id: ${propId}`);
  }
  const crop = derivedTextureCrops.find((entry) => entry.targetKey === targetKey);
  if (!crop) {
    throw new Error(`Missing crop entry for prop id: ${propId}`);
  }
  return { width: crop.width, height: crop.height };
}

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

  it("keeps prop footprints centered and inside the lower 20% of each prop", () => {
    for (const prop of street95Zone1Layout.props) {
      const footprint = street95Zone1Layout.collisionFootprints.find((entry) => entry.id === `${prop.id}_feet`);
      expect(footprint, `Missing footprint for prop ${prop.id}`).toBeDefined();
      if (!footprint) {
        continue;
      }

      const sourceSize = getPropSourceSize(prop.id);
      const renderedWidth = sourceSize.width * prop.scale;
      const renderedHeight = sourceSize.height * prop.scale;
      const lowerBandTopY = prop.y - renderedHeight * 0.2;

      const footprintTop = footprint.y - footprint.height * 0.5;
      expect(footprintTop, `${footprint.id} must stay in the lower 20% of the prop`).toBeGreaterThanOrEqual(
        lowerBandTopY,
      );
      expect(footprint.y, `${footprint.id} should be anchored around the prop baseline`).toBeLessThanOrEqual(prop.y + 2);

      const centerTolerance = Math.max(1, renderedWidth * 0.08);
      expect(Math.abs(footprint.x - prop.x), `${footprint.id} should stay centered on prop base`).toBeLessThanOrEqual(
        centerTolerance,
      );

      expect(footprint.width, `${footprint.id} should cover a meaningful base width`).toBeGreaterThanOrEqual(
        renderedWidth * 0.4,
      );
      expect(footprint.width, `${footprint.id} should not exceed the rendered base width`).toBeLessThanOrEqual(
        renderedWidth,
      );
    }
  });
});
