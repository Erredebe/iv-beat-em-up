export type EnemyArchetype = "brawler" | "rusher" | "tank" | "agile_f" | "bat_wielder" | "mini_boss";

export interface EnemyCombatProfile {
  archetype: EnemyArchetype;
  attackRangeX: number;
  attackRangeY: number;
  attackCooldownMs: number;
  tokenTimeoutMs: number;
  damageMultiplier: number;
  moveSpeedMultiplier: number;
}

export const ENEMY_PROFILES: Record<EnemyArchetype, EnemyCombatProfile> = {
  brawler: {
    archetype: "brawler",
    attackRangeX: 58,
    attackRangeY: 16,
    attackCooldownMs: 1080,
    tokenTimeoutMs: 900,
    damageMultiplier: 1,
    moveSpeedMultiplier: 1,
  },
  rusher: {
    archetype: "rusher",
    attackRangeX: 64,
    attackRangeY: 18,
    attackCooldownMs: 760,
    tokenTimeoutMs: 700,
    damageMultiplier: 0.82,
    moveSpeedMultiplier: 1.24,
  },
  tank: {
    archetype: "tank",
    attackRangeX: 54,
    attackRangeY: 16,
    attackCooldownMs: 1380,
    tokenTimeoutMs: 1120,
    damageMultiplier: 1.36,
    moveSpeedMultiplier: 0.76,
  },
  agile_f: {
    archetype: "agile_f",
    attackRangeX: 62,
    attackRangeY: 18,
    attackCooldownMs: 860,
    tokenTimeoutMs: 740,
    damageMultiplier: 0.92,
    moveSpeedMultiplier: 1.2,
  },
  bat_wielder: {
    archetype: "bat_wielder",
    attackRangeX: 76,
    attackRangeY: 18,
    attackCooldownMs: 1260,
    tokenTimeoutMs: 980,
    damageMultiplier: 1.2,
    moveSpeedMultiplier: 0.94,
  },
  mini_boss: {
    archetype: "mini_boss",
    attackRangeX: 84,
    attackRangeY: 22,
    attackCooldownMs: 1540,
    tokenTimeoutMs: 1240,
    damageMultiplier: 1.62,
    moveSpeedMultiplier: 0.86,
  },
};
