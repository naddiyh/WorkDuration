import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type TelegramWorkDraft = {
  title?: string;
  project?: string;
  workDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number;
  color?: "blue" | "violet" | "amber" | "green";
};

export async function getTelegramDraft(chatId: number) {
  const { data, error } = await getSupabaseAdmin()
    .from("telegram_work_drafts")
    .select("draft")
    .eq("chat_id", chatId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return (data?.draft || {}) as TelegramWorkDraft;
}

export async function saveTelegramDraft(chatId: number, draft: TelegramWorkDraft) {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { error } = await getSupabaseAdmin().from("telegram_work_drafts").upsert({
    chat_id: chatId,
    draft,
    expires_at: expiresAt,
  });
  if (error) throw error;
}

export async function clearTelegramDraft(chatId: number) {
  const { error } = await getSupabaseAdmin().from("telegram_work_drafts").delete().eq("chat_id", chatId);
  if (error) throw error;
}
