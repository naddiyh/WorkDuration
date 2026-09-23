type TelegramMessage = { chat: { id: number }; text?: string; message_id: number };
export type TelegramUpdate = { message?: TelegramMessage };

export async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
  if (!response.ok) throw new Error("Telegram could not send the reply.");
}

export function localToday() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: process.env.WORK_DURATION_TIMEZONE || "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function extractWorkSession(message: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `Extract any stated details for one work-duration entry. Today is ${localToday()} in ${process.env.WORK_DURATION_TIMEZONE || "Asia/Makassar"}. Reply with JSON only: {"title":"string or null","project":"string or null","workDate":"YYYY-MM-DD or null","startTime":"HH:MM or null","endTime":"HH:MM or null","durationMinutes":"integer or null","color":"blue|violet|amber|green or null"}. Interpret only explicit relative dates such as today or yesterday. Never invent a title, date, duration, or time. Derive duration from an explicitly stated start/end range.` },
        { role: "user", content: message }
      ]
    })
  });
  if (!response.ok) throw new Error("Groq could not process the message.");
  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");
  return JSON.parse(content) as unknown;
}

export async function generateWorkReport(stats: Record<string, unknown>, fallback: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallback;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_completion_tokens: 250,
      messages: [
        { role: "system", content: "Write a concise, upbeat and friendly work report in casual English, at most two short paragraphs. Start naturally, such as 'Here is your recap 👀' when it fits. Use only the supplied facts. Do not invent numbers, dates, trends, causes, or advice that is not supported by the facts. A light encouraging closing is fine only when supported by the data. Use at most two fitting emojis. Do not use Markdown headings or bullet points." },
        { role: "user", content: JSON.stringify(stats) }
      ]
    })
  });
  if (!response.ok) return fallback;
  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  const report = body.choices?.[0]?.message?.content?.trim();
  // A partial model completion is worse than the factual fallback. A report
  // always contains at least one number (duration or session count).
  return report && report.length >= 80 && /\d/.test(report) ? report : fallback;
}

export type ReportIntent = {
  kind: "daily" | "weekly" | "monthly";
  periodArgument?: string;
};

export function mayBeReportRequest(message: string) {
  return /\b(recap|report|summary|summarize|summarise|activity|progress|show|share|list|what did i work|how was my work|what have i done)\b/i.test(message);
}

export function detectSimpleReportIntent(message: string): ReportIntent | null {
  if (!mayBeReportRequest(message)) return null;
  const input = message.toLowerCase();
  if (/\b(yesterday|kemarin)\b/.test(input)) return { kind: "daily", periodArgument: "yesterday" };
  if (/\b(today|this day|hari ini)\b/.test(input)) return { kind: "daily", periodArgument: "today" };
  if (/\b(last week|minggu lalu)\b/.test(input)) return { kind: "weekly", periodArgument: "last week" };
  if (/\b(this week|current week|minggu ini)\b/.test(input)) return { kind: "weekly", periodArgument: "this week" };
  if (/\b(last month|bulan lalu)\b/.test(input)) return { kind: "monthly", periodArgument: "last month" };
  if (/\b(this month|current month|bulan ini)\b/.test(input)) return { kind: "monthly", periodArgument: "this month" };
  const namedMonth = input.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|januari|februari|maret|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})\b/);
  return namedMonth ? { kind: "monthly", periodArgument: namedMonth[0] } : null;
}

export async function detectReportIntent(message: string): Promise<ReportIntent | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !mayBeReportRequest(message)) return null;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0,
      max_completion_tokens: 80,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Classify whether the user is asking for a personal work-time report or recap. Reply only with JSON: {\"kind\":\"daily|weekly|monthly|null\",\"periodArgument\":\"string|null\"}. Return null if it is not a request for a report. For daily use arguments such as today or yesterday; for weekly use this week or last week; for monthly use a month and year, this month, or last month. Do not classify a message that logs work as a report request."
        },
        { role: "user", content: message }
      ]
    })
  });
  if (!response.ok) return null;
  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as { kind?: unknown; periodArgument?: unknown };
    if (parsed.kind !== "daily" && parsed.kind !== "weekly" && parsed.kind !== "monthly") return null;
    return { kind: parsed.kind, periodArgument: typeof parsed.periodArgument === "string" ? parsed.periodArgument : undefined };
  } catch {
    return null;
  }
}
