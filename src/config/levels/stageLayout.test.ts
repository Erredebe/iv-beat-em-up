import { describe, expect, it } from "vitest";
import { derivedTextureCrops } from "../assets/derivedTextureCrops";
import { stageCatalog } from "./stageCatalog";
import type { StageLayoutConfig } from "./stageTypes";

function getPropSourceSize(textureKey: string): { width: number; height: number } {
  const crop = derivedTextureCrops.find((entry) => entry.targetKey === textureKey);
  if (!crop) {
    throw new Error(`Missing crop entry for textureKey: ${textureKey}`);
  }
  return { width: crop.width, height: crop.height };
}

describe("stage layout calibration", () => {
  it("keeps walk lane and layer depth ordering coherent", () => {
    for (const bundle of Object.values(stageCatalog)) {
      const layout = bundle.layout;
      const lane = layout.walkLane;
      expect(lane, `${bundle.id} lane missing`).toBeDefined();
      if (!lane) {
        continue;
      }

      const mapHeightPx = layout.mapHeightTiles * layout.tileSize;
      expect(lane.topY, `${bundle.id} lane top out of bounds`).toBeGreaterThanOrEqual(0);
      expect(lane.bottomY, `${bundle.id} lane bottom out of bounds`).toBeLessThanOrEqual(mapHeightPx);
      expect(lane.topY, `${bundle.id} lane top >= bottom`).toBeLessThan(lane.bottomY);
      expect(lane.playerSpawnY, `${bundle.id} player spawn above lane`).toBeGreaterThanOrEqual(lane.topY);
      expect(lane.playerSpawnY, `${bundle.id} player spawn below lane`).toBeLessThanOrEqual(lane.bottomY);

      const foreground = layout.layers.find((layer) => layer.id === "foreground_deco");
      expect(foreground, `${bundle.id} missing foreground layer`).toBeDefined();
      expect(foreground!.depth, `${bundle.id} foreground depth below lane`).toBeGreaterThan(lane.bottomY);

      const backLayers = ["facade", "sidewalk", "road"] as const;
      for (const id of backLayers) {
        const layer = layout.layers.find((candidate) => candidate.id === id);
        expect(layer, `${bundle.id} missing ${id}`).toBeDefined();
        expect(layer!.depth, `${bundle.id} ${id} depth too high`).toBeLessThan(lane.bottomY + 4);
      }
    }
  });

  it("keeps prop footprints centered and inside the lower 25% of each prop", () => {
    for (const bundle of Object.values(stageCatalog)) {
      validatePropFootprints(bundle.layout);
    }
  });
});

function validatePropFootprints(layout: StageLayoutConfig): void {
  for (const prop of layout.props) {
    const footprint = layout.collisionFootprints.find((entry) => entry.id === `${prop.id}_feet`);
    if (!footprint) {
      // not every decorative prop needs collider
      continue;
    }

    const sourceSize = getPropSourceSize(prop.textureKey);
    const renderedWidth = sourceSize.width * prop.scale;
    const renderedHeight = sourceSize.height * prop.scale;
    const lowerBandTopY = prop.y - renderedHeight * 0.25;

    const footprintTop = footprint.y - footprint.height * 0.5;
    expect(footprintTop, `${layout.stageId}:${footprint.id} must stay in lower 25%`).toBeGreaterThanOrEqual(
      lowerBandTopY,
    );
    expect(footprint.y, `${layout.stageId}:${footprint.id} should anchor around baseline`).toBeLessThanOrEqual(prop.y + 3);

    const centerTolerance = Math.max(2, renderedWidth * 0.12);
    expect(Math.abs(footprint.x - prop.x), `${layout.stageId}:${footprint.id} should stay centered`).toBeLessThanOrEqual(
      centerTolerance,
    );

    expect(footprint.width, `${layout.stageId}:${footprint.id} base width too small`).toBeGreaterThanOrEqual(
      renderedWidth * 0.35,
    );
    expect(footprint.width, `${layout.stageId}:${footprint.id} base width too large`).toBeLessThanOrEqual(
      renderedWidth,
    );
  }
}
