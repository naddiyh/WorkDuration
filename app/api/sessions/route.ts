import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { validateWorkSession } from "@/lib/work-session";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const expectedKey = process.env.WORK_DURATION_API_KEY;
  if (!expectedKey) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${expectedKey}`;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return unauthorized();
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  try {
    let query = getSupabaseAdmin().from("work_sessions").select("*").order("work_date", { ascending: true }).order("start_time", { ascending: true });
    if (from) query = query.gte("work_date", from);
    if (to) query = query.lte("work_date", to);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unable to load work sessions", error);
    return NextResponse.json({ error: "Unable to load sessions. Check Supabase configuration." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return unauthorized();
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
      source: session.source
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unable to create work session", error);
    return NextResponse.json({ error: "Unable to create session. Check Supabase configuration." }, { status: 503 });
  }
}
