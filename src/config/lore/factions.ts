export type FactionId = "barrio_union" | "los_grises" | "seguridad_nova";

export interface FactionProfile {
  id: FactionId;
  name: string;
  alignment: "ally" | "enemy" | "neutral";
  tagline: string;
}

export const factionCatalog: Record<FactionId, FactionProfile> = {
  barrio_union: {
    id: "barrio_union",
    name: "BARRIO UNION",
    alignment: "ally",
    tagline: "Vecinos coordinados para defender la calle.",
  },
  los_grises: {
    id: "los_grises",
    name: "LOS GRISES",
    alignment: "enemy",
    tagline: "Red de extorsion que controla rutas y cobros.",
  },
  seguridad_nova: {
    id: "seguridad_nova",
    name: "SEGURIDAD NOVA",
    alignment: "enemy",
    tagline: "Contrata privada que blanquea la violencia del distrito.",
  },
};
