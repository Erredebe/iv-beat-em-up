import Phaser from "phaser";
import boxeadorComboRaw from "../config/frameData/boxeador.combo.json";
import playerComboRaw from "../config/frameData/player.combo.json";
import tecnicoComboRaw from "../config/frameData/tecnico.combo.json";
import velozComboRaw from "../config/frameData/veloz.combo.json";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  CONTROLS_HINT_DURATION_MS,
  DEBUG_TOGGLE_KEY,
  PLAYER_SPAWN_X,
} from "../config/constants";
import { getNextStageId } from "../config/gameplay/campaign";
import { featureFlags } from "../config/features";
import { getPlayableCharacter } from "../config/gameplay/playableRoster";
import { getSessionState, resetSessionState, updateSessionState } from "../config/gameplay/sessionState";
import { getStageBundle, type StageBundle } from "../config/levels/stageCatalog";
import { depthLayers } from "../config/visual/depthLayers";
import { ensureFighterAnimations } from "../config/visual/fighterAnimationSets";
import { EnemyBasic, type EnemyArchetype } from "../entities/EnemyBasic";
import { Player, buildPlayerAttackData } from "../entities/Player";
import { AudioSystem } from "../systems/AudioSystem";
import { BreakablePropSystem, type BreakablePickupSpawn } from "../systems/BreakablePropSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { DepthSystem } from "../systems/DepthSystem";
import { EnemyAI } from "../systems/EnemyAI";
import { HitStopSystem } from "../systems/HitStopSystem";
import { InputManager } from "../systems/InputManager";
import { LevelEditor } from "../systems/LevelEditor";
import { NavigationSystem } from "../systems/NavigationSystem";
import { NarrativeDirector } from "../systems/NarrativeDirector";
import { SpawnManager } from "../systems/SpawnManager";
import { StageRenderer } from "../systems/StageRenderer";
import type { AttackFrameData, AttackId } from "../types/combat";
import { createActorRuntime, createCombatRuntime, createStageRuntime } from "./street";
import { buildStreetHudPayload } from "./street/hudPayloadAdapter";
import type { StreetCombatTargetingRuntime } from "./street";

interface ActiveHealPickup {
  id: string;
  sprite: Phaser.GameObjects.Image;
  parts: Phaser.GameObjects.Image[];
  healAmount: number;
}

type HitSparkTier = "light" | "heavy" | "special";

const ENEMY_POINTS_BY_ARCHETYPE: Record<EnemyArchetype, number> = {
  brawler: 120,
  rusher: 140,
  tank: 180,
  agile_f: 150,
  bat_wielder: 190,
  mini_boss: 350,
  knife_fighter: 135,
};

