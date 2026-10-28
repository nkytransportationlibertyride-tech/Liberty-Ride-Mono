# W0 — Credential plane (layer zero)

W0 is configured BEFORE any workflow (W1–W8) runs, and re-verified
before any workflow is rebuilt. It is the only solution to the
human-clicker bottleneck: every credential is authorized ONCE, in its
own home, probed, and inventoried — then workflows run with zero
human clicks. OAuth consent and 2SV prompts are inherently human;
W0 batches them into ONE bootstrap session plus durable approvals
("always allow" on recurring cards), instead of one paste/click per
workflow per incident.

## Rules

1. No literal secret in any scenario, code, doc, issue, or log.
   Placeholders only (`PASTE_...`). A secret lives in exactly ONE
   home: a Make connection, a Composio connected account, or a Secure
   Vault connector entry. Never a second copy.
2. If a paste "didn't take", the proof is the home's own state
   (scenario `lastEdit`, connection list, probe result) — re-do the
   paste in the SAME home. Do not open a second copy in another home:
   two copies is how the 2026-10-28 dissonance happened (Make headers
   vs vault entry tested as if they were one thing).
3. Probe before use. A connection is "configured" only after a real
   call through it succeeds (booking id, 200, receipt). "Created" is
   not "verified".
4. One home per direction: Make scenarios use Make connections;
   A0's direct API calls use vault connector entries; Composio
   actions use Composio connected accounts. A vault entry can never
   inject a value into a Make module, and 1Password cannot hand an
   API key to anyone — it only fills website logins in a browser.

## Inventory (status = last live probe, values never recorded)

| Credential | Home | Status |
|---|---|---|
| Supabase service_role (Liberty Ride) | Make connection "Liberty's Supabase connection", ID 12014112 | VERIFIED 2026-10-28 — W1 v3 booking `f385d248-…`, 47.50 $, INTAKE_VALIDATED |
| Supabase service_role (Liberty Ride) | Vault `custom.supabase-liberty-ride-service-role` | HOLDS ANON (bookings 401/42501, re-verified 2026-10-28) — A0 checks only, does NOT block Make. Do not re-ask. |
| Supabase anon (Liberty Ride) | Vault `custom.supabase-liberty-ride` | VERIFIED (schema + RPC list readable; bookings 401 by grant doctrine) |
| Make management MCP token | Vault `custom.make` (MCP server) | VERIFIED — scenario builds, activations, execution reads |
| Make toolbox MCP key | Vault `custom.make-mcp` | VERIFIED — webhook scenarios cannot join the toolbox (on-demand only) |
| Vapi shared secret | Make filter values (v3, 2 arms) + Vapi tool header (later) | PLACEHOLDER — owner chooses one value; same value both sides |
| Vapi account | `amdkn777@gmail.com` today → `nkytransportationlibertyride@gmail.com` | MIGRATION PENDING — after Make verifies |
| Composio | Account + connected accounts | PENDING — owner Google sign-in; decision: Composio first, 30 days, 1-day PoC |
| Supabase `quote_hmac_secret` | `internal_secrets` table | ROTATION OPEN (placeholder still stored) |
| Production OWNER_KEY (BFF admin) | Nowhere yet | UNSET (intended — admin routes 503) |

## Make vs Composio — comparison and fusion

Make is the flow engine: webhooks, routers, filters, stable business
flows (voice booking, driver lease), native app modules, connections
that carry auth. Its limits: visual scenarios, Free-plan 2 active,
no SaaS catalog beyond its own apps, no agent-native exposure
(webhook scenarios cannot join an MCP toolbox).

Composio is the SaaS action catalog: 1,500+ toolkits, managed OAuth
(connected accounts authorized once), triggers, per-session hosted
MCP URLs, SDK/API access. Its limits: it is not a flow engine —
no routers, no visual branching, no durable scenario state.

Fusion (decided 2026-10-28, Gateway-of-Gateways research): the Rust
gateway (BedRock kernel) is the boss — filtering, approvals, receipts
in Supabase. Composio is the catalog it calls for SaaS actions.
Make runs the stable business flows and calls Composio actions via
HTTP/MCP where a native module does not exist; Composio triggers can
start Make scenarios via webhook. W0 credentials feed both planes:
each platform holds its own authorizations, configured once, probed
from W0, never pasted into a flow.

## W0 session checklist (one sitting, then zero clicks per run)

- [ ] Make connections: Supabase (done), plus one per SaaS app as
      flows need them. Record ID + probe result here.
- [ ] Vault entries: one per credential, named by role
      (`…-service-role` vs anon). Probe each; record role, not value.
- [ ] Composio connected accounts: one per SaaS app. Record toolkit
      + account, never tokens.
- [ ] Shared secrets (Vapi): one value, both sides, recorded as
      "set" with date — never the value.
- [ ] Durable approvals: "always allow" on recurring cards
      (Tailscale, Make MCP, vault egress) so runs don't stall on
      a human tap.
