"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type Entry = { id: string | number; title: string; project: string; day: string; date: string; time: string; duration: number; color: string };
type StoredSession = { id: string; title: string; project: string; work_date: string; start_time: string | null; end_time: string | null; duration_minutes: number; color: string };

const initialEntries: Entry[] = [
  { id: 1, title: "Weekly problem", project: "Deep work", day: "Mon", date: "2026-07-27", time: "08:00 - 09:00", duration: 1, color: "blue" }, { id: 2, title: "Continue build curriculum career", project: "Career project", day: "Mon", date: "2026-07-27", time: "10:00 - 13:00", duration: 3, color: "violet" },
  { id: 3, title: "Daily check-in", project: "Ritual", day: "Tue", date: "2026-07-28", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 4, title: "Continue build curriculum career", project: "Career project", day: "Tue", date: "2026-07-28", time: "10:00 - 14:00", duration: 4, color: "violet" },
  { id: 5, title: "Daily check-in", project: "Ritual", day: "Wed", date: "2026-07-29", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 6, title: "Continue build curriculum career", project: "Career project", day: "Wed", date: "2026-07-29", time: "10:00 - 12:00", duration: 2, color: "violet" },
  { id: 7, title: "Continue build curriculum career", project: "Career project", day: "Thu", date: "2026-07-30", time: "06:00 - 07:00", duration: 1, color: "violet" }, { id: 8, title: "Daily check-in", project: "Ritual", day: "Thu", date: "2026-07-30", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 9, title: "Add Starting Your First Career module", project: "Career project", day: "Thu", date: "2026-07-30", time: "10:00 - 12:00", duration: 2, color: "violet" },
  { id: 10, title: "Meeting with Karina", project: "Meetings", day: "Mon", date: "2026-08-03", time: "06:30 - 07:20", duration: 1, color: "green" }, { id: 11, title: "Weekly problem", project: "Deep work", day: "Mon", date: "2026-08-03", time: "08:00 - 09:00", duration: 1, color: "blue" }, { id: 12, title: "Revision module 1-4", project: "Career project", day: "Mon", date: "2026-08-03", time: "19:00 - 21:00", duration: 2, color: "violet" },
  { id: 13, title: "Revision module 1-4", project: "Career project", day: "Tue", date: "2026-08-04", time: "04:30 - 06:00", duration: 2, color: "violet" }, { id: 14, title: "Daily check-in", project: "Ritual", day: "Tue", date: "2026-08-04", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 15, title: "Revision module 1-4", project: "Career project", day: "Tue", date: "2026-08-04", time: "10:00 - 12:00", duration: 2, color: "violet" },
  { id: 16, title: "Daily check-in", project: "Ritual", day: "Fri", date: "2026-08-07", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 17, title: "Revision curriculum career", project: "Career project", day: "Tue", date: "2026-08-11", time: "10:00 - 13:00", duration: 3, color: "violet" },
  { id: 18, title: "Review and restructure lessons", project: "Career project", day: "Wed", date: "2026-08-12", time: "09:00 - 15:00", duration: 6, color: "violet" }, { id: 19, title: "Daily check-in", project: "Ritual", day: "Thu", date: "2026-08-13", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 20, title: "Add main point for each lesson", project: "Career project", day: "Thu", date: "2026-08-13", time: "10:00 - 12:00", duration: 2, color: "violet" },
  { id: 21, title: "Rewrite material per lesson", project: "Career project", day: "Tue", date: "2026-08-18", time: "11:00 - 13:00", duration: 2, color: "violet" }, { id: 22, title: "Curriculum career revision", project: "Career project", day: "Wed", date: "2026-08-19", time: "10:00 - 16:00", duration: 6, color: "violet" },
  { id: 23, title: "Daily check-in", project: "Ritual", day: "Thu", date: "2026-08-20", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 24, title: "Revision curriculum career", project: "Career project", day: "Thu", date: "2026-08-20", time: "10:00 - 14:00", duration: 4, color: "violet" },
  { id: 25, title: "Check-in and weekly problem", project: "Deep work", day: "Mon", date: "2026-08-24", time: "08:00 - 09:00", duration: 1, color: "blue" }, { id: 26, title: "Revision and feedback follow-up", project: "Career project", day: "Mon", date: "2026-08-24", time: "09:00 - 12:00", duration: 3, color: "violet" },
  { id: 27, title: "Create scripts for lessons", project: "Career project", day: "Wed", date: "2026-08-26", time: "02:00 - 07:00", duration: 5, color: "violet" }, { id: 28, title: "Check-in and weekly problem", project: "Deep work", day: "Wed", date: "2026-08-26", time: "08:00 - 09:00", duration: 1, color: "blue" }, { id: 29, title: "Create scripts for lessons", project: "Career project", day: "Thu", date: "2026-08-27", time: "09:00 - 10:00", duration: 1, color: "violet" }, { id: 30, title: "Recheck lesson scripts", project: "Career project", day: "Fri", date: "2026-08-28", time: "21:00 - 23:00", duration: 2, color: "violet" }, { id: 31, title: "Offline check-in", project: "Ritual", day: "Mon", date: "2026-08-31", time: "08:00 - 09:00", duration: 1, color: "amber" },
  { id: 32, title: "Recheck lesson scripts", project: "Career project", day: "Tue", date: "2026-09-01", time: "13:00 - 15:00", duration: 2, color: "violet" }, { id: 33, title: "Offline check-in", project: "Ritual", day: "Wed", date: "2026-09-02", time: "08:00 - 09:00", duration: 1, color: "amber" }, { id: 34, title: "Proofread refined Indonesian script and course title", project: "Career project", day: "Thu", date: "2026-09-03", time: "08:00 - 09:00", duration: 1, color: "violet" }, { id: 35, title: "Proofread refined Indonesian script and course title", project: "Career project", day: "Fri", date: "2026-09-04", time: "01:00 - 04:00", duration: 3, color: "violet" },
  { id: 36, title: "Weekly problem", project: "Deep work", day: "Mon", date: "2026-09-07", time: "08:00 - 09:00", duration: 1, color: "blue" }, { id: 37, title: "Offline group chat sync", project: "Meetings", day: "Wed", date: "2026-09-09", time: "08:00 - 09:00", duration: 1, color: "green" }, { id: 38, title: "Finalize Indonesian script", project: "Career project", day: "Thu", date: "2026-09-10", time: "20:00 - 22:00", duration: 2, color: "violet" }, { id: 39, title: "Finalize Indonesian script", project: "Career project", day: "Fri", date: "2026-09-11", time: "02:00 - 05:00", duration: 3, color: "violet" },
  { id: 40, title: "Weekly problem", project: "Deep work", day: "Mon", date: "2026-09-14", time: "08:00 - 09:00", duration: 1, color: "blue" }, { id: 41, title: "Try CV-review features", project: "Product research", day: "Mon", date: "2026-09-14", time: "10:00 - 12:00", duration: 2, color: "blue" }, { id: 42, title: "Try CV-review features", project: "Product research", day: "Tue", date: "2026-09-15", time: "20:00 - 21:00", duration: 1, color: "blue" }, { id: 43, title: "Recheck Indonesian script", project: "Career project", day: "Wed", date: "2026-09-16", time: "10:00 - 12:00", duration: 2, color: "violet" },
  { id: 44, title: "Weekly problem", project: "Deep work", day: "Fri", date: "2026-09-18", time: "08:00 - 10:00", duration: 2, color: "blue" }, { id: 45, title: "Build PRD for Interview Tools", project: "Product research", day: "Fri", date: "2026-09-18", time: "13:00 - 15:00", duration: 2, color: "blue" }, { id: 46, title: "Build PRD for Interview Tools", project: "Product research", day: "Sat", date: "2026-09-19", time: "02:00 - 06:00", duration: 4, color: "blue" },
  { id: 47, title: "Weekly problem", project: "Deep work", day: "Mon", date: "2026-09-21", time: "08:00 - 10:00", duration: 2, color: "blue" }, { id: 48, title: "Revision for Interview Tools prototype", project: "Product research", day: "Mon", date: "2026-09-21", time: "10:00 - 12:00", duration: 2, color: "blue" }, { id: 49, title: "Meeting with Kak Fandy", project: "Meetings", day: "Tue", date: "2026-09-22", time: "08:00 - 10:00", duration: 2, color: "green" }, { id: 50, title: "Create video course with NotebookLM", project: "Career project", day: "Tue", date: "2026-09-22", time: "09:30 - 12:30", duration: 3, color: "violet" }
];

