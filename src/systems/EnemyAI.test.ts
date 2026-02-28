import { describe, expect, it } from "vitest";
import { EnemyAI } from "./EnemyAI";
import type { EnemyCombatProfile } from "../entities/EnemyBasic";
import type { FighterState } from "../types/combat";

type MoveIntent = { x: number; y: number };

type EnemyMock = {
  id: string;
  x: number;
  y: number;
  state: FighterState;
  combatProfile: EnemyCombatProfile;
  moveIntent: MoveIntent;
  facingTargetX: number | null;
  isAlive: () => boolean;
  clearMoveIntent: () => void;
  isPerformingAttack: () => boolean;
  setMoveIntent: (x: number, y: number) => void;
  faceTowards: (targetX: number) => void;
  canAttack: () => boolean;
  tryStartAttack: () => boolean;
  markAttackUsed: () => void;
};

const baseProfile: EnemyCombatProfile = {
  archetype: "brawler",
  attackRangeX: 58,
  attackRangeY: 24,
  attackCooldownMs: 1000,
  tokenTimeoutMs: 900,
  damageMultiplier: 1,
  moveSpeedMultiplier: 1,
  railSwitchAggressiveness: 1,
  railSnapTolerance: 6,
};

function makeEnemy(overrides: Partial<EnemyMock> = {}): EnemyMock {
  const enemy: EnemyMock = {
    id: "enemy-1",
    x: 120,
    y: 100,
    state: "IDLE",
    combatProfile: baseProfile,
    moveIntent: { x: 0, y: 0 },
    facingTargetX: null,
    isAlive: () => true,
    clearMoveIntent: () => {
      enemy.moveIntent = { x: 0, y: 0 };
    },
    isPerformingAttack: () => false,
    setMoveIntent: (x, y) => {
      enemy.moveIntent = { x, y };
    },
    faceTowards: (targetX) => {
      enemy.facingTargetX = targetX;
    },
    canAttack: () => false,
    tryStartAttack: () => false,
    markAttackUsed: () => undefined,
  };
  Object.assign(enemy, overrides);
  return enemy;
}

function makePlayer(x: number, y: number): { x: number; y: number } {
  return { x, y };
}

describe("EnemyAI", () => {
  it("alinea en Y antes de cerrar distancia en X cuando está en otro rail", () => {
    const ai = new EnemyAI();
    const enemy = makeEnemy({ x: 100, y: 90 });
    const player = makePlayer(240, 164);

    ai.update(enemy as never, player as never, 16.667, 100);

    expect(enemy.moveIntent.x).toBe(0);
    expect(enemy.moveIntent.y).toBeGreaterThan(0);
    expect(enemy.facingTargetX).toBe(player.x);
  });

  it("reanuda movimiento en X cuando ya está alineado con el rail objetivo", () => {
    const ai = new EnemyAI();
    const enemy = makeEnemy({ x: 100, y: 148 });
    const player = makePlayer(240, 160);

    ai.update(enemy as never, player as never, 16.667, 100);

    expect(enemy.moveIntent.x).toBeGreaterThan(0);
    expect(enemy.moveIntent.y).toBeGreaterThan(0);
  });

  it("usa umbrales de Y distintos según separación entre rails", () => {
    const ai = new EnemyAI();
    const enemyFar = makeEnemy({ y: 80 });
    const enemyMedium = makeEnemy({ y: 124 });
    const enemyNear = makeEnemy({ y: 150 });
    const player = makePlayer(260, 170);

    ai.update(enemyFar as never, player as never, 16.667, 100);
    ai.update(enemyMedium as never, player as never, 16.667, 100);
    ai.update(enemyNear as never, player as never, 16.667, 100);

    expect(enemyFar.moveIntent.y).toBeGreaterThan(enemyMedium.moveIntent.y);
    expect(enemyMedium.moveIntent.y).toBeGreaterThan(enemyNear.moveIntent.y);
    expect(enemyNear.moveIntent.y).toBeGreaterThan(0);
  });
});
