import Phaser from "phaser";

type ThemeId = "theme_a" | "theme_b";

export class AudioSystem {
  private readonly scene: Phaser.Scene;
  private started = false;
  private currentTheme: ThemeId | null = null;
  private currentMusic: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  ensureStarted(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.startTheme("theme_a");
  }

  startTheme(themeId: ThemeId): void {
    if (!this.started) {
      return;
    }
    if (this.currentTheme === themeId && this.currentMusic?.isPlaying) {
      return;
    }

    this.currentTheme = themeId;
    this.currentMusic?.stop();
    this.currentMusic?.destroy();
    this.currentMusic = this.scene.sound.add(themeId, {
      loop: true,
      volume: themeId === "theme_a" ? 0.32 : 0.36,
    });
    this.currentMusic.play();
  }

  switchTheme(themeId: ThemeId): void {
    this.startTheme(themeId);
  }

  playHit(): void {
    this.playSfx("sfx_hit", 0.48, 1.02);
  }

  playJump(): void {
    this.playSfx("sfx_jump", 0.38, 1.0);
  }

  playSpecial(): void {
    this.playSfx("sfx_special", 0.36, 1.0);
  }

  playKnockdown(): void {
    this.playSfx("sfx_knockdown", 0.44, 1.0);
  }

  private playSfx(key: string, volume: number, rate: number): void {
    if (!this.started) {
      return;
    }
    this.scene.sound.play(key, { volume, rate });
  }
}

