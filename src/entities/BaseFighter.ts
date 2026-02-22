import Phaser from "phaser";
import {
  ATTACK_FRAME_MS,
  CHARACTER_SCALE,
  FOOT_COLLIDER_HEIGHT,
  FOOT_COLLIDER_WIDTH,
  JUMP_GRAVITY,
  JUMP_INITIAL_VELOCITY,
} from "../config/constants";
import { isFeatureEnabled } from "../config/features";
import {
  getAnimationKey,
  getFighterAnimationSet,
  type AnimationClipId,
  type FighterAnimationSet,
} from "../config/visual/fighterAnimationSets";
import type { FighterVisualProfile, SpritePixelOffset } from "../config/visual/fighterVisualProfiles";
import { isFrameActive, isFrameInComboWindow } from "../systems/combatMath";
import type { AttackFrameData, AttackId, DamageEvent, FighterState, Rect, Team } from "../types/combat";

interface AttackRuntime {
  attackId: AttackId;
  elapsedMs: number;
  frame: number;
  instanceId: number;
  hitTargets: Set<string>;
  queuedNextAttack: AttackId | null;
}

export interface FighterVisualDebugInfo {
  textureKey: string;
  frame: number;
  textureStateId: string;
  appliedOffset: SpritePixelOffset;
  baselineY: number;
  footY: number;
  shadowY: number;
  spriteY: number;
  spriteDepth: number;
}

const ZERO_OFFSET: SpritePixelOffset = { x: 0, y: 0 };
const FIGHTER_STATES: FighterState[] = [
  "IDLE",
  "WALK",
  "ATTACK_1",
  "ATTACK_2",
  "ATTACK_3",
  "JUMP",
  "AIR_ATTACK",
  "HIT",
  "KNOCKDOWN",
  "GETUP",
  "DEAD",
  "SPECIAL",
];

interface FighterOptions {
  id: string;
  team: Team;
  x: number;
  y: number;
  texture: "player" | "enemy";
  maxHp: number;
  moveSpeed: number;
  attackData: Record<AttackId, AttackFrameData>;
  visualProfile?: FighterVisualProfile;
}

export class BaseFighter {
  readonly id: string;
  readonly team: Team;
  readonly footCollider: Phaser.Physics.Arcade.Image;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly spriteOutline: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Ellipse;
  state: FighterState = "IDLE";
  facing: 1 | -1 = 1;
  readonly maxHp: number;
  hp: number;
  moveSpeed: number;

  private readonly attackData: Record<AttackId, AttackFrameData>;
  private readonly moveIntent = new Phaser.Math.Vector2();
  private readonly externalVelocity = new Phaser.Math.Vector2();
  private attackRuntime: AttackRuntime | null = null;
  private attackSerial = 0;
  private invulnerableUntil = 0;
  private hitUntil = 0;
  private knockdownUntil = 0;
  private getupUntil = 0;
  private jumpHeight = 0;
  private jumpVelocity = 0;
  private airborne = false;
  private visualProfile: FighterVisualProfile;
  private animationSet: FighterAnimationSet;
  private animationOwner: "player" | "enemy";
  private currentClipId: AnimationClipId;
  private currentClipScaleMultiplier = 1;
  private forceClipRestart = false;
  private lastAppliedOffset: SpritePixelOffset = { x: 0, y: 0 };
  private lastBaselineY = 0;

  constructor(scene: Phaser.Scene, options: FighterOptions) {
    this.id = options.id;
    this.team = options.team;
    this.maxHp = options.maxHp;
    this.hp = options.maxHp;
    this.moveSpeed = options.moveSpeed;
    this.attackData = options.attackData;
    this.visualProfile = options.visualProfile ?? this.createDefaultVisualProfile();
    this.animationOwner = options.texture;
    this.animationSet = getFighterAnimationSet(this.animationOwner);
    this.currentClipId = this.animationSet.idleClip;
    const initialTexture = this.animationSet.clips[this.currentClipId].textureKey;

    this.lastBaselineY = options.y + this.visualProfile.spriteAnchorOffsetY;

    this.shadow = scene.add
      .ellipse(
        options.x,
        options.y + this.visualProfile.shadowOffsetY,
        this.visualProfile.shadowWidth + 2,
        this.visualProfile.shadowHeight + 1,
        0x101010,
        0.56,
      )
      .setOrigin(0.5, 0.5);

    this.spriteOutline = scene.add.sprite(options.x, options.y + this.visualProfile.spriteAnchorOffsetY, initialTexture, 0);
    this.spriteOutline.setOrigin(0.5, 1);
    this.spriteOutline.setScale(this.visualProfile.scale);
    this.spriteOutline.setTint(0x101010);
    this.spriteOutline.setAlpha(0.6);

    this.sprite = scene.add.sprite(options.x, options.y + this.visualProfile.spriteAnchorOffsetY, initialTexture, 0);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(this.visualProfile.scale);

    this.playClip(this.currentClipId, true);

    this.footCollider = scene.physics.add.image(options.x, options.y, "utility-white");
    this.footCollider.setDisplaySize(FOOT_COLLIDER_WIDTH, FOOT_COLLIDER_HEIGHT);
    this.footCollider.setSize(FOOT_COLLIDER_WIDTH, FOOT_COLLIDER_HEIGHT);
    this.footCollider.setVisible(false);
    const body = this.footCollider.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(false);
  }