export class StreetScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private collisionSystem!: CollisionSystem;
  private depthSystem!: DepthSystem;
  private hitStopSystem!: HitStopSystem;
  private combatSystem!: CombatSystem;
  private enemyAI!: EnemyAI;
  private spawnManager!: SpawnManager;
  private navigationSystem!: NavigationSystem;
  private audioSystem!: AudioSystem;
  private player!: Player;
  private enemies: EnemyBasic[] = [];
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private debugEnabled = false;
  private stageRenderer!: StageRenderer;
  private levelEditor!: LevelEditor;
  private breakablePropSystem: BreakablePropSystem | null = null;
  private healPickups: ActiveHealPickup[] = [];
  private flashOverlay!: Phaser.GameObjects.Rectangle;
  private damageFlashOverlay!: Phaser.GameObjects.Rectangle;
  private isPausedByPlayer = false;
  private controlsHintVisible = true;
  private controlsHintUntil = 0;
  private combatTargeting!: StreetCombatTargetingRuntime;
  private zoneMessage: string | null = null;
  private zoneMessageUntil = 0;
  private announcedZoneId: string | null = null;
  private stageBundle!: StageBundle;
  private stageWorldWidth = 2560;
  private stageTimeLimitMs = 0;
  private stageStartedAt = 0;
  private stageTransitionQueued = false;
  private score = 0;
  private stageEntryState = getSessionState();
  private selectedCharacter = getPlayableCharacter(this.stageEntryState.selectedCharacter);
  private narrativeDirector!: NarrativeDirector;
  private lastActiveZoneId: string | null = null;
  private playerAttackData!: Record<AttackId, AttackFrameData>;
  private readonly comboByCharacter = {
    kastro: boxeadorComboRaw,
    marina: velozComboRaw,
    meneillos: tecnicoComboRaw,
  };
  private perfEnabled = false;
  private perfText: Phaser.GameObjects.Text | null = null;
  private perfMinFps = Number.POSITIVE_INFINITY;
  private perfSumFps = 0;
  private perfSampleCount = 0;

  constructor() {
    super("StreetScene");
  }

  create(): void {
    this.enemies = [];
    this.zoneMessage = null;
    this.zoneMessageUntil = 0;
    this.announcedZoneId = null;
    this.lastActiveZoneId = null;
    this.stageTransitionQueued = false;
    this.healPickups = [];

    if (!this.scene.isActive("HudScene")) {
      this.scene.launch("HudScene");
    }

    ensureFighterAnimations(this);
    this.stageEntryState = getSessionState();
    const requestedStageId = featureFlags.stagePack ? this.stageEntryState.currentStageId : "market_95";
    this.stageBundle = getStageBundle(requestedStageId);
    this.stageWorldWidth = this.stageBundle.layout.mapWidthTiles * this.stageBundle.layout.tileSize;
    this.stageTimeLimitMs = this.stageBundle.timeLimitSec * 1000;
    this.stageStartedAt = this.time.now;
    this.score = this.stageEntryState.score;

    this.inputManager = new InputManager(this);

    const stageRuntime = createStageRuntime({
      scene: this,
      stageBundle: this.stageBundle,
      playerSpawnX: PLAYER_SPAWN_X,
    });
    this.stageWorldWidth = stageRuntime.stageWorldWidth;
    this.navigationSystem = stageRuntime.navigationSystem;
    this.collisionSystem = stageRuntime.collisionSystem;
    this.depthSystem = stageRuntime.depthSystem;
    this.stageRenderer = stageRuntime.stageRenderer;

    const character = getPlayableCharacter(this.stageEntryState.selectedCharacter);
    this.selectedCharacter = character;
    this.narrativeDirector = new NarrativeDirector(this.stageBundle, character.id);
    const comboRaw = (
      featureFlags.combatRework
        ? this.comboByCharacter[character.id]
        : playerComboRaw
    ) as Record<string, AttackFrameData>;
    this.playerAttackData = buildPlayerAttackData(comboRaw, character);

    const actorRuntime = createActorRuntime({
      scene: this,
      stageBundle: this.stageBundle,
      selectedCharacter: character,
      playerAttackData: this.playerAttackData,
      playerSpawnX: PLAYER_SPAWN_X,
      playerSpawnY: stageRuntime.playerSpawnY,
      collisionSystem: this.collisionSystem,
      navigationSystem: this.navigationSystem,
      depthSystem: this.depthSystem,
    });
    this.player = actorRuntime.player;
    this.enemyAI = actorRuntime.enemyAI;
    this.spawnManager = actorRuntime.spawnManager;
    this.enemies = actorRuntime.enemies;

    const combatRuntime = createCombatRuntime({
      scene: this,
      getPlayerId: () => this.player.id,
      onCombatHitFeedback: ({ attackId, targetX, targetY, targetTeam }) => {
        this.createHitSpark(targetX, targetY - 38, this.resolveSparkTier(attackId));
        if (attackId === "SPECIAL") {
          this.flashScene();
        }
        this.cameras.main.shake(42, 0.0022);
        if (targetTeam === "player") {
          this.flashDamage();
        }
      },
    });
    this.combatSystem = combatRuntime.combatSystem;
    this.hitStopSystem = combatRuntime.hitStopSystem;
    this.audioSystem = combatRuntime.audioSystem;
    this.combatTargeting = combatRuntime.targeting;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      combatRuntime.dispose();
      this.stageRenderer.destroy();
      this.levelEditor.destroy();
      this.breakablePropSystem?.destroy();
      this.destroyHealPickups();
    });

    if (actorRuntime.initialZoneId) {
      this.announceZoneLock(actorRuntime.initialZoneId, this.time.now);
    }

    this.breakablePropSystem = featureFlags.breakableProps
      ? new BreakablePropSystem(this, this.depthSystem, this.collisionSystem, stageRuntime.stageRenderRuntime.objects)
      : null;

    this.levelEditor = new LevelEditor(this, {
      layout: this.stageBundle.layout,
      spawnZones: this.stageBundle.spawns,
    });

    this.cameras.main.setBounds(0, this.stageBundle.layout.cameraYOffset, this.stageWorldWidth, BASE_HEIGHT);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(1.08);

    this.flashOverlay = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0xffffff, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depthLayers.SCENE_FLASH);

    this.damageFlashOverlay = this.add
      .rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0xff1f3a, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depthLayers.SCENE_DAMAGE_FLASH);

    this.debugGraphics = this.add.graphics();
    this.debugText = this.add
      .text(8, BASE_HEIGHT - 58, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(depthLayers.DEBUG_TEXT)
      .setVisible(false);
    this.debugKey = this.input.keyboard!.addKey(DEBUG_TOGGLE_KEY);
    this.perfEnabled = new URLSearchParams(window.location.search).get("perf") === "1";
    if (this.perfEnabled) {
      this.perfText = this.add
        .text(BASE_WIDTH - 6, 6, "", {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#d4fbff",
          stroke: "#041218",
          strokeThickness: 2,
          align: "right",
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(depthLayers.PERF_OVERLAY);
    }

    this.controlsHintUntil = this.time.now + CONTROLS_HINT_DURATION_MS;
    this.audioSystem.ensureStarted();
    this.audioSystem.switchTheme(this.stageBundle.theme);
    if (featureFlags.loreCampaignV1) {
      this.narrativeDirector.onStageStart(this.time.now);
    }
    this.updateHud();
  }

  update(time: number, delta: number): void {
    this.inputManager.update(time);
    this.handleDebugToggle();
    this.levelEditor.update(time, delta, this.cameras.main);
    if (this.levelEditor.isActive()) {
      this.stopActorsMotion();
      this.controlsHintVisible = false;
      this.updateParallax();
      this.updateHud();
      this.updatePerfOverlay();
      this.renderDebug(delta);
      return;
    }

    this.handlePauseToggle();

    if (this.inputManager.hasAnyInputDown()) {
      this.audioSystem.ensureStarted();
    }

    const stageElapsed = time - this.stageStartedAt;
    const stageRemainingMs = Math.max(0, this.stageTimeLimitMs - stageElapsed);
    if (stageRemainingMs <= 0 && this.player.isAlive()) {
      this.player.applyDamage(
        {
          damage: this.player.maxHp * 2,
          knockbackX: 0,
          causesKnockdown: true,
          iFrameMs: 0,
          hitStunMs: 0,
          knockdownDurationMs: 0,
          sourceX: this.player.x,
        },
        time,
      );
    }

    if (!this.player.isAlive()) {
      this.controlsHintVisible = false;
      if (this.inputManager.consumeBuffered("ui_confirm")) {
        this.scene.restart();
        return;
      }
      this.updateParallax();
      this.updateHud();
      this.updatePerfOverlay();
      this.renderDebug(delta);
      return;
    }

    if (this.controlsHintVisible && (time >= this.controlsHintUntil || this.inputManager.consumeBuffered("ui_confirm"))) {
      this.controlsHintVisible = false;
    }

    this.hitStopSystem.update(time);
    if (this.isPausedByPlayer) {
      this.updateParallax();
      this.updateHud();
      this.updatePerfOverlay();
      this.renderDebug(delta);
      return;
    }

    const playerEvents = this.player.updateFromInput(this.inputManager, delta, time);
    if (playerEvents.attackStarted || playerEvents.jumpStarted || playerEvents.specialStarted || playerEvents.backstepStarted) {
      this.controlsHintVisible = false;
    }
    if (playerEvents.jumpStarted) {
      this.audioSystem.playJump();
    }
    if (playerEvents.specialStarted) {
      this.audioSystem.playSpecial(this.selectedCharacter.specialSfxKey);
      this.flashScene();
      if (featureFlags.loreCampaignV1) {
        this.narrativeDirector.onSpecialUsed(time);
      }
    }

    for (const enemy of this.enemies) {
      this.enemyAI.update(enemy, this.player, delta, time);
      enemy.update(delta, time);
    }

    const spawnedEnemies = this.spawnManager.update(this.player.x, time);
    if (spawnedEnemies.length > 0) {
      this.enemies.push(...spawnedEnemies);
    }

    const activeZoneId = this.spawnManager.getActiveZoneId();
    if (activeZoneId && this.announcedZoneId !== activeZoneId) {
      this.announceZoneLock(activeZoneId, time);
    } else if (!activeZoneId) {
      this.announcedZoneId = null;
    }
    if (this.lastActiveZoneId && !activeZoneId) {
      if (featureFlags.loreCampaignV1) {
        this.narrativeDirector.onZoneCleared(time);
      }
    }
    this.lastActiveZoneId = activeZoneId;

    this.combatSystem.resolveHits([this.player, ...this.enemies], time);
    if (this.breakablePropSystem) {
      const breakResult = this.breakablePropSystem.resolveHits([this.player, ...this.enemies]);
      if (breakResult.pointsAwarded > 0) {
        this.score += breakResult.pointsAwarded;
      }
      if (breakResult.brokenCount > 0) {
        this.audioSystem.playBreakableBreak();
        this.createHitSpark(this.player.x + this.player.facing * 24, this.player.y - 24, "heavy");
        for (const brokenObjectId of breakResult.brokenPropIds) {
          this.spawnManager.reportCacheObjectDestroyed(brokenObjectId);
        }
      }
      if (breakResult.spawnedPickups.length > 0) {
        this.spawnHealPickups(breakResult.spawnedPickups);
      }
    }

    this.resolveHealPickupCollection();
    this.cleanupDeadEnemies();

    if (this.spawnManager.getActiveZoneId()) {
      this.audioSystem.switchTheme("theme_b");
    } else {
      this.audioSystem.switchTheme(this.stageBundle.theme);
    }

    if (this.zoneMessage && time >= this.zoneMessageUntil) {
      this.zoneMessage = null;
    }

    this.depthSystem.update();
    this.updateCamera();
    this.updateParallax();
    this.combatTargeting.prune(time, this.enemies);
    this.tryHandleStageCompletion(time);
    this.updateHud();
    this.updatePerfOverlay();
    this.renderDebug(delta);
  }

  private cleanupDeadEnemies(): void {
    const survivors: EnemyBasic[] = [];
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        survivors.push(enemy);
        continue;
      }
      this.score += ENEMY_POINTS_BY_ARCHETYPE[enemy.combatProfile.archetype] ?? 100;
      this.enemyAI.releaseAttackToken(enemy.id);
      this.depthSystem.unregister(enemy.shadow);
      this.depthSystem.unregister(enemy.spriteOutline);
      this.depthSystem.unregister(enemy.sprite);
      this.combatTargeting.clear(enemy.id);
      enemy.destroy();
    }
    this.enemies = survivors;
  }

  private updateCamera(): void {
    const targetX = Phaser.Math.Clamp(this.player.x - BASE_WIDTH * 0.45, 0, this.stageWorldWidth - BASE_WIDTH);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.12);
  }

  private updateParallax(): void {
    this.stageRenderer.updateParallax(this.cameras.main.scrollX);
  }

  private updateHud(): void {
    const nowMs = this.time.now;
    const objectiveProgress = featureFlags.encounterObjectivesV1 ? this.spawnManager.getObjectiveProgress(nowMs) : null;
    const payload = buildStreetHudPayload({
      nowMs,
      camera: this.cameras.main,
      player: this.player,
      selectedCharacter: this.selectedCharacter,
      enemies: this.enemies,
      score: this.score,
      stageName: this.stageBundle.displayName,
      stageStartedAt: this.stageStartedAt,
      stageTimeLimitMs: this.stageTimeLimitMs,
      zoneId: this.spawnManager.getActiveZoneId(),
      targetEnemy: this.combatTargeting.getPayload(nowMs, this.enemies),
      controlsHintVisible: this.controlsHintVisible,
      isPaused: this.isPausedByPlayer,
      isGameOver: !this.player.isAlive(),
      zoneMessage: this.zoneMessage,
      objectiveText: this.getObjectiveText(),
      objectiveProgress,
      threatLevel: this.resolveThreatLevel(),
      radioMessage: featureFlags.loreCampaignV1 ? this.narrativeDirector.getActiveRadioMessage(nowMs) : null,
      bindingHints: this.inputManager.getBindingHints(),
    });
    this.game.events.emit("hud:update", payload);
  }

  private getObjectiveText(): string {
    if (!this.player.isAlive()) {
      return "Pulsa ENTER para reintentar";
    }

    if (this.spawnManager.getActiveZoneId()) {
      const objectiveProgress = this.spawnManager.getObjectiveProgress(this.time.now);
      if (objectiveProgress) {
        return `${objectiveProgress.label} (${objectiveProgress.current}/${objectiveProgress.target})`;
      }
      const remaining = this.enemies.filter((enemy) => enemy.isAlive()).length;
      return `Derrota a los enemigos (${remaining} restantes)`;
    }

    if (!this.spawnManager.areAllZonesCleared()) {
      return "Avanza hasta activar la siguiente zona";
    }

    if (this.player.x < this.stageWorldWidth - 84) {
      return "Avanza hacia la salida";
    }

    return "Zona despejada";
  }

  private resolveThreatLevel(): "low" | "medium" | "high" {
    const aliveEnemies = this.enemies.filter((enemy) => enemy.isAlive()).length;
    if (aliveEnemies >= 7) {
      return "high";
    }
    if (aliveEnemies >= 4) {
      return "medium";
    }
    return "low";
  }

  private announceZoneLock(zoneId: string, now: number): void {
    this.announcedZoneId = zoneId;
    const lockType = this.spawnManager.getZoneLockType(zoneId);
    this.zoneMessage = lockType === "soft_lock"
      ? "Zona de combate activa. Mantente dentro del perímetro"
      : lockType === "partial_lock"
        ? "Zona parcialmente bloqueada. Rodea por los carriles abiertos"
        : "Zona bloqueada. Derrota a todos para avanzar";
    this.zoneMessageUntil = now + 3200;
    this.playBarrierLockFx(zoneId, lockType);
    this.audioSystem.playZoneLock();
    if (featureFlags.loreCampaignV1) {
      this.narrativeDirector.onZoneLock(now);
    }
  }

  private playBarrierLockFx(zoneId: string, lockType: "full_lock" | "partial_lock" | "soft_lock" | null): void {
    const zoneConfig = this.stageBundle.spawns.find((zone) => zone.id === zoneId);
    if (!zoneConfig) {
      return;
    }

    const rails = this.collisionSystem.getWalkRails();
    const lane = this.collisionSystem.getWalkLane();
    const fxDepth = lane.bottomY + 26;
    const lockColor = lockType === "soft_lock" ? 0xf5d76e : lockType === "partial_lock" ? 0x6ec9ff : 0xff4b89;
    const alpha = lockType === "soft_lock" ? 0.18 : 0.28;
    const openRails = new Set(zoneConfig.barrier?.openRailIds ?? []);

    const barriers = [zoneConfig.leftBarrierX, zoneConfig.rightBarrierX].flatMap((x) => {
      if (lockType === "partial_lock") {
        return rails
          .filter((rail) => !openRails.has(rail.id))
          .map((rail) => this.add.rectangle(x, (rail.topY + rail.bottomY) * 0.5, 16, rail.bottomY - rail.topY + 6, lockColor, alpha).setDepth(fxDepth));
      }

      const laneHeight = lane.bottomY - lane.topY;
      if (lockType === "full_lock" && zoneConfig.barrier?.topGap !== undefined && zoneConfig.barrier?.bottomGap !== undefined) {
        const gapStart = Phaser.Math.Clamp(Math.min(zoneConfig.barrier.topGap, zoneConfig.barrier.bottomGap), 0, laneHeight);
        const gapEnd = Phaser.Math.Clamp(Math.max(zoneConfig.barrier.topGap, zoneConfig.barrier.bottomGap), 0, laneHeight);
        const blocks: Phaser.GameObjects.Rectangle[] = [];
        if (gapStart > 0) {
          blocks.push(this.add.rectangle(x, lane.topY + gapStart * 0.5, 16, gapStart, lockColor, alpha).setDepth(fxDepth));
        }
        if (gapEnd < laneHeight) {
          const lowerHeight = laneHeight - gapEnd;
          blocks.push(this.add.rectangle(x, lane.topY + gapEnd + lowerHeight * 0.5, 16, lowerHeight, lockColor, alpha).setDepth(fxDepth));
        }
        return blocks;
      }

      return [this.add.rectangle(x, lane.topY + laneHeight * 0.5, 16, laneHeight + 8, lockColor, alpha).setDepth(fxDepth)];
    });

    for (const barrier of barriers) {
      this.tweens.add({
        targets: barrier,
        alpha: { from: lockType === "soft_lock" ? 0.35 : 0.45, to: 0 },
        scaleX: { from: 1.1, to: 0.92 },
        duration: 320,
        yoyo: true,
        repeat: 1,
        onComplete: () => barrier.destroy(),
      });
    }
  }

  private tryHandleStageCompletion(nowMs: number): void {
    if (this.stageTransitionQueued) {
      return;
    }

    const ready = this.spawnManager.areAllZonesCleared() && this.enemies.length === 0 && this.player.x >= this.stageWorldWidth - 80;
    if (!ready) {
      return;
    }

    this.stageTransitionQueued = true;
    const nextStageId = getNextStageId(this.stageBundle.id);
    const elapsed = this.time.now - this.stageStartedAt;
    const unlockedStoryFlag = this.stageBundle.storyBeatIds[0] ? `beat:${this.stageBundle.storyBeatIds[0]}` : `stage:${this.stageBundle.id}`;
    const nextDistrictControl = {
      ...this.stageEntryState.districtControl,
      [this.stageBundle.districtId]: "allied" as const,
    };
    const nextStoryFlags = {
      ...this.stageEntryState.storyFlags,
      [unlockedStoryFlag]: true,
    };
    const nextDossiers = Array.from(new Set([...this.stageEntryState.unlockedDossiers, this.stageBundle.districtId]));
    updateSessionState({
      score: this.score,
      elapsedMs: this.stageEntryState.elapsedMs + elapsed,
      currentStageId: nextStageId ?? this.stageBundle.id,
      districtControl: featureFlags.loreCampaignV1 ? nextDistrictControl : this.stageEntryState.districtControl,
      storyFlags: featureFlags.loreCampaignV1 ? nextStoryFlags : this.stageEntryState.storyFlags,
      unlockedDossiers: featureFlags.loreCampaignV1 ? nextDossiers : this.stageEntryState.unlockedDossiers,
    });
    if (featureFlags.loreCampaignV1) {
      this.narrativeDirector.onStageCleared(nowMs);
    }

    if (nextStageId) {
      this.zoneMessage = featureFlags.loreCampaignV1
        ? this.narrativeDirector.getDebriefLine() ?? `Siguiente zona: ${getStageBundle(nextStageId).displayName}`
        : `Siguiente zona: ${getStageBundle(nextStageId).displayName}`;
      this.zoneMessageUntil = nowMs + 1500;
      this.time.delayedCall(900, () => {
        this.scene.restart();
      });
      return;
    }

    this.zoneMessage = featureFlags.loreCampaignV1
      ? this.narrativeDirector.getDebriefLine() ?? "BARRIO RECUPERADO"
      : "BARRIO RECUPERADO";
    this.zoneMessageUntil = nowMs + 3200;
    this.time.delayedCall(1700, () => {
      resetSessionState();
      this.scene.stop("HudScene");
      this.scene.start("TitleScene");
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
    if (!this.player.isAlive()) {
      this.isPausedByPlayer = false;
      return;
    }
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

  private stopActorsMotion(): void {
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

      const visual = fighter.getVisualDebugInfo();
      const isPlayer = fighter === this.player;
      const footColor = isPlayer ? 0xf8ff66 : 0xff9a66;
      const baselineColor = isPlayer ? 0x7ce8ff : 0xff66c9;
      const shadowColor = 0x0f0f0f;

      this.debugGraphics.lineStyle(1, baselineColor, 0.5);
      this.debugGraphics.lineBetween(fighter.x, fighter.y, fighter.sprite.x, visual.baselineY);
      this.debugGraphics.fillStyle(footColor, 1);
      this.debugGraphics.fillCircle(fighter.x, fighter.y, 2);
      this.debugGraphics.fillStyle(baselineColor, 1);
      this.debugGraphics.fillCircle(fighter.sprite.x, visual.baselineY, 2);
      this.debugGraphics.fillStyle(shadowColor, 0.95);
      this.debugGraphics.fillCircle(fighter.shadow.x, fighter.shadow.y, 2);
    }

    for (const rail of this.navigationSystem.getRails()) {
      this.debugGraphics.lineStyle(1, 0x4cd7ff, 0.65);
      this.debugGraphics.lineBetween(rail.xStart, rail.topY, rail.xEnd, rail.topY);
      this.debugGraphics.lineStyle(1, 0xffaf5a, 0.65);
      this.debugGraphics.lineBetween(rail.xStart, rail.bottomY, rail.xEnd, rail.bottomY);
      this.debugGraphics.fillStyle(0xd5f3ff, 0.75);
      this.debugGraphics.fillCircle((rail.xStart + rail.xEnd) * 0.5, rail.preferredY ?? (rail.topY + rail.bottomY) * 0.5, 1.8);
    }

    for (const connection of this.navigationSystem.getConnections()) {
      this.debugGraphics.lineStyle(1, 0x98ffb6, 0.65);
      this.debugGraphics.lineBetween(connection.x, connection.fromY, connection.x, connection.toY);
      this.debugGraphics.fillStyle(0x98ffb6, 0.9);
      this.debugGraphics.fillCircle(connection.x, connection.fromY, 1.6);
      this.debugGraphics.fillCircle(connection.x, connection.toY, 1.6);
    }

    const navState = this.spawnManager.getNavigationState();
    for (const blocker of navState.blockers) {
      if (!blocker.active) {
        continue;
      }
      this.debugGraphics.lineStyle(2, 0xff3d7d, 0.95);
      this.debugGraphics.lineBetween(blocker.x, blocker.topY, blocker.x, blocker.bottomY);
    }

    const fps = this.game.loop.actualFps.toFixed(1);
    const dt = deltaMs.toFixed(2);
    const playerAttack = this.player.getCurrentAttackId() ?? "-";
    const playerFrame = this.player.getAttackFrame();
    const playerVisual = this.player.getVisualDebugInfo();
    const playerDepth = this.depthSystem.getResolvedDepth(this.player.sprite) ?? this.player.sprite.depth;

    this.debugText.setText([
      `FPS ${fps} | dt ${dt}ms`,
      this.player.getDebugText(),
      `ATK ${playerAttack} FRAME ${playerFrame}`,
      `P1 CLIP ${playerVisual.textureStateId}:${playerVisual.frame} OFF ${playerVisual.appliedOffset.x},${playerVisual.appliedOffset.y}`,
      `P1 DEPTH ${Math.round(playerDepth)} | FOOT ${Math.round(playerVisual.footY)} BASE ${Math.round(playerVisual.baselineY)} SHADOW ${Math.round(playerVisual.shadowY)}`,
      `STAGE ${this.stageBundle.id} | SCORE ${this.score}`,
      `ENEMIES ${this.enemies.length} | ZONE ${this.spawnManager.getActiveZoneId() ?? "-"} | BLOCKERS ${this.spawnManager.getNavigationState().blockers.length}`,
      `PAUSE ${this.isPausedByPlayer ? "ON" : "OFF"}`,
    ]);
  }

  private updatePerfOverlay(): void {
    if (!this.perfEnabled || !this.perfText) {
      return;
    }
    const fps = this.game.loop.actualFps;
    this.perfMinFps = Math.min(this.perfMinFps, fps);
    this.perfSumFps += fps;
    this.perfSampleCount += 1;
    const avg = this.perfSumFps / Math.max(1, this.perfSampleCount);
    this.perfText.setText([
      `FPS ${fps.toFixed(1)}`,
      `AVG ${avg.toFixed(1)}`,
      `MIN ${this.perfMinFps.toFixed(1)}`,
    ]);
  }

  private spawnHealPickups(pickups: BreakablePickupSpawn[]): void {
    for (const pickup of pickups) {
      const isMediumHeal = pickup.dropType === "medium_heal";
      const outline = this.add
        .image(pickup.x, pickup.y - 16, "utility-white")
        .setDisplaySize(22, 22)
        .setTint(0x102014)
        .setAlpha(0.95)
        .setDepth(depthLayers.PICKUP_OUTLINE);
      const sprite = this.add
        .image(pickup.x, pickup.y - 16, "utility-white")
        .setDisplaySize(18, 18)
        .setTint(isMediumHeal ? 0x45f28f : 0x89ffcf)
        .setAlpha(1)
        .setDepth(depthLayers.PICKUP_MAIN);
      const crossVertical = this.add
        .image(pickup.x, pickup.y - 16, "utility-white")
        .setDisplaySize(6, 14)
        .setTint(0xffffff)
        .setAlpha(0.96)
        .setDepth(depthLayers.PICKUP_ICON);
      const crossHorizontal = this.add
        .image(pickup.x, pickup.y - 16, "utility-white")
        .setDisplaySize(14, 6)
        .setTint(0xffffff)
        .setAlpha(0.96)
        .setDepth(depthLayers.PICKUP_ICON);
      const pickupSpriteParts: Phaser.GameObjects.Image[] = [outline, sprite, crossVertical, crossHorizontal];
      this.tweens.add({
        targets: pickupSpriteParts,
        y: sprite.y - 4,
        duration: 340,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
      this.healPickups.push({
        id: pickup.id,
        sprite,
        parts: pickupSpriteParts,
        healAmount: pickup.healAmount,
      });
    }
  }

  private resolveHealPickupCollection(): void {
    if (this.healPickups.length === 0 || this.player.hp >= this.player.maxHp) {
      return;
    }

    const remaining: ActiveHealPickup[] = [];
    let collectedAny = false;
    for (const pickup of this.healPickups) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.sprite.x, pickup.sprite.y);
      if (distance > 26) {
        remaining.push(pickup);
        continue;
      }

      const restoredHp = this.player.restoreHp(pickup.healAmount);
      if (restoredHp <= 0) {
        remaining.push(pickup);
        continue;
      }

      collectedAny = true;
      this.audioSystem.playUi();
      this.flashScene();
      this.showHealFloatingText(pickup.sprite.x, pickup.sprite.y - 12, restoredHp);
      this.destroyHealPickup(pickup);
    }

    this.healPickups = remaining;
    if (collectedAny) {
      this.updateHud();
    }
  }


  private destroyHealPickup(pickup: ActiveHealPickup): void {
    for (const part of pickup.parts) {
      this.tweens.killTweensOf(part);
      part.destroy();
    }
  }

  private showHealFloatingText(x: number, y: number, amount: number): void {
    const text = this.add
      .text(x, y, `+${amount} HP`, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#8dffb2",
        stroke: "#102618",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(depthLayers.FX_FLOATING_TEXT);

    this.tweens.add({
      targets: text,
      y: y - 22,
      alpha: 0,
      duration: 420,
      ease: "Quad.Out",
      onComplete: () => text.destroy(),
    });
  }

  private destroyHealPickups(): void {
    for (const pickup of this.healPickups) {
      this.destroyHealPickup(pickup);
    }
    this.healPickups.length = 0;
  }

  private resolveSparkTier(attackId: AttackId): HitSparkTier {
    if (attackId === "SPECIAL") {
      return "special";
    }
    if (attackId === "ATTACK_3" || attackId === "FINISHER_FORWARD") {
      return "heavy";
    }
    return "light";
  }

  private createHitSpark(x: number, y: number, tier: HitSparkTier = "light"): void {
    const tint = tier === "special" ? 0x8ce8ff : tier === "heavy" ? 0xffd57a : 0xfff9c2;
    const baseScale = tier === "special" ? 0.72 : tier === "heavy" ? 0.66 : 0.58;
    const endScale = tier === "special" ? 1.08 : tier === "heavy" ? 0.98 : 0.88;
    const duration = tier === "special" ? 130 : tier === "heavy" ? 118 : 104;
    const spark = this.add.image(x, y, "hit_spark").setScale(baseScale).setTint(tint).setDepth(depthLayers.FX_HIT);
    this.tweens.add({
      targets: spark,
      alpha: { from: 0.95, to: 0 },
      scale: { from: baseScale, to: endScale },
      duration,
      onComplete: () => spark.destroy(),
    });
  }

  private flashDamage(): void {
    this.damageFlashOverlay.setAlpha(0.16);
    this.tweens.killTweensOf(this.damageFlashOverlay);
    this.tweens.add({
      targets: this.damageFlashOverlay,
      alpha: 0,
      duration: 120,
      ease: "Quad.Out",
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
}
