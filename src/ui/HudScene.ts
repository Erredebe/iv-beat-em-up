import Phaser from "phaser";

interface HudPayload {
  playerHp: number;
  playerMaxHp: number;
  zoneId: string | null;
  targetEnemy: { id: string; hp: number; maxHp: number; ttlMs: number } | null;
  visibleEnemies: Array<{ id: string; hp: number; maxHp: number; x: number; y: number }>;
  controlsHintVisible: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  zoneMessage: string | null;
  bindingHints: { keyboard: string[]; gamepad: string[] };
}

export class HudScene extends Phaser.Scene {
  private hpLabel!: Phaser.GameObjects.Text;
  private zoneLabel!: Phaser.GameObjects.Text;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private hpLag!: Phaser.GameObjects.Rectangle;
  private targetLabel!: Phaser.GameObjects.Text;
  private targetFill!: Phaser.GameObjects.Rectangle;
  private targetPanel!: Phaser.GameObjects.Container;
  private enemyBarsGraphics!: Phaser.GameObjects.Graphics;
  private controlsPanel!: Phaser.GameObjects.Container;
  private pausePanel!: Phaser.GameObjects.Container;
  private tutorialPanel!: Phaser.GameObjects.Container;
  private zoneMessagePanel!: Phaser.GameObjects.Container;
  private gameOverPanel!: Phaser.GameObjects.Container;
  private maxBarWidth = 148;
  private targetBarWidth = 116;
  private currentPayload: HudPayload | null = null;
  private displayedPlayerHp = 0;
  private renderedHintsKey = "";
  private zoneMessageText!: Phaser.GameObjects.Text;

  constructor() {
    super("HudScene");
  }

