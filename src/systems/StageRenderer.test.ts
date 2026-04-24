import { describe, expect, it, vi } from "vitest";
import { derivedTextureCrops } from "../config/assets/derivedTextureCrops";
import { stageCatalog } from "../config/levels/stageCatalog";
import type { StageLayoutConfig } from "../config/levels/stageTypes";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    },
    BlendModes: {
      SCREEN: 1,
      OVERLAY: 2,
      MULTIPLY: 3,
    },
  },
}));

type Chainable = {
  destroy(): void;
};

type FakeTileSprite = Chainable & {
  tilePositionX: number;
  depth: number;
  alpha: number;
  tileScaleX: number;
  tileScaleY: number;
  tint?: number;
  textureKey: string;
  setOrigin(x: number, y: number): FakeTileSprite;
  setScrollFactor(value: number): FakeTileSprite;
  setDepth(depth: number): FakeTileSprite;
  setAlpha(alpha: number): FakeTileSprite;
  setTileScale(x: number, y: number): FakeTileSprite;
  setTint(tint: number): FakeTileSprite;
};

type FakeImage = Chainable & {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  alpha: number;
  displayWidth: number;
  displayHeight: number;
  tint?: number;
  textureKey: string;
  setOrigin(x: number, y: number): FakeImage;
  setScale(scale: number): FakeImage;
  setTint(tint: number): FakeImage;
  setAlpha(alpha: number): FakeImage;
  setDepth(depth: number): FakeImage;
  setBlendMode(mode: number): FakeImage;
};

type FakeText = Chainable & {
  depth: number;
  alpha: number;
  setDepth(depth: number): FakeText;
  setAlpha(alpha: number): FakeText;
};

type FakeGraphics = Chainable & {
  depth: number;
  x: number;
  fillGradientStyle(...args: number[]): FakeGraphics;
  fillRect(x: number, y: number, width: number, height: number): FakeGraphics;
  setDepth(depth: number): FakeGraphics;
  lineStyle(width: number, color: number, alpha: number): FakeGraphics;
  lineBetween(x1: number, y1: number, x2: number, y2: number): FakeGraphics;
  setX(x: number): FakeGraphics;
};

type FakeTileLayer = Chainable & {
  id: string;
  depth: number;
  alpha: number;
  scale: number;
  y: number;
  tiles: number[][] | null;
  tint?: number;
  setDepth(depth: number): FakeTileLayer;
  setScale(scale: number): FakeTileLayer;
  setY(y: number): FakeTileLayer;
  setAlpha(alpha: number): FakeTileLayer;
  setTint(tint: number): FakeTileLayer;
  putTilesAt(data: number[][], x: number, y: number): FakeTileLayer;
};

type FakeTilemap = Chainable & {
  addTilesetImage(name: string): Record<string, string> | null;
  createBlankLayer(id: string): FakeTileLayer | null;
};

function createDestroyable<T extends object>(target: T): T & Chainable & { destroyed: boolean } {
  const value = target as T & Chainable & { destroyed: boolean };
  value.destroyed = false;
  value.destroy = function destroy() {
    this.destroyed = true;
  };
  return value;
}

function createFakeGraphics(): FakeGraphics & { destroyed: boolean } {
  const graphic = {
    depth: 0,
    x: 0,
    fillGradientStyle() {
      return this;
    },
    fillRect() {
      return this;
    },
    setDepth(depth: number) {
      this.depth = depth;
      return this;
    },
    lineStyle() {
      return this;
    },
    lineBetween() {
      return this;
    },
    setX(x: number) {
      this.x = x;
      return this;
    },
  };
  return createDestroyable(graphic) as unknown as FakeGraphics & { destroyed: boolean };
}

function createFakeTileSprite(textureKey: string): FakeTileSprite & { destroyed: boolean } {
  const sprite = {
    tilePositionX: 0,
    depth: 0,
    alpha: 1,
    tileScaleX: 1,
    tileScaleY: 1,
    tint: undefined as number | undefined,
    textureKey,
    setOrigin() {
      return this;
    },
    setScrollFactor() {
      return this;
    },
    setDepth(depth: number) {
      this.depth = depth;
      return this;
    },
    setAlpha(alpha: number) {
      this.alpha = alpha;
      return this;
    },
    setTileScale(x: number, y: number) {
      this.tileScaleX = x;
      this.tileScaleY = y;
      return this;
    },
    setTint(tint: number) {
      this.tint = tint;
      return this;
    },
  };
  return createDestroyable(sprite) as unknown as FakeTileSprite & { destroyed: boolean };
}

