import Phaser from "phaser";

export class HitStopSystem {
  private readonly scene: Phaser.Scene;
  private stopUntil = 0;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  trigger(durationMs: number): void {
    const nextStopUntil = this.scene.time.now + Math.max(0, durationMs);
    this.stopUntil = Math.max(this.stopUntil, nextStopUntil);

    if (!this.active) {
      this.active = true;
      this.scene.physics.world.pause();
    }
  }

  update(nowMs: number): void {
    if (!this.active) {
      return;
    }

    if (nowMs >= this.stopUntil) {
      this.active = false;
      this.stopUntil = 0;
      this.scene.physics.world.resume();
    }
  }

  isActive(): boolean {
    return this.active;
  }
}

