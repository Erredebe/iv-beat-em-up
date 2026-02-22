import type { SpecialSfxKey } from "../audio/specialSfx";
import type { AnimationOwner } from "../visual/fighterAnimationSets";

export type CharacterId = "kastro" | "marina" | "meneillos";
export type SpecialProfileId = "kastro_power" | "marina_rush" | "meneillos_control";

export interface PlayableCharacterProfile {
  id: CharacterId;
  displayName: string;
  portraitKey: string;
  animationOwner: AnimationOwner;
  specialProfileId: SpecialProfileId;
  specialSfxKey: SpecialSfxKey;
  maxHp: number;
  moveSpeed: number;
  damageMultiplier: number;
  comboSpeedMultiplier: number;
  comboWindowBonusFrames: number;
  tint: number;
}

export const playableRoster: Record<CharacterId, PlayableCharacterProfile> = {
  kastro: {
    id: "kastro",
    displayName: "KASTRO",
    portraitKey: "portrait_kastro",
    animationOwner: "kastro",
    specialProfileId: "kastro_power",
    specialSfxKey: "sfx_special_kastro",
    maxHp: 138,
    moveSpeed: 124,
    damageMultiplier: 1.22,
    comboSpeedMultiplier: 0.92,
    comboWindowBonusFrames: 0,
    tint: 0xfff6ee,
  },
  marina: {
    id: "marina",
    displayName: "MARINA",
    portraitKey: "portrait_marina",
    animationOwner: "marina",
    specialProfileId: "marina_rush",
    specialSfxKey: "sfx_special_marina",
    maxHp: 96,
    moveSpeed: 164,
    damageMultiplier: 0.88,
    comboSpeedMultiplier: 1.16,
    comboWindowBonusFrames: 2,
    tint: 0xd4ecff,
  },
  meneillos: {
    id: "meneillos",
    displayName: "MENEILLOS",
    portraitKey: "portrait_meneillos",
    animationOwner: "meneillos",
    specialProfileId: "meneillos_control",
    specialSfxKey: "sfx_special_meneillos",
    maxHp: 116,
    moveSpeed: 142,
    damageMultiplier: 1.02,
    comboSpeedMultiplier: 1,
    comboWindowBonusFrames: 4,
    tint: 0xffe8c2,
  },
};

export const playableCharacters: PlayableCharacterProfile[] = Object.values(playableRoster);

export function getPlayableCharacter(id: CharacterId): PlayableCharacterProfile {
  return playableRoster[id];
}
