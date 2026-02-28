import type { EnemyArchetype } from "../../entities/EnemyBasic";

export interface StageSpawnPointConfig {
  x: number;
  y: number;
  archetype?: EnemyArchetype;
}

export interface StageSpawnZoneConfig {
  id: string;
  triggerX: number;
  lockType: "full_lock" | "partial_lock" | "soft_lock";
  leftBarrierX: number;
  rightBarrierX: number;
  barrier?: {
    topGap?: number;
    bottomGap?: number;
    openRailIds?: string[];
  };
  spawns: StageSpawnPointConfig[];
}

export function cloneSpawnZones(config: StageSpawnZoneConfig[]): StageSpawnZoneConfig[] {
  return config.map((zone) => ({
    id: zone.id,
    triggerX: zone.triggerX,
    lockType: zone.lockType,
    leftBarrierX: zone.leftBarrierX,
    rightBarrierX: zone.rightBarrierX,
    barrier: zone.barrier
      ? {
          topGap: zone.barrier.topGap,
          bottomGap: zone.barrier.bottomGap,
          openRailIds: zone.barrier.openRailIds ? [...zone.barrier.openRailIds] : undefined,
        }
      : undefined,
    spawns: zone.spawns.map((spawn) => ({
      x: spawn.x,
      y: spawn.y,
      archetype: spawn.archetype,
    })),
  }));
}
