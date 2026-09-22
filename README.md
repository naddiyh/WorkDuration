# Tempo — Work Duration

A responsive work-duration dashboard built with Next.js and pnpm. Route handlers in `app/api` deploy as Vercel Functions automatically.

## Local setup

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in the project URL, **service role key**, and a unique API key.
4. Add the same three environment variables to Vercel, then redeploy.

`SUPABASE_SERVICE_ROLE_KEY` is server-only: do not prefix it with `NEXT_PUBLIC_` and never place it in browser code.

## Nadiyah login and boss monitoring

- `/` and `/manage` are private management pages. Nadiyah signs in using a Supabase magic link.
- `/share/<BOSS_SHARE_TOKEN>` is a read-only monitoring page for the boss. Do not share the token publicly.
- In Supabase Auth, disable new-user signups after creating Nadiyah's account, so only her email can receive a sign-in link.

Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `BOSS_SHARE_TOKEN` to Vercel alongside the existing variables. Configure your production URL in Supabase Auth's redirect URL list, for example: `https://your-domain.com/auth/callback`.

## Serverless API

`GET /api/status` is a deployment status check.

`GET /api/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD` lists sessions. `POST /api/sessions` creates one. In production both require:

```text
Authorization: Bearer <WORK_DURATION_API_KEY>
```

Example payload:

```json
{
  "title": "Weekly problem review",
  "project": "Deep work",
  "workDate": "2026-07-27",
  "startTime": "08:00",
  "endTime": "09:00",
  "durationMinutes": 60,
  "color": "blue",
  "source": "api"
}
```

The API key is designed for the later Telegram/Groq integration. For multi-user dashboard access, add Supabase Auth and RLS policies before exposing it publicly.

## Telegram + Groq logging

The protected webhook at `POST /api/telegram/webhook` accepts normal Telegram messages, asks Groq to extract a work session, stores it in Supabase, and confirms the saved duration in Telegram.

1. Add the Telegram and Groq variables from `.env.example` to Vercel.
2. Set `TELEGRAM_ALLOWED_CHAT_IDS` to your own Telegram numeric chat ID before enabling the webhook.
3. Deploy, then register the webhook (replace the placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://<YOUR-VERCEL-DOMAIN>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message"]'
```

Then send the bot a message such as: `Worked on curriculum revision today from 10:00 to 12:30.`
