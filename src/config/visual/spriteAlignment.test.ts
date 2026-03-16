import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { getFighterAnimationSet, type AnimationClipId, type AnimationOwner } from "./fighterAnimationSets";
import { getFighterSpriteSpec } from "./fighterSpriteSpecs";
import { fighterVisualProfiles, type SpritePixelOffset } from "./fighterVisualProfiles";

const FLOOR_CLIP_STATE: Record<"knockdown" | "getup", "KNOCKDOWN" | "GETUP"> = {
  knockdown: "KNOCKDOWN",
  getup: "GETUP",
};

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
  it("keeps expected source dimensions for every arcade runtime sprite", () => {
    for (const profileId of ["kastro", "marina", "meneillos", "enemy"] as AnimationOwner[]) {
      const animationSet = getFighterAnimationSet(profileId);
      const spriteSpec = getFighterSpriteSpec(profileId);
      for (const clipId of Object.keys(animationSet.clips) as AnimationClipId[]) {
        const clip = animationSet.clips[clipId];
        const path = `public/assets/external/arcade/sprites/${clip.textureKey}.png`;
        const png = readPng(path);
        expect(png.height, `${path} height mismatch`).toBe(spriteSpec.frameSize.height);
        expect(png.width, `${path} width mismatch`).toBe(spriteSpec.frameSize.width * clip.frameCount);

        const frameOffsets = fighterVisualProfiles[profileId].frameOffsetByClip[clipId];
        if (frameOffsets && frameOffsets.length > 0) {
          expect(frameOffsets.length, `${profileId} ${clipId} frame offsets length mismatch`).toBe(clip.frameCount);
        }
      }
    }
  });

  it("keeps visual feet near the baseline across frames", () => {
    const groundedClips: AnimationClipId[] = ["idle", "walk", "attack1", "attack2", "attack3", "special", "hurt"];
    for (const profileId of ["kastro", "marina", "meneillos", "enemy"] as AnimationOwner[]) {
      const animationSet = getFighterAnimationSet(profileId);
      const spriteSpec = getFighterSpriteSpec(profileId);
      const frameWidth = spriteSpec.frameSize.width;
      const baselineTolerancePx = Math.ceil(spriteSpec.frameSize.height * 0.14);

      for (const clipId of groundedClips) {
        const clip = animationSet.clips[clipId];
        const png = readPng(`public/assets/external/arcade/sprites/${clip.textureKey}.png`);

        for (let frame = 0; frame < clip.frameCount; frame += 1) {
          const bottomPad = getBottomPadding(png, frame, frameWidth);
          const frameOffset = getFrameOffset(profileId, clipId, frame);
          const effectivePad = bottomPad - frameOffset.y;
          expect(
            effectivePad,
            `${profileId} ${clipId} frame ${frame} is too far from baseline`,
          ).toBeLessThanOrEqual(baselineTolerancePx);
        }
      }
    }
  });

  it("keeps floor animations visually locked to the pavement", () => {
    const floorClips = ["knockdown", "getup"] as const;
    for (const profileId of ["kastro", "marina", "meneillos", "enemy"] as AnimationOwner[]) {
      const animationSet = getFighterAnimationSet(profileId);
      const spriteSpec = getFighterSpriteSpec(profileId);
      const frameWidth = spriteSpec.frameSize.width;

      for (const clipId of floorClips) {
        const clip = animationSet.clips[clipId];
        const png = readPng(`public/assets/external/arcade/sprites/${clip.textureKey}.png`);
        const stateOffsetY = fighterVisualProfiles[profileId].stateOffsetByState[FLOOR_CLIP_STATE[clipId]].y;
        const effectivePads: number[] = [];

        for (let frame = 0; frame < clip.frameCount; frame += 1) {
          const bottomPad = getBottomPadding(png, frame, frameWidth);
          const frameOffset = getFrameOffset(profileId, clipId, frame);
          effectivePads.push(bottomPad - stateOffsetY - frameOffset.y);
        }

        expect(
          Math.max(...effectivePads) - Math.min(...effectivePads),
          `${profileId} ${clipId} drifts away from the pavement between frames`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });
});
