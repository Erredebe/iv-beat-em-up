import Phaser from "phaser";

interface HudPayload {
  playerHp: number;
  playerMaxHp: number;
  zoneId: string | null;
}

export class HudScene extends Phaser.Scene {
  private hpLabel!: Phaser.GameObjects.Text;
  private zoneLabel!: Phaser.GameObjects.Text;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private maxBarWidth = 140;

  constructor() {
    super("HudScene");
  }

  create(): void {
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.add.rectangle(8, 8, 172, 34, 0x000000, 0.65).setOrigin(0, 0).setScrollFactor(0);
    this.add.rectangle(16, 18, this.maxBarWidth, 8, 0x1f1f1f, 1).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpFill = this.add.rectangle(16, 18, this.maxBarWidth, 8, 0xff3d5a, 1).setOrigin(0, 0.5).setScrollFactor(0);

    this.hpLabel = this.add
      .text(16, 24, "VIDA 120 / 120", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
      })
      .setScrollFactor(0);

    this.zoneLabel = this.add
      .text(16, 4, "ZONA: CALLE", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#96fff2",
      })
      .setScrollFactor(0);

    this.game.events.on("hud:update", this.onHudUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("hud:update", this.onHudUpdate, this);
    });
  }

  private onHudUpdate(payload: HudPayload): void {
    const hpRatio = Phaser.Math.Clamp(payload.playerHp / payload.playerMaxHp, 0, 1);
    this.hpFill.width = this.maxBarWidth * hpRatio;
    this.hpLabel.setText(`VIDA ${payload.playerHp} / ${payload.playerMaxHp}`);
    this.zoneLabel.setText(`ZONA: ${payload.zoneId ?? "LIBRE"}`);
  }
}
