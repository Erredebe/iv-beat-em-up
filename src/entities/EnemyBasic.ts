import type { AttackFrameData, AttackId } from "../types/combat";
import { BaseFighter } from "./BaseFighter";

export class EnemyBasic extends BaseFighter {
  private nextAttackAt = 0;

  canAttack(nowMs: number): boolean {
    return nowMs >= this.nextAttackAt && this.canAcceptCommands();
  }

  markAttackUsed(nowMs: number, cooldownMs: number): void {
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

