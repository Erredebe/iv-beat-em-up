import Phaser from "phaser";
import { featureFlags } from "../config/features";

type ThemeId = "theme_a" | "theme_b";
type SfxCategory = "hit" | "jump" | "special" | "knockdown" | "break" | "ui";
export type SpecialSfxKey = "sfx_special_boxeador" | "sfx_special_veloz" | "sfx_special_tecnico";

const SFX_POOL: Record<SfxCategory, string[]> = {
  hit: ["sfx_hit", "sfx_hit_alt"],
  jump: ["sfx_jump"],
  special: ["sfx_special_boxeador", "sfx_special_veloz", "sfx_special_tecnico"],
  knockdown: ["sfx_knockdown"],
  break: ["sfx_break"],
  ui: ["sfx_ui"],
};

const CATEGORY_COOLDOWN_MS: Record<SfxCategory, number> = {
  hit: 28,
  jump: 48,
  special: 70,
  knockdown: 90,
  break: 90,
  ui: 45,
};

export class AudioSystem {
  private readonly scene: Phaser.Scene;
  private started = false;
  private currentTheme: ThemeId | null = null;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private readonly categoryCooldownUntil = new Map<SfxCategory, number>();

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
      volume: themeId === "theme_a" ? 0.34 : 0.38,
    });
    this.currentMusic.play();
  }

  switchTheme(themeId: ThemeId): void {
    this.startTheme(themeId);
  }

  playHit(): void {
    this.playFromPool("hit", 0.5, [0.98, 1.04]);
  }

  playJump(): void {
    this.playFromPool("jump", 0.38, [0.95, 1.02]);
  }

  playSpecial(sfxKey?: SpecialSfxKey): void {
    if (sfxKey && this.scene.cache.audio.exists(sfxKey)) {
      this.playSound(sfxKey, "special", 0.4, [0.96, 1.04]);
      return;
    }
    this.playFromPool("special", 0.4, [0.96, 1.04]);
  }

  playKnockdown(): void {
    this.playFromPool("knockdown", 0.46, [0.94, 1.0]);
  }

  playBreakableBreak(): void {
    this.playFromPool("break", 0.42, [0.9, 0.98]);
  }

  playUi(): void {
    this.playFromPool("ui", 0.32, [0.96, 1.06]);
  }

  playZoneLock(): void {
    this.playFromPool("special", 0.28, [0.9, 0.94]);
  }

  private playFromPool(category: SfxCategory, volume: number, randomRateRange: [number, number]): void {
    if (!this.started) {
      return;
    }

    const pool = SFX_POOL[category].filter((key) => this.scene.cache.audio.exists(key));
    if (pool.length === 0) {
      return;
    }

    const key = featureFlags.enhancedSfx ? pool[Math.floor(Math.random() * pool.length)] : pool[0];
    this.playSound(key, category, volume, randomRateRange);
  }

  private playSound(key: string, category: SfxCategory, volume: number, randomRateRange: [number, number]): void {
    const now = this.scene.time.now;
    const cooldownUntil = this.categoryCooldownUntil.get(category) ?? 0;
    if (now < cooldownUntil) {
      return;
    }
    this.categoryCooldownUntil.set(category, now + CATEGORY_COOLDOWN_MS[category]);
    const [minRate, maxRate] = randomRateRange;
    const rate = Phaser.Math.FloatBetween(minRate, maxRate);
    this.scene.sound.play(key, { volume, rate });
  }
}
