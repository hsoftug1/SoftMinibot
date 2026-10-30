# SoftMinibot Web

Next.js App Router frontend for the dedicated SoftMinibot Supabase project.

## Setup

1. Set Vercel Root Directory to `platform/apps/web`.
2. Configure these Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL=https://gaisaoxkbvzgglroetzj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (retrieve from the Supabase project's API Keys screen; publishable, not secret).
3. In Supabase Authentication URL Configuration, set the Vercel site URL and allow `https://YOUR-DOMAIN/auth/callback` as a redirect URL. Include preview domains as needed, using restrictive patterns.
4. Enable email confirmation and configure SMTP before production usage.
5. Install dependencies and run `npm run build`.

## Current limitations

- Pairing request records are stored, but QR codes and actual WhatsApp pairing require a separate persistent worker.
- Workspace access relies on the Supabase RLS policies in `platform/database/002_supabase_auth_rls.sql`.
- Vercel deployment and full end-to-end tests are pending.
- Do not place WhatsApp session secrets or Supabase secret/service-role keys in NEXT_PUBLIC variables.
