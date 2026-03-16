const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const BASE_URL = process.env.SPAIN90_URL || "http://127.0.0.1:4173";
const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts", "stage-scale-captures");
const STAGES = ["market_95", "metro_sur", "playa_noche", "puerto_rojo"];
const CHARACTER_ID = "kastro";
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
    ({ selectedCharacter, currentStageId }) => {
      window.localStorage.setItem(
        "spain90.session",
        JSON.stringify({
          selectedCharacter,
          currentStageId,
          score: 0,
          elapsedMs: 0,
          districtControl: {},
          unlockedDossiers: [],
          storyFlags: {},
        }),
      );
    },
    { selectedCharacter: CHARACTER_ID, currentStageId: stageId },
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
    if (!game) {
      throw new Error("Missing game instance");
    }

    const street = game.scene.getScenes(true).find((scene) => scene.scene.key === "StreetScene");
    if (!street) {
      throw new Error("Missing StreetScene instance");
    }

    street.controlsHintVisible = false;
    street.controlsHintUntil = 0;

    await wait(250);

    const player = street.player;
    const playerMetrics = {
      spriteDisplayWidth: player.sprite.displayWidth,
      spriteDisplayHeight: player.sprite.displayHeight,
    };

    const focusObjects = street.stageRenderer
      .build
      ? street.stageRenderer.runtime?.objects ?? []
      : street.stageRenderer.runtime?.objects ?? [];

    const candidates = focusObjects
      .filter((entry) => ["prop_booth_front", "prop_container", "prop_container_pair", "prop_dumpster_open"].includes(entry.config.visual.textureKey))
      .map((entry) => ({
        id: entry.config.id,
        textureKey: entry.config.visual.textureKey,
        x: entry.sprite.x,
        y: entry.sprite.y,
        displayWidth: entry.sprite.displayWidth,
        displayHeight: entry.sprite.displayHeight,
      }));

    const shots = [];
    for (const candidate of candidates) {
      player.setPosition(candidate.x - 70, player.y);
      player.syncExternalPosition(street.time.now);
      street.cameras.main.centerOn(candidate.x, street.cameras.main.midPoint.y + street.stageBundle.layout.cameraYOffset);
      await wait(180);
      shots.push({
        id: candidate.id,
        textureKey: candidate.textureKey,
        displayWidth: candidate.displayWidth,
        displayHeight: candidate.displayHeight,
        playerSpriteDisplayHeight: player.sprite.displayHeight,
        ratioToPlayerHeight: candidate.displayHeight / Math.max(1, player.sprite.displayHeight),
      });
    }

    return {
      stageId: street.stageBundle.id,
      playerMetrics,
      shots,
    };
  });

  for (const shot of report.shots) {
    await page.evaluate(({ id }) => {
      const game = window.__SPAIN90_GAME;
      const street = game.scene.getScenes(true).find((scene) => scene.scene.key === "StreetScene");
      street.controlsHintVisible = false;
      street.controlsHintUntil = 0;
      const entry = street.stageRenderer.runtime.objects.find((object) => object.config.id === id);
      street.player.setPosition(entry.sprite.x - 70, street.player.y);
      street.player.syncExternalPosition(street.time.now);
      street.cameras.main.centerOn(entry.sprite.x, street.cameras.main.midPoint.y + street.stageBundle.layout.cameraYOffset);
    }, { id: shot.id });
    await page.waitForTimeout(220);
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
