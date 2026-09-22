import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { extractWorkSession, sendTelegramMessage, type TelegramUpdate } from "@/lib/telegram";
import { validateWorkSession } from "@/lib/work-session";

export const runtime = "nodejs";
export const maxDuration = 15;

function allowedChat(chatId: number) {
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_IDS?.split(",").map((value) => value.trim()).filter(Boolean);
  return !allowed?.length || allowed.includes(String(chatId));
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null) as TelegramUpdate | null;
  const message = update?.message;
  if (!message?.text) return NextResponse.json({ ok: true });
  if (!allowedChat(message.chat.id)) return NextResponse.json({ ok: true });

  try {
    if (/^\/(start|help)/i.test(message.text)) {
      await sendTelegramMessage(message.chat.id, "Send a natural-language work log, for example: ‘Worked on curriculum revision today from 10:00 to 12:30’. I’ll save it to Tempo.");
      return NextResponse.json({ ok: true });
    }

    const extracted = await extractWorkSession(message.text);
    const session = validateWorkSession(
      extracted && typeof extracted === "object" ? { ...(extracted as Record<string, unknown>), source: "telegram" } : null
    );
    if (!session) {
      await sendTelegramMessage(message.chat.id, "I couldn’t find a complete work session. Include what you worked on, a date, and a duration or start/end time.");
      return NextResponse.json({ ok: true });
    }

    const { error } = await getSupabaseAdmin().from("work_sessions").insert({
      title: session.title, project: session.project, work_date: session.workDate,
      start_time: session.startTime, end_time: session.endTime, duration_minutes: session.durationMinutes,
      color: session.color, source: "telegram"
    });
    if (error) throw error;
    await sendTelegramMessage(message.chat.id, `Saved: ${session.title} — ${session.durationMinutes} minutes on ${session.workDate}.`);
  } catch (error) {
    console.error("Telegram webhook failed", error);
    await sendTelegramMessage(message.chat.id, "I couldn’t save that just now. Please try again in a moment.").catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
