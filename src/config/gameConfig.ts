import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "./constants";
import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { TitleScene } from "../scenes/TitleScene";
import { CharacterSelectScene } from "../scenes/CharacterSelectScene";
import { IntroScene } from "../scenes/IntroScene";
import { StreetScene } from "../scenes/StreetScene";
import { HudScene } from "../ui/HudScene";

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    parent: "game-root",
    backgroundColor: "#120019",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    fps: {
      target: 60,
      forceSetTimeOut: true,
    },
    scene: [BootScene, PreloadScene, TitleScene, CharacterSelectScene, IntroScene, StreetScene, HudScene],
  };
}
