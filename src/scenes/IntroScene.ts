import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { createPanel, createSceneTitle } from "../ui/sceneChrome";

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
    const theme = getUiThemeTokens();
    this.cameras.main.setBackgroundColor(theme.palette.bgPrimary);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x09040f, 1).setOrigin(0.5);

    createPanel(this, {
      x: BASE_WIDTH * 0.5 - 180,
      y: BASE_HEIGHT * 0.5 - 82,
      width: 360,
      height: 164,
      fillColor: 0x080b14,
      fillAlpha: 0.96,
      topAccentColor: Number.parseInt(theme.palette.accentPink.replace("#", "0x"), 16),
      topAccentHeight: 2,
    });

    createSceneTitle(this, {
      x: BASE_WIDTH * 0.5,
      y: 28,
      title: "INTRO",
      titleSize: theme.typography.subtitle,
    });

    this.lineText = this.add
      .text(BASE_WIDTH * 0.5, 108, INTRO_LINES[0], {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.body,
        color: theme.palette.textPrimary,
        align: "center",
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 198, "ENTER: continuar  |  SPACE: saltar", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.caption,
        color: theme.palette.accentGold,
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
