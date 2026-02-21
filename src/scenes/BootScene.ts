import Phaser from "phaser";
import { generatePlaceholderTextures } from "../assets/placeholders/generateTextures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    generatePlaceholderTextures(this);
    this.game.canvas.style.imageRendering = "pixelated";
    this.game.canvas.style.setProperty("image-rendering", "crisp-edges");
    this.scene.start("PreloadScene");
  }
}

