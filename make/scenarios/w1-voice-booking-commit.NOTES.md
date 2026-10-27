# W1 Voice Booking Commit — blueprint notes

Scenario: **W1 Voice Booking Commit** (Liberty Ride, Make zone US2, team 3285635).
Broken predecessor: scenario **6792449**, built by clicking in the dashboard.
Its canvas connections were never part of the stored execution flow
(webhook ran alone; downstream modules reported
"references inaccessible module"). This blueprint reproduces the
**intended** flow with explicit wiring. It does not copy the broken
canvas state. A version named "Pre-rewire backup" exists in 6792449's
Version history; leave 6792449 untouched until the rebuilt scenario
verifies (see Import, below).

## 1. File format — read this before importing

`w1-voice-booking-commit.json` uses the **skills-canonical flat-list
grammar** from `make-scenario-building` (the same shape as that skill's
`examples/*.json`): one flat `modules` list, placement by `root` /
`follows` / `parent`, one `config` per module, `filter` on the first
module of each router arm. That grammar is what Make's
`scenario_create` / `scenario_patch` tools accept, and it is the only
scenario grammar documented in the skills available for this task.

It is **not** a byte-for-byte clone of a dashboard "Export blueprint"
envelope (`flow` + `metadata`). The dashboard export envelope is not
documented in the available skills, and its route-arm attachment
syntax — the exact thing that broke last time — was not
reverse-engineered from a live export in this files-only task.
Do not rename keys to guess at the export envelope. Use one of the
two import paths in §5.

## 2. Flow map

| ID | Module | Placement | Purpose |
|----|--------|-----------|---------|
| 1 | `gateway:CustomWebHook` v1 | `root: "main"` | Trigger. Generic JSON body, top-level fields (see §3). |
| 2 | `builtin:BasicRouter` v1 | `follows: 1` | Secret gate, two arms. |
| 3 | `http:ActionSendData` v3 | route arm 0 of 2, filter: match | `POST /rest/v1/rpc/issue_quote_token` (6 params). |
| 4 | `http:ActionSendData` v3 | `follows: 3` | `POST /rest/v1/rpc/commit_booking` (15 params). |
| 5 | `gateway:WebhookRespond` v1 | `follows: 4` | 200 + `{booking_id, status, fare}`. |
| 6 | `gateway:WebhookRespond` v1 | route arm 1 of 2, filter: mismatch | 401 + `{"error":"unauthorized"}`. |

Chain: `1 -> 2 -> (3 -> 4 -> 5)` on a secret match, `(6)` on a
mismatch. Exactly one arm runs per item (`text:equal` vs
`text:notequal` are mutually exclusive). No module references another
arm's modules (cross-arm references do not resolve — see the mapping
reference in `make-scenario-building`).

Webhook payload (top-level JSON fields, all from the caller):
`customer_name`, `customer_phone`, `service_type`, `pickup_address`,
`dropoff_address`, `pickup_datetime`, `flight_number`, `special_needs`,
`distance_miles`, `zone_code`, plus `idempotency_key`, `vapi_call_id`,
`estimated_duration_minutes` when present. No field is invented by
this scenario. Contract anchors: `~/workspace/liberty-ride/design_draft.md`
(BFF contract, status labels, pricing, phone +1 (859) 537-1827, no
Telegram / SMS / GPS / payment) and the BFF handler at
`~/workspace/liberty-ride/mono-repo/apps/api/src/index.ts` (~lines
247–283, `POST /api/bookings`: `issue_quote_token` then
`commit_booking`, `p_actor: 'web'` there, `'vapi'` here).

## 3. Assumptions (all untested live — verify at first run)

- **A1 — RPC response shape.** PostgREST returns a `RETURNS JSONB`
  function's value as a bare JSON **object**. Evidence: the BFF reads
  `q.body` as an object (`pickToken`/`pickFare` read `quote_token` /
  `fare` directly, no array handling). Success shape of
  `issue_quote_token`: `{status:'OK', fare, currency:'USD',
  quote_token, quote_id, zone_code, expires_at}`. Success shape of
  `commit_booking`: `{booking_id, customer_id, ride_status:
  'INTAKE_VALIDATED', estimated_fare, currency:'USD',
  idempotent_replay}` (replay returns the same keys with
  `idempotent_replay: true`). The blueprint hedges with
  `{{ifempty(N.data.<field>; first(N.data).<field>)}}` so a
  single-row array shape would also resolve. If the first live test
  errors on the hedge, replace with the direct object mapping
  (`{{N.data.<field>}}`) — the object shape is the evidenced one.
  Error shapes from `issue_quote_token` (`DISTANCE_REQUIRED`,
  `ZONE_REQUIRED`, `NO_BAND`) carry **no** token: the commit call
  then fails visibly. That is deliberate fail-closed behavior, not a
  silent wrong booking. There is no error-status branch by design.
- **A2 — Header extraction.** The webhook output bundle holds headers
  as an **array** of Name/Value collections (proven by run-log bundle
  inspection, 2026-10-27). The filters use
  `{{first(map(1.headers; "Value"; "Name"; "x-vapi-secret"))}}`
  with **capitalized** keys `Value`/`Name`, the variant observed in
  the bundle. The lowercase-key variant (`"value"`/`"name"`) was
  never tried; if the match arm never fires, try it first. A missing
  header resolves to empty, which falls through to the 401 arm.
