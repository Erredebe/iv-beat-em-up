import { dynamicDepthBaseByLayer, type DynamicDepthLayer } from "../config/visual/depthLayers";

type DynamicYResolver = number | (() => number);

interface DepthRegistration {
  layer: DynamicDepthLayer;
  dynamicY?: DynamicYResolver;
  priority?: number;
}

interface DepthEntry {
  object: Phaser.GameObjects.GameObject & { y: number; depth: number };
  layer: DynamicDepthLayer;
  dynamicY?: DynamicYResolver;
  priority: number;
}

export class DepthSystem {
  private readonly entries: DepthEntry[] = [];

  register(
    object: Phaser.GameObjects.GameObject & { y: number; depth: number },
    registration: DepthRegistration,
  ): void {
    this.entries.push({
      object,
      layer: registration.layer,
      dynamicY: registration.dynamicY,
      priority: registration.priority ?? 0,
    });
  }

  unregister(object: Phaser.GameObjects.GameObject): void {
    const index = this.entries.findIndex((entry) => entry.object === object);
    if (index >= 0) {
      this.entries.splice(index, 1);
    }
  }

  update(): void {
    for (const entry of this.entries) {
      entry.object.depth = this.resolveDepth(entry);
    }
  }

  getResolvedDepth(object: Phaser.GameObjects.GameObject): number | null {
    const entry = this.entries.find((candidate) => candidate.object === object);
    if (!entry) {
      return null;
    }
    return this.resolveDepth(entry);
  }

  private resolveDepth(entry: DepthEntry): number {
    const layerBase = dynamicDepthBaseByLayer[entry.layer];
    const y = this.resolveDynamicY(entry);
    return layerBase + y + entry.priority * 0.001;
  }

  private resolveDynamicY(entry: DepthEntry): number {
    if (entry.dynamicY === undefined) {
      return entry.object.y;
    }
    if (typeof entry.dynamicY === "number") {
      return entry.dynamicY;
    }
    return entry.dynamicY();
  }
}
