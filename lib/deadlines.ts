const KST_DAY_MS = 86_400_000;
const ISO_DEADLINE = /^(\d{4}-\d{2}-\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

export function deadlineCutoff(value: string | null): number | null {
  const match = value?.match(ISO_DEADLINE);
  if (!value || !match) return null;

  const day = Date.parse(`${match[1]}T00:00:00Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== match[1]) return null;

  // Date-only notices stay open until midnight at the end of the Korean day.
  if (value.length === 10) return Date.parse(`${value}T00:00:00+09:00`) + KST_DAY_MS;
  const cutoff = Date.parse(match[2] ? value : `${value}+09:00`);
  return Number.isFinite(cutoff) ? cutoff : null;
}

export function latestDeadlinePassed(cutoffs: readonly number[], now: number) {
  return cutoffs.reduce((latest, cutoff) => cutoff <= now && cutoff > latest ? cutoff : latest, 0);
}
