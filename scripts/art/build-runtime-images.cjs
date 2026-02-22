#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 128;
const FRAME_COUNT = 10;
const PORTRAIT_SIZE = 48;
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
const SYNTHESIZED_CLIPS = new Set(["attack1", "attack2", "attack3", "air_attack", "special", "hurt", "knockdown", "getup"]);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SPRITES_DIR = path.join(PROJECT_ROOT, "public", "assets", "external", "arcade", "sprites");
const UI_DIR = path.join(PROJECT_ROOT, "public", "assets", "external", "arcade", "ui");
const SOURCE_DIR = path.join(PROJECT_ROOT, "scripts", "art", "source");

const BASE_PALETTE = {
  OUTLINE: "0,0,0",
  DENIM_DARK: "0,0,170",
  DENIM_MID: "0,85,170",
  SKIN_SHADE: "255,85,0",
  SHOE: "170,170,170",
  SKIN_LIGHT: "255,170,85",
  DARK_ACCENT: "85,0,0",
  SHIRT: "255,255,255",
};

const OWNER_PROFILES = {
  kastro: {
    sourceOwner: "player",
    contrast: 1.02,
    tint: { r: 1.0, g: 1.0, b: 1.0 },
    attackScale: 1.03,
    attackMinHeightRatio: 0.98,
    scaleX: 1.1,
    scaleY: 1.04,
    xShift: 0,
    yShift: 0,
    rowWarp: [],
    palette: {
      [BASE_PALETTE.OUTLINE]: [14, 8, 8],
      [BASE_PALETTE.DENIM_DARK]: [30, 44, 132],
      [BASE_PALETTE.DENIM_MID]: [68, 94, 186],
      [BASE_PALETTE.SKIN_SHADE]: [214, 98, 58],
      [BASE_PALETTE.SKIN_LIGHT]: [252, 176, 128],
      [BASE_PALETTE.SHOE]: [116, 64, 38],
      [BASE_PALETTE.DARK_ACCENT]: [102, 24, 24],
      [BASE_PALETTE.SHIRT]: [255, 234, 206],
    },
    featureColors: {
      glove: [178, 46, 42],
      belt: [88, 24, 22],
      shoulder: [132, 34, 32],
      headband: [166, 38, 36],
    },
    portrait: {
      bgTop: [38, 8, 8],
      bgBottom: [84, 18, 18],
      border: [236, 134, 96],
      label: "K",
      labelColor: [246, 222, 188],
    },
  },
  marina: {
    sourceOwner: "player",
    contrast: 1.01,
    tint: { r: 1.0, g: 1.0, b: 1.0 },
    attackScale: 1,
    attackMinHeightRatio: 0.96,
    scaleX: 0.9,
    scaleY: 1.02,
    xShift: 0,
    yShift: -1,
    rowWarp: [],
    palette: {
      [BASE_PALETTE.OUTLINE]: [8, 20, 38],
      [BASE_PALETTE.DENIM_DARK]: [80, 32, 154],
      [BASE_PALETTE.DENIM_MID]: [134, 74, 220],
      [BASE_PALETTE.SKIN_SHADE]: [198, 92, 74],
      [BASE_PALETTE.SKIN_LIGHT]: [242, 172, 150],
      [BASE_PALETTE.SHOE]: [212, 232, 250],
      [BASE_PALETTE.DARK_ACCENT]: [18, 66, 128],
      [BASE_PALETTE.SHIRT]: [70, 214, 224],
    },
    featureColors: {
      hair: [38, 122, 210],
      ponytail: [76, 198, 252],
      ribbon: [234, 96, 180],
      jacket: [70, 214, 224],
      waist: [96, 66, 188],
    },
    portrait: {
      bgTop: [8, 24, 56],
      bgBottom: [22, 58, 124],
      border: [112, 220, 252],
      label: "M",
      labelColor: [216, 238, 255],
    },
  },
  meneillos: {
    sourceOwner: "player",
    contrast: 1.03,
    tint: { r: 1.0, g: 1.0, b: 1.0 },
    attackScale: 1.02,
    attackMinHeightRatio: 0.97,
    scaleX: 1.02,
    scaleY: 1.08,
    xShift: 0,
    yShift: 0,
    rowWarp: [],
    palette: {
      [BASE_PALETTE.OUTLINE]: [18, 24, 10],
      [BASE_PALETTE.DENIM_DARK]: [74, 86, 34],
      [BASE_PALETTE.DENIM_MID]: [120, 142, 62],
      [BASE_PALETTE.SKIN_SHADE]: [202, 110, 66],
      [BASE_PALETTE.SKIN_LIGHT]: [246, 188, 132],
      [BASE_PALETTE.SHOE]: [96, 62, 34],
      [BASE_PALETTE.DARK_ACCENT]: [70, 48, 20],
      [BASE_PALETTE.SHIRT]: [236, 214, 116],
    },
    featureColors: {
      capTop: [92, 66, 24],
      capBrim: [62, 44, 18],
      coat: [106, 82, 40],
      coatDark: [74, 56, 24],
      chest: [228, 182, 88],
    },
    portrait: {
      bgTop: [22, 28, 12],
      bgBottom: [54, 72, 24],
      border: [222, 206, 110],
      label: "N",
      labelColor: [248, 240, 198],
    },
  },
  enemy: {
    sourceOwner: "enemy",
    contrast: 1.04,
    tint: { r: 1.0, g: 1.0, b: 1.0 },
    attackScale: 1,
    attackMinHeightRatio: 0.95,
    scaleX: 1,
    scaleY: 1,
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

function setPngPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) {
    return;
  }
  const idx = (y * png.width + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
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
    const key = `${out[i]},${out[i + 1]},${out[i + 2]}`;
    const mapped = ownerProfile.palette && ownerProfile.palette[key];
    if (mapped) {
      out[i] = mapped[0];
      out[i + 1] = mapped[1];
      out[i + 2] = mapped[2];
      continue;
    }

    const contrastedR = (out[i] - 128) * ownerProfile.contrast + 128;
    const contrastedG = (out[i + 1] - 128) * ownerProfile.contrast + 128;
    const contrastedB = (out[i + 2] - 128) * ownerProfile.contrast + 128;

    out[i] = clamp(Math.round(contrastedR * ownerProfile.tint.r), 0, 255);
    out[i + 1] = clamp(Math.round(contrastedG * ownerProfile.tint.g), 0, 255);
    out[i + 2] = clamp(Math.round(contrastedB * ownerProfile.tint.b), 0, 255);
  }
  return out;
}

