import Phaser from "phaser";
import playerComboRaw from "../config/frameData/player.combo.json";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  DEBUG_TOGGLE_KEY,
  ENEMY_MAX_HP,
  ENEMY_MOVE_SPEED,
  LANE_BOTTOM,
  LANE_TOP,
  PLAYER_MAX_HP,
  PLAYER_MOVE_SPEED,
  PLAYER_SPAWN_X,
  PLAYER_SPAWN_Y,
  WORLD_WIDTH,
} from "../config/constants";
import { EnemyBasic, buildEnemyAttackData } from "../entities/EnemyBasic";
import { Player, buildPlayerAttackData } from "../entities/Player";
import { CollisionSystem } from "../systems/CollisionSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { DepthSystem } from "../systems/DepthSystem";
import { EnemyAI } from "../systems/EnemyAI";
import { HitStopSystem } from "../systems/HitStopSystem";
import { InputManager } from "../systems/InputManager";
import { SpawnManager } from "../systems/SpawnManager";
import { AudioSystem } from "../systems/AudioSystem";
import type { AttackFrameData, AttackId } from "../types/combat";

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

  constructor() {
    super("StreetScene");
  }

  create(): void {
    this.inputManager = new InputManager(this);
    this.collisionSystem = new CollisionSystem(this);
    this.depthSystem = new DepthSystem();
    this.hitStopSystem = new HitStopSystem(this);
    this.enemyAI = new EnemyAI();
    this.audioSystem = new AudioSystem(this);
    this.createStreetBackdrop();

    const playerAttackData = buildPlayerAttackData(playerComboRaw as Record<string, AttackFrameData>);
    this.enemyAttackData = buildEnemyAttackData(playerAttackData);

    this.player = new Player(this, {
      id: "P1",
      team: "player",
      x: PLAYER_SPAWN_X,
      y: PLAYER_SPAWN_Y,
      texture: "fighter-player",
      maxHp: PLAYER_MAX_HP,
      moveSpeed: PLAYER_MOVE_SPEED,
      attackData: playerAttackData,
    });
    this.collisionSystem.attachFootCollider(this.player);
    this.collisionSystem.applyWorldBounds(this.player);

    this.depthSystem.register(this.player.shadow, -1);
    this.depthSystem.register(this.player.sprite, 0);

    this.combatSystem = new CombatSystem({
      hitStopSystem: this.hitStopSystem,
      onHit: ({ target }) => {
        this.audioSystem.playHit();
        if (target.state === "KNOCKDOWN") {
          this.audioSystem.playKnockdown();
        }
      },
    });

    this.spawnManager = new SpawnManager(this.collisionSystem, (x, y) => this.spawnEnemy(x, y));
    this.enemies.push(...this.spawnManager.startWave("zone_1"));

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, BASE_HEIGHT);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(1);

    this.debugGraphics = this.add.graphics();
    this.debugText = this.add
      .text(8, BASE_HEIGHT - 46, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(6000)
      .setVisible(false);
    this.debugKey = this.input.keyboard!.addKey(DEBUG_TOGGLE_KEY);
  }

  update(time: number, delta: number): void {
    this.inputManager.update(time);
    this.handleDebugToggle();

    if (this.inputManager.hasAnyInputDown()) {
      this.audioSystem.ensureStarted();
    }

    this.hitStopSystem.update(time);
    if (this.hitStopSystem.isActive()) {
      this.updateHud();
      this.renderDebug(delta);
      return;
    }

    const playerEvents = this.player.updateFromInput(this.inputManager, delta, time);
    if (playerEvents.jumpStarted) {
      this.audioSystem.playJump();
    }
    if (playerEvents.specialStarted) {
      this.audioSystem.playSpecial();
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
    this.updateHud();
    this.renderDebug(delta);
  }

  private spawnEnemy(x: number, y: number): EnemyBasic {
    const enemy = new EnemyBasic(this, {
      id: `E_${Math.floor(this.time.now)}_${Math.floor(Math.random() * 1000)}`,
      team: "enemy",
      x,
      y,
      texture: "fighter-enemy",
      maxHp: ENEMY_MAX_HP,
      moveSpeed: ENEMY_MOVE_SPEED,
      attackData: this.enemyAttackData,
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
      enemy.destroy();
    }
    this.enemies = survivors;
  }

  private updateCamera(): void {
    const targetX = Phaser.Math.Clamp(this.player.x - BASE_WIDTH * 0.45, 0, WORLD_WIDTH - BASE_WIDTH);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.12);
  }

  private updateHud(): void {
    this.game.events.emit("hud:update", {
      playerHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      zoneId: this.spawnManager.getActiveZoneId(),
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

  private renderDebug(deltaMs: number): void {
    if (!this.debugEnabled) {
      return;
    }

    this.debugGraphics.clear();

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

    const fps = this.game.loop.actualFps.toFixed(1);
    const dt = deltaMs.toFixed(2);
    const playerAttack = this.player.getCurrentAttackId() ?? "-";
    const playerFrame = this.player.getAttackFrame();
    this.debugText.setText([
      `FPS ${fps} | dt ${dt}ms`,
      this.player.getDebugText(),
      `ATK ${playerAttack} FRAME ${playerFrame}`,
      `ENEMIES ${this.enemies.length}`,
    ]);
  }

  private createStreetBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x120019, 1);
    graphics.fillRect(0, 0, WORLD_WIDTH, BASE_HEIGHT);

    graphics.fillStyle(0x1d2f58, 1);
    graphics.fillRect(0, 62, WORLD_WIDTH, 74);

    graphics.fillStyle(0x261537, 1);
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      const h = 20 + ((x / 64) % 3) * 12;
      graphics.fillRect(x, 74 - h, 48, h);
    }

    graphics.fillStyle(0x2a1a24, 1);
    graphics.fillRect(0, LANE_TOP - 22, WORLD_WIDTH, 22);

    graphics.fillStyle(0x454545, 1);
    graphics.fillRect(0, LANE_TOP, WORLD_WIDTH, LANE_BOTTOM - LANE_TOP);

    graphics.fillStyle(0x2d2d2d, 1);
    graphics.fillRect(0, LANE_BOTTOM - 18, WORLD_WIDTH, 18);

    for (let x = 16; x < WORLD_WIDTH; x += 68) {
      graphics.fillStyle(0xf6d14d, 0.8);
      graphics.fillRect(x, LANE_TOP + 8, 20, 3);
    }

    this.add
      .text(220, 72, "BAR CHISPA", { fontFamily: "monospace", fontSize: "14px", color: "#ff53cc" })
      .setDepth(5);
    this.add
      .text(640, 76, "CONCIERTO PUNK", { fontFamily: "monospace", fontSize: "10px", color: "#00f6ff" })
      .setDepth(5);
    this.add
      .text(1180, 76, "SE ALQUILA NAVE", { fontFamily: "monospace", fontSize: "10px", color: "#ffde73" })
      .setDepth(5);

    const booth = this.add.image(520, 204, "prop-booth").setOrigin(0.5, 1);
    const car = this.add.image(980, 210, "prop-seat").setOrigin(0.5, 1);
    const lamp = this.add.rectangle(1380, 138, 6, 72, 0x2e2e2e, 1).setOrigin(0.5, 1);
    this.add.circle(1380, 66, 8, 0xf6d14d, 0.85);

    this.depthSystem.register(booth, 0);
    this.depthSystem.register(car, 0);
    this.depthSystem.register(lamp, 0);

    this.collisionSystem.registerGroundObstacle({
      id: "booth_feet",
      x: 520,
      y: 208,
      width: 30,
      height: 11,
      color: 0x00c5ff,
    });
    this.collisionSystem.registerGroundObstacle({
      id: "seat_feet",
      x: 980,
      y: 214,
      width: 60,
      height: 12,
      color: 0xff596d,
    });
  }
}
