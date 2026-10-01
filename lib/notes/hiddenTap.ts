const TAP_WINDOW_MS = 600;

/** Three taps inside the window open hidden notes. Fewer taps stay on All notes. */
export function nextAllNotesTap(previous: number[], now: number): { times: number[]; openHidden: boolean } {
  const times = [...previous.filter((time) => now - time < TAP_WINDOW_MS), now];
  if (times.length >= 3) return { times: [], openHidden: true };
  return { times, openHidden: false };
}
