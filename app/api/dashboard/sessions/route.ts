import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { validateWorkSession } from "@/lib/work-session";

export const runtime = "nodejs";

async function currentUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase is not configured.");

  const cookieStore = await cookies();
  const supabase = createServerClient(url, publishableKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined }
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function authorized() {
  try {
    return await currentUser();
  } catch (error) {
    console.error("Unable to verify dashboard user", error);
    return null;
  }
}

export async function GET() {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await getSupabaseAdmin().from("work_sessions").select("id, title, project, work_date, start_time, end_time, duration_minutes, color").order("work_date", { ascending: true }).order("start_time", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unable to load dashboard sessions", error);
    return NextResponse.json({ error: "Unable to load sessions." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!await authorized()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = validateWorkSession(await request.json().catch(() => null));
  if (!session) return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });

  try {
    const { data, error } = await getSupabaseAdmin().from("work_sessions").insert({
      title: session.title,
      project: session.project,
      work_date: session.workDate,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_minutes: session.durationMinutes,
      color: session.color,
      source: "dashboard"
    }).select("id, title, project, work_date, start_time, end_time, duration_minutes, color").single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unable to create dashboard session", error);
    return NextResponse.json({ error: "Unable to save session." }, { status: 503 });
  }
}
