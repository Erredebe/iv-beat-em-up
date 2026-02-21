import Phaser from "phaser";

function makeTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.add.graphics({ x: 0, y: 0 });
  graphics.setVisible(false);
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  makeTexture(scene, "pixel", 1, 1, (graphics) => {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 1, 1);
  });

  makeTexture(scene, "shadow", 32, 10, (graphics) => {
    graphics.fillStyle(0x111111, 1);
    graphics.fillEllipse(16, 5, 28, 8);
  });

  makeTexture(scene, "fighter-player", 28, 44, (graphics) => {
    graphics.fillStyle(0x11a8ff, 1);
    graphics.fillRect(8, 8, 12, 24);
    graphics.fillStyle(0xf5d7b2, 1);
    graphics.fillRect(9, 0, 10, 9);
    graphics.fillStyle(0x012b4d, 1);
    graphics.fillRect(8, 32, 12, 12);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(7, 17, 2, 4);
    graphics.fillRect(19, 17, 2, 4);
  });

  makeTexture(scene, "fighter-enemy", 28, 44, (graphics) => {
    graphics.fillStyle(0xff9955, 1);
    graphics.fillRect(8, 8, 12, 24);
    graphics.fillStyle(0xe8d0a4, 1);
    graphics.fillRect(9, 0, 10, 9);
    graphics.fillStyle(0x7a2d00, 1);
    graphics.fillRect(8, 32, 12, 12);
    graphics.fillStyle(0x2b1500, 1);
    graphics.fillRect(7, 15, 14, 4);
  });

  makeTexture(scene, "prop-booth", 48, 94, (graphics) => {
    graphics.fillStyle(0x00b6ff, 1);
    graphics.fillRect(0, 0, 48, 94);
    graphics.fillStyle(0x023549, 1);
    graphics.fillRect(4, 12, 40, 76);
    graphics.fillStyle(0x66dcff, 1);
    graphics.fillRect(6, 14, 36, 18);
    graphics.fillStyle(0x225566, 1);
    graphics.fillRect(6, 35, 36, 50);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(16, 3, 16, 7);
  });

  makeTexture(scene, "prop-seat", 86, 38, (graphics) => {
    graphics.fillStyle(0xd8324f, 1);
    graphics.fillRect(2, 14, 82, 20);
    graphics.fillStyle(0x6f1320, 1);
    graphics.fillRect(10, 8, 66, 10);
    graphics.fillStyle(0x5fc0d6, 1);
    graphics.fillRect(22, 10, 40, 8);
    graphics.fillStyle(0x0c0c0c, 1);
    graphics.fillRect(12, 28, 14, 10);
    graphics.fillRect(60, 28, 14, 10);
    graphics.fillStyle(0xeebf40, 1);
    graphics.fillRect(2, 18, 4, 7);
    graphics.fillRect(80, 18, 4, 7);
  });
}
