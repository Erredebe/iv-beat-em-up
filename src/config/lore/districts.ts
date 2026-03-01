import type { FactionId } from "./factions";

export type DistrictId = "mercado_sur" | "metro_sur" | "malecon_norte" | "puerto_rojo";

export interface DistrictProfile {
  id: DistrictId;
  displayName: string;
  background: string;
  defaultControllingFaction: FactionId;
}

export const districtCatalog: Record<DistrictId, DistrictProfile> = {
  mercado_sur: {
    id: "mercado_sur",
    displayName: "MERCADO SUR",
    background: "Zona comercial tomada por cobros diarios y vigilancia criminal.",
    defaultControllingFaction: "los_grises",
  },
  metro_sur: {
    id: "metro_sur",
    displayName: "METRO SUR",
    background: "Nodo de transporte usado para mover mercancia y amenazas.",
    defaultControllingFaction: "seguridad_nova",
  },
  malecon_norte: {
    id: "malecon_norte",
    displayName: "MALECON NORTE",
    background: "Franja costera con negocios nocturnos en disputa.",
    defaultControllingFaction: "los_grises",
  },
  puerto_rojo: {
    id: "puerto_rojo",
    displayName: "PUERTO ROJO",
    background: "Centro logistico final de la red de extorsion.",
    defaultControllingFaction: "seguridad_nova",
  },
};
