import type { EnemyArchetype } from "../../entities/EnemyBasic";

export interface StageSpawnPointConfig {
  x: number;
  y: number;
  archetype?: EnemyArchetype;
}

export type StageZoneObjectiveType = "clear_all" | "hold_line" | "break_cache";
export type StageZoneReinforcementPolicy = "none" | "staggered" | "burst";

export interface StageZoneObjectiveConfig {
  type: StageZoneObjectiveType;
  holdDurationSec?: number;
  cacheObjectIds?: string[];
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
  objective?: StageZoneObjectiveConfig;
  reinforcementPolicy?: StageZoneReinforcementPolicy;
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
    objective: zone.objective
      ? {
          type: zone.objective.type,
          holdDurationSec: zone.objective.holdDurationSec,
          cacheObjectIds: zone.objective.cacheObjectIds ? [...zone.objective.cacheObjectIds] : undefined,
        }
      : undefined,
    reinforcementPolicy: zone.reinforcementPolicy ?? "none",
    spawns: zone.spawns.map((spawn) => ({
      x: spawn.x,
      y: spawn.y,
      archetype: spawn.archetype,
    })),
  }));
}
