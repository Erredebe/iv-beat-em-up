import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "../config/constants";
import { isFeatureEnabled } from "../config/features";
import type { HudPayload } from "../config/ui/hudPayload";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { depthLayers } from "../config/visual/depthLayers";
import { hexColor } from "./sceneChrome";

export class HudScene extends Phaser.Scene {
  private static readonly ENEMY_HINT_FADE_THRESHOLD = 5;
  private static readonly ENEMY_BARS_LIMIT_THRESHOLD = 6;
  private static readonly ENEMY_BARS_TARGET_ONLY_THRESHOLD = 9;
  private static readonly ENEMY_BARS_MAX_NEARBY = 3;
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
  private maxBarWidth = 96;
  private specialBarWidth = 58;
  private targetBarWidth = 132;
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

    this.enemyBarsGraphics = this.add.graphics().setScrollFactor(0).setDepth(depthLayers.HUD_ENEMY_BARS);
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
    const controlsVisible = this.currentPayload.controlsHintVisible && enemyCount === 0 && !this.currentPayload.isPaused && !this.currentPayload.isGameOver;

    this.controlsPanel.setVisible(controlsVisible);
    this.controlsPanel.setAlpha(shouldFadeHints ? 0.34 : 0.72);
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
    const theme = getUiThemeTokens();
    const panel = this.add.container(6, 6).setScrollFactor(0).setDepth(depthLayers.HUD_MAIN);

    const bg = this.add.rectangle(0, 0, 186, 42, hexColor(theme.panel.overlayFill), 0.78).setOrigin(0, 0);
    const border = this.add
      .rectangle(0, 0, 186, 42, hexColor(theme.panel.mutedBorder), 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, hexColor(theme.panel.mutedBorder), 0.72);
    const topAccent = this.add.rectangle(0, 0, 186, 2, hexColor(theme.palette.accentBlue), 1).setOrigin(0, 0);
    const hpBg = this.add.rectangle(36, 14, 104, 8, hexColor(theme.palette.panelElevated), 0.98).setOrigin(0, 0);
    const specialBg = this.add.rectangle(36, 27, 66, 5, hexColor(theme.palette.panelElevated), 0.98).setOrigin(0, 0);

    this.portrait = this.add.image(18, 21, "portrait_kastro").setOrigin(0.5).setScale(0.27).setTint(0xfff4dd);
    this.hpLag = this.add.rectangle(38, 18, this.maxBarWidth, 5, 0x5c2143, 0.92).setOrigin(0, 0.5);
    this.hpFill = this.add.rectangle(38, 18, this.maxBarWidth, 5, 0xf06b3b, 1).setOrigin(0, 0.5);
    this.specialFill = this.add.rectangle(38, 29, this.specialBarWidth, 3, hexColor(theme.palette.accentBlue), 1).setOrigin(0, 0.5);

    this.hpLabel = this.add.text(36, 3, "JUGADOR", {
      fontFamily: theme.typography.families.hudText,
      fontSize: "8px",
      color: theme.palette.textPrimary,
      stroke: theme.textStroke.light.color,
      strokeThickness: 1,
    });

    this.hpValue = this.add.text(138, 11, "120/120", {
      fontFamily: theme.typography.families.hudText,
      fontSize: "8px",
      color: theme.palette.textPrimary,
      stroke: theme.textStroke.light.color,
      strokeThickness: 1,
    }).setOrigin(1, 0);

    this.specialLabel = this.add.text(108, 23, "ESP", {
      fontFamily: theme.typography.families.hudText,
      fontSize: "8px",
      color: theme.palette.textSecondary,
      stroke: theme.textStroke.light.color,
      strokeThickness: 1,
    });

    this.stageLabel = this.add.text(6, 50, "STAGE", {
      fontFamily: theme.typography.families.hudText,
      fontSize: "8px",
      color: theme.palette.textSecondary,
      stroke: theme.textStroke.light.color,
      strokeThickness: 1,
    });

