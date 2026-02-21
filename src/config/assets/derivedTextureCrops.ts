export interface DerivedTextureCrop {
  sourceKey: string;
  targetKey: string;
  sx: number;
  sy: number;
  width: number;
  height: number;
}

export const derivedTextureCrops: DerivedTextureCrop[] = [
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

export const derivedAssetKeys = derivedTextureCrops.map((entry) => entry.targetKey);
