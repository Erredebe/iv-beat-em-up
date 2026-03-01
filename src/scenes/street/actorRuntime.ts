import { ENEMY_MAX_HP, ENEMY_MOVE_SPEED } from "../../config/constants";
import { getCombatBalancePreset } from "../../config/gameplay/combatBalancePresets";
import { featureFlags } from "../../config/features";
import { depthPriorities } from "../../config/visual/depthLayers";
import { fighterVisualProfiles } from "../../config/visual/fighterVisualProfiles";
import { EnemyBasic, buildEnemyAttackData, type EnemyArchetype } from "../../entities/EnemyBasic";
import { Player } from "../../entities/Player";
import { EnemyAI } from "../../systems/EnemyAI";
import type { NavigationZoneState } from "../../systems/NavigationSystem";
import { SpawnManager } from "../../systems/SpawnManager";
import type { StreetActorRuntime, StreetActorRuntimeInput } from "./runtimeContracts";

const ENEMY_TINT_BY_ARCHETYPE: Record<EnemyArchetype, number> = {
  brawler: 0xfff4f8,
  rusher: 0xc7dcff,
  tank: 0xffd0a1,
  agile_f: 0xffc2e6,
  bat_wielder: 0xe4dbff,
  mini_boss: 0xffb782,
  knife_fighter: 0xffea00,
};

const BASELINE_ARCHETYPES: EnemyArchetype[] = ["brawler", "rusher", "tank", "knife_fighter"];

const EMPTY_ZONE_STATE: NavigationZoneState = {
  activeZoneId: null,
  blockers: [],
};

function resolveArchetype(archetype: EnemyArchetype): EnemyArchetype {
  if (featureFlags.enemyRoster || BASELINE_ARCHETYPES.includes(archetype)) {
    return archetype;
  }
  return "brawler";
}

export function createActorRuntime(input: StreetActorRuntimeInput): StreetActorRuntime {
  let spawnManagerRef: SpawnManager | null = null;

  const getNavigationZoneState = (): NavigationZoneState => spawnManagerRef?.getNavigationState() ?? EMPTY_ZONE_STATE;

  const player = new Player(input.scene, {
    id: "P1",
    team: "player",
    x: input.playerSpawnX,
    y: input.playerSpawnY,
    animationOwner: input.selectedCharacter.animationOwner,
    maxHp: input.selectedCharacter.maxHp,
    moveSpeed: input.selectedCharacter.moveSpeed,
    attackData: input.playerAttackData,
    visualProfile: fighterVisualProfiles[input.selectedCharacter.animationOwner],
    clampPosition: (x, y) => input.collisionSystem.clampPositionToRail(x, y),
    navigationSystem: input.navigationSystem,
    getNavigationZoneState,
  });
  player.sprite.setTint(input.selectedCharacter.tint);
  input.collisionSystem.attachFootCollider(player);
  input.collisionSystem.applyWorldBounds(player);

  input.depthSystem.register(player.shadow, {
    layer: "FIGHTER_SHADOW",
    dynamicY: () => player.y,
    priority: depthPriorities.FIGHTER_SHADOW,
  });
  input.depthSystem.register(player.spriteOutline, {
    layer: "FIGHTER_OUTLINE",
    dynamicY: () => player.y,
    priority: depthPriorities.FIGHTER_OUTLINE,
  });
  input.depthSystem.register(player.sprite, {
    layer: "FIGHTER",
    dynamicY: () => player.y,
    priority: depthPriorities.FIGHTER,
  });

  const spawnEnemy = (x: number, y: number, archetype: EnemyArchetype = "brawler"): EnemyBasic => {
    const resolvedArchetype = resolveArchetype(archetype);
    const combatBalance = getCombatBalancePreset();
    const spawnConfig = combatBalance.enemySpawnByArchetype[resolvedArchetype];

    const enemy = new EnemyBasic(
      input.scene,
      {
        id: `E_${Math.floor(input.scene.time.now)}_${Math.floor(Math.random() * 1000)}`,
        team: "enemy",
        x,
        y,
        animationOwner: "enemy",
        maxHp: ENEMY_MAX_HP + spawnConfig.maxHpBonus,
        moveSpeed: ENEMY_MOVE_SPEED * spawnConfig.moveSpeedMultiplier,
        attackData: buildEnemyAttackData(input.playerAttackData, resolvedArchetype),
        visualProfile: fighterVisualProfiles.enemy,
        clampPosition: (nextX, nextY) => input.collisionSystem.clampPositionToRail(nextX, nextY),
        navigationSystem: input.navigationSystem,
        getNavigationZoneState,
      },
      resolvedArchetype,
    );

    enemy.sprite.setTint(ENEMY_TINT_BY_ARCHETYPE[resolvedArchetype]);
    input.collisionSystem.attachFootCollider(enemy);
    input.collisionSystem.applyWorldBounds(enemy);

    input.depthSystem.register(enemy.shadow, {
      layer: "FIGHTER_SHADOW",
      dynamicY: () => enemy.y,
      priority: depthPriorities.FIGHTER_SHADOW,
    });
    input.depthSystem.register(enemy.spriteOutline, {
      layer: "FIGHTER_OUTLINE",
      dynamicY: () => enemy.y,
      priority: depthPriorities.FIGHTER_OUTLINE,
    });
    input.depthSystem.register(enemy.sprite, {
      layer: "FIGHTER",
      dynamicY: () => enemy.y,
      priority: depthPriorities.FIGHTER,
    });

    return enemy;
  };

  const enemyAI = new EnemyAI(input.navigationSystem, getNavigationZoneState);
  const spawnManager = new SpawnManager(
    input.collisionSystem,
    (spawn) => spawnEnemy(spawn.x, spawn.y, spawn.archetype),
    input.stageBundle.spawns,
  );
  spawnManagerRef = spawnManager;

  const enemies: EnemyBasic[] = [];
  let initialZoneId: string | null = null;
  if (input.stageBundle.spawns.length > 0) {
    initialZoneId = input.stageBundle.spawns[0].id;
    enemies.push(...spawnManager.startWave(initialZoneId, input.scene.time.now));
  }

  return {
    player,
    enemyAI,
    spawnManager,
    enemies,
    spawnEnemy,
    initialZoneId,
  };
}
