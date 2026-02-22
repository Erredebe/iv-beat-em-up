#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 128;
const FRAME_COUNT = 10;
const CLIPS = [
  "idle",
  "walk",
  "attack1",
  "attack2",
  "attack3",
  "air_attack",
  "special",
  "hurt",
  "knockdown",
  "getup",
];
const ATTACK_CLIPS = new Set(["attack1", "attack2", "attack3", "air_attack", "special"]);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SPRITES_DIR = path.join(PROJECT_ROOT, "public", "assets", "external", "arcade", "sprites");
const SOURCE_DIR = path.join(PROJECT_ROOT, "scripts", "art", "source");

const OWNER_PROFILES = {
  boxeador: {
    sourceOwner: "player",
    contrast: 1.08,
    tint: { r: 1.06, g: 0.94, b: 0.9 },
    attackScale: 1.05,
    attackMinHeightRatio: 0.98,
    xShift: 0,
    yShift: 0,
  },
  veloz: {
    sourceOwner: "player",
    contrast: 1.05,
    tint: { r: 0.9, g: 1.02, b: 1.14 },
    attackScale: 1,
    attackMinHeightRatio: 0.96,
    xShift: 0,
    yShift: -1,
  },
  tecnico: {
    sourceOwner: "player",
    contrast: 1.1,
    tint: { r: 1.0, g: 0.98, b: 0.92 },
    attackScale: 1.02,
    attackMinHeightRatio: 0.97,
    xShift: 0,
    yShift: 0,
  },
  enemy: {
    sourceOwner: "enemy",
    contrast: 1.04,
    tint: { r: 1.0, g: 1.0, b: 1.0 },
    attackScale: 1,
    attackMinHeightRatio: 0.95,
    xShift: 0,
    yShift: 0,
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function writePng(filePath, png) {
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function createEmptyFrame() {
  return new Uint8Array(FRAME_WIDTH * FRAME_HEIGHT * 4);
}

function frameIndexToSheetOffset(frameIndex, x, y) {
  return ((y * FRAME_WIDTH * FRAME_COUNT) + frameIndex * FRAME_WIDTH + x) * 4;
}

function frameOffset(x, y) {
  return (y * FRAME_WIDTH + x) * 4;
}

function extractFrame(png, frameIndex) {
  const out = createEmptyFrame();
  const sourceStartX = frameIndex * FRAME_WIDTH;
  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const srcIndex = ((y * png.width) + sourceStartX + x) * 4;
      const dstIndex = frameOffset(x, y);
      out[dstIndex] = png.data[srcIndex];
      out[dstIndex + 1] = png.data[srcIndex + 1];
      out[dstIndex + 2] = png.data[srcIndex + 2];
      out[dstIndex + 3] = png.data[srcIndex + 3];
    }
  }
  return out;
}

function drawFrame(sheet, frameData, frameIndex) {
  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const src = frameOffset(x, y);
      const dst = frameIndexToSheetOffset(frameIndex, x, y);
      sheet.data[dst] = frameData[src];
      sheet.data[dst + 1] = frameData[src + 1];
      sheet.data[dst + 2] = frameData[src + 2];
      sheet.data[dst + 3] = frameData[src + 3];
    }
  }
}

function findBoundingBox(frameData) {
  let minX = FRAME_WIDTH;
  let maxX = -1;
  let minY = FRAME_HEIGHT;
  let maxY = -1;
  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const alpha = frameData[frameOffset(x, y) + 3];
      if (alpha === 0) {
        continue;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) {
    return null;
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    bottomPad: FRAME_HEIGHT - 1 - maxY,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function resolveReferenceMetrics(ownerProfile) {
  const idlePath = path.join(SOURCE_DIR, `${ownerProfile.sourceOwner}_idle_strip10.png`);
  const idleSheet = readPng(idlePath);
  const heights = [];
  const bottomPads = [];
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const framePixels = extractFrame(idleSheet, frame);
    const box = findBoundingBox(framePixels);
    if (!box) {
      continue;
    }
    heights.push(box.height);
    bottomPads.push(box.bottomPad);
  }
  return {
    referenceHeight: Math.round(median(heights)),
    referenceBottomPad: Math.round(median(bottomPads)),
  };
}

function applyColorStyle(frameData, ownerProfile) {
  const out = frameData.slice();
  for (let i = 0; i < out.length; i += 4) {
    const alpha = out[i + 3];
    if (alpha === 0) {
      continue;
    }
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];

    const contrastedR = (r - 128) * ownerProfile.contrast + 128;
    const contrastedG = (g - 128) * ownerProfile.contrast + 128;
    const contrastedB = (b - 128) * ownerProfile.contrast + 128;

    out[i] = clamp(Math.round(contrastedR * ownerProfile.tint.r), 0, 255);
    out[i + 1] = clamp(Math.round(contrastedG * ownerProfile.tint.g), 0, 255);
    out[i + 2] = clamp(Math.round(contrastedB * ownerProfile.tint.b), 0, 255);
  }
  return out;
}

