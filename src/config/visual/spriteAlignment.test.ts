import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { fighterVisualProfiles, type SpritePixelOffset, type TextureStateId } from "./fighterVisualProfiles";
import type { FighterState } from "../../types/combat";

interface TextureCheck {
  textureStateId: TextureStateId;
  fileSuffix: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  stateForOffset: FighterState;
  tolerancePx: number;
}

const TEXTURE_CHECKS: TextureCheck[] = [
  {
    textureStateId: "idle_strip4",
    fileSuffix: "idle_strip4",
    frameCount: 4,
    frameWidth: 16,
    frameHeight: 32,
    stateForOffset: "IDLE",
    tolerancePx: 1,
  },
  {
    textureStateId: "walk_strip4",
    fileSuffix: "walk_strip4",
    frameCount: 4,
    frameWidth: 16,
    frameHeight: 32,
    stateForOffset: "WALK",
    tolerancePx: 1,
  },
  {
    textureStateId: "punch1",
    fileSuffix: "punch1",
    frameCount: 1,
    frameWidth: 24,
    frameHeight: 32,
    stateForOffset: "ATTACK_1",
    tolerancePx: 2,
  },
  {
    textureStateId: "punch2",
    fileSuffix: "punch2",
    frameCount: 1,
    frameWidth: 24,
    frameHeight: 32,
    stateForOffset: "ATTACK_2",
    tolerancePx: 2,
  },
  {
    textureStateId: "kick1",
    fileSuffix: "kick1",
    frameCount: 1,
    frameWidth: 24,
    frameHeight: 32,
    stateForOffset: "AIR_ATTACK",
    tolerancePx: 2,
  },
  {
    textureStateId: "kick2",
    fileSuffix: "kick2",
    frameCount: 1,
    frameWidth: 24,
    frameHeight: 32,
    stateForOffset: "SPECIAL",
    tolerancePx: 2,
  },
  {
    textureStateId: "hurt",
    fileSuffix: "hurt",
    frameCount: 1,
    frameWidth: 16,
    frameHeight: 32,
    stateForOffset: "HIT",
    tolerancePx: 1,
  },
  {
    textureStateId: "knockdown",
    fileSuffix: "knockdown",
    frameCount: 1,
    frameWidth: 24,
    frameHeight: 32,
    stateForOffset: "KNOCKDOWN",
    tolerancePx: 3,
  },
  {
    textureStateId: "getup",
    fileSuffix: "getup",
    frameCount: 1,
    frameWidth: 16,
    frameHeight: 32,
    stateForOffset: "GETUP",
    tolerancePx: 1,
  },
];

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

function getStateOffset(state: FighterState, profileId: "player" | "enemy"): SpritePixelOffset {
  const profile = fighterVisualProfiles[profileId];
  const stateOffset = profile.stateOffsetByState[state];
  if (stateOffset) {
    return stateOffset;
  }
  return {
    x: 0,
    y: profile.baselineOffsetByState?.[state] ?? 0,
  };
}

function getFrameOffset(
  profileId: "player" | "enemy",
  textureStateId: TextureStateId,
  frameIndex: number,
): SpritePixelOffset {
  const offsets = fighterVisualProfiles[profileId].frameOffsetByTexture[textureStateId];
  if (!offsets || offsets.length === 0) {
    return { x: 0, y: 0 };
  }
  return offsets[frameIndex] ?? { x: 0, y: 0 };
}

describe("fighter sprite alignment", () => {
  it("keeps expected source dimensions for every runtime sprite", () => {
    for (const profileId of ["player", "enemy"] as const) {
      for (const check of TEXTURE_CHECKS) {
        const path = `public/assets/external/sprites/${profileId}_${check.fileSuffix}.png`;
        const png = readPng(path);
        expect(png.height, `${path} height mismatch`).toBe(check.frameHeight);
        expect(png.width, `${path} width mismatch`).toBe(check.frameWidth * check.frameCount);

        const frameOffsets = fighterVisualProfiles[profileId].frameOffsetByTexture[check.textureStateId];
        if (frameOffsets && frameOffsets.length > 0) {
          expect(frameOffsets.length, `${profileId} ${check.textureStateId} frame offsets length mismatch`).toBe(
            check.frameCount,
          );
        }
      }
    }
  });

  it("keeps visual feet baseline stable within per-state tolerance", () => {
    for (const profileId of ["player", "enemy"] as const) {
      const idleCheck = TEXTURE_CHECKS.find((entry) => entry.textureStateId === "idle_strip4")!;
      const idlePng = readPng(`public/assets/external/sprites/${profileId}_${idleCheck.fileSuffix}.png`);
      const idleBottomPad = getBottomPadding(idlePng, 0, idleCheck.frameWidth);
      const idleStateOffset = getStateOffset("IDLE", profileId);
      const idleFrameOffset = getFrameOffset(profileId, "idle_strip4", 0);
      const referenceFootAlignment =
        fighterVisualProfiles[profileId].spriteAnchorOffsetY +
        idleStateOffset.y +
        idleFrameOffset.y -
        idleBottomPad * fighterVisualProfiles[profileId].scale;

      for (const check of TEXTURE_CHECKS) {
        const png = readPng(`public/assets/external/sprites/${profileId}_${check.fileSuffix}.png`);
        const stateOffset = getStateOffset(check.stateForOffset, profileId);

        for (let frame = 0; frame < check.frameCount; frame += 1) {
          const bottomPad = getBottomPadding(png, frame, check.frameWidth);
          const frameOffset = getFrameOffset(profileId, check.textureStateId, frame);
          const effectiveFootAlignment =
            fighterVisualProfiles[profileId].spriteAnchorOffsetY +
            stateOffset.y +
            frameOffset.y -
            bottomPad * fighterVisualProfiles[profileId].scale;
          const delta = Math.abs(effectiveFootAlignment - referenceFootAlignment);
          expect(
            delta,
            `${profileId} ${check.textureStateId} frame ${frame} exceeds baseline tolerance (${check.tolerancePx}px)`,
          ).toBeLessThanOrEqual(check.tolerancePx);
        }
      }
    }
  });
});
