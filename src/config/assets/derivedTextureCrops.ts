import { isFeatureEnabled } from "../features";

export interface DerivedTextureCrop {
  sourceKey: string;
  targetKey: string;
  sx: number;
  sy: number;
  width: number;
  height: number;
}

const LEGACY_DERIVED_TEXTURE_CROPS: DerivedTextureCrop[] = [
  {
    sourceKey: "street_sheet",
    targetKey: "street_clean_tileset",
    sx: 64,
    sy: 20,
    width: 736,
    height: 192,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_booth",
    sx: 0,
    sy: 0,
    width: 48,
    height: 58,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_crate",
    sx: 70,
    sy: 6,
    width: 36,
    height: 44,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_car",
    sx: 0,
    sy: 64,
    width: 32,
    height: 48,
  },
  {
    sourceKey: "city_far",
    targetKey: "city_far_band",
    sx: 3360,
    sy: 300,
    width: 1024,
    height: 120,
  },
  {
    sourceKey: "city_mid",
    targetKey: "city_mid_band",
    sx: 864,
    sy: 360,
    width: 1024,
    height: 120,
  },
  {
    sourceKey: "city_close",
    targetKey: "city_close_band",
    sx: 3328,
    sy: 420,
    width: 1024,
    height: 120,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "hud_frame",
    sx: 0,
    sy: 0,
    width: 16,
    height: 16,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "ui_btn",
    sx: 16,
    sy: 16,
    width: 16,
    height: 16,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "hit_spark",
    sx: 80,
    sy: 64,
    width: 16,
    height: 16,
  },
];

const ARCADE_DERIVED_TEXTURE_CROPS: DerivedTextureCrop[] = [
  {
    sourceKey: "street_sheet",
    targetKey: "street_clean_tileset",
    sx: 128,
    sy: 40,
    width: 1472,
    height: 384,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_booth",
    sx: 0,
    sy: 0,
    width: 96,
    height: 116,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_crate",
    sx: 140,
    sy: 12,
    width: 72,
    height: 88,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_car",
    sx: 0,
    sy: 128,
    width: 64,
    height: 96,
  },
  {
    sourceKey: "city_far",
    targetKey: "city_far_band",
    sx: 3360,
    sy: 300,
    width: 1024,
    height: 120,
  },
  {
    sourceKey: "city_mid",
    targetKey: "city_mid_band",
    sx: 864,
    sy: 360,
    width: 1024,
    height: 120,
  },
  {
    sourceKey: "city_close",
    targetKey: "city_close_band",
    sx: 3328,
    sy: 420,
    width: 1024,
    height: 120,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "hud_frame",
    sx: 0,
    sy: 0,
    width: 32,
    height: 32,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "ui_btn",
    sx: 32,
    sy: 32,
    width: 32,
    height: 32,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "hit_spark",
    sx: 160,
    sy: 128,
    width: 32,
    height: 32,
  },
];

export const derivedTextureCrops = isFeatureEnabled("arcadeArt") ? ARCADE_DERIVED_TEXTURE_CROPS : LEGACY_DERIVED_TEXTURE_CROPS;

export const derivedAssetKeys = derivedTextureCrops.map((entry) => entry.targetKey);
