import { isFeatureEnabled } from "../features";
import { derivedAssetKeys } from "./derivedTextureCrops";
import type { AssetManifestEntry } from "./assetTypes";
import { arcadeManifest } from "./packs/arcadeManifest";
import { legacyManifest } from "./packs/legacyManifest";

export type { AssetManifestEntry } from "./assetTypes";
export { derivedAssetKeys };

export const allAssetManifest: AssetManifestEntry[] = [...legacyManifest, ...arcadeManifest];

export const assetManifest: AssetManifestEntry[] = isFeatureEnabled("arcadeArt") ? arcadeManifest : legacyManifest;

export const requiredAssetKeys = [
  ...assetManifest.filter((entry) => entry.critical).map((entry) => entry.key),
  ...derivedAssetKeys,
  "utility-white",
] as const;
