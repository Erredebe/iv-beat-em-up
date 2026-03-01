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
      const breakableCount = bundle.layout.objects.filter((object) => object.behavior.type === "breakable").length;
      expect(width, `${bundle.id} width must be > viewport`).toBeGreaterThan(426);
      expect(bundle.layout.tileSize, `${bundle.id} must use 32x32 tiles`).toBe(32);
      expect(breakableCount, `${bundle.id} must define breakables`).toBeGreaterThan(0);
    }
  });

  it("keeps spawn volume non-decreasing across campaign order", () => {
    const totalEnemiesByStage = campaignStageOrder.map((stageId) => {
      const totalEnemies = stageCatalog[stageId].spawns.reduce((acc, zone) => acc + zone.spawns.length, 0);
      return { stageId, totalEnemies };
    });

    for (let index = 1; index < totalEnemiesByStage.length; index += 1) {
      const previous = totalEnemiesByStage[index - 1];
      const current = totalEnemiesByStage[index];
      expect(
        current.totalEnemies,
        `${current.stageId} total enemies (${current.totalEnemies}) must be >= ${previous.stageId} (${previous.totalEnemies})`,
      ).toBeGreaterThanOrEqual(previous.totalEnemies);
    }
  });
});