function resampleToTarget(frameData, box, scaleX, scaleY) {
  if (!box || (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001)) {
    return frameData;
  }
  const out = createEmptyFrame();
  const centerX = (box.minX + box.maxX) * 0.5;
  const footY = box.maxY;
  const dstMinX = clamp(Math.floor((box.minX - centerX) * scaleX + centerX) - 1, 0, FRAME_WIDTH - 1);
  const dstMaxX = clamp(Math.ceil((box.maxX - centerX) * scaleX + centerX) + 1, 0, FRAME_WIDTH - 1);
  const dstMinY = clamp(Math.floor((box.minY - footY) * scaleY + footY) - 1, 0, FRAME_HEIGHT - 1);
  const dstMaxY = clamp(Math.ceil((box.maxY - footY) * scaleY + footY) + 1, 0, FRAME_HEIGHT - 1);

  // Inverse mapping avoids transparent seams/columns when scaling attack frames.
  for (let y = dstMinY; y <= dstMaxY; y += 1) {
    for (let x = dstMinX; x <= dstMaxX; x += 1) {
      const srcX = Math.round((x - centerX) / scaleX + centerX);
      const srcY = Math.round((y - footY) / scaleY + footY);
      if (srcX < box.minX || srcX > box.maxX || srcY < box.minY || srcY > box.maxY) {
        continue;
      }
      const srcIndex = frameOffset(srcX, srcY);
      const alpha = frameData[srcIndex + 3];
      if (alpha === 0) {
        continue;
      }
      const dstIndex = frameOffset(x, y);
      out[dstIndex] = frameData[srcIndex];
      out[dstIndex + 1] = frameData[srcIndex + 1];
      out[dstIndex + 2] = frameData[srcIndex + 2];
      out[dstIndex + 3] = alpha;
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

function setPixel(frameData, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= FRAME_WIDTH || y < 0 || y >= FRAME_HEIGHT) {
    return;
  }
  const idx = frameOffset(x, y);
  frameData[idx] = r;
  frameData[idx + 1] = g;
  frameData[idx + 2] = b;
  frameData[idx + 3] = a;
}

function copyPixel(fromFrame, toFrame, srcX, srcY, dstX, dstY) {
  if (srcX < 0 || srcX >= FRAME_WIDTH || srcY < 0 || srcY >= FRAME_HEIGHT) {
    return;
  }
  if (dstX < 0 || dstX >= FRAME_WIDTH || dstY < 0 || dstY >= FRAME_HEIGHT) {
    return;
  }
  const src = frameOffset(srcX, srcY);
  const dst = frameOffset(dstX, dstY);
  const alpha = fromFrame[src + 3];
  if (alpha === 0) {
    return;
  }
  toFrame[dst] = fromFrame[src];
  toFrame[dst + 1] = fromFrame[src + 1];
  toFrame[dst + 2] = fromFrame[src + 2];
  toFrame[dst + 3] = alpha;
}

function drawHorizontal(frameData, xStart, xEnd, y, color) {
  const [r, g, b] = color;
  const start = Math.min(xStart, xEnd);
  const end = Math.max(xStart, xEnd);
  for (let x = start; x <= end; x += 1) {
    setPixel(frameData, x, y, r, g, b, 255);
  }
}

function drawVertical(frameData, x, yStart, yEnd, color) {
  const [r, g, b] = color;
  const start = Math.min(yStart, yEnd);
  const end = Math.max(yStart, yEnd);
  for (let y = start; y <= end; y += 1) {
    setPixel(frameData, x, y, r, g, b, 255);
  }
}

function drawRect(frameData, x, y, width, height, color) {
  if (width <= 0 || height <= 0) {
    return;
  }
  for (let yy = y; yy < y + height; yy += 1) {
    drawHorizontal(frameData, x, x + width - 1, yy, color);
  }
}

function drawDiagonalBlock(frameData, x, y, length, stepX, stepY, thickness, color) {
  for (let i = 0; i < length; i += 1) {
    drawRect(frameData, x + i * stepX, y + i * stepY, thickness, thickness, color);
  }
}

function rowScaleForY(rowWarp, minY, maxY, y) {
  if (!rowWarp || rowWarp.length === 0 || maxY <= minY) {
    return 1;
  }
  const ratio = (y - minY) / (maxY - minY);
  for (const warp of rowWarp) {
    if (ratio >= warp.from && ratio <= warp.to) {
      return warp.scaleX;
    }
  }
  return 1;
}

function applyRowWarp(frameData, box, rowWarp) {
  if (!box || !rowWarp || rowWarp.length === 0) {
    return frameData;
  }
  const out = createEmptyFrame();
  const centerX = (box.minX + box.maxX) * 0.5;
  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    if (y < box.minY || y > box.maxY) {
      for (let x = 0; x < FRAME_WIDTH; x += 1) {
        copyPixel(frameData, out, x, y, x, y);
      }
      continue;
    }
    const rowScale = rowScaleForY(rowWarp, box.minY, box.maxY, y);
    if (Math.abs(rowScale - 1) < 0.001) {
      for (let x = 0; x < FRAME_WIDTH; x += 1) {
        copyPixel(frameData, out, x, y, x, y);
      }
      continue;
    }
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const srcX = Math.round((x - centerX) / rowScale + centerX);
      copyPixel(frameData, out, srcX, y, x, y);
    }
  }
  return out;
}

