import { describe, expect, it } from "vitest";
import {
  resolveCampaignSceneFlow,
  resolveNextSceneFromCharacterSelect,
  resolveNextSceneFromIntro,
  resolveNextSceneFromTitle,
} from "./sceneFlow";

describe("campaign scene flow integration", () => {
  it("keeps default campaign chain Title -> CharacterSelect -> Intro -> Street", () => {
    const flow = resolveCampaignSceneFlow({
      characterSelect: true,
      storyIntro: true,
    });

    expect(flow).toEqual(["TitleScene", "CharacterSelectScene", "IntroScene", "StreetScene"]);
  });

  it("keeps direct fallbacks coherent when feature flags are disabled", () => {
    expect(resolveNextSceneFromTitle({ characterSelect: false, storyIntro: true })).toBe("StreetScene");
    expect(resolveNextSceneFromCharacterSelect({ characterSelect: true, storyIntro: false })).toBe("StreetScene");
    expect(resolveNextSceneFromIntro()).toBe("StreetScene");
  });
});
