import Phaser from "phaser";
import type { BaseFighter } from "../entities/BaseFighter";
import type { StageBreakablePropConfig } from "../config/levels/stageTypes";
import type { DepthSystem } from "./DepthSystem";

interface BreakableRuntime {
  id: string;
  sprite: Phaser.GameObjects.Image;
  hp: number;
  maxHp: number;
  points: number;
  destroyed: boolean;
  hitByAttack: Set<string>;
  hurtbox: Phaser.Geom.Rectangle;
}

function rectIntersects(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export interface BreakableHitResult {
  pointsAwarded: number;
  brokenCount: number;
}

export class BreakablePropSystem {
  private readonly scene: Phaser.Scene;
  private readonly depthSystem: DepthSystem;
  private readonly props: BreakableRuntime[] = [];

  constructor(scene: Phaser.Scene, depthSystem: DepthSystem, props: StageBreakablePropConfig[]) {
    this.scene = scene;
    this.depthSystem = depthSystem;

    for (const config of props) {
      const sprite = scene.add
        .image(config.x, config.y, config.textureKey)
        .setOrigin(config.originX, config.originY)
        .setScale(config.scale)
        .setTint(0xb8c7d2);
      depthSystem.register(sprite, 0);

      const width = sprite.width * config.scale;
      const height = sprite.height * config.scale;
      const left = config.x - width * config.originX;
      const top = config.y - height * config.originY;

      this.props.push({
        id: config.id,
        sprite,
        hp: config.maxHp,
        maxHp: config.maxHp,
        points: config.points,
        destroyed: false,
        hitByAttack: new Set<string>(),
        hurtbox: new Phaser.Geom.Rectangle(left, top, width, height),
      });
    }
  }

  resolveHits(fighters: BaseFighter[]): BreakableHitResult {
    let pointsAwarded = 0;
    let brokenCount = 0;

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
          this.depthSystem.unregister(prop.sprite);
          this.scene.tweens.add({
            targets: prop.sprite,
            alpha: 0,
            y: prop.sprite.y - 8,
            duration: 100,
            onComplete: () => prop.sprite.destroy(),
          });
        }
      }
    }

    return { pointsAwarded, brokenCount };
  }

  getRemainingCount(): number {
    return this.props.filter((prop) => !prop.destroyed).length;
  }

  destroy(): void {
    for (const prop of this.props) {
      if (!prop.destroyed) {
        this.depthSystem.unregister(prop.sprite);
        prop.sprite.destroy();
      }
    }
    this.props.length = 0;
  }
}
