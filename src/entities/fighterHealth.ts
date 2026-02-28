export function restoreHpClamped(currentHp: number, maxHp: number, amount: number): { hp: number; restored: number } {
  const sanitizedAmount = Math.max(0, Math.round(amount));
  if (sanitizedAmount <= 0) {
    return { hp: currentHp, restored: 0 };
  }

  const hp = Math.min(maxHp, currentHp + sanitizedAmount);
  return {
    hp,
    restored: hp - currentHp,
  };
}
