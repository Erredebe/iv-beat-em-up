import Phaser from "phaser";
import type { StageWalkRailConfig } from "../config/levels/stageTypes";

export interface NavigationPoint {
  x: number;
  y: number;
}

export interface NavigationBlocker {
  id: string;
  x: number;
  topY: number;
  bottomY: number;
  active: boolean;
}

export interface NavigationZoneState {
  activeZoneId: string | null;
  blockers: NavigationBlocker[];
}

export interface RailConnection {
  fromRailId: string;
  toRailId: string;
  x: number;
  fromY: number;
  toY: number;
}

export class NavigationSystem {
  private readonly rails: StageWalkRailConfig[];
  private readonly worldWidth: number;
  private readonly connections: RailConnection[];

  constructor(rails: StageWalkRailConfig[], worldWidth: number) {
    this.rails = [...rails];
    this.worldWidth = worldWidth;
    this.connections = this.buildConnections();
  }

  getRailAt(x: number, y: number): StageWalkRailConfig {
    const clampedX = Phaser.Math.Clamp(x, 0, this.worldWidth);
    const candidates = this.rails.filter((rail) => clampedX >= rail.xStart && clampedX <= rail.xEnd);
    if (candidates.length === 0) {
      return clampedX <= this.rails[0].xStart ? this.rails[0] : this.rails[this.rails.length - 1];
    }
    if (candidates.length === 1) {
      return candidates[0];
    }

    let best = candidates[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const rail of candidates) {
      const centerY = (rail.topY + rail.bottomY) * 0.5;
      const distance = Math.abs(centerY - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = rail;
      }
    }
    return best;
  }

  projectToNearestRail(x: number, y: number): NavigationPoint {
    const clampedX = Phaser.Math.Clamp(x, 0, this.worldWidth);
    const rail = this.getRailAt(clampedX, y);
    return {
      x: clampedX,
      y: Phaser.Math.Clamp(y, rail.topY, rail.bottomY),
    };
  }

  isPathBlocked(from: NavigationPoint, to: NavigationPoint, zoneState: NavigationZoneState | null | undefined): boolean {
    if (!zoneState || zoneState.blockers.length === 0) {
      return false;
    }

    for (const blocker of zoneState.blockers) {
      if (!blocker.active) {
        continue;
      }
      if (!this.segmentCrossesX(from.x, to.x, blocker.x)) {
        continue;
      }

      const yAtBlock = this.interpolateYAtX(from, to, blocker.x);
      if (yAtBlock >= blocker.topY && yAtBlock <= blocker.bottomY) {
        return true;
      }
    }

    return false;
  }

  getRails(): StageWalkRailConfig[] {
    return this.rails;
  }

  getConnections(): RailConnection[] {
    return this.connections;
  }

  private buildConnections(): RailConnection[] {
    const links: RailConnection[] = [];
    for (let i = 0; i < this.rails.length - 1; i += 1) {
      const from = this.rails[i];
      const to = this.rails[i + 1];
      const overlapStart = Math.max(from.xStart, to.xStart);
      const overlapEnd = Math.min(from.xEnd, to.xEnd);
      if (overlapEnd < overlapStart) {
        continue;
      }

      const x = (overlapStart + overlapEnd) * 0.5;
      links.push({
        fromRailId: from.id,
        toRailId: to.id,
        x,
        fromY: (from.topY + from.bottomY) * 0.5,
        toY: (to.topY + to.bottomY) * 0.5,
      });
    }
    return links;
  }

  private segmentCrossesX(fromX: number, toX: number, obstacleX: number): boolean {
    const minX = Math.min(fromX, toX);
    const maxX = Math.max(fromX, toX);
    return obstacleX >= minX && obstacleX <= maxX;
  }

  private interpolateYAtX(from: NavigationPoint, to: NavigationPoint, x: number): number {
    const dx = to.x - from.x;
    if (Math.abs(dx) < 0.001) {
      return (from.y + to.y) * 0.5;
    }
    const t = Phaser.Math.Clamp((x - from.x) / dx, 0, 1);
    return Phaser.Math.Linear(from.y, to.y, t);
  }
}
