import { describe, expect, it } from "vitest";
import boxeadorComboRaw from "../config/frameData/boxeador.combo.json";
import tecnicoComboRaw from "../config/frameData/tecnico.combo.json";
import velozComboRaw from "../config/frameData/veloz.combo.json";
import type { CharacterId } from "../config/gameplay/playableRoster";

describe("street scene roster regression", () => {
  it("keeps combo data mapped for every playable character id", () => {
    const comboByCharacter: Record<CharacterId, Record<string, unknown>> = {
      kastro: boxeadorComboRaw as Record<string, unknown>,
      marina: velozComboRaw as Record<string, unknown>,
      meneillos: tecnicoComboRaw as Record<string, unknown>,
    };

    for (const characterId of Object.keys(comboByCharacter) as CharacterId[]) {
      const combo = comboByCharacter[characterId];
      expect(combo.ATTACK_1, `${characterId} missing ATTACK_1`).toBeDefined();
      expect(combo.ATTACK_2, `${characterId} missing ATTACK_2`).toBeDefined();
      expect(combo.ATTACK_3, `${characterId} missing ATTACK_3`).toBeDefined();
      expect(combo.FINISHER_FORWARD, `${characterId} missing FINISHER_FORWARD`).toBeDefined();
      expect(combo.FINISHER_BACK, `${characterId} missing FINISHER_BACK`).toBeDefined();
      expect(combo.AIR_ATTACK, `${characterId} missing AIR_ATTACK`).toBeDefined();
      expect(combo.SPECIAL, `${characterId} missing SPECIAL`).toBeDefined();
    }
  });
});
