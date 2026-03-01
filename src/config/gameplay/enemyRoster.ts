export type EnemyArchetype = "brawler" | "rusher" | "tank" | "agile_f" | "bat_wielder" | "mini_boss" | "knife_fighter";
export type EnemyRole = "bruiser" | "striker" | "controller" | "boss";

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
  role: EnemyRole;
  pressureBias: number;
  flankBias: number;
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
    role: "bruiser",
    pressureBias: 0.8,
    flankBias: 0.45,
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
    role: "striker",
    pressureBias: 0.6,
    flankBias: 0.78,
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
    role: "controller",
    pressureBias: 1.2,
    flankBias: 0.3,
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
    role: "striker",
    pressureBias: 0.58,
    flankBias: 0.84,
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
    role: "controller",
    pressureBias: 0.95,
    flankBias: 0.48,
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
    role: "boss",
    pressureBias: 1.55,
    flankBias: 0.15,
  },
  knife_fighter: {
    archetype: "knife_fighter",
    attackRangeX: 70,
    attackRangeY: 26,
    attackCooldownMs: 900,
    tokenTimeoutMs: 800,
    damageMultiplier: 0.88,
    moveSpeedMultiplier: 1.4,
    railSwitchAggressiveness: 1.3,
    railSnapTolerance: 6,
    role: "striker",
    pressureBias: 0.55,
    flankBias: 0.9,
  },
};
