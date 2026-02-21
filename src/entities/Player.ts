import { SPECIAL_COOLDOWN_MS, SPECIAL_HP_COST_RATIO } from "../config/constants";
import type { AttackFrameData, AttackId } from "../types/combat";
import { BaseFighter } from "./BaseFighter";
import type { InputManager } from "../systems/InputManager";

export interface PlayerUpdateEvents {
  attackStarted: boolean;
  jumpStarted: boolean;
  specialStarted: boolean;
}

export class Player extends BaseFighter {
  private specialCooldownUntil = 0;

  updateFromInput(input: InputManager, deltaMs: number, nowMs: number): PlayerUpdateEvents {
    const events: PlayerUpdateEvents = {
      attackStarted: false,
      jumpStarted: false,
      specialStarted: false,
    };

    const move = input.getMoveVector();
    this.setMoveIntent(move.x, move.y);

    this.handleComboQueue(input);
    this.tryAirAttack(input, events);

    if (this.canAcceptCommands()) {
      if (
        input.consumeBuffered("special") &&
        nowMs >= this.specialCooldownUntil &&
        this.consumeHealthRatio(SPECIAL_HP_COST_RATIO)
      ) {
        const started = this.tryStartAttack("SPECIAL");
        if (started) {
          const specialData = this.getCurrentAttackData();
          if (specialData?.grantsInvulnMs) {
            this.grantInvulnerability(specialData.grantsInvulnMs, nowMs);
          }
          this.specialCooldownUntil = nowMs + SPECIAL_COOLDOWN_MS;
          events.specialStarted = true;
        }
      } else if (input.consumeBuffered("jump") && !this.isAirborne()) {
        events.jumpStarted = this.startJump();
      } else if (input.consumeBuffered("attack")) {
        events.attackStarted = this.tryStartAttack("ATTACK_1");
      }
    }

    this.update(deltaMs, nowMs);
    return events;
  }

  private handleComboQueue(input: InputManager): void {
    if (!this.isPerformingAttack()) {
      return;
    }

    const currentData = this.getCurrentAttackData();
    const currentAttack = this.getCurrentAttackId();
    if (!currentData || !currentAttack) {
      return;
    }

    if ((currentAttack === "ATTACK_1" || currentAttack === "ATTACK_2") && this.isInComboWindow()) {
      if (input.consumeBuffered("attack")) {
        const nextAttack = currentData.nextAttack;
        if (nextAttack) {
          this.queueNextAttack(nextAttack);
        }
      }
    }
  }

  private tryAirAttack(input: InputManager, events: PlayerUpdateEvents): void {
    if (!this.isAirborne() || this.isPerformingAttack()) {
      return;
    }

    const chordPressed = input.consumeBufferedChord(["jump", "attack"]);
    const singleAttack = input.consumeBuffered("attack");
    if (chordPressed || singleAttack) {
      events.attackStarted = this.tryStartAttack("AIR_ATTACK");
    }
  }
}

export function buildPlayerAttackData(raw: Record<string, AttackFrameData>): Record<AttackId, AttackFrameData> {
  return {
    ATTACK_1: raw.ATTACK_1,
    ATTACK_2: raw.ATTACK_2,
    ATTACK_3: raw.ATTACK_3,
    AIR_ATTACK: raw.AIR_ATTACK,
    SPECIAL: raw.SPECIAL,
    ENEMY_ATTACK: raw.ATTACK_1,
  };
}
