interface DepthEntry {
  object: Phaser.GameObjects.GameObject & { y: number; depth: number };
  offset: number;
  yResolver?: () => number;
}

export class DepthSystem {
  private readonly entries: DepthEntry[] = [];

  register(
    object: Phaser.GameObjects.GameObject & { y: number; depth: number },
    offset = 0,
    yResolver?: () => number,
  ): void {
    this.entries.push({ object, offset, yResolver });
  }

  unregister(object: Phaser.GameObjects.GameObject): void {
    const index = this.entries.findIndex((entry) => entry.object === object);
    if (index >= 0) {
      this.entries.splice(index, 1);
    }
  }

  update(): void {
    for (const entry of this.entries) {
      const y = entry.yResolver ? entry.yResolver() : entry.object.y;
      entry.object.depth = y + entry.offset;
    }
  }

  getResolvedDepth(object: Phaser.GameObjects.GameObject): number | null {
    const entry = this.entries.find((candidate) => candidate.object === object);
    if (!entry) {
      return null;
    }
    const y = entry.yResolver ? entry.yResolver() : entry.object.y;
    return y + entry.offset;
  }
}
