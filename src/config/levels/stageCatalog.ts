import { campaignStageOrder, type StageId } from "../gameplay/campaign";
import { market95Layout, market95Spawns } from "./market95";
import { metroSurLayout, metroSurSpawns } from "./metroSur";
import { playaNocheLayout, playaNocheSpawns } from "./playaNoche";
import { puertoRojoLayout, puertoRojoSpawns } from "./puertoRojo";
import type { StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";
import type { DistrictId } from "../lore/districts";
import type { StoryBeatId } from "../lore/storyBeats";

export interface StageBundle {
  id: StageId;
  displayName: string;
  timeLimitSec: number;
  layout: StageLayoutConfig;
  spawns: StageSpawnZoneConfig[];
  theme: "theme_a" | "theme_b";
  districtId: DistrictId;
  storyBeatIds: StoryBeatId[];
}

export const stageCatalog: Record<StageId, StageBundle> = {
  market_95: {
    id: "market_95",
    displayName: market95Layout.displayName,
    timeLimitSec: 140,
    layout: market95Layout,
    spawns: market95Spawns,
    theme: "theme_a",
    districtId: "mercado_sur",
    storyBeatIds: ["market_crackdown"],
  },
  metro_sur: {
    id: "metro_sur",
    displayName: metroSurLayout.displayName,
    timeLimitSec: 150,
    layout: metroSurLayout,
    spawns: metroSurSpawns,
    theme: "theme_b",
    districtId: "metro_sur",
    storyBeatIds: ["metro_blackout"],
  },
  playa_noche: {
    id: "playa_noche",
    displayName: playaNocheLayout.displayName,
    timeLimitSec: 150,
    layout: playaNocheLayout,
    spawns: playaNocheSpawns,
    theme: "theme_a",
    districtId: "malecon_norte",
    storyBeatIds: ["coast_pressure"],
  },
  puerto_rojo: {
    id: "puerto_rojo",
    displayName: puertoRojoLayout.displayName,
    timeLimitSec: 180,
    layout: puertoRojoLayout,
    spawns: puertoRojoSpawns,
    theme: "theme_b",
    districtId: "puerto_rojo",
    storyBeatIds: ["harbor_showdown"],
  },
};

export function getStageBundle(stageId: StageId): StageBundle {
  return stageCatalog[stageId];
}

export function getFirstStageBundle(): StageBundle {
  return stageCatalog[campaignStageOrder[0]];
}
