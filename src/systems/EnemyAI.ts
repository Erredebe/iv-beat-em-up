import type { EnemyBasic } from "../entities/EnemyBasic";
import type { Player } from "../entities/Player";

const ATTACK_RANGE_X = 44;
const ATTACK_RANGE_Y = 14;
const ATTACK_COOLDOWN_MS = 1150;
const TOKEN_TIMEOUT_MS = 900;

export class EnemyAI {
  private activeTokenEnemyId: string | null = null;
  private tokenUntil = 0;

  requestAttackToken(enemyId: string, nowMs: number): boolean {
    if (this.activeTokenEnemyId === enemyId) {
      return true;
    }

    if (this.activeTokenEnemyId && nowMs < this.tokenUntil) {
      return false;
    }

    this.activeTokenEnemyId = enemyId;
    this.tokenUntil = nowMs + TOKEN_TIMEOUT_MS;
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

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    enemy.faceTowards(player.x);

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const inAttackRange = absDx <= ATTACK_RANGE_X && absDy <= ATTACK_RANGE_Y;

    if (inAttackRange && enemy.canAttack(nowMs) && this.requestAttackToken(enemy.id, nowMs)) {
      enemy.setMoveIntent(0, 0);
      if (enemy.tryStartAttack("ENEMY_ATTACK")) {
        enemy.markAttackUsed(nowMs, ATTACK_COOLDOWN_MS);
      }
      return;
    }

    const moveX = absDx > ATTACK_RANGE_X * 0.7 ? Math.sign(dx) : 0;
    const moveY = absDy > 4 ? Math.sign(dy) : 0;
    const smoothing = Math.min(1, dtMs / 16.667);
    enemy.setMoveIntent(moveX * smoothing, moveY * smoothing);
  }
}