function applyCharacterSilhouette(frameData, ownerName, ownerProfile, clipName, frameIndex) {
  void ownerName;
  void ownerProfile;
  void clipName;
  void frameIndex;
  return frameData;
}

function countOpaqueNeighbors(frameData, x, y) {
  let count = 0;
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) {
        continue;
      }
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || nx >= FRAME_WIDTH || ny < 0 || ny >= FRAME_HEIGHT) {
        continue;
      }
      if (frameData[frameOffset(nx, ny) + 3] > 0) {
        count += 1;
      }
    }
  }
  return count;
}

function removeIsolatedPixels(frameData, passes = 1) {
  let current = frameData;
  for (let pass = 0; pass < passes; pass += 1) {
    const out = current.slice();
    for (let y = 0; y < FRAME_HEIGHT; y += 1) {
      for (let x = 0; x < FRAME_WIDTH; x += 1) {
        const idx = frameOffset(x, y);
        if (current[idx + 3] === 0) {
          continue;
        }
        const neighbors = countOpaqueNeighbors(current, x, y);
        if (neighbors <= 1) {
          out[idx] = 0;
          out[idx + 1] = 0;
          out[idx + 2] = 0;
          out[idx + 3] = 0;
        }
      }
    }
    current = out;
  }
  return current;
}

