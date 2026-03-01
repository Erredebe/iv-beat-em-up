import { describe, expect, it } from "vitest";
import { ENEMY_PROFILES } from "./enemyRoster";

describe("enemy roster", () => {
  it("defines 7 enemy classes", () => {
    expect(Object.keys(ENEMY_PROFILES)).toEqual([
      "brawler",
      "rusher",
      "tank",
      "agile_f",
      "bat_wielder",
      "mini_boss",
      "knife_fighter",
    ]);
  });

  it("keeps combat profile hierarchy", () => {
    expect(ENEMY_PROFILES.mini_boss.damageMultiplier).toBeGreaterThan(ENEMY_PROFILES.brawler.damageMultiplier);
    expect(ENEMY_PROFILES.rusher.moveSpeedMultiplier).toBeGreaterThan(ENEMY_PROFILES.tank.moveSpeedMultiplier);
    expect(ENEMY_PROFILES.bat_wielder.attackRangeX).toBeGreaterThan(ENEMY_PROFILES.brawler.attackRangeX);
    expect(ENEMY_PROFILES.agile_f.attackRangeY).toBeGreaterThan(ENEMY_PROFILES.tank.attackRangeY);
  });

  it("defines rail switching tuning per archetype", () => {
    expect(ENEMY_PROFILES.rusher.railSwitchAggressiveness).toBeGreaterThan(ENEMY_PROFILES.tank.railSwitchAggressiveness);
    expect(ENEMY_PROFILES.mini_boss.railSnapTolerance).toBeGreaterThan(ENEMY_PROFILES.agile_f.railSnapTolerance);
  });
});
