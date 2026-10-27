# Supabase — Liberty Ride

Database of record (derived state). The receipts table is the audit
trail; the booking state machine is the contract. Truth lives in the
receipts (`aspace.tape` / R10), Supabase mirrors it.

## Project

- URL: `https://lgvusahqkdwargrjrmmy.supabase.co`
- Project ref: `lgvusahqkdwargrjrmmy`
- Account sign-in: GitHub OAuth only. No password exists on the
  account. Do not "fix" that without the owner's decision.
- Dashboard: SQL Editor (migrations are applied by hand, in order).

## Apply order

1. `migrations/003_liberty_ride_v0_3.sql` (schema, enums, tables,
   R10 receipt functions, quote/commit RPCs, grants).
2. `migrations/004_create_driver_rpc.sql` (`create_driver(...)`
   SECURITY DEFINER, EXECUTE granted to `service_role`).

Before 003, on a fresh project, run once in the SQL Editor:

```sql
ALTER EXTENSION pgcrypto SET SCHEMA public;
```

(Applied 2026-10-26. If a new function later returns "not found"
from PostgREST after applying, run `NOTIFY pgrst, 'reload schema';`.)

## Schema (migration 003)

9 tables: `bookings`, `customers`, `drivers`, `fleet_logs`,
`internal_secrets`, `pricing_zones`, `quote_redemptions`,
`stripe_events`, `workgraph_receipts_r10`.

Enums: `service_type` (AIRPORT_CVG, MEDICAL_HOSPITAL, BUSINESS_EXEC,
LOCAL_TAXI), `ride_status` (10 states, see below), `payment_status`,
`pricing_model`, plus `account_type`, `partner_status`.

Conventions: `drivers.driver_ref TEXT UNIQUE`;
`drivers.telegram_user_id BIGINT UNIQUE` is a legacy column name —
the value is a numeric driver code (phone digits). There is no
Telegram function anywhere in this project.

## Booking state machine

REQUESTED → INTAKE_VALIDATED → LEASE_OFFERED_ATTEMPTED_UNKNOWN →
CONFIRMED_R10 (only on explicit driver acceptance, with a 5-minute
driver lease + fencing token). Also: LEASE_EXPIRED_ESCALATED,
DRIVER_REJECTED, NO_DRIVER_AVAILABLE, DRIVER_EN_ROUTE, COMPLETED,
CANCELLED. Escalation goes to the owner/manager, never to the
operator's personal channels.

## Key RPCs (SECURITY DEFINER, granted to `service_role`)

- `get_quote(...)` RETURNS NUMERIC.
- `issue_quote_token(service_type, distance_miles, pickup_address,
  dropoff_address, pickup_datetime, zone_code)` — 6 params.
- `commit_booking(...)` RETURNS JSONB — 15 params, lands in
  INTAKE_VALIDATED, calls `upsert_customer_by_phone` internally,
  `p_actor` default `'vapi'`, per-token idempotency.
- `offer_driver_lease(...)` RETURNS UUID (fencing token).
- `fn_authorize_driver_callback`, `confirm_driver_lease_by_token`,
  `reject_driver_lease_by_token`.
- `transition_booking(...)` — guarded transitions.
  NO_DRIVER_AVAILABLE and LEASE_EXPIRED_ESCALATED are workflow-only.
- `create_driver(...)` (migration 004).

## Grant doctrine (do not widen without a design decision)

- `service_role`: SELECT ONLY on 8 tables, NO direct writes,
  plus EXECUTE on the listed RPCs.
- RLS enabled everywhere. No public policies.
- The anon key reads almost nothing (bookings read → 401/42501
  for `anon` is expected).

## Pricing zones (reference)

ZONE_1 35 $, ZONE_2 45 $, ZONE_3 15 $ + 2.75 $/mile; medical
20 $ + 2.75 $/mile. Tariff grid labels are "(provisoire)" until the
owner signs the city→zone mapping.

## Secrets — never in this repo

- The `service_role` key is a master secret. It lives in the
  operator's Secure Vault / local `.env` (mode 600, gitignored).
  Never paste it in chat, files, or issues.
- `quote_hmac_secret` in `internal_secrets` is still a placeholder.
  Rotate it in the SQL Editor (open hygiene item).
- Test data only: fake `555` phone numbers. No real customer data
  in tests, seeds, or fixtures.
