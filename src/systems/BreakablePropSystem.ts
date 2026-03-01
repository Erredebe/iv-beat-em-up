import Phaser from "phaser";
import type { BaseFighter } from "../entities/BaseFighter";
import {
  isBreakableStageObject,
  resolveStageObjectHurtboxRect,
  type StageBreakableDropType,
} from "../config/levels/stageTypes";
import type { DepthSystem } from "./DepthSystem";
import type { CollisionSystem, GroundObstacle } from "./CollisionSystem";
import { resolveBreakablePickupDrop, type BreakablePickupSpawn } from "./breakableDropResolver";
import type { StageObjectRuntime } from "./StageRenderer";

export type { BreakablePickupSpawn } from "./breakableDropResolver";

function rectIntersects(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

interface BreakableRuntime {
  id: string;
  sprite: Phaser.GameObjects.Image;
  hp: number;
  points: number;
  destroyed: boolean;
  hitByAttack: Set<string>;
  hurtbox: Phaser.Geom.Rectangle;
  obstacle: GroundObstacle | null;
  dropType?: StageBreakableDropType;
  dropChance: number;
  healAmount?: number;
  intactTint: number;
  hitTint: number;
}

export interface BreakableHitResult {
  pointsAwarded: number;
  brokenCount: number;
  spawnedPickups: BreakablePickupSpawn[];
}

export class BreakablePropSystem {
  private readonly scene: Phaser.Scene;
  private readonly depthSystem: DepthSystem;
  private readonly collisionSystem: CollisionSystem;
  private readonly props: BreakableRuntime[] = [];
  private readonly randomFn: () => number;

  constructor(
    scene: Phaser.Scene,
    depthSystem: DepthSystem,
    collisionSystem: CollisionSystem,
    stageObjects: StageObjectRuntime[],
    randomFn: () => number = Math.random,
  ) {
    this.scene = scene;
    this.depthSystem = depthSystem;
    this.collisionSystem = collisionSystem;
    this.randomFn = randomFn;

    for (const runtime of stageObjects) {
      if (!isBreakableStageObject(runtime.config)) {
        continue;
      }
      const sprite = runtime.sprite;
      const hurtbox = resolveStageObjectHurtboxRect(runtime.config, {
        width: sprite.displayWidth,
        height: sprite.displayHeight,
      });
      if (!hurtbox) {
        continue;
      }

      const behavior = runtime.config.behavior;
      const drop = behavior.drop;
      const intactTint = behavior.intactTint ?? 0xb8c7d2;
      const hitTint = behavior.hitTint ?? 0xffd2d2;
      sprite.setTint(intactTint);

      this.props.push({
        id: runtime.config.id,
        sprite,
        hp: behavior.maxHp,
        points: behavior.points,
        destroyed: false,
        hitByAttack: new Set<string>(),
        hurtbox: new Phaser.Geom.Rectangle(hurtbox.x, hurtbox.y, hurtbox.width, hurtbox.height),
        obstacle: runtime.obstacle,
        dropType: drop?.type,
        dropChance: drop?.chance ?? 1,
        healAmount: drop?.healAmount,
        intactTint,
        hitTint,
      });
    }
  }

  resolveHits(fighters: BaseFighter[]): BreakableHitResult {
    let pointsAwarded = 0;
    let brokenCount = 0;
    const spawnedPickups: BreakablePickupSpawn[] = [];

    for (const fighter of fighters) {
      const hitbox = fighter.getActiveHitbox();
      const attackInstanceId = fighter.currentAttackInstanceId;
      if (!hitbox || attackInstanceId === null) {
        continue;
      }

      const hitRect = new Phaser.Geom.Rectangle(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
      const attackToken = `${fighter.id}:${attackInstanceId}`;

      for (const prop of this.props) {
        if (prop.destroyed) {
          continue;
        }
        if (prop.hitByAttack.has(attackToken)) {
          continue;
        }
        if (!rectIntersects(hitRect, prop.hurtbox)) {
          continue;
        }

        prop.hitByAttack.add(attackToken);
        prop.hp -= 10;
        prop.sprite.setTint(prop.hitTint);
        this.scene.time.delayedCall(50, () => {
          if (!prop.destroyed) {
            prop.sprite.setTint(prop.intactTint);
          }
        });

        if (prop.hp <= 0) {
          prop.destroyed = true;
          brokenCount += 1;
          pointsAwarded += prop.points;
          if (prop.obstacle) {
            this.collisionSystem.setObstacleEnabled(prop.obstacle, false);
          }
          this.depthSystem.unregister(prop.sprite);
          this.scene.tweens.add({
            targets: prop.sprite,
            alpha: 0,
            y: prop.sprite.y - 8,
            duration: 100,
            onComplete: () => prop.sprite.destroy(),
          });

          const spawnedPickup = resolveBreakablePickupDrop(
            {
              id: prop.id,
              x: prop.sprite.x,
              y: prop.sprite.y,
              dropType: prop.dropType,
              dropChance: prop.dropChance,
              healAmount: prop.healAmount,
            },
            this.randomFn,
          );
          if (spawnedPickup) {
            spawnedPickups.push(spawnedPickup);
          }
        }
      }
    }

    return { pointsAwarded, brokenCount, spawnedPickups };
  }

  getRemainingCount(): number {
    return this.props.filter((prop) => !prop.destroyed).length;
  }

  destroy(): void {
    for (const prop of this.props) {
      if (prop.obstacle) {
        this.collisionSystem.setObstacleEnabled(prop.obstacle, false);
      }
      if (!prop.destroyed) {
        this.depthSystem.unregister(prop.sprite);
        prop.sprite.destroy();
      }
    }
    this.props.length = 0;
  }
}
