# W02 — scénario devis vocal Make (VÉRIFIÉ 2026-10-29, inactif — quota Free plein)

Statut : construit (scénario 6825545), passe éditeur faite, 5 tests
vérifiés, puis désactivé ; v1 + v3 actifs. Le seul placeholder est
`PASTE_VAPI_SHARED_SECRET_HERE`, le même que W1 v3.

## 1. Pourquoi maintenant

W1 v3 (scénario 6817797) est vérifié de bout en bout depuis le
2026-10-28 au soir : une réservation test INTAKE_VALIDATED à 47,50 $
via la connexion Supabase Make 12014112, zéro clé dans les modules
(`w1-v3-connection.NOTES.md`). L'étape suivante, déjà nommée dans le
pack de migration Vapi et dans `mono-repo/make/README.md`, est le
scénario devis (W02) : sans lui, l'outil Vapi `get_quote` n'a nulle
part où pointer dans le compte business, et il ne doit PAS pointer
sur le webhook W1 (W1 ré-émet un jeton puis commit — il ne fait pas
de devis seul).

## 2. Flux (copié sur la grammaire vérifiée de W1 v3)

| ID | Module | Placement |
|----|--------|-----------|
| 1 | `gateway:CustomWebHook` v1 | `root: "main"` |
| 2 | `builtin:BasicRouter` v1 | `follows: 1` — gate secret, 2 bras |
| 3 | `supabase:makeAnApiCall` v1, `__IMTCONN__` 12014112 | bras 0, filtre égal — `POST /rest/v1/rpc/issue_quote_token` |
| 4 | `gateway:WebhookRespond` v1 | `follows: 3` — 200 + résultat du devis |
| 5 | `gateway:WebhookRespond` v1 | bras 1, filtre différent — 401 |

Fichier : `w02-voice-quote.DRAFT.json` (même forme plate que
`w1-v3-connection.json` : `root` / `follows` / `parent`, un `config`
par module, `filter` sur le premier module de chaque bras).

## 3. Mappings — ce qui est prouvé, ce qui est précondition

Entrée attendue (champs de l'outil Vapi `get_quote`, payload V0.3) :
`service_type`, `pickup_address`, `dropoff_address`,
`pickup_datetime`, optionnels `caller_stated_distance_miles`,
`zone_code`.

- **Distance.** `issue_quote_token` exige `p_distance_miles`
  non nul, sinon il répond `DISTANCE_REQUIRED` (SQL, migration 003,
  lignes 711–734). L'outil Vapi n'envoie jamais `distance_miles` :
  il envoie `caller_stated_distance_miles`, et seulement au
  2e appel. Le brouillon mappe donc
  `p_distance_miles = {{ifempty(1.caller_stated_distance_miles; "null")}}`
  (motif numérique-nul déjà employé dans W1 v3 pour
  `p_estimated_duration_minutes`). Premier appel sans distance →
  `DISTANCE_REQUIRED` renvoyé tel quel au modèle, qui demande la
  distance — c'est le comportement prévu par le prompt, pas une
  erreur. À VÉRIFIER au premier test : le rendu JSON `null`
  non quoté.
- **Zone — PRÉCONDITION, même règle que W1 v3.** Le SQL :
  `p_zone_code` NULL → `COALESCE(...,'ALL')` (médical / business /
  local OK) ; `p_zone_code` NULL + `AIRPORT_CVG` → `ZONE_REQUIRED`
  (comportement voulu) ; `p_zone_code` `""` → aucune bande →
  `NO_BAND` (faux). Le brouillon passe `{{1.zone_code}}` tel quel,
  comme W1 v3. L'appelant DOIT donc toujours envoyer `zone_code` :
  `ZONE_1/2/3` pour l'aéroport, `ALL` sinon. Ne pas inventer de
  défaut dans le scénario. Au moment de la migration Vapi, la
  définition de `get_quote` devra porter cette règle (aujourd'hui
  sa description dit « usually omit » — à corriger là, pas ici).
- **Réponse.** Le module 4 renvoie les champs de `3.body`
  (`status`, `fare`, `currency`, `zone_code`, `quote_token`,
  `expires_at`) avec `fare` en `null` si absente. NON VÉRIFIÉ :
  sur les formes d'erreur (`DISTANCE_REQUIRED`, `ZONE_REQUIRED`,
  `NO_BAND`), `quote_token` / `expires_at` sont absents et rendent
  des chaînes vides dans ce gabarit. Le `status` reste lisible
  par le modèle — c'est lui qui pilote le prompt — mais la forme
  brute de la réponse d'erreur DOIT être lue au premier test et le
  gabarit ajusté (passthrough brut si Make le permet) avant tout
  re-pointage.
- **Secret.** Même placeholder que W1 v3, dans les 2 filtres.
  Aucun secret nouveau : le secret partagé unique reste à choisir
  une fois (décision déjà ouverte côté W1 v3), puis la même valeur
  ira dans les outils Vapi. Ne pas choisir un 2e secret pour W02.

## 4. Vérifications — FAITES 2026-10-29 (données factices, Test Rider)

Passe éditeur : headers Yes, 6/6 champs détectés, module 3 sur la
connexion, sauvegardé. Tests (v1 désactivé le temps des tests, puis
réactivé ; W02 désactivé ensuite) :
a. sans distance → `DISTANCE_REQUIRED`, 200, aucun jeton ;
b. distance 10 + `ALL`, médical → `OK`, 47,50 $, jeton + `expires_at` ;
c. `AIRPORT_CVG` sans zone → d'abord `NO_BAND` (zone `""`, pas NULL)
   → correctif : `p_zone_code = {{ifempty(1.zone_code; "null")}}`
   (patch 14:42:46Z) → `ZONE_REQUIRED` ;
d. mauvais header → bras 401 seul ;
e. médical sans zone → `OK` via défaut `ALL` (COALESCE).
Forme de réponse du gabarit confirmée sur les formes réelle
OK / erreur (statut lisible, fare null sur erreurs).
Reste avant re-pointage : enveloppe Vapi (§4.4 d'origine, non
établie) + secret partagé unique à choisir + définition `get_quote`
(« usually omit » la zone) à corriger côté Vapi.

## 5. Écarts relevés en préparant ce brouillon (rien appliqué)

- `vapi/tools/create-booking-commit.json` (fichier de référence)
  pointe encore sur le webhook W1 **v2** (`.../ud1125jgbr54ieqs46nuert9jbvagyid`,
  scénario 6793518 inactif, remplacé par v3). Au re-pointage, la
  cible est le webhook v3 `.../jui46xdyx8r3pu3dlovk46hr4idvb9my`,
  pas v2. Fichier à corriger au moment de la migration, pas avant.
- `vapi/tools/get-quote.json` a `server.url =
  PASTE_MAKE_QUOTE_WEBHOOK_HERE` : le webhook W02 n'existe pas
  encore, c'est normal — le placeholder se remplit avec l'URL
  créée à l'étape §4.1, jamais avant.
- L'écart contrat §4 du pack de migration (W1 ré-émet un jeton au
  lieu de vérifier celui de `get_quote`) n'est PAS résolu par W02 :
  W02 émet le jeton, W1 v3 en ré-émet un autre au commit. La
  résolution appartient à la chaîne technique, pas à ce brouillon.

## 6. Ce que ce brouillon ne fait pas

Pas de création Make, pas d'activation, pas de test, pas de
re-pointage Vapi, pas de migration de compte, pas de dépense.
La suite appartient à la livraison (construction via MCP Make +
passe éditeur + tests), puis au go explicite pour le re-pointage
live et la migration Vapi.