  create(): void {
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
    this.createMainHud();
    this.createTargetHud();
    this.createControlsPanel();
    this.createPausePanel();
    this.createTutorialPanel();
    this.createZoneMessagePanel();
    this.createGameOverPanel();

    this.enemyBarsGraphics = this.add.graphics().setScrollFactor(0).setDepth(5800);
    this.game.events.on("hud:update", this.onHudUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("hud:update", this.onHudUpdate, this);
    });
  }

  update(): void {
    if (!this.currentPayload) {
      return;
    }

    const hpRatio = Phaser.Math.Clamp(this.currentPayload.playerHp / this.currentPayload.playerMaxHp, 0, 1);
    this.displayedPlayerHp = Phaser.Math.Linear(this.displayedPlayerHp, this.currentPayload.playerHp, 0.18);
    const lagRatio = Phaser.Math.Clamp(this.displayedPlayerHp / this.currentPayload.playerMaxHp, 0, 1);

    this.hpFill.width = Math.floor(this.maxBarWidth * hpRatio);
    this.hpLag.width = Math.floor(this.maxBarWidth * lagRatio);
    this.hpFill.fillColor = hpRatio < 0.25 ? 0xff466a : 0xf0bf45;
    this.hpLabel.setText(`VIDA ${Math.ceil(this.currentPayload.playerHp)} / ${this.currentPayload.playerMaxHp}`);
    const zoneLabel = this.currentPayload.zoneId ? this.formatZoneLabel(this.currentPayload.zoneId) : "CALLE LIBRE";
    this.zoneLabel.setText(`ZONA: ${zoneLabel}`);

    this.updateTargetBar();
    this.drawEnemyBars();
    this.controlsPanel.setVisible(this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.pausePanel.setVisible(this.currentPayload.isPaused);
    this.tutorialPanel.setVisible(this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.zoneMessagePanel.setVisible(Boolean(this.currentPayload.zoneMessage) && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.zoneMessageText.setText(this.currentPayload.zoneMessage ?? "");
    this.gameOverPanel.setVisible(this.currentPayload.isGameOver);
  }

  private createMainHud(): void {
    const frame = this.add.container(0, 0).setScrollFactor(0).setDepth(5600);
    frame.add(this.add.rectangle(8, 6, 188, 46, 0x0a0a11, 0.7).setOrigin(0, 0));
    frame.add(this.add.rectangle(14, 12, 176, 14, 0x1f1a2f, 1).setOrigin(0, 0));
    frame.add(this.add.tileSprite(14, 12, 176, 2, "hud_frame").setOrigin(0, 0).setTint(0x3ad5ff));

    this.hpLag = this.add.rectangle(18, 19, this.maxBarWidth, 8, 0x5c2143, 0.9).setOrigin(0, 0.5).setDepth(5602);
    this.hpFill = this.add.rectangle(18, 19, this.maxBarWidth, 8, 0xf0bf45, 1).setOrigin(0, 0.5).setDepth(5603);
    this.hpLabel = this.add
      .text(18, 24, "VIDA 120 / 120", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      })
      .setDepth(5604);
    this.zoneLabel = this.add
      .text(18, 8, "ZONA: CALLE LIBRE", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#89f6ff",
      })
      .setDepth(5604);
    this.hpLag.setScrollFactor(0);
    this.hpFill.setScrollFactor(0);
    this.hpLabel.setScrollFactor(0);
    this.zoneLabel.setScrollFactor(0);
  }

  private createTargetHud(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5600);
    panel.add(this.add.rectangle(250, 6, 168, 34, 0x090910, 0.68).setOrigin(0, 0));
    panel.add(this.add.rectangle(258, 18, this.targetBarWidth, 7, 0x232334, 1).setOrigin(0, 0.5));
    panel.add(this.add.tileSprite(250, 6, 168, 2, "hud_frame").setOrigin(0, 0).setTint(0xff5ea8));

    this.targetFill = this.add.rectangle(258, 18, this.targetBarWidth, 7, 0xff5a6f, 1).setOrigin(0, 0.5).setDepth(5602);
    this.targetLabel = this.add
      .text(258, 8, "OBJETIVO", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffd1e8",
      })
      .setDepth(5602);
    this.targetFill.setScrollFactor(0);
    this.targetLabel.setScrollFactor(0);
    panel.add([this.targetFill, this.targetLabel]);
    panel.setVisible(false);
    this.targetPanel = panel;
  }

  private createControlsPanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5900);
    panel.add(this.add.rectangle(20, 56, 388, 72, 0x090910, 0.82).setOrigin(0, 0));
    panel.add(this.add.tileSprite(20, 56, 388, 2, "hud_frame").setOrigin(0, 0).setTint(0x50f0ff));
    panel.add(
      this.add.text(26, 62, "CONTROLES", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      }),
    );
    this.controlsPanel = panel;
    panel.setVisible(true);
  }


  private createTutorialPanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5950);
    panel.add(this.add.rectangle(78, 74, 272, 28, 0x05050a, 0.86).setOrigin(0, 0));
    panel.add(this.add.tileSprite(78, 74, 272, 2, "hud_frame").setOrigin(0, 0).setTint(0xffc870));
    panel.add(
      this.add.text(86, 83, "Pulsa ENTER para cerrar la ayuda", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffe6b5",
      }),
    );
    this.tutorialPanel = panel;
    panel.setVisible(true);
  }

  private createZoneMessagePanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5970);
    panel.add(this.add.rectangle(98, 42, 234, 22, 0x05050a, 0.88).setOrigin(0, 0));
    panel.add(this.add.tileSprite(98, 42, 234, 2, "hud_frame").setOrigin(0, 0).setTint(0xff5ea8));
    this.zoneMessageText = this.add.text(106, 48, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffd8ed",
    });
    panel.add(this.zoneMessageText);
    this.zoneMessagePanel = panel;
    panel.setVisible(false);
  }

  private createGameOverPanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(6050);
    panel.add(this.add.rectangle(82, 54, 252, 92, 0x05050a, 0.9).setOrigin(0, 0));
    panel.add(this.add.tileSprite(82, 54, 252, 2, "hud_frame").setOrigin(0, 0).setTint(0xff466a));
    panel.add(
      this.add.text(142, 72, "DERROTA", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ff8da8",
      }),
    );
    panel.add(
      this.add.text(94, 102, "Pulsa ENTER para reiniciar la calle", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffe8ef",
      }),
    );
    this.gameOverPanel = panel;
    panel.setVisible(false);
  }

  private createPausePanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(6000);
    panel.add(this.add.rectangle(26, 38, 376, 162, 0x05050a, 0.9).setOrigin(0, 0));
    panel.add(this.add.tileSprite(26, 38, 376, 2, "hud_frame").setOrigin(0, 0).setTint(0xff6fb5));
    panel.add(
      this.add.text(34, 46, "PAUSA - AYUDA CONTROLES", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fff3fb",
      }),
    );
    this.pausePanel = panel;
    panel.setVisible(false);
  }

  private onHudUpdate(payload: HudPayload): void {
    this.currentPayload = payload;
    if (this.displayedPlayerHp <= 0) {
      this.displayedPlayerHp = payload.playerHp;
    }
    const hintsKey = `${payload.bindingHints.keyboard.join("|")}::${payload.bindingHints.gamepad.join("|")}`;
    if (hintsKey !== this.renderedHintsKey) {
      this.renderedHintsKey = hintsKey;
      this.renderControlsText(payload.bindingHints);
    }
  }

  private renderControlsText(hints: { keyboard: string[]; gamepad: string[] }): void {
    for (const child of [...this.controlsPanel.list, ...this.pausePanel.list]) {
      if (child instanceof Phaser.GameObjects.Text && child.name === "dynamic-control") {
        child.destroy();
      }
    }

    const compact = this.add
      .text(26, 76, `${hints.keyboard[0]}  |  ${hints.keyboard[1]}  |  ${hints.keyboard[2]}  |  ${hints.keyboard[3]}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#d5f5ff",
      })
      .setName("dynamic-control");
    const compact2 = this.add
      .text(26, 92, `${hints.keyboard[4]}  |  ${hints.gamepad[0]}  |  ${hints.gamepad[1]}`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffcfde",
      })
      .setName("dynamic-control");
    this.controlsPanel.add([compact, compact2]);

    let y = 68;
    for (const line of hints.keyboard) {
      const text = this.add
        .text(34, y, line, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#dff7ff",
        })
        .setName("dynamic-control");
      this.pausePanel.add(text);
      y += 14;
    }
    y += 2;
    for (const line of hints.gamepad) {
      const text = this.add
        .text(34, y, line, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#ffd7e9",
        })
        .setName("dynamic-control");
      this.pausePanel.add(text);
      y += 14;
    }
  }

  private formatZoneLabel(zoneId: string): string {
    return zoneId.replace(/_/g, " ").toUpperCase().replace("ZONE", "ZONA");
  }

  private updateTargetBar(): void {
    if (!this.currentPayload) {
      return;
    }
    const target = this.currentPayload.targetEnemy;
    if (!target) {
      this.targetPanel.setVisible(false);
      return;
    }

    this.targetPanel.setVisible(true);
    const ratio = Phaser.Math.Clamp(target.hp / target.maxHp, 0, 1);
    this.targetFill.width = Math.floor(this.targetBarWidth * ratio);
    this.targetLabel.setText(`OBJ ${target.id} ${target.hp}/${target.maxHp}`);
  }

  private drawEnemyBars(): void {
    if (!this.currentPayload) {
      return;
    }

    this.enemyBarsGraphics.clear();
    this.enemyBarsGraphics.setDepth(5750);
    for (const enemy of this.currentPayload.visibleEnemies) {
      const ratio = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
      const width = 24;
      const x = Math.floor(enemy.x - width * 0.5);
      const y = Math.floor(enemy.y);
      this.enemyBarsGraphics.fillStyle(0x090910, 0.8);
      this.enemyBarsGraphics.fillRect(x, y, width, 4);
      this.enemyBarsGraphics.fillStyle(0xd9435f, 1);
      this.enemyBarsGraphics.fillRect(x + 1, y + 1, Math.floor((width - 2) * ratio), 2);
    }
  }
}
