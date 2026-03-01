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
    sx: 1792,
    sy: 80,
    width: 1280,
    height: 768,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_booth_front",
    sx: 0,
    sy: 512,
    width: 256,
    height: 384,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_container",
    sx: 640,
    sy: 192,
    width: 256,
    height: 320,
  },
  {
    sourceKey: "street_props",
    targetKey: "prop_crate",
    sx: 0,
    sy: 0,
    width: 384,
    height: 512,
  },
  {
    sourceKey: "city_far",
    targetKey: "city_far_band",
    sx: 6720,
    sy: 600,
    width: 2048,
    height: 240,
  },
  {
    sourceKey: "city_mid",
    targetKey: "city_mid_band",
    sx: 1728,
    sy: 720,
    width: 2048,
    height: 240,
  },
  {
    sourceKey: "city_close",
    targetKey: "city_close_band",
    sx: 6656,
    sy: 840,
    width: 2048,
    height: 240,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "hud_frame",
    sx: 0,
    sy: 0,
    width: 128,
    height: 128,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "ui_btn",
    sx: 128,
    sy: 128,
    width: 128,
    height: 128,
  },
  {
    sourceKey: "street_tileset",
    targetKey: "hit_spark",
    sx: 640,
    sy: 512,
    width: 128,
    height: 128,
  },
];

export const derivedAssetKeys = derivedTextureCrops.map((entry) => entry.targetKey);
