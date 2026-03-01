import { TARGET_ENEMY_TTL_MS } from "../../config/constants";
import { AudioSystem } from "../../systems/AudioSystem";
import { CombatSystem } from "../../systems/CombatSystem";
import { HitStopSystem } from "../../systems/HitStopSystem";
import type {
  StreetCombatRuntime,
  StreetCombatRuntimeInput,
  StreetCombatTargetingRuntime,
} from "./runtimeContracts";

interface CombatHitEventPayload {
  attackerId: string;
  targetId: string;
  targetHp: number;
  targetMaxHp: number;
  at: number;
}

interface TargetEnemyTracker {
  id: string;
  expiresAt: number;
}

function createTargetingRuntime(input: Pick<StreetCombatRuntimeInput, "scene" | "getPlayerId">): {
  targeting: StreetCombatTargetingRuntime;
  dispose: () => void;
} {
  let targetEnemy: TargetEnemyTracker | null = null;

  const handleCombatHit = (payload: CombatHitEventPayload): void => {
    void payload.targetHp;
    void payload.targetMaxHp;
    if (payload.attackerId !== input.getPlayerId()) {
      return;
    }
    targetEnemy = {
      id: payload.targetId,
      expiresAt: payload.at + TARGET_ENEMY_TTL_MS,
    };
  };

  input.scene.game.events.on("combat:hit", handleCombatHit);

  const targeting: StreetCombatTargetingRuntime = {
    clear(enemyId) {
      if (!enemyId) {
        targetEnemy = null;
        return;
      }
      if (targetEnemy?.id === enemyId) {
        targetEnemy = null;
      }
    },
    prune(nowMs, enemies) {
      if (!targetEnemy) {
        return;
      }
      if (nowMs >= targetEnemy.expiresAt) {
        targetEnemy = null;
        return;
      }
      const tracked = enemies.find((enemy) => enemy.id === targetEnemy?.id);
      if (!tracked || !tracked.isAlive()) {
        targetEnemy = null;
      }
    },
    getPayload(nowMs, enemies) {
      if (!targetEnemy) {
        return null;
      }

      if (nowMs >= targetEnemy.expiresAt) {
        targetEnemy = null;
        return null;
      }

      const tracked = enemies.find((enemy) => enemy.id === targetEnemy?.id && enemy.isAlive());
      if (!tracked) {
        targetEnemy = null;
        return null;
      }

      return {
        id: tracked.id,
        hp: tracked.hp,
        maxHp: tracked.maxHp,
        ttlMs: Math.max(0, targetEnemy.expiresAt - nowMs),
      };
    },
  };

  return {
    targeting,
    dispose: () => {
      input.scene.game.events.off("combat:hit", handleCombatHit);
      targetEnemy = null;
    },
  };
}

export function createCombatRuntime(input: StreetCombatRuntimeInput): StreetCombatRuntime {
  const hitStopSystem = new HitStopSystem(input.scene);
  const audioSystem = new AudioSystem(input.scene);
  const targetingRuntime = createTargetingRuntime({
    scene: input.scene,
    getPlayerId: input.getPlayerId,
  });

  const combatSystem = new CombatSystem({
    hitStopSystem,
    eventBus: input.scene.game.events,
    onHit: ({ attackId, target }) => {
      input.onCombatHitFeedback({
        attackId,
        targetX: target.x,
        targetY: target.y,
        targetTeam: target.team,
        targetState: target.state,
      });
      audioSystem.playHit();
      if (target.state === "KNOCKDOWN") {
        audioSystem.playKnockdown();
      }
    },
  });

  return {
    combatSystem,
    hitStopSystem,
    audioSystem,
    targeting: targetingRuntime.targeting,
    dispose: targetingRuntime.dispose,
  };
}
