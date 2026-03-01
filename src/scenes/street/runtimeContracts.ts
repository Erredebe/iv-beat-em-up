import type Phaser from "phaser";
import type { StageWalkRailConfig } from "../../config/levels/stageTypes";
import type { PlayableCharacterProfile } from "../../config/gameplay/playableRoster";
import type { StageBundle } from "../../config/levels/stageCatalog";
import type { HudTargetEnemyPayload } from "../../config/ui/hudPayload";
import type { EnemyArchetype, EnemyBasic } from "../../entities/EnemyBasic";
import type { Player } from "../../entities/Player";
import type { CollisionSystem } from "../../systems/CollisionSystem";
import type { CombatSystem } from "../../systems/CombatSystem";
import type { DepthSystem } from "../../systems/DepthSystem";
import type { EnemyAI } from "../../systems/EnemyAI";
import type { HitStopSystem } from "../../systems/HitStopSystem";
import type { NavigationSystem } from "../../systems/NavigationSystem";
import type { SpawnManager } from "../../systems/SpawnManager";
import type { StageRenderer, StageRuntime } from "../../systems/StageRenderer";
import type { AudioSystem } from "../../systems/AudioSystem";
import type { AttackFrameData, AttackId, FighterState, Team } from "../../types/combat";

export interface TargetableEnemySnapshot {
  id: string;
  hp: number;
  maxHp: number;
  isAlive(): boolean;
}

export interface StreetStageRuntimeInput {
  scene: Phaser.Scene;
  stageBundle: StageBundle;
  playerSpawnX: number;
}

export interface StreetStageRuntime {
  stageWorldWidth: number;
  playerSpawnY: number;
  walkRails: StageWalkRailConfig[];
  navigationSystem: NavigationSystem;
  collisionSystem: CollisionSystem;
  depthSystem: DepthSystem;
  stageRenderer: StageRenderer;
  stageRenderRuntime: StageRuntime;
}

export interface CombatHitFeedback {
  attackId: AttackId;
  targetX: number;
  targetY: number;
  targetTeam: Team;
  targetState: FighterState;
}

export interface StreetCombatRuntimeInput {
  scene: Phaser.Scene;
  getPlayerId: () => string;
  onCombatHitFeedback: (feedback: CombatHitFeedback) => void;
}

export interface StreetCombatTargetingRuntime {
  clear(enemyId?: string): void;
  prune(nowMs: number, enemies: readonly TargetableEnemySnapshot[]): void;
  getPayload(nowMs: number, enemies: readonly TargetableEnemySnapshot[]): HudTargetEnemyPayload | null;
}

export interface StreetCombatRuntime {
  combatSystem: CombatSystem;
  hitStopSystem: HitStopSystem;
  audioSystem: AudioSystem;
  targeting: StreetCombatTargetingRuntime;
  dispose(): void;
}

export interface StreetActorRuntimeInput {
  scene: Phaser.Scene;
  stageBundle: StageBundle;
  selectedCharacter: PlayableCharacterProfile;
  playerAttackData: Record<AttackId, AttackFrameData>;
  playerSpawnX: number;
  playerSpawnY: number;
  collisionSystem: CollisionSystem;
  navigationSystem: NavigationSystem;
  depthSystem: DepthSystem;
}

export interface StreetActorRuntime {
  player: Player;
  enemyAI: EnemyAI;
  spawnManager: SpawnManager;
  enemies: EnemyBasic[];
  spawnEnemy: (x: number, y: number, archetype?: EnemyArchetype) => EnemyBasic;
  initialZoneId: string | null;
}
