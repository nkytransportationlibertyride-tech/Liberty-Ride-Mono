# OPEN — Phone number fate + Twilio SMS (Phase 2, after the migration)

## 1. Phone number — undecided, blocks cutover

Current live number: **+1 (859) 997-6581** ("Liberty Ride",
Vapi provider, ID `5f548c4e-...` in the amdkn account), routed
to the Liberty Ride Squad, fallback +1 859 938 9993.

Establish, with the owner, before any cutover:

- Can a Vapi number move between accounts (transfer), or must
  the business account buy a new number and the old one be
  released? (Vapi support / dashboard answer — do not assume.)
- If a new number: which number becomes public? The public line
  today defaults to +1 (859) 537-1827 everywhere (decision
  2026-10-28). The owner decides.
- **Do NOT release +1 859 997-6581 until its replacement is
  bought, routed to the new squad, and verified by a test call.**

## 2. SMS via Twilio — decision 2026-10-29 (voice = Vapi number, SMS = Twilio)

Architecture decided by the Capitaine 2026-10-29 15:31 EDT:
calls go through the Vapi number to the Vapi receptionists;
SMS confirmations go through Twilio. This partially replaces
the 2026-10-25 decision (Twilio OUT). Telegram stays OUT.

Facts on the ground:

- The Twilio account the Capitaine tried (+1 844 755 5390,
  "Liberty Ride V1") is **not active (status 4)** — the import
  failed at authentication. That account cannot send SMS.
- SMS needs: an ACTIVE Twilio account (reactivate, or a new
  business account), an SMS-capable number, and a sender: a Vapi
  tool calling Twilio, or a Make scenario, wired to the
  post-commit step. None exists yet.
- The old 844 import attempt is evidence only; the 844 number's
  fate (keep, port, abandon) is undecided.
- Carrier rules for US SMS (10DLC for long codes, verification
  for toll-free) must be checked at setup time — not assumed
  here.

Sequence: migration (this pack) → active Twilio account +
number → SMS sender built + tested with fake data → only then
restore an SMS promise in the Receptionist prompt step 7.

## 3. Shared secret — still unchosen

One value, used in: Vapi tool headers (`x-vapi-secret`), Make
gate filters (W1 v3, W02). The `x-b2b-secret` (M07) is a
separate placeholder; whether it equals the Vapi secret is
still undecided. The owner chooses; A0 never invents it.
