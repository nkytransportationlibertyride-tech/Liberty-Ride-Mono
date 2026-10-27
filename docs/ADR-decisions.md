# ADR — Décisions d'architecture (Liberty Ride V0.3)

Projet : Liberty Ride NKY Trans, LLC — Jumeau Numérique agentique (Business OS).
Statut : décisions issues des analyses croisées Gemini / ChatGPT / Claude du 2026-10-21, révisées en V0.2 après l'audit de Claude, puis **révisées en V0.3 après l'audit indépendant de ChatGPT** (même date) — un audit qui a **reproduit** chaque défaut avec preuves (extraits, exécutions, réponses npm). Chaque décision doit être **signée par le propriétaire** avant exécution en production.
Nouveautés V0.3 : ADR-008 (idempotence et consommation du devis), ADR-009 (capacité chauffeur), ADR-010 (identité du callback), ADR-011 (ACL et écritures gardées) ; ADR-002, ADR-004, ADR-006 et ADR-007 révisées.

---

## ADR-001 — Source de vérité unique : PostgreSQL (Supabase)

**Décision.** En V0.x, PostgreSQL (Supabase) est la **seule source de vérité** du système Liberty Ride : courses, clients, chauffeurs, flotte, grille tarifaire, devis consommés, événements Stripe et reçus R10 y vivent, et nulle part ailleurs.

**Précisions.**
- Côté A'Space, `aspace.tape` reste l'autorité du ledger A0 et des reçus de la Factory : c'est une autorité **distincte**, propre à l'écosystème du Capitaine. Il n'y a **pas de double écriture** entre `aspace.tape` et la table `workgraph_receipts_r10` de Liberty Ride : chaque système garde ses reçus chez lui.
- **Airtable est abandonné comme base opérationnelle.** Airtable peut, au plus, servir de vue d'export ponctuelle, jamais d'écriture parallèle.
- Le reçu R10 est une ligne de `workgraph_receipts_r10` : append-only, chaînée par hachage SHA-256, sans `ON DELETE CASCADE` depuis `bookings`.
- **Accès base** : tous les accès des workflows n8n passent par des **appels RPC paramétrés** (PostgREST `/rest/v1/rpc/<fonction>`, clé de service en en-tête) ou des requêtes REST paramétrées dont l'URL est une **expression n8n complète** (commençant par `=`). Aucun SQL construit par concaténation de valeurs externes. Les privilèges sont explicites et minimaux (ADR-011).

**Conséquence.** Toute confirmation de course (`CONFIRMED_R10`) est prouvable par la chaîne de reçus PostgreSQL.

---

## ADR-002 — Canaux de communication : Telegram pour le chauffeur, SMS-après-A2P ou rappel pour le client — RÉVISÉE V0.3

