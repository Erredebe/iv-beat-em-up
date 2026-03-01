import type { StageId } from "../gameplay/campaign";
import type { DistrictId } from "./districts";

export type StoryBeatId =
  | "market_crackdown"
  | "metro_blackout"
  | "coast_pressure"
  | "harbor_showdown";

export interface StoryBeat {
  id: StoryBeatId;
  stageId: StageId;
  districtId: DistrictId;
  introLine: string;
  radioBriefing: string;
  clearLine: string;
}

export const storyBeatCatalog: Record<StoryBeatId, StoryBeat> = {
  market_crackdown: {
    id: "market_crackdown",
    stageId: "market_95",
    districtId: "mercado_sur",
    introLine: "El mercado paga doble: comida y miedo.",
    radioBriefing: "BARRIO: Los Grises levantaron tres puntos de cobro en la zona.",
    clearLine: "La gente vuelve a abrir persianas. Primer cerco roto.",
  },
  metro_blackout: {
    id: "metro_blackout",
    stageId: "metro_sur",
    districtId: "metro_sur",
    introLine: "Sin metro no hay barrio. Si cae la linea, cae todo.",
    radioBriefing: "BARRIO: Seguridad Nova esta cortando accesos para encerrar a vecinos.",
    clearLine: "El anden vuelve a moverse. La ruta sigue abierta.",
  },
  coast_pressure: {
    id: "coast_pressure",
    stageId: "playa_noche",
    districtId: "malecon_norte",
    introLine: "En el malecon venden calma, pero cobran miedo.",
    radioBriefing: "BARRIO: Refuerzos de Los Grises llegan por la costa.",
    clearLine: "La noche respira. El malecon no se vende esta vez.",
  },
  harbor_showdown: {
    id: "harbor_showdown",
    stageId: "puerto_rojo",
    districtId: "puerto_rojo",
    introLine: "Todo termina donde empiezan los envios del cartel.",
    radioBriefing: "BARRIO: Ultima linea. Si cae el puerto, cae su red.",
    clearLine: "Puerto recuperado. La ciudad vuelve a tener voz.",
  },
};
