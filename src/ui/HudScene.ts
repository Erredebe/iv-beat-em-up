import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";

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
  objectiveText: string;
}

export class HudScene extends Phaser.Scene {
  private hpLabel!: Phaser.GameObjects.Text;
  private hpValue!: Phaser.GameObjects.Text;
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
  private gameOverDim!: Phaser.GameObjects.Rectangle;
  private pauseDim!: Phaser.GameObjects.Rectangle;
  private maxBarWidth = 148;
  private targetBarWidth = 116;
  private currentPayload: HudPayload | null = null;
  private displayedPlayerHp = 0;
  private renderedHintsKey = "";
  private zoneMessageText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private wasGameOverVisible = false;
  private previousPlayerHp = 0;

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
    this.createObjectivePanel();
    this.createGameOverPanel();
    this.createCrtOverlay();

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

    const roundedHp = Math.ceil(this.currentPayload.playerHp);
    if (this.previousPlayerHp > 0 && roundedHp < this.previousPlayerHp) {
      this.pulseHpBar();
    }
    this.previousPlayerHp = roundedHp;

    this.hpFill.width = Math.floor(this.maxBarWidth * hpRatio);
    this.hpLag.width = Math.floor(this.maxBarWidth * lagRatio);
    this.hpFill.fillColor = hpRatio < 0.25 ? 0xff466a : 0xf06b3b;
    this.hpValue.setText(`${roundedHp} / ${this.currentPayload.playerMaxHp}`);
    const zoneLabel = this.currentPayload.zoneId ? this.formatZoneLabel(this.currentPayload.zoneId) : "CALLE LIBRE";
    this.zoneLabel.setText(zoneLabel);

