# vapi/ — voice configs (secret-free)

Status: MIGRATION PACK READY 2026-10-29 (`migration/`). The live
dashboard inventory WAS harvested 2026-10-27 (05:26 and 09:27 EDT)
and is recorded in `live-inventory-2026-10-27.md`; the full live
harvest of 2026-10-28 (prompts verbatim, models, voices, phone,
Sheets tool) is recorded in `live-harvest-2026-10-28.md`. Do not
treat the reference files as a live export.

## What each file is

- `assistant-receptionist.reference.json` — assistant
  « Liberty Ride - B3-VapiReceptionist » reconstructed from
  `v0.3-artifacts/vapi_assistant_payload.json` (first message, system
  prompt, voice Elliot / Vapi, transcriber Deepgram nova-2 en,
  model gpt-4o, temperature 0.3, 600 s max). Server URL/secret are
  `PASTE_...` placeholders: the V0.3 payload pointed at n8n, which is
  being replaced. No secret in this folder.
- `tools/get-quote.json` — `get_quote` function definition, verbatim
  parameters from the payload (4 required, 2 optional). Target URL is
  `PASTE_MAKE_QUOTE_WEBHOOK_HERE` in this reference file: the real
  target is the Make W02 webhook (6825545, verified 2026-10-29) —
  see the migration pack `01-tool-get-quote.json`. Do NOT point this
  tool at any W1 webhook — W1 re-issues a token and commits; it is
  not a quote-only endpoint.
- `tools/create-booking-commit.json` — `create_booking_commit`
  definition, verbatim parameters (9 required, 3 optional). Target:
  the verified W1 v3 webhook
  `https://hook.us2.make.com/jui46xdyx8r3pu3dlovk46hr4idvb9my`
  (scenario 6817797; the old v2 URL was fixed 2026-10-29), header
  `x-vapi-secret` = the shared secret the owner chooses. See the W1
  gap in `live-inventory-2026-10-27.md`.
- `live-inventory-2026-10-27.md` — what the live dashboard
  actually holds (verified 2026-10-27). The live tool definitions
  are EMPTY (no parameters, headers or auth) — the reference files
  above are what must be REBUILT in the business account, not what
  live is.
- `live-harvest-2026-10-28.md` — full live harvest (prompts
  verbatim, models, voices, transcribers, phone, Sheets tool,
  archive list) plus gaps found vs. the real system, with proposed
  corrections NOT applied.
- `squad.md` — squad members, Sheets/Docs state, phone number.

## Migration sequence (GO 2026-10-29 — pack in `migration/`)

1. Make migration complete and verified to the channel boundary
   (2026-10-29). W1 v3 + W02 verified with fake data.
2. Recreate tools + assistants + squad in the business Vapi
   account (`nkytransportationlibertyride@gmail.com`) from
   `migration/`; establish whether that account exists and what
   happens to +1 859 997-6581 (transfer or new purchase) — number
   fate is OPEN in `migration/08-phone-and-sms.OPEN.md`.
3. Only then cut over live traffic, with the owner's explicit go.
   n8n stays alive until the verified cutover. No live-customer
   activation or real-number test without the owner's explicit go.

## Hard rules

- Secrets never in this repo. Placeholders only.
- Telegram is OUT, permanently. Twilio is SMS-only since
  2026-10-29 (voice = Vapi number). Vapi native for voice.
- The live dashboard wins over these files wherever they disagree.
  Fix this folder when the harvest lands; do not edit live to match
  a draft.