  setVisualProfile(profile: FighterVisualProfile): void {
    this.visualProfile = profile;
    this.shadow.setSize(profile.shadowWidth + 2, profile.shadowHeight + 1);
    const scale = profile.scale * this.currentClipScaleMultiplier;
    this.spriteOutline.setScale(scale);
    this.sprite.setScale(scale);
  }

  get x(): number {
    return this.footCollider.x;
  }

  get y(): number {
    return this.footCollider.y;
  }

  get currentAttackInstanceId(): number | null {
    return this.attackRuntime?.instanceId ?? null;
  }

  isAlive(): boolean {
    return this.state !== "DEAD";
  }

  isAirborne(): boolean {
    return this.airborne;
  }

  getJumpHeight(): number {
    return this.jumpHeight;
  }

  isPerformingAttack(): boolean {
    return this.attackRuntime !== null;
  }

  canAcceptCommands(): boolean {
    if (!this.isAlive()) {
      return false;
    }
    if (this.state === "HIT" || this.state === "KNOCKDOWN" || this.state === "GETUP") {
      return false;
    }
    return this.attackRuntime === null;
  }

  update(deltaMs: number, nowMs: number): void {
    this.updateTimers(nowMs);
    this.updateJump(deltaMs);
    this.updateAttack(deltaMs);
    this.applyVelocity(deltaMs);
    this.updateSpriteAnimation();
    this.syncVisual();
    this.updateVisualTone(nowMs);
  }

  destroy(): void {
    this.sprite.destroy();
    this.spriteOutline.destroy();
    this.shadow.destroy();
    this.footCollider.destroy();
  }

  setMoveIntent(x: number, y: number): void {
    this.moveIntent.set(x, y);
    if (this.moveIntent.lengthSq() > 1) {
      this.moveIntent.normalize();
    }
  }

  clearMoveIntent(): void {
    this.moveIntent.set(0, 0);
  }

  faceTowards(targetX: number): void {
    if (targetX > this.x) {
      this.facing = 1;
    } else if (targetX < this.x) {
      this.facing = -1;
    }
  }

  canStartAttack(attackId: AttackId): boolean {
    if (!this.isAlive()) {
      return false;
    }
    if (this.attackRuntime !== null) {
      return false;
    }
    if (this.state === "HIT" || this.state === "KNOCKDOWN" || this.state === "GETUP") {
      return false;
    }
    if (attackId === "AIR_ATTACK" && !this.airborne) {
      return false;
    }
    if (attackId !== "AIR_ATTACK" && this.airborne) {
      return false;
    }
    return true;
  }

  tryStartAttack(attackId: AttackId): boolean {
    if (!this.canStartAttack(attackId)) {
      return false;
    }

    this.attackSerial += 1;
    this.attackRuntime = {
      attackId,
      elapsedMs: 0,
      frame: 1,
      instanceId: this.attackSerial,
      hitTargets: new Set<string>(),
      queuedNextAttack: null,
    };
    this.applyStateForAttack(attackId);
    this.forceClipRestart = true;
    return true;
  }

  queueNextAttack(attackId: AttackId): void {
    if (!this.attackRuntime) {
      return;
    }
    this.attackRuntime.queuedNextAttack = attackId;
  }

  getCurrentAttackId(): AttackId | null {
    return this.attackRuntime?.attackId ?? null;
  }

  getCurrentAttackData(): AttackFrameData | null {
    if (!this.attackRuntime) {
      return null;
    }
    return this.attackData[this.attackRuntime.attackId] ?? null;
  }

  getAttackFrame(): number {
    return this.attackRuntime?.frame ?? 0;
  }

  isInComboWindow(): boolean {
    const data = this.getCurrentAttackData();
    if (!data || !this.attackRuntime) {
      return false;
    }
    return isFrameInComboWindow(this.attackRuntime.frame, data);
  }

