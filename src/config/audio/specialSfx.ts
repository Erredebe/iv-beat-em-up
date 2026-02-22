export const SPECIAL_SFX_KEYS = ["sfx_special_kastro", "sfx_special_marina", "sfx_special_meneillos"] as const;
export type SpecialSfxKey = (typeof SPECIAL_SFX_KEYS)[number];
