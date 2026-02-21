import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    if (!this.textures.exists("utility-white")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 2, 2);
      graphics.generateTexture("utility-white", 2, 2);
      graphics.destroy();
    }
    this.game.canvas.style.imageRendering = "pixelated";
    this.game.canvas.style.setProperty("image-rendering", "crisp-edges");
    this.scene.start("PreloadScene");
  }
}
