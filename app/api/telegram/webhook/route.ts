import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { detectReportIntent, extractWorkSession, generateWorkReport, localToday, sendTelegramMessage, type TelegramUpdate } from "@/lib/telegram";
import { clearTelegramDraft, getTelegramDraft, saveTelegramDraft, type TelegramWorkDraft } from "@/lib/telegram-draft";
import { validateWorkSession } from "@/lib/work-session";
import { fallbackWorkReport, formatProjectList, getRecentProjects, getWorkReport, parseReportPeriod } from "@/lib/work-report";

export const runtime = "nodejs";
export const maxDuration = 15;

function allowedChat(chatId: number) {
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_IDS?.split(",").map((value) => value.trim()).filter(Boolean);
  return !allowed?.length || allowed.includes(String(chatId));
}

const REPORT_COMMAND = /^\/(daily|weekly|monthly)(?:@[a-z0-9_]+)?(?:\s+(.+))?$/i;
const GREETING = /^(hi|hello|hey|halo|hai)[!.,\s]*$/i;
const WELCOME_MESSAGE = [
  "Hey! \u{1F44B} I’m Nadiyah’s Assistant — here to help you keep track of your work time.",
  "",
  "Send me a work log in plain English, for example:",
  "Worked on the landing page today for 2 hours.",
  "",
  "Here’s what I can do:",
  "/daily — today’s recap",
  "/weekly — this week’s recap",
  "/monthly August 2026 — a monthly recap",
  "/projects — your recent projects",
  "/cancel — discard an unfinished entry"
].join("\n");

function mergeDraft(draft: TelegramWorkDraft, extracted: Record<string, unknown>): TelegramWorkDraft {
  const next: TelegramWorkDraft = { ...draft };
  if (typeof extracted.title === "string" && extracted.title.trim()) next.title = extracted.title.trim();
  if (typeof extracted.project === "string" && extracted.project.trim()) next.project = extracted.project.trim();
  if (typeof extracted.workDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(extracted.workDate)) next.workDate = extracted.workDate;
  if (typeof extracted.startTime === "string") next.startTime = extracted.startTime;
  if (typeof extracted.endTime === "string") next.endTime = extracted.endTime;
  if (Number.isInteger(extracted.durationMinutes) && Number(extracted.durationMinutes) > 0) next.durationMinutes = Number(extracted.durationMinutes);
  if (["blue", "violet", "amber", "green"].includes(extracted.color as string)) next.color = extracted.color as TelegramWorkDraft["color"];
  return next;
}

