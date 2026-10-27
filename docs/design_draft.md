# Liberty Ride — Produit fini (résolu Goldfish) : interfaces inspirées Uber + câblages

**Produit :** Liberty Ride NKY Trans, LLC (Erlanger, Kentucky — aéroport CVG, médical, business).
**Racine :** `~/workspace/liberty-ride/mono-repo/` (Bun workspaces, Vite + React, BFF Bun zéro dépendance).
**Autorisation :** ordre du Capitaine 2026-10-26 ~01:22 EDT — interfaces inspirées Uber + produit fini câblé (Supabase/n8n/Vapi), voie EGM.
**Statut de cette spec :** version résolue après les 3 relectures Goldfish (UX, périmètre, câblages — fichiers sous `reviews/`). Elle remplace la version Elephant.
**Sens de « fini » :** interfaces finies, **prêtes à activer**. L'activation des workflows + le canary sont l'interrupteur final (voir § Activation), pas une partie de la construction.

## Le problème

La plomberie existe (données, workflows, voix) mais aucun client, chauffeur ou propriétaire ne peut l'utiliser depuis une interface finie : apps en local sans URL, app chauffeurs sur Telegram (canal abandonné), admin sans contrôle d'accès, domaine live sur l'ancien site, voix vers des webhooks inactifs. Le produit fini = les mêmes fondations, servies par des interfaces utilisables, sans inventer de services ni de données.

## Objectifs

