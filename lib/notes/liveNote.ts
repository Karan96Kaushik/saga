/** Remote edits apply when this copy has nothing unsaved. A read-only copy always follows the server. */
export function shouldApplyRemote(options: {
  readOnly: boolean;
  dirty: boolean;
  localTitle: string;
  localContent: string;
  remoteTitle: string;
  remoteContent: string;
}): boolean {
  const same =
    options.localTitle === options.remoteTitle &&
    canonicalJson(options.localContent) === canonicalJson(options.remoteContent);
  if (same) return false;
  if (options.readOnly) return true;
  return !options.dirty;
}

/** Postgres JSONB reorders keys. Two documents match when their values match. */
export function canonicalJson(value: unknown): string {
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  return JSON.stringify(sortValue(parsed));
}

export function instantMillis(value: string): number | null {
  const trimmed = value.replace(/(\.\d{3})\d+/, '$1');
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isOwnWrite(updatedAt: string | undefined, writes: Iterable<number>): boolean {
  if (!updatedAt) return false;
  const instant = instantMillis(updatedAt);
  if (instant === null) return false;
  for (const write of writes) {
    if (write === instant) return true;
  }
  return false;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries.map(([key, entry]) => [key, sortValue(entry)]));
}