function missingDraftDetails(draft: TelegramWorkDraft) {
  const missing: string[] = [];
  if (!draft.title) missing.push("what you worked on");
  if (!draft.workDate) missing.push("the date (for example, today or 21 September 2026)");
  if (!draft.durationMinutes) missing.push("the duration (for example, 90 minutes or 10:00 to 11:30)");
  return missing;
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null) as TelegramUpdate | null;
  const message = update?.message as NonNullable<TelegramUpdate["message"]>;
  if (!message?.text) return NextResponse.json({ ok: true });
  if (!allowedChat(message.chat.id)) return NextResponse.json({ ok: true });

  try {
    if (/^\/(start|help)(?:@[a-z0-9_]+)?\s*$/i.test(message.text) || GREETING.test(message.text.trim())) {
      await sendTelegramMessage(message.chat.id, WELCOME_MESSAGE);
      return NextResponse.json({ ok: true });
    }

    if (/^\/cancel(?:@[a-z0-9_]+)?\s*$/i.test(message.text)) {
      await clearTelegramDraft(message.chat.id);
      await sendTelegramMessage(message.chat.id, "All good — I cleared that unfinished entry.");
      return NextResponse.json({ ok: true });
    }

    if (/^\/(start|help)(?:@[a-z0-9_]+)?\s*$/i.test(message.text)) {
      await sendTelegramMessage(message.chat.id, "Hey! Send me a work log like: Worked on curriculum revision today from 10:00 to 12:30. I can also make reports with /daily, /weekly, or /monthly — try /monthly August 2026. ✨");
      return NextResponse.json({ ok: true });
    }

    if (/^\/projects(?:@[a-z0-9_]+)?\s*$/i.test(message.text)) {
      const projects = await getRecentProjects(getSupabaseAdmin());
      await sendTelegramMessage(message.chat.id, formatProjectList(projects));
      return NextResponse.json({ ok: true });
    }

    const reportCommand = message.text.match(REPORT_COMMAND);
    if (reportCommand) {
      const command = reportCommand[1].toLowerCase() as "daily" | "weekly" | "monthly";
      const period = parseReportPeriod(command, reportCommand[2], localToday());
      if (!period) {
        const example = command === "monthly" ? "August 2026 or 2026-08" : command === "weekly" ? "last week or 14 September 2026" : "yesterday or 21 September 2026";
        await sendTelegramMessage(message.chat.id, `Hmm, I did not catch that period. Try /${command} ${example}.`);
        return NextResponse.json({ ok: true });
      }
      const stats = await getWorkReport(getSupabaseAdmin(), period);
      const report = await generateWorkReport(stats, fallbackWorkReport(stats));
      await sendTelegramMessage(message.chat.id, report);
      return NextResponse.json({ ok: true });
    }

    const reportIntent = await detectReportIntent(message.text);
    if (reportIntent) {
      const period = parseReportPeriod(reportIntent.kind, reportIntent.periodArgument, localToday());
      if (period) {
        const stats = await getWorkReport(getSupabaseAdmin(), period);
        const report = await generateWorkReport(stats, fallbackWorkReport(stats));
        await sendTelegramMessage(message.chat.id, report);
        return NextResponse.json({ ok: true });
      }
    }

    if (/^\/(start|help)(?:@[a-z0-9_]+)?\s*$/i.test(message.text)) {
      await sendTelegramMessage(message.chat.id, "Send a natural-language work log, for example: ‘Worked on curriculum revision today from 10:00 to 12:30’. I’ll save it to Tempo.");
      return NextResponse.json({ ok: true });
    }

    const partialExtracted = await extractWorkSession(message.text);
    const draft = mergeDraft(
      await getTelegramDraft(message.chat.id),
      partialExtracted && typeof partialExtracted === "object" ? partialExtracted as Record<string, unknown> : {}
    );
    const missing = missingDraftDetails(draft);
    if (missing.length) {
      await saveTelegramDraft(message.chat.id, draft);
      await sendTelegramMessage(message.chat.id, `Nice, I have got the first part! I still need ${missing.join(", ")}. Send the missing details in one reply, or use /cancel.`);
      return NextResponse.json({ ok: true });
    }
    const completeSession = validateWorkSession({ ...draft, source: "telegram" });
    if (!completeSession) throw new Error("The completed Telegram draft could not be validated.");
    const { error: draftError } = await getSupabaseAdmin().from("work_sessions").insert({
      title: completeSession.title, project: completeSession.project, work_date: completeSession.workDate,
      start_time: completeSession.startTime, end_time: completeSession.endTime,
      duration_minutes: completeSession.durationMinutes, color: completeSession.color, source: "telegram"
    });
    if (draftError) throw draftError;
    await clearTelegramDraft(message.chat.id);
    await sendTelegramMessage(message.chat.id, `Done — I logged ${completeSession.durationMinutes} minutes for “${completeSession.title}” on ${completeSession.workDate}. Keep it going! ✨`);
    return NextResponse.json({ ok: true });

    const extracted = await extractWorkSession(message!.text!);
    const session = validateWorkSession(
      extracted && typeof extracted === "object" ? { ...(extracted as Record<string, unknown>), source: "telegram" } : null
    );
    if (!session) {
      await sendTelegramMessage(message.chat.id, "I couldn’t find a complete work session. Include what you worked on, a date, and a duration or start/end time.");
      return NextResponse.json({ ok: true });
    }

    const { error } = await getSupabaseAdmin().from("work_sessions").insert({
      title: session!.title, project: session!.project, work_date: session!.workDate,
      start_time: session!.startTime, end_time: session!.endTime, duration_minutes: session!.durationMinutes,
      color: session!.color, source: "telegram"
    });
    if (error) throw error;
    await sendTelegramMessage(message.chat.id, `Saved: ${session!.title} — ${session!.durationMinutes} minutes on ${session!.workDate}.`);
  } catch (error) {
    console.error("Telegram webhook failed", error);
    await sendTelegramMessage(message.chat.id, "Oops, that did not go through. Give it another try in a moment.").catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
