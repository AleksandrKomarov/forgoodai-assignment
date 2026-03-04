export function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function today() {
  return toDateString(new Date());
}

export function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateString(d);
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
}

const MAX_HISTORY_YEARS = 2;

export function earliestDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_HISTORY_YEARS);
  return toDateString(d);
}
