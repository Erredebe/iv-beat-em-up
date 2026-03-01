import type { CharacterId } from "../config/gameplay/playableRoster";
import type { StageBundle } from "../config/levels/stageCatalog";
import { characterBarks } from "../config/lore/characterBarks";
import { storyBeatCatalog } from "../config/lore/storyBeats";

interface RuntimeRadioMessage {
  text: string;
  until: number;
}

export class NarrativeDirector {
  private readonly stageBundle: StageBundle;
  private readonly characterId: CharacterId;
  private readonly beat = this.resolveBeat();
  private readonly queue: RuntimeRadioMessage[] = [];

  constructor(stageBundle: StageBundle, characterId: CharacterId) {
    this.stageBundle = stageBundle;
    this.characterId = characterId;
  }

  onStageStart(nowMs: number): void {
    if (this.beat) {
      this.push(this.beat.radioBriefing, nowMs, 3600);
    }
    this.push(this.pickBark("stage_start"), nowMs, 2400);
  }

  onZoneLock(nowMs: number): void {
    this.push(this.pickBark("zone_lock"), nowMs, 2000);
  }

  onZoneCleared(nowMs: number): void {
    this.push(this.pickBark("zone_clear"), nowMs, 2000);
  }

  onSpecialUsed(nowMs: number): void {
    this.push(this.pickBark("special"), nowMs, 1200);
  }

  onStageCleared(nowMs: number): void {
    if (!this.beat) {
      return;
    }
    this.push(this.beat.clearLine, nowMs, 3200);
  }

  getActiveRadioMessage(nowMs: number): string | null {
    this.prune(nowMs);
    const active = this.queue[0];
    return active?.text ?? null;
  }

  getDebriefLine(): string | null {
    return this.beat?.clearLine ?? null;
  }

  private resolveBeat() {
    const firstBeatId = this.stageBundle.storyBeatIds[0];
    if (!firstBeatId) {
      return null;
    }
    return storyBeatCatalog[firstBeatId] ?? null;
  }

  private push(text: string, nowMs: number, ttlMs: number): void {
    if (!text.trim()) {
      return;
    }
    this.queue.unshift({
      text,
      until: nowMs + ttlMs,
    });
    if (this.queue.length > 5) {
      this.queue.length = 5;
    }
  }

  private prune(nowMs: number): void {
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      if (nowMs >= this.queue[i].until) {
        this.queue.splice(i, 1);
      }
    }
  }

  private pickBark(eventId: "stage_start" | "zone_lock" | "zone_clear" | "special"): string {
    const set = characterBarks[this.characterId];
    const pool = set[eventId];
    return pool[Math.floor(Math.random() * pool.length)] ?? "";
  }
}
