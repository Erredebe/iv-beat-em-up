import type Phaser from "phaser";
import type { AttackFrameData, AttackId } from "../types/combat";
import { BaseFighter } from "./BaseFighter";

export type EnemyArchetype = "brawler" | "rusher" | "tank";

export interface EnemyCombatProfile {
  archetype: EnemyArchetype;
  attackRangeX: number;
  attackRangeY: number;
  attackCooldownMs: number;
  tokenTimeoutMs: number;
}

const ENEMY_PROFILES: Record<EnemyArchetype, EnemyCombatProfile> = {
  brawler: {
    archetype: "brawler",
    attackRangeX: 44,
    attackRangeY: 14,
    attackCooldownMs: 1100,
    tokenTimeoutMs: 900,
  },
  rusher: {
    archetype: "rusher",
    attackRangeX: 52,
    attackRangeY: 16,
    attackCooldownMs: 760,
    tokenTimeoutMs: 700,
  },
  tank: {
    archetype: "tank",
    attackRangeX: 40,
    attackRangeY: 12,
    attackCooldownMs: 1400,
    tokenTimeoutMs: 1100,
  },
};

export class EnemyBasic extends BaseFighter {
  private nextAttackAt = 0;
  readonly combatProfile: EnemyCombatProfile;

  constructor(scene: Phaser.Scene, config: ConstructorParameters<typeof BaseFighter>[1], archetype: EnemyArchetype = "brawler") {
    super(scene, config);
    this.combatProfile = ENEMY_PROFILES[archetype];
  }

  canAttack(nowMs: number): boolean {
    return nowMs >= this.nextAttackAt && this.canAcceptCommands();
  }

  markAttackUsed(nowMs: number, cooldownMs = this.combatProfile.attackCooldownMs): void {
    this.nextAttackAt = nowMs + cooldownMs;
  }
}

export function buildEnemyAttackData(source: Record<AttackId, AttackFrameData>): Record<AttackId, AttackFrameData> {
  return {
    ATTACK_1: source.ATTACK_1,
    ATTACK_2: source.ATTACK_2,
    ATTACK_3: source.ATTACK_3,
    AIR_ATTACK: source.AIR_ATTACK,
    SPECIAL: source.SPECIAL,
    ENEMY_ATTACK: {
      ...source.ATTACK_1,
      totalFrames: 22,
      activeStart: 8,
      activeEnd: 10,
      recoveryStart: 11,
      damage: 11,
      knockbackX: 86,
      causesKnockdown: false,
      hitbox: {
        offsetX: 15,
        offsetY: -30,
        width: 18,
        height: 14,
      },
    },
  };
}
