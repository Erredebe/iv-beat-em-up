export type EnemyArchetype = "brawler" | "rusher" | "tank" | "agile_f" | "bat_wielder" | "mini_boss";

export interface EnemyCombatProfile {
  archetype: EnemyArchetype;
  attackRangeX: number;
  attackRangeY: number;
  attackCooldownMs: number;
  tokenTimeoutMs: number;
  damageMultiplier: number;
  moveSpeedMultiplier: number;
  railSwitchAggressiveness: number;
  railSnapTolerance: number;
}

export const ENEMY_PROFILES: Record<EnemyArchetype, EnemyCombatProfile> = {
  brawler: {
    archetype: "brawler",
    attackRangeX: 58,
    attackRangeY: 24,
    attackCooldownMs: 1080,
    tokenTimeoutMs: 900,
    damageMultiplier: 1,
    moveSpeedMultiplier: 1,
    railSwitchAggressiveness: 0.95,
    railSnapTolerance: 7,
  },
  rusher: {
    archetype: "rusher",
    attackRangeX: 64,
    attackRangeY: 28,
    attackCooldownMs: 760,
    tokenTimeoutMs: 700,
    damageMultiplier: 0.82,
    moveSpeedMultiplier: 1.24,
    railSwitchAggressiveness: 1.2,
    railSnapTolerance: 6,
  },
  tank: {
    archetype: "tank",
    attackRangeX: 54,
    attackRangeY: 22,
    attackCooldownMs: 1520,
    tokenTimeoutMs: 1120,
    damageMultiplier: 1.22,
    moveSpeedMultiplier: 0.76,
    railSwitchAggressiveness: 0.82,
    railSnapTolerance: 9,
  },
  agile_f: {
    archetype: "agile_f",
    attackRangeX: 62,
    attackRangeY: 30,
    attackCooldownMs: 860,
    tokenTimeoutMs: 740,
    damageMultiplier: 0.92,
    moveSpeedMultiplier: 1.2,
    railSwitchAggressiveness: 1.28,
    railSnapTolerance: 5,
  },
  bat_wielder: {
    archetype: "bat_wielder",
    attackRangeX: 76,
    attackRangeY: 32,
    attackCooldownMs: 1360,
    tokenTimeoutMs: 980,
    damageMultiplier: 1.08,
    moveSpeedMultiplier: 0.94,
    railSwitchAggressiveness: 0.92,
    railSnapTolerance: 8,
  },
  mini_boss: {
    archetype: "mini_boss",
    attackRangeX: 84,
    attackRangeY: 34,
    attackCooldownMs: 1700,
    tokenTimeoutMs: 1240,
    damageMultiplier: 1.38,
    moveSpeedMultiplier: 0.86,
    railSwitchAggressiveness: 0.78,
    railSnapTolerance: 10,
  },
};
