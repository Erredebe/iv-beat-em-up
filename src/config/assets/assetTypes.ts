export type AssetType = "image" | "spritesheet" | "audio";
export type AssetRole = "character" | "tileset" | "prop" | "background" | "audio" | "ui";
export type AssetPackId = "legacy_sms" | "arcade_90";

export interface AssetManifestEntry {
  key: string;
  path: string;
  type: AssetType;
  role: AssetRole;
  critical: boolean;
  pixelScale: 1 | 2 | 3;
  source: "OpenGameArt" | "Original" | "Kenney" | "itch.io" | "Freesound" | "Pixabay";
  author: string;
  license: "CC0" | "CC-BY";
  url: string;
  paletteProfile: string;
  scaleProfile: string;
  packId: AssetPackId;
  tags: string[];
  frameConfig?: {
    frameWidth: number;
    frameHeight: number;
  };
}

export function localAsset(path: string): string {
  return `/assets/external/${path}`;
}
