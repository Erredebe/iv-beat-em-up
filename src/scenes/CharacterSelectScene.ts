import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { campaignStageOrder } from "../config/gameplay/campaign";
import { isFeatureEnabled } from "../config/features";
import { playableCharacters } from "../config/gameplay/playableRoster";
import { stageCatalog } from "../config/levels/stageCatalog";
import { updateSessionState } from "../config/gameplay/sessionState";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { createPanel, createSceneTitle } from "../ui/sceneChrome";
import { resolveNextSceneFromCharacterSelect } from "./sceneFlow";

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private selectedStageIndex = 0;
  private cards: CharacterCardView[] = [];
  private selectedStageText!: Phaser.GameObjects.Text;
  private selectedStageBanner!: Phaser.GameObjects.Rectangle;
  private selectedStageIcon!: Phaser.GameObjects.Text;

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    const theme = getUiThemeTokens();
    this.cameras.main.setBackgroundColor(theme.palette.bgPrimary);

    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x0a1220, 1).setOrigin(0.5);
    createSceneTitle(this, {
      x: BASE_WIDTH * 0.5,
      y: 16,
      title: "SELECCIONA PERSONAJE",
      titleSize: theme.typography.title,
    });

    const startX = 14;
    const spacing = 132;
    for (let i = 0; i < playableCharacters.length; i += 1) {
      const character = playableCharacters[i];
      const x = startX + i * spacing;
      const card = this.add.container(x, 52);
      const panel = createPanel(this, {
        x: 0,
        y: 0,
        width: 124,
        height: 150,
      });

      const frameOuter = this.add.rectangle(62, 42, 100, 54, 0x0f1e2f, 0.95).setStrokeStyle(2, 0x3f6aa1, 0.9).setOrigin(0.5);
      const frameInner = this.add.rectangle(62, 42, 92, 46, 0x08101a, 0.95).setStrokeStyle(1, 0x75a6d4, 0.8).setOrigin(0.5);
      const portrait = this.add.image(62, 42, character.portraitKey).setScale(0.5).setTint(character.tint).setOrigin(0.5);
      const dividerTop = this.add.rectangle(62, 70, 104, 2, 0x2d4f74, 1).setOrigin(0.5);
      const name = this.add
        .text(12, 76, character.displayName, {
          fontFamily: theme.typography.families.uiBody,
          fontSize: theme.typography.body,
          color: theme.palette.textPrimary,
        })
        .setOrigin(0, 0);
      const dividerBottom = this.add.rectangle(62, 94, 104, 1, 0x22384f, 1).setOrigin(0.5);
      const stats = this.buildStatBars(character, 12, 98);

      const selectionGlow = this.add.rectangle(62, 75, 116, 138, 0xf2cd64, 0.08).setOrigin(0.5).setVisible(false);
      selectionGlow.setStrokeStyle(2, 0xf2cd64, 0.95);
      const selectionCursor = this.add.text(10, 8, "▶", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.subtitle,
        color: theme.palette.accentGold,
      });
      selectionCursor.setVisible(false);

      card.add([
        panel.fill,
        panel.border,
        frameOuter,
        frameInner,
        portrait,
        dividerTop,
        name,
        dividerBottom,
        ...stats,
        selectionGlow,
        selectionCursor,
      ]);
      card.setSize(124, 150);
      card.setInteractive(new Phaser.Geom.Rectangle(0, 0, 124, 150), Phaser.Geom.Rectangle.Contains);
      card.on("pointerdown", () => {
        this.selectedIndex = i;
        this.refreshSelection();
        this.confirmSelection();
      });
      card.on("pointerover", () => {
        this.selectedIndex = i;
        this.refreshSelection();
      });
      this.cards.push({
        container: card,
        panelFill: panel.fill,
        panelBorder: panel.border,
        selectionGlow,
        selectionCursor,
      });
    }

    this.add
      .text(BASE_WIDTH * 0.5, 205, "NIVEL", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.caption,
        color: theme.palette.accentGold,
      })
      .setOrigin(0.5);

    this.selectedStageBanner = this.add.rectangle(BASE_WIDTH * 0.5, 218, 260, 32, 0x112238, 0.9).setStrokeStyle(2, 0x4e7fb1, 0.9);
    this.selectedStageIcon = this.add
      .text(BASE_WIDTH * 0.5 - 108, 218, "", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.subtitle,
        color: theme.palette.accentGold,
      })
      .setOrigin(0.5);
    this.selectedStageText = this.add
      .text(BASE_WIDTH * 0.5 + 12, 218, "", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.subtitle,
        color: theme.palette.textPrimary,
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 232, "LEFT/RIGHT personaje  |  UP/DOWN nivel  |  ENTER confirmar", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.caption,
        color: theme.palette.textSecondary,
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
    const theme = getUiThemeTokens();
    this.cards.forEach((cardView, index) => {
      const active = index === this.selectedIndex;
      cardView.panelFill.setFillStyle(
        active ? Number.parseInt(theme.panel.highlightFill.replace("#", "0x"), 16) : Number.parseInt(theme.palette.panelFill.replace("#", "0x"), 16),
        active ? 0.98 : theme.panel.fillAlpha,
      );
      cardView.panelBorder.setStrokeStyle(
        2,
        active ? Number.parseInt(theme.palette.accentGold.replace("#", "0x"), 16) : Number.parseInt(theme.palette.accentBlue.replace("#", "0x"), 16),
        active ? 1 : theme.panel.borderAlpha,
      );

      cardView.selectionGlow.setVisible(active);
      cardView.selectionCursor.setVisible(active);

      this.tweens.killTweensOf(cardView.selectionGlow);
      this.tweens.killTweensOf(cardView.selectionCursor);
      this.tweens.killTweensOf(cardView.container);

      if (active) {
        cardView.container.setScale(1);
        this.tweens.add({
          targets: cardView.container,
          scaleX: 1.035,
          scaleY: 1.035,
          duration: 110,
          ease: "Sine.Out",
        });
        this.tweens.add({
          targets: cardView.selectionGlow,
          alpha: { from: 0.2, to: 0.6 },
          duration: 420,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
        this.tweens.add({
          targets: cardView.selectionCursor,
          x: cardView.selectionCursor.x + 4,
          duration: 260,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
      } else {
        cardView.container.setScale(1);
        cardView.selectionGlow.setAlpha(0.08);
      }
    });
  }

  private moveStageSelection(delta: number): void {
    this.selectedStageIndex = Phaser.Math.Wrap(this.selectedStageIndex + delta, 0, campaignStageOrder.length);
    this.refreshStageSelection();
  }

  private refreshStageSelection(): void {
    const theme = getUiThemeTokens();
    const selectedStageId = campaignStageOrder[this.selectedStageIndex];
    const selectedStage = stageCatalog[selectedStageId];
    const stagePreview = this.getStagePreview(selectedStage.id);

    this.selectedStageText.setText(stagePreview.name);
    this.selectedStageIcon.setText(stagePreview.icon);
    this.selectedStageBanner.setFillStyle(stagePreview.bannerColor, 0.92);

    this.tweens.killTweensOf([this.selectedStageText, this.selectedStageIcon, this.selectedStageBanner]);
    this.selectedStageText.setAlpha(0.6);
    this.selectedStageIcon.setAlpha(0.6);
    this.selectedStageBanner.setScale(0.98, 0.98);
    this.tweens.add({
      targets: [this.selectedStageText, this.selectedStageIcon],
      alpha: 1,
      duration: 120,
      ease: "Sine.Out",
    });
    this.tweens.add({
      targets: this.selectedStageBanner,
      scaleX: 1,
      scaleY: 1,
      duration: 130,
      ease: "Back.Out",
    });

    this.selectedStageText.setColor(theme.palette.textPrimary);
  }

  private buildStatBars(character: (typeof playableCharacters)[number], startX: number, startY: number): Phaser.GameObjects.GameObject[] {
    const theme = getUiThemeTokens();
    const statConfig = [
      { label: "HP", value: character.maxHp, max: 140, color: 0x7bd389 },
      { label: "VEL", value: character.moveSpeed, max: 170, color: 0x6cb8ff },
      { label: "DMG", value: character.damageMultiplier, max: 1.3, color: 0xf0b65a },
    ] as const;

    const items: Phaser.GameObjects.GameObject[] = [];
    statConfig.forEach((stat, index) => {
      const y = startY + index * 14;
      const normalized = Phaser.Math.Clamp(stat.value / stat.max, 0.1, 1);
      const label = this.add.text(startX, y, stat.label, {
        fontFamily: theme.typography.families.uiBody,
        fontSize: "10px",
        color: theme.palette.textSecondary,
      });
      const barBg = this.add.rectangle(startX + 33, y + 5, 64, 6, 0x172231, 0.95).setOrigin(0, 0.5);
      const barFill = this.add.rectangle(startX + 33, y + 5, Math.round(64 * normalized), 5, stat.color, 0.95).setOrigin(0, 0.5);
      items.push(label, barBg, barFill);
    });

    return items;
  }

  private getStagePreview(stageId: keyof typeof stageCatalog): { name: string; icon: string; bannerColor: number } {
    const base = {
      name: stageCatalog[stageId].displayName.toUpperCase(),
      icon: "◆",
      bannerColor: 0x1e3550,
    };

    switch (stageId) {
      case "market_95":
        return { ...base, icon: "🛒", bannerColor: 0x365a3e };
      case "metro_sur":
        return { ...base, icon: "🚇", bannerColor: 0x2d4468 };
      case "playa_noche":
        return { ...base, icon: "🌙", bannerColor: 0x4a3568 };
      case "puerto_rojo":
        return { ...base, icon: "⚓", bannerColor: 0x684040 };
      default:
        return base;
    }
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

    this.scene.start(
      resolveNextSceneFromCharacterSelect({
        characterSelect: isFeatureEnabled("characterSelect"),
        storyIntro: isFeatureEnabled("storyIntro"),
      }),
    );
  }
}

interface CharacterCardView {
  container: Phaser.GameObjects.Container;
  panelFill: Phaser.GameObjects.Rectangle;
  panelBorder: Phaser.GameObjects.Rectangle;
  selectionGlow: Phaser.GameObjects.Rectangle;
  selectionCursor: Phaser.GameObjects.Text;
}
