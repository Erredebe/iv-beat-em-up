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
