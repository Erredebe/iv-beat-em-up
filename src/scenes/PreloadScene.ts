import Phaser from "phaser";
import { assetManifest, requiredAssetKeys } from "../config/assets/assetManifest";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.createLoadingUi();

    for (const entry of assetManifest) {
      if (entry.type === "image") {
        this.load.image(entry.key, entry.path);
      } else if (entry.type === "spritesheet") {
        this.load.spritesheet(entry.key, entry.path, {
          frameWidth: entry.frameConfig!.frameWidth,
          frameHeight: entry.frameConfig!.frameHeight,
        });
      } else if (entry.type === "audio") {
        this.load.audio(entry.key, entry.path);
      }
    }
  }

  create(): void {
    this.createDerivedTextures();
    this.validateAssets();
    this.scene.start("StreetScene");
    this.scene.launch("HudScene");
  }

  private createLoadingUi(): void {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x08020f, 1);
    bg.setOrigin(0.5);

    this.add
      .text(width * 0.5, height * 0.5 - 26, "CARGANDO CALLE 1995", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f4efff",
      })
      .setOrigin(0.5);

    const barBg = this.add.rectangle(width * 0.5, height * 0.5 + 4, 188, 10, 0x19142a, 1).setOrigin(0.5);
    const barFill = this.add.rectangle(width * 0.5 - 92, height * 0.5 + 4, 0, 6, 0x33b8ff, 1).setOrigin(0, 0.5);
    this.add.rectangle(width * 0.5, height * 0.5 + 24, 188, 1, 0xff4db8, 0.6).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      barFill.width = 184 * value;
      if (value >= 1) {
        barBg.fillColor = 0x20374f;
      }
    });
  }

  private createDerivedTextures(): void {
    this.createCanvasFromImage("street_sheet", "street_clean_tileset", 24, 20, 800, 192);
    this.createCanvasFromImage("street_sheet", "prop_booth", 625, 301, 25, 30);
    this.createCanvasFromImage("street_sheet", "prop_crate", 521, 301, 24, 22);
    this.createCanvasFromImage("police_car_sheet", "prop_car", 6, 71, 53, 26);
    this.createCanvasFromImage("city_far", "city_far_band", 0, 300, 1024, 120);
    this.createCanvasFromImage("city_mid", "city_mid_band", 0, 360, 1024, 120);
    this.createCanvasFromImage("city_close", "city_close_band", 0, 420, 1024, 120);
    this.createCanvasFromImage("street_tileset", "hud_frame", 0, 0, 16, 16);
    this.createCanvasFromImage("street_tileset", "ui_btn", 16, 16, 16, 16);
    this.createCanvasFromImage("street_tileset", "hit_spark", 80, 64, 16, 16);
  }

  private validateAssets(): void {
    const missing: string[] = [];
    for (const key of requiredAssetKeys) {
      if (!this.textures.exists(key) && !this.cache.audio.exists(key)) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Missing required assets: ${missing.join(", ")}`);
    }
  }

  private createCanvasFromImage(
    sourceKey: string,
    targetKey: string,
    sx: number,
    sy: number,
    width: number,
    height: number,
  ): void {
    if (this.textures.exists(targetKey)) {
      return;
    }
    if (!this.textures.exists(sourceKey)) {
      throw new Error(`Unable to derive ${targetKey}: missing source texture ${sourceKey}`);
    }

    const source = this.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
    const texture = this.textures.createCanvas(targetKey, width, height);
    if (!texture) {
      throw new Error(`Unable to create derived texture ${targetKey}`);
    }
    texture.context.imageSmoothingEnabled = false;
    texture.context.drawImage(source, sx, sy, width, height, 0, 0, width, height);
    texture.refresh();
  }
}
