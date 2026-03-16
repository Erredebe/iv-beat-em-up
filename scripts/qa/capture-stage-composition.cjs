const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const BASE_URL = process.env.SPAIN90_URL || "http://127.0.0.1:4173";
const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts", "stage-composition-captures");
const STAGES = ["market_95", "metro_sur", "playa_noche", "puerto_rojo"];
const STAGE_INDEX = new Map(STAGES.map((stageId, index) => [stageId, index]));

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

async function bootToStreet(page, stageId) {
  await page.addInitScript(
    ({ currentStageId }) => {
      window.localStorage.setItem(
        "spain90.session",
        JSON.stringify({
          selectedCharacter: "kastro",
          currentStageId,
          score: 0,
          elapsedMs: 0,
          districtControl: {},
          unlockedDossiers: [],
          storyFlags: {},
        }),
      );
    },
    { currentStageId: stageId },
  );

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const getScenes = () =>
    page.evaluate(() => {
      const game = window.__SPAIN90_GAME;
      if (!game) {
        return [];
      }
      return game.scene.getScenes(true).map((scene) => scene.scene.key);
    });

  await waitFor(async () => (await getScenes()).length > 0, 15000, "Game scenes did not load");
  let scenes = await getScenes();
  if (scenes.includes("TitleScene")) {
    await page.keyboard.press("Enter");
    await waitFor(async () => (await getScenes()).includes("CharacterSelectScene"), 10000, "CharacterSelectScene did not load");
    scenes = await getScenes();
  }
  if (scenes.includes("CharacterSelectScene")) {
    const selectedStageIndex = STAGE_INDEX.get(stageId) ?? 0;
    for (let i = 0; i < selectedStageIndex; i += 1) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(80);
    }
    await page.keyboard.press("Enter");
    await waitFor(async () => {
      const nextScenes = await getScenes();
      return nextScenes.includes("IntroScene") || nextScenes.includes("StreetScene");
    }, 10000, "CharacterSelectScene did not advance");
    scenes = await getScenes();
  }
  if (scenes.includes("IntroScene")) {
    await page.keyboard.press("Space");
  }
  await waitFor(async () => (await getScenes()).includes("StreetScene"), 15000, "StreetScene did not load");
  await page.waitForTimeout(400);
}

async function captureStage(page, stageId) {
  const report = await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const game = window.__SPAIN90_GAME;
    const street = game.scene.getScenes(true).find((scene) => scene.scene.key === "StreetScene");
    if (!street) {
      throw new Error("Missing StreetScene instance");
    }

    street.controlsHintVisible = false;
    street.controlsHintUntil = 0;
    street.zoneMessage = null;
    street.zoneMessageUntil = 0;
    street.player.setVelocity?.(0, 0);

    await wait(250);

    const worldWidth = street.stageWorldWidth;
    const cameraWidth = street.cameras.main.width;
    const shots = [
      { id: "left", x: cameraWidth * 0.5 },
      { id: "mid", x: worldWidth * 0.5 },
      { id: "right", x: Math.max(cameraWidth * 0.5, worldWidth - cameraWidth * 0.5) },
    ];

    const results = [];
    for (const shot of shots) {
      const clampedX = Math.max(cameraWidth * 0.5, Math.min(worldWidth - cameraWidth * 0.5, shot.x));
      street.player.setPosition(clampedX - 72, street.player.y);
      street.player.syncExternalPosition(street.time.now);
      street.cameras.main.centerOn(clampedX, street.cameras.main.midPoint.y + street.stageBundle.layout.cameraYOffset);
      await wait(180);
      results.push({
        id: shot.id,
        cameraX: street.cameras.main.scrollX,
        playerX: street.player.x,
        playerY: street.player.y,
        enemyCount: street.enemies.length,
      });
    }

    return {
      stageId: street.stageBundle.id,
      shots: results,
    };
  });

  for (const shot of report.shots) {
    await page.evaluate(({ cameraX }) => {
      const game = window.__SPAIN90_GAME;
      const street = game.scene.getScenes(true).find((scene) => scene.scene.key === "StreetScene");
      street.controlsHintVisible = false;
      street.controlsHintUntil = 0;
      street.zoneMessage = null;
      street.zoneMessageUntil = 0;
      street.cameras.main.setScroll(cameraX, street.cameras.main.scrollY);
    }, { cameraX: shot.cameraX });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${stageId}-${shot.id}.png`) });
  }

  return report;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[console:error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });

  const reports = [];
  for (const stageId of STAGES) {
    await bootToStreet(page, stageId);
    reports.push(await captureStage(page, stageId));
    await page.evaluate(() => window.localStorage.clear());
  }

  await browser.close();

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const reportPath = path.join(OUTPUT_DIR, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ baseUrl: BASE_URL, reports }, null, 2));
  console.log(reportPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