**Décision.**
- **Canal chauffeur : Telegram, avec boutons inline.** Le bail de 5 minutes est envoyé au chauffeur par le bot Telegram avec deux boutons **Accepter / Refuser** dont le `callback_data` porte le **fencing token** du bail (`ACC:<token>` / `REJ:<token>`, 40 caractères). La course est résolue **côté base** par le jeton (RPC `confirm_driver_lease_by_token` / `reject_driver_lease_by_token`). **V0.3** : le callback n'est honoré que si l'**identité Telegram de l'expéditeur** correspond au chauffeur assigné au bail (ADR-010) — le jeton seul ne suffit plus.
- **Construction des messages (V0.3).** Tous les corps Telegram sont construits dans **une unique expression n8n** : les valeurs (texte, `callback_data`) sont calculées en JavaScript dans l'expression externe. Le motif V0.2 — un `{{ ... }}` imbriqué dans une chaîne du `JSON.stringify` — produisait des valeurs **littérales jamais évaluées** (audit P0-02, 12 nœuds) et est interdit. Un test de rendu automatisé (`check_workflows.js`) évalue les expressions et exige un `callback_data` final conforme au parser (`^ACC:[0-9a-f-]{36}$`).
- **Twilio par API HTTP explicite (V0.3).** Les nœuds Twilio natifs de la V0.2 portaient des opérations inexistantes dans le nœud publié (`sms`/`call`, audit P0-03). Tous les envois passent désormais par des **nœuds HTTP Request explicites** vers `api.twilio.com` (`Messages.json` pour les SMS, `Calls.json` avec **TwiML inline** pour les appels) : le contrat est visible, valide par construction, et ne dépend d'aucun schéma de nœud.
- **Données minimales vers Telegram** : le message de bail ne contient que la **référence de course et l'heure de prise en charge** — jamais le nom, le téléphone ni les besoins médicaux du client (le détail reste en base). `parse_mode` = HTML.
- **Canal client : routage conditionnel réel (V0.3).** Chaque notification client (confirmation, refus, expiration) passe par un nœud de routage : **SMS si l'enregistrement A2P 10DLC est validé** (marqueur `A_REMPLACER_A2P_VALIDE` remplacé par `true` dans le nœud de routage), **sinon appel vocal Twilio** avec le même contenu en TwiML `<Say>`. En V0.2, le « fallback » n'était que documentaire et les SMS partaient dans le vide avant l'A2P.
- **Escalade propriétaire : PAR APPEL téléphonique** (Twilio), en cas d'expiration de bail ou de refus chauffeur — jamais par simple SMS. La branche « non confirmé » est câblée jusqu'au bout : notification client (routée) + appel propriétaire + alerte Telegram d'information.
- **Enregistrement A2P 10DLC lancé dès le Jour 1**, en parallèle du développement, car c'est le chemin critique des SMS clients (10 à 15 jours).

**Règle absolue.** Aucune confirmation n'est envoyée au client avant l'état `CONFIRMED_R10` (acceptation explicite du chauffeur **identifié**). Avant cela, le client sait seulement que sa demande a été transmise.

---

## ADR-003 — Positionnement légal du transport médical : privé payant ≠ NEMT Medicaid

