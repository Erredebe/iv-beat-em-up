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
    gradeBlendMode: "multiply",
    rainIntensity: 0.8,
    rainDriftSpeed: 0.74,
    fogAlpha: 0.08,
    neonIntensity: 0.92,
    neonPulseHz: 1.8,
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
    gradeBlendMode: "multiply",
    rainIntensity: 0.1,
    rainDriftSpeed: 0.42,
    fogAlpha: 0.05,
    neonIntensity: 0.78,
    neonPulseHz: 1.2,
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
    gradeBlendMode: "screen",
    rainIntensity: 0,
    rainDriftSpeed: 0,
    fogAlpha: 0.04,
    neonIntensity: 1,
    neonPulseHz: 2.1,
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
    gradeBlendMode: "overlay",
    rainIntensity: 0.64,
    rainDriftSpeed: 0.68,
    fogAlpha: 0.06,
    neonIntensity: 0.84,
    neonPulseHz: 1.5,
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
  gradeBlendMode?: StageVisualProfile["gradeBlendMode"];
  rainIntensity?: number;
  rainDriftSpeed?: number;
  fogAlpha?: number;
  neonIntensity?: number;
  neonPulseHz?: number;
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
    gradeBlendMode: overrides?.gradeBlendMode ?? preset.gradeBlendMode,
    rainIntensity: overrides?.rainIntensity ?? preset.rainIntensity,
    rainDriftSpeed: overrides?.rainDriftSpeed ?? preset.rainDriftSpeed,
    fogAlpha: overrides?.fogAlpha ?? preset.fogAlpha,
    neonIntensity: overrides?.neonIntensity ?? preset.neonIntensity,
    neonPulseHz: overrides?.neonPulseHz ?? preset.neonPulseHz,
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
