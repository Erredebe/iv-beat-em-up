import Phaser from "phaser";
import { BASE_WIDTH } from "../config/constants";
import { isFeatureEnabled } from "../config/features";
import { resetSessionState } from "../config/gameplay/sessionState";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { createFooterHint, createPanel, createSceneBackdrop, createSceneTitle, hexColor } from "../ui/sceneChrome";
import { resolveNextSceneFromTitle } from "./sceneFlow";

type MenuAction = "play" | "options" | "instructions" | "credits";

interface MenuItem {
  label: string;
  action: MenuAction;
}

export class TitleScene extends Phaser.Scene {
  private readonly menuItems: MenuItem[] = [
    { label: "JUGAR", action: "play" },
    { label: "OPCIONES", action: "options" },
    { label: "INSTRUCCIONES", action: "instructions" },
    { label: "CREDITOS", action: "credits" },
  ];

  private selectedIndex = 0;
  private buttons: Phaser.GameObjects.Container[] = [];
  private infoPanel!: Phaser.GameObjects.Container;
  private infoPanelText!: Phaser.GameObjects.Text;
  private infoPanelTitle!: Phaser.GameObjects.Text;
  private optionsVolumeText!: Phaser.GameObjects.Text;
  private volume = 0.7;
  private readonly onMoveSelectionUp = () => this.moveSelection(-1);
  private readonly onMoveSelectionDown = () => this.moveSelection(1);
  private readonly onConfirmSelection = () => this.triggerSelectedAction();
  private readonly onVolumeLeft = () => this.changeVolume(-0.1);
  private readonly onVolumeRight = () => this.changeVolume(0.1);

  constructor() {
    super("TitleScene");
  }

