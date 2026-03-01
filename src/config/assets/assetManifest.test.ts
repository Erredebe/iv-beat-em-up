import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifest, derivedAssetKeys } from "./assetManifest";
import { ANIMATION_CLIP_IDS, ANIMATION_OWNERS, getFighterSpriteSpec } from "../visual/fighterSpriteSpecs";

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

  it("keeps fighter spritesheets aligned with fighter sprite specs", () => {
    const byKey = new Map(assetManifest.map((entry) => [entry.key, entry]));
    const expectedSpriteKeys = new Set<string>();

    for (const owner of ANIMATION_OWNERS) {
      const spriteSpec = getFighterSpriteSpec(owner);
      for (const clipId of ANIMATION_CLIP_IDS) {
        const required = spriteSpec.requiredClips[clipId];
        expectedSpriteKeys.add(required.textureKey);

        const entry = byKey.get(required.textureKey);
        expect(entry, `Missing manifest entry for ${owner}.${clipId} (${required.textureKey})`).toBeDefined();
        expect(entry?.type, `${required.textureKey} must be spritesheet`).toBe("spritesheet");
        expect(entry?.key.startsWith(`${owner}_`), `${required.textureKey} owner key mismatch`).toBe(true);
        expect(entry?.tags.includes(owner), `${required.textureKey} must include owner tag ${owner}`).toBe(true);
        expect(entry?.frameConfig?.frameWidth, `${required.textureKey} frameWidth mismatch`).toBe(
          spriteSpec.frameSize.width,
        );
        expect(entry?.frameConfig?.frameHeight, `${required.textureKey} frameHeight mismatch`).toBe(
          spriteSpec.frameSize.height,
        );
      }
    }

    const ownerPrefixedManifestSprites = assetManifest.filter(
      (entry) => entry.type === "spritesheet" && ANIMATION_OWNERS.some((owner) => entry.key.startsWith(`${owner}_`)),
    );
    for (const entry of ownerPrefixedManifestSprites) {
      expect(expectedSpriteKeys.has(entry.key), `Sprite ${entry.key} has no fighter sprite spec`).toBe(true);
    }
  });
});
