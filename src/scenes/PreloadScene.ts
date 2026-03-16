import Phaser from "phaser";
import { assetManifest, requiredAssetKeys } from "../config/assets/assetManifest";
import { derivedTextureCrops } from "../config/assets/derivedTextureCrops";
import { getUiThemeTokens } from "../config/ui/uiTheme";
import { ANIMATION_CLIP_IDS, ANIMATION_OWNERS, getFighterSpriteSpec } from "../config/visual/fighterSpriteSpecs";
import { createPanel, createSceneBackdrop, createSceneTitle, hexColor } from "../ui/sceneChrome";

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
    const theme = getUiThemeTokens();
    createSceneBackdrop(this, { variant: "loading", includeOrb: true });
    createPanel(this, {
      x: Math.floor(width * 0.5 - 126),
      y: Math.floor(height * 0.5 - 42),
      width: 252,
      height: 84,
      fillColor: hexColor(theme.palette.panelElevated),
      fillAlpha: 0.9,
      borderColor: hexColor(theme.panel.mutedBorder),
      borderAlpha: 0.6,
      borderWidth: 1,
      topAccentColor: hexColor(theme.palette.accentPink),
      topAccentHeight: 2,
    });
    createSceneTitle(this, {
      x: width * 0.5,
      y: height * 0.5 - 34,
      title: "CARGANDO CALLE 1995",
      subtitle: "PREPARANDO ESCENAS, HUD Y ROSTER",
      titleSize: theme.typography.body,
      subtitleSize: theme.typography.caption,
    });
    this.add
      .text(width * 0.5, height * 0.5 + 24, "COMPILANDO PIXEL-ART Y AUDIO", {
        fontFamily: theme.typography.families.uiBody,
        fontSize: theme.typography.caption,
        color: theme.palette.textSecondary,
        stroke: theme.textStroke.light.color,
        strokeThickness: theme.textStroke.light.thickness,
      })
      .setOrigin(0.5);

    const barBg = this.add.rectangle(width * 0.5, height * 0.5 + 2, 188, 10, hexColor(theme.panel.overlayFill), 1).setOrigin(0.5);
    const barFill = this.add.rectangle(width * 0.5 - 92, height * 0.5 + 2, 0, 6, hexColor(theme.palette.accentBlue), 1).setOrigin(0, 0.5);
    this.add.rectangle(width * 0.5, height * 0.5 + 16, 188, 1, hexColor(theme.palette.accentPink), 0.6).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      barFill.width = 184 * value;
      if (value >= 1) {
        barBg.fillColor = hexColor(theme.panel.highlightFill);
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