- **A3 — `zone_code` is caller-supplied.** The mapping passes
  `{{1.zone_code}}` through. An empty/missing value becomes `""`,
  and `get_quote` treats `""` as a real zone (no band → `NO_BAND`
  → visible run error). The caller must always send `zone_code`
  (`'ALL'` when no specific zone). Do not default it inside the
  scenario: inventing a zone would invent a fare.
- **A4 — HTTP module shape unverified.** `http:ActionSendData` v3 and
  its mapper keys (`method`, `url`, `headers[]`, `bodyType`,
  `contentType`, `data`, `parseResponse`) were written from the
  skill examples' conventions, **not** confirmed via `module_spec`
  (no live access in this task). Before saving, run `module_spec`
  with `schemas: true` for `http:ActionSendData` and correct the
  version/field names from its `configurationSchema`. A refused
  save is a free dry run: fix everything in `errors` and resubmit.
- **A5 — "Get request headers" is not encoded.** The skills' webhook
  example uses `config: {}`. After import, open module 1 in the
  editor and confirm **Get request headers = Yes** — the Router
  filters read `1.headers`, and without it every call 401s.
- **A6 — WebhookRespond headers shape unverified.** The `headers`
  array in modules 5/6 follows the same `{name, value}` convention
  as the HTTP headers. Confirm in the editor that Content-Type
  `application/json` is set on both response modules.
- **A7 — Optional fields.** Absent string fields (`flight_number`,
  `special_needs`, `idempotency_key`, `vapi_call_id`) map to `""`
  and are stored as-is by `commit_booking` (it does not validate
  them; the quote verification only checks service, addresses,
  datetime, fare, zone). `p_estimated_duration_minutes` uses
  `{{ifempty(1.estimated_duration_minutes; "null")}}` so an absent
  value renders JSON `null` instead of breaking the body.
  `p_quoted_fare` is numeric and unquoted; `p_distance_miles` is
  required and unquoted (the BFF likewise rejects a missing or
  non-positive distance).
- **A8 — No idempotency invented.** `p_idempotency_key` and
  `p_vapi_call_id` pass through only when the caller sends them.
  `commit_booking` itself is idempotent per quote token (a retry
  with the same token returns the same booking with
  `idempotent_replay: true`, never a duplicate).

## 4. Placeholders — the owner fills these, nobody else

| Placeholder | Appears in | Fill with |
|-------------|-----------|-----------|
| `PASTE_VAPI_SHARED_SECRET_HERE` | Both Router filters (modules 3 and 6, condition `b`). | The shared secret the owner chooses. The **same** value must later go in the Vapi tool's `x-vapi-secret` header. Never in chat. |
| `PASTE_SUPABASE_SERVICE_ROLE_KEY_HERE` | HTTP modules 3 and 4: `apikey` header and `Authorization: Bearer …` header. | The Supabase **service_role** key for project `lgvusahqkdwargrjrmmy`. Never in chat; the owner pastes it from their own records. |

No other placeholder exists in the file. Grep-verified: no real
key, token, JWT, or `hsurr:` surrogate appears anywhere.

## 5. Import steps (for a later browser/MCP task)

**Path 1 — preferred (MCP, exact shape).**

1. `environment_get` → confirm `organizationId`/`teamId` (file says
   team 3285635; correct it from the call if it differs).
2. `module_spec` with `schemas: true` for `http:ActionSendData`,
   `gateway:CustomWebHook`, `gateway:WebhookRespond`,
   `builtin:BasicRouter`; correct versions/field names per §3 A4–A6.
3. `scenario_create` with this file's contents as the argument,
   `autoActivate` off. Fix every item in `errors` and resubmit;
   relay `warnings`. Verify from the response's `modules` echo.
4. In the editor, confirm module 1 "Get request headers" = Yes
   (A5) and both response modules carry Content-Type (A6).
5. `scenario_trigger_learn` → send one fake request (see §6) →
   `scenario_trigger_inspect` to confirm the learned structure,
   then patch mappings only if a field name differs.
6. Activate, test per §6, and only then consider 6792449: leave it
   inactive (its "Pre-rewire backup" version stays as fallback).
   **A new scenario gets a new webhook URL** — record it; the
   Vapi tool re-point is a separate step and is not done here.

**Path 2 — dashboard rebuild (if MCP import is unavailable).**

1. Create a NEW scenario (do not edit 6792449 in place).
2. Add the six modules in ID order, wiring each one exactly as §2
   (solid connector lines, not dotted). Set the Router filters and
   every mapping verbatim from the JSON file.
3. Confirm zero module issues in the editor before saving.
4. Continue from Path 1 step 4.

**Do not** import into 6792449 by overwriting it: the broken canvas
state and the backup version must survive until the rebuild is
verified end to end.

## 6. Test procedure (fake data only)

Payload (all values fake/test, as used in every earlier canary):

