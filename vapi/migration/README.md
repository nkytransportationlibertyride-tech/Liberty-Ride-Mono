# Migration pack — Vapi amdkn777 → business account (GO 2026-10-29)

Target: Vapi account of **nkytransportationlibertyride@gmail.com**
(the business email — same as Vercel/GitHub/Supabase/Make).
Source: Vapi account amdkn777@gmail.com, harvested read-only
2026-10-28 (`../live-harvest-2026-10-28.md` — the export of
record; it wins on any disagreement with these files).

## Guardrails (non-negotiable)

- **Do NOT create, modify, publish, or delete anything in the
  amdkn777 account.** It stays live until the verified cutover.
  If the browser session is signed in as amdkn777, STOP and
  report: the business-account sign-in is the Capitaine's
  intervention (rule 2026-10-27: client/business sign-ins are his).
- **No phone number step in this migration.** Do not buy, import,
  release, or reassign any number (see §08).
- **No secret values, ever.** Tool headers carry the placeholder
  `PASTE_VAPI_SHARED_SECRET_HERE` until the owner chooses ONE
  shared value and it is set in BOTH the Vapi tools AND the Make
  gate filters (W1 v3 + W02). Until then the gates reject
  everything: fail-closed, by design.
- **No live traffic.** Created assistants/squad stay unpublished
  to any number. No test call to a real number without the
  owner's explicit go. Fake data only.
- **No SMS tool in this migration.** SMS is Phase 2 (§08).

## Order

1. Tools first: `01`, `02`, `03` — pin each version at creation.
2. Assistants: `04` (Receptionist), `05` (Airport), `06` (Medical).
3. Squad: `07` — Receptionist = Start Node, no routing, no
   handoff tools (as in source).
4. Verify: read back every created object (IDs, model, voice,
   transcriber, first message, attached tools + pinned versions,
   squad members/order). Report IDs as receipts.
5. Test call from the Vapi dashboard (test-call feature, NOT a
   real phone call): establish the tool-call envelope shape
   (toolCallList vs flat JSON) for `get_quote` and
   `create_booking_commit`. W02/W1 v3 were verified with flat
   bodies; the envelope is the last unverified link before
   cutover. Record the observed request shape verbatim.

## What changed vs. the live source (deliberate, all flagged)

- Tool servers re-pointed: `get_quote` → Make W02 webhook
  (6825545); `create_booking_commit` → Make W1 v3 webhook
  (6817797, NOT the superseded v2). Both carry the
  `x-vapi-secret` header (placeholder value).
- Tool versions PINNED (source used "latest version").
- Receptionist prompt step 7: SMS promise replaced by the
  driver-calls-back script (no SMS sender exists yet).
- Descriptions: n8n references replaced by the Make scenarios.
- Known gaps KEPT verbatim and recorded: LONG_DISTANCE (no enum),
  flight-tracking implication, squad transfer mechanism,
  forwarding number 4257623355 (verify owner).
- `google_sheets_tool`: recreate UNCONFIGURED and UNATTACHED
  (spreadsheet ID + range empty, as in source). No Google Docs
  tool exists in either account: decide later with the owner.

## After this pack

- Number fate (§08) → cutover plan → owner go → re-point live
  traffic → verify canary on Make → only then touch the old
  account (and n8n off, separately).
