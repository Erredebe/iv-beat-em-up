import type { EnemyBasic } from "../entities/EnemyBasic";
import { cloneSpawnZones, street95Zone1Spawns, type StageSpawnPointConfig, type StageSpawnZoneConfig } from "../config/levels/street95Zone1Spawns";
import type { GroundObstacle, CollisionSystem } from "./CollisionSystem";

interface ZoneRuntime {
  id: string;
  triggerX: number;
  spawns: StageSpawnPointConfig[];
  leftBarrier: GroundObstacle;
  rightBarrier: GroundObstacle;
  started: boolean;
  active: boolean;
  cleared: boolean;
  enemies: EnemyBasic[];
}

export class SpawnManager {
  private readonly zones: ZoneRuntime[];
  private readonly createEnemy: (spawn: StageSpawnPointConfig) => EnemyBasic;
  private readonly collisionSystem: CollisionSystem;
  private activeZoneId: string | null = null;

  constructor(
    collisionSystem: CollisionSystem,
    createEnemy: (spawn: StageSpawnPointConfig) => EnemyBasic,
    zoneConfig: StageSpawnZoneConfig[] = street95Zone1Spawns,
  ) {
    this.collisionSystem = collisionSystem;
    this.createEnemy = createEnemy;

    const configs = cloneSpawnZones(zoneConfig);

    const walkLane = this.collisionSystem.getWalkLane();
    const barrierHeight = walkLane.bottomY - walkLane.topY;
    this.zones = configs.map((config) => {
      const leftBarrier = this.collisionSystem.registerGroundObstacle({
        id: `${config.id}_left`,
        x: config.leftBarrierX,
        y: walkLane.topY + barrierHeight * 0.5,
        width: 12,
        height: barrierHeight,
        color: 0xff00ff,
      });
      const rightBarrier = this.collisionSystem.registerGroundObstacle({
        id: `${config.id}_right`,
        x: config.rightBarrierX,
        y: walkLane.topY + barrierHeight * 0.5,
        width: 12,
        height: barrierHeight,
        color: 0x00ffff,
      });

      this.collisionSystem.setObstacleEnabled(leftBarrier, false);
      this.collisionSystem.setObstacleEnabled(rightBarrier, false);

      return {
        id: config.id,
        triggerX: config.triggerX,
        spawns: config.spawns,
        leftBarrier,
        rightBarrier,
        started: false,
        active: false,
        cleared: false,
        enemies: [],
      };
    });
  }

  update(playerX: number): EnemyBasic[] {
    const spawned: EnemyBasic[] = [];

    for (const zone of this.zones) {
      if (!zone.started && playerX >= zone.triggerX) {
        spawned.push(...this.startWave(zone.id));
      }

      if (!zone.active) {
        continue;
      }

      const alive = zone.enemies.filter((enemy) => enemy.isAlive());
      zone.enemies = alive;
      if (alive.length === 0) {
        zone.active = false;
        zone.cleared = true;
        this.activeZoneId = null;
        this.collisionSystem.setObstacleEnabled(zone.leftBarrier, false);
        this.collisionSystem.setObstacleEnabled(zone.rightBarrier, false);
      }
    }

    return spawned;
  }

  startWave(zoneId: string): EnemyBasic[] {
    const zone = this.zones.find((entry) => entry.id === zoneId);
    if (!zone || zone.started) {
      return [];
    }

    zone.started = true;
    zone.active = true;
    zone.cleared = false;
    this.activeZoneId = zone.id;
    this.collisionSystem.setObstacleEnabled(zone.leftBarrier, true);
    this.collisionSystem.setObstacleEnabled(zone.rightBarrier, true);

    zone.enemies = zone.spawns.map((spawn) => this.createEnemy(spawn));
    return zone.enemies;
  }

  isWaveCleared(zoneId: string): boolean {
    const zone = this.zones.find((entry) => entry.id === zoneId);
    return zone ? zone.cleared : false;
  }

  getActiveZoneId(): string | null {
    return this.activeZoneId;
  }
}
