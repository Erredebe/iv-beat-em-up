import Phaser from "phaser";
import "./style.css";
import { BASE_HEIGHT, BASE_WIDTH } from "./config/constants";
import { createGameConfig } from "./config/gameConfig";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("Missing #app root.");
}
root.innerHTML = `<div id="game-root" aria-label="Spain 90 Beat Em Up"></div>`;

const game = new Phaser.Game(createGameConfig());
(window as unknown as { __SPAIN90_GAME?: Phaser.Game }).__SPAIN90_GAME = game;

function applyIntegerScale(): void {
  const canvas = game.canvas;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const scale = Math.max(1, Math.floor(Math.min(viewportWidth / BASE_WIDTH, viewportHeight / BASE_HEIGHT)));
  const displayWidth = BASE_WIDTH * scale;
  const displayHeight = BASE_HEIGHT * scale;

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  canvas.style.position = "absolute";
  canvas.style.left = `${Math.floor((viewportWidth - displayWidth) * 0.5)}px`;
  canvas.style.top = `${Math.floor((viewportHeight - displayHeight) * 0.5)}px`;
  canvas.style.imageRendering = "pixelated";
}

window.addEventListener("resize", applyIntegerScale);
setTimeout(applyIntegerScale, 0);