  hasHitTarget(targetId: string): boolean {
    if (!this.attackRuntime) {
      return false;
    }
    return this.attackRuntime.hitTargets.has(targetId);
  }

  markTargetHit(targetId: string): void {
    if (!this.attackRuntime) {
      return;
    }
    this.attackRuntime.hitTargets.add(targetId);
  }

  getActiveHitbox(): Rect | null {
    if (!this.attackRuntime) {
      return null;
    }

    const data = this.attackData[this.attackRuntime.attackId];
    if (!data || !isFrameActive(this.attackRuntime.frame, data)) {
      return null;
    }

    const offsetX = data.hitbox.offsetX;
    let x = this.facing === 1 ? this.x + offsetX : this.x - offsetX - data.hitbox.width;
    if (this.attackRuntime.attackId === "SPECIAL") {
      x = this.x - data.hitbox.width * 0.5;
    }
    const y = this.y + data.hitbox.offsetY - this.jumpHeight;

    return {
      x,
      y,
      width: data.hitbox.width,
      height: data.hitbox.height,
    };
  }

  getHurtbox(): Rect | null {
    if (!this.isAlive()) {
      return null;
    }

    if (this.state === "KNOCKDOWN") {
      return {
        x: this.x - 30,
        y: this.y - 20,
        width: 60,
        height: 20,
      };
    }

    return {
      x: this.x - 20,
      y: this.y - 84 - this.jumpHeight,
      width: 40,
      height: 78,
    };
  }

  applyDamage(event: DamageEvent, nowMs: number): boolean {
    if (!this.isAlive() || nowMs < this.invulnerableUntil) {
      return false;
    }

    this.hp = Math.max(0, this.hp - event.damage);
    this.invulnerableUntil = nowMs + event.iFrameMs;

    const direction = event.sourceX <= this.x ? 1 : -1;
    this.externalVelocity.x = direction * event.knockbackX;
    this.externalVelocity.y = 0;

    this.attackRuntime = null;

    if (this.hp <= 0) {
      this.state = "DEAD";
      this.clearMoveIntent();
      this.forceClipRestart = true;
      return true;
    }

    if (event.causesKnockdown) {
      this.state = "KNOCKDOWN";
      this.knockdownUntil = nowMs + event.knockdownDurationMs;
      this.forceClipRestart = true;
      return true;
    }

    this.state = "HIT";
    this.hitUntil = nowMs + event.hitStunMs;
    this.forceClipRestart = true;
    return true;
  }

  grantInvulnerability(durationMs: number, nowMs: number): void {
    this.invulnerableUntil = Math.max(this.invulnerableUntil, nowMs + durationMs);
  }

  startJump(): boolean {
    if (this.airborne || !this.canAcceptCommands()) {
      return false;
    }
    this.airborne = true;
    this.jumpHeight = 1;
    this.jumpVelocity = JUMP_INITIAL_VELOCITY;
    this.state = "JUMP";
    this.forceClipRestart = true;
    return true;
  }

  consumeHealthRatio(ratio: number, minRemainingHp = 1): boolean {
    const cost = Math.ceil(this.maxHp * ratio);
    if (this.hp - cost < minRemainingHp) {
      return false;
    }
    this.hp -= cost;
    return true;
  }

  getDebugText(): string {
    const attack = this.attackRuntime ? ` ${this.attackRuntime.attackId}[${this.attackRuntime.frame}]` : "";
    return `${this.id} ${this.state}${attack} HP:${this.hp}/${this.maxHp}`;
  }

  getVisualDebugInfo(): FighterVisualDebugInfo {
    return {
      textureKey: this.animationSet.clips[this.currentClipId].textureKey,
      frame: Number(this.sprite.frame.name),
      textureStateId: this.currentClipId,
      appliedOffset: {
        x: this.lastAppliedOffset.x,
        y: this.lastAppliedOffset.y,
      },
      baselineY: this.lastBaselineY,
      footY: this.y,
      shadowY: this.shadow.y,
      spriteY: this.sprite.y,
      spriteDepth: this.sprite.depth,
    };
  }

  private createDefaultVisualProfile(): FighterVisualProfile {
    const stateOffsetByState = {} as Record<FighterState, SpritePixelOffset>;
    const baselineOffsetByState = {} as Record<FighterState, number>;
    for (const state of FIGHTER_STATES) {
      stateOffsetByState[state] = { x: 0, y: 0 };
      baselineOffsetByState[state] = 0;
    }
    return {
      scale: CHARACTER_SCALE as 1 | 2 | 3,
      shadowWidth: 22,
      shadowHeight: 8,
      spriteAnchorOffsetY: -2,
      shadowOffsetY: 3,
      baselineOffsetByState,
      stateOffsetByState,
      frameOffsetByClip: {},
    };
  }

