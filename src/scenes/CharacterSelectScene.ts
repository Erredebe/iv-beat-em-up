import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { campaignStageOrder } from "../config/gameplay/campaign";
import { isFeatureEnabled } from "../config/features";
import { playableCharacters } from "../config/gameplay/playableRoster";
import { stageCatalog } from "../config/levels/stageCatalog";
import { updateSessionState } from "../config/gameplay/sessionState";

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private selectedStageIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private selectedStageText!: Phaser.GameObjects.Text;

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#05070d");

    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x0a1220, 1).setOrigin(0.5);
    this.add
      .text(BASE_WIDTH * 0.5, 24, "SELECCIONA PERSONAJE", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffe7b4",
      })
      .setOrigin(0.5);

    const startX = 18;
    const spacing = 132;
    for (let i = 0; i < playableCharacters.length; i += 1) {
      const character = playableCharacters[i];
      const x = startX + i * spacing;
      const card = this.add.container(x, 56);
      const panel = this.add.rectangle(0, 0, 124, 140, 0x05070f, 0.92).setOrigin(0, 0);
      const border = this.add.rectangle(0, 0, 124, 140, 0x68abff, 0).setOrigin(0, 0).setStrokeStyle(2, 0x68abff, 0.7);
      const portrait = this.add
        .image(62, 44, character.portraitKey)
        .setScale(2)
        .setTint(character.tint)
        .setOrigin(0.5);
      const name = this.add
        .text(12, 82, character.displayName, {
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#f3f7ff",
        })
        .setOrigin(0, 0);
      const stats = this.add.text(12, 100, `HP ${character.maxHp}\nSPD ${character.moveSpeed}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#cfe8ff",
      });
      card.add([panel, border, portrait, name, stats]);
      card.setSize(124, 140);
      card.setInteractive(new Phaser.Geom.Rectangle(0, 0, 124, 140), Phaser.Geom.Rectangle.Contains);
      card.on("pointerdown", () => {
        this.selectedIndex = i;
        this.refreshSelection();
        this.confirmSelection();
      });
      card.on("pointerover", () => {
        this.selectedIndex = i;
        this.refreshSelection();
      });
      this.cards.push(card);
    }

    this.add
      .text(BASE_WIDTH * 0.5, 205, "NIVEL", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f5ce7b",
      })
      .setOrigin(0.5);

    this.selectedStageText = this.add
      .text(BASE_WIDTH * 0.5, 217, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f3f7ff",
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 232, "LEFT/RIGHT personaje  |  UP/DOWN nivel  |  ENTER confirmar", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f3dceb",
      })
      .setOrigin(0.5);

    this.input.keyboard?.on("keydown-LEFT", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-A", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-D", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-UP", () => this.moveStageSelection(-1));
    this.input.keyboard?.on("keydown-DOWN", () => this.moveStageSelection(1));
    this.input.keyboard?.on("keydown-W", () => this.moveStageSelection(-1));
    this.input.keyboard?.on("keydown-S", () => this.moveStageSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.confirmSelection());
    this.input.keyboard?.on("keydown-SPACE", () => this.confirmSelection());

    this.refreshSelection();
    this.refreshStageSelection();
  }

  private moveSelection(delta: number): void {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, playableCharacters.length);
    this.refreshSelection();
  }

  private refreshSelection(): void {
    this.cards.forEach((card, index) => {
      const active = index === this.selectedIndex;
      const panel = card.list[0] as Phaser.GameObjects.Rectangle;
      const border = card.list[1] as Phaser.GameObjects.Rectangle;
      panel.setFillStyle(active ? 0x182336 : 0x05070f, active ? 0.98 : 0.92);
      border.setStrokeStyle(2, active ? 0xffce6e : 0x68abff, active ? 1 : 0.7);
    });
  }

  private moveStageSelection(delta: number): void {
    this.selectedStageIndex = Phaser.Math.Wrap(this.selectedStageIndex + delta, 0, campaignStageOrder.length);
    this.refreshStageSelection();
  }

  private refreshStageSelection(): void {
    const selectedStageId = campaignStageOrder[this.selectedStageIndex];
    const selectedStage = stageCatalog[selectedStageId];
    this.selectedStageText.setText(`< ${selectedStage.displayName.toUpperCase()} >`);
  }

  private confirmSelection(): void {
    const selected = playableCharacters[this.selectedIndex];
    const selectedStageId = campaignStageOrder[this.selectedStageIndex];
    updateSessionState({
      selectedCharacter: selected.id,
      currentStageId: selectedStageId,
      score: 0,
      elapsedMs: 0,
    });

    if (this.cache.audio.exists("sfx_ui")) {
      this.sound.play("sfx_ui", { volume: 0.28, rate: 1.06 });
    }

    if (isFeatureEnabled("storyIntro")) {
      this.scene.start("IntroScene");
      return;
    }
    this.scene.start("StreetScene");
  }
}
