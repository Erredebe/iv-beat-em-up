import Phaser from "phaser";
import { assetManifest, requiredAssetKeys } from "../config/assets/assetManifest";
import { derivedTextureCrops } from "../config/assets/derivedTextureCrops";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { ANIMATION_CLIP_IDS, ANIMATION_OWNERS, getFighterSpriteSpec } from "../config/visual/fighterSpriteSpecs";

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
    this.scene.start("TitleScene");
  }

  private createLoadingUi(): void {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x08020f, 1);
    bg.setOrigin(0.5);

    const theme = getUiThemeTokens();
    this.add
      .text(width * 0.5, height * 0.5 - 26, "CARGANDO CALLE 1995", {
        fontFamily: theme.typography.families.uiTitle,
        fontSize: theme.typography.body,
        color: "#f4efff",
        stroke: theme.textStroke.light.color,
        strokeThickness: theme.textStroke.light.thickness,
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
    for (const crop of derivedTextureCrops) {
      this.createCanvasFromImage(crop.sourceKey, crop.targetKey, crop.sx, crop.sy, crop.width, crop.height);
    }
  }

  private validateAssets(): void {
    const missing: string[] = [];
    for (const key of requiredAssetKeys) {
      if (!this.textures.exists(key) && !this.cache.audio.exists(key)) {
        missing.push(key);
      }
    }

    const missingByOwner: string[] = [];
    for (const owner of ANIMATION_OWNERS) {
      const spec = getFighterSpriteSpec(owner);
      for (const clipId of ANIMATION_CLIP_IDS) {
        const textureKey = spec.requiredClips[clipId].textureKey;
        if (!this.textures.exists(textureKey)) {
          missingByOwner.push(`${owner}.${clipId}:${textureKey}`);
        }
      }
    }

    if (missing.length > 0 || missingByOwner.length > 0) {
      const message = [
        missing.length > 0 ? `Missing required assets: ${missing.join(", ")}` : "",
        missingByOwner.length > 0 ? `Missing fighter textures: ${missingByOwner.join(", ")}` : "",
      ]
        .filter((part) => part.length > 0)
        .join(" | ");
      throw new Error(message);
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
