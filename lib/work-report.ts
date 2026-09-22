type ReportPeriod = {
  kind: "daily" | "weekly" | "monthly";
  label: string;
  startDate: string;
  endDate: string;
};

type SessionRow = {
  title: string;
  project: string;
  work_date: string;
  duration_minutes: number;
};

export type WorkReportStats = {
  period: ReportPeriod;
  totalMinutes: number;
  sessionCount: number;
  topProject: string | null;
  topProjectMinutes: number;
  mostProductiveDate: string | null;
  mostProductiveMinutes: number;
  previousTotalMinutes: number | null;
};

const MONTHS: Record<string, number> = {
  januari: 0, jan: 0, january: 0,
  februari: 1, feb: 1, february: 1,
  maret: 2, mar: 2, march: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5, june: 5,
  juli: 6, jul: 6, july: 6,
  agustus: 7, agu: 7, agt: 7, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9, october: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, des: 11, december: 11, dec: 11,
};

const ENGLISH_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    ? null
    : date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = toDate(value);
  if (!date) throw new Error("Invalid date");
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function formatLongDate(value: string) {
  const date = toDate(value)!;
  return `${ENGLISH_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function parseDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return toDate(value) ? value : null;

  const named = value.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  if (!named) return null;
  const month = MONTHS[named[2].toLowerCase()];
  if (month === undefined) return null;
  const result = `${named[3]}-${String(month + 1).padStart(2, "0")}-${named[1].padStart(2, "0")}`;
  return toDate(result) ? result : null;
}

function parseMonth(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? { year: Number(iso[1]), month: month - 1 } : null;
  }
  const named = value.match(/^([a-z]+)\s+(\d{4})$/i);
  if (!named) return null;
  const month = MONTHS[named[1].toLowerCase()];
  return month === undefined ? null : { year: Number(named[2]), month };
}

function weekFor(dateValue: string, label?: string): ReportPeriod {
  const date = toDate(dateValue)!;
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  const startDate = formatDate(date);
  const endDate = addDays(startDate, 6);
  return { kind: "weekly", label: label || `${formatLongDate(startDate)}–${formatLongDate(endDate)}`, startDate, endDate };
}

export function parseReportPeriod(command: "daily" | "weekly" | "monthly", argument: string | undefined, today: string): ReportPeriod | null {
  const input = argument?.trim().toLowerCase() || "";
  if (command === "daily") {
    const date = !input || input === "hari ini" || input === "today" ? today : input === "kemarin" || input === "yesterday" ? addDays(today, -1) : parseDate(input);
    return date ? { kind: "daily", label: formatLongDate(date), startDate: date, endDate: date } : null;
  }
  if (command === "weekly") {
    if (!input || input === "minggu ini" || input === "this week") return weekFor(today, "this week");
    if (input === "minggu lalu" || input === "last week") return weekFor(addDays(today, -7), "last week");
    const date = parseDate(input);
    return date ? weekFor(date) : null;
  }

  let month: { year: number; month: number } | null;
  if (!input || input === "bulan ini" || input === "this month") {
    const date = toDate(today)!;
    month = { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  } else if (input === "bulan lalu" || input === "last month") {
    const date = toDate(today)!;
    date.setUTCMonth(date.getUTCMonth() - 1);
    month = { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  } else month = parseMonth(input);
  if (!month || month.year < 2000 || month.year > 2100) return null;
  const startDate = `${month.year}-${String(month.month + 1).padStart(2, "0")}-01`;
  const endDate = formatDate(new Date(Date.UTC(month.year, month.month + 1, 0)));
  return { kind: "monthly", label: `${ENGLISH_MONTHS[month.month]} ${month.year}`, startDate, endDate };
}

function previousPeriod(period: ReportPeriod) {
  const length = Math.round((toDate(period.endDate)!.getTime() - toDate(period.startDate)!.getTime()) / 86_400_000) + 1;
  const endDate = addDays(period.startDate, -1);
  return { startDate: addDays(endDate, -(length - 1)), endDate };
}

export async function getWorkReport(supabase: { from: (table: string) => any }, period: ReportPeriod): Promise<WorkReportStats> {
  const previous = previousPeriod(period);
  const [currentResult, previousResult] = await Promise.all([
    supabase.from("work_sessions").select("title, project, work_date, duration_minutes").gte("work_date", period.startDate).lte("work_date", period.endDate),
    supabase.from("work_sessions").select("duration_minutes").gte("work_date", previous.startDate).lte("work_date", previous.endDate),
  ]);
  if (currentResult.error) throw currentResult.error;
  if (previousResult.error) throw previousResult.error;

  const sessions = (currentResult.data || []) as SessionRow[];
  const totalMinutes = sessions.reduce((total, session) => total + session.duration_minutes, 0);
  const byProject = new Map<string, number>();
  const byDate = new Map<string, number>();
  for (const session of sessions) {
    byProject.set(session.project, (byProject.get(session.project) || 0) + session.duration_minutes);
    byDate.set(session.work_date, (byDate.get(session.work_date) || 0) + session.duration_minutes);
  }
  const top = (values: Map<string, number>) => [...values.entries()].sort((a, b) => b[1] - a[1])[0];
  const topProject = top(byProject);
  const topDate = top(byDate);
  return {
    period, totalMinutes, sessionCount: sessions.length,
    topProject: topProject?.[0] || null, topProjectMinutes: topProject?.[1] || 0,
    mostProductiveDate: topDate?.[0] || null, mostProductiveMinutes: topDate?.[1] || 0,
    previousTotalMinutes: (previousResult.data || []).reduce((total: number, session: { duration_minutes: number }) => total + session.duration_minutes, 0) || null,
  };
}

export function formatMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) === 1 ? "" : "s"}${minutes % 60 ? ` ${minutes % 60} minute${minutes % 60 === 1 ? "" : "s"}` : ""}`;
}

export function fallbackWorkReport(stats: WorkReportStats) {
  if (!stats.sessionCount) return `Nothing logged for ${stats.period.label} yet — a clean slate for now. ✨`;
  const project = stats.topProject ? ` Your main focus was ${stats.topProject}.` : "";
  const productive = stats.mostProductiveDate ? ` Your strongest day was ${formatLongDate(stats.mostProductiveDate)} with ${formatMinutes(stats.mostProductiveMinutes)}.` : "";
  return `Here is your recap 👀 You logged ${formatMinutes(stats.totalMinutes)} across ${stats.sessionCount} sessions.${project}${productive} Solid work! ✨`;
}
