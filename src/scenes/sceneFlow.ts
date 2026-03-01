export type CampaignSceneKey = "TitleScene" | "CharacterSelectScene" | "IntroScene" | "StreetScene";

export interface CampaignSceneFlowFlags {
  characterSelect: boolean;
  storyIntro: boolean;
}

export function resolveNextSceneFromTitle(flags: CampaignSceneFlowFlags): CampaignSceneKey {
  return flags.characterSelect ? "CharacterSelectScene" : "StreetScene";
}

export function resolveNextSceneFromCharacterSelect(flags: CampaignSceneFlowFlags): CampaignSceneKey {
  return flags.storyIntro ? "IntroScene" : "StreetScene";
}

export function resolveNextSceneFromIntro(): CampaignSceneKey {
  return "StreetScene";
}

export function resolveCampaignSceneFlow(flags: CampaignSceneFlowFlags): CampaignSceneKey[] {
  const flow: CampaignSceneKey[] = ["TitleScene"];
  const titleNext = resolveNextSceneFromTitle(flags);
  flow.push(titleNext);

  if (titleNext === "CharacterSelectScene") {
    const selectNext = resolveNextSceneFromCharacterSelect(flags);
    flow.push(selectNext);
    if (selectNext === "IntroScene") {
      flow.push(resolveNextSceneFromIntro());
    }
    return flow;
  }

  return flow;
}
