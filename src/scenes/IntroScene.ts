import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";

const INTRO_LINES = [
  "ESPANA, 1995.",
  "EL BARRIO CAYO EN MANOS DE BANDAS Y SEGURIDAD CORRUPTA.",
  "HOY VUELVES A LA CALLE.",
  "RECUPERA CADA ZONA A GOLPES.",
];

export class IntroScene extends Phaser.Scene {
  private lineIndex = 0;
  private lineText!: Phaser.GameObjects.Text;

  constructor() {
    super("IntroScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#07040d");
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x09040f, 1).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, 360, 164, 0x080b14, 0.96).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, 44, 360, 2, 0xff6fb5, 1).setOrigin(0.5, 0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 34, "INTRO", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ffd9eb",
      })
      .setOrigin(0.5);

    this.lineText = this.add
      .text(BASE_WIDTH * 0.5, 108, INTRO_LINES[0], {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f4f9ff",
        align: "center",
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 198, "ENTER: continuar  |  SPACE: saltar", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffd6a7",
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 2100,
      loop: true,
      callback: () => {
        this.lineIndex = Math.min(INTRO_LINES.length - 1, this.lineIndex + 1);
        this.lineText.setText(INTRO_LINES[this.lineIndex]);
      },
    });

    this.input.keyboard?.on("keydown-ENTER", () => this.advanceOrStart());
    this.input.keyboard?.on("keydown-SPACE", () => this.startGame());
  }

  private advanceOrStart(): void {
    if (this.lineIndex >= INTRO_LINES.length - 1) {
      this.startGame();
      return;
    }
    this.lineIndex += 1;
    this.lineText.setText(INTRO_LINES[this.lineIndex]);
  }

  private startGame(): void {
    this.scene.start("StreetScene");
  }
}
