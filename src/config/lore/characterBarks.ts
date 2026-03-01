import type { CharacterId } from "../gameplay/playableRoster";

export type BarkEventId = "stage_start" | "zone_lock" | "zone_clear" | "special";

export interface CharacterBarkSet {
  stage_start: string[];
  zone_lock: string[];
  zone_clear: string[];
  special: string[];
}

export const characterBarks: Record<CharacterId, CharacterBarkSet> = {
  kastro: {
    stage_start: ["Hoy no se cobra a mi gente."],
    zone_lock: ["Se acabo el pasillo, ahora peleamos aqui."],
    zone_clear: ["Uno menos. Seguimos."],
    special: ["Aparta."],
  },
  marina: {
    stage_start: ["Ni un paso atras, ni una tienda cerrada."],
    zone_lock: ["Perfecto. Ya no tienen salida."],
    zone_clear: ["Linea limpia. A la siguiente."],
    special: ["Rapido y fuera."],
  },
  meneillos: {
    stage_start: ["Primero el barrio, luego las cuentas."],
    zone_lock: ["Tranquilos, esto se resuelve aqui."],
    zone_clear: ["Zona limpia. Que corra la voz."],
    special: ["Control total."],
  },
};
