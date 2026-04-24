import Phaser from "phaser";
import { BASE_WIDTH } from "../config/constants";
import { campaignStageOrder } from "../config/gameplay/campaign";
import { isFeatureEnabled } from "../config/features";
import { playableCharacters } from "../config/gameplay/playableRoster";
import { stageCatalog } from "../config/levels/stageCatalog";
import { updateSessionState } from "../config/gameplay/sessionState";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { createPanel, createSceneBackdrop, createSceneTitle, hexColor } from "../ui/sceneChrome";
import { resolveNextSceneFromCharacterSelect } from "./sceneFlow";

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private selectedStageIndex = 0;
  private cards: CharacterCardView[] = [];
  private selectedStageText!: Phaser.GameObjects.Text;
  private selectedStageBanner!: Phaser.GameObjects.Rectangle;
  private selectedStageIcon!: Phaser.GameObjects.Text;
  private readonly onMoveLeft = () => this.moveSelection(-1);
  private readonly onMoveRight = () => this.moveSelection(1);
  private readonly onMoveStageUp = () => this.moveStageSelection(-1);
  private readonly onMoveStageDown = () => this.moveStageSelection(1);
  private readonly onConfirmSelection = () => this.confirmSelection();

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    const theme = getUiThemeTokens();
    this.cameras.main.setBackgroundColor(theme.palette.bgPrimary);

    createSceneBackdrop(this, { variant: "menu", includeOrb: true });
    createPanel(this, {
      x: 24,
      y: 14,
      width: BASE_WIDTH - 48,
      height: 28,
      fillColor: hexColor(theme.palette.panelElevated),
      fillAlpha: 0.86,
      borderColor: hexColor(theme.panel.mutedBorder),
      borderAlpha: 0.55,
      borderWidth: 1,
      topAccentColor: hexColor(theme.palette.accentBlue),
      topAccentHeight: 2,
    });
    createSceneTitle(this, {
      x: BASE_WIDTH * 0.5,
      y: 18,
      title: "SELECCIONA PERSONAJE",
      titleSize: theme.typography.title,
    });

    this.selectedStageBanner = this.add
      .rectangle(BASE_WIDTH * 0.5, 58, 252, 24, hexColor(theme.palette.panelElevated), 0.92)
      .setStrokeStyle(2, hexColor(theme.panel.mutedBorder), 0.9);
    this.selectedStageIcon = this.add
      .text(BASE_WIDTH * 0.5 - 100, 58, "", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.caption,
        color: theme.palette.accentGold,
      })
      .setOrigin(0.5);
    this.selectedStageText = this.add
      .text(BASE_WIDTH * 0.5 + 14, 58, "", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.body,
        color: theme.palette.textPrimary,
      })
      .setOrigin(0.5);

    const startX = 14;
    const spacing = 132;
    for (let i = 0; i < playableCharacters.length; i += 1) {
      const character = playableCharacters[i];
      const x = startX + i * spacing;
      const card = this.add.container(x, 82);
      const panel = createPanel(this, {
        x: 0,
        y: 0,
        width: 124,
        height: 150,
        fillColor: hexColor(theme.panel.overlayFill),
        borderColor: hexColor(theme.panel.mutedBorder),
        borderAlpha: 0.75,
      });

      const frameOuter = this.add
        .rectangle(62, 42, 100, 54, hexColor(theme.palette.panelElevated), 0.95)
        .setStrokeStyle(2, hexColor(theme.panel.mutedBorder), 0.9)
        .setOrigin(0.5);
      const frameInner = this.add
        .rectangle(62, 42, 92, 46, hexColor(theme.panel.overlayFill), 0.95)
        .setStrokeStyle(1, hexColor(theme.palette.accentBlue), 0.8)
        .setOrigin(0.5);
      const portrait = this.add.image(62, 42, character.portraitKey).setScale(0.38).setTint(character.tint).setOrigin(0.5);
      const dividerTop = this.add.rectangle(62, 70, 104, 2, hexColor(theme.palette.accentBlue), 0.9).setOrigin(0.5);
      const name = this.add
        .text(12, 76, character.displayName, {
          fontFamily: theme.typography.families.uiBody,
          fontSize: theme.typography.body,
          color: theme.palette.textPrimary,
        })
        .setOrigin(0, 0);
      const dividerBottom = this.add.rectangle(62, 94, 104, 1, hexColor(theme.panel.mutedBorder), 0.85).setOrigin(0.5);
      const stats = this.buildStatBars(character, 12, 98);

      const selectionGlow = this.add.rectangle(62, 75, 116, 138, hexColor(theme.palette.accentGold), 0.08).setOrigin(0.5).setVisible(false);
      selectionGlow.setStrokeStyle(2, hexColor(theme.palette.accentGold), 0.95);
      const selectionCursor = this.add.text(10, 8, ">", {
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

    this.bindInputs();

    this.refreshSelection();
    this.refreshStageSelection();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.unbindInputs, this);
  }

  private bindInputs(): void {
    this.input.keyboard?.on("keydown-LEFT", this.onMoveLeft);
    this.input.keyboard?.on("keydown-A", this.onMoveLeft);
    this.input.keyboard?.on("keydown-RIGHT", this.onMoveRight);
    this.input.keyboard?.on("keydown-D", this.onMoveRight);
    this.input.keyboard?.on("keydown-UP", this.onMoveStageUp);
    this.input.keyboard?.on("keydown-DOWN", this.onMoveStageDown);
    this.input.keyboard?.on("keydown-W", this.onMoveStageUp);
    this.input.keyboard?.on("keydown-S", this.onMoveStageDown);
    this.input.keyboard?.on("keydown-ENTER", this.onConfirmSelection);
    this.input.keyboard?.on("keydown-SPACE", this.onConfirmSelection);
  }

  private unbindInputs(): void {
    this.input.keyboard?.off("keydown-LEFT", this.onMoveLeft);
    this.input.keyboard?.off("keydown-A", this.onMoveLeft);
    this.input.keyboard?.off("keydown-RIGHT", this.onMoveRight);
    this.input.keyboard?.off("keydown-D", this.onMoveRight);
    this.input.keyboard?.off("keydown-UP", this.onMoveStageUp);
    this.input.keyboard?.off("keydown-DOWN", this.onMoveStageDown);
    this.input.keyboard?.off("keydown-W", this.onMoveStageUp);
    this.input.keyboard?.off("keydown-S", this.onMoveStageDown);
    this.input.keyboard?.off("keydown-ENTER", this.onConfirmSelection);
    this.input.keyboard?.off("keydown-SPACE", this.onConfirmSelection);
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
          duration: theme.motion.selectBumpMs,
          ease: "Sine.Out",
        });
        this.tweens.add({
          targets: cardView.selectionGlow,
          alpha: { from: 0.2, to: 0.6 },
          duration: theme.motion.pulseFastMs,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
        this.tweens.add({
          targets: cardView.selectionCursor,
          x: cardView.selectionCursor.x + 4,
          duration: theme.motion.revealMediumMs + 40,
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
    this.selectedStageBanner.setStrokeStyle(2, hexColor(theme.palette.accentBlue), 0.8);

    this.tweens.killTweensOf([this.selectedStageText, this.selectedStageIcon, this.selectedStageBanner]);
    this.selectedStageText.setAlpha(0.6);
    this.selectedStageIcon.setAlpha(0.6);
    this.selectedStageBanner.setScale(0.98, 0.98);
    this.tweens.add({
      targets: [this.selectedStageText, this.selectedStageIcon],
      alpha: 1,
      duration: theme.motion.fadeShortMs,
      ease: "Sine.Out",
    });
    this.tweens.add({
      targets: this.selectedStageBanner,
      scaleX: 1,
      scaleY: 1,
      duration: theme.motion.fadeShortMs + 10,
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
        return { ...base, icon: "[MK]", bannerColor: 0x365a3e };
      case "metro_sur":
        return { ...base, icon: "[MT]", bannerColor: 0x2d4468 };
      case "playa_noche":
        return { ...base, icon: "[PL]", bannerColor: 0x4a3568 };
      case "puerto_rojo":
        return { ...base, icon: "[PR]", bannerColor: 0x684040 };
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
