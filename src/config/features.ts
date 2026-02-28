export interface FeatureFlags {
  combatRework: boolean;
  enemyRoster: boolean;
  stagePack: boolean;
  arcadeHud: boolean;
  characterSelect: boolean;
  storyIntro: boolean;
  breakableProps: boolean;
  enhancedSfx: boolean;
  uiThemeV2: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  combatRework: true,
  enemyRoster: true,
  stagePack: true,
  arcadeHud: true,
  characterSelect: true,
  storyIntro: true,
  breakableProps: true,
  enhancedSfx: true,
  uiThemeV2: false,
};

const STORAGE_KEY = "spain90.featureFlags";

function parseFlagValue(value: string | null): boolean | null {
  if (value === null) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "off") {
    return false;
  }
  return null;
}

function resolveStorageOverrides(): Partial<FeatureFlags> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof FeatureFlags, unknown>>;
    const overrides: Partial<FeatureFlags> = {};
    for (const key of Object.keys(DEFAULT_FEATURE_FLAGS) as Array<keyof FeatureFlags>) {
      const value = parsed[key];
      if (typeof value === "boolean") {
        overrides[key] = value;
      }
    }
    return overrides;
  } catch {
    return {};
  }
}

function resolveQueryOverrides(): Partial<FeatureFlags> {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const overrides: Partial<FeatureFlags> = {};
  for (const key of Object.keys(DEFAULT_FEATURE_FLAGS) as Array<keyof FeatureFlags>) {
    const direct = parseFlagValue(params.get(key));
    if (direct !== null) {
      overrides[key] = direct;
      continue;
    }

    const prefixed = parseFlagValue(params.get(`ff_${key}`));
    if (prefixed !== null) {
      overrides[key] = prefixed;
    }
  }
  return overrides;
}

export function resolveFeatureFlags(): FeatureFlags {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...resolveStorageOverrides(),
    ...resolveQueryOverrides(),
  };
}

export const featureFlags: FeatureFlags = resolveFeatureFlags();

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

export function persistFeatureFlags(overrides: Partial<FeatureFlags>): void {
  if (typeof window === "undefined") {
    return;
  }

  const next = {
    ...featureFlags,
    ...overrides,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