    this.updateTargetBar();
    this.drawEnemyBars();
    this.controlsPanel.setVisible(this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.pausePanel.setVisible(this.currentPayload.isPaused);
    this.tutorialPanel.setVisible(this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.zoneMessagePanel.setVisible(Boolean(this.currentPayload.zoneMessage) && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.zoneMessageText.setText(this.currentPayload.zoneMessage ?? "");
    this.objectiveText.setText(this.currentPayload.objectiveText);
    this.gameOverPanel.setVisible(this.currentPayload.isGameOver);

    this.pauseDim.setVisible(this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    if (this.currentPayload.isGameOver && !this.wasGameOverVisible) {
      this.wasGameOverVisible = true;
      this.gameOverPanel.setAlpha(0);
      this.gameOverDim.setAlpha(0);
      this.gameOverDim.setVisible(true);
      this.tweens.add({
        targets: [this.gameOverPanel, this.gameOverDim],
        alpha: 1,
        duration: 240,
        ease: "Quad.Out",
      });
    } else if (!this.currentPayload.isGameOver) {
      this.wasGameOverVisible = false;
      this.gameOverDim.setVisible(false);
      this.gameOverDim.setAlpha(0);
    }
  }

  private createMainHud(): void {
    const frame = this.add.container(0, 0).setScrollFactor(0).setDepth(5600);
    frame.add(this.add.rectangle(8, 8, 196, 54, 0x070a12, 0.78).setOrigin(0, 0));
    frame.add(this.add.rectangle(8, 8, 196, 54, 0x3f5c7a, 0).setOrigin(0, 0).setStrokeStyle(1, 0x6f89a3, 0.9));
    frame.add(this.add.rectangle(18, 28, 174, 12, 0x161522, 1).setOrigin(0, 0));
    frame.add(this.add.rectangle(18, 28, 174, 12, 0x5e5b72, 0).setOrigin(0, 0).setStrokeStyle(1, 0x54526b, 1));

    this.hpLag = this.add.rectangle(21, 34, this.maxBarWidth, 8, 0x5c2143, 0.92).setOrigin(0, 0.5).setDepth(5602);
    this.hpFill = this.add.rectangle(21, 34, this.maxBarWidth, 8, 0xf06b3b, 1).setOrigin(0, 0.5).setDepth(5603);
    this.hpLabel = this.add
      .text(18, 13, "VIDA", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#d4dee7",
        stroke: "#06080d",
        strokeThickness: 2,
      })
      .setDepth(5604);
    this.hpValue = this.add
      .text(58, 13, "120 / 120", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffffff",
        stroke: "#06080d",
        strokeThickness: 2,
      })
      .setDepth(5604);
    this.zoneLabel = this.add
      .text(18, 46, "CALLE LIBRE", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9fd6e3",
        stroke: "#06080d",
        strokeThickness: 2,
      })
      .setDepth(5604);
    this.hpLag.setScrollFactor(0);
    this.hpFill.setScrollFactor(0);
    this.hpLabel.setScrollFactor(0);
    this.hpValue.setScrollFactor(0);
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
    panel.add(this.add.rectangle(20, 56, 388, 88, 0x07090f, 0.9).setOrigin(0, 0));
    panel.add(this.add.tileSprite(20, 56, 388, 2, "hud_frame").setOrigin(0, 0).setTint(0x50f0ff));
    panel.add(
      this.add.text(26, 62, "CONTROLES", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffffff",
        stroke: "#030408",
        strokeThickness: 2,
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
    panel.add(this.add.rectangle(84, 40, 262, 26, 0x040409, 0.94).setOrigin(0, 0));
    panel.add(this.add.tileSprite(84, 40, 262, 2, "hud_frame").setOrigin(0, 0).setTint(0xff5ea8));
    this.zoneMessageText = this.add.text(92, 47, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ffe7f4",
      stroke: "#060309",
      strokeThickness: 2,
    });
    panel.add(this.zoneMessageText);
    this.zoneMessagePanel = panel;
    panel.setVisible(false);
  }


  private createObjectivePanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5960);
    panel.add(this.add.rectangle(84, 12, 262, 24, 0x040409, 0.9).setOrigin(0, 0));
    panel.add(this.add.tileSprite(84, 12, 262, 2, "hud_frame").setOrigin(0, 0).setTint(0x50f0ff));
    this.objectiveText = this.add.text(92, 18, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#d9f4ff",
      stroke: "#041018",
      strokeThickness: 2,
    });
    panel.add(this.objectiveText);
  }

  private createGameOverPanel(): void {
    this.gameOverDim = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x000000, 0.84)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(6040)
      .setVisible(false);

    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(6050);
    const panelX = Math.floor((BASE_WIDTH - 252) * 0.5);
    const panelY = Math.floor((BASE_HEIGHT - 96) * 0.5);
    panel.add(this.add.rectangle(panelX, panelY, 252, 96, 0x05050a, 0.94).setOrigin(0, 0));
    panel.add(this.add.tileSprite(panelX, panelY, 252, 2, "hud_frame").setOrigin(0, 0).setTint(0xff466a));
    panel.add(this.add.rectangle(panelX + 24, panelY + 53, 204, 1, 0x6f465b, 0.9).setOrigin(0, 0));
    panel.add(
      this.add.text(panelX + 76, panelY + 20, "DERROTA", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff8da8",
      }),
    );
    panel.add(
      this.add.text(panelX + 44, panelY + 64, "Pulsa ENTER para reiniciar", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fff8fb",
        stroke: "#1d0f16",
        strokeThickness: 2,
      }),
    );
    this.gameOverPanel = panel;
    panel.setVisible(false);
  }

  private createPausePanel(): void {
    this.pauseDim = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x000000, 0.66)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(5990)
      .setVisible(false);

    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(6000);
    panel.add(this.add.rectangle(32, 32, 364, 172, 0x06070c, 0.95).setOrigin(0, 0));
    panel.add(this.add.tileSprite(32, 32, 364, 2, "hud_frame").setOrigin(0, 0).setTint(0xff6fb5));
    panel.add(
      this.add.text(48, 48, "PAUSA", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f2dbe6",
      }),
    );
    panel.add(this.add.rectangle(48, 72, 332, 1, 0x5f5160, 0.95).setOrigin(0, 0));
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
      .text(26, 78, `${hints.keyboard[0]}  |  ${hints.keyboard[1]}  |  ${hints.keyboard[2]}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#e8f7ff",
        stroke: "#04070b",
        strokeThickness: 2,
      })
      .setName("dynamic-control");
    const compact2 = this.add
      .text(26, 96, `${hints.keyboard[3]}  |  ${hints.keyboard[4]}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffdeea",
        stroke: "#080307",
        strokeThickness: 2,
      })
      .setName("dynamic-control");
    const compact3 = this.add
      .text(26, 114, `${hints.gamepad[0]}  |  ${hints.gamepad[1]}`, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffd6e7",
        stroke: "#080307",
        strokeThickness: 2,
      })
      .setName("dynamic-control");
    this.controlsPanel.add([compact, compact2, compact3]);

    this.pausePanel.add(
      this.add
        .text(48, 82, "TECLADO", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#a9deea",
          stroke: "#04070b",
          strokeThickness: 2,
        })
        .setName("dynamic-control"),
    );
    this.pausePanel.add(
      this.add
        .text(220, 82, "GAMEPAD", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f0c8d9",
          stroke: "#080307",
          strokeThickness: 2,
        })
        .setName("dynamic-control"),
    );

    let y = 102;
    for (const line of hints.keyboard) {
      const text = this.add
        .text(48, y, line, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#e7f3f7",
          stroke: "#04070b",
          strokeThickness: 2,
        })
        .setName("dynamic-control");
      this.pausePanel.add(text);
      y += 14;
    }
    y = 102;
    for (const line of hints.gamepad) {
      const text = this.add
        .text(220, y, line, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#fae5ee",
          stroke: "#080307",
          strokeThickness: 2,
        })
        .setName("dynamic-control");
      this.pausePanel.add(text);
      y += 14;
    }
  }

  private createCrtOverlay(): void {
    const enabled = new URLSearchParams(window.location.search).get("crt") === "1";
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(6035);
    if (enabled) {
      overlay.fillStyle(0x0a0d12, 0.09);
      for (let y = 0; y < BASE_HEIGHT; y += 2) {
        overlay.fillRect(0, y, BASE_WIDTH, 1);
      }
      overlay.fillStyle(0x111622, 0.05);
      for (let i = 0; i < 180; i += 1) {
        const x = Math.floor(Math.random() * BASE_WIDTH);
        const y = Math.floor(Math.random() * BASE_HEIGHT);
        overlay.fillRect(x, y, 1, 1);
      }
    }
  }

  private pulseHpBar(): void {
    this.tweens.killTweensOf(this.hpFill);
    this.tweens.add({
      targets: this.hpFill,
      scaleY: 1.22,
      duration: 70,
      yoyo: true,
      ease: "Quad.Out",
    });
  }

  private formatZoneLabel(zoneId: string): string {
    return zoneId.replace(/_/g, " ").toUpperCase().replace("ZONE", "ZONA").trim();
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
