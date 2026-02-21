import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  create(): void {
    this.add
      .text(this.scale.width * 0.5, this.scale.height * 0.5, "Cargando calle 1995...", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#d9f8ff",
      })
      .setOrigin(0.5);

    this.time.delayedCall(120, () => {
      this.scene.start("StreetScene");
      this.scene.launch("HudScene");
    });
  }
}

