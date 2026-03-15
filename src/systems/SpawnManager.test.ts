import { describe, expect, it } from "vitest";
import { SpawnManager } from "./SpawnManager";
import type { StageSpawnZoneConfig } from "../config/levels/stageSpawnTypes";

function createCollisionStub() {
  return {
    getWalkRails: () => [{ id: "rail_main", xStart: 0, xEnd: 1000, topY: 180, bottomY: 220, preferredY: 200 }],
    registerGroundObstacle: ({ id }: { id: string }) => ({ id, bodies: [], shapes: [], enabled: false }),
    setObstacleEnabled: () => undefined,
  };
}

function createEnemyFactory() {
  return (spawn: { x: number; y: number; archetype?: string }) => ({
    id: `${spawn.x}_${spawn.y}_${spawn.archetype ?? "brawler"}`,
    isAlive: () => true,
  }) as never;
}

describe("SpawnManager", () => {
  it("deploys staggered reinforcements over time", () => {
    const zoneConfig: StageSpawnZoneConfig[] = [{
      id: "zone_staggered",
      triggerX: 100,
      lockType: "full_lock",
      leftBarrierX: 80,
      rightBarrierX: 200,
      reinforcementPolicy: "staggered",
      spawns: [
        { x: 120, y: 200 },
        { x: 130, y: 200 },
        { x: 140, y: 200 },
      ],
    }];

    const manager = new SpawnManager(createCollisionStub() as never, createEnemyFactory(), zoneConfig);
    const firstWave = manager.startWave("zone_staggered", 0);

    expect(firstWave).toHaveLength(2);
    expect(manager.getRemainingEnemies()).toBe(2);
    expect(manager.update(100, 1000)).toHaveLength(0);

    (firstWave[0] as { isAlive: () => boolean }).isAlive = () => false;
    (firstWave[1] as { isAlive: () => boolean }).isAlive = () => false;
    const reinforcementWave = manager.update(100, 1500);

    expect(reinforcementWave).toHaveLength(1);
    expect(manager.getActiveZoneId()).toBe("zone_staggered");
  });

  it("holds burst reinforcements for a follow-up wave", () => {
    const zoneConfig: StageSpawnZoneConfig[] = [{
      id: "zone_burst",
      triggerX: 100,
      lockType: "full_lock",
      leftBarrierX: 80,
      rightBarrierX: 200,
      reinforcementPolicy: "burst",
      spawns: [
        { x: 120, y: 200 },
        { x: 130, y: 200 },
        { x: 140, y: 200 },
      ],
    }];

    const manager = new SpawnManager(createCollisionStub() as never, createEnemyFactory(), zoneConfig);
    const firstWave = manager.startWave("zone_burst", 0);

    expect(firstWave).toHaveLength(2);
    expect(manager.update(100, 500)).toHaveLength(0);

    (firstWave[0] as { isAlive: () => boolean }).isAlive = () => false;
    const stillWaiting = manager.update(100, 700);
    expect(stillWaiting).toHaveLength(1);

    (firstWave[1] as { isAlive: () => boolean }).isAlive = () => false;
    const secondWave = manager.update(100, 800);
    expect(secondWave).toHaveLength(0);
  });
});
