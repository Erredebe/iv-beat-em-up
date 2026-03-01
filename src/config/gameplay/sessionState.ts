import { campaignStageOrder, type StageId } from "./campaign";
import type { CharacterId } from "./playableRoster";
import type { DistrictId } from "../lore/districts";

export type DistrictControlState = "enemy" | "contested" | "allied";

export interface SessionState {
  selectedCharacter: CharacterId;
  currentStageId: StageId;
  score: number;
  elapsedMs: number;
  districtControl: Partial<Record<DistrictId, DistrictControlState>>;
  unlockedDossiers: string[];
  storyFlags: Record<string, boolean>;
}

const STORAGE_KEY = "spain90.session";

const DEFAULT_SESSION: SessionState = {
  selectedCharacter: "kastro",
  currentStageId: campaignStageOrder[0],
  score: 0,
  elapsedMs: 0,
  districtControl: {},
  unlockedDossiers: [],
  storyFlags: {},
};

let inMemoryState: SessionState = { ...DEFAULT_SESSION };

export function normalizeSelectedCharacter(value: unknown): CharacterId {
  if (value === "kastro" || value === "marina" || value === "meneillos") {
    return value;
  }
  if (value === "boxeador") {
    return "kastro";
  }
  if (value === "veloz") {
    return "marina";
  }
  if (value === "tecnico") {
    return "meneillos";
  }
  return DEFAULT_SESSION.selectedCharacter;
}

export function loadSessionState(): SessionState {
  if (typeof window === "undefined") {
    return { ...inMemoryState };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...inMemoryState };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    const stage = parsed.currentStageId;
    const character = parsed.selectedCharacter;
    const next: SessionState = {
      selectedCharacter: normalizeSelectedCharacter(character),
      currentStageId: campaignStageOrder.includes(stage as StageId)
        ? (stage as StageId)
        : DEFAULT_SESSION.currentStageId,
      score: Number.isFinite(parsed.score) ? Math.max(0, Number(parsed.score)) : DEFAULT_SESSION.score,
      elapsedMs: Number.isFinite(parsed.elapsedMs) ? Math.max(0, Number(parsed.elapsedMs)) : DEFAULT_SESSION.elapsedMs,
      districtControl: parseDistrictControl(parsed.districtControl),
      unlockedDossiers: Array.isArray(parsed.unlockedDossiers)
        ? parsed.unlockedDossiers.filter((entry): entry is string => typeof entry === "string")
        : [],
      storyFlags: parseStoryFlags(parsed.storyFlags),
    };
    inMemoryState = next;
    return { ...next };
  } catch {
    return { ...inMemoryState };
  }
}

function persist(state: SessionState): void {
  inMemoryState = { ...state };
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryState));
}

export function getSessionState(): SessionState {
  return { ...loadSessionState() };
}

export function updateSessionState(partial: Partial<SessionState>): SessionState {
  const current = loadSessionState();
  const next = {
    ...current,
    ...partial,
    districtControl: partial.districtControl ?? current.districtControl,
    unlockedDossiers: partial.unlockedDossiers ?? current.unlockedDossiers,
    storyFlags: partial.storyFlags ?? current.storyFlags,
  };
  persist(next);
  return { ...next };
}

export function resetSessionState(): SessionState {
  persist({ ...DEFAULT_SESSION });
  return { ...DEFAULT_SESSION };
}

function parseStoryFlags(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object") {
    return {};
  }
  const flags = {} as Record<string, boolean>;
  for (const [key, flag] of Object.entries(value as Record<string, unknown>)) {
    if (typeof flag === "boolean") {
      flags[key] = flag;
    }
  }
  return flags;
}

function parseDistrictControl(value: unknown): Partial<Record<DistrictId, DistrictControlState>> {
  if (!value || typeof value !== "object") {
    return {};
  }
  const control = {} as Partial<Record<DistrictId, DistrictControlState>>;
  for (const [districtId, state] of Object.entries(value as Record<string, unknown>)) {
    if (
      (districtId === "mercado_sur" || districtId === "metro_sur" || districtId === "malecon_norte" || districtId === "puerto_rojo") &&
      (state === "enemy" || state === "contested" || state === "allied")
    ) {
      control[districtId] = state;
    }
  }
  return control;
}
