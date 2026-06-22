# Telegram Assistant Setup

## 1. Supabase table

Run this SQL in Supabase SQL Editor:

```sql
-- See database/create_telegram_users.sql
```

## 2. Environment variables

Add these to `.env.local` and to the production hosting environment:

```env
TELEGRAM_BOT_TOKEN=0000000000:replace_with_botfather_token
TELEGRAM_WEBHOOK_SECRET=replace_with_random_secret
TELEGRAM_LINK_CODE=replace_with_private_link_code
TELEGRAM_LINK_ALLOWED_TELEGRAM_IDS=8119145994
TELEGRAM_ALLOWED_CHAT_IDS=
TELEGRAM_DEFAULT_USER_ID=
NEXT_PUBLIC_APP_URL=https://unecorailelectric.vercel.app
```

Notes:

- `TELEGRAM_ALLOWED_CHAT_IDS` is optional. Use comma-separated chat IDs to restrict access.
- `TELEGRAM_LINK_ALLOWED_TELEGRAM_IDS` is optional. Use comma-separated Telegram user IDs that are allowed to run `/link`.
- `TELEGRAM_DEFAULT_USER_ID` is optional. If set, an unlinked allowed chat can query as that user.
- `TELEGRAM_LINK_CODE` is required for `/link userId code` when set.

## 3. Register webhook

After deployment, call:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://unecorailelectric.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

## 4. Telegram commands

```text
/start
/link 사용자ID 연결코드
오늘 일정
이번 주 일정
누락 업무일지
```

The first version is read-only. It does not create, update, or delete schedules.
