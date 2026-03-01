import type { EnemyBasic } from "../entities/EnemyBasic";
import { featureFlags } from "../config/features";
import type { Player } from "../entities/Player";
import type { NavigationSystem, NavigationZoneState } from "./NavigationSystem";

const DEFAULT_ATTACK_RANGE_X = 44;
const DEFAULT_ATTACK_RANGE_Y = 14;
const DEFAULT_ATTACK_COOLDOWN_MS = 1150;
const DEFAULT_TOKEN_TIMEOUT_MS = 900;
const DEFAULT_RAIL_SWITCH_AGGRESSIVENESS = 1;
const DEFAULT_RAIL_SNAP_TOLERANCE = 6;
const DEFAULT_PRESSURE_BIAS = 1;
const DEFAULT_FLANK_BIAS = 0.5;

const MAX_PRESSURE_BUDGET = 2.1;
const ATTACK_WINDUP_MIN_MS = 80;
const ATTACK_WINDUP_MAX_MS = 120;

interface ActiveAttackToken {
  pressure: number;
  until: number;
}

export class EnemyAI {
  private readonly activeTokens = new Map<string, ActiveAttackToken>();
  private readonly navigationSystem?: NavigationSystem;
  private readonly getZoneState?: () => NavigationZoneState | null;

  constructor(navigationSystem?: NavigationSystem, getZoneState?: () => NavigationZoneState | null) {
    this.navigationSystem = navigationSystem;
    this.getZoneState = getZoneState;
  }

  requestAttackToken(enemy: EnemyBasic, nowMs: number): boolean {
    this.pruneExpiredTokens(nowMs);

    const existing = this.activeTokens.get(enemy.id);
    if (existing) {
      existing.until = nowMs + (enemy.combatProfile?.tokenTimeoutMs ?? DEFAULT_TOKEN_TIMEOUT_MS);
      this.activeTokens.set(enemy.id, existing);
      return true;
    }

    const pressureBias = featureFlags.combatDepthV2 ? (enemy.combatProfile?.pressureBias ?? DEFAULT_PRESSURE_BIAS) : 1;
    const occupiedPressure = this.getOccupiedPressure();
    const pressureBudget = featureFlags.combatDepthV2 ? MAX_PRESSURE_BUDGET : 1;
    const hasBudget = occupiedPressure + pressureBias <= pressureBudget || this.activeTokens.size === 0;
    if (!hasBudget) {
      return false;
    }

    this.activeTokens.set(enemy.id, {
      pressure: pressureBias,
      until: nowMs + (enemy.combatProfile?.tokenTimeoutMs ?? DEFAULT_TOKEN_TIMEOUT_MS),
    });
    return true;
  }

  releaseAttackToken(enemyId: string): void {
    this.activeTokens.delete(enemyId);
  }

