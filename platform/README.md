# SoftMinibot Platform

SoftMinibot is a proposed multi-tenant management platform for the existing WhatsApp bot.

## Components
- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS — public site, pairing flow and dashboard (planned).
- `apps/api`: Node.js API — authentication, bot ownership, settings, audit events (planned).
- `apps/worker`: isolated Baileys worker processes per account, migrated from the current root bot (planned).
- PostgreSQL: users, tenants, bot instances, pairing requests and audit events.
- Redis: ephemeral pairing challenges, rate limits and job coordination (planned).

## Trust boundaries
1. Every authenticated request is scoped to a tenant and checked for bot ownership.
2. WhatsApp credentials must be encrypted at rest using a managed encryption key; never store them in the public web app or log pairing secrets.
3. Pairing requires authenticated ownership, explicit consent, short expiration, and rate limiting.
4. Only a designated worker may decrypt an instance's WhatsApp credentials.
5. Each tenant gets isolated queues, session state and quotas.
6. Session revocation, disconnect and account deletion must be supported.
7. No bulk unsolicited messaging or evasion of WhatsApp restrictions.
8. Audit sensitive operations without logging message bodies or secrets.

## Implementation sequence
1. Inventory original bot commands, embedded URLs, configuration and license.
2. Implement schema and authentication with tenant-scoped authorization.
3. Extract bot runtime into managed workers; remove hard-coded single-session assumptions.
4. Implement pairing state machine and event updates.
5. Build dashboard and public landing page.
6. Add integration tests for cross-tenant access, session isolation and recovery.
7. Stage deployment before production release.

## Current status
Architecture and initial schema only. No pairing site, dashboard, backend or multi-user runtime is operational yet.
