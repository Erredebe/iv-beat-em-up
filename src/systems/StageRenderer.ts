import Phaser from "phaser";
import { BASE_HEIGHT } from "../config/constants";
import type { StageLayoutConfig } from "../config/levels/stageTypes";
import type { CollisionSystem } from "./CollisionSystem";
import type { DepthSystem } from "./DepthSystem";

interface RuntimeParallaxBand {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export interface StageRuntime {
  map: Phaser.Tilemaps.Tilemap;
  tileLayers: Phaser.Tilemaps.TilemapLayer[];
  parallaxBands: Phaser.GameObjects.TileSprite[];
  props: Phaser.GameObjects.Image[];
}

export class StageRenderer {
  private readonly scene: Phaser.Scene;
  private readonly layout: StageLayoutConfig;
  private depthSystem: DepthSystem | null = null;
  private runtime: StageRuntime | null = null;
  private runtimeParallax: RuntimeParallaxBand[] = [];
  private backgroundGradient: Phaser.GameObjects.Graphics | null = null;
  private gradeOverlay: Phaser.GameObjects.Rectangle | null = null;
  private neonTexts: Phaser.GameObjects.Text[] = [];
  private rainOverlay: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, layout: StageLayoutConfig) {
    this.scene = scene;
    this.layout = layout;
  }

  build(collisionSystem: CollisionSystem, depthSystem: DepthSystem): StageRuntime {
    this.destroy();
    this.depthSystem = depthSystem;

    const worldWidth = this.layout.mapWidthTiles * this.layout.tileSize;
    this.buildBackground(worldWidth);

    this.runtimeParallax = this.layout.parallaxBands.map((band) => {
      const sprite = this.scene.add
        .tileSprite(0, band.y, worldWidth, band.height, band.textureKey)
        .setOrigin(0, 0)
        .setDepth(band.depth)
        .setAlpha(band.alpha);
      if (band.id === "skyline_far") {
        sprite.setTint(0x7a89a8);
      } else if (band.id === "skyline_mid") {
        sprite.setTint(0x7f8ea8);
      } else {
        sprite.setTint(0x9f8f94);
      }
      return {
        sprite,
        factor: band.scrollFactor,
      };
    });

    const map = this.scene.make.tilemap({
      tileWidth: this.layout.tileSize,
      tileHeight: this.layout.tileSize,
      width: this.layout.mapWidthTiles,
      height: this.layout.mapHeightTiles,
    });

    const tileset = map.addTilesetImage(this.layout.tilesetKey, this.layout.tilesetKey, this.layout.tileSize, this.layout.tileSize, 0, 0);
    if (!tileset) {
      throw new Error(`Missing tileset texture for ${this.layout.tilesetKey}`);
    }

    const tileLayers: Phaser.Tilemaps.TilemapLayer[] = [];
    for (const layerConfig of this.layout.layers) {
      const layer = map.createBlankLayer(layerConfig.id, tileset, 0, 0);
      if (!layer) {
        throw new Error(`Unable to create tilemap layer ${layerConfig.id}`);
      }
      layer.putTilesAt(this.buildLayerData(layerConfig.targetRows, layerConfig.sourceRows), 0, 0);
      layer.setDepth(layerConfig.depth);
      if (layerConfig.alpha !== undefined) {
        layer.setAlpha(layerConfig.alpha);
      }
      if (layerConfig.id === "facade") {
        layer.setTint(0xc2b8b2);
      }
      if (layerConfig.id === "foreground_deco") {
        layer.setTint(0x8b8d96);
      }
      tileLayers.push(layer);
    }

    const props = this.layout.props.map((config) => {
      const image = this.scene.add
        .image(config.x, config.y, config.textureKey)
        .setOrigin(config.originX, config.originY)
        .setScale(config.scale);
      if (config.id.includes("crate")) {
        image.setTint(0x6f8f68).setAlpha(0.9);
      }
      if (config.depthAnchorY !== undefined) {
        depthSystem.register(image, config.depthOffset, () => config.depthAnchorY!, 5);
      } else {
        depthSystem.register(image, config.depthOffset, undefined, 5);
      }
      return image;
    });

    for (const obstacle of this.layout.collisionFootprints) {
      collisionSystem.registerGroundObstacle({
        id: obstacle.id,
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
        color: obstacle.color,
      });
    }

    this.neonTexts = this.layout.neonLabels.map((entry) =>
      this.scene.add
        .text(entry.x, entry.y, entry.text, {
          fontFamily: "monospace",
          fontSize: entry.fontSize,
          color: entry.color,
        })
        .setDepth(58),
    );

    this.runtime = {
      map,
      tileLayers,
      parallaxBands: this.runtimeParallax.map((band) => band.sprite),
      props,
    };
    return this.runtime;
  }