function startOfWeek(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}

function dateAfter(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function datesInRange(start: string, end: string) {
  if (end < start) return [];
  const dates = [];
  for (let current = start; current <= end; current = dateAfter(current, 1)) {
    const value = new Date(`${current}T00:00:00Z`);
    dates.push({ date: current, day: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(value), label: String(value.getUTCDate()), month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(value) });
  }
  return dates;
}

function hoursFor(entries: Entry[], date: string) { return entries.filter((entry) => entry.date === date).reduce((sum, entry) => sum + entry.duration, 0); }

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(value);
  return `${day} ${month} ${value.getUTCFullYear()}`;
}

function formatClock(time: string) {
  if (time === "Flexible") return time;
  return time.split(" - ").map((part) => {
    const [rawHour, minutes] = part.split(":");
    const hour = Number(rawHour);
    if (Number.isNaN(hour) || !minutes) return part;
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
  }).join(" - ");
}

function monthRange(year: string, month: string) {
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(lastDay).padStart(2, "0")}` };
}

function sessionToEntry(session: StoredSession): Entry {
  const date = session.work_date;
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const start = session.start_time?.slice(0, 5);
  const end = session.end_time?.slice(0, 5);
  return { id: session.id, title: session.title, project: session.project, day, date, time: start && end ? `${start} - ${end}` : "Flexible", duration: session.duration_minutes / 60, color: session.color };
}

export default function Home() {
  const pathname = usePathname();
  const [entries, setEntries] = useState(initialEntries);
  const [loadingEntries, setLoadingEntries] = useState(pathname === "/manage");
  const [modalOpen, setModalOpen] = useState(false);
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState("1");
  const [selectedDate, setSelectedDate] = useState("2026-09-22");
  const [startDate, setStartDate] = useState("2026-09-21");
  const [endDate, setEndDate] = useState("2026-09-27");
  const [selectedMonth, setSelectedMonth] = useState("09");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [activeDate, setActiveDate] = useState("");
  const [breakdownPage, setBreakdownPage] = useState(0);
  const [notice, setNotice] = useState("");
  const rangeLabel = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
    return start.getUTCMonth() === end.getUTCMonth() ? `${month.format(start)} ${start.getUTCDate()} - ${end.getUTCDate()}, ${end.getUTCFullYear()}` : `${month.format(start)} ${start.getUTCDate()} - ${month.format(end)} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
  }, [startDate, endDate]);
  const displayDays = useMemo(() => datesInRange(startDate, endDate), [startDate, endDate]);
  const breakdownPageCount = Math.max(Math.ceil(displayDays.length / 7), 1);
  const currentBreakdownPage = Math.min(breakdownPage, breakdownPageCount - 1);
  const desktopBreakdownDays = displayDays.slice(currentBreakdownPage * 7, (currentBreakdownPage + 1) * 7);
  const isWeeklyRange = displayDays.length === 7;
  const periodEntries = useMemo(() => entries.filter((entry) => entry.date >= startDate && entry.date <= endDate), [entries, startDate, endDate]);
  const total = useMemo(() => periodEntries.reduce((sum, entry) => sum + entry.duration, 0), [periodEntries]);
  const weeklyGoal = 40;
  const weeklyProgress = Math.min(Math.round((total / weeklyGoal) * 100), 100);
  const remainingHours = Math.max(weeklyGoal - total, 0);
  const focusHours = useMemo(() => periodEntries.filter((entry) => entry.project !== "Meetings").reduce((sum, entry) => sum + entry.duration, 0), [periodEntries]);
  const visibleEntries = activeDate ? periodEntries.filter((entry) => entry.date === activeDate) : periodEntries;
  const activityLabel = activeDate ? new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${activeDate}T00:00:00Z`)) : rangeLabel;

  useEffect(() => {
    if (pathname !== "/manage") return;
    let active = true;
    setLoadingEntries(true);
    fetch("/api/dashboard/sessions")
      .then(async (response) => {
        const body = await response.json() as { data?: StoredSession[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to load sessions.");
        if (active) setEntries((body.data || []).map(sessionToEntry));
      })
      .catch((error: Error) => { if (active) setNotice(error.message); })
      .finally(() => { if (active) setLoadingEntries(false); });
    return () => { active = false; };
  }, [pathname]);

  function openAddSession() {
    if (pathname !== "/manage") {
      window.location.assign("/login?next=%2Fmanage");
      return;
    }
    setModalOpen(true);
  }

  async function addEntry(event: React.FormEvent) {
    event.preventDefault();
    if (!task.trim()) return;
    const durationMinutes = Math.round(Number(duration) * 60);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
      setNotice("Enter a valid duration.");
      return;
    }
    const response = await fetch("/api/dashboard/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: task.trim(), project: "Personal", workDate: selectedDate, durationMinutes, color: "blue", source: "dashboard" })
    });
    const body = await response.json() as { data?: StoredSession; error?: string };
    const savedSession = body.data;
    if (!response.ok || !savedSession) {
      setNotice(body.error || "Unable to save session.");
      return;
    }
    setEntries((current) => [...current, sessionToEntry(savedSession)]);
    const weekStart = startOfWeek(selectedDate);
    setTask(""); setDuration("1"); setStartDate(weekStart); setEndDate(dateAfter(weekStart, 6)); setActiveDate(""); setBreakdownPage(0); setModalOpen(false); setNotice("Session added to your week.");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top"><img className="brand-photo" src="/nade-profile.jpg" alt="Nade" /><span>Nade</span></a>
        <div className="top-actions"><span className="sync-status"><i /> {loadingEntries ? "Loading..." : "Up to date"}</span><button className="icon-button" aria-label="Notifications" onClick={() => setNotice("You’re all caught up.")}>⌁</button></div>
      </header>
      <section className="welcome" id="top">
        <div><p className="eyebrow">NADIYAH · {rangeLabel.toUpperCase()}</p><h1>Work duration overview.</h1><p className="subcopy">Track work hours, review progress, and keep every session in one place.</p></div>
        <div className="welcome-actions"><Button className="primary-button" onClick={openAddSession}><span>+</span> Add session</Button></div>
      </section>

      <section className="summary-grid" aria-label="Weekly overview">
        <div className="card total-card"><div><p className="card-label">{isWeeklyRange ? "HOURS LOGGED THIS WEEK" : "HOURS LOGGED"}</p><p className="big-number">{total}<span>h</span></p><p className="muted">{isWeeklyRange ? `of ${weeklyGoal}h weekly target` : `from ${rangeLabel}`}</p></div>{isWeeklyRange && <div className="ring" style={{ background: `conic-gradient(#35775d 0 ${weeklyProgress}%, #d4e7db ${weeklyProgress}% 100%)` }}><span>{weeklyProgress}%</span></div>}</div>
        <div className="card stat-card"><div className="stat-icon lilac">◒</div><div><p className="card-label">FOCUS WORK</p><p className="stat-value">{focusHours}<span>h logged</span></p><p className="muted">Excludes meetings</p></div></div>
        <div className="card stat-card"><div className="stat-icon peach">⌘</div><div><p className="card-label">{isWeeklyRange ? "REMAINING" : "SESSIONS"}</p><p className="stat-value">{isWeeklyRange ? remainingHours : periodEntries.length}<span>{isWeeklyRange ? "h to target" : " logged"}</span></p><p className="muted">{isWeeklyRange ? `${periodEntries.length} sessions logged` : rangeLabel}</p></div></div>
      </section>

      <section className="filter-panel" aria-label="Filter work duration">
        <div><p className="card-label">FILTER WORK DURATION</p><p>Choose a start and end date to review hours from that range.</p></div>
        <div className="filter-controls"><label>Month<select value={selectedMonth} onChange={(event) => { const month = event.target.value; setSelectedMonth(month); const range = monthRange(selectedYear, month); setStartDate(range.start); setEndDate(range.end); setActiveDate(""); setBreakdownPage(0); }}><option value="07">July</option><option value="08">August</option><option value="09">September</option></select></label><label>Year<select value={selectedYear} onChange={(event) => { const year = event.target.value; setSelectedYear(year); const range = monthRange(year, selectedMonth); setStartDate(range.start); setEndDate(range.end); setActiveDate(""); setBreakdownPage(0); }}><option value="2026">2026</option></select></label><label>Start date<input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setActiveDate(""); setBreakdownPage(0); }} /></label><label>End date<input type="date" min={startDate} value={endDate} onChange={(event) => { setEndDate(event.target.value); setActiveDate(""); setBreakdownPage(0); }} /></label><button className="clear-filter" onClick={() => { const today = new Date().toISOString().slice(0, 10); const weekStart = startOfWeek(today); setStartDate(weekStart); setEndDate(dateAfter(weekStart, 6)); setActiveDate(""); setBreakdownPage(0); }}>Current week</button></div>
      </section>

      <section className="week-section">
        <div className="section-heading"><div><h2>Daily breakdown</h2><p>Hours logged on each day within {rangeLabel}</p></div>{breakdownPageCount > 1 && <div className="breakdown-nav desktop-breakdown"><button aria-label="Previous dates" onClick={() => setBreakdownPage((page) => Math.max(page - 1, 0))} disabled={currentBreakdownPage === 0}>{"\u2190"}</button><span>Week {currentBreakdownPage + 1} of {breakdownPageCount}</span><button aria-label="Next dates" onClick={() => setBreakdownPage((page) => Math.min(page + 1, breakdownPageCount - 1))} disabled={currentBreakdownPage === breakdownPageCount - 1}>{"\u2192"}</button></div>}</div>
        <div className="week-card desktop-breakdown" style={{ gridTemplateColumns: `repeat(${Math.max(desktopBreakdownDays.length, 1)}, minmax(88px, 1fr))` }}>
          {desktopBreakdownDays.map((item) => { const hour = hoursFor(periodEntries, item.date); return <button className={`day-column ${activeDate === item.date ? "active" : ""}`} key={item.date} onClick={() => setActiveDate(activeDate === item.date ? "" : item.date)}><span className="day-name">{item.day}</span><span className="date">{item.label}<small>{item.month}</small></span><span className="bar-track"><span className="bar" style={{ height: `${Math.max(hour * 13, hour ? 16 : 3)}px` }} /></span><span className="hours">{hour ? `${hour}h` : "-"}</span></button>; })}
        </div>
        <div className="week-card mobile-breakdown" style={{ gridTemplateColumns: `repeat(${Math.max(displayDays.length, 1)}, minmax(88px, 1fr))` }}>
          {displayDays.map((item) => { const hour = hoursFor(periodEntries, item.date); return <button className={`day-column ${activeDate === item.date ? "active" : ""}`} key={item.date} onClick={() => setActiveDate(activeDate === item.date ? "" : item.date)}><span className="day-name">{item.day}</span><span className="date">{item.label}<small>{item.month}</small></span><span className="bar-track"><span className="bar" style={{ height: `${Math.max(hour * 13, hour ? 16 : 3)}px` }} /></span><span className="hours">{hour ? `${hour}h` : "-"}</span></button>; })}
          {!displayDays.length && <p className="empty">End date must be after the start date.</p>}
        </div>
      </section>

      <section className="schedule-section">
        <div className="section-heading"><div><h2>Activity log</h2><p>{activityLabel} · {visibleEntries.length} {visibleEntries.length === 1 ? "session" : "sessions"} logged</p></div>{activeDate && <button className="text-button" onClick={() => setActiveDate("")}>Show all dates <span>→</span></button>}</div>
        <div className="schedule-card">
          {visibleEntries.map((entry) => <article className="session" key={entry.id}><span className={`session-dot ${entry.color}`} /><div className="session-main"><h3>{entry.title}</h3><p>{entry.project}</p><p className="session-date">{formatDate(entry.date)} · {formatClock(entry.time)}</p></div><div className="session-duration">{entry.duration}h</div></article>)}
          {visibleEntries.length === 0 && <p className="empty">Nothing is planned for this day yet.</p>}
        </div>
      </section>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><form className="modal" onSubmit={addEntry}><button className="close" type="button" aria-label="Close add session dialog" onClick={() => setModalOpen(false)}>×</button><p className="eyebrow">NEW SESSION</p><h2>Add a work session</h2><label>What are you working on?<input autoFocus value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Design project brief" /></label><div className="form-row"><label>Date<input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></label><label>Hours<input type="number" min="0.5" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} /></label></div><Button className="primary-button" type="submit">Save session</Button></form></div>}
      {notice && <button className="notice" onClick={() => setNotice("")}>{notice}<span>×</span></button>}
    </main>
  );
}