function resampleToTarget(frameData, box, scale) {
  if (!box || Math.abs(scale - 1) < 0.001) {
    return frameData;
  }
  const out = createEmptyFrame();
  const centerX = (box.minX + box.maxX) * 0.5;
  const footY = box.maxY;

  for (let y = box.minY; y <= box.maxY; y += 1) {
    for (let x = box.minX; x <= box.maxX; x += 1) {
      const srcIndex = frameOffset(x, y);
      const alpha = frameData[srcIndex + 3];
      if (alpha === 0) {
        continue;
      }
      const mappedX = Math.round((x - centerX) * scale + centerX);
      const mappedY = Math.round((y - footY) * scale + footY);
      if (mappedX < 0 || mappedX >= FRAME_WIDTH || mappedY < 0 || mappedY >= FRAME_HEIGHT) {
        continue;
      }
      const dstIndex = frameOffset(mappedX, mappedY);
      out[dstIndex] = frameData[srcIndex];
      out[dstIndex + 1] = frameData[srcIndex + 1];
      out[dstIndex + 2] = frameData[srcIndex + 2];
      out[dstIndex + 3] = frameData[srcIndex + 3];
    }
  }
  return out;
}

function shiftFrame(frameData, shiftX, shiftY) {
  if (shiftX === 0 && shiftY === 0) {
    return frameData;
  }
  const out = createEmptyFrame();
  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const srcX = x - shiftX;
      const srcY = y - shiftY;
      if (srcX < 0 || srcX >= FRAME_WIDTH || srcY < 0 || srcY >= FRAME_HEIGHT) {
        continue;
      }
      const dst = frameOffset(x, y);
      const src = frameOffset(srcX, srcY);
      out[dst] = frameData[src];
      out[dst + 1] = frameData[src + 1];
      out[dst + 2] = frameData[src + 2];
      out[dst + 3] = frameData[src + 3];
    }
  }
  return out;
}

function normalizeFrame(frameData, clipName, ownerProfile, referenceMetrics) {
  const box = findBoundingBox(frameData);
  if (!box) {
    return frameData;
  }

  const minHeight = ATTACK_CLIPS.has(clipName)
    ? Math.round(referenceMetrics.referenceHeight * ownerProfile.attackMinHeightRatio)
    : 0;
  const targetHeight = ATTACK_CLIPS.has(clipName)
    ? Math.max(minHeight, Math.round(box.height * ownerProfile.attackScale))
    : box.height;
  const scale = clamp(targetHeight / Math.max(1, box.height), 0.92, 1.12);
  const scaled = resampleToTarget(frameData, box, scale);
  const scaledBox = findBoundingBox(scaled);
  if (!scaledBox) {
    return scaled;
  }

  const baselineShift = referenceMetrics.referenceBottomPad - scaledBox.bottomPad;
  const shifted = shiftFrame(scaled, ownerProfile.xShift, ownerProfile.yShift + baselineShift);
  return shifted;
}

function buildOwnerSheets(ownerName, ownerProfile) {
  const referenceMetrics = resolveReferenceMetrics(ownerProfile);
  for (const clipName of CLIPS) {
    const sourcePath = path.join(SOURCE_DIR, `${ownerProfile.sourceOwner}_${clipName}_strip10.png`);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing source spritesheet: ${sourcePath}`);
    }
    const sourceSheet = readPng(sourcePath);
    const outSheet = new PNG({
      width: FRAME_WIDTH * FRAME_COUNT,
      height: FRAME_HEIGHT,
      colorType: 6,
    });

    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      const sourceFrame = extractFrame(sourceSheet, frame);
      const normalized = normalizeFrame(sourceFrame, clipName, ownerProfile, referenceMetrics);
      const styled = applyColorStyle(normalized, ownerProfile);
      drawFrame(outSheet, styled, frame);
    }

    const targetPath = path.join(SPRITES_DIR, `${ownerName}_${clipName}_strip10.png`);
    writePng(targetPath, outSheet);
    console.log(`generated ${path.relative(PROJECT_ROOT, targetPath)}`);
  }
}

function main() {
  if (!fs.existsSync(SPRITES_DIR)) {
    throw new Error(`Sprites directory not found: ${SPRITES_DIR}`);
  }
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source sprites directory not found: ${SOURCE_DIR}`);
  }
  for (const [ownerName, ownerProfile] of Object.entries(OWNER_PROFILES)) {
    buildOwnerSheets(ownerName, ownerProfile);
  }
}

main();
