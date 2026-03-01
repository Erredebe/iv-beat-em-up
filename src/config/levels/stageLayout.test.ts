import { describe, expect, it } from "vitest";
import { derivedTextureCrops } from "../assets/derivedTextureCrops";
import { resolveScaleReference } from "../visual/scaleSystem";
import { stageCatalog } from "./stageCatalog";
import { getStageWalkRails, type StageLayoutConfig } from "./stageTypes";

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
      const rails = getStageWalkRails(layout);
      expect(rails.length, `${bundle.id} rails missing`).toBeGreaterThan(0);

      const mapHeightPx = layout.mapHeightTiles * layout.tileSize;
      let laneBottom = Number.NEGATIVE_INFINITY;
      for (const rail of rails) {
        expect(rail.xStart, `${bundle.id}:${rail.id} xStart > xEnd`).toBeLessThan(rail.xEnd);
        expect(rail.topY, `${bundle.id}:${rail.id} top out of bounds`).toBeGreaterThanOrEqual(0);
        expect(rail.bottomY, `${bundle.id}:${rail.id} bottom out of bounds`).toBeLessThanOrEqual(mapHeightPx);
        expect(rail.topY, `${bundle.id}:${rail.id} top >= bottom`).toBeLessThan(rail.bottomY);
        const preferred = rail.preferredY ?? (rail.topY + rail.bottomY) * 0.5;
        expect(preferred, `${bundle.id}:${rail.id} preferred above rail`).toBeGreaterThanOrEqual(rail.topY);
        expect(preferred, `${bundle.id}:${rail.id} preferred below rail`).toBeLessThanOrEqual(rail.bottomY);
        laneBottom = Math.max(laneBottom, rail.bottomY);
      }

      const foreground = layout.layers.find((layer) => layer.id === "foreground_deco");
      expect(foreground, `${bundle.id} missing foreground layer`).toBeDefined();
      expect(foreground!.depth, `${bundle.id} foreground depth below lane`).toBeGreaterThan(laneBottom);

      const backLayers = ["facade", "sidewalk", "road"] as const;
      for (const id of backLayers) {
        const layer = layout.layers.find((candidate) => candidate.id === id);
        expect(layer, `${bundle.id} missing ${id}`).toBeDefined();
        expect(layer!.depth, `${bundle.id} ${id} depth too high`).toBeLessThan(laneBottom + 4);
      }
    }
  });

  it("keeps prop footprints centered and inside the lower 25% of each prop", () => {
    for (const bundle of Object.values(stageCatalog)) {
      validatePropFootprints(bundle.layout);
    }
  });

  it("keeps visual profiles calibrated for readability", () => {
    for (const bundle of Object.values(stageCatalog)) {
      const profile = bundle.layout.visualProfile;
      expect(profile.baseGradient.topColor, `${bundle.id} gradient top missing`).toBeGreaterThan(0);
      expect(profile.baseGradient.bottomColor, `${bundle.id} gradient bottom missing`).toBeGreaterThan(0);
      expect(profile.colorGrade.alpha, `${bundle.id} color grade too weak`).toBeGreaterThanOrEqual(0.03);
      expect(profile.colorGrade.alpha, `${bundle.id} color grade too strong`).toBeLessThanOrEqual(0.13);
      expect(profile.rainIntensity, `${bundle.id} rain intensity out of range`).toBeGreaterThanOrEqual(0);
      expect(profile.rainIntensity, `${bundle.id} rain intensity out of range`).toBeLessThanOrEqual(1);
      expect(profile.neonIntensity, `${bundle.id} neon intensity out of range`).toBeGreaterThanOrEqual(0.55);
      expect(profile.neonIntensity, `${bundle.id} neon intensity out of range`).toBeLessThanOrEqual(1);
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
    const scale = resolveScaleReference({ scaleTier: prop.scaleTier, spriteSpecId: prop.spriteSpecId });
    const renderedWidth = sourceSize.width * scale;
    const renderedHeight = sourceSize.height * scale;
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
