import type { StageVisualProfile } from "./stageTypes";

export const stageVisualPresets = {
  wetNight: {
    baseGradient: {
      topColor: 0x0b0f1a,
      bottomColor: 0x050a12,
    },
    colorGrade: {
      color: 0x111827,
      alpha: 0.08,
    },
    gradeBlendMode: "multiply",
    rainIntensity: 0.86,
    rainDriftSpeed: 0.82,
    fogAlpha: 0.06,
    neonIntensity: 0.96,
    neonPulseHz: 1.6,
    foregroundAccents: {
      skylineFar: 0x475c77,
      skylineMid: 0x5f7287,
      skylineClose: 0x7f7a84,
      facade: 0xa7a0a6,
      foregroundDeco: 0x6c7689,
      crateTint: 0x66775b,
      crateAlpha: 0.9,
    },
  },
  industrialWarm: {
    baseGradient: {
      topColor: 0x23110c,
      bottomColor: 0x120d10,
    },
    colorGrade: {
      color: 0x24140f,
      alpha: 0.06,
    },
    gradeBlendMode: "multiply",
    rainIntensity: 0.08,
    rainDriftSpeed: 0.34,
    fogAlpha: 0.03,
    neonIntensity: 0.88,
    neonPulseHz: 1.25,
    foregroundAccents: {
      skylineFar: 0x6f5a4f,
      skylineMid: 0x876759,
      skylineClose: 0xa17561,
      facade: 0xb98f74,
      foregroundDeco: 0x8b6d60,
      crateTint: 0x735746,
      crateAlpha: 0.92,
    },
  },
  neonCoast: {
    baseGradient: {
      topColor: 0x071726,
      bottomColor: 0x0b1220,
    },
    colorGrade: {
      color: 0x102334,
      alpha: 0.06,
    },
    gradeBlendMode: "multiply",
    rainIntensity: 0,
    rainDriftSpeed: 0,
    fogAlpha: 0.02,
    neonIntensity: 0.96,
    neonPulseHz: 1.8,
    foregroundAccents: {
      skylineFar: 0x3d6691,
      skylineMid: 0x4d7ea2,
      skylineClose: 0x6b9cc0,
      facade: 0x88a5b6,
      foregroundDeco: 0x5f8ca4,
      crateTint: 0x6a8f8c,
      crateAlpha: 0.8,
    },
  },
  crimsonHarbor: {
    baseGradient: {
      topColor: 0x1f0c14,
      bottomColor: 0x0c0e16,
    },
    colorGrade: {
      color: 0x251018,
      alpha: 0.08,
    },
    gradeBlendMode: "overlay",
    rainIntensity: 0.76,
    rainDriftSpeed: 0.74,
    fogAlpha: 0.04,
    neonIntensity: 0.9,
    neonPulseHz: 1.28,
    foregroundAccents: {
      skylineFar: 0x6f566d,
      skylineMid: 0x875f78,
      skylineClose: 0x9f6678,
      facade: 0xb18a86,
      foregroundDeco: 0x806674,
      crateTint: 0x75604f,
      crateAlpha: 0.92,
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