function stabilizeClipFrames(frames, clipName) {
  if (frames.length === 0) {
    return frames;
  }
  const boxes = frames.map((frame) => findBoundingBox(frame));
  const centers = [];
  const bottomPads = [];
  for (const box of boxes) {
    if (!box) {
      continue;
    }
    centers.push((box.minX + box.maxX) * 0.5);
    bottomPads.push(box.bottomPad);
  }
  if (centers.length === 0 || bottomPads.length === 0) {
    return frames;
  }

  const targetCenter = median(centers);
  const targetBottomPad = Math.round(median(bottomPads));
  const preserveHorizontalMotion = SYNTHESIZED_CLIPS.has(clipName);
  const maxHorizontalShift = preserveHorizontalMotion ? 0 : (clipName === "walk" ? 1 : 2);
  const maxVerticalShift = clipName === "air_attack" ? 0 : 2;

  return frames.map((frame, frameIndex) => {
    const box = boxes[frameIndex];
    if (!box) {
      return frame;
    }
    const center = (box.minX + box.maxX) * 0.5;
    const shiftX = clamp(Math.round(targetCenter - center), -maxHorizontalShift, maxHorizontalShift);
    const shiftY = clamp(targetBottomPad - box.bottomPad, -maxVerticalShift, maxVerticalShift);
    return shiftFrame(frame, shiftX, shiftY);
  });
}

