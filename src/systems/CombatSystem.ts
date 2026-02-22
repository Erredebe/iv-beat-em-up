import Phaser from "phaser";
import type { BaseFighter } from "../entities/BaseFighter";
import type { HitStopSystem } from "./HitStopSystem";
import { rectIntersects } from "./combatMath";
import type { AttackId, DamageEvent } from "../types/combat";

export interface CombatHitResult {
  attacker: BaseFighter;
  target: BaseFighter;
  event: DamageEvent;
  attackId: AttackId;
}

interface CombatSystemOptions {
  hitStopSystem: HitStopSystem;
  eventBus?: Phaser.Events.EventEmitter;
  onHit?: (result: CombatHitResult) => void;
}

export class CombatSystem {
  private readonly hitStopSystem: HitStopSystem;
  private readonly eventBus?: Phaser.Events.EventEmitter;
  private readonly onHit?: (result: CombatHitResult) => void;

  constructor(options: CombatSystemOptions) {
    this.hitStopSystem = options.hitStopSystem;
    this.eventBus = options.eventBus;
    this.onHit = options.onHit;
  }

  beginAttack(attacker: BaseFighter, attackId: AttackId): boolean {
    return attacker.tryStartAttack(attackId);
  }

  updateFrame(attacker: BaseFighter, animFrame: number): void {
    void attacker;
    void animFrame;
  }

  resolveHits(fighters: BaseFighter[], nowMs: number): void {
    for (const attacker of fighters) {
      if (!attacker.isAlive()) {
        continue;
      }
      const attackId = attacker.getCurrentAttackId();
      const attackData = attacker.getCurrentAttackData();
      const hitbox = attacker.getActiveHitbox();
      if (!attackId || !attackData || !hitbox) {
        continue;
      }

      for (const target of fighters) {
        if (target === attacker || target.team === attacker.team || !target.isAlive()) {
          continue;
        }
        if (!attacker.canHitTarget(target.id)) {
          continue;
        }

        const hurtbox = target.getHurtbox();
        if (!hurtbox || !rectIntersects(hitbox, hurtbox)) {
          continue;
        }

        const knockbackDirection = attacker.x <= target.x ? 1 : -1;
        const event: DamageEvent = {
          damage: attackData.damage,
          knockbackX: attackData.knockbackX * knockbackDirection,
          causesKnockdown: attackData.causesKnockdown,
          iFrameMs: attackData.iFrameMs,
          hitStunMs: attackData.hitStunMs,
          knockdownDurationMs: attackData.knockdownDurationMs,
          sourceX: attacker.x,
        };

        const applied = this.applyDamage(target, event, nowMs);
        if (!applied) {
          continue;
        }
        attacker.markTargetHit(target.id);

        this.hitStopSystem.trigger(attackData.hitStopMs);
        this.eventBus?.emit("combat:hit", {
          attackerId: attacker.id,
          targetId: target.id,
          targetHp: target.hp,
          targetMaxHp: target.maxHp,
          at: nowMs,
          attackId,
        });
        this.onHit?.({
          attacker,
          target,
          event,
          attackId,
        });
      }
    }
  }

  applyDamage(target: BaseFighter, event: DamageEvent, nowMs: number): boolean {
    return target.applyDamage(event, nowMs);
  }
}
