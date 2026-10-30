# SoftMinibot persistent worker — initial scaffold

This Node.js service is intended for an always-on host such as Railway or Render.

## Current implementation
- `GET /health` health check.
- Polls Supabase for expired pairing requests and marks them expired.
- Uses a server-side Supabase secret key; no secret is exposed to the browser.
- Fails startup if required credentials are missing.

**This is NOT yet a WhatsApp connection engine.** It does not create pairing codes, QR codes, store sessions, or respond to messages. The health endpoint reports `mode: scaffold` deliberately.

## Deploy
- Working directory: `platform/apps/worker`
- Install: `npm install`
- Start: `npm start`
- Environment: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, optional `PORT`, `POLL_INTERVAL_MS`
- Restrict worker secret access to the worker hosting service only.

## Planned secure architecture
- Support `personal` and `business` bot profiles, with per-tenant configuration and consent-based messaging.
- A session manager with durable encrypted credentials per bot; never store credentials in browser-accessible database rows.
- One process/lease owner per WhatsApp session, reconnect with backoff and idempotent message handling.
- Worker-generated short-lived pairing artifacts delivered through an authenticated API.
- Authorization, rate limiting, audit trails, message opt-in, and group administrator permissions.
- Consider the official WhatsApp Business Platform for compliant business messaging; unofficial WhatsApp Web automation may cause account restrictions.
