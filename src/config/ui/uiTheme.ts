import { isFeatureEnabled } from "../features";

export interface UIThemeTokens {
  palette: {
    bgPrimary: string;
    panelFill: string;
    accentPink: string;
    accentBlue: string;
    textPrimary: string;
    textSecondary: string;
    textHighlight: string;
    accentGold: string;
  };
  typography: {
    title: string;
    subtitle: string;
    body: string;
    caption: string;
    hero: string;
    families: {
      uiTitle: string;
      uiBody: string;
      hudText: string;
    };
  };
  textStroke: {
    heavy: { color: string; thickness: number };
    medium: { color: string; thickness: number };
    light: { color: string; thickness: number };
  };
  panel: {
    fillAlpha: number;
    borderAlpha: number;
    borderWidth: number;
    highlightFill: string;
  };
}

const SYSTEM_PIXEL_STACK = "\"Courier New\", \"Lucida Console\", Monaco, monospace";

const baseFamilies = {
  uiTitle: SYSTEM_PIXEL_STACK,
  uiBody: SYSTEM_PIXEL_STACK,
  hudText: SYSTEM_PIXEL_STACK,
} as const;

const uiThemeClassic: UIThemeTokens = {
  palette: {
    bgPrimary: "#07040d",
    panelFill: "#05070f",
    accentPink: "#ff6fb5",
    accentBlue: "#68abff",
    textPrimary: "#f3f7ff",
    textSecondary: "#f3dceb",
    textHighlight: "#fff7cf",
    accentGold: "#f5ce7b",
  },
  typography: {
    title: "14px",
    subtitle: "11px",
    body: "12px",
    caption: "10px",
    hero: "34px",
    families: baseFamilies,
  },
  textStroke: {
    heavy: { color: "#18040f", thickness: 3 },
    medium: { color: "#061017", thickness: 1 },
    light: { color: "#04070b", thickness: 1 },
  },
  panel: {
    fillAlpha: 0.92,
    borderAlpha: 0.7,
    borderWidth: 2,
    highlightFill: "#182336",
  },
};

const uiThemeV2Tokens: UIThemeTokens = {
  palette: {
    bgPrimary: "#090717",
    panelFill: "#0d1020",
    accentPink: "#ff5ea8",
    accentBlue: "#7ab7ff",
    textPrimary: "#f8fbff",
    textSecondary: "#b8d8ef",
    textHighlight: "#ffe9b8",
    accentGold: "#ffc870",
  },
  typography: {
    title: "15px",
    subtitle: "12px",
    body: "12px",
    caption: "10px",
    hero: "34px",
    families: baseFamilies,
  },
  textStroke: {
    heavy: { color: "#12030e", thickness: 3 },
    medium: { color: "#0a1422", thickness: 1 },
    light: { color: "#060a14", thickness: 1 },
  },
  panel: {
    fillAlpha: 0.95,
    borderAlpha: 0.85,
    borderWidth: 2,
    highlightFill: "#182743",
  },
};

export function getUiThemeTokens(): UIThemeTokens {
  return isFeatureEnabled("uiThemeV2") ? uiThemeV2Tokens : uiThemeClassic;
}
