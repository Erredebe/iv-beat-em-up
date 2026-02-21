import type { AttackFrameData, Rect } from "../types/combat";

export function rectIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function isFrameActive(frame: number, data: AttackFrameData): boolean {
  return frame >= data.activeStart && frame <= data.activeEnd;
}

export function isFrameInComboWindow(frame: number, data: AttackFrameData): boolean {
  if (data.comboWindowStart === undefined || data.comboWindowEnd === undefined) {
    return false;
  }

  return frame >= data.comboWindowStart && frame <= data.comboWindowEnd;
}

