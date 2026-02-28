import Phaser from "phaser";
import { LANE_BOTTOM, LANE_TOP, WORLD_WIDTH } from "../config/constants";
import type { StageWalkRailConfig } from "../config/levels/stageTypes";

export interface WalkLaneBounds {
  topY: number;
  bottomY: number;
}

const DEFAULT_WALK_LANE: WalkLaneBounds = {
  topY: LANE_TOP,
  bottomY: LANE_BOTTOM,
};

const DEFAULT_WALK_RAILS: StageWalkRailConfig[] = [
  {
    id: "default_lane",
    xStart: 0,
    xEnd: WORLD_WIDTH,
    topY: DEFAULT_WALK_LANE.topY,
    bottomY: DEFAULT_WALK_LANE.bottomY,
    preferredY: (DEFAULT_WALK_LANE.topY + DEFAULT_WALK_LANE.bottomY) * 0.5,
  },
];

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
  private readonly walkRails: StageWalkRailConfig[];
  private readonly worldWidth: number;
  private debugEnabled = false;

  constructor(scene: Phaser.Scene, walkRails: StageWalkRailConfig[] = DEFAULT_WALK_RAILS, worldWidth = WORLD_WIDTH) {
    this.scene = scene;
    this.worldWidth = worldWidth;
    this.walkRails = this.sanitizeRails(walkRails);

    let topY = Number.POSITIVE_INFINITY;
    let bottomY = Number.NEGATIVE_INFINITY;
    for (const rail of this.walkRails) {
      topY = Math.min(topY, rail.topY);
      bottomY = Math.max(bottomY, rail.bottomY);
    }

    this.walkLane = {
      topY: Number.isFinite(topY) ? topY : DEFAULT_WALK_LANE.topY,
      bottomY: Number.isFinite(bottomY) ? bottomY : DEFAULT_WALK_LANE.bottomY,
    };

    this.scene.physics.world.setBounds(0, 0, this.worldWidth, 4096);
    this.obstacles = scene.physics.add.staticGroup();
  }

  getWalkLane(): WalkLaneBounds {
    return this.walkLane;
  }

  getWalkRails(): StageWalkRailConfig[] {
    return this.walkRails;
  }

  getRailAtX(x: number): StageWalkRailConfig {
    const clampedX = Phaser.Math.Clamp(x, 0, this.worldWidth);
    const containing = this.walkRails.find((rail) => clampedX >= rail.xStart && clampedX <= rail.xEnd);
    if (containing) {
      return containing;
    }

    if (clampedX < this.walkRails[0].xStart) {
      return this.walkRails[0];
    }
    return this.walkRails[this.walkRails.length - 1];
  }

  clampPositionToRail(x: number, y: number): Phaser.Math.Vector2 {
    const clampedX = Phaser.Math.Clamp(x, 0, this.worldWidth);
    const bounds = this.getVerticalBoundsAtX(clampedX);
    return new Phaser.Math.Vector2(clampedX, Phaser.Math.Clamp(y, bounds.topY, bounds.bottomY));
  }

  getWorldWidth(): number {
    return this.worldWidth;
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

  private sanitizeRails(rails: StageWalkRailConfig[]): StageWalkRailConfig[] {
    const source = rails.length > 0 ? rails : DEFAULT_WALK_RAILS;
    return source
      .map((rail, index) => ({
        id: rail.id ?? `rail_${index}`,
        xStart: Math.min(rail.xStart, rail.xEnd),
        xEnd: Math.max(rail.xStart, rail.xEnd),
        topY: Math.min(rail.topY, rail.bottomY),
        bottomY: Math.max(rail.topY, rail.bottomY),
        preferredY: rail.preferredY,
      }))
      .sort((a, b) => a.xStart - b.xStart);
  }

  private getVerticalBoundsAtX(x: number): WalkLaneBounds {
    const current = this.walkRails.find((rail) => x >= rail.xStart && x <= rail.xEnd);
    if (current) {
      return {
        topY: current.topY,
        bottomY: current.bottomY,
      };
    }

    let previous: StageWalkRailConfig | null = null;
    let next: StageWalkRailConfig | null = null;
    for (const rail of this.walkRails) {
      if (rail.xEnd < x) {
        previous = rail;
        continue;
      }
      if (rail.xStart > x) {
        next = rail;
        break;
      }
    }

    if (previous && next) {
      const span = Math.max(1, next.xStart - previous.xEnd);
      const t = Phaser.Math.Clamp((x - previous.xEnd) / span, 0, 1);
      return {
        topY: Phaser.Math.Linear(previous.topY, next.topY, t),
        bottomY: Phaser.Math.Linear(previous.bottomY, next.bottomY, t),
      };
    }

    const edge = x < this.walkRails[0].xStart ? this.walkRails[0] : this.walkRails[this.walkRails.length - 1];
    return {
      topY: edge.topY,
      bottomY: edge.bottomY,
    };
  }
}
