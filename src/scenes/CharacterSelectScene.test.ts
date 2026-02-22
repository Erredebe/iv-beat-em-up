import { describe, expect, it } from "vitest";
import { playableCharacters } from "../config/gameplay/playableRoster";
import { getSessionState, resetSessionState, updateSessionState } from "../config/gameplay/sessionState";

describe("character select integration contract", () => {
  it("persists a selected playable character id", () => {
    resetSessionState();
    const selected = playableCharacters[1];
    updateSessionState({ selectedCharacter: selected.id });

    const session = getSessionState();
    expect(playableCharacters.map((entry) => entry.id)).toContain(session.selectedCharacter);
    expect(session.selectedCharacter).toBe(selected.id);
  });
});
