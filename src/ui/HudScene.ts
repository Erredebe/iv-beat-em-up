import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { isFeatureEnabled } from "../config/features";
import { getUiThemeTokens } from "../config/ui/uiTheme";

export interface HudPayload {
  playerHp: number;
  playerMaxHp: number;
  playerName: string;
  playerPortraitKey: string;
  score: number;
  timeRemainingSec: number;
  specialCooldownRatio: number;
  stageName: string;
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
  private static readonly ENEMY_HINT_FADE_THRESHOLD = 5;
  private static readonly ENEMY_BARS_LIMIT_THRESHOLD = 7;
  private static readonly ENEMY_BARS_TARGET_ONLY_THRESHOLD = 11;
  private static readonly ENEMY_BARS_MAX_NEARBY = 4;
  private static readonly ENEMY_BAR_NEARBY_DISTANCE = 84;

  private hpLabel!: Phaser.GameObjects.Text;
  private hpValue!: Phaser.GameObjects.Text;
  private stageLabel!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private timeLabel!: Phaser.GameObjects.Text;
  private specialLabel!: Phaser.GameObjects.Text;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private hpLag!: Phaser.GameObjects.Rectangle;
  private specialFill!: Phaser.GameObjects.Rectangle;
  private portrait!: Phaser.GameObjects.Image;
  private targetLabel!: Phaser.GameObjects.Text;
  private targetFill!: Phaser.GameObjects.Rectangle;
  private targetPanel!: Phaser.GameObjects.Container;
  private enemyBarsGraphics!: Phaser.GameObjects.Graphics;
  private controlsPanel!: Phaser.GameObjects.Container;
  private pausePanel!: Phaser.GameObjects.Container;
  private tutorialPanel!: Phaser.GameObjects.Container;
  private zoneMessagePanel!: Phaser.GameObjects.Container;
  private statusPanel!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private gameOverPanel!: Phaser.GameObjects.Container;
  private gameOverDim!: Phaser.GameObjects.Rectangle;
  private pauseDim!: Phaser.GameObjects.Rectangle;
  private hudElements: Phaser.GameObjects.GameObject[] = [];
  private maxBarWidth = 136;
  private specialBarWidth = 84;
  private targetBarWidth = 120;
  private currentPayload: HudPayload | null = null;
  private displayedPlayerHp = 0;
  private renderedHintsKey = "";
  private wasGameOverVisible = false;
  private previousPlayerHp = 0;
  private activePortraitKey = "";
  private isHudMinimalPreset = false;

  constructor() {
    super("HudScene");
  }

