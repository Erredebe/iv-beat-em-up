import { SPECIAL_COOLDOWN_MS, SPECIAL_HP_COST_RATIO } from "../config/constants";
import type { PlayableCharacterProfile } from "../config/gameplay/playableRoster";
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

  getSpecialCooldownRatio(nowMs: number): number {
    if (nowMs >= this.specialCooldownUntil) {
      return 1;
    }
    const remaining = this.specialCooldownUntil - nowMs;
    return Math.max(0, 1 - remaining / SPECIAL_COOLDOWN_MS);
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

function scaleFrameData(base: AttackFrameData, profile: PlayableCharacterProfile): AttackFrameData {
  const comboWindowStart = base.comboWindowStart !== undefined
    ? Math.max(1, base.comboWindowStart - profile.comboWindowBonusFrames)
    : undefined;
  const comboWindowEnd = base.comboWindowEnd !== undefined
    ? Math.max(1, base.comboWindowEnd + profile.comboWindowBonusFrames)
    : undefined;

  return {
    ...base,
    totalFrames: Math.max(8, Math.round(base.totalFrames / profile.comboSpeedMultiplier)),
    activeStart: Math.max(1, Math.round(base.activeStart / profile.comboSpeedMultiplier)),
    activeEnd: Math.max(1, Math.round(base.activeEnd / profile.comboSpeedMultiplier)),
    recoveryStart: Math.max(1, Math.round(base.recoveryStart / profile.comboSpeedMultiplier)),
    comboWindowStart,
    comboWindowEnd,
    damage: Math.max(1, Math.round(base.damage * profile.damageMultiplier)),
    visualClipId: base.visualClipId,
  };
}

export function buildPlayerAttackData(
  raw: Record<string, AttackFrameData>,
  profile: PlayableCharacterProfile,
): Record<AttackId, AttackFrameData> {
  const withClips = {
    ATTACK_1: { ...raw.ATTACK_1, visualClipId: "attack1" as const },
    ATTACK_2: { ...raw.ATTACK_2, visualClipId: "attack2" as const },
    ATTACK_3: { ...raw.ATTACK_3, visualClipId: "attack3" as const },
    AIR_ATTACK: { ...raw.AIR_ATTACK, visualClipId: "airAttack" as const },
    SPECIAL: { ...raw.SPECIAL, visualClipId: "special" as const },
  };

  return {
    ATTACK_1: scaleFrameData(withClips.ATTACK_1, profile),
    ATTACK_2: scaleFrameData(withClips.ATTACK_2, profile),
    ATTACK_3: scaleFrameData(withClips.ATTACK_3, profile),
    AIR_ATTACK: scaleFrameData(withClips.AIR_ATTACK, profile),
    SPECIAL: scaleFrameData(withClips.SPECIAL, profile),
    ENEMY_ATTACK: scaleFrameData(withClips.ATTACK_1, profile),
  };
}
