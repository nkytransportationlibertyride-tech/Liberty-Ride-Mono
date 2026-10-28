# Make — Liberty Ride

Automation layer. Make scenarios receive Vapi voice bookings (webhook)
and commit them to Supabase. n8n still runs the live voice path until
the verified cutover — see "Cutover" below.

## Account — do not confuse the two Makes

- **This account (Liberty Ride):** "Liberty Ride Ky",
  `nkytransportationlibertyride@gmail.com`, org 9421151
  ("My Organization"), team 3285635 ("My Team"), zone US2, Free plan.
- **Personal Make (separate):** `amdkn777@gmail.com`.
  Never create, edit, or test Liberty Ride scenarios there, and never
  mix the two accounts.

## Scenarios

| ID | Name | State | Webhook |
|---|---|---|---|
| 6792449 | W1 Voice Booking Commit | ACTIVE (legacy, dashboard-built) | `https://hook.us2.make.com/ju0gmo6ihjcgznm32ty6h8bumxiqnvrn` |
| 6793518 | W1 Voice Booking Commit v2 | INACTIVE (superseded by v3) | `https://hook.us2.make.com/ud1125jgbr54ieqs46nuert9jbvagyid` |
| 6817797 | W1 Voice Booking Commit v3 | ACTIVE (verified — Supabase connection, no literal keys) | `https://hook.us2.make.com/jui46xdyx8r3pu3dlovk46hr4idvb9my` |

- 6817797 (v3): built via the Make scenario-management MCP server
  from `scenarios/w1-v3-connection.json`, then an editor pass
  (headers + 10-field detection). Modules 3–4 are
  `supabase:makeAnApiCall` on connection 12014112 ("Liberty's
  Supabase connection"). Verified 2026-10-28: fake booking
  `f385d248-…`, INTAKE_VALIDATED, 47.50 $. See
  `scenarios/w1-v3-connection.NOTES.md`. Credentials live in W0 —
  see `W0-CREDENTIALS.md`.

- 6792449: built by clicking. Its canvas links were never part of the
  stored execution flow (webhook ran alone). Do NOT edit it. It stays
  live until the v2 cutover is verified.
- 6793518 (v2): built via the Make scenario-management MCP server
  from `scenarios/w1-voice-booking-commit.json` (verified shape:
  `http:MakeRequest` v4, `authenticationType: "noAuth"`, JSON-string
  bodies, WebhookRespond headers as `{key, value}`). Wiring proven
  end to end with fake data (test-w1-mcp-006): webhook → gate →
  `issue_quote_token` → Supabase refused "Unauthorized" (expected:
  placeholder key). See the NOTES file for the full verification log.

## Placeholders (v2 only — v3 carries no literal keys)

- v2 `PASTE_SUPABASE_SERVICE_ROLE_KEY_HERE` — 4 header values across
  the 2 HTTP modules. Superseded: v3 uses the Supabase connection
  (W0). Do not fill v2.
- `PASTE_VAPI_SHARED_SECRET_HERE` — 2 filter values (gate arms, v2
  and v3). The owner chooses this secret; the same value goes into
  the Vapi tool header later. Runbook: `runbooks/fill-secrets.md`.

## Two facts that cost hours — read before touching webhooks

1. A webhook created via API emits the body as ONE raw string with
   no mappable field. One editor pass is required: open the webhook
   module → Advanced settings → "Get request headers" = Yes →
   "Detect new values" with a real request → save. Only then do
   `{{1.<field>}}` mappings resolve.
2. Headers arrive as `1.__IMTHEADERS__` (array of `{name, value}`
   with LOWERCASE keys) — NOT `1.headers`. Gate filter:
   `{{first(map(1.__IMTHEADERS__; "value"; "name"; "x-vapi-secret"))}}`.

## Limits

- Free plan: max 2 ACTIVE scenarios. Deactivate a superseded
  scenario before activating another.
- Webhook scenarios cannot be added to the "Muse" MCP toolbox
  (on-demand scheduling only). Do not treat toolbox exposure as a
  completion criterion for W1.

## Cutover (n8n → Make)

n8n (8 workflows, Amd-PC + Tailscale funnel) STAYS ALIVE until the
verified cutover: v3 active + real booking id + Supabase receipts,
then Vapi tools re-pointed to the v3 webhook, then n8n off. Voice-path gaps carried over: shared Vapi secret on
both sides, driver-selection rework, Google Maps key for voice
quotes. Twilio and Telegram are OUT, permanently — confirmations
and driver lease offers are Vapi voice calls.