  updateParallax(scrollX: number): void {
    if (!this.runtime) {
      return;
    }
    for (const band of this.runtimeParallax) {
      band.sprite.tilePositionX = Math.floor(scrollX * band.factor);
    }
  }

  destroy(): void {
    if (this.runtime) {
      if (this.depthSystem) {
        for (const prop of this.runtime.props) {
          this.depthSystem.unregister(prop);
        }
      }
      for (const layer of this.runtime.tileLayers) {
        layer.destroy();
      }
      for (const band of this.runtime.parallaxBands) {
        band.destroy();
      }
      for (const prop of this.runtime.props) {
        prop.destroy();
      }
      this.runtime.map.destroy();
      this.runtime = null;
    }

    for (const text of this.neonTexts) {
      text.destroy();
    }
    this.neonTexts = [];
    this.runtimeParallax = [];

    this.backgroundGradient?.destroy();
    this.backgroundGradient = null;
    this.gradeOverlay?.destroy();
    this.gradeOverlay = null;
    this.rainOverlay?.destroy();
    this.rainOverlay = null;
    this.depthSystem = null;
  }

  private buildLayerData(targetRows: number[], sourceRows: number[]): number[][] {
    const layerData: number[][] = Array.from({ length: this.layout.mapHeightTiles }, () =>
      Array.from({ length: this.layout.mapWidthTiles }, () => -1),
    );

    for (let rowIndex = 0; rowIndex < targetRows.length; rowIndex += 1) {
      const targetY = targetRows[rowIndex];
      const sourceY = sourceRows[Math.min(rowIndex, sourceRows.length - 1)];
      const rowBase = sourceY * this.layout.sourceTilesPerRow;
      for (let x = 0; x < this.layout.mapWidthTiles; x += 1) {
        const sourceX = x % this.layout.sourceTilesPerRow;
        layerData[targetY][x] = rowBase + sourceX;
      }
    }

    return layerData;
  }

  private buildBackground(worldWidth: number): void {
    const gradient = this.scene.add.graphics();
    gradient.fillGradientStyle(0x12031d, 0x12031d, 0x061123, 0x061123, 1);
    gradient.fillRect(0, 0, worldWidth, BASE_HEIGHT);
    gradient.setDepth(0);
    this.backgroundGradient = gradient;

    const gradeAlpha = Phaser.Math.Clamp((this.layout.ambientFx.fogAlpha ?? 0.2) * 0.72, 0.04, 0.14);
    const gradeColor = this.layout.ambientFx.colorGrade ?? 0x1a1130;
    const grade = this.scene.add.rectangle(worldWidth * 0.5, BASE_HEIGHT * 0.5, worldWidth, BASE_HEIGHT, gradeColor, gradeAlpha);
    grade.setDepth(3200);
    grade.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.gradeOverlay = grade;

    if (this.layout.ambientFx.rain) {
      const rain = this.scene.add.graphics().setDepth(3210);
      rain.lineStyle(1, 0xcce8ff, 0.11);
      for (let x = 0; x < worldWidth; x += 24) {
        for (let y = -24; y < BASE_HEIGHT; y += 30) {
          rain.lineBetween(x, y, x + 6, y + 12);
        }
      }
      this.rainOverlay = rain;
    }
  }
}
