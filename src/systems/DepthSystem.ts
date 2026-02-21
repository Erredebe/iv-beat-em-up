interface DepthEntry {
  object: Phaser.GameObjects.GameObject & { y: number; depth: number };
  offset: number;
}

export class DepthSystem {
  private readonly entries: DepthEntry[] = [];

  register(object: Phaser.GameObjects.GameObject & { y: number; depth: number }, offset = 0): void {
    this.entries.push({ object, offset });
  }

  unregister(object: Phaser.GameObjects.GameObject): void {
    const index = this.entries.findIndex((entry) => entry.object === object);
    if (index >= 0) {
      this.entries.splice(index, 1);
    }
  }

  update(): void {
    for (const entry of this.entries) {
      entry.object.depth = entry.object.y + entry.offset;
    }
  }
}

