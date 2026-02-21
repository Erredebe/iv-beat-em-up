import Phaser from "phaser";
import playerComboRaw from "../config/frameData/player.combo.json";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  CONTROLS_HINT_DURATION_MS,
  DEBUG_TOGGLE_KEY,
  ENEMY_MAX_HP,
  ENEMY_MOVE_SPEED,
  LANE_BOTTOM,
  LANE_TOP,
  PLAYER_MAX_HP,
  PLAYER_MOVE_SPEED,
  PLAYER_SPAWN_X,
  PLAYER_SPAWN_Y,
  TARGET_ENEMY_TTL_MS,
  WORLD_WIDTH,
} from "../config/constants";
import { street95Zone1Layout } from "../config/levels/street95Zone1";
import { fighterVisualProfiles } from "../config/visual/fighterVisualProfiles";
import { EnemyBasic, buildEnemyAttackData } from "../entities/EnemyBasic";
import { Player, buildPlayerAttackData } from "../entities/Player";
import { AudioSystem } from "../systems/AudioSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { DepthSystem } from "../systems/DepthSystem";
import { EnemyAI } from "../systems/EnemyAI";
import { HitStopSystem } from "../systems/HitStopSystem";
import { InputManager } from "../systems/InputManager";
import { SpawnManager } from "../systems/SpawnManager";
import { StageRenderer } from "../systems/StageRenderer";
import type { AttackFrameData, AttackId } from "../types/combat";

interface TargetEnemyTracker {
  id: string;
  expiresAt: number;
}

