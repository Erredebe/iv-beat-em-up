import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { isFeatureEnabled } from "../config/features";
import { resetSessionState } from "../config/gameplay/sessionState";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { createPanel, createSceneTitle } from "../ui/sceneChrome";

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
  }

  private createBackdrop(): void {
    const theme = getUiThemeTokens();
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x0d1022, 1).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.42, BASE_WIDTH, 120, 0x28174a, 0.45).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.6, BASE_WIDTH, 84, 0x11091e, 0.66).setOrigin(0.5);

    const grid = this.add.graphics().setDepth(2);
    grid.lineStyle(1, Number.parseInt(theme.palette.accentBlue.replace("#", "0x"), 16), 0.22);
    for (let y = 92; y < BASE_HEIGHT; y += 18) {
      grid.lineBetween(0, y, BASE_WIDTH, y);
    }

    const moon = this.add.circle(348, 56, 24, 0xffc26f, 0.8).setDepth(1);
    this.tweens.add({
      targets: moon,
      alpha: 0.55,
      duration: 1200,
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
      fillColor: 0x05050a,
      fillAlpha: 0.88,
      topAccentColor: Number.parseInt(theme.palette.accentPink.replace("#", "0x"), 16),
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
    const startY = 126;
    const spacing = 26;

    for (let i = 0; i < this.menuItems.length; i += 1) {
      const item = this.menuItems[i];
      const y = startY + i * spacing;

      const row = this.add.container(50, y).setDepth(5).setSize(160, 22);
      const panel = createPanel(this, {
        x: 0,
        y: 0,
        width: 160,
        height: 22,
        fillAlpha: 0.85,
        borderWidth: 1,
        borderAlpha: 0.85,
      });
      const label = this.add
        .text(10, 5, item.label, {
          fontFamily: theme.typography.families.uiTitle,
          fontSize: theme.typography.subtitle,
          color: theme.palette.textPrimary,
          stroke: theme.textStroke.light.color,
          strokeThickness: theme.textStroke.light.thickness,
        })
        .setName("menu-label");

      row.add([panel.fill, panel.border, label]);
      row.setInteractive(new Phaser.Geom.Rectangle(0, 0, 160, 22), Phaser.Geom.Rectangle.Contains);
      row.on("pointerover", () => {
        this.selectedIndex = i;
        this.refreshSelection();
      });
      row.on("pointerdown", () => this.triggerSelectedAction());
      this.buttons.push(row);
    }

    this.add
      .text(50, 228, "UP/DOWN para navegar  |  ENTER confirmar", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.subtitle,
        color: theme.palette.textSecondary,
      })
      .setDepth(5);
  }

  private createInfoPanel(): void {
    const theme = getUiThemeTokens();
    const panel = createPanel(this, {
      x: 222,
      y: 124,
      width: 188,
      height: 108,
      depth: 5,
      fillColor: 0x05050a,
      fillAlpha: 0.9,
      borderAlpha: 0,
      topAccentColor: Number.parseInt(theme.palette.accentGold.replace("#", "0x"), 16),
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
    this.input.keyboard?.on("keydown-UP", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-DOWN", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.triggerSelectedAction());
    this.input.keyboard?.on("keydown-SPACE", () => this.triggerSelectedAction());
    this.input.keyboard?.on("keydown-LEFT", () => this.changeVolume(-0.1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.changeVolume(0.1));
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
      background.setFillStyle(active ? Number.parseInt(theme.panel.highlightFill.replace("#", "0x"), 16) : Number.parseInt(theme.palette.panelFill.replace("#", "0x"), 16), active ? 0.95 : 0.85);
      border.setStrokeStyle(1, active ? Number.parseInt(theme.palette.accentPink.replace("#", "0x"), 16) : Number.parseInt(theme.palette.accentBlue.replace("#", "0x"), 16), active ? 1 : 0.45);
      label.setColor(active ? theme.palette.textHighlight : theme.palette.textPrimary);
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
    if (isFeatureEnabled("characterSelect")) {
      this.scene.start("CharacterSelectScene");
      return;
    }
    this.scene.start("StreetScene");
  }
}
