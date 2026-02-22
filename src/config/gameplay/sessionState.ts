import { campaignStageOrder, type StageId } from "./campaign";
import type { CharacterId } from "./playableRoster";

export interface SessionState {
  selectedCharacter: CharacterId;
  currentStageId: StageId;
  score: number;
  elapsedMs: number;
}

const STORAGE_KEY = "spain90.session";

const DEFAULT_SESSION: SessionState = {
  selectedCharacter: "boxeador",
  currentStageId: campaignStageOrder[0],
  score: 0,
  elapsedMs: 0,
};

let inMemoryState: SessionState = { ...DEFAULT_SESSION };

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
      selectedCharacter: character === "boxeador" || character === "veloz" || character === "tecnico"
        ? character
        : DEFAULT_SESSION.selectedCharacter,
      currentStageId: campaignStageOrder.includes(stage as StageId)
        ? (stage as StageId)
        : DEFAULT_SESSION.currentStageId,
      score: Number.isFinite(parsed.score) ? Math.max(0, Number(parsed.score)) : DEFAULT_SESSION.score,
      elapsedMs: Number.isFinite(parsed.elapsedMs) ? Math.max(0, Number(parsed.elapsedMs)) : DEFAULT_SESSION.elapsedMs,
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
  const next = {
    ...loadSessionState(),
    ...partial,
  };
  persist(next);
  return { ...next };
}

export function resetSessionState(): SessionState {
  persist({ ...DEFAULT_SESSION });
  return { ...DEFAULT_SESSION };
}