    this.scoreLabel = this.add
      .text(BASE_WIDTH - 6, 6, "PUNTOS 000000", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "10px",
        color: theme.palette.textHighlight,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
      })
      .setOrigin(1, 0);

    this.timeLabel = this.add
      .text(BASE_WIDTH - 6, 18, "TIEMPO 000", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "10px",
        color: theme.palette.accentGold,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
      })
      .setOrigin(1, 0);

    panel.add([
      bg,
      border,
      topAccent,
      hpBg,
      specialBg,
      this.portrait,
      this.hpLag,
      this.hpFill,
      this.specialFill,
      this.hpLabel,
      this.hpValue,
      this.specialLabel,
    ]);

    this.hudElements.push(panel, this.stageLabel, this.scoreLabel, this.timeLabel);
  }

  private createTargetHud(): void {
    const theme = getUiThemeTokens();
    const panelWidth = 148;
    const panelX = BASE_WIDTH - panelWidth - 8;
    const panel = this.add.container(panelX, 40).setScrollFactor(0).setDepth(depthLayers.HUD_MAIN);
    panel.add(this.add.rectangle(0, 0, panelWidth, 28, hexColor(theme.panel.overlayFill), 0.76).setOrigin(0, 0));
    panel.add(this.add.tileSprite(0, 0, panelWidth, 2, "hud_frame").setOrigin(0, 0).setTint(hexColor(theme.palette.accentPink)));

    this.targetFill = this.add.rectangle(8, 17, this.targetBarWidth, 6, hexColor(theme.palette.accentDanger), 1).setOrigin(0, 0.5);
    this.targetLabel = this.add
      .text(8, 2, "OBJETIVO", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "10px",
        color: theme.palette.textHighlight,
        stroke: theme.textStroke.light.color,
        strokeThickness: 2,
      });
    panel.add([this.targetFill, this.targetLabel]);
    panel.setVisible(false);
    this.targetPanel = panel;
  }

  private createControlsPanel(): void {
    const theme = getUiThemeTokens();
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(depthLayers.HUD_CONTROLS);
    const panelX = BASE_WIDTH - 130;
    const panelY = 54;
    const panelWidth = 122;
    const panelHeight = 40;

    panel.add(this.add.rectangle(panelX, panelY, panelWidth, panelHeight, hexColor(theme.panel.overlayFill), 0.58).setOrigin(0, 0));
    panel.add(this.add.tileSprite(panelX, panelY, panelWidth, 2, "hud_frame").setOrigin(0, 0).setTint(hexColor(theme.palette.accentBlue)));
    panel.add(
      this.add.text(panelX + 6, panelY + 4, "CONTROLES", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "8px",
        color: theme.palette.textPrimary,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
      }),
    );
    this.controlsPanel = panel;
    panel.setVisible(true);
  }

  private createTutorialPanel(): void {
    const theme = getUiThemeTokens();
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(depthLayers.HUD_TUTORIAL);
    const panelWidth = 214;
    const panelHeight = 18;
    const panelX = Math.floor((BASE_WIDTH - panelWidth) * 0.5);
    const panelY = BASE_HEIGHT - panelHeight - 6;

    panel.add(this.add.rectangle(panelX, panelY, panelWidth, panelHeight, hexColor(theme.panel.overlayFill), 0.84).setOrigin(0, 0));
    panel.add(this.add.tileSprite(panelX, panelY, panelWidth, 2, "hud_frame").setOrigin(0, 0).setTint(hexColor(theme.palette.accentGold)));
    panel.add(
      this.add.text(panelX + 8, panelY + 5, "ENTER para cerrar ayuda", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "9px",
        color: theme.palette.textHighlight,
      }),
    );
    this.tutorialPanel = panel;
    panel.setVisible(true);
  }

  private createStatusPanel(): void {
    const theme = getUiThemeTokens();
    const panelWidth = 160;
    const panelX = BASE_WIDTH - panelWidth - 8;
    const panelY = 40; 
    const panel = this.add.container(panelX, panelY + 32).setScrollFactor(0).setDepth(depthLayers.HUD_STATUS);
    panel.add(this.add.rectangle(0, 0, panelWidth, 24, hexColor(theme.panel.overlayFill), 0.74).setOrigin(0, 0));
    panel.add(this.add.tileSprite(0, 0, panelWidth, 2, "hud_frame").setOrigin(0, 0).setTint(hexColor(theme.palette.accentBlue)));
    this.statusText = this.add.text(8, 6, "", {
      fontFamily: theme.typography.families.hudText,
      fontSize: "10px",
      color: theme.palette.textPrimary,
      stroke: theme.textStroke.light.color,
      strokeThickness: 2,
      wordWrap: { width: 144, useAdvancedWrap: true },
      maxLines: 1,
    });
    panel.add(this.statusText);
    this.statusPanel = panel;
    this.zoneMessagePanel = panel;
  }

  private createGameOverPanel(): void {
    const theme = getUiThemeTokens();
    this.gameOverDim = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x000000, 0.84)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depthLayers.HUD_GAME_OVER_DIM)
      .setVisible(false);

    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(depthLayers.HUD_GAME_OVER);
    const panelX = Math.floor((BASE_WIDTH - 252) * 0.5);
    const panelY = Math.floor((BASE_HEIGHT - 96) * 0.5);
    panel.add(this.add.rectangle(panelX, panelY, 252, 96, hexColor(theme.palette.panelElevated), 0.95).setOrigin(0, 0));
    panel.add(this.add.tileSprite(panelX, panelY, 252, 2, "hud_frame").setOrigin(0, 0).setTint(hexColor(theme.palette.accentDanger)));
    panel.add(this.add.rectangle(panelX + 24, panelY + 53, 204, 1, hexColor(theme.panel.mutedBorder), 0.9).setOrigin(0, 0));
    panel.add(
      this.add.text(panelX + 76, panelY + 20, "DERROTA", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "22px",
        color: theme.palette.accentPink,
      }),
    );
    panel.add(
      this.add.text(panelX + 44, panelY + 64, "Pulsa ENTER para reiniciar", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "11px",
        color: theme.palette.textPrimary,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
      }),
    );
    this.gameOverPanel = panel;
    panel.setVisible(false);
  }

  private createPausePanel(): void {
    const theme = getUiThemeTokens();
    this.pauseDim = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x000000, 0.66)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depthLayers.HUD_PAUSE_DIM)
      .setVisible(false);

    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(depthLayers.HUD_PAUSE_MAIN);
    panel.add(this.add.rectangle(32, 32, 364, 172, hexColor(theme.palette.panelElevated), 0.95).setOrigin(0, 0));
    panel.add(this.add.tileSprite(32, 32, 364, 2, "hud_frame").setOrigin(0, 0).setTint(hexColor(theme.palette.accentPink)));
    panel.add(
      this.add.text(48, 48, "PAUSA", {
        fontFamily: theme.typography.families.hudText,
        fontSize: "16px",
        color: theme.palette.textPrimary,
      }),
    );
    panel.add(this.add.rectangle(48, 72, 332, 1, hexColor(theme.panel.mutedBorder), 0.95).setOrigin(0, 0));
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
    const theme = getUiThemeTokens();
    for (const child of [...this.controlsPanel.list, ...this.pausePanel.list]) {
      if (child instanceof Phaser.GameObjects.Text && child.name === "dynamic-control") {
        child.destroy();
      }
    }

    const compactHints = this.summarizeBindingHints(hints.keyboard);
    const compact = this.add
      .text(BASE_WIDTH - 124, 68, compactHints[0], {
        fontFamily: theme.typography.families.hudText,
        fontSize: "8px",
        color: theme.palette.textPrimary,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
        wordWrap: { width: 112, useAdvancedWrap: true },
      })
      .setName("dynamic-control");
    const compact2 = this.add
      .text(BASE_WIDTH - 124, 78, compactHints[1], {
        fontFamily: theme.typography.families.hudText,
        fontSize: "8px",
        color: theme.palette.textHighlight,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
        wordWrap: { width: 112, useAdvancedWrap: true },
      })
      .setName("dynamic-control");
    const compact3 = this.add
      .text(BASE_WIDTH - 124, 88, compactHints[2], {
        fontFamily: theme.typography.families.hudText,
        fontSize: "8px",
        color: theme.palette.textSecondary,
        stroke: theme.textStroke.light.color,
        strokeThickness: 1,
        wordWrap: { width: 112, useAdvancedWrap: true },
      })
      .setName("dynamic-control");
    this.controlsPanel.add([compact, compact2, compact3]);

    this.pausePanel.add(
      this.add
        .text(48, 82, "TECLADO", {
          fontFamily: theme.typography.families.hudText,
          fontSize: "11px",
          color: theme.palette.textSecondary,
          stroke: theme.textStroke.light.color,
          strokeThickness: 1,
        })
        .setName("dynamic-control"),
    );
    this.pausePanel.add(
      this.add
        .text(220, 82, "GAMEPAD", {
          fontFamily: theme.typography.families.hudText,
          fontSize: "11px",
          color: theme.palette.textHighlight,
          stroke: theme.textStroke.light.color,
          strokeThickness: 1,
        })
        .setName("dynamic-control"),
    );

    let y = 102;
    for (const line of hints.keyboard) {
      const text = this.add
        .text(48, y, line, {
          fontFamily: theme.typography.families.hudText,
          fontSize: "11px",
          color: theme.palette.textPrimary,
          stroke: theme.textStroke.light.color,
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
          fontFamily: theme.typography.families.hudText,
          fontSize: "11px",
          color: theme.palette.textHighlight,
          stroke: theme.textStroke.light.color,
          strokeThickness: 1,
        })
        .setName("dynamic-control");
      this.pausePanel.add(text);
      y += 14;
    }
  }

  private createCrtOverlay(): void {
    const enabled = new URLSearchParams(window.location.search).get("crt") === "1";
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(depthLayers.HUD_CRT);
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
    this.enemyBarsGraphics.setDepth(depthLayers.HUD_ENEMY_BARS);
    const visibleEnemies = this.selectEnemiesForBars();
    for (const enemy of visibleEnemies) {
      const ratio = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
      const width = 30;
      const x = Math.floor(enemy.x - width * 0.5);
      const y = Math.floor(enemy.y);
      this.enemyBarsGraphics.fillStyle(hexColor(getUiThemeTokens().panel.overlayFill), 0.86);
      this.enemyBarsGraphics.fillRect(x, y, width, 5);
      this.enemyBarsGraphics.fillStyle(hexColor(getUiThemeTokens().palette.accentDanger), 1);
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
    const objectiveLine = this.formatObjectiveProgress();
    const tacticalLine = this.currentPayload.zoneMessage?.trim() || objectiveLine || this.currentPayload.objectiveText.trim();
    const radioLine = this.currentPayload.radioMessage?.trim();
    const threatPrefix = this.formatThreatPrefix(this.currentPayload.threatLevel);
    const statusLine = radioLine || `${threatPrefix} ${tacticalLine || zoneLine || "SIGUE ADELANTE"}`.trim();

    this.statusText.setText(this.isHudMinimalPreset ? this.compactStatusText(statusLine) : statusLine);
    this.statusText.setColor(this.resolveStatusColor(this.currentPayload.threatLevel));
    this.statusPanel.setAlpha(this.isHudMinimalPreset ? 0.82 : 1);
  }

  private formatObjectiveProgress(): string {
    if (!this.currentPayload?.objectiveProgress) {
      return "";
    }
    const progress = this.currentPayload.objectiveProgress;
    return `${progress.label} ${progress.current}/${progress.target}`;
  }

  private formatThreatPrefix(level: "low" | "medium" | "high"): string {
    if (level === "high") {
      return "[PELIGRO ALTO]";
    }
    if (level === "medium") {
      return "[PRESION MEDIA]";
    }
    return "[CONTROL]";
  }

  private resolveStatusColor(level: "low" | "medium" | "high"): string {
    if (level === "high") {
      return getUiThemeTokens().palette.textHighlight;
    }
    if (level === "medium") {
      return getUiThemeTokens().palette.accentGold;
    }
    return getUiThemeTokens().palette.textSecondary;
  }

  private compactStatusText(text: string): string {
    const cleanText = text.replace(/\s+/g, " ").trim();
    if (cleanText.length <= 34) {
      return cleanText;
    }
    return `${cleanText.slice(0, 31)}...`;
  }

  private summarizeBindingHints(keyboardHints: string[]): [string, string, string] {
    const move = keyboardHints[0] ?? "Mover";
    const attack = keyboardHints[1] ?? "Atacar";
    const jump = keyboardHints[2] ?? "Saltar";
    const special = keyboardHints[3] ?? "Especial";
    const pause = keyboardHints[4] ?? "Pausa";

    return [
      this.compactHintLine(move, 18),
      `${this.compactHintLine(attack, 12)} | ${this.compactHintLine(jump, 10)}`,
      `${this.compactHintLine(special, 11)} | ${this.compactHintLine(pause, 9)}`,
    ];
  }

  private compactHintLine(text: string, maxLength: number): string {
    const cleanText = text.replace(/\s+/g, " ").trim();
    return cleanText.length > maxLength ? `${cleanText.slice(0, Math.max(0, maxLength - 1))}.` : cleanText;
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
