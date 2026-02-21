import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { derivedAssetKeys, derivedTextureCrops } from "./derivedTextureCrops";

const SOURCE_FILE_BY_KEY: Record<string, string> = {
  street_sheet: "public/assets/external/sprites/street_sheet.png",
  street_props: "public/assets/external/sprites/street_props.png",
  street_tileset: "public/assets/external/sprites/street_tileset.png",
  city_far: "public/assets/external/backgrounds/city_far.png",
  city_mid: "public/assets/external/backgrounds/city_mid.png",
  city_close: "public/assets/external/backgrounds/city_close.png",
};

const MIN_ALPHA_COVERAGE_BY_TARGET: Partial<Record<string, number>> = {
  prop_booth: 50,
  prop_crate: 50,
  prop_car: 50,
  city_far_band: 40,
  city_mid_band: 15,
  city_close_band: 15,
};

function readPng(filePath: string): PNG {
  const content = readFileSync(resolve(process.cwd(), filePath));
  return PNG.sync.read(content);
}

function alphaCoveragePercent(source: PNG, sx: number, sy: number, width: number, height: number): number {
  let nonTransparent = 0;
  const total = width * height;
  for (let y = sy; y < sy + height; y += 1) {
    for (let x = sx; x < sx + width; x += 1) {
      const alphaIndex = (source.width * y + x) * 4 + 3;
      if (source.data[alphaIndex] > 0) {
        nonTransparent += 1;
      }
    }
  }
  return (nonTransparent * 100) / total;
}

describe("derived texture crops", () => {
  it("exposes consistent derived keys", () => {
    expect(derivedAssetKeys).toEqual(derivedTextureCrops.map((entry) => entry.targetKey));
  });

  it("keeps every crop inside source bounds and with meaningful alpha coverage", () => {
    const pngCache = new Map<string, PNG>();

    for (const crop of derivedTextureCrops) {
      const sourceFile = SOURCE_FILE_BY_KEY[crop.sourceKey];
      expect(sourceFile, `Missing file mapping for ${crop.sourceKey}`).toBeDefined();
      if (!sourceFile) {
        continue;
      }

      let source = pngCache.get(crop.sourceKey);
      if (!source) {
        source = readPng(sourceFile);
        pngCache.set(crop.sourceKey, source);
      }

      expect(crop.sx).toBeGreaterThanOrEqual(0);
      expect(crop.sy).toBeGreaterThanOrEqual(0);
      expect(crop.width).toBeGreaterThan(0);
      expect(crop.height).toBeGreaterThan(0);
      expect(crop.sx + crop.width).toBeLessThanOrEqual(source.width);
      expect(crop.sy + crop.height).toBeLessThanOrEqual(source.height);

      const minCoverage = MIN_ALPHA_COVERAGE_BY_TARGET[crop.targetKey];
      if (minCoverage !== undefined) {
        const coverage = alphaCoveragePercent(source, crop.sx, crop.sy, crop.width, crop.height);
        expect(coverage, `${crop.targetKey} alpha coverage below expected minimum`).toBeGreaterThanOrEqual(minCoverage);
      }
    }
  });
});