  update(enemy: EnemyBasic, player: Player, dtMs: number, nowMs: number): void {
    void dtMs;
    this.pruneExpiredTokens(nowMs);

    if (!enemy.isAlive()) {
      this.releaseAttackToken(enemy.id);
      enemy.clearAttackWindup();
      enemy.clearMoveIntent();
      return;
    }

    if (enemy.isPerformingAttack() || enemy.state === "HIT" || enemy.state === "KNOCKDOWN" || enemy.state === "GETUP") {
      this.releaseAttackToken(enemy.id);
      enemy.clearAttackWindup();
      enemy.setMoveIntent(0, 0);
      return;
    }

    const attackRangeX = enemy.combatProfile?.attackRangeX ?? DEFAULT_ATTACK_RANGE_X;
    const attackRangeY = enemy.combatProfile?.attackRangeY ?? DEFAULT_ATTACK_RANGE_Y;
    const attackCooldownMs = enemy.combatProfile?.attackCooldownMs ?? DEFAULT_ATTACK_COOLDOWN_MS;
    const railSwitchAggressiveness = enemy.combatProfile?.railSwitchAggressiveness ?? DEFAULT_RAIL_SWITCH_AGGRESSIVENESS;
    const railSnapTolerance = enemy.combatProfile?.railSnapTolerance ?? DEFAULT_RAIL_SNAP_TOLERANCE;
    const flankBias = featureFlags.combatDepthV2 ? (enemy.combatProfile?.flankBias ?? DEFAULT_FLANK_BIAS) : 0;

    const projectedPlayer = this.navigationSystem
      ? this.navigationSystem.projectToNearestRail(player.x, player.y)
      : { x: player.x, y: player.y };

    const dx = projectedPlayer.x - enemy.x;
    const flankDirection = this.resolveFlankDirection(enemy.id);
    const flankOffset = attackRangeY * flankBias * (Math.abs(dx) > attackRangeX ? 0.75 : 0.26) * flankDirection;
    const targetRailY = projectedPlayer.y + flankOffset;
    const railDelta = targetRailY - enemy.y;
    enemy.faceTowards(player.x);

    const absDx = Math.abs(dx);
    const absRailDelta = Math.abs(railDelta);
    const inAttackRange = absDx <= attackRangeX && absRailDelta <= attackRangeY;

    if (!inAttackRange) {
      if (enemy.isAttackWindupActive(nowMs) || enemy.isAttackWindupReady(nowMs)) {
        enemy.clearAttackWindup();
      }
      this.releaseAttackToken(enemy.id);
    }

    if (inAttackRange && enemy.canAttack(nowMs) && this.requestAttackToken(enemy, nowMs)) {
      enemy.setMoveIntent(0, 0);
      if (!featureFlags.combatDepthV2) {
        if (enemy.tryStartAttack("ENEMY_ATTACK")) {
          enemy.markAttackUsed(nowMs, attackCooldownMs);
        }
        this.releaseAttackToken(enemy.id);
        return;
      }
      if (enemy.isAttackWindupReady(nowMs)) {
        if (enemy.tryStartAttack("ENEMY_ATTACK")) {
          enemy.markAttackUsed(nowMs, attackCooldownMs);
        }
        this.releaseAttackToken(enemy.id);
        return;
      }

      if (!enemy.isAttackWindupActive(nowMs)) {
        enemy.startAttackWindup(nowMs, this.randomWindupMs());
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
    const approachScale = enemy.combatProfile.role === "controller" ? 0.8 : enemy.combatProfile.role === "boss" ? 0.64 : 1;

    let moveX = isRailAligned && absDx > attackRangeX * 0.7 ? Math.sign(dx) * approachScale : 0;
    if (moveX !== 0 && this.navigationSystem && this.getZoneState) {
      const from = this.navigationSystem.projectToNearestRail(enemy.x, enemy.y);
      const to = this.navigationSystem.projectToNearestRail(enemy.x + moveX * 32, enemy.y);
      if (this.navigationSystem.isPathBlocked(from, to, this.getZoneState())) {
        moveX = 0;
      }
    }

    enemy.setMoveIntent(moveX, moveY);
  }

  private pruneExpiredTokens(nowMs: number): void {
    for (const [enemyId, token] of this.activeTokens.entries()) {
      if (nowMs >= token.until) {
        this.activeTokens.delete(enemyId);
      }
    }
  }

  private getOccupiedPressure(): number {
    let pressure = 0;
    for (const token of this.activeTokens.values()) {
      pressure += token.pressure;
    }
    return pressure;
  }

  private resolveFlankDirection(enemyId: string): number {
    let checksum = 0;
    for (const char of enemyId) {
      checksum += char.charCodeAt(0);
    }
    return checksum % 2 === 0 ? 1 : -1;
  }

  private randomWindupMs(): number {
    return Math.floor(ATTACK_WINDUP_MIN_MS + Math.random() * (ATTACK_WINDUP_MAX_MS - ATTACK_WINDUP_MIN_MS + 1));
  }
}
