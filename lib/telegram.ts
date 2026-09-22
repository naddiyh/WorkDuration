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

function localToday() {
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
        { role: "system", content: `Extract one work-duration entry. Today is ${localToday()} in ${process.env.WORK_DURATION_TIMEZONE || "Asia/Makassar"}. Reply with JSON only: {"title":"string","project":"string","workDate":"YYYY-MM-DD","startTime":"HH:MM or null","endTime":"HH:MM or null","durationMinutes":number,"color":"blue|violet|amber|green"}. Interpret relative dates using today. Use duration from stated time range; if no duration is stated, return durationMinutes: 0.` },
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