  create(): void {
    this.isHudMinimalPreset = isFeatureEnabled("hudMinimalPreset");
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
    this.createMainHud();
    this.createTargetHud();
    this.createControlsPanel();
    this.createPausePanel();
    this.createTutorialPanel();
    this.createStatusPanel();
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
    this.hpFill.fillColor = hpRatio < 0.25 ? 0xff3b63 : 0xff7b4e;
    this.hpValue.setText(`${roundedHp} / ${this.currentPayload.playerMaxHp}`);

    this.specialFill.width = Math.floor(this.specialBarWidth * Phaser.Math.Clamp(this.currentPayload.specialCooldownRatio, 0, 1));

    this.stageLabel.setText(this.currentPayload.stageName);
    const scoreText = Math.max(0, Math.floor(this.currentPayload.score)).toString().padStart(7, "0").slice(-7);
    this.scoreLabel.setText(`PUNTOS ${scoreText}`);
    this.timeLabel.setText(`TIEMPO ${this.currentPayload.timeRemainingSec.toString().padStart(3, "0")}`);
    this.hpLabel.setText(this.currentPayload.playerName);

    if (this.currentPayload.playerPortraitKey && this.currentPayload.playerPortraitKey !== this.activePortraitKey) {
      this.activePortraitKey = this.currentPayload.playerPortraitKey;
      this.portrait.setTexture(this.activePortraitKey);
    }

    this.updateTargetBar();
    this.drawEnemyBars();
    this.setHudVisible(!this.currentPayload.isGameOver);
    const enemyCount = this.currentPayload.visibleEnemies.length;
    const shouldFadeHints = enemyCount >= HudScene.ENEMY_HINT_FADE_THRESHOLD;
    const controlsVisible = this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver;

    this.controlsPanel.setVisible(controlsVisible);
    this.controlsPanel.setAlpha(shouldFadeHints ? 0.46 : 0.9);
    this.pausePanel.setVisible(this.currentPayload.isPaused);
    this.tutorialPanel.setVisible(this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver);
    this.updateStatusPanel();
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
    const mainHudScale = 0.58;
    const panel = this.add.container(6, 6).setScrollFactor(0).setDepth(5600).setScale(mainHudScale);

    const bg = this.add.rectangle(0, 0, 246, 66, 0x05070a, 0.58).setOrigin(0, 0);
    const border = this.add.rectangle(0, 0, 246, 66, 0x3f5c7a, 0).setOrigin(0, 0).setStrokeStyle(1.5, 0x6f89a3, 0.45);
    const hpBg = this.add.rectangle(46, 21, 164, 11, 0x0a0a14, 0.95).setOrigin(0, 0);

    this.portrait = this.add.image(24, 33, "portrait_kastro").setOrigin(0.5).setScale(0.3).setTint(0xfff4dd);
    this.hpLag = this.add.rectangle(48, 26, this.maxBarWidth, 8, 0x5c2143, 0.86).setOrigin(0, 0.5);
    this.hpFill = this.add.rectangle(48, 26, this.maxBarWidth, 8, 0xf06b3b, 1).setOrigin(0, 0.5);
    this.specialFill = this.add.rectangle(48, 42, this.specialBarWidth, 6, 0x5fd6ff, 1).setOrigin(0, 0.5);

    this.hpLabel = this.add.text(46, 3, "JUGADOR", {
      fontFamily: getUiThemeTokens().typography.families.hudText,
      fontSize: "11px",
      color: "#e8f2ff",
      stroke: "#020304",
      strokeThickness: 2,
    });

    this.hpValue = this.add.text(46, 14, "120 / 120", {
      fontFamily: getUiThemeTokens().typography.families.hudText,
      fontSize: "12px",
      color: "#ffffff",
      stroke: "#020304",
      strokeThickness: 2,
    });

    this.specialLabel = this.add.text(46, 37, "ESP", {
      fontFamily: getUiThemeTokens().typography.families.hudText,
      fontSize: "12px",
      color: "#a8ebff",
      stroke: "#020304",
      strokeThickness: 2,
    });

    this.stageLabel = this.add.text(0, 72, "STAGE", {
      fontFamily: getUiThemeTokens().typography.families.hudText,
      fontSize: "12px",
      color: "#a7e6ff",
      stroke: "#020304",
      strokeThickness: 2,
    });

    this.scoreLabel = this.add
      .text(242, 2, "PUNTOS 000000", {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "12px",
        color: "#fff4cf",
        stroke: "#020304",
        strokeThickness: 2,
        wordWrap: { width: 378, useAdvancedWrap: true },
      })
      .setOrigin(1, 0);

    this.timeLabel = this.add
      .text(242, 14, "TIEMPO 000", {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "12px",
        color: "#ffd498",
        stroke: "#020304",
        strokeThickness: 2,
        wordWrap: { width: 378, useAdvancedWrap: true },
      })
      .setOrigin(1, 0);

    panel.add([
      bg,
      border,
      hpBg,
      this.portrait,
      this.hpLag,
      this.hpFill,
      this.specialFill,
      this.hpLabel,
      this.hpValue,
      this.specialLabel,
      this.stageLabel,
      this.scoreLabel,
      this.timeLabel,
    ]);

    this.hudElements.push(panel);
  }

  private createTargetHud(): void {
    const panelWidth = 174;
    const panelX = BASE_WIDTH - Math.floor(panelWidth * 0.85) - 8;
    const panel = this.add.container(panelX, 8).setScrollFactor(0).setDepth(5600).setScale(0.85);
    panel.add(this.add.rectangle(0, 0, panelWidth, 32, 0x080910, 0.58).setOrigin(0, 0));
    panel.add(this.add.tileSprite(0, 0, panelWidth, 2, "hud_frame").setOrigin(0, 0).setTint(0xff6eb0));

    this.targetFill = this.add.rectangle(8, 14, this.targetBarWidth, 7, 0xff6685, 1).setOrigin(0, 0.5);
    this.targetLabel = this.add
      .text(8, 2, "OBJETIVO", {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "11px",
        color: "#ffdeee",
        stroke: "#1a0b14",
        strokeThickness: 2,
      });
    panel.add([this.targetFill, this.targetLabel]);
    panel.setVisible(false);
    this.targetPanel = panel;
  }

