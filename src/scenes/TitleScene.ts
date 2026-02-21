import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#07040d");

    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x120019, 1).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5 + 10, 264, 124, 0x05050a, 0.9).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5 - 52, 220, 1, 0xff5ea8, 0.9).setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5 - 36, "SPAIN 90", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ffd6ea",
        stroke: "#150812",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5 - 8, "BEAT 'EM UP", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#a9deea",
        stroke: "#061017",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const pressText = this.add
      .text(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5 + 34, "PULSA ENTER PARA EMPEZAR", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f5f4f8",
        stroke: "#08080b",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: pressText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    this.input.keyboard?.once("keydown-ENTER", () => this.startGame());
    this.input.keyboard?.once("keydown-SPACE", () => this.startGame());
    this.input.once("pointerdown", () => this.startGame());
  }

  private startGame(): void {
    if (!this.scene.isActive("StreetScene")) {
      this.scene.start("StreetScene");
    }
    if (!this.scene.isActive("HudScene")) {
      this.scene.launch("HudScene");
    }
  }
}
