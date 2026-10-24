/** Civil dates are values, not instants. Never parse YYYY-MM-DD with Date. */
export function normalizeDateOnly(value?: string | null): string {
  if (!value) return "";
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/.exec(text);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!iso && !br) return "";
  const year = Number(iso ? iso[1] : br?.[3]);
  const month = Number(iso ? iso[2] : br?.[2]);
  const day = Number(iso ? iso[3] : br?.[1]);
  const check = new Date(0);
  check.setUTCFullYear(year, month - 1, day);
  check.setUTCHours(0, 0, 0, 0);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return "";
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDateOnly(value?: string | null, empty = ""): string {
  const date = normalizeDateOnly(value);
  return date ? date.split("-").reverse().join("/") : empty;
}

export function todayDateOnly(now = new Date()): string {
  return `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** UTC ordinal supports civil-day arithmetic without daylight-saving drift. */
export function dateOnlyDay(value?: string | null): number {
  const date = normalizeDateOnly(value);
  if (!date) return NaN;
  const [year, month, day] = date.split("-").map(Number);
  const instant = new Date(0);
  instant.setUTCFullYear(year, month - 1, day);
  instant.setUTCHours(0, 0, 0, 0);
  return instant.getTime() / 86400000;
}