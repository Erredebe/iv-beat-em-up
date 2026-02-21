export interface StageSpawnPointConfig {
  x: number;
  y: number;
}

export interface StageSpawnZoneConfig {
  id: string;
  triggerX: number;
  leftBarrierX: number;
  rightBarrierX: number;
  spawns: StageSpawnPointConfig[];
}

export function cloneSpawnZones(config: StageSpawnZoneConfig[]): StageSpawnZoneConfig[] {
  return config.map((zone) => ({
    id: zone.id,
    triggerX: zone.triggerX,
    leftBarrierX: zone.leftBarrierX,
    rightBarrierX: zone.rightBarrierX,
    spawns: zone.spawns.map((spawn) => ({
      x: spawn.x,
      y: spawn.y,
    })),
  }));
}

export const street95Zone1Spawns: StageSpawnZoneConfig[] = [
  {
    id: "zone_1",
    triggerX: 300,
    leftBarrierX: 60,
    rightBarrierX: 860,
    spawns: [{ x: 640, y: 204 }],
  },
  {
    id: "zone_2",
    triggerX: 1080,
    leftBarrierX: 1040,
    rightBarrierX: 1680,
    spawns: [{ x: 1460, y: 208 }],
  },
];
