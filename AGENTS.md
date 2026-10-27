# AGENTS.md — Liberty Ride handover (read this first)

This repo is the whole Liberty Ride system in one place, so that any
agent can resume the work without tribal knowledge. If anything here
disagrees with a live dashboard or API, the live source wins — verify
before acting, and fix this file when you learn better.

## What this is

Liberty Ride NKY Trans, LLC — Northern Kentucky / CVG airport,
medical, business, and local taxi transport. The business belongs to
a friend of the operator; the operator builds and runs the system.
Public site: erlangertaxiservice.com. Public phone: +1 (859) 537-1827.
Voice line (Vapi): +1 (859) 997-6581 — which number is public is an
open owner decision (default: 537-1827 everywhere).

Judge this project by the business first: rides on time, drivers who
accept and get paid, an owner who sees revenue and decides,
reputation that brings customers back. Plumbing is only a means.

## Map

- `apps/site`, `apps/clients`, `apps/drivers`, `apps/admin` — V1
  interfaces (Stitch / AI Studio build, 2026-10-27). English UI.
  Deployed on Vercel (see `VERCEL.md`).
- `apps/api` — BFF (Bun, zero deps, port 3001). Fail-closed:
  production + empty ALLOWED_ORIGINS refuses to start. Owner routes
  need OWNER_KEY. Never commit `apps/api/.env`.
- `packages/` — shared `@liberty/types`, `@liberty/ui`.
- `supabase/` — database: migrations, grant doctrine, RPC contract.
- `make/` — Make scenarios (W1 voice booking commit), runbooks.
- `vapi/` — voice configs (assistant, squad, tools, phone).
  Secret-free exports. Vapi is the voice; Twilio and Telegram are
  OUT, permanently.
- `docs/` — product spec (`design_draft.md`) and decision record
  (`ADR-decisions.md`). The spec is the design authority.

## Accounts (business vs personal — never mix)

| Service | Business account | Personal / other |
|---|---|---|
| GitHub | `nkytransportationlibertyride-tech` (this repo, private) | Amdkn — separate |
| Vercel | `nkytransportationlibertyride@gmail.com` (team, 5 projects) | — |
| Supabase | GitHub-OAuth-only account, project `lgvusahqkdwargrjrmmy` | Separate A'Space project — never cross-connect |
| Make | "Liberty Ride Ky", `nkytransportationlibertyride@gmail.com`, US2 | Personal Make: `amdkn777@gmail.com` — separate |
| Vapi | Migrating TO `nkytransportationlibertyride@gmail.com` | Currently `amdkn777@gmail.com` (assistant, squad, tools, number) — migration after Make verifies |

## Live state (verify via API before acting)

- Vercel: 5 projects deployed (api, site, clients, drivers, admin).
  Redeploy after any `apps/` change; check each URL returns 200.
- Make W1 v2 (6793518): wiring verified, secrets unfilled, inactive.
  Owner fills secrets per `make/runbooks/fill-secrets.md`, then
  reactivate + retest to a real booking id.
- Vapi: tools still point at n8n webhooks (Tailscale funnel) and
  fail the secret check; tool definitions have no parameters yet.
  Re-point + add parameters only after Make verifies. n8n stays
  alive until the verified cutover.
- Supabase: migration 003 + 004 applied. `quote_hmac_secret`
  rotation still open. Production OWNER_KEY unset (admin routes
  503 until set — intended).
- Open owner decisions: public-line number, tariff grid sign-off,
  insurer validation (medical transport), first real drivers,
  production OWNER_KEY, public domain cutover. No live-customer
  activation or real-number test without the owner's explicit go.

## Hard rules

1. Secrets never in this repo, in chat, in issues, or in logs.
   Placeholders only (`PASTE_...`). The `service_role` key travels
   only through the Secure Vault / local `.env` (mode 600).
2. Test data only: fake `555` numbers (Test Rider 859-555-0100,
   Canary Driver 859-555-0101). No real customer data in tests.
3. Receipts are truth: every booking action writes an R10 receipt;
   state transitions are guarded; CONFIRMED_R10 only on explicit
   driver acceptance with a 5-minute lease + fencing token.
4. Escalation goes to the owner/manager. Zero babysitting: never
   route operations to the operator's personal channels.
5. Verify, don't narrate: API responses and execution records
   decide (merge method = parent count; webhook registered = real
   call answered; scenario green = run reached Supabase). A 404 is
   not proof of absence. Created is not deployed.
6. Deposit work here, in Drive/GitHub/Linear, without waiting for
   a separate "go" — depositing is part of the task. Production
   switches (Vapi re-pointing, n8n off, live customers) still need
   the owner's explicit go.

## How to resume

1. Read this file, then the README in each directory you will touch.
2. Check live state: GitHub main HEAD, Vercel deployments, Make
   scenario list, Supabase RPC smoke test (`get_quote`).
3. Do the work, verify with real calls, update the docs you touched
   in the same change. Leave the repo greener than you found it.
