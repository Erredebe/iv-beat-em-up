import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AttackFrameData, DamageEvent, Rect } from "../types/combat";
import type { BaseFighter } from "../entities/BaseFighter";

let CombatSystem: typeof import("./CombatSystem").CombatSystem;

beforeAll(async () => {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent: "vitest" },
    configurable: true,
  });
  ({ CombatSystem } = await import("./CombatSystem"));
});

interface FighterStub {
  id: string;
  team: "player" | "enemy";
  x: number;
  hp: number;
  maxHp: number;
  state: string;
  isAlive: () => boolean;
  getCurrentAttackId: () => "ATTACK_1" | null;
  getCurrentAttackData: () => AttackFrameData | null;
  getActiveHitbox: () => Rect | null;
  getHurtbox: () => Rect | null;
  canHitTarget: (targetId: string) => boolean;
  markTargetHit: (targetId: string) => void;
  applyDamage: (event: DamageEvent, nowMs: number) => boolean;
}

function createAttackData(overrides: Partial<AttackFrameData> = {}): AttackFrameData {
  return {
    totalFrames: 20,
    activeStart: 4,
    activeEnd: 6,
    recoveryStart: 7,
    damage: 10,
    knockbackX: 120,
    causesKnockdown: false,
    hitStopMs: 60,
    iFrameMs: 80,
    hitStunMs: 140,
    knockdownDurationMs: 0,
    hitbox: {
      offsetX: 0,
      offsetY: 0,
      width: 20,
      height: 20,
    },
    ...overrides,
  };
}

function createAttacker(x: number, attackData = createAttackData()): FighterStub {
  return {
    id: "attacker",
    team: "player",
    x,
    hp: 100,
    maxHp: 100,
    state: "ATTACK_1",
    isAlive: () => true,
    getCurrentAttackId: () => "ATTACK_1",
    getCurrentAttackData: () => attackData,
    getActiveHitbox: () => ({ x: 0, y: 0, width: 24, height: 24 }),
    getHurtbox: () => null,
    canHitTarget: () => true,
    markTargetHit: vi.fn(),
    applyDamage: vi.fn(() => false),
  };
}

function createTarget(x: number): FighterStub {
  return {
    id: "target",
    team: "enemy",
    x,
    hp: 100,
    maxHp: 100,
    state: "IDLE",
    isAlive: () => true,
    getCurrentAttackId: () => null,
    getCurrentAttackData: () => null,
    getActiveHitbox: () => null,
    getHurtbox: () => ({ x: 0, y: 0, width: 24, height: 24 }),
    canHitTarget: () => true,
    markTargetHit: vi.fn(),
    applyDamage: vi.fn(() => true),
  };
}

describe("CombatSystem", () => {
  it("passes signed knockback directly to the target", () => {
    const hitStopSystem = { trigger: vi.fn() };
    const combatSystem = new CombatSystem({ hitStopSystem: hitStopSystem as never });
    const attacker = createAttacker(140);
    const target = createTarget(220);

    combatSystem.resolveHits([attacker as unknown as BaseFighter, target as unknown as BaseFighter], 1000);

    expect(target.applyDamage).toHaveBeenCalledTimes(1);
    const [event] = vi.mocked(target.applyDamage).mock.calls[0] ?? [];
    expect((event as DamageEvent).knockbackX).toBe(120);
  });

  it("reduces hit stop for non-knockdown hits and keeps full value on knockdown", () => {
    const hitStopSystem = { trigger: vi.fn() };
    const combatSystem = new CombatSystem({ hitStopSystem: hitStopSystem as never });

    const lightAttacker = createAttacker(100, createAttackData({ causesKnockdown: false, hitStopMs: 50 }));
    const lightTarget = createTarget(140);
    combatSystem.resolveHits([lightAttacker as unknown as BaseFighter, lightTarget as unknown as BaseFighter], 1000);

    const heavyAttacker = createAttacker(100, createAttackData({ causesKnockdown: true, hitStopMs: 50, knockdownDurationMs: 300 }));
    const heavyTarget = createTarget(140);
    combatSystem.resolveHits([heavyAttacker as unknown as BaseFighter, heavyTarget as unknown as BaseFighter], 1000);

    expect(hitStopSystem.trigger).toHaveBeenNthCalledWith(1, 30);
    expect(hitStopSystem.trigger).toHaveBeenNthCalledWith(2, 50);
  });
});
