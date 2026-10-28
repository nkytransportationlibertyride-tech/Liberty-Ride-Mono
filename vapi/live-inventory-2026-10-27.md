# Live Vapi inventory — verified on the dashboard, 2026-10-27 (05:26 and 09:27 EDT)

Read-only. Nothing was created, modified or re-pointed.

- Organisation: exactly 4 tools.
- Receptionist: 3 tools (end-of-call + `create-booking-commit` +
  `get_quote`). Both webhooks have NO parameters, NO headers, NO auth,
  and still point at the n8n webhooks (Tailscale funnel, Amd-PC).
  A live voice call therefore sends NO booking field today.
- Airport: 0 tools. Medical: 0 tools. No transfer (handoff) on any
  of the 3 squad members.
- `google_sheets_tool` EXISTS but is unattached and unconfigured:
  no description, empty Spreadsheet ID, empty Range — it writes
  nowhere. Do not migrate it as-is: spreadsheet, range and writes
  must be established first (all three are empty today).
- NO Google Docs tool exists. A Docs need would be a creation, not
  a migration.
- Live number: +1 859 997-6581, in the personal account
  (`amdkn777@gmail.com`).

Unknown, unverified: whether a Vapi account exists under
`nkytransportationlibertyride@gmail.com`; fate of the number
(inter-account transfer or new purchase). Establish at migration
time, with the owner intervening (client-connection rule).

## IDs, versions, models, voices (same reads, 2026-10-27)

- Squad « Liberty Ride Squad »: `adaa4934-41f1-439b-a649-a80b923e146d`,
  v2. Members chained Receptionist → Airport → Medical.
- Receptionist: `61597e3d-fdaf-4612-80f4-bcb58867260a`, published v5,
  100% traffic, model GPT-6 Luna, STT Soniox, voice Elliot v2.
- Airport specialist: `999b8839-0777-4a0a-8949-de2d194fef2c`, v3,
  0 tools. Model and voice not recorded — do not guess.
- Medical specialist: `a672ccd9-b550-4850-8d8a-bca3fcdec369`, v3,
  model GPT-4.1, voice Elliot v2, 0 tools.
- Tools (all pinned "Latest"): `end_liberty_ride_call`
  (`abc38931-4504-45a1-a457-8195bedd7940`, v1, endCall);
  `create-booking-commit` (`f37045f9-e919-48af-ac50-e64873c16baf`,
  v2, apiRequest); `get-quote`
  (`2a3257e1-c573-42a3-b411-7e6b3f9381e7`, v2, apiRequest);
  `google_sheets_tool` (`ff3ec836-b625-4c63-a89e-94664b64d135`, v1).
- Phone +1 (859) 997-6581 « Liberty Ride » (ID prefix `5f548c4e`,
  full ID not harvested), squad routing set 2026-10-26, fallback
  destination +1 859 938 9993 (not a Vapi number). Line callable.
- Account plan: None (Legacy), $0 pay-as-you-go, 10 concurrent
  lines, 200 API req/min, 14-day retention, 5 Vapi numbers.
- 12 old assistants in folder « Archive », none deleted (15 total).
  A second, unrelated « Untitled Squad » (5 assistants, Mar 2025)
  exists — out of scope.
