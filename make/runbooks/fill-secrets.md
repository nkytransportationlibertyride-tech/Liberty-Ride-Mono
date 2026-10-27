# Runbook — fill the 2 secrets in Make W1 v2 (scenario 6793518)

Owner action, in the Make editor. No secret is ever pasted in chat.

Open: https://us2.make.com/3285635/scenarios/6793518/edit

## 1. Supabase service_role key (4 values)

1. Click the module "Issue quote token".
2. In Headers, replace `PASTE_SUPABASE_SERVICE_ROLE_KEY_HERE`
   with the real key, twice: row "apikey", and row "Authorization"
   (keep `Bearer ` in front of the key).
3. Do the same in the module "Commit booking" (same 2 rows).
4. Save the scenario (do not change anything else).

## 2. Shared Vapi secret (2 values, owner chooses it)

1. Choose one long secret. Keep it — the same value goes into the
   Vapi tool header later.
2. Click the small filter icon on the line between "Secret gate"
   and "Issue quote token". Replace
   `PASTE_VAPI_SHARED_SECRET_HERE` with the secret.
3. Do the same on the line toward "401 - unauthorized".
4. Save the scenario.

## 3. Reactivate + retest

1. Switch the scenario ON (it auto-stopped after the
   placeholder-auth error; switching on is expected here).
2. Tell A0 "c'est rempli". A0 retests with fake data only
   (Test Rider, 859-555-0100) to a real booking id + Supabase
   receipts, and reports done or failed.
3. Until that retest passes, Vapi still points at the n8n
   webhooks. Do not re-point Vapi first.
