/**
 * Remap a linear 0…stateCount-1 scroll index so each stage has a hold band,
 * then a transition — matching “transition → hold → transition → hold”.
 *
 * `holdFraction` is the share of each stage unit spent locked on that state.
 * Lower values leave more scroll for the prism enter/leave.
 */
export function applyDailyLoopHoldMapping(
  linearIndex: number,
  stateCount: number,
  holdFraction = 0.4,
): number {
  const max = Math.max(stateCount - 1, 0);
  if (max <= 0) return 0;

  const holdW = Math.min(0.45, Math.max(0.22, holdFraction));
  const transW = 1 - holdW;
  // Phases: H₀ T₀ H₁ T₁ … Hₙ₋₁
  const totalW = stateCount * holdW + max * transW;
  const p = Math.min(1, Math.max(0, linearIndex / max));
  let pos = p * totalW;

  for (let i = 0; i < stateCount; i += 1) {
    if (pos <= holdW) return i;
    pos -= holdW;
    if (i >= max) return max;
    if (pos <= transW) return i + pos / transW;
    pos -= transW;
  }

  return max;
}