  private updateTimers(nowMs: number): void {
    if (this.state === "HIT" && nowMs >= this.hitUntil) {
      this.state = this.airborne ? "JUMP" : "IDLE";
      this.forceClipRestart = true;
    }

    if (this.state === "KNOCKDOWN" && nowMs >= this.knockdownUntil) {
      this.state = "GETUP";
      this.getupUntil = nowMs + 520;
      this.externalVelocity.x = 0;
      this.externalVelocity.y = 0;
      this.forceClipRestart = true;
    }

    if (this.state === "GETUP" && nowMs >= this.getupUntil) {
      this.state = "IDLE";
      this.forceClipRestart = true;
    }
  }

  private updateJump(deltaMs: number): void {
    if (!this.airborne) {
      return;
    }

    const dt = deltaMs / 1000;
    this.jumpVelocity -= JUMP_GRAVITY * dt;
    this.jumpHeight += this.jumpVelocity * dt;

    if (this.jumpHeight <= 0) {
      this.jumpHeight = 0;
      this.jumpVelocity = 0;
      this.airborne = false;
      if (this.state === "JUMP") {
        this.state = "IDLE";
        this.forceClipRestart = true;
      }
    }
  }

  private updateAttack(deltaMs: number): void {
    if (!this.attackRuntime) {
      return;
    }

    const data = this.attackData[this.attackRuntime.attackId];
    this.attackRuntime.elapsedMs += deltaMs;
    this.attackRuntime.frame = Math.min(
      data.totalFrames,
      Math.floor(this.attackRuntime.elapsedMs / ATTACK_FRAME_MS) + 1,
    );

    if (this.attackRuntime.elapsedMs < data.totalFrames * ATTACK_FRAME_MS) {
      return;
    }

    const queued = this.attackRuntime.queuedNextAttack;
    this.attackRuntime = null;

    if (queued) {
      this.tryStartAttack(queued);
      return;
    }

    if (this.airborne) {
      this.state = "JUMP";
    } else {
      this.state = "IDLE";
    }
    this.forceClipRestart = true;
  }

  private applyVelocity(deltaMs: number): void {
    const body = this.footCollider.body as Phaser.Physics.Arcade.Body;
    if (!this.isAlive()) {
      body.setVelocity(this.externalVelocity.x, this.externalVelocity.y);
      this.externalVelocity.scale(0.84);
      return;
    }

    const lockedMove =
      this.state === "HIT" || this.state === "KNOCKDOWN" || this.state === "GETUP" || this.isPerformingAttack();
    const moveX = lockedMove ? 0 : this.moveIntent.x;
    const moveY = lockedMove ? 0 : this.moveIntent.y;

    if (moveX > 0) {
      this.facing = 1;
    } else if (moveX < 0) {
      this.facing = -1;
    }

    const speed = this.airborne ? this.moveSpeed * 0.84 : this.moveSpeed;
    const velocityX = moveX * speed + this.externalVelocity.x;
    const velocityY = moveY * speed + this.externalVelocity.y;
    body.setVelocity(velocityX, velocityY);

    this.externalVelocity.scale(Math.max(0, 1 - deltaMs * 0.008));
    if (Math.abs(this.externalVelocity.x) < 4) {
      this.externalVelocity.x = 0;
    }
    if (Math.abs(this.externalVelocity.y) < 4) {
      this.externalVelocity.y = 0;
    }

    if (!lockedMove && !this.airborne && !this.attackRuntime && this.state !== "HIT" && this.state !== "GETUP") {
      const nextState = moveX !== 0 || moveY !== 0 ? "WALK" : "IDLE";
      if (this.state !== nextState) {
        this.state = nextState;
        this.forceClipRestart = true;
      }
    }
  }

  private syncVisual(): void {
    this.shadow.setPosition(Math.round(this.x), Math.round(this.y + this.visualProfile.shadowOffsetY));
    this.shadow.setAlpha(Phaser.Math.Clamp(1 - this.jumpHeight / 120, 0.25, 1));

    const stateOffset = this.getStateOffset(this.state);
    const frameOffset = this.getFrameOffset(this.currentClipId, Number(this.sprite.frame.name));
    const totalOffsetX = stateOffset.x + frameOffset.x;
    const appliedOffsetX = this.facing < 0 ? -totalOffsetX : totalOffsetX;
    const appliedOffsetY = stateOffset.y + frameOffset.y;
    this.lastAppliedOffset = { x: appliedOffsetX, y: appliedOffsetY };

    const baselineY = this.y + this.visualProfile.spriteAnchorOffsetY - this.jumpHeight + appliedOffsetY;
    this.lastBaselineY = baselineY;
    const spriteX = Math.round(this.x + appliedOffsetX);
    const spriteY = Math.round(baselineY);
    this.spriteOutline.setPosition(spriteX + 1, spriteY + 1);
    this.spriteOutline.setFlipX(this.facing < 0);
    this.sprite.setPosition(spriteX, spriteY);
    this.sprite.setFlipX(this.facing < 0);
  }