**Décision.** Le service médical de Liberty Ride est positionné comme **transport privé payant vers rendez-vous médicaux** (accompagnement hôpitaux, dialyses, sorties d'hôpital), et **non** comme prestation NEMT Medicaid, tant que le périmètre n'a pas été validé formellement.

**Précisions.**
- Le renommage marketing (« Private Courtesy & Hospital Mobility Service ») **ne change pas le régime juridique** : une course payante vers un hôpital reste du transport rémunéré, soumis aux licences de transport du Kentucky et à l'assurance commerciale.
- Le Kentucky encadre le transport non urgent des bénéficiaires Medicaid (règles de fournisseur et de courtage) : ce régime est **distinct** du transport médical privé et ne doit pas être confondu avec lui dans les documents clients.
- **Action requise : validation du périmètre par l'assureur** (et, si besoin, un conseil local) avant toute communication « NEMT » et avant tout contrat avec un hôpital ou une clinique.

---

## ADR-004 — Grille tarifaire signée par le propriétaire — RÉVISÉE V0.3 (zones géographiques restaurées)

**Décision.** Aucun tarif n'entre en production sans la **grille tarifaire complète signée par le propriétaire** de Liberty Ride.

**Correction V0.3.** La V0.2 avait « réconcilié » les deux grilles en **aplatissant** le tarif aéroport à 15 $ + 2,75 $/mile partout. L'audit indépendant a établi que le **document d'architecture prévoit un tarif aéroport PAR ZONES GÉOGRAPHIQUES**, et c'est cette grille qui est implémentée en V0.3 :

| Type | Zone | Modèle | Tarif |
|---|---|---|---|
| AIRPORT_CVG | ZONE_1 | Forfait | **35 $** |
| AIRPORT_CVG | ZONE_2 | Forfait | **45 $** |
| AIRPORT_CVG | ZONE_3 | Base + distance | **15 $ + 2,75 $/mile**, attente tarifée (5 min de franchise, puis 0,50 $/min) |
| MEDICAL_HOSPITAL | — | Base + distance | **20 $ + 2,75 $/mile** |
| BUSINESS_EXEC | — | Base + distance (provisoire) | 15 $ + 2,75 $/mile |
| LOCAL_TAXI | — | Base + distance (provisoire) | 15 $ + 2,75 $/mile |

**Précisions.**
- Les zones vivent dans `pricing_zones` (colonne `zone_code`, modèle `FLAT` ou `BASE_PLUS_MILEAGE`, paramètres d'attente). La correspondance **ville → zone est PROVISOIRE** (ZONE_1 : Erlanger, Hebron, Burlington ; ZONE_2 : Florence, Independence, Union ; au-delà : ZONE_3) et doit être **validée et signée par le propriétaire**.
- Un devis aéroport **exige** une zone : sans zone déterminable, le devis répond `ZONE_REQUIRED` et aucun prix n'est annoncé.
- La zone fait partie du **jeton signé** (ADR-006) : elle est vérifiée au commit comme le tarif.
- Le tarif reste **100 % déterministe** (`get_quote` sur `pricing_zones`). Ni Vapi ni aucun LLM ne devine, n'arrondit ni ne négocie un prix. Si la distance est inconnue, statut explicite `DISTANCE_REQUIRED` — jamais de prix inventé.

---

## ADR-005 — Périmètre gelé V0.x : la boucle d'appel jusqu'à confirmation

**Décision.** Le périmètre est **gelé** à la boucle suivante, et à elle seule :

> Appel client → Vapi qualifie → devis déterministe signé (zone incluse) → accord du client → commit idempotent (devis consommé, client lié) → bail chauffeur Telegram à boutons (5 min, fencing token, identité vérifiée) → acceptation explicite → `CONFIRMED_R10` → confirmation client (routée SMS/appel) → course → reçu.

**Hors périmètre** (reportés après la preuve de la boucle sur des courses réelles) :
- l'application client type Uber (V1.0) ;
- le fork Cube Farm en Business OS Command Center ;
- la gateway multi-protocoles au-delà des intégrations nécessaires à la boucle (Vapi, n8n, Supabase, Telegram, Twilio, Google Maps, Stripe) ;
- toute automatisation B2B avancée au-delà de la création de compte avec validation humaine (ADR-007).

**Critère de passage en V1.** Un test de bout en bout vérifiable : une demande créée **une seule fois** (idempotence), une seule acceptation possible **par le chauffeur assigné**, **jamais deux courses confirmées simultanées pour le même chauffeur**, une confirmation client émise uniquement après acceptation, avec reçus R10 chaînés — puis des courses réelles exploitées sans incident de confirmation. (Le test SQL de la boucle est livré : `test_loop_v03.sh` / `test_loop_v03.sql` ; son résultat réel est rapporté dans le README.)

---

## ADR-006 — Jeton de devis signé HMAC (prix verrouillé) — RÉVISÉE V0.3

**Décision.** Le prix annoncé au client est **verrouillé par un jeton de devis signé HMAC-SHA256**, émis côté serveur par la RPC `issue_quote_token` au moment du devis.

**Précisions.**
- Le jeton lie : **identifiant unique de devis (`qid`, UUID)**, type de course, **zone tarifaire**, distance, **tarif calculé**, adresses, horaire de prise en charge, expiration courte (15 minutes). Le secret de signature vit côté base (`internal_secrets`, jamais lisible par le rôle de service — ADR-011) ; sa valeur initiale est un placeholder à remplacer avant production.
- La RPC de commit (`commit_booking`) **exige** le jeton, **vérifie** signature, expiration et correspondance complète (zone incluse), puis **recalcule** le tarif depuis `pricing_zones`. Si la grille a changé, rejet `FARE_CHANGED` et nouveau devis exigé.
- Le `quoted_fare` du modèle vocal n'est **jamais écrit tel quel** : contrôle croisé uniquement.
- Rejets explicites : `QUOTE_INVALID`, `QUOTE_EXPIRED`, `QUOTE_MISMATCH`, `FARE_CHANGED`, `ZONE_REQUIRED` — le câblage des workflows 01/02 **rejoint réellement la réponse Vapi structurée** annoncée par le prompt (branches d'erreur dédiées, V0.3 — en V0.2 l'échec du nœud HTTP arrêtait le workflow, audit P1-04).
- **Consommation unique** : le jeton est consommé au commit (ADR-008).

**Conséquence.** Il est structurellement impossible de faire enregistrer un tarif inventé, remisé, périmé — ou de rejouer un devis.

---

## ADR-007 — Comptes partenaires : naissance en PENDING_VALIDATION — RÉVISÉE V0.3

**Décision.** Aucun compte partenaire (HOSPITAL_PARTNER, CORPORATE) n'est actif à sa création. Toute demande crée le compte en statut **`PENDING_VALIDATION`** (RPC `request_partner_account`) ; seul le **propriétaire** peut l'activer (RPC `activate_partner_account`), ou le rejeter.

**Précisions.**
- **V0.3 : le refus est un contrôle de privilège, pas une procédure.** `activate_partner_account` n'est accordée à **aucun** rôle applicatif (pas même `service_role`) : l'audit a démontré qu'en V0.2 elle restait exécutable par la clé de service. Le test T15 rejoue la tentative sous `service_role` et exige le refus. L'activation se fait par le propriétaire via la console SQL Supabase ou un rôle dédié.
- Le webhook de demande exige un **secret partagé** ; le webhook Stripe exige une **signature vérifiée et fraîche** (ADR-011) avant tout traitement.
- L'upsert client ordinaire ne modifie jamais `account_type` ni `partner_status` d'un client existant.
- Aucune facturation B2B ni fiche de liaison n'est produite pour un compte non `ACTIVE`.

---

## ADR-008 — Idempotence du commit et consommation unique du devis — NOUVELLE V0.3

**Décision.** Un devis ne peut créer **qu'une seule course**. La consommation du jeton est une **contrainte structurelle**, pas une vérification applicative.

**Mécanisme.**
- Table `quote_redemptions` : `quote_id` (clé primaire, tirée du jeton signé), empreinte du jeton **unique**, `booking_id` **unique**, et la **clé d'idempotence de l'appel Vapi** (`p_idempotency_key` = `toolCallId`, `p_vapi_call_id` = id d'appel) transmise par le workflow 01.
- `commit_booking` prend un **verrou consultatif transactionnel** sur le `quote_id`, puis, **dans la même transaction** : vérification du jeton → insertion de la consommation → création de la course → reçus. Tout échec annule tout.
- **Retry** : recommiter le même jeton (réseau, timeout, rejeu Vapi) **retourne la course existante** avec `idempotent_replay = true` — pas de doublon, pas d'erreur sèche.
- **Cas légitime de deux trajets identiques** : ils passent par **deux devis distincts** (deux appels `get_quote`, deux `quote_id`). L'unicité porte sur le devis, jamais sur le contenu du trajet.

**Preuve.** Test T13 (`test_loop_v03.sql`) : même jeton commité trois fois → une seule course, même identifiant retourné.

---

## ADR-009 — Capacité chauffeur : jamais deux courses confirmées simultanées — NOUVELLE V0.3

**Décision.** Un chauffeur ne peut pas être engagé sur deux courses dont les fenêtres se chevauchent. Le contrôle est **transactionnel et double** : à l'émission du bail **et** à la confirmation.

**Mécanisme.**
- Chaque course porte une **durée estimée** (`estimated_duration_minutes` : explicite au commit, sinon estimée depuis la distance — 2,4 min/mile + 10 min, plancher 20 min). La fenêtre d'engagement = prise en charge → fin estimée, **élargie d'une marge inter-courses paramétrable** (15 minutes, `fn_capacity_margin_minutes()`).
- `offer_driver_lease` refuse l'émission en cas de conflit (`DRIVER_UNAVAILABLE`) ; `confirm_driver_lease_r10` **re-contrôle** avant l'UPDATE atomique (une course confirmée entre l'émission et l'acceptation fait échouer la confirmation proprement, jamais un double `CONFIRMED_R10`).
- En conflit : le workflow oriente vers un autre chauffeur ou la branche `NO_DRIVER_AVAILABLE` + escalade propriétaire par appel. Le client n'est jamais laissé sans réponse.

**Preuve.** Test T14 : bail chevauchant refusé à l'émission ; confirmation refusée après déplacement du créneau ; un seul `CONFIRMED_R10` sur le créneau.

---

## ADR-010 — Identité du callback chauffeur — NOUVELLE V0.3

**Décision.** Le fencing token prouve la **version du bail**, pas l'**identité** de celui qui clique. Les deux sont exigés.

**Mécanisme.**
- Table `drivers` : registre des chauffeurs (`driver_ref` = identifiant de discussion Telegram, `telegram_user_id` unique, état actif). L'émission d'un bail à un chauffeur non enregistré ou inactif est rejetée (`DRIVER_NOT_REGISTERED`) — aucune création implicite (la V0.2 « upsertait » silencieusement n'importe quel destinataire).
- Le workflow 02 extrait `callback_query.from.id` (identité authentifiée par Telegram) et le transmet aux RPC `confirm/reject_driver_lease_by_token(p_fencing_token, p_telegram_user_id)`.
- La base vérifie que l'expéditeur est **le chauffeur assigné au bail** ; sinon rejet `CALLBACK_NOT_AUTHORIZED`. L'acteur consigné dans les reçus est dérivé de l'identité vérifiée (`driver:<telegram_user_id>`) — la constante `driver-telegram` de la V0.2 disparaît.

**Preuve.** Test T16 : token valide + mauvais `telegram_user_id` → acceptation **et** refus rejetés ; le chauffeur assigné confirme.

---

## ADR-011 — ACL minimales et écritures gardées — NOUVELLE V0.3

**Décision.** Le rôle de service reçoit le **minimum explicite**, et **toute écriture métier passe par une fonction gardée** — jamais par un UPDATE direct de table.

**Mécanisme.**
- `GRANT USAGE, SELECT ON ALL SEQUENCES` à `service_role` (l'audit a reproduit l'échec V0.2 : `permission denied for sequence workgraph_receipts_r10_seq` en plein reçu R10).
- `internal_secrets` : **aucun grant** à `service_role` ; la vérification HMAC reste encapsulée dans les fonctions `SECURITY DEFINER` du propriétaire.
- `bookings` / `customers` : `service_role` en **SELECT seul**. Les écritures passent par les RPC gardées : transitions d'état par `transition_booking` et les RPC de bail, statut de paiement par `set_payment_status` (transitions gardées + reçu), drapeau d'avis par `mark_review_requested`. Les PATCH directs des workflows 03/04 de la V0.2 sont supprimés — ils contournaient toutes les gardes.
- **Stripe** : vérification de signature avec **tolérance de fraîcheur de 300 secondes** (la V0.2 acceptait un horodatage `t=1`), **corps brut obligatoire** (le repli `JSON.stringify` est supprimé : il signait un corps reconstruit), et **déduplication par `event.id`** (table `stripe_events`, RPC `record_stripe_event`) — un événement Stripe peut être livré plusieurs fois ; il n'est appliqué qu'une fois. Le prix du lien de paiement est construit depuis le **montant réel de la course** (`price_data` dynamique) et `metadata[booking_id]` est propagée explicitement (lien → session → PaymentIntent).
- **MCP** : les serveurs actifs ne référencent que des paquets npm **existants et épinglés** (les entrées 404 de la V0.2 sont retirées ou désactivées et documentées) ; les en-têtes d'authentification déclarés sont **réellement transmis** (Vapi : `--header "Authorization: Bearer ${VAPI_API_KEY}"`).

**Preuve.** Tests T12 (privilèges) et T15 (boucle complète rejouée sous `SET ROLE service_role` : elle passe — et la lecture des secrets, l'activation partenaire et l'UPDATE direct y sont refusés).
