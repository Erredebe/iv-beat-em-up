import Phaser from "phaser";
import type { BaseFighter } from "../entities/BaseFighter";
import type { StageBreakablePropConfig } from "../config/levels/stageTypes";
import type { DepthSystem } from "./DepthSystem";
import type { CollisionSystem, GroundObstacle } from "./CollisionSystem";
import { resolveBreakablePickupDrop, type BreakablePickupSpawn } from "./breakableDropResolver";

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
  maxHp: number;
  points: number;
  destroyed: boolean;
  hitByAttack: Set<string>;
  hurtbox: Phaser.Geom.Rectangle;
  obstacle: GroundObstacle;
  dropType: StageBreakablePropConfig["dropType"];
  dropChance: number;
  healAmount?: number;
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
    props: StageBreakablePropConfig[],
    randomFn: () => number = Math.random,
  ) {
    this.scene = scene;
    this.depthSystem = depthSystem;
    this.collisionSystem = collisionSystem;
    this.randomFn = randomFn;

    for (const config of props) {
      const sprite = scene.add
        .image(config.x, config.y, config.textureKey)
        .setOrigin(config.originX, config.originY)
        .setScale(config.scale)
        .setTint(0xb8c7d2);
      depthSystem.register(sprite, 0, undefined, 6);

      const width = sprite.width * config.scale;
      const height = sprite.height * config.scale;
      const left = config.x - width * config.originX;
      const top = config.y - height * config.originY;
      const footprintWidth = Math.max(18, Math.min(width, Math.round(width * 0.58)));
      const footprintHeight = 14;
      const footprintY = top + height - footprintHeight * 0.5;
      const obstacle = this.collisionSystem.registerGroundObstacle({
        id: `${config.id}_breakable_feet`,
        x: config.x,
        y: footprintY,
        width: footprintWidth,
        height: footprintHeight,
        color: 0xffcc66,
      });

      this.props.push({
        id: config.id,
        sprite,
        hp: config.maxHp,
        maxHp: config.maxHp,
        points: config.points,
        destroyed: false,
        hitByAttack: new Set<string>(),
        hurtbox: new Phaser.Geom.Rectangle(left, top, width, height),
        obstacle,
        dropType: config.dropType,
        dropChance: config.dropChance ?? 1,
        healAmount: config.healAmount,
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
        prop.sprite.setTint(0xffd2d2);
        this.scene.time.delayedCall(50, () => {
          if (!prop.destroyed) {
            prop.sprite.setTint(0xb8c7d2);
          }
        });

        if (prop.hp <= 0) {
          prop.destroyed = true;
          brokenCount += 1;
          pointsAwarded += prop.points;
          this.collisionSystem.setObstacleEnabled(prop.obstacle, false);
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
      this.collisionSystem.setObstacleEnabled(prop.obstacle, false);
      if (!prop.destroyed) {
        this.depthSystem.unregister(prop.sprite);
        prop.sprite.destroy();
      }
    }
    this.props.length = 0;
  }
}
