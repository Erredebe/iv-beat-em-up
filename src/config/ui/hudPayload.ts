export interface HudBindingHints {
  keyboard: string[];
  gamepad: string[];
}

export interface HudTargetEnemyPayload {
  id: string;
  hp: number;
  maxHp: number;
  ttlMs: number;
}

export interface HudVisibleEnemyPayload {
  id: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
}

export interface HudPayload {
  playerHp: number;
  playerMaxHp: number;
  playerName: string;
  playerPortraitKey: string;
  score: number;
  timeRemainingSec: number;
  specialCooldownRatio: number;
  stageName: string;
  zoneId: string | null;
  targetEnemy: HudTargetEnemyPayload | null;
  visibleEnemies: HudVisibleEnemyPayload[];
  controlsHintVisible: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  zoneMessage: string | null;
  bindingHints: HudBindingHints;
  objectiveText: string;
}