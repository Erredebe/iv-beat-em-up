import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifest, derivedAssetKeys } from "./assetManifest";

function extractBacktickTokens(markdown: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of markdown.matchAll(/`([^`]+)`/g)) {
    const raw = match[1];
    tokens.add(raw.trim());
    for (const chunk of raw.split(",")) {
      const candidate = chunk.trim();
      if (candidate.length > 0) {
        tokens.add(candidate);
      }
    }
  }
  return tokens;
}

describe("assets legal coverage", () => {
  it("documents every runtime asset key in ASSETS.md", () => {
    const assetsMd = readFileSync(resolve(process.cwd(), "ASSETS.md"), "utf8");
    const documented = extractBacktickTokens(assetsMd);

    for (const entry of assetManifest) {
      expect(documented.has(entry.key), `Missing ${entry.key} in ASSETS.md`).toBe(true);
    }

    for (const derivedKey of derivedAssetKeys) {
      expect(documented.has(derivedKey), `Missing derived ${derivedKey} in ASSETS.md`).toBe(true);
    }
  });
});
