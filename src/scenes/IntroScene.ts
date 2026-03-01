import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { createPanel, createSceneTitle } from "../ui/sceneChrome";

type IntroCardStyle = {
  backgroundColor: number;
  overlayColor: number;
  textColor: string;
  accentColor: number;
};

type IntroCard = {
  text: string;
  duration: number;
  style: IntroCardStyle;
};

const INTRO_CARDS: IntroCard[] = [
  {
    text: "ESPANA, 1995.\nLAS CALLES ARDEN BAJO NEON Y MIEDO.",
    duration: 2200,
    style: {
      backgroundColor: 0x0a0712,
      overlayColor: 0x250d3d,
      textColor: "#f7f2ff",
      accentColor: 0xf08af8,
    },
  },
  {
    text: "BARRIOS ENTEROS CAYERON\nEN MANOS DE BANDAS Y SEGURIDAD CORRUPTA.",
    duration: 2500,
    style: {
      backgroundColor: 0x090d18,
      overlayColor: 0x0f2e4b,
      textColor: "#e7f7ff",
      accentColor: 0x67d5ff,
    },
  },
  {
    text: "TU GENTE YA NO CAMINA TRANQUILA.\nLAS REGLAS CAMBIARON.",
    duration: 2200,
    style: {
      backgroundColor: 0x130a09,
      overlayColor: 0x4b1b16,
      textColor: "#fff0df",
      accentColor: 0xffa45f,
    },
  },
  {
    text: "ESTA NOCHE VUELVES A LA CALLE.\nRECUPERA CADA ZONA A GOLPES.",
    duration: 3000,
    style: {
      backgroundColor: 0x070c10,
      overlayColor: 0x14353a,
      textColor: "#ebfff7",
      accentColor: 0x6fffd0,
    },
  },
];

const TYPE_SPEED_MS = 28;
const CARD_TRANSITION_MS = 220;

export class IntroScene extends Phaser.Scene {
  private cardIndex = 0;
  private isRevealing = false;
  private isTransitioning = false;
  private currentCardText = "";
  private revealChars = 0;

  private backgroundRect!: Phaser.GameObjects.Rectangle;
  private overlayRect!: Phaser.GameObjects.Rectangle;
  private cardContainer!: Phaser.GameObjects.Container;
  private lineText!: Phaser.GameObjects.Text;
  private advanceText!: Phaser.GameObjects.Text;
  private skipText!: Phaser.GameObjects.Text;

  private revealEvent?: Phaser.Time.TimerEvent;
  private autoAdvanceEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super("IntroScene");
  }

  create(): void {
    const theme = getUiThemeTokens();
    this.cameras.main.setBackgroundColor(theme.palette.bgPrimary);

    this.backgroundRect = this.add
      .rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x09040f, 1)
      .setOrigin(0.5);

    this.overlayRect = this.add
      .rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x1b1032, 0.28)
      .setOrigin(0.5);

    const panel = createPanel(this, {
      x: BASE_WIDTH * 0.5 - 180,
      y: BASE_HEIGHT * 0.5 - 82,
      width: 360,
      height: 164,
      fillColor: 0x080b14,
      fillAlpha: 0.94,
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
      .text(BASE_WIDTH * 0.5, 108, "", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.body,
        color: theme.palette.textPrimary,
        align: "center",
        wordWrap: { width: 320 },
        lineSpacing: 5,
      })
      .setOrigin(0.5);

    this.advanceText = this.add
      .text(BASE_WIDTH * 0.5, 194, "ENTER · AVANZAR", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.body,
        color: theme.palette.textPrimary,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.skipText = this.add
      .text(BASE_WIDTH * 0.5, 208, "SPACE · SALTAR", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.caption,
        color: theme.palette.accentGold,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.cardContainer = this.add.container(0, 0, [panel.container, this.lineText, this.advanceText, this.skipText]);

    this.applyCard(0);

    this.input.keyboard?.on("keydown-ENTER", this.onAdvance, this);
    this.input.keyboard?.on("keydown-SPACE", this.startGame, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupEvents, this);
  }

  private applyCard(index: number): void {
    this.cardIndex = index;
    const card = INTRO_CARDS[index];
    this.backgroundRect.setFillStyle(card.style.backgroundColor, 1);
    this.overlayRect.setFillStyle(card.style.overlayColor, 0.28);
    this.lineText.setColor(card.style.textColor);
    this.advanceText.setColor(`#${card.style.accentColor.toString(16).padStart(6, "0")}`);

    this.currentCardText = card.text;
    this.lineText.setText("");
    this.revealChars = 0;
    this.isRevealing = true;

    this.revealEvent?.remove(false);
    this.revealEvent = this.time.addEvent({
      delay: TYPE_SPEED_MS,
      loop: true,
      callback: () => {
        this.revealChars += 1;
        this.lineText.setText(this.currentCardText.slice(0, this.revealChars));
        if (this.revealChars >= this.currentCardText.length) {
          this.finishReveal();
        }
      },
    });

    this.autoAdvanceEvent?.remove(false);
    this.autoAdvanceEvent = this.time.delayedCall(card.duration, () => {
      if (!this.isRevealing) {
        this.moveToNextCardOrStart();
      }
    });
  }

  private finishReveal(): void {
    if (!this.isRevealing) {
      return;
    }

    this.isRevealing = false;
    this.revealEvent?.remove(false);
    this.revealEvent = undefined;
    this.lineText.setText(this.currentCardText);
  }

  private onAdvance(): void {
    if (this.isTransitioning) {
      return;
    }

    if (this.isRevealing) {
      this.finishReveal();
      return;
    }

    this.moveToNextCardOrStart();
  }

  private moveToNextCardOrStart(): void {
    this.autoAdvanceEvent?.remove(false);
    this.autoAdvanceEvent = undefined;

    if (this.cardIndex >= INTRO_CARDS.length - 1) {
      this.startGame();
      return;
    }

    this.isTransitioning = true;
    this.tweens.add({
      targets: this.cardContainer,
      alpha: 0,
      duration: CARD_TRANSITION_MS,
      onComplete: () => {
        this.applyCard(this.cardIndex + 1);
        this.tweens.add({
          targets: this.cardContainer,
          alpha: 1,
          duration: CARD_TRANSITION_MS,
          onComplete: () => {
            this.isTransitioning = false;
          },
        });
      },
    });
  }

  private cleanupEvents(): void {
    this.input.keyboard?.off("keydown-ENTER", this.onAdvance, this);
    this.input.keyboard?.off("keydown-SPACE", this.startGame, this);
    this.revealEvent?.remove(false);
    this.autoAdvanceEvent?.remove(false);
  }

  private startGame(): void {
    this.cleanupEvents();
    this.scene.start("StreetScene");
  }
}
