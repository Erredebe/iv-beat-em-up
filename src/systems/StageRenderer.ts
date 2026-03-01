import Phaser from "phaser";
import { BASE_HEIGHT } from "../config/constants";
import { featureFlags } from "../config/features";
import {
  isBreakableStageObject,
  resolveStageObjectCollisionFootprint,
  type StageCollisionFootprint,
  type StageLayoutConfig,
  type StageObjectDefinition,
} from "../config/levels/stageTypes";
import { depthLayers, depthPriorities, resolveBreakableDynamicY, resolveStagePropDynamicY } from "../config/visual/depthLayers";
import { resolveScaleReference } from "../config/visual/scaleSystem";
import type { CollisionSystem, GroundObstacle } from "./CollisionSystem";
import type { DepthSystem } from "./DepthSystem";

interface RuntimeParallaxBand {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export interface StageObjectRuntime {
  config: StageObjectDefinition;
  sprite: Phaser.GameObjects.Image;
  obstacle: GroundObstacle | null;
  collisionFootprint: StageCollisionFootprint | null;
}

export interface StageRuntime {
  map: Phaser.Tilemaps.Tilemap;
  tileLayers: Phaser.Tilemaps.TilemapLayer[];
  parallaxBands: Phaser.GameObjects.TileSprite[];
  objects: StageObjectRuntime[];
}

export class StageRenderer {
  private readonly scene: Phaser.Scene;
  private readonly layout: StageLayoutConfig;
  private depthSystem: DepthSystem | null = null;
  private runtime: StageRuntime | null = null;
  private runtimeParallax: RuntimeParallaxBand[] = [];
  private backgroundGradient: Phaser.GameObjects.Graphics | null = null;
  private gradeOverlay: Phaser.GameObjects.Rectangle | null = null;
  private fogOverlay: Phaser.GameObjects.Rectangle | null = null;
  private neonTexts: Phaser.GameObjects.Text[] = [];
  private rainOverlay: Phaser.GameObjects.Graphics | null = null;
  private rainDrift = 0;

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
      sprite.setTileScale(0.5, 0.5);
      if (band.id === "skyline_far") {
        sprite.setTint(this.layout.visualProfile.foregroundAccents.skylineFar);
      } else if (band.id === "skyline_mid") {
        sprite.setTint(this.layout.visualProfile.foregroundAccents.skylineMid);
      } else {
        sprite.setTint(this.layout.visualProfile.foregroundAccents.skylineClose);
      }
      return {
        sprite,
        factor: band.scrollFactor,
      };
    });

    const map = this.scene.make.tilemap({
      tileWidth: this.layout.tileSize * 2,
      tileHeight: this.layout.tileSize * 2,
      width: this.layout.mapWidthTiles,
      height: this.layout.mapHeightTiles,
    });

    const tileset = map.addTilesetImage(this.layout.tilesetKey, this.layout.tilesetKey, this.layout.tileSize * 2, this.layout.tileSize * 2, 0, 0);
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
      layer.setScale(0.5);
      if (layerConfig.alpha !== undefined) {
        layer.setAlpha(layerConfig.alpha);
      }
      if (layerConfig.id === "facade") {
        layer.setTint(this.layout.visualProfile.foregroundAccents.facade);
      }
      if (layerConfig.id === "foreground_deco") {
        layer.setTint(this.layout.visualProfile.foregroundAccents.foregroundDeco);
      }
      tileLayers.push(layer);
    }

    const objects = this.layout.objects.map((config) => {
      const scale = resolveScaleReference({
        scaleTier: config.visual.scaleTier,
        spriteSpecId: config.visual.spriteSpecId,
      });
      const image = this.scene.add
        .image(config.transform.x, config.transform.y, config.visual.textureKey)
        .setOrigin(config.transform.originX, config.transform.originY)
        .setScale(scale);

      if (isBreakableStageObject(config)) {
        image.setTint(config.behavior.intactTint ?? 0xb8c7d2);
      } else if (config.id.includes("crate") || config.id.includes("barrel") || config.id.includes("table")) {
        image
          .setTint(this.layout.visualProfile.foregroundAccents.crateTint)
          .setAlpha(this.layout.visualProfile.foregroundAccents.crateAlpha);
      }

      if (isBreakableStageObject(config)) {
        depthSystem.register(image, {
          layer: "BREAKABLE",
          dynamicY: () => resolveBreakableDynamicY(image.y),
          priority: depthPriorities.BREAKABLE,
        });
      } else {
        // Static/decorative props may use virtual feet anchors for deterministic sorting.
        depthSystem.register(image, {
          layer: "STAGE_PROP",
          dynamicY: () =>
            resolveStagePropDynamicY(image.y, config.transform.depthAnchorY, config.transform.depthOffset ?? 0),
          priority: depthPriorities.STAGE_PROP,
        });
      }

      const collisionFootprint = resolveStageObjectCollisionFootprint(config, {
        width: image.displayWidth,
        height: image.displayHeight,
      });
      const obstacle = collisionFootprint
        ? collisionSystem.registerGroundObstacle({
            id: collisionFootprint.id,
            x: collisionFootprint.x,
            y: collisionFootprint.y,
            width: collisionFootprint.width,
            height: collisionFootprint.height,
            color: collisionFootprint.color,
          })
        : null;

      return {
        config,
        sprite: image,
        obstacle,
        collisionFootprint,
      };
    });

    this.neonTexts = this.layout.neonLabels.map((entry) =>
      this.scene.add
        .text(entry.x, entry.y, entry.text, {
          fontFamily: "monospace",
          fontSize: entry.fontSize,
          color: entry.color,
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setDepth(depthLayers.STAGE_NEON)
        .setAlpha(Phaser.Math.Clamp(this.layout.visualProfile.neonIntensity, 0.55, 1)),
    );

    this.runtime = {
      map,
      tileLayers,
      parallaxBands: this.runtimeParallax.map((band) => band.sprite),
      objects,
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

    if (featureFlags.visualPolishV3) {
      const pulseHz = Math.max(0.2, this.layout.visualProfile.neonPulseHz);
      const pulseAlpha = Phaser.Math.Clamp(
        this.layout.visualProfile.neonIntensity * (0.82 + 0.18 * Math.sin((this.scene.time.now / 1000) * Math.PI * pulseHz)),
        0.45,
        1,
      );
      for (const neonText of this.neonTexts) {
        neonText.setAlpha(pulseAlpha);
      }
    }

    if (this.rainOverlay && this.layout.visualProfile.rainIntensity > 0.01) {
      this.rainDrift += this.layout.visualProfile.rainDriftSpeed;
      this.rainOverlay.setX(-((this.rainDrift * 0.6) % 24));
    }
  }

  destroy(): void {
    if (this.runtime) {
      if (this.depthSystem) {
        for (const object of this.runtime.objects) {
          this.depthSystem.unregister(object.sprite);
        }
      }
      for (const layer of this.runtime.tileLayers) {
        layer.destroy();
      }
      for (const band of this.runtime.parallaxBands) {
        band.destroy();
      }
      for (const object of this.runtime.objects) {
        object.sprite.destroy();
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
    this.fogOverlay?.destroy();
    this.fogOverlay = null;
    this.rainOverlay?.destroy();
    this.rainOverlay = null;
    this.rainDrift = 0;
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
    const baseGradient = this.layout.visualProfile.baseGradient;
    gradient.fillGradientStyle(baseGradient.topColor, baseGradient.topColor, baseGradient.bottomColor, baseGradient.bottomColor, 1);
    gradient.fillRect(0, 0, worldWidth, BASE_HEIGHT);
    gradient.setDepth(depthLayers.BACKGROUND);
    this.backgroundGradient = gradient;

    const gradeConfig = this.layout.visualProfile.colorGrade;
    const grade = this.scene.add.rectangle(
      worldWidth * 0.5,
      BASE_HEIGHT * 0.5,
      worldWidth,
      BASE_HEIGHT,
      gradeConfig.color,
      Phaser.Math.Clamp(gradeConfig.alpha, 0.03, 0.13),
    );
    grade.setDepth(depthLayers.STAGE_COLOR_GRADE);
    grade.setBlendMode(this.resolveBlendMode(this.layout.visualProfile.gradeBlendMode));
    this.gradeOverlay = grade;

    if (featureFlags.visualPolishV3) {
      const fog = this.scene.add.rectangle(
        worldWidth * 0.5,
        BASE_HEIGHT * 0.5,
        worldWidth,
        BASE_HEIGHT,
        0xc8d9ff,
        Phaser.Math.Clamp(this.layout.visualProfile.fogAlpha, 0, 0.22),
      );
      fog.setDepth(depthLayers.STAGE_COLOR_GRADE + 0.4);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);
      this.fogOverlay = fog;
    }

    const rainIntensity = Phaser.Math.Clamp(this.layout.visualProfile.rainIntensity, 0, 1);
    if (rainIntensity > 0.01) {
      const rain = this.scene.add.graphics().setDepth(depthLayers.STAGE_RAIN);
      rain.lineStyle(1, 0xcce8ff, 0.04 + rainIntensity * 0.09);
      for (let x = 0; x < worldWidth; x += 24) {
        for (let y = -24; y < BASE_HEIGHT; y += 30) {
          rain.lineBetween(x, y, x + 6, y + 12);
        }
      }
      this.rainOverlay = rain;
    }
  }

  private resolveBlendMode(mode: "multiply" | "screen" | "overlay"): Phaser.BlendModes {
    if (mode === "screen") {
      return Phaser.BlendModes.SCREEN;
    }
    if (mode === "overlay") {
      return Phaser.BlendModes.OVERLAY;
    }
    return Phaser.BlendModes.MULTIPLY;
  }
}
