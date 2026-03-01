import { getStageWalkRails } from "../../config/levels/stageTypes";
import { CollisionSystem } from "../../systems/CollisionSystem";
import { DepthSystem } from "../../systems/DepthSystem";
import { NavigationSystem } from "../../systems/NavigationSystem";
import { StageRenderer } from "../../systems/StageRenderer";
import type { StreetStageRuntime, StreetStageRuntimeInput } from "./runtimeContracts";

export function createStageRuntime(input: StreetStageRuntimeInput): StreetStageRuntime {
  const stageWorldWidth = input.stageBundle.layout.mapWidthTiles * input.stageBundle.layout.tileSize;
  const walkRails = getStageWalkRails(input.stageBundle.layout);

  const navigationSystem = new NavigationSystem(walkRails, stageWorldWidth);
  const collisionSystem = new CollisionSystem(input.scene, walkRails, stageWorldWidth);
  const depthSystem = new DepthSystem();
  const stageRenderer = new StageRenderer(input.scene, input.stageBundle.layout);
  const stageRenderRuntime = stageRenderer.build(collisionSystem, depthSystem);

  const spawnRail = collisionSystem.getRailAtX(input.playerSpawnX);
  const fallbackSpawnY = (spawnRail.topY + spawnRail.bottomY) * 0.5;
  const playerSpawnY = spawnRail.preferredY ?? input.stageBundle.layout.walkLane?.playerSpawnY ?? fallbackSpawnY;

  return {
    stageWorldWidth,
    playerSpawnY,
    walkRails,
    navigationSystem,
    collisionSystem,
    depthSystem,
    stageRenderer,
    stageRenderRuntime,
  };
}
