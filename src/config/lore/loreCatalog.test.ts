import { describe, expect, it } from "vitest";
import { stageCatalog } from "../levels/stageCatalog";
import { districtCatalog } from "./districts";
import { factionCatalog } from "./factions";
import { storyBeatCatalog } from "./storyBeats";

describe("lore catalog integrity", () => {
  it("keeps district references valid from stage catalog", () => {
    for (const stage of Object.values(stageCatalog)) {
      expect(districtCatalog[stage.districtId], `${stage.id} points to unknown district`).toBeDefined();
      expect(stage.storyBeatIds.length, `${stage.id} should expose at least one story beat`).toBeGreaterThan(0);
      for (const beatId of stage.storyBeatIds) {
        const beat = storyBeatCatalog[beatId];
        expect(beat, `${stage.id} beat ${beatId} missing`).toBeDefined();
        expect(beat.stageId, `${stage.id} beat ${beatId} stage mismatch`).toBe(stage.id);
        expect(beat.districtId, `${stage.id} beat ${beatId} district mismatch`).toBe(stage.districtId);
      }
    }
  });

  it("keeps district default factions resolvable", () => {
    for (const district of Object.values(districtCatalog)) {
      expect(
        factionCatalog[district.defaultControllingFaction],
        `${district.id} points to unknown faction ${district.defaultControllingFaction}`,
      ).toBeDefined();
    }
  });
});
