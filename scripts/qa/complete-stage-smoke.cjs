const { chromium } = require("playwright");

const BASE_URL = process.env.SPAIN90_URL || "http://127.0.0.1:4173";

async function waitFor(fn, timeoutMs, message) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await fn();
    if (value) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error") {
      errors.push(`[console:${type}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const getScenes = () => page.evaluate(() => {
    const game = window.__SPAIN90_GAME;
    if (!game) {
      return [];
    }
    return game.scene.getScenes(true).map((scene) => scene.scene.key);
  });

  await waitFor(async () => (await getScenes()).includes("TitleScene"), 15000, "TitleScene did not load");
  await page.keyboard.press("Enter");
  await waitFor(async () => (await getScenes()).includes("CharacterSelectScene"), 10000, "CharacterSelectScene did not load");
  await page.keyboard.press("Enter");
  await waitFor(async () => (await getScenes()).includes("IntroScene"), 10000, "IntroScene did not load");
  await page.keyboard.press("Space");
  await waitFor(async () => (await getScenes()).includes("StreetScene"), 15000, "StreetScene did not load");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("KeyZ");
  await page.waitForTimeout(200);
  await page.keyboard.press("KeyX");
  await page.waitForTimeout(250);

  const result = await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const waitForInPage = async (fn, timeoutMs, message) => {
      const startedAt = Date.now();
      while (Date.now() - startedAt < timeoutMs) {
        const value = await fn();
        if (value) {
          return value;
        }
        await wait(100);
      }
      throw new Error(message);
    };
    const game = window.__SPAIN90_GAME;
    if (!game) {
      throw new Error("Missing game instance");
    }

    const getStreet = () => game.scene.getScenes(true).find((scene) => scene.scene.key === "StreetScene");
    const street = getStreet();
    if (!street) {
      throw new Error("Missing StreetScene instance");
    }

    const startingStageId = street.stageBundle.id;
    const visitedZones = [];

    street.player.hp = street.player.maxHp;

    const ensurePlayerAt = (x) => {
      const y = street.player.y;
      street.player.setPosition(x, y);
      street.player.syncExternalPosition(street.time.now);
    };

    for (const zoneConfig of street.stageBundle.spawns) {
      visitedZones.push(zoneConfig.id);
      ensurePlayerAt(zoneConfig.triggerX + 16);
      await wait(400);

      await waitForInPage(
        async () => street.spawnManager.getActiveZoneId() === zoneConfig.id,
        5000,
        `Zone ${zoneConfig.id} did not activate`,
      );

      if (zoneConfig.objective?.type === "break_cache") {
        for (const objectId of zoneConfig.objective.cacheObjectIds ?? []) {
          street.spawnManager.reportCacheObjectDestroyed(objectId);
        }
      }

      await waitForInPage(
        async () => {
          for (const enemy of [...street.enemies]) {
            if (!enemy.isAlive()) {
              continue;
            }
            enemy.applyDamage(
              {
                damage: enemy.maxHp * 4,
                knockbackX: 0,
                causesKnockdown: true,
                iFrameMs: 0,
                hitStunMs: 0,
                knockdownDurationMs: 0,
                sourceX: street.player.x,
              },
              street.time.now,
            );
          }

          if (street.player.hp < street.player.maxHp) {
            street.player.restoreHp(street.player.maxHp);
          }

          return street.spawnManager.getActiveZoneId() === null && street.enemies.length === 0;
        },
        10000,
        `Zone ${zoneConfig.id} did not clear`,
      );
    }

    ensurePlayerAt(street.stageWorldWidth - 40);

    const completion = await waitForInPage(
      async () => {
        const current = getStreet();
        if (!current) {
          return null;
        }
        if (current.stageBundle.id !== startingStageId) {
          return {
            nextStageId: current.stageBundle.id,
            objectiveText: current.getObjectiveText(),
          };
        }
        return null;
      },
      10000,
      `Stage ${startingStageId} did not transition`,
    );

    return {
      startingStageId,
      visitedZones,
      completion,
      finalScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
    };
  });

  await browser.close();

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  console.log(JSON.stringify({ baseUrl: BASE_URL, ...result, errors }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