- 4 apps utilisables, calquées sur les parcours Uber adaptés au taxi (parcours seulement, jamais d'assets Uber) : site + widget devis, clients, chauffeurs, admin propriétaire — plus une route aéroport `/cvg` dans l'app clients (l'ancienne app landing séparée est supprimée, son contenu est replié dans cette route).
- Chaque surface lit et écrit des données réelles via le BFF et Supabase ; aucun chiffre, avis ou course fabriqué ; états vides et erreurs affichés explicitement, avec retry.
- La voix reste la porte téléphonique : numéro Vapi routé sur le squad, outils vers les webhooks funnel.
- Zéro nouveau service payant, zéro migration de schéma, zéro réécriture de stack.

## Non-objectifs (v1)

- Pas de tarification dynamique, pas de suivi GPS temps réel (suivi par statuts uniquement, dit dans l'interface).
- Pas de capture de paiement dans l'app (workflow Stripe existant mais non câblé ; paiement géré par le propriétaire comme aujourd'hui).
- Pas de portail B2B v1, pas de SMS, pas de Telegram, pas de réécriture Next.js, pas de migration 004.
- Pas d'historique client par numéro de téléphone (exposition de données privées, dont trajets médicaux) — le suivi se fait par référence de réservation (UUID, voir § Clients).
- Pas de bascule en ligne/hors ligne (placebo sans effet dispatch — supprimée, pas étiquetée).
- Pas de géolocalisation « ma position », pas de modification de réservation en ligne (repli : appel), zones en lecture seule, `fleet_logs` exclu v1.

## Langue

**Interface utilisateur : anglais** pour les 4 apps (clientèle du Kentucky). La spec reste en français (document interne). Table des libellés de statuts (anglais, affichée partout, jamais les enums bruts) :

| État | Libellé |
|---|---|
| REQUESTED | Requested — waiting for dispatch |
| INTAKE_VALIDATED | Request confirmed — finding your driver |
| LEASE_OFFERED_ATTEMPTED_UNKNOWN | Driver offer sent |
| CONFIRMED_R10 | Driver confirmed |
| DRIVER_EN_ROUTE | Driver en route |
| COMPLETED | Completed |
| CANCELLED | Cancelled |
| LEASE_EXPIRED_ESCALATED | Offer expired — owner notified |
| DRIVER_REJECTED | Driver declined — finding another driver |
| NO_DRIVER_AVAILABLE | No driver available |

## Surfaces

### 1. Site — vitrine + widget devis (devis seul, pas de réservation sur place)

- Hero avec widget devis : départ, destination, date/heure, type de course (aéroport / médical / business / local).
- Le widget appelle `POST /api/quote` et affiche le tarif estimé, étiqueté « estimate » ; le tarif final vient toujours du RPC au moment du devis. Bouton « Reserve » → app clients **pré-remplie** via paramètres d'URL (départ, destination, date/heure, type, zone, distance, estimation). Le widget ne crée aucune course.
- Grille tarifaire publique **lue depuis `GET /api/pricing-zones`** (jamais codée en dur) : ZONE_1 35 $, ZONE_2 45 $, ZONE_3 15 $ + 2,75 $/mile, médical 20 $ + 2,75 $/mile — étiquetée estimation.
- Fonctionnement réel en langage simple : une course n'est confirmée que quand un chauffeur accepte (bail 5 min).
- Contact v1 : téléphone seul. Avis : mention texte seule (« Find our reviews on Google Business Profile »), **sans lien** tant que le propriétaire n'a pas fourni l'URL GBP.
- **Tous les boutons d'appel composent +1 (859) 537-1827** (numéro publié) jusqu'à confirmation du propriétaire. La ligne vocale IA +1 (859) 997 6581 n'est publiée nulle part tant que l'activation n'a pas eu lieu (voir § Voix).

### 2. Clients — app passager (anglais)

- Carte (Leaflet + tuiles OpenStreetMap, mention obligatoire © OpenStreetMap contributors, gratuit sous politique d'usage). Géocodage Nominatim (gratuit, ~1 req/s, debounced) avec **liste de choix** en cas de résultats multiples. Épingle manuelle → géocodage inverse Nominatim ; si l'inverse échoue, l'épingle n'est **pas** acceptée pour la réservation (l'utilisateur saisit une adresse).
- Distance : routage OSRM (serveur public gratuit, sans clé) en miles, arrondie à 2 décimales. Repli si OSRM échoue : distance haversine, devis étiqueté « route unavailable — straight-line estimate ».
- Devis **avant** réservation via `POST /api/quote` (service_type, distance_miles, zone_code). Pour AIRPORT_CVG, la zone est choisie par l'utilisateur dans la liste des zones actives ; sinon zone_code null (le RPC utilise 'ALL'). Si le RPC ne retourne aucun tarif (ex. zone requise), l'UI affiche la raison, jamais un prix inventé.
- Formulaire : nom, téléphone (format US validé), date/heure (fuseau America/New_York affiché sur chaque heure, pas de réservation dans le passé), départ ≠ destination, numéro de vol (aéroport), besoins particuliers (médical). Types : AIRPORT_CVG, MEDICAL_HOSPITAL, BUSINESS_EXEC, LOCAL_TAXI.
- Création via `POST /api/bookings` (chaîne `issue_quote_token` → `commit_booking`, `p_actor: 'web'` ; le client est upserté par téléphone **à l'intérieur** de `commit_booking`). La réponse rend l'UUID de réservation : stocké en localStorage **et affiché comme référence de suivi**.
- Suivi par UUID : `GET /api/bookings/:id`, **polling 15 s + refresh manuel + mention « updated X ago »**. Mention obligatoire sur l'écran : « Step-by-step tracking — no live driver location ». Bouton annuler (transition vers CANCELLED, autorisée par les gardes tant que la course n'est pas DRIVER_EN_ROUTE/COMPLETED ; sinon l'UI propose l'appel). Modification : appel uniquement (bouton tel:). États terminaux NO_DRIVER_AVAILABLE / DRIVER_REJECTED / LEASE_EXPIRED_ESCALATED → boutons « Call us » + « Book again ».
- Pas d'historique par téléphone. Protection double soumission : bouton désactivé pendant l'envoi.
- États vides/erreurs par écran : BFF down (bannière 503 + retry), devis en échec (raison + retry), aucune course (message + bouton réserver).

### 3. Chauffeurs — app chauffeur (anglais)

- **Identification par téléphone** (`drivers.phone`) : écran de premier lancement — saisie du téléphone → `POST /api/drivers/identify`. Si aucune ligne active ne correspond : erreur « Unknown reference — contact the owner ». Le téléphone est persisté en localStorage. **Aucune référence Telegram dans l'UI.**
- Boîte des offres : `GET /api/bookings?driver_ref=<ref>&status=LEASE_OFFERED_ATTEMPTED_UNKNOWN` — le BFF filtre côté serveur sur `assigned_driver_ref` (colonne posée par `offer_driver_lease`, qui résout le chauffeur par `driver_ref` actif). Le jeton de clôture n'est servi que pour les offres assignées à ce chauffeur.
- Carte d'offre : départ, destination, tarif estimé, numéro de vol, besoins particuliers, nom du client + téléphone cliquable (pool de chauffeurs vérifiés — limite v1 documentée), **compte à rebours depuis `lease_expires_at`**. À zéro : carte « expired », acceptation désactivée. Accepter/refuser : `POST /api/leases/:token/accept|reject` avec `{driver_ref}` — le BFF résout la ligne chauffeur et passe son code numérique interne au RPC (qui vérifie qu'il correspond au chauffeur assigné ; acceptation tardive ou concurrente rejetée par le RPC, erreur affichée).
- Course active : `GET /api/bookings?driver_ref=<ref>&status=CONFIRMED_R10,DRIVER_EN_ROUTE`. Lien de navigation = **lien Google Maps avec adresses encodées** (sans clé, un lien n'en exige pas). Boutons « En route » et « Completed » → `POST /api/bookings/:id/en-route|complete` avec `{driver_ref}` (le BFF vérifie `assigned_driver_ref` puis appelle `transition_booking` : CONFIRMED_R10 → DRIVER_EN_ROUTE → COMPLETED).
- Revenus : somme des `estimated_fare` des COMPLETED de ce chauffeur, étiquetée « Estimated — cash handled by the owner ».
- État vide pré-activation (aucune offre, workflows inactifs) : « No offers yet — dispatch not activated ». Pas de bascule en ligne/hors ligne.

### 4. Admin — app propriétaire (anglais, porte par clé)

- Écran de clé : saisie de la clé propriétaire → sessionStorage → en-tête `X-Owner-Key` sur toutes les requêtes admin. **Limites v1 documentées :** secret unique partagé, pas d'identité, pas de journal d'audit, pas de rotation automatique (rotation = changement de la variable d'environnement + redistribution), CORS n'est **pas** un contrôle d'accès (seul l'en-tête défend).
- Tableau ops : liste des courses **avec total** (pas de plafond silencieux à 100), compteurs par statut, revenus estimés (COMPLETED, étiquetés), tables chauffeurs et zones (lecture seule v1), carte briefing CEO = **« Awaiting activation »** + rubriques futures listées (today's rides, alerts, cash — contenu post-activation seulement, jamais fabriqué).
- Actions : annuler une course (propriétaire), **créer un chauffeur** (`driver_ref` + téléphone + nom affiché ; convention nouvelles lignes : `driver_ref` = téléphone, code numérique interne = chiffres du téléphone), liens tel: vers chauffeurs et clients.
- Mise à jour : polling 15 s + **signal sonore** (page ouverte) sur nouvelle course INTAKE_VALIDATED et sur LEASE_EXPIRED_ESCALATED.

### 5. Route aéroport `/cvg` (dans l'app clients, pas une app séparée)

Variante aéroport du parcours clients : numéro de vol mis en avant, prise en charge CVG, même chaîne devis → réservation → suivi. L'ancienne app `landing` est supprimée au build (contenu replié dans cette route).

## Contrat BFF (v1, après corrections)

Base : `apps/api` (Bun, zéro dépendance). Règles transverses : `limit` plafonné à 100 côté serveur ; listes admin rendent `{data, total}` ; `X-Owner-Key` ajouté aux en-têtes CORS autorisés ; `ALLOWED_ORIGINS` vide + production = **refus de démarrer** (jamais de reflet) ; défauts localhost uniquement hors production ; `distance_miles` requis (> 0) sur `POST /api/bookings`.

| Route | Accès | Comportement |
|---|---|---|
| `GET /api/health` | public | ok |
| `GET /api/pricing-zones` | public | zones actives (aucune donnée personnelle) |
| `POST /api/quote` | public | `{service_type, distance_miles, zone_code?}` → RPC `get_quote` (fonction pure, sans jeton) ; tarif null → raison affichée |
| `POST /api/bookings` | public | `issue_quote_token` → `commit_booking` (upsert client interne) ; rend l'UUID |
| `GET /api/bookings/:id` | UUID (capabilité) | lecture d'une course par son UUID (le détenteur de l'UUID voit sa course) |
| `POST /api/bookings/:id/cancel` | UUID ou clé propriétaire | `transition_booking` → CANCELLED (gardes : refus si DRIVER_EN_ROUTE/COMPLETED) |
| `POST /api/drivers/identify` | public, par téléphone exact | `{phone}` → `{ok, driver_ref, display_name}` si ligne active, sinon 404 ; aucune liste exposée |
| `GET /api/bookings?driver_ref=&status=` | chauffeur identifié | offres/courses **filtrées sur `assigned_driver_ref`** ; jeton servi uniquement pour les offres assignées |
| `POST /api/leases/:token/accept\|reject` | chauffeur identifié | `{driver_ref}` → résolution interne vers le code numérique → RPC `confirm/reject_driver_lease_by_token` (vérifie le chauffeur assigné) |
| `POST /api/bookings/:id/en-route\|complete` | chauffeur identifié | vérifie `assigned_driver_ref` puis `transition_booking` (CONFIRMED_R10 → DRIVER_EN_ROUTE → COMPLETED) |
| `GET /api/bookings` (liste) | clé propriétaire | filtres statut, total rendu |
| `GET /api/drivers` (liste) | clé propriétaire | chauffeurs actifs |
| `POST /api/drivers` | clé propriétaire | création chauffeur (convention ci-dessus) |
| `POST /api/bookings/:id/cancel` | clé propriétaire | annulation propriétaire (mêmes gardes) |

Porte propriétaire : comparaison à temps constant sur `OWNER_KEY` ; si `OWNER_KEY` non défini, les routes admin répondent 503 (fail closed, jamais ouvertes).

## Notes données (vérifiées migration 003, sans migration)

- `bookings` : UUID, `customer_phone`, `pickup_address`, `dropoff_address`, `pickup_datetime`, `flight_number`, `special_needs`, `distance_miles`, `estimated_fare`, `zone_code`, `assigned_driver_id`, `assigned_driver_ref`, `current_fencing_token`, `lease_attempt`, `lease_offered_at`, `lease_expires_at`, `ride_status` (10 états).
- `drivers` : `driver_ref` TEXT UNIQUE (commentaire schéma : ex. chat_id Telegram), `phone` TEXT, `telegram_user_id` BIGINT UNIQUE. **Convention v1 :** la colonne `telegram_user_id` est un **code numérique chauffeur** (nom historique, aucune fonction Telegram) ; pour les nouvelles lignes, il vaut les chiffres du téléphone. Le BFF est le seul à le manipuler ; aucune app ne le voit.
- `offer_driver_lease` (workflow uniquement) : depuis INTAKE_VALIDATED / LEASE_EXPIRED_ESCALATED / DRIVER_REJECTED, résout le chauffeur par `driver_ref` actif, pose `assigned_driver_ref` + nouveau jeton + `lease_expires_at` = +5 min. **Correction vérifiée : `commit_booking` bascule lui-même la course en INTAKE_VALIDATED** (transition interne) — les courses web arrivent donc en INTAKE_VALIDATED, pas en REQUESTED (REQUESTED n'est que transitoire). **Conséquence : pré-activation, les courses restent en INTAKE_VALIDATED** (l'offre naît du workflow) et la boîte d'offres est vide — état vide honnête, pas un bug.
- `transition_booking` (gardes) : INTAKE_VALIDATED depuis REQUESTED ; DRIVER_EN_ROUTE depuis CONFIRMED_R10 ; COMPLETED depuis DRIVER_EN_ROUTE ; CANCELLED depuis REQUESTED, INTAKE_VALIDATED, LEASE_OFFERED_ATTEMPTED_UNKNOWN, CONFIRMED_R10, LEASE_EXPIRED_ESCALATED, DRIVER_REJECTED, NO_DRIVER_AVAILABLE. NO_DRIVER_AVAILABLE et LEASE_EXPIRED_ESCALATED ne sont atteignables que par les workflows (expiration = minuteur n8n W1).
- `get_quote` : FLAT → tarif fixe, sinon base + miles × taux ; zone = `COALESCE(p_zone_code, 'ALL')` ; distance obligatoire non nulle ; aucune ligne → aucun tarif (pas de prix inventé).
- Détenteurs de la clé service_role : **le BFF côté apps ET n8n dans ses nœuds HTTP** (les deux entrent dans toute rotation/révocation future).
- Affirmations Vapi et workflows configurés : **compte-rendu navigateur, non vérifiables dans le dépôt** (aucun export daté déposé ; le payload Vapi V0.3 présent dans le dépôt est obsolète — GPT-4o, zéro outil — et ne décrit pas la config actuelle).

## Câblages (corrigés)

- **Supabase** (`lgvusahqkdwargrjrmmy.supabase.co`, migration 003) : voir § Contrat BFF et § Notes données.
- **n8n via funnel** (`https://amd-pc-1.tail58ad16.ts.net`) : W1 `POST /webhook/vapi/create-booking-commit`, W2 `POST /webhook/vapi/get-quote`, W4 `POST /webhook/stripe/events` + `POST /webhook/internal/payment-link`, W7 `POST /webhook/b2b/account-request`. Workflows INACTIFS pendant la construction et la vérification. **Correction : un 404 n8n prouve seulement que le funnel atteint n8n**, pas que les chemins sont enregistrés (un chemin inexistant retourne le même 404) — la preuve d'enregistrement exige l'export des workflows en direct, la preuve de la logique exige l'activation.
- **Vapi (configuré, ne pas reconstruire)** : assistant « Liberty Ride Receptionist » publié v5, squad « Liberty Ride Squad » publié v2 (entrée = Receptionist, spécialistes Aéroport et Médical), outils `get-quote` et `create-booking-commit` attachés, numéro +1 (859) 997 6581 routé sur le squad. **Correction majeure : la ligne est DÉJÀ appelable en mode dégradé** (l'assistant répond, ses outils retournent 404 tant que les webhooks sont inactifs). Elle n'est donc pas « future » : elle est en direct, non publiée. Le canary doit précéder **toute** publication du numéro. Repli transferts squad : la réceptionniste traite tout si les transferts entre membres échouent (vérifié au canary, pas affirmé avant).
- **Routage production** : les apps appellent `/api` en relatif → en production, le BFF est servi **sur la même origine** que les apps (reverse proxy). Les proxys dev Vite (`/api` → localhost:3001) restent dev uniquement. Aucun défaut localhost dans les liens inter-apps en production.

## Déploiement (cible v1, nommée)

- **Hôte : Amd-PC** (hôte existant : n8n, funnel, Coolify). **Mécanisme : reverse proxy même origine** — `/` → apps statiques, `/api` → BFF (localhost:3001), `/webhook/*` → n8n (:5678) **inchangé**.
- **Première URL : URL canary sur le tailnet** (routage par chemin sur l'hôte) pour revue propriétaire. **Bascule du domaine public (erlangertaxiservice.com) = décision propriétaire séparée**, hors chantier v1.
- **Origines CORS :** origine canary + localhost dev. Le changement de configuration funnel/proxy est une **étape de déploiement prudente** (préserver `/webhook/*` exactement), exécutée après la vérification du build, pas pendant.

## Activation (interrupteur final, hors construction)

Ne pas activer pendant le build. Avant tout go d'activation, passe obligatoire :
1. **Neutraliser les branches non câblées des workflows en direct** : tous les nœuds Telegram/Twilio/Stripe/FlightAware/GBP encore en placeholders (`A_REMPLACER_*` : Telegram ×13 gabarits, `A2P_VALIDE` ×3, clés Stripe ×43 occurrences cumulées W1–W8, lien avis Google) — désactiver ou câbler chaque nœud, lister la passe.
2. Déposer les exports datés (sans secrets) des workflows configurés + assistant/squad Vapi.
3. Vérifier l'enregistrement réel des webhooks (pas un 404).
4. Activer, puis **canary sur numéros contrôlés** : devis → réservation → offre → acceptation → confirmé → en route → terminé, reçus R10 vérifiés.
« Prêt à activer » ne s'écrit qu'après cette passe. L'activation et le canary attendent le go du Capitaine/propriétaire.

## Points ouverts (bloquants de livraison, pas des défauts)

1. **Ligne publique unique ?** 537-1827 (publié) vs 997-6581 (ligne vocale IA). Défaut conservateur : 537-1827 partout jusqu'à confirmation du propriétaire. Le basculement des boutons vers la ligne IA changerait qui répond aux clients — ce n'est pas un défaut technique.
2. **Transferts du squad** : repli = réceptionniste traite tout ; comportement réel vérifié au canary.
3. **Changement proxy/funnel** : étape de déploiement, après vérification du build.

## Vérification (avant livraison)

- `bun run build` 4/4 et `tsc --noEmit` 4/4 (site, clients, chauffeurs, admin), zéro erreur.
- BFF sur données réelles : health OK, zones actives, devis via `POST /api/quote`, `identify` 404 sur téléphone inconnu, parcours test **devis → création → lecture par UUID → annulation** sur un numéro de test (la ligne annulée reste en base comme audit, jamais effacée).
- **Prérequis base découvert à la vérification (2026-10-26) :** la création de course échoue tant que l'extension `pgcrypto` n'est pas visible avec `search_path = public` — `issue_quote_token` appelle `hmac(...)` et les fonctions sont `SECURITY DEFINER SET search_path = public`. Correctif SQL Editor : `CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;` puis, si l'extension existe déjà ailleurs, `ALTER EXTENSION pgcrypto SET SCHEMA public;`. Secret `quote_hmac_secret` en base = placeholder du seed — rotation recommandée dans la même session SQL.
- Chemin funnel : 404 n8n = n8n atteint seulement (voir § Câblages).
- Aucun appel réel, aucune activation de workflow, aucune donnée fabriquée, aucune clé exposée.
- **Non testable pré-activation (dit, pas contourné) :** le chemin offre → acceptation → CONFIRMED (il naît du workflow) — il est testé au canary d'activation, pas simulé.
