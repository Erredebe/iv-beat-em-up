import type { EnemyBasic } from "../entities/EnemyBasic";
import type { Player } from "../entities/Player";

const DEFAULT_ATTACK_RANGE_X = 44;
const DEFAULT_ATTACK_RANGE_Y = 14;
const DEFAULT_ATTACK_COOLDOWN_MS = 1150;
const DEFAULT_TOKEN_TIMEOUT_MS = 900;
const DEFAULT_RAIL_SWITCH_AGGRESSIVENESS = 1;
const DEFAULT_RAIL_SNAP_TOLERANCE = 6;

export class EnemyAI {
  private activeTokenEnemyId: string | null = null;
  private tokenUntil = 0;

  requestAttackToken(enemy: EnemyBasic, nowMs: number): boolean {
    if (this.activeTokenEnemyId === enemy.id) {
      return true;
    }

    if (this.activeTokenEnemyId && nowMs < this.tokenUntil) {
      return false;
    }

    this.activeTokenEnemyId = enemy.id;
    this.tokenUntil = nowMs + (enemy.combatProfile?.tokenTimeoutMs ?? DEFAULT_TOKEN_TIMEOUT_MS);
    return true;
  }

  releaseAttackToken(enemyId: string): void {
    if (this.activeTokenEnemyId === enemyId) {
      this.activeTokenEnemyId = null;
      this.tokenUntil = 0;
    }
  }

  update(enemy: EnemyBasic, player: Player, dtMs: number, nowMs: number): void {
    if (!enemy.isAlive()) {
      this.releaseAttackToken(enemy.id);
      enemy.clearMoveIntent();
      return;
    }

    if (this.activeTokenEnemyId === enemy.id && !enemy.isPerformingAttack()) {
      this.releaseAttackToken(enemy.id);
    }

    if (enemy.isPerformingAttack() || enemy.state === "HIT" || enemy.state === "KNOCKDOWN" || enemy.state === "GETUP") {
      enemy.setMoveIntent(0, 0);
      return;
    }

    const attackRangeX = enemy.combatProfile?.attackRangeX ?? DEFAULT_ATTACK_RANGE_X;
    const attackRangeY = enemy.combatProfile?.attackRangeY ?? DEFAULT_ATTACK_RANGE_Y;
    const attackCooldownMs = enemy.combatProfile?.attackCooldownMs ?? DEFAULT_ATTACK_COOLDOWN_MS;
    const railSwitchAggressiveness = enemy.combatProfile?.railSwitchAggressiveness ?? DEFAULT_RAIL_SWITCH_AGGRESSIVENESS;
    const railSnapTolerance = enemy.combatProfile?.railSnapTolerance ?? DEFAULT_RAIL_SNAP_TOLERANCE;

    const dx = player.x - enemy.x;
    const targetRailY = player.y;
    const railDelta = targetRailY - enemy.y;
    enemy.faceTowards(player.x);

    const absDx = Math.abs(dx);
    const absRailDelta = Math.abs(railDelta);
    const inAttackRange = absDx <= attackRangeX && absRailDelta <= attackRangeY;

    if (inAttackRange && enemy.canAttack(nowMs) && this.requestAttackToken(enemy, nowMs)) {
      enemy.setMoveIntent(0, 0);
      if (enemy.tryStartAttack("ENEMY_ATTACK")) {
        enemy.markAttackUsed(nowMs, attackCooldownMs);
      }
      return;
    }

    const farRailThreshold = Math.max(railSnapTolerance + 10, attackRangeY * 2.1);
    const mediumRailThreshold = Math.max(railSnapTolerance + 4, attackRangeY * 1.2);

    let moveY = 0;
    if (absRailDelta > farRailThreshold) {
      moveY = Math.sign(railDelta) * Math.min(1, 0.92 * railSwitchAggressiveness);
    } else if (absRailDelta > mediumRailThreshold) {
      moveY = Math.sign(railDelta) * Math.min(1, 0.74 * railSwitchAggressiveness);
    } else if (absRailDelta > railSnapTolerance) {
      moveY = Math.sign(railDelta) * Math.min(1, 0.52 * railSwitchAggressiveness);
    }

    const railAlignmentThreshold = Math.max(railSnapTolerance, attackRangeY * Math.max(0.45, 1.1 - railSwitchAggressiveness * 0.35));
    const isRailAligned = absRailDelta <= railAlignmentThreshold;
    const moveX = isRailAligned && absDx > attackRangeX * 0.7 ? Math.sign(dx) : 0;

    const smoothing = Math.min(1, dtMs / 16.667);
    enemy.setMoveIntent(moveX * smoothing, moveY * smoothing);
  }
}
