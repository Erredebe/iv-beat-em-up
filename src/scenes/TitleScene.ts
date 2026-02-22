import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";

type MenuAction = "play" | "options" | "instructions" | "credits";

interface MenuItem {
  label: string;
  icon: string;
  action: MenuAction;
}

export class TitleScene extends Phaser.Scene {
  private readonly menuItems: MenuItem[] = [
    { label: "JUGAR", icon: "▶", action: "play" },
    { label: "OPCIONES", icon: "⚙", action: "options" },
    { label: "INSTRUCCIONES", icon: "⌨", action: "instructions" },
    { label: "CRÉDITOS", icon: "★", action: "credits" },
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
    this.loadPersistedOptions();
    this.sound.volume = this.volume;

    this.cameras.main.setBackgroundColor("#07040d");
    this.createBackdrop();
    this.createTitleBlock();
    this.createMenu();
    this.createInfoPanel();
    this.bindInputs();
    this.refreshSelection();
    this.showInstructions();
  }

  private createBackdrop(): void {
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.5, BASE_WIDTH, BASE_HEIGHT, 0x0d1022, 1).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.42, BASE_WIDTH, 120, 0x28174a, 0.45).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, BASE_HEIGHT * 0.6, BASE_WIDTH, 84, 0x11091e, 0.66).setOrigin(0.5);

    const grid = this.add.graphics().setDepth(2);
    grid.lineStyle(1, 0x4f376f, 0.22);
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
    this.add.rectangle(BASE_WIDTH * 0.5, 54, 282, 78, 0x05050a, 0.88).setOrigin(0.5);
    this.add.rectangle(BASE_WIDTH * 0.5, 16, 282, 2, 0xff5ea8, 1).setOrigin(0.5, 0);

    this.add
      .text(BASE_WIDTH * 0.5, 42, "SPAIN 90", {
        fontFamily: "monospace",
        fontSize: "34px",
        color: "#ffd6ea",
        stroke: "#18040f",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 70, "BARRIO. GOLPES. NOCHE.", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#a9deea",
        stroke: "#061017",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(BASE_WIDTH * 0.5, 96, "Madrid, 1995. Recupera tu calle zona por zona.", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fff4fb",
        stroke: "#08080b",
        strokeThickness: 2,
      })
      .setOrigin(0.5);
  }

  private createMenu(): void {
    const startY = 126;
    const spacing = 26;

    for (let i = 0; i < this.menuItems.length; i += 1) {
      const item = this.menuItems[i];
      const y = startY + i * spacing;

      const row = this.add.container(50, y).setDepth(5).setSize(160, 22);
      const background = this.add.rectangle(0, 0, 160, 22, 0x06070d, 0.85).setOrigin(0, 0);
      const border = this.add.rectangle(0, 0, 160, 22, 0x68abff, 0).setOrigin(0, 0).setStrokeStyle(1, 0x68abff, 0.85);
      const label = this.add
        .text(10, 5, `${item.icon} ${item.label}`, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f2f5ff",
          stroke: "#04070b",
          strokeThickness: 2,
        })
        .setName("menu-label");

      row.add([background, border, label]);
      row.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 160, 22),
        Phaser.Geom.Rectangle.Contains,
      );
      row.on("pointerover", () => {
        this.selectedIndex = i;
        this.refreshSelection();
      });
      row.on("pointerdown", () => this.triggerSelectedAction());
      this.buttons.push(row);
    }

    this.add
      .text(50, 234, "↑↓ Navegar  •  ENTER confirmar", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffd7ec",
      })
      .setDepth(5);
  }

  private createInfoPanel(): void {
    this.infoPanel = this.add.container(222, 124).setDepth(5);
    this.infoPanel.add(this.add.rectangle(0, 0, 188, 108, 0x05050a, 0.9).setOrigin(0, 0));
    this.infoPanel.add(this.add.rectangle(0, 0, 188, 2, 0xffc870, 1).setOrigin(0, 0));

    this.infoPanelTitle = this.add.text(10, 8, "INSTRUCCIONES", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ffe2b3",
      stroke: "#130f08",
      strokeThickness: 2,
    });

    this.infoPanelText = this.add.text(10, 24, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#f6f7fb",
      wordWrap: { width: 166 },
      lineSpacing: 5,
    });

    this.optionsVolumeText = this.add.text(10, 24, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#e7f8ff",
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
    this.buttons.forEach((button, index) => {
      const active = index === this.selectedIndex;
      const background = button.list[0] as Phaser.GameObjects.Rectangle;
      const border = button.list[1] as Phaser.GameObjects.Rectangle;
      const label = button.getByName("menu-label") as Phaser.GameObjects.Text;
      background.setFillStyle(active ? 0x1d1b30 : 0x06070d, active ? 0.95 : 0.85);
      border.setStrokeStyle(1, active ? 0xff6fb5 : 0x68abff, active ? 1 : 0.45);
      label.setColor(active ? "#fff7cf" : "#f2f5ff");
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
    this.infoPanelTitle.setText("CRÉDITOS");
    this.infoPanelText.setVisible(true);
    this.optionsVolumeText.setVisible(false);
    this.infoPanelText.setText(
      "Diseño y código: proyecto Spain 90\n\nInspirado en beat 'em ups noventeros de recreativa.\n\nPulsa JUGAR para entrar en la calle.",
    );
  }

  private showPlayPrompt(): void {
    this.infoPanelTitle.setText("MODO HISTORIA");
    this.infoPanelText.setVisible(true);
    this.optionsVolumeText.setVisible(false);
    this.infoPanelText.setText(
      "Un exboxeador vuelve a su barrio para cortar la extorsión.\n\nLimpia la zona, resiste y avanza hasta el jefe final.",
    );
  }

  private showOptions(): void {
    this.infoPanelTitle.setText("OPCIONES");
    this.infoPanelText.setVisible(false);
    this.optionsVolumeText.setVisible(true);
    this.optionsVolumeText.setText(
      `Volumen general: ${Math.round(this.volume * 100)}%\n\nUsa ← → para ajustar.\nEl valor se guarda automáticamente.`,
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
    if (!this.scene.isActive("StreetScene")) {
      this.scene.start("StreetScene");
    }
    if (!this.scene.isActive("HudScene")) {
      this.scene.launch("HudScene");
    }
  }
}
