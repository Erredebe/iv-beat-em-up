import type { StageVisualProfile } from "./stageTypes";

export const stageVisualPresets = {
  wetNight: {
    baseGradient: {
      topColor: 0x12031d,
      bottomColor: 0x061123,
    },
    colorGrade: {
      color: 0x161f31,
      alpha: 0.1,
    },
    rainIntensity: 0.8,
    neonIntensity: 0.92,
    foregroundAccents: {
      skylineFar: 0x7186aa,
      skylineMid: 0x7f8ea8,
      skylineClose: 0x9e8f98,
      facade: 0xbdb4b2,
      foregroundDeco: 0x8890a0,
      crateTint: 0x7a8f76,
      crateAlpha: 0.88,
    },
  },
  industrialWarm: {
    baseGradient: {
      topColor: 0x29130d,
      bottomColor: 0x11101a,
    },
    colorGrade: {
      color: 0x2f1c1a,
      alpha: 0.08,
    },
    rainIntensity: 0.1,
    neonIntensity: 0.78,
    foregroundAccents: {
      skylineFar: 0x8e7f71,
      skylineMid: 0x9d8b79,
      skylineClose: 0xab8f78,
      facade: 0xc8b39f,
      foregroundDeco: 0x9a8f86,
      crateTint: 0x85745f,
      crateAlpha: 0.9,
    },
  },
  neonCoast: {
    baseGradient: {
      topColor: 0x061d2c,
      bottomColor: 0x0b1023,
    },
    colorGrade: {
      color: 0x10283f,
      alpha: 0.11,
    },
    rainIntensity: 0,
    neonIntensity: 1,
    foregroundAccents: {
      skylineFar: 0x6085b8,
      skylineMid: 0x6f93c3,
      skylineClose: 0x86a6cb,
      facade: 0xaec0cb,
      foregroundDeco: 0x7896b2,
      crateTint: 0x5f8f88,
      crateAlpha: 0.86,
    },
  },
  crimsonHarbor: {
    baseGradient: {
      topColor: 0x2a0f1a,
      bottomColor: 0x0a0f1d,
    },
    colorGrade: {
      color: 0x2a1829,
      alpha: 0.12,
    },
    rainIntensity: 0.64,
    neonIntensity: 0.84,
    foregroundAccents: {
      skylineFar: 0x8d7390,
      skylineMid: 0x9d7f95,
      skylineClose: 0xae8396,
      facade: 0xc2a5a5,
      foregroundDeco: 0x99899b,
      crateTint: 0x8c7767,
      crateAlpha: 0.9,
    },
  },
} satisfies Record<string, StageVisualProfile>;

export type StageVisualPresetId = keyof typeof stageVisualPresets;

export interface StageVisualProfileOverrides {
  baseGradient?: Partial<StageVisualProfile["baseGradient"]>;
  colorGrade?: Partial<StageVisualProfile["colorGrade"]>;
  rainIntensity?: number;
  neonIntensity?: number;
  foregroundAccents?: Partial<StageVisualProfile["foregroundAccents"]>;
}

export function createStageVisualProfile(presetId: StageVisualPresetId, overrides?: StageVisualProfileOverrides): StageVisualProfile {
  const preset = stageVisualPresets[presetId];
  return {
    baseGradient: {
      topColor: overrides?.baseGradient?.topColor ?? preset.baseGradient.topColor,
      bottomColor: overrides?.baseGradient?.bottomColor ?? preset.baseGradient.bottomColor,
    },
    colorGrade: {
      color: overrides?.colorGrade?.color ?? preset.colorGrade.color,
      alpha: overrides?.colorGrade?.alpha ?? preset.colorGrade.alpha,
    },
    rainIntensity: overrides?.rainIntensity ?? preset.rainIntensity,
    neonIntensity: overrides?.neonIntensity ?? preset.neonIntensity,
    foregroundAccents: {
      skylineFar: overrides?.foregroundAccents?.skylineFar ?? preset.foregroundAccents.skylineFar,
      skylineMid: overrides?.foregroundAccents?.skylineMid ?? preset.foregroundAccents.skylineMid,
      skylineClose: overrides?.foregroundAccents?.skylineClose ?? preset.foregroundAccents.skylineClose,
      facade: overrides?.foregroundAccents?.facade ?? preset.foregroundAccents.facade,
      foregroundDeco: overrides?.foregroundAccents?.foregroundDeco ?? preset.foregroundAccents.foregroundDeco,
      crateTint: overrides?.foregroundAccents?.crateTint ?? preset.foregroundAccents.crateTint,
      crateAlpha: overrides?.foregroundAccents?.crateAlpha ?? preset.foregroundAccents.crateAlpha,
    },
  };
}
