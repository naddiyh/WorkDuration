export type WorkSessionInput = {
  title: string;
  project?: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  color?: "blue" | "violet" | "amber" | "green";
  source?: "dashboard" | "telegram" | "api";
};

export function validateWorkSession(value: unknown): WorkSessionInput | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Record<string, unknown>;
  const title = typeof session.title === "string" ? session.title.trim() : "";
  const workDate = typeof session.workDate === "string" ? session.workDate : "";
  const durationMinutes = Number(session.durationMinutes);
  const colors = ["blue", "violet", "amber", "green"] as const;
  const sources = ["dashboard", "telegram", "api"] as const;

  if (!title || title.length > 180 || !/^\d{4}-\d{2}-\d{2}$/.test(workDate) || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) return null;

  return {
    title,
    workDate,
    durationMinutes,
    project: typeof session.project === "string" ? session.project.trim().slice(0, 100) : "Personal",
    startTime: typeof session.startTime === "string" ? session.startTime : null,
    endTime: typeof session.endTime === "string" ? session.endTime : null,
    color: colors.includes(session.color as (typeof colors)[number]) ? session.color as (typeof colors)[number] : "blue",
    source: sources.includes(session.source as (typeof sources)[number]) ? session.source as (typeof sources)[number] : "api"
  };
}