function isStaticSheet(png) {
  if (png.width !== FRAME_WIDTH * FRAME_COUNT || png.height !== FRAME_HEIGHT) {
    return false;
  }
  for (let frame = 1; frame < FRAME_COUNT; frame += 1) {
    for (let y = 0; y < FRAME_HEIGHT; y += 1) {
      for (let x = 0; x < FRAME_WIDTH; x += 1) {
        const base = frameIndexToSheetOffset(0, x, y);
        const curr = frameIndexToSheetOffset(frame, x, y);
        if (
          png.data[base] !== png.data[curr]
          || png.data[base + 1] !== png.data[curr + 1]
          || png.data[base + 2] !== png.data[curr + 2]
          || png.data[base + 3] !== png.data[curr + 3]
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function getCurveValue(curve, frameIndex, defaultValue = 0) {
  if (!curve || curve.length === 0) {
    return defaultValue;
  }
  const clampedFrame = clamp(frameIndex, 0, curve.length - 1);
  return curve[clampedFrame];
}

function getClipMotion(clipName, frameIndex) {
  const motionByClip = {
    attack1: {
      globalX: [-3, -2, -1, 0, 1, 2, 1, 0, -1, -2],
      globalY: [0, -1, -1, 0, 0, 0, 0, 0, 0, 0],
      scaleX: [1.0, 1.0, 1.0, 1.01, 1.02, 1.02, 1.01, 1.0, 1.0, 1.0],
      scaleY: [1.0, 1.0, 1.0, 1.01, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0],
    },
    attack2: {
      globalX: [-2, -1, 0, 1, 2, 3, 2, 1, 0, -1],
      globalY: [0, 0, -1, -1, -1, 0, 0, 0, 0, 0],
      scaleX: [1.0, 1.0, 1.01, 1.02, 1.02, 1.02, 1.01, 1.0, 1.0, 1.0],
      scaleY: [1.0, 1.0, 1.0, 1.01, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0],
    },
    attack3: {
      globalX: [-2, -1, 0, 1, 2, 3, 2, 1, 0, -1],
      globalY: [0, 0, -1, -1, -1, 0, 0, 0, 0, 0],
      scaleX: [1.0, 1.01, 1.02, 1.04, 1.06, 1.06, 1.04, 1.02, 1.01, 1.0],
      scaleY: [1.0, 1.0, 1.0, 1.01, 1.02, 1.02, 1.01, 1.0, 1.0, 1.0],
    },
    air_attack: {
      globalY: [-2, -4, -6, -8, -8, -6, -4, -2, 0, 0],
      scaleX: [1.0, 1.0, 1.01, 1.01, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0],
      scaleY: [1.0, 1.0, 1.01, 1.01, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0],
    },
    special: {
      globalX: [-2, -1, 0, 2, 3, 3, 2, 1, 0, -1],
      globalY: [0, 0, -1, -1, -1, -1, 0, 0, 0, 0],
      scaleX: [1.0, 1.01, 1.02, 1.04, 1.06, 1.06, 1.04, 1.02, 1.01, 1.0],
      scaleY: [1.0, 1.0, 1.01, 1.02, 1.03, 1.03, 1.02, 1.01, 1.0, 1.0],
    },
    hurt: {
      globalX: [0, -1, -2, -1, 0, 1, 0, 0, 0, 0],
      torsoX: [0, -1, -1, -1, 0, 0, 0, 0, 0, 0],
      headY: [0, 1, 1, 0, -1, 0, 0, 0, 0, 0],
      frontArmX: [0, -1, -1, 0, 0, 0, 0, 0, 0, 0],
      backArmX: [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    knockdown: {
      globalX: [0, 1, 2, 2, 2, 2, 2, 1, 1, 1],
      globalY: [0, 1, 2, 3, 3, 3, 2, 2, 2, 2],
      torsoY: [0, 1, 1, 2, 2, 2, 2, 1, 1, 1],
      headX: [0, 1, 2, 2, 2, 2, 2, 1, 1, 1],
      scaleX: [1.0, 1.02, 1.04, 1.06, 1.08, 1.08, 1.08, 1.06, 1.04, 1.04],
      scaleY: [1.0, 0.96, 0.92, 0.9, 0.88, 0.88, 0.9, 0.92, 0.94, 0.94],
    },
    getup: {
      globalY: [3, 3, 3, 2, 2, 1, 1, 0, 0, 0],
      torsoY: [2, 2, 2, 1, 1, 1, 0, 0, 0, 0],
      headX: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      scaleX: [1.06, 1.06, 1.04, 1.04, 1.02, 1.02, 1.0, 1.0, 1.0, 1.0],
      scaleY: [0.9, 0.9, 0.92, 0.94, 0.96, 0.98, 1.0, 1.0, 1.0, 1.0],
    },
  };

  const clipMotion = motionByClip[clipName];
  if (!clipMotion) {
    return null;
  }
  return {
    global: { x: getCurveValue(clipMotion.globalX, frameIndex, 0), y: getCurveValue(clipMotion.globalY, frameIndex, 0) },
    scaleX: getCurveValue(clipMotion.scaleX, frameIndex, 1),
    scaleY: getCurveValue(clipMotion.scaleY, frameIndex, 1),
  };
}

function applyPoseRig(frameData, clipName, frameIndex) {
  const motion = getClipMotion(clipName, frameIndex);
  if (!motion) {
    return frameData;
  }
  let posed = frameData;
  const box = findBoundingBox(posed);
  if (box && (Math.abs(motion.scaleX - 1) > 0.001 || Math.abs(motion.scaleY - 1) > 0.001)) {
    posed = resampleToTarget(posed, box, motion.scaleX, motion.scaleY);
  }

  return shiftFrame(posed, motion.global.x, motion.global.y);
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
  const scaleY = clamp((targetHeight / Math.max(1, box.height)) * ownerProfile.scaleY, 0.88, 1.24);
  const scaleX = clamp(ownerProfile.scaleX, 0.84, 1.24);
  const scaled = resampleToTarget(frameData, box, scaleX, scaleY);
  const scaledBox = findBoundingBox(scaled);
  if (!scaledBox) {
    return scaled;
  }
  const warped = applyRowWarp(scaled, scaledBox, ownerProfile.rowWarp);
  const warpedBox = findBoundingBox(warped);
  if (!warpedBox) {
    return warped;
  }

  const baselineShift = referenceMetrics.referenceBottomPad - warpedBox.bottomPad;
  const shifted = shiftFrame(warped, ownerProfile.xShift, ownerProfile.yShift + baselineShift);
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
    const clipIsStatic = isStaticSheet(sourceSheet);

    const generatedFrames = [];
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      const sourceFrameIndex = clipIsStatic ? 0 : frame;
      const sourceFrame = extractFrame(sourceSheet, sourceFrameIndex);

      let normalized = normalizeFrame(sourceFrame, clipName, ownerProfile, referenceMetrics);
      if (SYNTHESIZED_CLIPS.has(clipName)) {
        normalized = applyPoseRig(normalized, clipName, frame);
      }
      const styled = applyColorStyle(normalized, ownerProfile);
      const individualized = applyCharacterSilhouette(styled, ownerName, ownerProfile, clipName, frame);
      const cleaned = removeIsolatedPixels(individualized, 2);
      generatedFrames.push(cleaned);
    }

    const stabilizedFrames = stabilizeClipFrames(generatedFrames, clipName);
    for (let frame = 0; frame < stabilizedFrames.length; frame += 1) {
      drawFrame(outSheet, stabilizedFrames[frame], frame);
    }

    const targetPath = path.join(SPRITES_DIR, `${ownerName}_${clipName}_strip10.png`);
    writePng(targetPath, outSheet);
    console.log(`generated ${path.relative(PROJECT_ROOT, targetPath)}`);
  }
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function drawPortraitBackground(png, profile) {
  const top = profile.portrait.bgTop;
  const bottom = profile.portrait.bgBottom;
  for (let y = 0; y < png.height; y += 1) {
    const t = y / Math.max(1, png.height - 1);
    const r = lerp(top[0], bottom[0], t);
    const g = lerp(top[1], bottom[1], t);
    const b = lerp(top[2], bottom[2], t);
    for (let x = 0; x < png.width; x += 1) {
      setPngPixel(png, x, y, r, g, b, 255);
    }
  }
}

function drawPortraitBorder(png, borderColor) {
  const [r, g, b] = borderColor;
  for (let x = 0; x < png.width; x += 1) {
    setPngPixel(png, x, 0, r, g, b, 255);
    setPngPixel(png, x, 1, r, g, b, 255);
    setPngPixel(png, x, png.height - 1, r, g, b, 255);
    setPngPixel(png, x, png.height - 2, r, g, b, 255);
  }
  for (let y = 0; y < png.height; y += 1) {
    setPngPixel(png, 0, y, r, g, b, 255);
    setPngPixel(png, 1, y, r, g, b, 255);
    setPngPixel(png, png.width - 1, y, r, g, b, 255);
    setPngPixel(png, png.width - 2, y, r, g, b, 255);
  }
}

function drawPortraitLabel(png, label, color) {
  const [r, g, b] = color;
  const patterns = {
    K: [
      "1...1",
      "1..1.",
      "1.1..",
      "11...",
      "1.1..",
      "1..1.",
      "1...1",
    ],
    M: [
      "1...1",
      "11.11",
      "1.1.1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
    ],
    N: [
      "1...1",
      "11..1",
      "1.1.1",
      "1..11",
      "1...1",
      "1...1",
      "1...1",
    ],
  };
  const glyph = patterns[label];
  if (!glyph) {
    return;
  }
  const baseX = 5;
  const baseY = 5;
  for (let y = 0; y < glyph.length; y += 1) {
    for (let x = 0; x < glyph[y].length; x += 1) {
      if (glyph[y][x] !== "1") {
        continue;
      }
      drawRectOnPng(png, baseX + x, baseY + y, 1, 1, [r, g, b]);
    }
  }
}

function drawRectOnPng(png, x, y, width, height, color) {
  const [r, g, b] = color;
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPngPixel(png, xx, yy, r, g, b, 255);
    }
  }
}

function renderBustFromIdleFrame(frameData, ownerProfile) {
  const portrait = new PNG({
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    colorType: 6,
  });
  drawPortraitBackground(portrait, ownerProfile);

  const box = findBoundingBox(frameData);
  if (!box) {
    drawPortraitBorder(portrait, ownerProfile.portrait.border);
    drawPortraitLabel(portrait, ownerProfile.portrait.label, ownerProfile.portrait.labelColor);
    return portrait;
  }

  const midX = Math.floor((box.minX + box.maxX) * 0.5);
  const srcSize = 20;
  const srcX = clamp(midX - Math.floor(srcSize / 2), 0, FRAME_WIDTH - srcSize);
  const srcY = clamp(box.minY, 0, FRAME_HEIGHT - srcSize);
  const dstStartX = 4;
  const dstStartY = 5;
  const scale = 2;

  for (let sy = 0; sy < srcSize; sy += 1) {
    for (let sx = 0; sx < srcSize; sx += 1) {
      const src = frameOffset(srcX + sx, srcY + sy);
      const alpha = frameData[src + 3];
      if (alpha === 0) {
        continue;
      }
      const r = frameData[src];
      const g = frameData[src + 1];
      const b = frameData[src + 2];
      for (let py = 0; py < scale; py += 1) {
        for (let px = 0; px < scale; px += 1) {
          setPngPixel(
            portrait,
            dstStartX + sx * scale + px,
            dstStartY + sy * scale + py,
            r,
            g,
            b,
            255,
          );
        }
      }
    }
  }

  drawPortraitBorder(portrait, ownerProfile.portrait.border);
  drawPortraitLabel(portrait, ownerProfile.portrait.label, ownerProfile.portrait.labelColor);
  return portrait;
}

function buildPortrait(ownerName, ownerProfile) {
  if (!ownerProfile.portrait) {
    return;
  }
  const idlePath = path.join(SPRITES_DIR, `${ownerName}_idle_strip10.png`);
  if (!fs.existsSync(idlePath)) {
    throw new Error(`Missing idle sheet for portrait generation: ${idlePath}`);
  }
  const idleSheet = readPng(idlePath);
  const frameData = extractFrame(idleSheet, 0);
  const portrait = renderBustFromIdleFrame(frameData, ownerProfile);
  const portraitPath = path.join(UI_DIR, `portrait_${ownerName}.png`);
  writePng(portraitPath, portrait);
  console.log(`generated ${path.relative(PROJECT_ROOT, portraitPath)}`);
}

function main() {
  if (!fs.existsSync(SPRITES_DIR)) {
    throw new Error(`Sprites directory not found: ${SPRITES_DIR}`);
  }
  if (!fs.existsSync(UI_DIR)) {
    throw new Error(`UI directory not found: ${UI_DIR}`);
  }
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source sprites directory not found: ${SOURCE_DIR}`);
  }
  for (const [ownerName, ownerProfile] of Object.entries(OWNER_PROFILES)) {
    buildOwnerSheets(ownerName, ownerProfile);
    buildPortrait(ownerName, ownerProfile);
  }
}

main();
