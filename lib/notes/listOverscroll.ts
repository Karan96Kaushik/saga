export const HIDDEN_OVERSCROLL_PX = 640;
const CONTINUOUS_MS = 700;

export type OverscrollState = {
  accumulated: number;
  at: number;
};

/** A continued downward scroll while the list is already at the bottom opens hidden notes. */
export function nextListOverscroll(
  state: OverscrollState,
  now: number,
  delta: number,
  atBottom: boolean,
): OverscrollState & { openHidden: boolean } {
  if (!atBottom || delta <= 0) return { accumulated: 0, at: now, openHidden: false };
  const continued = now - state.at <= CONTINUOUS_MS;
  const accumulated = (continued ? state.accumulated : 0) + delta;
  if (accumulated >= HIDDEN_OVERSCROLL_PX) return { accumulated: 0, at: now, openHidden: true };
  return { accumulated, at: now, openHidden: false };
}
