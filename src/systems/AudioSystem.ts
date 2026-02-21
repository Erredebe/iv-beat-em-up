import Phaser from "phaser";

type ThemeId = "theme_a" | "theme_b";

interface ThemePattern {
  lead: number[];
  bass: number[];
  kick: number[];
}

const THEME_A: ThemePattern = {
  lead: [440, 0, 523.25, 0, 659.25, 0, 523.25, 0, 587.33, 0, 523.25, 0, 493.88, 0, 392, 0],
  bass: [110, 0, 110, 0, 130.81, 0, 98, 0, 110, 0, 110, 0, 130.81, 0, 98, 0],
  kick: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1],
};

const THEME_B: ThemePattern = {
  lead: [349.23, 0, 392, 0, 440, 0, 493.88, 0, 392, 0, 349.23, 0, 293.66, 0, 261.63, 0],
  bass: [87.31, 0, 98, 0, 110, 0, 123.47, 0, 98, 0, 87.31, 0, 73.42, 0, 65.41, 0],
  kick: [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
};

export class AudioSystem {
  private readonly scene: Phaser.Scene;
  private readonly context: AudioContext | null;
  private beatTimer: Phaser.Time.TimerEvent | null = null;
  private step = 0;
  private started = false;
  private currentTheme: ThemeId = "theme_a";

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const soundManager = scene.sound;
    this.context = "context" in soundManager ? (soundManager.context as AudioContext) : null;
  }

  ensureStarted(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    if (!this.context) {
      return;
    }
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
    this.startTheme("theme_a");
  }

  startTheme(themeId: ThemeId): void {
    this.currentTheme = themeId;
    this.step = 0;
    this.beatTimer?.remove();
    this.beatTimer = this.scene.time.addEvent({
      delay: 170,
      loop: true,
      callback: () => this.tickTheme(),
    });
  }

  switchTheme(themeId: ThemeId): void {
    if (this.currentTheme !== themeId) {
      this.startTheme(themeId);
    }
  }

  playHit(): void {
    this.playTone(220, 0.05, "square", 0.08);
    this.playTone(110, 0.04, "triangle", 0.06, 0.01);
  }

  playJump(): void {
    this.playTone(392, 0.08, "square", 0.05);
    this.playTone(523.25, 0.06, "square", 0.04, 0.03);
  }

  playSpecial(): void {
    this.playTone(146.83, 0.18, "sawtooth", 0.07);
    this.playTone(293.66, 0.2, "square", 0.06, 0.03);
  }

  playKnockdown(): void {
    this.playTone(90, 0.11, "triangle", 0.08);
  }

  private tickTheme(): void {
    if (!this.started) {
      return;
    }

    const pattern = this.currentTheme === "theme_a" ? THEME_A : THEME_B;
    const index = this.step % pattern.lead.length;
    const leadFrequency = pattern.lead[index];
    const bassFrequency = pattern.bass[index];
    const kick = pattern.kick[index];

    if (leadFrequency > 0) {
      this.playTone(leadFrequency, 0.1, "square", 0.03);
    }
    if (bassFrequency > 0) {
      this.playTone(bassFrequency, 0.16, "sawtooth", 0.022);
    }
    if (kick > 0) {
      this.playTone(60, 0.07, "triangle", 0.045);
    }

    this.step += 1;
  }

  private playTone(
    frequency: number,
    durationSec: number,
    waveform: OscillatorType,
    gainValue: number,
    delaySec = 0,
  ): void {
    if (!this.started) {
      return;
    }
    if (!this.context) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const startTime = this.context.currentTime + delaySec;
    const endTime = startTime + durationSec;

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}
