import { describe, expect, it } from "vitest";
import { derivedTextureCrops } from "../assets/derivedTextureCrops";
import { street95Zone1Layout } from "./street95Zone1";

function getPropSourceSize(textureKey: string): { width: number; height: number } {
  const crop = derivedTextureCrops.find((entry) => entry.targetKey === textureKey);
  if (!crop) {
    throw new Error(`Missing crop entry for textureKey: ${textureKey}`);
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
      expect(layer!.depth).toBeLessThan(lane.bottomY + 4);
    }
  });

  it("keeps prop footprints centered and inside the lower 25% of each prop", () => {
    for (const prop of street95Zone1Layout.props) {
      const footprint = street95Zone1Layout.collisionFootprints.find((entry) => entry.id === `${prop.id}_feet`);
      if (!footprint) {
        // not every decorative prop needs collider
        continue;
      }

      const sourceSize = getPropSourceSize(prop.textureKey);
      const renderedWidth = sourceSize.width * prop.scale;
      const renderedHeight = sourceSize.height * prop.scale;
      const lowerBandTopY = prop.y - renderedHeight * 0.25;

      const footprintTop = footprint.y - footprint.height * 0.5;
      expect(footprintTop, `${footprint.id} must stay in the lower 25% of the prop`).toBeGreaterThanOrEqual(
        lowerBandTopY,
      );
      expect(footprint.y, `${footprint.id} should be anchored around the prop baseline`).toBeLessThanOrEqual(prop.y + 3);

      const centerTolerance = Math.max(2, renderedWidth * 0.12);
      expect(Math.abs(footprint.x - prop.x), `${footprint.id} should stay centered on prop base`).toBeLessThanOrEqual(
        centerTolerance,
      );

      expect(footprint.width, `${footprint.id} should cover a meaningful base width`).toBeGreaterThanOrEqual(
        renderedWidth * 0.35,
      );
      expect(footprint.width, `${footprint.id} should not exceed the rendered base width`).toBeLessThanOrEqual(
        renderedWidth,
      );
    }
  });
});
