import type { EnemyArchetype } from "../../entities/EnemyBasic";

export type CombatBalancePresetId = "normal";

interface EnemySpawnBalanceConfig {
  maxHpBonus: number;
  moveSpeedMultiplier: number;
}

export interface CombatBalancePreset {
  id: CombatBalancePresetId;
  enemySpawnByArchetype: Record<EnemyArchetype, EnemySpawnBalanceConfig>;
}

const COMBAT_BALANCE_PRESETS: Record<CombatBalancePresetId, CombatBalancePreset> = {
  normal: {
    id: "normal",
    enemySpawnByArchetype: {
      brawler: { maxHpBonus: 0, moveSpeedMultiplier: 1 },
      rusher: { maxHpBonus: -10, moveSpeedMultiplier: 1.24 },
      agile_f: { maxHpBonus: -4, moveSpeedMultiplier: 1.18 },
      bat_wielder: { maxHpBonus: 14, moveSpeedMultiplier: 0.96 },
      tank: { maxHpBonus: 26, moveSpeedMultiplier: 0.74 },
      mini_boss: { maxHpBonus: 70, moveSpeedMultiplier: 0.88 },
    },
  },
};

export function getCombatBalancePreset(presetId: CombatBalancePresetId = "normal"): CombatBalancePreset {
  return COMBAT_BALANCE_PRESETS[presetId];
}

