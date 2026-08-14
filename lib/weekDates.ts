const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the date (Monday) that starts the week containing `date`. */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDates(weekStartDate: string): string[] {
  const start = new Date(weekStartDate + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISODate(d);
  });
}

export function formatDayShort(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return DAY_LABELS_SHORT[idx];
}

export function formatDayLong(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return `${DAY_LABELS_LONG[idx]} ${d.getDate()}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}