export class StreetScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private collisionSystem!: CollisionSystem;
  private depthSystem!: DepthSystem;
  private hitStopSystem!: HitStopSystem;
  private combatSystem!: CombatSystem;
  private enemyAI!: EnemyAI;
  private spawnManager!: SpawnManager;
  private audioSystem!: AudioSystem;
  private player!: Player;
  private enemies: EnemyBasic[] = [];
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private debugEnabled = false;
  private enemyAttackData!: Record<AttackId, AttackFrameData>;
  private stageRenderer!: StageRenderer;
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private isPausedByPlayer = false;
  private controlsHintVisible = true;
  private controlsHintUntil = 0;
  private targetEnemy: TargetEnemyTracker | null = null;
  private readonly walkLane = street95Zone1Layout.walkLane ?? {
    topY: LANE_TOP,
    bottomY: LANE_BOTTOM,
    playerSpawnY: PLAYER_SPAWN_Y,
  };

  constructor() {
    super("StreetScene");
  }

  create(): void {
    this.inputManager = new InputManager(this);
    this.collisionSystem = new CollisionSystem(this, this.walkLane);
    this.depthSystem = new DepthSystem();
    this.hitStopSystem = new HitStopSystem(this);
    this.enemyAI = new EnemyAI();
    this.audioSystem = new AudioSystem(this);
    const layoutWorldWidth = street95Zone1Layout.mapWidthTiles * street95Zone1Layout.tileSize;
    if (layoutWorldWidth !== WORLD_WIDTH) {
      throw new Error(`Street layout width ${layoutWorldWidth} must match WORLD_WIDTH ${WORLD_WIDTH}`);
    }
    this.stageRenderer = new StageRenderer(this, street95Zone1Layout);
    this.stageRenderer.build(this.collisionSystem, this.depthSystem);

    const playerAttackData = buildPlayerAttackData(playerComboRaw as Record<string, AttackFrameData>);
    this.enemyAttackData = buildEnemyAttackData(playerAttackData);

    this.player = new Player(this, {
      id: "P1",
      team: "player",
      x: PLAYER_SPAWN_X,
      y: this.walkLane.playerSpawnY,
      texture: "player",
      maxHp: PLAYER_MAX_HP,
      moveSpeed: PLAYER_MOVE_SPEED,
      attackData: playerAttackData,
      visualProfile: fighterVisualProfiles.player,
    });
    this.collisionSystem.attachFootCollider(this.player);
    this.collisionSystem.applyWorldBounds(this.player);

    this.depthSystem.register(this.player.shadow, -1);
    this.depthSystem.register(this.player.sprite, 0);

    this.combatSystem = new CombatSystem({
      hitStopSystem: this.hitStopSystem,
      eventBus: this.game.events,
      onHit: ({ attackId, target }) => {
        this.createHitSpark(target.x, target.y - 22);
        this.audioSystem.playHit();
        if (attackId === "SPECIAL") {
          this.flashScene();
        }
        if (target.state === "KNOCKDOWN") {
          this.audioSystem.playKnockdown();
        }
        this.cameras.main.shake(42, 0.0022);
      },
    });

    this.game.events.on("combat:hit", this.onCombatHit, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("combat:hit", this.onCombatHit, this);
      this.stageRenderer.destroy();
    });

    this.spawnManager = new SpawnManager(this.collisionSystem, (x, y) => this.spawnEnemy(x, y));
    this.enemies.push(...this.spawnManager.startWave("zone_1"));

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, BASE_HEIGHT);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(1);

    this.flashOverlay = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0xffffff, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(6100);

    this.debugGraphics = this.add.graphics();
    this.debugText = this.add
      .text(8, BASE_HEIGHT - 58, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(6200)
      .setVisible(false);
    this.debugKey = this.input.keyboard!.addKey(DEBUG_TOGGLE_KEY);
    this.controlsHintUntil = this.time.now + CONTROLS_HINT_DURATION_MS;
    this.updateHud();
  }

  update(time: number, delta: number): void {
    this.inputManager.update(time);
    this.handleDebugToggle();
    this.handlePauseToggle();

    if (this.inputManager.hasAnyInputDown()) {
      this.audioSystem.ensureStarted();
    }

    if (this.controlsHintVisible && (time >= this.controlsHintUntil || this.inputManager.consumeBuffered("ui_confirm"))) {
      this.controlsHintVisible = false;
    }

    this.hitStopSystem.update(time);
    if (this.isPausedByPlayer) {
      this.updateParallax();
      this.updateHud();
      this.renderDebug(delta);
      return;
    }

    if (this.hitStopSystem.isActive()) {
      this.updateParallax();
      this.updateHud();
      this.renderDebug(delta);
      return;
    }

    const playerEvents = this.player.updateFromInput(this.inputManager, delta, time);
    if (playerEvents.attackStarted || playerEvents.jumpStarted || playerEvents.specialStarted) {
      this.controlsHintVisible = false;
    }
    if (playerEvents.jumpStarted) {
      this.audioSystem.playJump();
    }
    if (playerEvents.specialStarted) {
      this.audioSystem.playSpecial();
      this.flashScene();
    }

    for (const enemy of this.enemies) {
      this.enemyAI.update(enemy, this.player, delta, time);
      enemy.update(delta, time);
    }

    const spawnedEnemies = this.spawnManager.update(this.player.x);
    if (spawnedEnemies.length > 0) {
      for (const enemy of spawnedEnemies) {
        this.enemies.push(enemy);
      }
    }

    this.combatSystem.resolveHits([this.player, ...this.enemies], time);
    this.cleanupDeadEnemies();

    if (this.spawnManager.getActiveZoneId()) {
      this.audioSystem.switchTheme("theme_b");
    } else {
      this.audioSystem.switchTheme("theme_a");
    }

    this.depthSystem.update();
    this.updateCamera();
    this.updateParallax();
    this.updateTargetTracker(time);
    this.updateHud();
    this.renderDebug(delta);
  }

  private spawnEnemy(x: number, y: number): EnemyBasic {
    const enemy = new EnemyBasic(this, {
      id: `E_${Math.floor(this.time.now)}_${Math.floor(Math.random() * 1000)}`,
      team: "enemy",
      x,
      y,
      texture: "enemy",
      maxHp: ENEMY_MAX_HP,
      moveSpeed: ENEMY_MOVE_SPEED,
      attackData: this.enemyAttackData,
      visualProfile: fighterVisualProfiles.enemy,
    });
    this.collisionSystem.attachFootCollider(enemy);
    this.collisionSystem.applyWorldBounds(enemy);
    this.depthSystem.register(enemy.shadow, -1);
    this.depthSystem.register(enemy.sprite, 0);
    return enemy;
  }

  private cleanupDeadEnemies(): void {
    const survivors: EnemyBasic[] = [];
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        survivors.push(enemy);
        continue;
      }
      this.enemyAI.releaseAttackToken(enemy.id);
      this.depthSystem.unregister(enemy.shadow);
      this.depthSystem.unregister(enemy.sprite);
      if (this.targetEnemy?.id === enemy.id) {
        this.targetEnemy = null;
      }
      enemy.destroy();
    }
    this.enemies = survivors;
  }

  private updateCamera(): void {
    const targetX = Phaser.Math.Clamp(this.player.x - BASE_WIDTH * 0.45, 0, WORLD_WIDTH - BASE_WIDTH);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.12);
  }

  private updateParallax(): void {
    this.stageRenderer.updateParallax(this.cameras.main.scrollX);
  }

  private updateTargetTracker(nowMs: number): void {
    if (!this.targetEnemy) {
      return;
    }
    if (nowMs >= this.targetEnemy.expiresAt) {
      this.targetEnemy = null;
      return;
    }

    const enemy = this.enemies.find((entry) => entry.id === this.targetEnemy?.id);
    if (!enemy || !enemy.isAlive()) {
      this.targetEnemy = null;
    }
  }

  private updateHud(): void {
    const cam = this.cameras.main;
    const visibleEnemies = this.enemies
      .filter((enemy) => enemy.isAlive() && enemy.x >= cam.scrollX - 20 && enemy.x <= cam.scrollX + cam.width + 20)
      .map((enemy) => ({
        id: enemy.id,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        x: enemy.x - cam.scrollX,
        y: enemy.y - cam.scrollY - 42,
      }));

    let targetEnemyPayload: { id: string; hp: number; maxHp: number; ttlMs: number } | null = null;
    if (this.targetEnemy) {
      const tracked = this.enemies.find((enemy) => enemy.id === this.targetEnemy?.id && enemy.isAlive());
      if (tracked) {
        targetEnemyPayload = {
          id: tracked.id,
          hp: tracked.hp,
          maxHp: tracked.maxHp,
          ttlMs: Math.max(0, this.targetEnemy.expiresAt - this.time.now),
        };
      }
    }

    this.game.events.emit("hud:update", {
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      zoneId: this.spawnManager.getActiveZoneId(),
      targetEnemy: targetEnemyPayload,
      visibleEnemies,
      controlsHintVisible: this.controlsHintVisible,
      isPaused: this.isPausedByPlayer,
      bindingHints: this.inputManager.getBindingHints(),
    });
  }

  private handleDebugToggle(): void {
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugEnabled = !this.debugEnabled;
      this.collisionSystem.setDebugEnabled(this.debugEnabled);
      this.debugText.setVisible(this.debugEnabled);
      if (!this.debugEnabled) {
        this.debugGraphics.clear();
      }
    }
  }

  private handlePauseToggle(): void {
    if (!this.inputManager.consumeBuffered("pause")) {
      return;
    }
    this.isPausedByPlayer = !this.isPausedByPlayer;

    const playerBody = this.player.footCollider.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocity(0, 0);
    this.player.clearMoveIntent();
    for (const enemy of this.enemies) {
      const body = enemy.footCollider.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      enemy.clearMoveIntent();
    }
  }

  private renderDebug(deltaMs: number): void {
    if (!this.debugEnabled) {
      return;
    }

    this.debugGraphics.clear();
    const cam = this.cameras.main;

    const fighters = [this.player, ...this.enemies];
    for (const fighter of fighters) {
      const hurtbox = fighter.getHurtbox();
      if (hurtbox) {
        this.debugGraphics.lineStyle(1, 0x00ff88, 1);
        this.debugGraphics.strokeRect(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height);
      }

      const hitbox = fighter.getActiveHitbox();
      if (hitbox) {
        this.debugGraphics.lineStyle(1, 0xff0066, 1);
        this.debugGraphics.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
      }
    }

    this.debugGraphics.lineStyle(1, 0x4cd7ff, 0.8);
    this.debugGraphics.lineBetween(cam.scrollX, this.walkLane.topY, cam.scrollX + cam.width, this.walkLane.topY);
    this.debugGraphics.lineStyle(1, 0xffaf5a, 0.8);
    this.debugGraphics.lineBetween(cam.scrollX, this.walkLane.bottomY, cam.scrollX + cam.width, this.walkLane.bottomY);

    this.debugGraphics.fillStyle(0xf8ff66, 1);
    this.debugGraphics.fillCircle(this.player.x, this.player.y, 2);
    this.debugGraphics.fillStyle(0x0f0f0f, 0.95);
    this.debugGraphics.fillCircle(this.player.shadow.x, this.player.shadow.y, 2);

    const fps = this.game.loop.actualFps.toFixed(1);
    const dt = deltaMs.toFixed(2);
    const playerAttack = this.player.getCurrentAttackId() ?? "-";
    const playerFrame = this.player.getAttackFrame();
    const footY = Math.round(this.player.y);
    const shadowY = Math.round(this.player.shadow.y);
    const shadowGap = shadowY - footY;
    this.debugText.setText([
      `FPS ${fps} | dt ${dt}ms`,
      this.player.getDebugText(),
      `ATK ${playerAttack} FRAME ${playerFrame}`,
      `LANE ${this.walkLane.topY}-${this.walkLane.bottomY} | FOOT ${footY} | SHADOW ${shadowY} | GAP ${shadowGap}`,
      `ENEMIES ${this.enemies.length} | PAUSE ${this.isPausedByPlayer ? "ON" : "OFF"}`,
    ]);
  }

  private createHitSpark(x: number, y: number): void {
    const spark = this.add.image(x, y, "hit_spark").setScale(3).setTint(0xfff9c2).setDepth(5000);
    this.tweens.add({
      targets: spark,
      alpha: { from: 0.95, to: 0 },
      scale: { from: 3, to: 4 },
      duration: 110,
      onComplete: () => spark.destroy(),
    });
  }

  private flashScene(): void {
    this.flashOverlay.setAlpha(0.2);
    this.tweens.killTweensOf(this.flashOverlay);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 130,
      ease: "Sine.easeOut",
    });
  }

  private onCombatHit(payload: {
    attackerId: string;
    targetId: string;
    targetHp: number;
    targetMaxHp: number;
    at: number;
    attackId: AttackId;
  }): void {
    void payload.targetHp;
    void payload.targetMaxHp;
    if (payload.attackerId !== this.player.id) {
      return;
    }
    this.targetEnemy = {
      id: payload.targetId,
      expiresAt: payload.at + TARGET_ENEMY_TTL_MS,
    };
  }
}
