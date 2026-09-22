import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

export default async function SharedDurationPage({ params }: PageProps) {
  const { token } = await params;
  if (!process.env.BOSS_SHARE_TOKEN || token !== process.env.BOSS_SHARE_TOKEN) notFound();

  const { data: sessions, error } = await getSupabaseAdmin().from("work_sessions").select("title, project, work_date, duration_minutes").order("work_date", { ascending: false }).limit(30);
  if (error) throw new Error("Unable to load work duration.");
  const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return <main className="share-shell"><header className="share-header"><a className="brand" href="#"><img className="brand-photo" src="/nade-profile.jpg" alt="Nade" /><span>Nade</span></a><span className="read-only">Read-only view</span></header><section className="share-hero"><p className="eyebrow">WORK DURATION MONITOR</p><h1>Recent work activity</h1><p>Read-only overview of logged work sessions.</p></section><section className="share-total"><p className="card-label">HOURS LOGGED</p><strong>{totalHours}h</strong><span>from the latest {sessions.length} sessions</span></section><section className="share-log"><div className="section-heading"><div><h2>Activity log</h2><p>{sessions.length} recorded sessions</p></div></div>{sessions.map((session, index) => <article key={`${session.title}-${index}`}><div><h3>{session.title}</h3><p>{session.project}</p></div><time>{session.work_date}</time><strong>{session.duration_minutes / 60}h</strong></article>)}{sessions.length === 0 && <p className="empty">No work sessions have been logged yet.</p>}</section></main>;
}