function createFakeImage(textureKey: string, width: number, height: number): FakeImage & { destroyed: boolean } {
  const image = {
    x: 0,
    y: 0,
    width,
    height,
    depth: 0,
    alpha: 1,
    displayWidth: width,
    displayHeight: height,
    tint: undefined as number | undefined,
    textureKey,
    setOrigin() {
      return this;
    },
    setScale(scale: number) {
      this.displayWidth = this.width * scale;
      this.displayHeight = this.height * scale;
      return this;
    },
    setTint(tint: number) {
      this.tint = tint;
      return this;
    },
    setAlpha(alpha: number) {
      this.alpha = alpha;
      return this;
    },
    setDepth(depth: number) {
      this.depth = depth;
      return this;
    },
    setBlendMode() {
      return this;
    },
  };
  return createDestroyable(image) as unknown as FakeImage & { destroyed: boolean };
}

function createFakeText(): FakeText & { destroyed: boolean } {
  const text = {
    depth: 0,
    alpha: 1,
    setDepth(depth: number) {
      this.depth = depth;
      return this;
    },
    setAlpha(alpha: number) {
      this.alpha = alpha;
      return this;
    },
  };
  return createDestroyable(text) as unknown as FakeText & { destroyed: boolean };
}

function createFakeTileLayer(id: string): FakeTileLayer & { destroyed: boolean } {
  const layer = {
    id,
    depth: 0,
    alpha: 1,
    scale: 1,
    y: 0,
    tiles: null as number[][] | null,
    tint: undefined as number | undefined,
    setDepth(depth: number) {
      this.depth = depth;
      return this;
    },
    setScale(scale: number) {
      this.scale = scale;
      return this;
    },
    setY(y: number) {
      this.y = y;
      return this;
    },
    setAlpha(alpha: number) {
      this.alpha = alpha;
      return this;
    },
    setTint(tint: number) {
      this.tint = tint;
      return this;
    },
    putTilesAt(data: number[][]) {
      this.tiles = data;
      return this;
    },
  };
  return createDestroyable(layer) as unknown as FakeTileLayer & { destroyed: boolean };
}

function createFakeTilemap(availableTextureKeys: Set<string>, layers: FakeTileLayer[]): FakeTilemap & { destroyed: boolean } {
  return createDestroyable({
    addTilesetImage(name: string) {
      return availableTextureKeys.has(name) ? { name } : null;
    },
    createBlankLayer(id: string) {
      const layer = createFakeTileLayer(id);
      layers.push(layer);
      return layer;
    },
  });
}

function createSceneHarness() {
  const derivedTextureMap = new Map(derivedTextureCrops.map((crop) => [crop.targetKey, { width: crop.width, height: crop.height }]));
  const availableTextureKeys = new Set<string>(derivedTextureMap.keys());
  availableTextureKeys.add("street_sheet");
  availableTextureKeys.add("street_tileset");
  availableTextureKeys.add("street_clean_tileset");
  availableTextureKeys.add("oga_industrial_bg");
  availableTextureKeys.add("oga_industrial_far");
  availableTextureKeys.add("oga_industrial_buildings");
  availableTextureKeys.add("oga_industrial_foreground");
  availableTextureKeys.add("oga_urban_sky");
  availableTextureKeys.add("oga_urban_buildings");
  availableTextureKeys.add("oga_city_bg");

  const tileSprites: Array<FakeTileSprite & { destroyed: boolean }> = [];
  const images: Array<FakeImage & { destroyed: boolean }> = [];
  const texts: Array<FakeText & { destroyed: boolean }> = [];
  const graphics: Array<FakeGraphics & { destroyed: boolean }> = [];
  const rectangles: Array<FakeImage & { destroyed: boolean }> = [];
  const tileLayers: Array<FakeTileLayer & { destroyed: boolean }> = [];

  const scene = {
    time: {
      now: 1000,
    },
    add: {
      tileSprite(_x: number, _y: number, _width: number, _height: number, textureKey: string) {
        if (!availableTextureKeys.has(textureKey)) {
          throw new Error(`Unknown tile sprite texture ${textureKey}`);
        }
        const sprite = createFakeTileSprite(textureKey);
        tileSprites.push(sprite);
        return sprite;
      },
      image(x: number, y: number, textureKey: string) {
        const metrics = derivedTextureMap.get(textureKey);
        if (!metrics) {
          throw new Error(`Unknown image texture ${textureKey}`);
        }
        const image = createFakeImage(textureKey, metrics.width, metrics.height);
        image.x = x;
        image.y = y;
        images.push(image);
        return image;
      },
      text() {
        const text = createFakeText();
        texts.push(text);
        return text;
      },
      graphics() {
        const graphic = createFakeGraphics();
        graphics.push(graphic);
        return graphic;
      },
      rectangle(x: number, y: number, width: number, height: number) {
        const rectangle = createFakeImage("rectangle", width, height);
        rectangle.x = x;
        rectangle.y = y;
        rectangles.push(rectangle);
        return rectangle;
      },
    },
    make: {
      tilemap() {
        return createFakeTilemap(availableTextureKeys, tileLayers);
      },
    },
  } as const;

  return {
    scene: scene as unknown as Phaser.Scene,
    tileSprites,
    images,
    texts,
    graphics,
    rectangles,
    tileLayers,
  };
}

