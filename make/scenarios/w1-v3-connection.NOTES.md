# W1 v3 — connexion Supabase Make (vérifié 2026-10-28)

Scénario « W1 Voice Booking Commit v3 », ID 6817797, webhook
https://hook.us2.make.com/jui46xdyx8r3pu3dlovk46hr4idvb9my
Connexion : « Liberty's Supabase connection », ID 12014112
(créée par le Capitaine 2026-10-28, Project ID lgvusahqkdwargrjrmmy,
clé service_role). Modules 3-4 = `supabase:makeAnApiCall` v1,
`__IMTCONN__` = 12014112, URLs relatives `/rest/v1/rpc/…`.
Aucune clé dans aucun module. Filtres secret partagé : identiques à v2
(valeur placeholder, à remplacer par le secret choisi + côté Vapi).

## Vérification (preuves)

- Passe éditeur 2026-10-28 18:52–18:58 EDT : « Get request headers »
  Yes, 10/10 champs détectés, modules 3-4 sur la connexion, sauvegardé,
  laissé inactif puis activé pour test.
- Test 1 (zone NKY, 18:58) : module 3 OK, `{"status":"NO_BAND"}` —
  la connexion et l'auth fonctionnaient ; NKY n'est pas un code zone.
  Échec mapping module 4 : `first()` sur objet → leçon : la sortie
  `makeAnApiCall` est `body` (objet), `first()` est évalué avidement
  dans `ifempty` → accès direct `3.body.*` / `4.body.*` (patch
  `scenario_patch`, lastEdit 2026-10-28T23:00:43Z).
- Test 2 (zone ALL, 19:00) : exécution 68506a13 SUCCESS, 4 ops,
  réponse 200 `{"booking_id":"f385d248-…","status":"INTAKE_VALIDATED",
  "fare":47.5}`. BFF confirme la réservation (Test Rider, 859-555-0100,
  MEDICAL_HOSPITAL, ALL, 10 mi, 47.50 $, INTAKE_VALIDATED).

## Codes zone réels (GET /api/pricing-zones, 2026-10-28)

AIRPORT_CVG : ZONE_1 / ZONE_2 / ZONE_3. MEDICAL_HOSPITAL,
BUSINESS_EXEC, LOCAL_TAXI : `ALL` (base + 2,75 $/mi).
`issue_quote_token` répond `{"status":"NO_BAND"}` sans bande
correspondante — aucun garde NO_BAND dans v3 (durcissement ultérieur :
ne pas appeler commit_booking sur NO_BAND).

## Fichiers

Blueprint (mappings patchés = état live) : `w1-v3-connection.json`.
v2 (6793518, HTTP + placeholders) : inactif, remplacé par v3.
v1 (6792449) : actif, à couper après le re-pointage Vapi.