  create(): void {
    const theme = getUiThemeTokens();
    this.loadPersistedOptions();
    this.sound.volume = this.volume;

    this.cameras.main.setBackgroundColor(theme.palette.bgPrimary);
    this.createBackdrop();
    this.createTitleBlock();
    this.createMenu();
    this.createInfoPanel();
    this.bindInputs();
    this.refreshSelection();
    this.showInstructions();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.unbindInputs, this);
  }

  private createBackdrop(): void {
    const theme = getUiThemeTokens();
    createSceneBackdrop(this, { variant: "title", includeOrb: true });
    this.add.rectangle(BASE_WIDTH * 0.5, 74, BASE_WIDTH - 40, 1, hexColor(theme.palette.accentPink), 0.24).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, 210, BASE_WIDTH - 64, 1, hexColor(theme.palette.accentBlue), 0.18).setOrigin(0.5);
    const moon = this.add.circle(348, 56, 24, hexColor(theme.palette.accentGold), 0.55).setDepth(2);
    this.tweens.add({
      targets: moon,
      alpha: 0.3,
      duration: theme.motion.pulseSlowMs,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  private createTitleBlock(): void {
    const theme = getUiThemeTokens();
    createPanel(this, {
      x: BASE_WIDTH * 0.5 - 141,
      y: 15,
      width: 282,
      height: 78,
      fillColor: hexColor(theme.palette.panelElevated),
      fillAlpha: 0.88,
      borderColor: hexColor(theme.panel.mutedBorder),
      borderAlpha: 0.65,
      topAccentColor: hexColor(theme.palette.accentPink),
      topAccentHeight: 2,
    });

    createSceneTitle(this, {
      x: BASE_WIDTH * 0.5,
      y: 28,
      title: "SPAIN 90",
      subtitle: "BARRIO. GOLPES. NOCHE.",
      description: "Madrid, 1995. Recupera tu calle zona por zona.",
      titleSize: theme.typography.hero,
      subtitleSize: theme.typography.subtitle,
      descriptionSize: theme.typography.body,
    });
  }

  private createMenu(): void {
    const theme = getUiThemeTokens();
    const startY = 118;
    const spacing = 28;

    for (let i = 0; i < this.menuItems.length; i += 1) {
      const item = this.menuItems[i];
      const y = startY + i * spacing;

      const row = this.add.container(48, y).setDepth(5).setSize(164, 24);
      const panel = createPanel(this, {
        x: 0,
        y: 0,
        width: 164,
        height: 24,
        fillColor: hexColor(theme.panel.overlayFill),
        fillAlpha: 0.9,
        borderColor: hexColor(theme.panel.mutedBorder),
        borderWidth: 1,
        borderAlpha: 0.75,
      });
      const label = this.add
        .text(12, 6, item.label, {
          fontFamily: theme.typography.families.uiTitle,
          fontSize: theme.typography.subtitle,
          color: theme.palette.textPrimary,
          stroke: theme.textStroke.light.color,
          strokeThickness: theme.textStroke.light.thickness,
        })
        .setName("menu-label");

      row.add([panel.fill, panel.border, label]);
      row.setInteractive(new Phaser.Geom.Rectangle(0, 0, 164, 24), Phaser.Geom.Rectangle.Contains);
      row.on("pointerover", () => {
        this.selectedIndex = i;
        this.refreshSelection();
      });
      row.on("pointerdown", () => this.triggerSelectedAction());
      this.buttons.push(row);
    }

    createFooterHint(this, {
      text: "UP/DOWN navegar  |  ENTER confirmar",
      y: 218,
      depth: 5,
      accentColor: hexColor(theme.palette.accentPink),
    });
  }

  private createInfoPanel(): void {
    const theme = getUiThemeTokens();
    const panel = createPanel(this, {
      x: 222,
      y: 124,
      width: 188,
      height: 108,
      depth: 5,
      fillColor: hexColor(theme.palette.panelElevated),
      fillAlpha: 0.9,
      borderColor: hexColor(theme.panel.mutedBorder),
      borderAlpha: 0.55,
      topAccentColor: hexColor(theme.palette.accentGold),
      topAccentHeight: 2,
    });

    this.infoPanel = panel.container;
    this.infoPanelTitle = this.add.text(10, 8, "INSTRUCCIONES", {
      fontFamily: theme.typography.families.uiBody,
      fontSize: theme.typography.subtitle,
      color: theme.palette.textHighlight,
      stroke: theme.textStroke.light.color,
      strokeThickness: theme.textStroke.light.thickness,
    });

    this.infoPanelText = this.add.text(10, 24, "", {
      fontFamily: theme.typography.families.uiBody,
      fontSize: theme.typography.caption,
      color: theme.palette.textPrimary,
      wordWrap: { width: 166 },
      lineSpacing: 5,
    });

    this.optionsVolumeText = this.add.text(10, 24, "", {
      fontFamily: theme.typography.families.uiBody,
      fontSize: theme.typography.caption,
      color: theme.palette.textSecondary,
      lineSpacing: 5,
    });

    this.infoPanel.add([this.infoPanelTitle, this.infoPanelText, this.optionsVolumeText]);
    this.optionsVolumeText.setVisible(false);
  }

  private bindInputs(): void {
    this.input.keyboard?.on("keydown-UP", this.onMoveSelectionUp);
    this.input.keyboard?.on("keydown-DOWN", this.onMoveSelectionDown);
    this.input.keyboard?.on("keydown-ENTER", this.onConfirmSelection);
    this.input.keyboard?.on("keydown-SPACE", this.onConfirmSelection);
    this.input.keyboard?.on("keydown-LEFT", this.onVolumeLeft);
    this.input.keyboard?.on("keydown-RIGHT", this.onVolumeRight);
  }

  private unbindInputs(): void {
    this.input.keyboard?.off("keydown-UP", this.onMoveSelectionUp);
    this.input.keyboard?.off("keydown-DOWN", this.onMoveSelectionDown);
    this.input.keyboard?.off("keydown-ENTER", this.onConfirmSelection);
    this.input.keyboard?.off("keydown-SPACE", this.onConfirmSelection);
    this.input.keyboard?.off("keydown-LEFT", this.onVolumeLeft);
    this.input.keyboard?.off("keydown-RIGHT", this.onVolumeRight);
  }

  private moveSelection(delta: number): void {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, this.menuItems.length);
    this.refreshSelection();
  }

  private refreshSelection(): void {
    const theme = getUiThemeTokens();
    this.buttons.forEach((button, index) => {
      const active = index === this.selectedIndex;
      const background = button.list[0] as Phaser.GameObjects.Rectangle;
      const border = button.list[1] as Phaser.GameObjects.Rectangle;
      const label = button.getByName("menu-label") as Phaser.GameObjects.Text;
      background.setFillStyle(active ? hexColor(theme.panel.highlightFill) : hexColor(theme.panel.overlayFill), active ? 0.98 : 0.88);
      border.setStrokeStyle(1, active ? hexColor(theme.palette.accentPink) : hexColor(theme.panel.mutedBorder), active ? 1 : 0.55);
      label.setColor(active ? theme.palette.textHighlight : theme.palette.textPrimary);
      button.setX(active ? 52 : 48);
    });

    const action = this.menuItems[this.selectedIndex].action;
    if (action === "instructions") {
      this.showInstructions();
      return;
    }
    if (action === "credits") {
      this.showCredits();
      return;
    }
    if (action === "options") {
      this.showOptions();
      return;
    }
    this.showPlayPrompt();
  }

  private triggerSelectedAction(): void {
    const action = this.menuItems[this.selectedIndex].action;
    if (action === "play") {
      this.startGame();
      return;
    }
    if (action === "options") {
      this.changeVolume(0);
      return;
    }
    if (action === "instructions") {
      this.showInstructions();
      return;
    }
    this.showCredits();
  }

  private showInstructions(): void {
    this.infoPanelTitle.setText("INSTRUCCIONES");
    this.infoPanelText.setVisible(true);
    this.optionsVolumeText.setVisible(false);
    this.infoPanelText.setText(
      "Movimiento: Flechas\nAtaque: Z\nSalto: X\nEspecial: C\nPausa: ESC\n\nDerrota enemigos para desbloquear cada zona.",
    );
  }

  private showCredits(): void {
    this.infoPanelTitle.setText("CREDITOS");
    this.infoPanelText.setVisible(true);
    this.optionsVolumeText.setVisible(false);
    this.infoPanelText.setText(
      "Diseno y codigo: proyecto Spain 90\n\nInspirado en beat 'em ups noventeros de recreativa.",
    );
  }

  private showPlayPrompt(): void {
    this.infoPanelTitle.setText("MODO HISTORIA");
    this.infoPanelText.setVisible(true);
    this.optionsVolumeText.setVisible(false);
    this.infoPanelText.setText(
      "Kastro, Marina y Meneillos se plantan contra la extorsion del barrio.\n\nLimpia zonas, derrota cabecillas y recupera territorio.",
    );
  }

  private showOptions(): void {
    this.infoPanelTitle.setText("OPCIONES");
    this.infoPanelText.setVisible(false);
    this.optionsVolumeText.setVisible(true);
    this.optionsVolumeText.setText(
      `Volumen general: ${Math.round(this.volume * 100)}%\n\nUsa LEFT/RIGHT para ajustar.\nEl valor se guarda automaticamente.`,
    );
  }

  private changeVolume(delta: number): void {
    if (this.menuItems[this.selectedIndex].action !== "options") {
      return;
    }

    this.volume = Phaser.Math.Clamp(this.volume + delta, 0, 1);
    this.sound.volume = this.volume;
    window.localStorage.setItem("spain90.masterVolume", this.volume.toFixed(2));
    this.showOptions();
  }

  private loadPersistedOptions(): void {
    const stored = window.localStorage.getItem("spain90.masterVolume");
    const parsed = stored ? Number.parseFloat(stored) : Number.NaN;
    if (Number.isFinite(parsed)) {
      this.volume = Phaser.Math.Clamp(parsed, 0, 1);
    }
  }

  private startGame(): void {
    resetSessionState();
    this.scene.start(
      resolveNextSceneFromTitle({
        characterSelect: isFeatureEnabled("characterSelect"),
        storyIntro: isFeatureEnabled("storyIntro"),
      }),
    );
  }
}
