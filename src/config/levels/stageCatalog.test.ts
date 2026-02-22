import { describe, expect, it } from "vitest";
import { campaignStageOrder } from "../gameplay/campaign";
import { stageCatalog } from "./stageCatalog";

describe("stage catalog", () => {
  it("contains all campaign stages in fixed order", () => {
    for (const stageId of campaignStageOrder) {
      expect(stageCatalog[stageId], `Missing stage ${stageId}`).toBeDefined();
    }
  });

  it("keeps every stage world width coherent with camera progression", () => {
    for (const bundle of Object.values(stageCatalog)) {
      const width = bundle.layout.mapWidthTiles * bundle.layout.tileSize;
      expect(width, `${bundle.id} width must be > viewport`).toBeGreaterThan(426);
      expect(bundle.layout.tileSize, `${bundle.id} must use 32x32 tiles`).toBe(32);
      expect(bundle.layout.breakableProps.length, `${bundle.id} must define breakables`).toBeGreaterThan(0);
    }
  });
});
