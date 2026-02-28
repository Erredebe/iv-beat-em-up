import type { EnemyBasic } from "../entities/EnemyBasic";
import { cloneSpawnZones, type StageSpawnPointConfig, type StageSpawnZoneConfig } from "../config/levels/stageSpawnTypes";
import type { GroundObstacle, CollisionSystem } from "./CollisionSystem";

interface ZoneRuntime {
  id: string;
  triggerX: number;
  lockType: StageSpawnZoneConfig["lockType"];
  spawns: StageSpawnPointConfig[];
  leftBarriers: GroundObstacle[];
  rightBarriers: GroundObstacle[];
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
    zoneConfig: StageSpawnZoneConfig[],
  ) {
    this.collisionSystem = collisionSystem;
    this.createEnemy = createEnemy;

    const configs = cloneSpawnZones(zoneConfig);

    this.zones = configs.map((config) => {
      const leftBarriers = this.createZoneBarriers(config, "left");
      const rightBarriers = this.createZoneBarriers(config, "right");

      this.setBarriersEnabled(leftBarriers, false);
      this.setBarriersEnabled(rightBarriers, false);

      return {
        id: config.id,
        triggerX: config.triggerX,
        lockType: config.lockType,
        spawns: config.spawns,
        leftBarriers,
        rightBarriers,
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
        this.setBarriersEnabled(zone.leftBarriers, false);
        this.setBarriersEnabled(zone.rightBarriers, false);
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

    if (zone.lockType !== "soft_lock") {
      this.setBarriersEnabled(zone.leftBarriers, true);
      this.setBarriersEnabled(zone.rightBarriers, true);
    }

    zone.enemies = zone.spawns.map((spawn) => this.createEnemy(spawn));
    return zone.enemies;
  }

  isWaveCleared(zoneId: string): boolean {
    const zone = this.zones.find((entry) => entry.id === zoneId);
    return zone ? zone.cleared : false;
  }

  areAllZonesCleared(): boolean {
    if (this.zones.length === 0) {
      return true;
    }
    return this.zones.every((zone) => zone.cleared);
  }

  getActiveZoneId(): string | null {
    return this.activeZoneId;
  }

  getZoneLockType(zoneId: string): StageSpawnZoneConfig["lockType"] | null {
    const zone = this.zones.find((entry) => entry.id === zoneId);
    return zone ? zone.lockType : null;
  }

  getRemainingEnemies(): number {
    return this.zones.reduce((count, zone) => count + zone.enemies.filter((enemy) => enemy.isAlive()).length, 0);
  }

  private setBarriersEnabled(barriers: GroundObstacle[], enabled: boolean): void {
    for (const barrier of barriers) {
      this.collisionSystem.setObstacleEnabled(barrier, enabled);
    }
  }

  private createZoneBarriers(config: StageSpawnZoneConfig, side: "left" | "right"): GroundObstacle[] {
    const x = side === "left" ? config.leftBarrierX : config.rightBarrierX;
    const railBlocks = config.lockType === "partial_lock"
      ? this.collisionSystem.getWalkRails().filter((rail) => !config.barrier?.openRailIds?.includes(rail.id))
      : this.collisionSystem.getWalkRails();

    if (railBlocks.length === 0) {
      return [];
    }

    return railBlocks.map((rail, index) => {
      const height = rail.bottomY - rail.topY;
      return this.collisionSystem.registerGroundObstacle({
        id: `${config.id}_${side}_${index}`,
        x,
        y: rail.topY + height * 0.5,
        width: 12,
        height,
        topGap: config.lockType === "full_lock" ? config.barrier?.topGap : undefined,
        bottomGap: config.lockType === "full_lock" ? config.barrier?.bottomGap : undefined,
        color: side === "left" ? 0xff00ff : 0x00ffff,
      });
    });
  }
}
