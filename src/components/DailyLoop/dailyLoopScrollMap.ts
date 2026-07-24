/** Default share of each scroll unit spent locked on a content state. */
export const DAILY_LOOP_HOLD_FRACTION = 0.8;

/** Viewport-heights of scroll per state unit (hold + transition bands). */
export const DAILY_LOOP_SCROLL_PER_STATE_VH = 0.85;

/** Trailing scroll (vh) after the last state before the pin releases. */
export const DAILY_LOOP_FINAL_HOLD_VH = 0.15;

/** One full compress → rotate → expand cycle. */
export const DAILY_LOOP_STEP_DURATION_MS = 1280;

function holdWidth(holdFraction: number) {
  return Math.min(0.85, Math.max(0.55, holdFraction));
}

/**
 * Discrete face index from raw scroll progress.
 * Each unit is hold (viewing) then a short transition band that triggers rotation.
 */
export function targetStateFromScroll(
  rawScroll: number,
  stateCount: number,
  holdFraction = DAILY_LOOP_HOLD_FRACTION,
): number {
  const max = Math.max(stateCount - 1, 0);
  if (max <= 0) return 0;

  const raw = Math.max(0, rawScroll);
  if (raw >= max) return max;

  const unit = Math.floor(raw);
  const frac = raw - unit;
  const holdW = holdWidth(holdFraction);

  if (frac < holdW) return unit;
  return Math.min(unit + 1, max);
}

/**
 * Remap a linear 0…stateCount-1 scroll index so each stage has a hold band,
 * then a transition — matching “hold → transition → hold → transition”.
 *
 * `holdFraction` is the share of each stage unit spent locked on that state.
 * Higher values leave more scroll for viewing and less for prism enter/leave.
 */
export function applyDailyLoopHoldMapping(
  linearIndex: number,
  stateCount: number,
  holdFraction = DAILY_LOOP_HOLD_FRACTION,
): number {
  const max = Math.max(stateCount - 1, 0);
  if (max <= 0) return 0;

  const holdW = holdWidth(holdFraction);
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
