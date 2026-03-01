import type Phaser from "phaser";
import type { AttackFrameData, AttackId, AttackVisualClipId } from "../types/combat";
import { BaseFighter } from "./BaseFighter";
import {
  ENEMY_PROFILES,
  type EnemyArchetype,
  type EnemyCombatProfile,
} from "../config/gameplay/enemyRoster";

export type { EnemyArchetype, EnemyCombatProfile };
export { ENEMY_PROFILES };

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

export function buildEnemyAttackData(
  source: Record<AttackId, AttackFrameData>,
  archetype: EnemyArchetype,
): Record<AttackId, AttackFrameData> {
  const profile = ENEMY_PROFILES[archetype];
  const enemyVisualClipId: AttackVisualClipId =
    archetype === "mini_boss" ? "attack3" : archetype === "bat_wielder" || archetype === "knife_fighter" ? "attack2" : "attack1";
  const enemyBase = {
    ...source.ATTACK_1,
    totalFrames: archetype === "mini_boss" ? 28 : archetype === "bat_wielder" ? 24 : archetype === "knife_fighter" ? 20 : 22,
    activeStart: archetype === "rusher" || archetype === "agile_f" ? 6 : archetype === "knife_fighter" ? 7 : 8,
    activeEnd: archetype === "mini_boss" ? 13 : archetype === "knife_fighter" ? 11 : 10,
    recoveryStart: archetype === "mini_boss" ? 14 : archetype === "knife_fighter" ? 12 : 11,
    damage: Math.max(6, Math.round(source.ATTACK_1.damage * profile.damageMultiplier)),
    knockbackX: archetype === "mini_boss" ? 130 : archetype === "bat_wielder" ? 108 : archetype === "knife_fighter" ? 98 : 90,
    causesKnockdown: archetype === "mini_boss" || archetype === "bat_wielder",
    visualClipId: enemyVisualClipId,
    hitboxMode: "forward" as const,
    maxHitsPerTarget: 1,
    reHitCooldownFrames: 5,
    hitbox: {
      offsetX: archetype === "mini_boss" ? 26 : archetype === "bat_wielder" ? 24 : archetype === "knife_fighter" ? 20 : 18,
      offsetY: -58,
      width: archetype === "mini_boss" ? 46 : archetype === "bat_wielder" ? 38 : archetype === "knife_fighter" ? 32 : 28,
      height: 26,
    },
  };

  return {
    ATTACK_1: { ...source.ATTACK_1, visualClipId: "attack1", hitboxMode: "forward", maxHitsPerTarget: 1 },
    ATTACK_2: { ...source.ATTACK_2, visualClipId: "attack2", hitboxMode: "forward", maxHitsPerTarget: 1 },
    ATTACK_3: { ...source.ATTACK_3, visualClipId: "attack3", hitboxMode: "forward", maxHitsPerTarget: 1 },
    AIR_ATTACK: { ...source.AIR_ATTACK, visualClipId: "airAttack", hitboxMode: "forward", maxHitsPerTarget: 1 },
    SPECIAL: { ...source.SPECIAL, visualClipId: "special", hitboxMode: "forward", maxHitsPerTarget: 1 },
    ENEMY_ATTACK: enemyBase,
  };
}
