import type { PlayableCharacterProfile } from "../../config/gameplay/playableRoster";
import type {
  HudBindingHints,
  HudObjectiveProgressPayload,
  HudPayload,
  HudTargetEnemyPayload,
  HudThreatLevel,
  HudVisibleEnemyPayload,
} from "../../config/ui/hudPayload";
import type { EnemyBasic } from "../../entities/EnemyBasic";
import type { Player } from "../../entities/Player";

interface HudCameraSnapshot {
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
  zoom: number;
}

export interface StreetHudPayloadInput {
  nowMs: number;
  camera: HudCameraSnapshot;
  player: Player;
  selectedCharacter: Pick<PlayableCharacterProfile, "displayName" | "portraitKey">;
  enemies: readonly EnemyBasic[];
  score: number;
  stageName: string;
  stageStartedAt: number;
  stageTimeLimitMs: number;
  zoneId: string | null;
  targetEnemy: HudTargetEnemyPayload | null;
  controlsHintVisible: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  zoneMessage: string | null;
  objectiveText: string;
  objectiveProgress: HudObjectiveProgressPayload | null;
  threatLevel: HudThreatLevel;
  radioMessage: string | null;
  bindingHints: HudBindingHints;
}

export function projectWorldToHud(
  camera: HudCameraSnapshot,
  worldX: number,
  worldY: number,
): Pick<HudVisibleEnemyPayload, "x" | "y"> {
  return {
    x: (worldX - camera.scrollX) * camera.zoom,
    y: (worldY - camera.scrollY) * camera.zoom,
  };
}

function resolveVisibleEnemies(camera: HudCameraSnapshot, enemies: readonly EnemyBasic[]): HudVisibleEnemyPayload[] {
  const visibleWorldWidth = camera.width / Math.max(0.0001, camera.zoom);
  return enemies
    .filter((enemy) => enemy.isAlive() && enemy.x >= camera.scrollX - 20 && enemy.x <= camera.scrollX + visibleWorldWidth + 20)
    .map((enemy) => {
      const projected = projectWorldToHud(camera, enemy.x, enemy.y - 82);
      return {
        id: enemy.id,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        x: projected.x,
        y: projected.y,
      };
    });
}

export function buildStreetHudPayload(input: StreetHudPayloadInput): HudPayload {
  const stageElapsed = input.nowMs - input.stageStartedAt;
  const timeRemainingSec = Math.max(0, Math.ceil((input.stageTimeLimitMs - stageElapsed) / 1000));

  return {
    playerHp: input.player.hp,
    playerMaxHp: input.player.maxHp,
    playerName: input.selectedCharacter.displayName,
    playerPortraitKey: input.selectedCharacter.portraitKey,
    score: input.score,
    timeRemainingSec,
    specialCooldownRatio: input.player.getSpecialCooldownRatio(input.nowMs),
    stageName: input.stageName,
    zoneId: input.zoneId,
    targetEnemy: input.targetEnemy,
    visibleEnemies: resolveVisibleEnemies(input.camera, input.enemies),
    controlsHintVisible: input.controlsHintVisible,
    isPaused: input.isPaused,
    isGameOver: input.isGameOver,
    zoneMessage: input.zoneMessage,
    objectiveText: input.objectiveText,
    objectiveProgress: input.objectiveProgress,
    threatLevel: input.threatLevel,
    radioMessage: input.radioMessage,
    bindingHints: input.bindingHints,
  };
}
