export type CharacterId = "boxeador" | "veloz" | "tecnico";

export interface PlayableCharacterProfile {
  id: CharacterId;
  displayName: string;
  portraitKey: string;
  texturePrefix: "player";
  maxHp: number;
  moveSpeed: number;
  damageMultiplier: number;
  comboSpeedMultiplier: number;
  comboWindowBonusFrames: number;
  tint: number;
}

export const playableRoster: Record<CharacterId, PlayableCharacterProfile> = {
  boxeador: {
    id: "boxeador",
    displayName: "BOXEADOR",
    portraitKey: "portrait_boxeador",
    texturePrefix: "player",
    maxHp: 130,
    moveSpeed: 126,
    damageMultiplier: 1.18,
    comboSpeedMultiplier: 0.94,
    comboWindowBonusFrames: 0,
    tint: 0xfff6ee,
  },
  veloz: {
    id: "veloz",
    displayName: "VELOZ",
    portraitKey: "portrait_veloz",
    texturePrefix: "player",
    maxHp: 100,
    moveSpeed: 156,
    damageMultiplier: 0.9,
    comboSpeedMultiplier: 1.12,
    comboWindowBonusFrames: 2,
    tint: 0xd4ecff,
  },
  tecnico: {
    id: "tecnico",
    displayName: "TECNICO",
    portraitKey: "portrait_tecnico",
    texturePrefix: "player",
    maxHp: 115,
    moveSpeed: 138,
    damageMultiplier: 1,
    comboSpeedMultiplier: 1,
    comboWindowBonusFrames: 3,
    tint: 0xffe8c2,
  },
};

export const playableCharacters: PlayableCharacterProfile[] = Object.values(playableRoster);

export function getPlayableCharacter(id: CharacterId): PlayableCharacterProfile {
  return playableRoster[id];
}
