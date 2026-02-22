import { SPECIAL_COOLDOWN_MS, SPECIAL_HP_COST_RATIO } from "../config/constants";
import type { PlayableCharacterProfile, SpecialProfileId } from "../config/gameplay/playableRoster";
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

function applyCommonAttackDefaults(data: AttackFrameData): AttackFrameData {
  return {
    ...data,
    hitboxMode: data.hitboxMode ?? "forward",
    maxHitsPerTarget: data.maxHitsPerTarget ?? 1,
    reHitCooldownFrames: data.reHitCooldownFrames ?? Math.max(1, data.activeEnd - data.activeStart + 1),
    selfMoveXPerFrame: data.selfMoveXPerFrame ?? 0,
  };
}

function buildSpecialByProfile(base: AttackFrameData, profileId: SpecialProfileId): AttackFrameData {
  if (profileId === "boxeador_power") {
    return applyCommonAttackDefaults({
      ...base,
      damage: Math.max(base.damage, 38),
      knockbackX: Math.max(base.knockbackX, 190),
      causesKnockdown: true,
      iFrameMs: Math.max(base.iFrameMs, 220),
      hitStunMs: Math.max(base.hitStunMs, 300),
      hitStopMs: Math.max(base.hitStopMs, 120),
      hitboxMode: "forward",
      maxHitsPerTarget: 1,
      reHitCooldownFrames: Math.max(1, base.activeEnd - base.activeStart + 1),
      selfMoveXPerFrame: 1.2,
      selfMoveActiveStart: base.activeStart,
      selfMoveActiveEnd: base.activeEnd,
    });
  }
  if (profileId === "veloz_rush") {
    return applyCommonAttackDefaults({
      ...base,
      damage: Math.max(8, Math.round(base.damage * 0.58)),
      knockbackX: Math.max(90, Math.round(base.knockbackX * 0.66)),
      causesKnockdown: false,
      iFrameMs: 34,
      hitStunMs: 120,
      hitStopMs: 55,
      hitboxMode: "forward",
      maxHitsPerTarget: 4,
      reHitCooldownFrames: 2,
      selfMoveXPerFrame: 3.1,
      selfMoveActiveStart: Math.max(1, base.activeStart - 1),
      selfMoveActiveEnd: base.activeEnd + 2,
    });
  }
  return applyCommonAttackDefaults({
    ...base,
    damage: Math.max(base.damage, 30),
    knockbackX: Math.max(base.knockbackX, 150),
    causesKnockdown: true,
    iFrameMs: 130,
    hitStunMs: Math.max(base.hitStunMs, 220),
    hitStopMs: Math.max(base.hitStopMs, 90),
    hitbox: {
      ...base.hitbox,
      width: Math.max(base.hitbox.width, 62),
    },
    hitboxMode: "centered",
    maxHitsPerTarget: 2,
    reHitCooldownFrames: 6,
    selfMoveXPerFrame: 0,
  });
}

export function buildPlayerAttackData(
  raw: Record<string, AttackFrameData>,
  profile: PlayableCharacterProfile,
): Record<AttackId, AttackFrameData> {
  const withClips: Record<AttackId, AttackFrameData> = {
    ATTACK_1: { ...raw.ATTACK_1, visualClipId: "attack1" as const },
    ATTACK_2: { ...raw.ATTACK_2, visualClipId: "attack2" as const },
    ATTACK_3: { ...raw.ATTACK_3, visualClipId: "attack3" as const },
    AIR_ATTACK: { ...raw.AIR_ATTACK, visualClipId: "airAttack" as const },
    SPECIAL: { ...raw.SPECIAL, visualClipId: "special" as const },
    ENEMY_ATTACK: { ...raw.ATTACK_1, visualClipId: "attack1" as const },
  };

  const scaledAttack1 = applyCommonAttackDefaults(scaleFrameData(withClips.ATTACK_1, profile));
  const scaledAttack2 = applyCommonAttackDefaults(scaleFrameData(withClips.ATTACK_2, profile));
  const scaledAttack3 = applyCommonAttackDefaults(scaleFrameData(withClips.ATTACK_3, profile));
  const scaledAirAttack = applyCommonAttackDefaults(scaleFrameData(withClips.AIR_ATTACK, profile));
  const scaledSpecialBase = scaleFrameData(withClips.SPECIAL, profile);
  const scaledSpecial = buildSpecialByProfile(scaledSpecialBase, profile.specialProfileId);

  return {
    ATTACK_1: scaledAttack1,
    ATTACK_2: scaledAttack2,
    ATTACK_3: scaledAttack3,
    AIR_ATTACK: scaledAirAttack,
    SPECIAL: scaledSpecial,
    ENEMY_ATTACK: scaledAttack1,
  };
}