  private getStateOffset(state: FighterState): SpritePixelOffset {
    const offset = this.visualProfile.stateOffsetByState[state];
    if (offset) {
      return offset;
    }
    const legacyY = this.visualProfile.baselineOffsetByState?.[state];
    if (legacyY !== undefined) {
      return {
        x: 0,
        y: legacyY,
      };
    }
    return ZERO_OFFSET;
  }

  private getFrameOffset(clipId: AnimationClipId, frame: number): SpritePixelOffset {
    const offsets = this.visualProfile.frameOffsetByClip[clipId];
    if (!offsets || offsets.length === 0) {
      return ZERO_OFFSET;
    }
    const index = Number.isFinite(frame) ? Math.max(0, frame) : 0;
    return offsets[index] ?? ZERO_OFFSET;
  }

  private updateVisualTone(nowMs: number): void {
    if (!this.isAlive()) {
      this.sprite.setTint(0x4a4a4a);
      this.spriteOutline.setAlpha(0.45);
      return;
    }

    if (this.state === "KNOCKDOWN" || this.state === "GETUP") {
      this.sprite.setTint(0x7799aa);
      this.spriteOutline.setAlpha(0.65);
      return;
    }

    if (this.state === "HIT") {
      this.sprite.setTint(0xff8080);
      this.spriteOutline.setAlpha(0.78);
      return;
    }

    if (nowMs < this.invulnerableUntil && Math.floor(nowMs / 50) % 2 === 0) {
      this.sprite.setTint(0xffffff);
      this.spriteOutline.setAlpha(0.6);
      return;
    }

    this.sprite.clearTint();
    this.spriteOutline.setAlpha(0.6);
  }

  private updateSpriteAnimation(): void {
    const nextClip = this.resolveClipForState(this.state);
    if (this.currentClipId !== nextClip || this.forceClipRestart) {
      this.playClip(nextClip, true);
      this.forceClipRestart = false;
      return;
    }

    const currentAnim = this.sprite.anims.currentAnim;
    if (!currentAnim) {
      this.playClip(nextClip, true);
    }
  }

  private resolveClipForState(state: FighterState): AnimationClipId {
    if (state === "WALK") {
      return "walk";
    }
    if (state === "IDLE" || state === "JUMP") {
      return "idle";
    }
    if (state === "ATTACK_1") {
      return "attack1";
    }
    if (state === "ATTACK_2") {
      return "attack2";
    }
    if (state === "ATTACK_3") {
      return "attack3";
    }
    if (state === "AIR_ATTACK") {
      return "airAttack";
    }
    if (state === "SPECIAL") {
      return "special";
    }
    if (state === "HIT") {
      return "hurt";
    }
    if (state === "KNOCKDOWN" || state === "DEAD") {
      return "knockdown";
    }
    if (state === "GETUP") {
      return "getup";
    }
    return "idle";
  }

  private playClip(clipId: AnimationClipId, restart = false): void {
    this.currentClipId = clipId;
    this.currentClipScaleMultiplier = this.getClipScaleMultiplier(clipId);
    const scale = this.visualProfile.scale * this.currentClipScaleMultiplier;
    this.sprite.setScale(scale);
    this.spriteOutline.setScale(scale);
    const key = getAnimationKey(this.animationOwner, clipId);
    this.sprite.play(key, restart);
    this.spriteOutline.play(key, restart);
  }

  private getClipScaleMultiplier(clipId: AnimationClipId): number {
    return 1;
  }

  private applyStateForAttack(attackId: AttackId): void {
    if (attackId === "ATTACK_1" || attackId === "ENEMY_ATTACK") {
      this.state = "ATTACK_1";
      return;
    }
    if (attackId === "ATTACK_2") {
      this.state = "ATTACK_2";
      return;
    }
    if (attackId === "ATTACK_3") {
      this.state = "ATTACK_3";
      return;
    }
    if (attackId === "AIR_ATTACK") {
      this.state = "AIR_ATTACK";
      return;
    }
    this.state = "SPECIAL";
  }
}
