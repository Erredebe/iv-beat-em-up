import { campaignStageOrder, type StageId } from "../gameplay/campaign";
import { market95Layout, market95Spawns } from "./market95";
import { metroSurLayout, metroSurSpawns } from "./metroSur";
import { playaNocheLayout, playaNocheSpawns } from "./playaNoche";
import { puertoRojoLayout, puertoRojoSpawns } from "./puertoRojo";
import type { StageLayoutConfig } from "./stageTypes";
import type { StageSpawnZoneConfig } from "./stageSpawnTypes";

export interface StageBundle {
  id: StageId;
  displayName: string;
  timeLimitSec: number;
  layout: StageLayoutConfig;
  spawns: StageSpawnZoneConfig[];
  theme: "theme_a" | "theme_b";
}

export const stageCatalog: Record<StageId, StageBundle> = {
  market_95: {
    id: "market_95",
    displayName: market95Layout.displayName,
    timeLimitSec: 140,
    layout: market95Layout,
    spawns: market95Spawns,
    theme: "theme_a",
  },
  metro_sur: {
    id: "metro_sur",
    displayName: metroSurLayout.displayName,
    timeLimitSec: 150,
    layout: metroSurLayout,
    spawns: metroSurSpawns,
    theme: "theme_b",
  },
  playa_noche: {
    id: "playa_noche",
    displayName: playaNocheLayout.displayName,
    timeLimitSec: 150,
    layout: playaNocheLayout,
    spawns: playaNocheSpawns,
    theme: "theme_a",
  },
  puerto_rojo: {
    id: "puerto_rojo",
    displayName: puertoRojoLayout.displayName,
    timeLimitSec: 180,
    layout: puertoRojoLayout,
    spawns: puertoRojoSpawns,
    theme: "theme_b",
  },
};

export function getStageBundle(stageId: StageId): StageBundle {
  return stageCatalog[stageId];
}

export function getFirstStageBundle(): StageBundle {
  return stageCatalog[campaignStageOrder[0]];
}
