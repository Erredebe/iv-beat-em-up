import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { assetManifest } from "./assetManifest";
import { derivedAssetKeys, derivedTextureCrops } from "./derivedTextureCrops";

const MIN_ALPHA_COVERAGE_BY_TARGET: Partial<Record<string, number>> = {
  prop_booth: 35,
  prop_crate: 25,
  prop_car: 25,
  city_far_band: 8,
  city_mid_band: 8,
  city_close_band: 8,
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

function toLocalPath(runtimePath: string): string {
  if (!runtimePath.startsWith("/assets/external/")) {
    throw new Error(`Unexpected runtime asset path: ${runtimePath}`);
  }
  return `public${runtimePath}`;
}

describe("derived texture crops", () => {
  it("exposes consistent derived keys", () => {
    expect(derivedAssetKeys).toEqual(derivedTextureCrops.map((entry) => entry.targetKey));
  });

  it("keeps every crop inside source bounds and with meaningful alpha coverage", () => {
    const pngCache = new Map<string, PNG>();

    for (const crop of derivedTextureCrops) {
      const sourceEntry = assetManifest.find((entry) => entry.key === crop.sourceKey);
      expect(sourceEntry, `Missing source asset for ${crop.sourceKey}`).toBeDefined();
      if (!sourceEntry) {
        continue;
      }

      let source = pngCache.get(crop.sourceKey);
      if (!source) {
        source = readPng(toLocalPath(sourceEntry.path));
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
