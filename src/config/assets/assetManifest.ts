import { derivedAssetKeys } from "./derivedTextureCrops";
import type { AssetManifestEntry } from "./assetTypes";
import { arcadeManifest } from "./packs/arcadeManifest";

export type { AssetManifestEntry } from "./assetTypes";
export { derivedAssetKeys };

export const allAssetManifest: AssetManifestEntry[] = [...arcadeManifest];

export const assetManifest: AssetManifestEntry[] = arcadeManifest;

export const requiredAssetKeys = [
  ...assetManifest.filter((entry) => entry.critical).map((entry) => entry.key),
  ...derivedAssetKeys,
  "utility-white",
] as const;
