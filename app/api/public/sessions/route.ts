import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("work_sessions")
      .select("id, title, project, work_date, start_time, end_time, duration_minutes, color")
      .order("work_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unable to load public sessions", error);
    return NextResponse.json({ error: "Unable to load sessions." }, { status: 503 });
  }
}
