import type { StageBreakableDropType } from "../config/levels/stageTypes";

export interface BreakablePickupSpawn {
  id: string;
  x: number;
  y: number;
  dropType: "small_heal" | "medium_heal";
  healAmount: number;
}

export interface BreakablePickupDropConfig {
  id: string;
  x: number;
  y: number;
  dropType?: StageBreakableDropType;
  dropChance?: number;
  healAmount?: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getDefaultHealAmount(dropType: "small_heal" | "medium_heal"): number {
  return dropType === "medium_heal" ? 48 : 28;
}

export function resolveBreakablePickupDrop(
  config: BreakablePickupDropConfig,
  randomFn: () => number,
): BreakablePickupSpawn | null {
  if (!config.dropType || config.dropType === "none") {
    return null;
  }

  const dropChance = clamp01(config.dropChance ?? 1);
  if (randomFn() > dropChance) {
    return null;
  }

  const healAmount = Math.max(1, Math.round(config.healAmount ?? getDefaultHealAmount(config.dropType)));
  return {
    id: `${config.id}_pickup`,
    x: config.x,
    y: config.y,
    dropType: config.dropType,
    healAmount,
  };
}
