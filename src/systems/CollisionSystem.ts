import Phaser from "phaser";
import { LANE_BOTTOM, LANE_TOP, WORLD_WIDTH } from "../config/constants";

export interface WalkLaneBounds {
  topY: number;
  bottomY: number;
}

const DEFAULT_WALK_LANE: WalkLaneBounds = {
  topY: LANE_TOP,
  bottomY: LANE_BOTTOM,
};

export interface FootColliderOwner {
  footCollider: Phaser.Physics.Arcade.Image;
}

export interface GroundObstacle {
  id: string;
  shape: Phaser.GameObjects.Rectangle;
  body: Phaser.Physics.Arcade.StaticBody;
  enabled: boolean;
}

interface GroundObstacleConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number;
}

export class CollisionSystem {
  private readonly scene: Phaser.Scene;
  private readonly obstacles: Phaser.Physics.Arcade.StaticGroup;
  private readonly walkLane: WalkLaneBounds;
  private debugEnabled = false;

  constructor(scene: Phaser.Scene, walkLane: WalkLaneBounds = DEFAULT_WALK_LANE) {
    this.scene = scene;
    this.walkLane = {
      topY: walkLane.topY,
      bottomY: walkLane.bottomY,
    };
    this.scene.physics.world.setBounds(0, this.walkLane.topY, WORLD_WIDTH, this.walkLane.bottomY - this.walkLane.topY);
    this.obstacles = scene.physics.add.staticGroup();
  }

  getWalkLane(): WalkLaneBounds {
    return this.walkLane;
  }

  registerGroundObstacle(config: GroundObstacleConfig): GroundObstacle {
    const color = config.color ?? 0x0088ff;
    const shape = this.scene.add
      .rectangle(config.x, config.y, config.width, config.height, color, this.debugEnabled ? 0.25 : 0)
      .setOrigin(0.5);
    this.scene.physics.add.existing(shape, true);
    const body = shape.body as Phaser.Physics.Arcade.StaticBody;
    this.obstacles.add(shape);
    body.updateFromGameObject();

    return {
      id: config.id,
      shape,
      body,
      enabled: true,
    };
  }

  attachFootCollider(owner: FootColliderOwner): void {
    this.scene.physics.add.collider(owner.footCollider, this.obstacles);
    const body = owner.footCollider.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setAllowGravity(false);
  }

  applyWorldBounds(owner: FootColliderOwner): void {
    const body = owner.footCollider.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
  }

  setObstacleEnabled(obstacle: GroundObstacle, enabled: boolean): void {
    obstacle.enabled = enabled;
    obstacle.body.enable = enabled;
    obstacle.shape.setVisible(this.debugEnabled && enabled);
  }

  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    for (const child of this.obstacles.getChildren()) {
      const shape = child as Phaser.GameObjects.Rectangle;
      const body = shape.body as Phaser.Physics.Arcade.StaticBody;
      shape.setVisible(enabled && body.enable);
      shape.setFillStyle(shape.fillColor, enabled ? 0.25 : 0);
    }
  }
}
