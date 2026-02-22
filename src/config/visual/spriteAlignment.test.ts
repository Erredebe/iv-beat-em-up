import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { getFighterAnimationSet, type AnimationClipId, type AnimationOwner } from "./fighterAnimationSets";
import { fighterVisualProfiles, type SpritePixelOffset } from "./fighterVisualProfiles";

function readPng(path: string): PNG {
  const content = readFileSync(resolve(process.cwd(), path));
  return PNG.sync.read(content);
}

function getBottomPadding(png: PNG, frameIndex: number, frameWidth: number): number {
  const startX = frameIndex * frameWidth;
  for (let y = png.height - 1; y >= 0; y -= 1) {
    for (let x = startX; x < startX + frameWidth; x += 1) {
      const alphaIndex = (png.width * y + x) * 4 + 3;
      if (png.data[alphaIndex] > 0) {
        return png.height - 1 - y;
      }
    }
  }
  return png.height;
}

function getFrameOffset(
  profileId: AnimationOwner,
  clipId: AnimationClipId,
  frameIndex: number,
): SpritePixelOffset {
  const offsets = fighterVisualProfiles[profileId].frameOffsetByClip[clipId];
  if (!offsets || offsets.length === 0) {
    return { x: 0, y: 0 };
  }
  return offsets[frameIndex] ?? { x: 0, y: 0 };
}

describe("fighter sprite alignment", () => {
  it("keeps expected 64x128 source dimensions for every arcade runtime sprite", () => {
    for (const profileId of ["boxeador", "veloz", "tecnico", "enemy"] as AnimationOwner[]) {
      const animationSet = getFighterAnimationSet(profileId);
      for (const clipId of Object.keys(animationSet.clips) as AnimationClipId[]) {
        const clip = animationSet.clips[clipId];
        const path = `public/assets/external/arcade/sprites/${clip.textureKey}.png`;
        const png = readPng(path);
        expect(png.height, `${path} height mismatch`).toBe(128);
        expect(png.width, `${path} width mismatch`).toBe(64 * clip.frameCount);

        const frameOffsets = fighterVisualProfiles[profileId].frameOffsetByClip[clipId];
        if (frameOffsets && frameOffsets.length > 0) {
          expect(frameOffsets.length, `${profileId} ${clipId} frame offsets length mismatch`).toBe(clip.frameCount);
        }
      }
    }
  });

  it("keeps visual feet near the baseline across frames", () => {
    for (const profileId of ["boxeador", "veloz", "tecnico", "enemy"] as AnimationOwner[]) {
      const animationSet = getFighterAnimationSet(profileId);
      for (const clipId of Object.keys(animationSet.clips) as AnimationClipId[]) {
        const clip = animationSet.clips[clipId];
        const png = readPng(`public/assets/external/arcade/sprites/${clip.textureKey}.png`);

        for (let frame = 0; frame < clip.frameCount; frame += 1) {
          const bottomPad = getBottomPadding(png, frame, 64);
          const frameOffset = getFrameOffset(profileId, clipId, frame);
          const effectivePad = bottomPad - frameOffset.y;
          expect(
            effectivePad,
            `${profileId} ${clipId} frame ${frame} is too far from baseline`,
          ).toBeLessThanOrEqual(24);
        }
      }
    }
  });
});
