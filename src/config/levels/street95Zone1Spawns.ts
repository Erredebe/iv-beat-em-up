import type { EnemyArchetype } from "../../entities/EnemyBasic";

export interface StageSpawnPointConfig {
  x: number;
  y: number;
  archetype?: EnemyArchetype;
}

export interface StageSpawnZoneConfig {
  id: string;
  triggerX: number;
  leftBarrierX: number;
  rightBarrierX: number;
  spawns: StageSpawnPointConfig[];
}

export function cloneSpawnZones(config: StageSpawnZoneConfig[]): StageSpawnZoneConfig[] {
  return config.map((zone) => ({
    id: zone.id,
    triggerX: zone.triggerX,
    leftBarrierX: zone.leftBarrierX,
    rightBarrierX: zone.rightBarrierX,
    spawns: zone.spawns.map((spawn) => ({
      x: spawn.x,
      y: spawn.y,
      archetype: spawn.archetype,
    })),
  }));
}

export const street95Zone1Spawns: StageSpawnZoneConfig[] = [
  {
    id: "zone_1",
    triggerX: 300,
    leftBarrierX: 60,
    rightBarrierX: 860,
    spawns: [
      { x: 600, y: 204, archetype: "brawler" },
      { x: 760, y: 188, archetype: "rusher" },
    ],
  },
  {
    id: "zone_2",
    triggerX: 1080,
    leftBarrierX: 1040,
    rightBarrierX: 1680,
    spawns: [
      { x: 1380, y: 204, archetype: "brawler" },
      { x: 1500, y: 212, archetype: "tank" },
      { x: 1600, y: 192, archetype: "rusher" },
    ],
  },
];