function createCollisionSystem() {
  const obstacles: Array<{ id: string }> = [];
  return {
    registerGroundObstacle(obstacle: { id: string }) {
      obstacles.push(obstacle);
      return obstacle;
    },
    obstacles,
  };
}

function createDepthSystem() {
  const registered: object[] = [];
  const unregistered: object[] = [];
  return {
    register(gameObject: object) {
      registered.push(gameObject);
    },
    unregister(gameObject: object) {
      unregistered.push(gameObject);
    },
    registered,
    unregistered,
  };
}

function expectedObstacleCount(layout: StageLayoutConfig): number {
  return layout.objects.filter((object) => object.collision?.blocksMovement).length;
}

describe("StageRenderer", () => {
  it("builds every stage layout with valid runtime assets and cleanup", async () => {
    const { StageRenderer } = await import("./StageRenderer");

    for (const bundle of Object.values(stageCatalog)) {
      const harness = createSceneHarness();
      const collisionSystem = createCollisionSystem();
      const depthSystem = createDepthSystem();
      const renderer = new StageRenderer(harness.scene, bundle.layout);

      const runtime = renderer.build(collisionSystem as never, depthSystem as never);

      expect(runtime.tileLayers).toHaveLength(bundle.layout.layers.length);
      expect(runtime.parallaxBands).toHaveLength(bundle.layout.parallaxBands.length);
      expect(runtime.objects).toHaveLength(bundle.layout.objects.length);
      expect(collisionSystem.obstacles).toHaveLength(expectedObstacleCount(bundle.layout));
      expect(depthSystem.registered).toHaveLength(bundle.layout.objects.length);
      expect(harness.texts).toHaveLength(bundle.layout.neonLabels.length);
      runtime.tileLayers.forEach((layer, index) => {
        const fakeLayer = layer as unknown as FakeTileLayer;
        const config = bundle.layout.layers[index];
        expect(fakeLayer.scale).toBe(config.scale ?? 0.5);
        expect(fakeLayer.y).toBe(config.offsetY ?? 0);
      });
      runtime.parallaxBands.forEach((band, index) => {
        const fakeBand = band as unknown as FakeTileSprite;
        const expectedTileScale = bundle.layout.parallaxBands[index].tileScale ?? 0.5;
        expect(fakeBand.tileScaleX).toBe(expectedTileScale);
        expect(fakeBand.tileScaleY).toBe(expectedTileScale);
      });

      renderer.updateParallax(137);
      runtime.parallaxBands.forEach((band, index) => {
        expect((band as unknown as FakeTileSprite).tilePositionX).toBe(
          Math.floor(137 * bundle.layout.parallaxBands[index].scrollFactor),
        );
      });

      renderer.destroy();

      expect(depthSystem.unregistered).toHaveLength(bundle.layout.objects.length);
      expect(harness.tileLayers.every((layer) => layer.destroyed)).toBe(true);
      expect(harness.tileSprites.every((band) => band.destroyed)).toBe(true);
      expect(harness.images.every((image) => image.destroyed)).toBe(true);
      expect(harness.texts.every((text) => text.destroyed)).toBe(true);
      expect(harness.graphics.every((graphic) => graphic.destroyed)).toBe(true);
      expect(harness.rectangles.every((rectangle) => rectangle.destroyed)).toBe(true);
    }
  });
});