  private createControlsPanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5900);
    panel.add(this.add.rectangle(20, 152, 388, 88, 0x07090f, 0.45).setOrigin(0, 0));
    panel.add(this.add.tileSprite(20, 152, 388, 2, "hud_frame").setOrigin(0, 0).setTint(0x50f0ff));
    panel.add(
      this.add.text(26, 158, "CONTROLES", {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "11px",
        color: "#ffffff",
        stroke: "#030408",
        strokeThickness: 1,
        wordWrap: { width: 378, useAdvancedWrap: true },
      }),
    );
    this.controlsPanel = panel;
    panel.setVisible(true);
  }

  private createTutorialPanel(): void {
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(5950);
    panel.add(this.add.rectangle(78, 224, 272, 28, 0x05050a, 0.86).setOrigin(0, 0));
    panel.add(this.add.tileSprite(78, 224, 272, 2, "hud_frame").setOrigin(0, 0).setTint(0xffc870));
    panel.add(
      this.add.text(86, 233, "Pulsa ENTER para cerrar la ayuda", {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "10px",
        color: "#ffe6b5",
      }),
    );
    this.tutorialPanel = panel;
    panel.setVisible(true);
  }

  private createStatusPanel(): void {
    const panelWidth = 174;
    const panelX = BASE_WIDTH - Math.floor(panelWidth * 0.85) - 8;
    const panelY = 40; 
    const panel = this.add.container(panelX, panelY).setScrollFactor(0).setDepth(5590).setScale(0.85);
    panel.add(this.add.rectangle(0, 0, panelWidth, 24, 0x03050b, 0.58).setOrigin(0, 0));
    panel.add(this.add.tileSprite(0, 0, panelWidth, 2, "hud_frame").setOrigin(0, 0).setTint(0x60f5ff));
    this.statusText = this.add.text(8, 6, "", {
      fontFamily: getUiThemeTokens().typography.families.hudText,
      fontSize: "11px",
      color: "#e2f7ff",
      stroke: "#021118",
      strokeThickness: 2,
      wordWrap: { width: 158, useAdvancedWrap: true },
      maxLines: 1,
    });
    panel.add(this.statusText);
    this.statusPanel = panel;
    this.zoneMessagePanel = panel;
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
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "22px",
        color: "#ff8da8",
      }),
    );
    panel.add(
      this.add.text(panelX + 44, panelY + 64, "Pulsa ENTER para reiniciar", {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "11px",
        color: "#fff8fb",
        stroke: "#1d0f16",
        strokeThickness: 1,
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
        fontFamily: getUiThemeTokens().typography.families.hudText,
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
      .text(26, 174, `${hints.keyboard[0]}  |  ${hints.keyboard[1]}  |  ${hints.keyboard[2]}`, {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "10px",
        color: "#e8f7ff",
        stroke: "#04070b",
        strokeThickness: 1,
        wordWrap: { width: 376, useAdvancedWrap: true },
      })
      .setName("dynamic-control");
    const compact2 = this.add
      .text(26, 192, `${hints.keyboard[3]}  |  ${hints.keyboard[4]}`, {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "10px",
        color: "#ffdeea",
        stroke: "#080307",
        strokeThickness: 1,
        wordWrap: { width: 376, useAdvancedWrap: true },
      })
      .setName("dynamic-control");
    const compact3 = this.add
      .text(26, 210, `${hints.gamepad[0]}  |  ${hints.gamepad[1]}`, {
        fontFamily: getUiThemeTokens().typography.families.hudText,
        fontSize: "10px",
        color: "#ffd6e7",
        stroke: "#080307",
        strokeThickness: 1,
        wordWrap: { width: 376, useAdvancedWrap: true },
      })
      .setName("dynamic-control");
    this.controlsPanel.add([compact, compact2, compact3]);

    this.pausePanel.add(
      this.add
        .text(48, 82, "TECLADO", {
          fontFamily: getUiThemeTokens().typography.families.hudText,
          fontSize: "11px",
          color: "#a9deea",
          stroke: "#04070b",
          strokeThickness: 1,
        })
        .setName("dynamic-control"),
    );
    this.pausePanel.add(
      this.add
        .text(220, 82, "GAMEPAD", {
          fontFamily: getUiThemeTokens().typography.families.hudText,
          fontSize: "11px",
          color: "#f0c8d9",
          stroke: "#080307",
          strokeThickness: 1,
        })
        .setName("dynamic-control"),
    );

    let y = 102;
    for (const line of hints.keyboard) {
      const text = this.add
        .text(48, y, line, {
          fontFamily: getUiThemeTokens().typography.families.hudText,
          fontSize: "11px",
          color: "#e7f3f7",
          stroke: "#04070b",
          strokeThickness: 1,
        })
        .setName("dynamic-control");
      this.pausePanel.add(text);
      y += 14;
    }
    y = 102;
    for (const line of hints.gamepad) {
      const text = this.add
        .text(220, y, line, {
          fontFamily: getUiThemeTokens().typography.families.hudText,
          fontSize: "11px",
          color: "#fae5ee",
          stroke: "#080307",
          strokeThickness: 1,
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
    if (this.currentPayload.isGameOver) {
      this.targetPanel.setVisible(false);
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
    const shortId = target.id.length > 6 ? target.id.slice(-6) : target.id;
    this.targetLabel.setText(`OBJ ${shortId} ${target.hp}/${target.maxHp}`);
  }

  private drawEnemyBars(): void {
    if (!this.currentPayload) {
      return;
    }

    this.enemyBarsGraphics.clear();
    this.enemyBarsGraphics.setDepth(5750);
    const visibleEnemies = this.selectEnemiesForBars();
    for (const enemy of visibleEnemies) {
      const ratio = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
      const width = 30;
      const x = Math.floor(enemy.x - width * 0.5);
      const y = Math.floor(enemy.y);
      this.enemyBarsGraphics.fillStyle(0x080912, 0.86);
      this.enemyBarsGraphics.fillRect(x, y, width, 5);
      this.enemyBarsGraphics.fillStyle(0xff5470, 1);
      this.enemyBarsGraphics.fillRect(x + 1, y + 1, Math.floor((width - 2) * ratio), 3);
    }
  }

  private selectEnemiesForBars(): Array<{ id: string; hp: number; maxHp: number; x: number; y: number }> {
    if (!this.currentPayload) {
      return [];
    }

    const enemies = this.currentPayload.visibleEnemies;
    if (enemies.length <= HudScene.ENEMY_BARS_LIMIT_THRESHOLD) {
      return enemies;
    }

    const targetId = this.currentPayload.targetEnemy?.id;
    if (targetId && enemies.length >= HudScene.ENEMY_BARS_TARGET_ONLY_THRESHOLD) {
      return enemies.filter((enemy) => enemy.id === targetId);
    }

    const playerFocusY = BASE_HEIGHT * 0.66;
    const closeEnemies = enemies
      .filter((enemy) => Math.abs(enemy.y - playerFocusY) <= HudScene.ENEMY_BAR_NEARBY_DISTANCE)
      .sort((a, b) => Math.abs(a.y - playerFocusY) - Math.abs(b.y - playerFocusY))
      .slice(0, HudScene.ENEMY_BARS_MAX_NEARBY);

    if (targetId) {
      const target = enemies.find((enemy) => enemy.id === targetId);
      if (target && !closeEnemies.some((enemy) => enemy.id === target.id)) {
        closeEnemies.unshift(target);
      }
    }

    return closeEnemies.length > 0 ? closeEnemies : enemies.slice(0, HudScene.ENEMY_BARS_MAX_NEARBY);
  }

  private updateStatusPanel(): void {
    if (!this.currentPayload) {
      return;
    }

    const panelVisible = !this.currentPayload.controlsHintVisible && !this.currentPayload.isPaused && !this.currentPayload.isGameOver;
    this.statusPanel.setVisible(panelVisible);
    if (!panelVisible) {
      return;
    }

    const zoneLine = this.currentPayload.zoneId ? this.formatZoneLabel(this.currentPayload.zoneId) : null;
    const statusLine = this.currentPayload.zoneMessage?.trim() || this.currentPayload.objectiveText.trim() || zoneLine || "SIGUE ADELANTE";

    this.statusText.setText(this.isHudMinimalPreset ? this.compactStatusText(statusLine) : statusLine);
    this.statusPanel.setAlpha(this.isHudMinimalPreset ? 0.82 : 1);
  }

  private compactStatusText(text: string): string {
    const cleanText = text.replace(/\s+/g, " ").trim();
    if (cleanText.length <= 34) {
      return cleanText;
    }
    return `${cleanText.slice(0, 31)}...`;
  }

  private setHudVisible(visible: boolean): void {
    for (const obj of this.hudElements) {
      (obj as Phaser.GameObjects.GameObject & { setVisible: (value: boolean) => Phaser.GameObjects.GameObject }).setVisible(
        visible,
      );
    }
    this.enemyBarsGraphics?.setVisible(visible);
    if (!visible) {
      this.targetPanel.setVisible(false);
      this.statusPanel.setVisible(false);
      this.controlsPanel.setVisible(false);
      this.tutorialPanel.setVisible(false);
      this.zoneMessagePanel.setVisible(false);
    }
  }
}
