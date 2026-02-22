export type StageId = "market_95" | "metro_sur" | "playa_noche" | "puerto_rojo";

export const campaignStageOrder: StageId[] = ["market_95", "metro_sur", "playa_noche", "puerto_rojo"];

export function getNextStageId(current: StageId): StageId | null {
  const index = campaignStageOrder.indexOf(current);
  if (index < 0) {
    return campaignStageOrder[0] ?? null;
  }
  return campaignStageOrder[index + 1] ?? null;
}