```json
{
  "customer_name": "Test Rider",
  "customer_phone": "859-555-0100",
  "service_type": "MEDICAL_HOSPITAL",
  "pickup_address": "CVG",
  "dropoff_address": "Covington",
  "pickup_datetime": "2026-10-28T15:00:00Z",
  "distance_miles": 10,
  "zone_code": "NKY"
}
```

1. **Before secrets are filled:** send the payload with header
   `x-vapi-secret: PASTE_VAPI_SHARED_SECRET_HERE` (the literal
   placeholder). Expected: the run history shows **all** modules
   1–5 executing (this is the check that kills the original bug —
   a webhook-only run means the wiring is broken again), and the
   HTTP modules fail authentication at Supabase. That failure is
   expected and proves the flow reaches Supabase.
2. Send the same payload with a wrong header value. Expected: only
   modules 1, 2, 6 run; response 401 `{"error":"unauthorized"}`.
3. **After the owner fills both secrets:** repeat test 1 with the
   real secret. Expected: HTTP 200 with `booking_id`, `status`
   `INTAKE_VALIDATED`, `fare` — and the booking row exists in
   Supabase. Confirm the response body references module 4's
   output (the previous build referenced stale `4.data` while the
   commit module was ID 7; this blueprint references `4.data`
   because the commit module **is** ID 4 here).
4. Never test with a real customer phone number, a real driver, or
   a real pickup time. Test bookings stay in the database as audit
   rows; never delete them to hide a test.

## 7. Toolbox reality check (not a verification step)

The MCP toolbox named "Muse" refuses this scenario: its Add dialog
says "Only active scenarios with on-demand scheduling can be
selected", and this scenario schedules "Immediately as data
arrives" (webhook). A webhook-triggered scenario is a different
integration pattern from a toolbox tool. Do not list "add to the
toolbox" as a completion criterion for this blueprint, and do not
change the scheduling to on-demand to force it — that would break
the webhook. How (or whether) an agent invokes this flow via MCP is
a separate design decision for the parent agent.

## 6. VERIFIED — rebuild v2 live (2026-10-27, ~06:01–06:13 EDT)

The blueprint file was rewritten to the verified live shape and the
scenario was created via the Make management MCP server
(`scenario_create`, first try, zero errors):

- Live scenario: **"W1 Voice Booking Commit v2", ID 6793518**,
  webhook `https://hook.us2.make.com/ud1125jgbr54ieqs46nuert9jbvagyid`,
  team 3285635, scheduling `immediately`, created active.
- Corrections vs. the draft: HTTP modules are `http:MakeRequest` v4
  (not `http:ActionSendData` v3); `parameters.authenticationType:
  "noAuth"`; body via `contentType: "json"` +
  `inputMethod: "jsonString"` + `jsonStringBodyContent` (no explicit
  Content-Type header — Make sets it); WebhookRespond headers use
  `{key, value}` (not `{name, value}`).
- **Editor pass was REQUIRED** (browser, 06:07–06:10 EDT): the
  API-created webhook emitted the body as one raw string with no
  mappable field, and `scenario_trigger_learn` did not change the
  emitted bundle even after re-save + deactivate/reactivate. In the
  editor: webhook module → Advanced settings → "Get request headers"
  = Yes → "Detect new values" with a real request → 10 body fields
  detected → scenario saved (lastEdit 2026-10-27T10:10:32Z).
- **Gate fix (API patch, verified)**: headers do NOT arrive as
  `1.headers`. They arrive as `1.__IMTHEADERS__`, an array of
  `{name, value}` with LOWERCASE keys. Working filter:
  `{{first(map(1.__IMTHEADERS__; "value"; "name"; "x-vapi-secret"))}}`
  with `text:equal` / `text:notequal`. The `1.headers` form from the
  dashboard-built v1 was never proven and is wrong.
- **End-to-end wiring PROVEN** (test-w1-mcp-006, fake data, placeholder
  secret header): gate passed; module 3 `issue_quote_token` ran with
  all `{{1.*}}` mappings resolved (service, 10 miles, addresses,
  datetime, zone NKY); its call reached Supabase and was refused
  `InvalidConfigurationError "Unauthorized"` — the EXPECTED failure
  while the Supabase key placeholder is unfilled. This proves
  webhook → parse → gate → HTTP → Supabase.
- **Make auto-stopped v2** after that errored run (status `error`,
  `isActive: false` in `scenario_list`). REACTIVATE after the secrets
  are filled, then retest to a real booking id. Do not leave it
  inactive once secrets are in.
- Probe scenario 6793538 + its tests are deleted. Data structure
  555278 "W1 voice booking payload" (11 fields incl. `shared_secret`)
  remains, unused by v2 — kept for reference; v2 parses via the
  webhook's own detected structure, not via a ParseJSON module.
- Remaining before Vapi cutover: owner fills the 2 placeholders in
  the editor (service_role key in 4 header values across 2 HTTP
  modules; self-chosen shared secret in 2 filter values), reactivates
  v2, retests to a real booking id + Supabase receipts. Then fix the
  Vapi tools (parameters + header) and re-point them at the v2
  webhook URL above. Scenario 6792449 stays untouched until then.
