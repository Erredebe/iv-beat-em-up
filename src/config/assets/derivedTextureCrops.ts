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
    sx: 896,
    sy: 40,
    width: 640,
    height: 384,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_booth_front",
    sx: 0,
    sy: 128,
    width: 64,
    height: 96,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_container",
    sx: 160,
    sy: 48,
    width: 64,
    height: 80,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_crate",
    sx: 0,
    sy: 0,
    width: 96,
    height: 128,
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

export const derivedAssetKeys = derivedTextureCrops.map((entry) => entry.targetKey);
