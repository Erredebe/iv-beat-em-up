import Phaser from "phaser";

const MAX_EFFECTIVE_HIT_STOP_MS = 24;

export class HitStopSystem {
  private readonly scene: Phaser.Scene;
  private stopUntil = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  trigger(durationMs: number): void {
    const effectiveDuration = Math.min(MAX_EFFECTIVE_HIT_STOP_MS, Math.max(0, durationMs));
    if (effectiveDuration <= 0) {
      return;
    }
    const nextStopUntil = this.scene.time.now + effectiveDuration;
    this.stopUntil = Math.max(this.stopUntil, nextStopUntil);
  }

  update(nowMs: number): void {
    if (nowMs >= this.stopUntil) {
      this.stopUntil = 0;
    }
  }

  isActive(): boolean {
    return this.stopUntil > this.scene.time.now;
  }
}
