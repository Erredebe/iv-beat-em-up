import { describe, expect, it } from "vitest";
import { stageCatalog } from "./stageCatalog";
import {
  getStageObjects,
  getStageWalkRails,
  isBreakableStageObject,
  resolveStageObjectCollisionFootprint,
  resolveStageObjectHurtboxRect,
  resolveStageObjectRenderMetricsFromTexture,
  type StageLayoutConfig,
} from "./stageTypes";

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

  it("keeps object collision and breakable drop integrity", () => {
    for (const bundle of Object.values(stageCatalog)) {
      validateObjectIntegrity(bundle.layout);
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

function validateObjectIntegrity(layout: StageLayoutConfig): void {
  for (const object of getStageObjects(layout)) {
    const metrics = resolveStageObjectRenderMetricsFromTexture(object);
    expect(metrics.width, `${layout.stageId}:${object.id} render width must be > 0`).toBeGreaterThan(0);
    expect(metrics.height, `${layout.stageId}:${object.id} render height must be > 0`).toBeGreaterThan(0);

    if (object.collision?.blocksMovement) {
      const footprint = resolveStageObjectCollisionFootprint(object, metrics);
      expect(footprint, `${layout.stageId}:${object.id} blocks but has invalid footprint`).not.toBeNull();
      if (footprint) {
        expect(footprint.width, `${layout.stageId}:${object.id} footprint width invalid`).toBeGreaterThan(0);
        expect(footprint.height, `${layout.stageId}:${object.id} footprint height invalid`).toBeGreaterThan(0);

        const spriteTop = object.transform.y - metrics.height * object.transform.originY;
        const footprintTop = footprint.y - footprint.height * 0.5;
        expect(
          footprintTop,
          `${layout.stageId}:${object.id} footprint must stay within rendered sprite vertical range`,
        ).toBeGreaterThanOrEqual(spriteTop);
      }
    }

    if (!isBreakableStageObject(object)) {
      continue;
    }

    expect(object.behavior.maxHp, `${layout.stageId}:${object.id} breakable maxHp must be > 0`).toBeGreaterThan(0);
    expect(object.behavior.points, `${layout.stageId}:${object.id} breakable points must be > 0`).toBeGreaterThan(0);

    const hurtbox = resolveStageObjectHurtboxRect(object, metrics);
    expect(hurtbox, `${layout.stageId}:${object.id} breakable hurtbox missing`).not.toBeNull();
    if (hurtbox) {
      expect(hurtbox.width, `${layout.stageId}:${object.id} hurtbox width invalid`).toBeGreaterThan(0);
      expect(hurtbox.height, `${layout.stageId}:${object.id} hurtbox height invalid`).toBeGreaterThan(0);
    }

    const drop = object.behavior.drop ?? { type: "none" as const };
    if (drop.type === "none") {
      expect(drop.healAmount, `${layout.stageId}:${object.id} drop none should not define heal`).toBeUndefined();
      continue;
    }

    const chance = drop.chance ?? 1;
    expect(chance, `${layout.stageId}:${object.id} drop chance below 0`).toBeGreaterThanOrEqual(0);
    expect(chance, `${layout.stageId}:${object.id} drop chance above 1`).toBeLessThanOrEqual(1);

    const healAmount = drop.healAmount ?? (drop.type === "medium_heal" ? 48 : 28);
    expect(healAmount, `${layout.stageId}:${object.id} breakable heal amount invalid`).toBeGreaterThan(0);
  }
}
