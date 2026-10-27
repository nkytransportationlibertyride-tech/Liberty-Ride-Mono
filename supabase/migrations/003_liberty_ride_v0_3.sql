-- =====================================================================
-- Liberty Ride NKY Trans, LLC — Migration V0.3 (COMPLÈTE ET AUTONOME)
-- Fichier : 003_liberty_ride_v0_3.sql
-- Base    : PostgreSQL / Supabase — SOURCE DE VÉRITÉ UNIQUE des V0.x
--
-- Cette migration REMPLACE la V0.2 (002_liberty_ride_v0_2.sql) : elle se
-- suffit à elle-même sur une base vierge. Elle applique INTÉGRALEMENT
-- l'audit indépendant de ChatGPT du 2026-10-21 (voir la section
-- « Réponse à l'audit ChatGPT » du README V0.3) :
--
--   P1-01 IDEMPOTENCE DU COMMIT. Le jeton de devis porte un quote_id
--       unique ; commit_booking le CONSOMME dans la table
--       quote_redemptions (contraintes UNIQUE sur quote_id, sur
--       l'empreinte du jeton et sur booking_id), dans la MÊME
--       transaction que la création de la course, sous verrou
--       consultatif (advisory lock) par quote_id. Un retry du même
--       commit (même jeton, même clé d'idempotence Vapi) retourne LA
--       MÊME réservation avec idempotent_replay=true — jamais un
--       doublon, jamais une erreur sèche. Deux trajets identiques
--       légitimes = deux devis distincts = deux quote_id distincts.
--   P1-02 CAPACITÉ CHAUFFEUR. Nouvelle table drivers et contrôle de
--       chevauchement EN TRANSACTION : à l'émission du bail ET à la
--       confirmation, fn_driver_conflict compare la fenêtre de la
--       course (prise en charge + durée estimée + marge inter-courses
--       de 15 min) aux courses LEASE_OFFERED / CONFIRMED_R10 /
--       DRIVER_EN_ROUTE du même chauffeur. Conflit = exception
--       DRIVER_UNAVAILABLE (branche NO_DRIVER_AVAILABLE / escalade),
--       jamais deux CONFIRMED_R10 simultanés pour un même chauffeur.
--   P1-03 ACL COMPLÈTES. Toutes les fonctions métier sont
--       SECURITY DEFINER (propriétaire = rôle d'administration) : le
--       rôle de service n'a AUCUN accès direct en écriture aux tables.
--       internal_secrets n'est lisible par AUCUN rôle applicatif : le
--       secret HMAC n'est touché que par les fonctions SECURITY
--       DEFINER du propriétaire. activate_partner_account est RÉVOQUÉE
--       pour service_role (propriétaire uniquement, fait foi — plus une
--       simple règle de procédure). Les transitions d'état ne peuvent
--       plus être contournées par un UPDATE direct sur bookings :
--       service_role n'a que SELECT sur bookings ; le statut de
--       paiement passe par la RPC gardée set_payment_status.
--       GRANT USAGE, SELECT explicite sur TOUTES les séquences
--       (dont workgraph_receipts_r10_seq) à service_role.
--   P1-05 IDENTITÉ DU CALLBACK CHAUFFEUR. La table drivers enregistre
--       telegram_user_id de chaque chauffeur. Les RPC *_by_token
--       exigent p_telegram_user_id et vérifient qu'il correspond au
--       chauffeur ASSIGNÉ au bail : la possession du seul fencing
--       token ne suffit plus. L'acteur consigné dans les reçus est
--       'driver:<telegram_user_id>' — plus de constante 'driver-telegram'.
--   TARIFS (secondaire, audit §4). La grille aéroport est de nouveau
--       GÉOGRAPHIQUE, comme le restitue l'audit depuis le document
--       d'architecture : ZONE_1 = forfait 35 $, ZONE_2 = forfait 45 $,
--       ZONE_3 = 15 $ + 2,75 $/mile, attente tarifée (franchise +
--       tarif/minute) ; médical = 20 $ + 2,75 $/mile. La V0.2 avait
--       aplati à tort en 15 + 2,75 partout : c'est corrigé, et les
--       zones sont implémentées dans pricing_zones (zone_code).
--       À VALIDER ET SIGNER PAR LE PROPRIÉTAIRE (ADR-004).
--   STRIPE (secondaire). Nouvelle table stripe_events : la RPC
--       record_stripe_event consomme chaque event.id UNE seule fois
--       (déduplication) et applique le statut de paiement de façon
--       gardée. La fraîcheur de la signature est vérifiée côté n8n
--       (tolérance 5 minutes) avant l'appel à cette RPC.
--
-- Conservé des V0.1/V0.2 (déjà corrigés) :
--   - Contrat Vapi : devis signé HMAC (ADR-006) puis commit ; le tarif
--     du modèle n'est jamais écrit ; recalcul serveur systématique.
--   - receipt_hash par TRIGGER chaîné SHA-256 ; reçus immuables
--     (ON DELETE RESTRICT + trigger anti UPDATE/DELETE).
--   - fencing_token renouvelé à CHAQUE émission de bail ; résolution
--     de la course par le jeton côté base.
--   - customer_id renseigné dès le commit (upsert par téléphone).
--   - Comptes partenaires nés PENDING_VALIDATION (ADR-007).
--   - get_quote explicite : DISTANCE_REQUIRED / ZONE_REQUIRED / NO_BAND,
--     jamais de NULL muet, jamais de prix inventé.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------

CREATE TYPE service_type AS ENUM (
    'AIRPORT_CVG',
    'MEDICAL_HOSPITAL',
    'BUSINESS_EXEC',
    'LOCAL_TAXI'
);

-- Machine à états des courses (bail chauffeur de 5 minutes).
-- REQUESTED -> INTAKE_VALIDATED -> LEASE_OFFERED_ATTEMPTED_UNKNOWN
--   -> CONFIRMED_R10 (uniquement sur acceptation explicite du chauffeur
--      ET capacité chauffeur disponible, P1-02)
-- Branches : LEASE_EXPIRED_ESCALATED, DRIVER_REJECTED, NO_DRIVER_AVAILABLE
-- Puis : DRIVER_EN_ROUTE, COMPLETED, CANCELLED.
CREATE TYPE ride_status AS ENUM (
    'REQUESTED',
    'INTAKE_VALIDATED',
    'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
    'CONFIRMED_R10',
    'LEASE_EXPIRED_ESCALATED',
    'DRIVER_REJECTED',
    'NO_DRIVER_AVAILABLE',
    'DRIVER_EN_ROUTE',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'INVOICED_B2B',
    'REFUNDED'
);

CREATE TYPE account_type AS ENUM (
    'INDIVIDUAL',
    'VIP_FREQUENT',
    'HOSPITAL_PARTNER',
    'CORPORATE'
);

-- Statut de validation des comptes partenaires (B2B / hôpitaux).
-- Aucun compte partenaire n'est actif à sa création (ADR-007).
CREATE TYPE partner_status AS ENUM (
    'NONE',
    'PENDING_VALIDATION',
    'ACTIVE',
    'REJECTED'
);

-- Modèle de tarification d'une ligne de grille.
CREATE TYPE pricing_model AS ENUM (
    'FLAT',           -- forfait fixe (flat_fare), quelle que soit la distance
    'BASE_PLUS_MILE'  -- base_fare + per_mile_rate * miles
);

-- ---------------------------------------------------------------------
-- Table 1/9 : customers (CRM)
-- ---------------------------------------------------------------------

CREATE TABLE customers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone            TEXT NOT NULL UNIQUE,
    name             TEXT,
    email            TEXT,
    account_type     account_type NOT NULL DEFAULT 'INDIVIDUAL',
    partner_status   partner_status NOT NULL DEFAULT 'NONE',
    total_rides      INTEGER NOT NULL DEFAULT 0,
    review_requested BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT partner_status_consistent CHECK (
        (account_type IN ('HOSPITAL_PARTNER', 'CORPORATE')
            AND partner_status <> 'NONE')
        OR (account_type NOT IN ('HOSPITAL_PARTNER', 'CORPORATE')
            AND partner_status = 'NONE')
    )
);

-- ---------------------------------------------------------------------
-- Table 2/9 : drivers (chauffeurs) — NOUVELLE V0.3 (audit P1-05/P1-02)
-- driver_ref = identifiant du canal chauffeur utilisé par les
-- workflows (chat_id Telegram, sous forme texte). telegram_user_id =
-- identité Telegram authentifiée de l'expéditeur des callbacks : elle
-- est VÉRIFIÉE côté base à chaque acceptation/refus (P1-05).
-- Un chauffeur doit être enregistré (par le propriétaire) AVANT de
-- pouvoir recevoir un bail : aucune création implicite.
-- ---------------------------------------------------------------------

CREATE TABLE drivers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_ref       TEXT NOT NULL UNIQUE,   -- ex. chat_id Telegram (texte)
    display_name     TEXT NOT NULL,
    phone            TEXT,
    telegram_user_id BIGINT UNIQUE,          -- identité callback (P1-05)
    telegram_chat_id BIGINT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drivers_telegram_user ON drivers (telegram_user_id);

-- ---------------------------------------------------------------------
-- Table 3/9 : pricing_zones (grille tarifaire déterministe, ZONES)
-- V0.3 : la grille aéroport redevient GÉOGRAPHIQUE (audit §4) :
--   AIRPORT_CVG ZONE_1 : forfait 35 $ ; ZONE_2 : forfait 45 $ ;
--   ZONE_3 : 15 $ + 2,75 $/mile. Attente tarifée sur toutes les zones
--   aéroport (franchise waiting_grace_minutes, puis
--   waiting_rate_per_min) — facturée en fin de course, pas au devis.
--   MEDICAL_HOSPITAL : 20 $ + 2,75 $/mile (zone 'ALL', bandes distance).
-- Les périmètres de zones (villes) sont PROVISOIRES et documentés dans
-- le README : ils doivent être validés par le propriétaire (ADR-004).
-- Les lignes 'ALL' servent les services sans zonage géographique.
-- ---------------------------------------------------------------------

CREATE TABLE pricing_zones (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type          service_type NOT NULL,
    zone_code             TEXT NOT NULL DEFAULT 'ALL',
    zone_label            TEXT,
    pricing_model         pricing_model NOT NULL DEFAULT 'BASE_PLUS_MILE',
    min_miles             NUMERIC(6,2) NOT NULL,
    max_miles             NUMERIC(6,2),        -- NULL = pas de borne haute
    base_fare             NUMERIC(10,2) NOT NULL DEFAULT 0,
    per_mile_rate         NUMERIC(10,2) NOT NULL DEFAULT 0,
    flat_fare             NUMERIC(10,2),       -- si pricing_model = 'FLAT'
    waiting_grace_minutes INTEGER NOT NULL DEFAULT 0,
    waiting_rate_per_min  NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency              CHAR(3) NOT NULL DEFAULT 'USD',
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pricing_band_valid CHECK (
        max_miles IS NULL OR max_miles > min_miles
    ),
    CONSTRAINT pricing_amounts_nonnegative CHECK (
        base_fare >= 0 AND per_mile_rate >= 0
        AND (flat_fare IS NULL OR flat_fare >= 0)
        AND waiting_rate_per_min >= 0 AND waiting_grace_minutes >= 0
    ),
    CONSTRAINT pricing_model_consistent CHECK (
        (pricing_model = 'FLAT' AND flat_fare IS NOT NULL)
        OR pricing_model = 'BASE_PLUS_MILE'
    ),
    UNIQUE (service_type, zone_code, min_miles)
);

-- GRILLE PROVISOIRE — À VALIDER ET SIGNER PAR LE PROPRIÉTAIRE (ADR-004).
INSERT INTO pricing_zones
    (service_type, zone_code, zone_label, pricing_model,
     min_miles, max_miles, base_fare, per_mile_rate, flat_fare,
     waiting_grace_minutes, waiting_rate_per_min)
VALUES
    -- AIRPORT_CVG — grille géographique du document d'architecture :
    ('AIRPORT_CVG', 'ZONE_1',
     'Zone 1 (provisoire) : CVG/Hebron/Burlington, Erlanger',
     'FLAT', 0, NULL, 0, 0, 35, 5, 0.50),
    ('AIRPORT_CVG', 'ZONE_2',
     'Zone 2 (provisoire) : Florence, Edgewood, Ft Mitchell, Covington, Newport',
     'FLAT', 0, NULL, 0, 0, 45, 5, 0.50),
    ('AIRPORT_CVG', 'ZONE_3',
     'Zone 3 (provisoire) : au-delà — Cincinnati OH, Independence, Union, autres',
     'BASE_PLUS_MILE', 0, NULL, 15, 2.75, NULL, 5, 0.50),
    -- MEDICAL_HOSPITAL : 20 $ + 2,75 $/mile (document d'architecture)
    ('MEDICAL_HOSPITAL', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 0,  10, 20, 2.75, NULL, 10, 0.50),
    ('MEDICAL_HOSPITAL', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 10, 20, 20, 2.75, NULL, 10, 0.50),
    ('MEDICAL_HOSPITAL', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 20, NULL, 20, 2.75, NULL, 10, 0.50),
    -- BUSINESS_EXEC : aucun chiffre dans le document d'architecture —
    -- base standard 15 $ retenue à titre provisoire (à valider).
    ('BUSINESS_EXEC', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 0,  10, 15, 2.75, NULL, 0, 0.50),
    ('BUSINESS_EXEC', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 10, 20, 15, 2.75, NULL, 0, 0.50),
    ('BUSINESS_EXEC', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 20, NULL, 15, 2.75, NULL, 0, 0.50),
    -- LOCAL_TAXI : base 15 $ + 2,75 $/mile (document d'architecture)
    ('LOCAL_TAXI', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 0,  10, 15, 2.75, NULL, 0, 0.50),
    ('LOCAL_TAXI', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 10, 20, 15, 2.75, NULL, 0, 0.50),
    ('LOCAL_TAXI', 'ALL', 'Toutes zones',
     'BASE_PLUS_MILE', 20, NULL, 15, 2.75, NULL, 0, 0.50);

-- ---------------------------------------------------------------------
-- Table 4/9 : bookings (courses)
-- V0.3 : + assigned_driver_id (FK drivers), + zone_code (zone tarifaire
-- du devis consommé), + estimated_duration_minutes (capacité, P1-02).
-- ---------------------------------------------------------------------

CREATE TABLE bookings (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id            UUID REFERENCES customers (id) ON DELETE SET NULL,
    customer_name          TEXT NOT NULL,
    customer_phone         TEXT NOT NULL,
    service_type           service_type NOT NULL,
    zone_code              TEXT,              -- zone du devis (aéroport)
    pickup_address         TEXT NOT NULL,
    dropoff_address        TEXT NOT NULL,
    pickup_datetime        TIMESTAMPTZ NOT NULL,
    flight_number          TEXT,              -- requis si AIRPORT_CVG (applicatif)
    special_needs          TEXT,              -- mobilité, attente retour, etc.
    distance_miles         NUMERIC(6,2),
    estimated_duration_minutes INTEGER,       -- fenêtre capacité chauffeur
    estimated_fare         NUMERIC(10,2),
    fare_currency          CHAR(3) NOT NULL DEFAULT 'USD',
    quote_token_fingerprint TEXT,             -- empreinte du jeton consommé
    payment_status         payment_status NOT NULL DEFAULT 'PENDING',
    ride_status            ride_status NOT NULL DEFAULT 'REQUESTED',
    -- Bail chauffeur courant (un seul bail actif par course)
    assigned_driver_id     UUID REFERENCES drivers (id) ON DELETE SET NULL,
    assigned_driver_ref    TEXT,              -- copie du driver_ref au bail
    current_fencing_token  UUID,              -- renouvelé à chaque émission
    lease_attempt          INTEGER NOT NULL DEFAULT 0,
    lease_offered_at       TIMESTAMPTZ,
    lease_expires_at       TIMESTAMPTZ,
    confirmed_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_status   ON bookings (ride_status);
CREATE INDEX idx_bookings_pickup   ON bookings (pickup_datetime);
CREATE INDEX idx_bookings_phone    ON bookings (customer_phone);
CREATE INDEX idx_bookings_customer ON bookings (customer_id);
CREATE INDEX idx_bookings_token    ON bookings (current_fencing_token);
CREATE INDEX idx_bookings_driver   ON bookings (assigned_driver_id, pickup_datetime)
    WHERE ride_status IN (
        'LEASE_OFFERED_ATTEMPTED_UNKNOWN', 'CONFIRMED_R10', 'DRIVER_EN_ROUTE'
    );
CREATE INDEX idx_bookings_leaseexp ON bookings (lease_expires_at)
    WHERE ride_status = 'LEASE_OFFERED_ATTEMPTED_UNKNOWN';

-- ---------------------------------------------------------------------
-- Table 5/9 : fleet_logs (flotte & conformité)
-- ---------------------------------------------------------------------

CREATE TABLE fleet_logs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id            TEXT NOT NULL,
    mileage               INTEGER NOT NULL,
    next_oil_change_miles INTEGER,
    insurance_expiry_date DATE,
    cvg_permit_status     TEXT,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fleet_logs_vehicle ON fleet_logs (vehicle_id, created_at DESC);

-- ---------------------------------------------------------------------
-- Table 6/9 : workgraph_receipts_r10 (reçus immuables, chaîne de hachage)
-- - Aucun ON DELETE CASCADE : bookings -> reçus en RESTRICT.
-- - receipt_hash calculé par le trigger trg_r10_hash AVANT insertion.
-- - UPDATE et DELETE interdits par le trigger trg_r10_immutable.
-- ---------------------------------------------------------------------

CREATE TABLE workgraph_receipts_r10 (
    seq          BIGSERIAL,
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID NOT NULL REFERENCES bookings (id) ON DELETE RESTRICT,
    event_type   TEXT NOT NULL,
    from_state   ride_status,
    to_state     ride_status,
    actor        TEXT NOT NULL,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash    TEXT,
    receipt_hash TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (seq)
);

CREATE INDEX idx_r10_booking ON workgraph_receipts_r10 (booking_id, seq);

CREATE OR REPLACE FUNCTION fn_r10_compute_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_prev TEXT;
BEGIN
    SELECT r.receipt_hash
      INTO v_prev
      FROM workgraph_receipts_r10 AS r
     WHERE r.booking_id = NEW.booking_id
     ORDER BY r.seq DESC
     LIMIT 1;

    NEW.prev_hash := COALESCE(v_prev, 'GENESIS');
    NEW.receipt_hash := encode(
        digest(
            NEW.prev_hash
            || '|' || NEW.booking_id::TEXT
            || '|' || NEW.event_type
            || '|' || COALESCE(NEW.from_state::TEXT, 'NULL')
            || '|' || COALESCE(NEW.to_state::TEXT, 'NULL')
            || '|' || NEW.actor
            || '|' || NEW.payload::TEXT
            || '|' || NEW.created_at::TEXT,
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_r10_hash
    BEFORE INSERT ON workgraph_receipts_r10
    FOR EACH ROW EXECUTE FUNCTION fn_r10_compute_hash();

CREATE OR REPLACE FUNCTION fn_r10_forbid_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'workgraph_receipts_r10 is append-only: % forbidden', TG_OP;
END;
$$;

CREATE TRIGGER trg_r10_immutable
    BEFORE UPDATE OR DELETE ON workgraph_receipts_r10
    FOR EACH ROW EXECUTE FUNCTION fn_r10_forbid_mutation();

-- ---------------------------------------------------------------------
-- Table 7/9 : internal_secrets (secrets applicatifs côté base)
-- Contient le secret de signature HMAC des jetons de devis.
-- V0.3 (P1-03) : AUCUN rôle applicatif n'y a accès — ni lecture ni
-- écriture. Seules les fonctions SECURITY DEFINER détenues par le
-- propriétaire de la base lisent le secret (voir fn_quote_secret).
-- La valeur semée est un PLACEHOLDER : la remplacer par un secret long
-- et aléatoire avant production, via le SQL Editor Supabase (jamais
-- dans un fichier versionné).
-- ---------------------------------------------------------------------

CREATE TABLE internal_secrets (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO internal_secrets (key, value)
VALUES ('quote_hmac_secret', 'A_REMPLACER_PAR_UN_SECRET_LONG_ALEATOIRE');

-- ---------------------------------------------------------------------
-- Table 8/9 : quote_redemptions — NOUVELLE V0.3 (audit P1-01)
-- Consommation UNIQUE de chaque devis : un quote_id (porté par le
-- jeton signé) ne peut créer qu'UNE course. Le retry du même commit
-- retrouve la course existante par cette table et la retourne.
-- ---------------------------------------------------------------------

CREATE TABLE quote_redemptions (
    quote_id          UUID PRIMARY KEY,             -- 'qid' du jeton signé
    token_fingerprint TEXT NOT NULL UNIQUE,         -- empreinte du jeton
    booking_id        UUID NOT NULL UNIQUE
                      REFERENCES bookings (id) ON DELETE RESTRICT,
    vapi_call_id      TEXT,                          -- id d'appel Vapi
    vapi_tool_call_id TEXT,                          -- clé d'idempotence Vapi
    redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    redeemed_by       TEXT NOT NULL
);

CREATE INDEX idx_redemptions_toolcall ON quote_redemptions (vapi_tool_call_id);

-- ---------------------------------------------------------------------
-- Table 9/9 : stripe_events — NOUVELLE V0.3 (secondaire Stripe)
-- Déduplication des événements Stripe : chaque event.id n'est traité
-- qu'UNE fois (record_stripe_event). La fraîcheur de la signature
-- (tolérance 5 min) est vérifiée côté n8n avant l'appel.
-- ---------------------------------------------------------------------

CREATE TABLE stripe_events (
    event_id      TEXT PRIMARY KEY,
    event_type    TEXT NOT NULL,
    booking_id    UUID REFERENCES bookings (id) ON DELETE SET NULL,
    target_status payment_status,
    processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customers_touch
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_drivers_touch
    BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_bookings_touch
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_fleet_logs_touch
    BEFORE UPDATE ON fleet_logs
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();


-- ---------------------------------------------------------------------
-- Fonction interne : écriture d'un reçu R10 (SECURITY DEFINER : les
-- rôles applicatifs n'ont aucun INSERT direct sur les reçus).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_write_receipt(
    p_booking_id UUID,
    p_event_type TEXT,
    p_from_state ride_status,
    p_to_state   ride_status,
    p_actor      TEXT,
    p_payload    JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workgraph_receipts_r10
        (booking_id, event_type, from_state, to_state, actor, payload)
    VALUES
        (p_booking_id, p_event_type, p_from_state, p_to_state, p_actor, p_payload)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- get_quote : tarif DÉTERMINISTE, lecture seule.
-- Ne crée rien, ne déclenche rien, n'alerte aucun chauffeur.
-- Zonage (V0.3) : la zone effective est COALESCE(p_zone_code, 'ALL').
-- Pour AIRPORT_CVG il n'existe que des lignes ZONE_1/2/3 : sans zone
-- fournie, aucune ligne ne correspond -> NULL -> l'appelant traduit
-- en ZONE_REQUIRED (jamais un prix inventé).
-- Retourne NULL si la distance est NULL ou si aucune bande active ne
-- couvre la demande — jamais de prix deviné.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_quote(
    p_service_type   service_type,
    p_distance_miles NUMERIC,
    p_zone_code      TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
               WHEN pz.pricing_model = 'FLAT' THEN pz.flat_fare
               ELSE pz.base_fare + pz.per_mile_rate * p_distance_miles
           END
      FROM pricing_zones AS pz
     WHERE pz.service_type = p_service_type
       AND pz.is_active
       AND pz.zone_code = COALESCE(p_zone_code, 'ALL')
       AND p_distance_miles IS NOT NULL
       AND p_distance_miles >= pz.min_miles
       AND (pz.max_miles IS NULL OR p_distance_miles < pz.max_miles)
     LIMIT 1;
$$;

-- ---------------------------------------------------------------------
-- compute_waiting_charge : coût d'attente en fin de course (grille
-- « attente tarifée ») : franchise de waiting_grace_minutes, puis
-- waiting_rate_per_min par minute commencée au-delà. Lecture seule.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_waiting_charge(
    p_service_type   service_type,
    p_zone_code      TEXT,
    p_waiting_minutes INTEGER
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
               GREATEST(p_waiting_minutes - pz.waiting_grace_minutes, 0)
               * pz.waiting_rate_per_min,
               0
           )
      FROM pricing_zones AS pz
     WHERE pz.service_type = p_service_type
       AND pz.is_active
       AND pz.zone_code = COALESCE(p_zone_code, 'ALL')
     LIMIT 1;
$$;

-- ---------------------------------------------------------------------
-- fn_estimate_duration_minutes : durée estimée d'une course (fenêtre
-- de capacité, P1-02) quand le commit ne la fournit pas : moyenne
-- urbaine 25 mph (2,4 min/mile) + 10 min de battement, plancher 20.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_estimate_duration_minutes(
    p_distance_miles NUMERIC
)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT GREATEST(20, CEIL(COALESCE(p_distance_miles, 10) * 2.4)::INTEGER + 10);
$$;

-- ---------------------------------------------------------------------
-- fn_capacity_margin_minutes : marge inter-courses (P1-02). Constante
-- documentée : 15 minutes de battement avant ET après chaque course
-- dans le contrôle de chevauchement.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_capacity_margin_minutes()
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 15; $$;

-- ---------------------------------------------------------------------
-- fn_driver_conflict : retourne l'id d'une course existante du
-- chauffeur dont la fenêtre [prise en charge - marge, fin estimée +
-- marge] chevauche [p_start, p_end], ou NULL. États qui ENGAGENT le
-- planning : bail offert, confirmé, en route. Utilisée à l'émission
-- du bail ET à la confirmation (double garde, P1-02).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_driver_conflict(
    p_driver_id       UUID,
    p_start           TIMESTAMPTZ,
    p_end             TIMESTAMPTZ,
    p_exclude_booking UUID
)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT b.id
      FROM bookings AS b
     WHERE b.assigned_driver_id = p_driver_id
       AND b.id <> p_exclude_booking
       AND b.ride_status IN (
           'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
           'CONFIRMED_R10',
           'DRIVER_EN_ROUTE'
       )
       AND b.pickup_datetime
             - make_interval(mins => fn_capacity_margin_minutes())
           < p_end
       AND b.pickup_datetime
             + make_interval(mins => COALESCE(b.estimated_duration_minutes, 45)
                                      + fn_capacity_margin_minutes())
           > p_start
     LIMIT 1;
$$;

-- ---------------------------------------------------------------------
-- Jetons de devis signés HMAC (ADR-006) — helpers internes
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_quote_secret()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT value FROM internal_secrets WHERE key = 'quote_hmac_secret';
$$;

CREATE OR REPLACE FUNCTION fn_b64url_encode(p_data BYTEA)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    -- encode() insère des retours à la ligne tous les 76 caractères :
    -- ils DOIVENT être retirés, sinon le jeton est indécodable
    -- (bug réel trouvé par le test de la boucle V0.2).
    SELECT replace(replace(replace(replace(
        encode(p_data, 'base64'), E'\n', ''), '+', '-'), '/', '_'), '=', '');
$$;

CREATE OR REPLACE FUNCTION fn_b64url_decode_to_text(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v TEXT := replace(replace(replace(p_text, E'\n', ''), '-', '+'), '_', '/');
BEGIN
    WHILE length(v) % 4 <> 0 LOOP
        v := v || '=';
    END LOOP;
    RETURN convert_from(decode(v, 'base64'), 'UTF8');
END;
$$;

-- ---------------------------------------------------------------------
-- issue_quote_token : calcule le tarif ET émet le jeton de devis signé.
-- Appelée par le workflow n8n 02 (outil Vapi get_quote).
-- Retour JSONB :
--   {status:'OK', fare, currency, quote_token, quote_id, zone_code,
--    expires_at}
--   {status:'DISTANCE_REQUIRED'}  -> distance absente : le modèle doit
--      demander la distance approximative à l'appelant, ou annoncer un
--      tarif « à confirmer » — JAMAIS un prix inventé.
--   {status:'ZONE_REQUIRED'}      -> course aéroport sans zone : le
--      modèle doit déterminer la zone (ville de départ/destination)
--      et rappeler get_quote avec zone_code — jamais de forfait deviné.
--   {status:'NO_BAND'}            -> aucune bande tarifaire (ne devrait
--      pas arriver : la grille couvre toutes les distances).
-- Le jeton lie : quote_id UNIQUE (consommation P1-01), type de course,
-- zone, distance, tarif, adresses, horaire, expiration courte (15 min).
-- HMAC-SHA256 sur la charge utile.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION issue_quote_token(
    p_service_type    service_type,
    p_distance_miles  NUMERIC,
    p_pickup_address  TEXT,
    p_dropoff_address TEXT,
    p_pickup_datetime TIMESTAMPTZ,
    p_zone_code       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_fare    NUMERIC;
    v_exp     TIMESTAMPTZ := now() + INTERVAL '15 minutes';
    v_zone    TEXT := COALESCE(p_zone_code, 'ALL');
    v_qid     UUID := gen_random_uuid();
    v_payload JSONB;
    v_b64     TEXT;
    v_sig     TEXT;
BEGIN
    IF p_distance_miles IS NULL THEN
        RETURN jsonb_build_object('status', 'DISTANCE_REQUIRED');
    END IF;

    IF p_service_type = 'AIRPORT_CVG' AND p_zone_code IS NULL THEN
        RETURN jsonb_build_object('status', 'ZONE_REQUIRED');
    END IF;

    v_fare := get_quote(p_service_type, p_distance_miles, p_zone_code);

    IF v_fare IS NULL THEN
        RETURN jsonb_build_object('status', 'NO_BAND');
    END IF;

    v_payload := jsonb_build_object(
        'v',    1,
        'qid',  v_qid,
        'st',   p_service_type::TEXT,
        'zone', v_zone,
        'dist', p_distance_miles,
        'fare', v_fare,
        'pu',   p_pickup_address,
        'do',   p_dropoff_address,
        'dt',   p_pickup_datetime::TEXT,
        'exp',  EXTRACT(EPOCH FROM v_exp)::BIGINT
    );

    v_b64 := fn_b64url_encode(convert_to(v_payload::TEXT, 'UTF8'));
    v_sig := encode(hmac(v_b64, fn_quote_secret(), 'sha256'), 'hex');

    RETURN jsonb_build_object(
        'status',      'OK',
        'fare',        v_fare,
        'currency',    'USD',
        'quote_token', v_b64 || '.' || v_sig,
        'quote_id',    v_qid,
        'zone_code',   v_zone,
        'expires_at',  v_exp
    );
END;
$$;

-- ---------------------------------------------------------------------
-- fn_verify_quote_token (interne) : vérifie signature, expiration et
-- correspondance complète avec les paramètres du commit (zone incluse).
-- Retourne la charge utile du jeton si tout concorde, sinon lève une
-- exception explicite (QUOTE_INVALID / QUOTE_EXPIRED / QUOTE_MISMATCH).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_verify_quote_token(
    p_quote_token     TEXT,
    p_service_type    service_type,
    p_pickup_address  TEXT,
    p_dropoff_address TEXT,
    p_pickup_datetime TIMESTAMPTZ,
    p_quoted_fare     NUMERIC,
    p_zone_code       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_parts   TEXT[];
    v_payload JSONB;
    v_sig     TEXT;
BEGIN
    v_parts := string_to_array(COALESCE(p_quote_token, ''), '.');
    IF array_length(v_parts, 1) IS DISTINCT FROM 2 THEN
        RAISE EXCEPTION 'QUOTE_INVALID: malformed token';
    END IF;

    v_sig := encode(hmac(v_parts[1], fn_quote_secret(), 'sha256'), 'hex');
    IF v_sig <> v_parts[2] THEN
        RAISE EXCEPTION 'QUOTE_INVALID: bad signature';
    END IF;

    v_payload := fn_b64url_decode_to_text(v_parts[1])::JSONB;

    IF (v_payload ->> 'exp')::BIGINT < EXTRACT(EPOCH FROM now())::BIGINT THEN
        RAISE EXCEPTION 'QUOTE_EXPIRED: request a new quote';
    END IF;

    IF v_payload ->> 'st' <> p_service_type::TEXT
       OR v_payload ->> 'pu' <> p_pickup_address
       OR v_payload ->> 'do' <> p_dropoff_address
       OR v_payload ->> 'zone' <> COALESCE(p_zone_code, 'ALL')
       OR (v_payload ->> 'fare')::NUMERIC <> p_quoted_fare
       OR EXTRACT(EPOCH FROM (v_payload ->> 'dt')::TIMESTAMPTZ)
          <> EXTRACT(EPOCH FROM p_pickup_datetime) THEN
        RAISE EXCEPTION 'QUOTE_MISMATCH: committed values differ from quoted values';
    END IF;

    RETURN v_payload;
END;
$$;


-- ---------------------------------------------------------------------
-- upsert_customer_by_phone : crée ou met à jour le client par téléphone.
-- Appelée par commit_booking AVANT l'insertion de la course : la table
-- customers est donc toujours peuplée et customer_id toujours lié.
-- Ne touche JAMAIS account_type / partner_status d'un client existant
-- (la promotion partenaire passe par request/activate_partner_account).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION upsert_customer_by_phone(
    p_phone TEXT,
    p_name  TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO customers (phone, name, email)
    VALUES (p_phone, p_name, p_email)
    ON CONFLICT (phone) DO UPDATE
        SET name  = COALESCE(EXCLUDED.name, customers.name),
            email = COALESCE(EXCLUDED.email, customers.email)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- commit_booking : LE commit serveur de l'outil create_booking_commit.
-- Garanties :
--   1. Le jeton de devis est EXIGÉ, sa signature et son expiration sont
--      vérifiées, et ses valeurs doivent correspondre au commit.
--   2. Le tarif est RECALCULÉ depuis pricing_zones (zone incluse) ; si
--      la grille a changé depuis le devis, le commit est rejeté
--      (FARE_CHANGED) — le tarif du modèle n'est jamais écrit.
--   3. IDEMPOTENCE (P1-01) : le quote_id du jeton est consommé dans
--      quote_redemptions, sous verrou consultatif par quote_id, dans
--      la même transaction que la création. Un retry (même jeton,
--      même clé d'idempotence Vapi — p_idempotency_key = toolCallId,
--      p_vapi_call_id = id d'appel) retourne la MÊME course avec
--      idempotent_replay = true. Deux trajets identiques légitimes
--      passent par deux devis distincts (deux quote_id distincts).
--   4. Le client est upserté par téléphone, puis la course est créée
--      avec customer_id lié et passe en INTAKE_VALIDATED (reçu R10).
-- Retour JSONB : {booking_id, customer_id, ride_status, estimated_fare,
--                 currency, idempotent_replay}.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION commit_booking(
    p_customer_name   TEXT,
    p_customer_phone  TEXT,
    p_service_type    service_type,
    p_pickup_address  TEXT,
    p_dropoff_address TEXT,
    p_pickup_datetime TIMESTAMPTZ,
    p_flight_number   TEXT,
    p_special_needs   TEXT,
    p_quote_token     TEXT,
    p_quoted_fare     NUMERIC,
    p_actor           TEXT DEFAULT 'vapi',
    p_zone_code       TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_vapi_call_id    TEXT DEFAULT NULL,
    p_estimated_duration_minutes INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payload    JSONB;
    v_qid        UUID;
    v_distance   NUMERIC;
    v_fare       NUMERIC;
    v_customer   UUID;
    v_booking    UUID;
    v_token_fp   TEXT;
    v_existing   UUID;
    v_status     ride_status;
    v_duration   INTEGER;
BEGIN
    v_payload := fn_verify_quote_token(
        p_quote_token, p_service_type, p_pickup_address,
        p_dropoff_address, p_pickup_datetime, p_quoted_fare,
        p_zone_code
    );

    v_qid := (v_payload ->> 'qid')::UUID;

    -- Sérialise les commits concurrents du même devis (P1-01).
    PERFORM pg_advisory_xact_lock(hashtextextended(v_qid::TEXT, 0));

    -- Retry idempotent : ce devis a déjà été consommé -> même course.
    SELECT booking_id INTO v_existing
      FROM quote_redemptions
     WHERE quote_id = v_qid;

    IF FOUND THEN
        SELECT b.id, b.customer_id, b.ride_status, b.estimated_fare
          INTO v_booking, v_customer, v_status, v_fare
          FROM bookings AS b
         WHERE b.id = v_existing;
        RETURN jsonb_build_object(
            'booking_id',        v_booking,
            'customer_id',       v_customer,
            'ride_status',       v_status::TEXT,
            'estimated_fare',    v_fare,
            'currency',          'USD',
            'idempotent_replay', TRUE
        );
    END IF;

    v_distance := (v_payload ->> 'dist')::NUMERIC;

    -- Recalcul déterministe : la grille fait foi, pas le jeton ni le modèle.
    v_fare := get_quote(p_service_type, v_distance, p_zone_code);
    IF v_fare IS NULL OR v_fare <> (v_payload ->> 'fare')::NUMERIC THEN
        RAISE EXCEPTION 'FARE_CHANGED: pricing grid changed since quote, request a new quote';
    END IF;

    v_customer := upsert_customer_by_phone(
        p_customer_phone, p_customer_name, NULL
    );

    v_token_fp := substring(
        encode(digest(p_quote_token, 'sha256'), 'hex') FROM 1 FOR 16
    );

    v_duration := COALESCE(
        p_estimated_duration_minutes,
        fn_estimate_duration_minutes(v_distance)
    );

    INSERT INTO bookings (
        customer_id, customer_name, customer_phone, service_type,
        zone_code, pickup_address, dropoff_address, pickup_datetime,
        flight_number, special_needs, distance_miles,
        estimated_duration_minutes, estimated_fare,
        quote_token_fingerprint, ride_status
    ) VALUES (
        v_customer, p_customer_name, p_customer_phone, p_service_type,
        COALESCE(p_zone_code, 'ALL'), p_pickup_address, p_dropoff_address,
        p_pickup_datetime, p_flight_number, p_special_needs, v_distance,
        v_duration, v_fare, v_token_fp, 'REQUESTED'
    )
    RETURNING id INTO v_booking;

    -- Consommation du devis, DANS LA MÊME TRANSACTION (P1-01). Les
    -- contraintes UNIQUE (quote_id, token_fingerprint, booking_id)
    -- rendent tout second usage structurellement impossible.
    INSERT INTO quote_redemptions (
        quote_id, token_fingerprint, booking_id,
        vapi_call_id, vapi_tool_call_id, redeemed_by
    ) VALUES (
        v_qid, v_token_fp, v_booking,
        p_vapi_call_id, p_idempotency_key, p_actor
    );

    PERFORM fn_write_receipt(
        v_booking, 'QUOTE_REDEEMED', 'REQUESTED', 'REQUESTED', p_actor,
        jsonb_build_object(
            'fare', v_fare,
            'distance_miles', v_distance,
            'zone_code', COALESCE(p_zone_code, 'ALL'),
            'quote_id', v_qid,
            'quote_token_fingerprint', v_token_fp,
            'vapi_call_id', p_vapi_call_id,
            'vapi_tool_call_id', p_idempotency_key
        )
    );

    PERFORM transition_booking(v_booking, 'INTAKE_VALIDATED', p_actor);

    RETURN jsonb_build_object(
        'booking_id',        v_booking,
        'customer_id',       v_customer,
        'ride_status',       'INTAKE_VALIDATED',
        'estimated_fare',    v_fare,
        'currency',          'USD',
        'idempotent_replay', FALSE
    );
END;
$$;

-- ---------------------------------------------------------------------
-- offer_driver_lease : émet un bail chauffeur de 5 minutes.
-- - Le chauffeur est résolu dans la table drivers par son driver_ref
--   (P1-05) : un chauffeur non enregistré ou inactif est rejeté
--   (DRIVER_NOT_REGISTERED) — aucune création implicite.
-- - CAPACITÉ (P1-02) : la fenêtre de la course ne doit chevaucher
--   aucune autre course engagée du même chauffeur, sinon
--   DRIVER_UNAVAILABLE (le workflow oriente alors vers un autre
--   chauffeur ou la branche NO_DRIVER_AVAILABLE / escalade).
-- - Nouvel UUID de fencing_token à CHAQUE émission (jamais réutilisé).
-- - États d'entrée : INTAKE_VALIDATED, LEASE_EXPIRED_ESCALATED,
--   DRIVER_REJECTED. Tout autre état est rejeté.
-- - LEASE_OFFERED_ATTEMPTED_UNKNOWN = tenté, NON confirmé : aucune
--   confirmation client avant confirm_driver_lease_r10.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION offer_driver_lease(
    p_booking_id UUID,
    p_driver_ref TEXT,
    p_actor      TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status   ride_status;
    v_pickup   TIMESTAMPTZ;
    v_duration INTEGER;
    v_driver   UUID;
    v_conflict UUID;
    v_token    UUID := gen_random_uuid();
BEGIN
    SELECT ride_status, pickup_datetime, estimated_duration_minutes
      INTO v_status, v_pickup, v_duration
      FROM bookings
     WHERE id = p_booking_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'booking % not found', p_booking_id;
    END IF;

    IF v_status NOT IN (
        'INTAKE_VALIDATED',
        'LEASE_EXPIRED_ESCALATED',
        'DRIVER_REJECTED'
    ) THEN
        RAISE EXCEPTION 'cannot offer lease from state %', v_status;
    END IF;

    SELECT id INTO v_driver
      FROM drivers
     WHERE driver_ref = p_driver_ref
       AND is_active;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'DRIVER_NOT_REGISTERED: no active driver for ref %', p_driver_ref;
    END IF;

    v_conflict := fn_driver_conflict(
        v_driver,
        v_pickup,
        v_pickup + make_interval(mins => COALESCE(v_duration, 45)),
        p_booking_id
    );
    IF v_conflict IS NOT NULL THEN
        RAISE EXCEPTION
            'DRIVER_UNAVAILABLE: driver % already committed on overlapping booking %',
            p_driver_ref, v_conflict;
    END IF;

    UPDATE bookings
       SET ride_status           = 'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
           assigned_driver_id    = v_driver,
           assigned_driver_ref   = p_driver_ref,
           current_fencing_token = v_token,
           lease_attempt         = lease_attempt + 1,
           lease_offered_at      = now(),
           lease_expires_at      = now() + INTERVAL '5 minutes'
     WHERE id = p_booking_id;

    PERFORM fn_write_receipt(
        p_booking_id,
        'LEASE_OFFERED',
        v_status,
        'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
        p_actor,
        jsonb_build_object(
            'driver_id', v_driver,
            'driver_ref', p_driver_ref,
            'fencing_token', v_token,
            'lease_expires_at', (now() + INTERVAL '5 minutes')::TEXT
        )
    );

    RETURN v_token;
END;
$$;

-- ---------------------------------------------------------------------
-- confirm_driver_lease_r10 : confirmation atomique du bail.
-- Réussit UNIQUEMENT si, en une seule opération : état
-- LEASE_OFFERED_ATTEMPTED_UNKNOWN, fencing_token = bail courant, bail
-- non expiré — ET capacité chauffeur toujours libre (seconde garde
-- P1-02 : si une autre course du même chauffeur a été confirmée entre
-- l'émission et l'acceptation, la confirmation est rejetée par
-- DRIVER_UNAVAILABLE au lieu de créer un double CONFIRMED_R10).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION confirm_driver_lease_r10(
    p_booking_id    UUID,
    p_fencing_token UUID,
    p_actor         TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_driver   UUID;
    v_pickup   TIMESTAMPTZ;
    v_duration INTEGER;
    v_conflict UUID;
    v_rows     INTEGER;
BEGIN
    SELECT assigned_driver_id, pickup_datetime, estimated_duration_minutes
      INTO v_driver, v_pickup, v_duration
      FROM bookings
     WHERE id = p_booking_id
       AND ride_status = 'LEASE_OFFERED_ATTEMPTED_UNKNOWN'
       AND current_fencing_token = p_fencing_token
       AND lease_expires_at > now()
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'lease confirmation rejected for booking % (expired lease, token mismatch, or wrong state)',
            p_booking_id;
    END IF;

    IF v_driver IS NOT NULL THEN
        v_conflict := fn_driver_conflict(
            v_driver,
            v_pickup,
            v_pickup + make_interval(mins => COALESCE(v_duration, 45)),
            p_booking_id
        );
        IF v_conflict IS NOT NULL THEN
            RAISE EXCEPTION
                'DRIVER_UNAVAILABLE: capacity conflict at confirmation with booking %',
                v_conflict;
        END IF;
    END IF;

    UPDATE bookings
       SET ride_status  = 'CONFIRMED_R10',
           confirmed_at = now()
     WHERE id = p_booking_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RAISE EXCEPTION 'lease confirmation failed for booking %', p_booking_id;
    END IF;

    PERFORM fn_write_receipt(
        p_booking_id,
        'LEASE_CONFIRMED',
        'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
        'CONFIRMED_R10',
        p_actor,
        jsonb_build_object('fencing_token', p_fencing_token)
    );

    RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------
-- reject_driver_lease : refus explicite du chauffeur destinataire.
-- Exige le fencing_token du bail courant. État résultant :
-- DRIVER_REJECTED (réémission possible, ou NO_DRIVER_AVAILABLE).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_driver_lease(
    p_booking_id    UUID,
    p_fencing_token UUID,
    p_actor         TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows INTEGER;
BEGIN
    UPDATE bookings
       SET ride_status = 'DRIVER_REJECTED'
     WHERE id = p_booking_id
       AND ride_status = 'LEASE_OFFERED_ATTEMPTED_UNKNOWN'
       AND current_fencing_token = p_fencing_token;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        RAISE EXCEPTION
            'lease rejection rejected for booking % (token mismatch or wrong state)',
            p_booking_id;
    END IF;

    PERFORM fn_write_receipt(
        p_booking_id,
        'LEASE_REJECTED',
        'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
        'DRIVER_REJECTED',
        p_actor,
        jsonb_build_object('fencing_token', p_fencing_token)
    );

    RETURN TRUE;
END;
$$;


-- ---------------------------------------------------------------------
-- Résolution par fencing_token : les boutons inline Telegram portent
-- UNIQUEMENT le jeton dans callback_data (« ACC:<token> » /
-- « REJ:<token> », 40 caractères — sous la limite de 64 octets de
-- Telegram). La course est résolue ICI, côté base, via
-- bookings.current_fencing_token. Aucun booking_id à deviner côté n8n.
-- Le résumé retourné sert aux notifications client du workflow 02 :
-- AUCUNE donnée n'est renvoyée vers Telegram.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION resolve_booking_by_token(
    p_fencing_token UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT jsonb_build_object(
        'booking_id',      b.id,
        'ride_status',     b.ride_status,
        'customer_name',   b.customer_name,
        'customer_phone',  b.customer_phone,
        'service_type',    b.service_type,
        'zone_code',       b.zone_code,
        'pickup_datetime', b.pickup_datetime,
        'pickup_address',  b.pickup_address,
        'dropoff_address', b.dropoff_address,
        'estimated_fare',  b.estimated_fare,
        'driver_id',       b.assigned_driver_id,
        'driver_ref',      b.assigned_driver_ref
    )
      FROM bookings AS b
     WHERE b.current_fencing_token = p_fencing_token;
$$;

-- ---------------------------------------------------------------------
-- Vérification d'identité du callback (P1-05) : fonction interne
-- partagée par confirm/reject_by_token. L'expéditeur authentifié par
-- Telegram (callback_query.from.id, transmis par le workflow) DOIT
-- être le chauffeur assigné au bail. Le fencing token prouve la
-- version du bail, pas l'identité humaine.
-- Retourne (booking_id, actor) ou lève CALLBACK_NOT_AUTHORIZED.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_authorize_driver_callback(
    p_fencing_token    UUID,
    p_telegram_user_id BIGINT
)
RETURNS TABLE (booking_id UUID, actor TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking UUID;
    v_driver  UUID;
    v_expect  BIGINT;
BEGIN
    SELECT b.id, b.assigned_driver_id
      INTO v_booking, v_driver
      FROM bookings AS b
     WHERE b.current_fencing_token = p_fencing_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'no booking for fencing token %', p_fencing_token;
    END IF;

    SELECT d.telegram_user_id INTO v_expect
      FROM drivers AS d
     WHERE d.id = v_driver;

    IF p_telegram_user_id IS NULL
       OR v_expect IS NULL
       OR v_expect <> p_telegram_user_id THEN
        RAISE EXCEPTION
            'CALLBACK_NOT_AUTHORIZED: telegram sender % is not the assigned driver for this lease',
            COALESCE(p_telegram_user_id::TEXT, 'NULL');
    END IF;

    RETURN QUERY SELECT v_booking, 'driver:' || p_telegram_user_id::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION confirm_driver_lease_by_token(
    p_fencing_token    UUID,
    p_telegram_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking UUID;
    v_actor   TEXT;
BEGIN
    SELECT booking_id, actor INTO v_booking, v_actor
      FROM fn_authorize_driver_callback(p_fencing_token, p_telegram_user_id);

    PERFORM confirm_driver_lease_r10(v_booking, p_fencing_token, v_actor);

    RETURN resolve_booking_by_token(p_fencing_token);
END;
$$;

CREATE OR REPLACE FUNCTION reject_driver_lease_by_token(
    p_fencing_token    UUID,
    p_telegram_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking UUID;
    v_actor   TEXT;
BEGIN
    SELECT booking_id, actor INTO v_booking, v_actor
      FROM fn_authorize_driver_callback(p_fencing_token, p_telegram_user_id);

    PERFORM reject_driver_lease(v_booking, p_fencing_token, v_actor);

    RETURN resolve_booking_by_token(p_fencing_token);
END;
$$;

-- ---------------------------------------------------------------------
-- expire_driver_lease : expiration du bail (minuteur n8n workflow 01).
-- Retourne FALSE sans effet si le bail est encore valide ou si la
-- course n'est plus en attente. Sinon LEASE_EXPIRED_ESCALATED et le
-- workflow escalade vers le propriétaire PAR APPEL (ADR-002).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_driver_lease(
    p_booking_id UUID,
    p_actor      TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows INTEGER;
BEGIN
    UPDATE bookings
       SET ride_status = 'LEASE_EXPIRED_ESCALATED'
     WHERE id = p_booking_id
       AND ride_status = 'LEASE_OFFERED_ATTEMPTED_UNKNOWN'
       AND lease_expires_at <= now();

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        RETURN FALSE;
    END IF;

    PERFORM fn_write_receipt(
        p_booking_id,
        'LEASE_EXPIRED',
        'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
        'LEASE_EXPIRED_ESCALATED',
        p_actor,
        '{}'::jsonb
    );

    RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------
-- mark_no_driver_available : aucun chauffeur n'a accepté (ou capacité
-- insuffisante, P1-02). États d'entrée : INTAKE_VALIDATED,
-- DRIVER_REJECTED, LEASE_EXPIRED_ESCALATED. Le workflow 01 recontacte
-- alors le client (routage SMS/appel) et le propriétaire PAR APPEL :
-- le client n'est JAMAIS laissé sans réponse.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mark_no_driver_available(
    p_booking_id UUID,
    p_actor      TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status ride_status;
BEGIN
    SELECT ride_status INTO v_status
      FROM bookings
     WHERE id = p_booking_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'booking % not found', p_booking_id;
    END IF;

    IF v_status NOT IN (
        'INTAKE_VALIDATED',
        'DRIVER_REJECTED',
        'LEASE_EXPIRED_ESCALATED'
    ) THEN
        RAISE EXCEPTION 'cannot mark no-driver from state %', v_status;
    END IF;

    UPDATE bookings
       SET ride_status = 'NO_DRIVER_AVAILABLE'
     WHERE id = p_booking_id;

    PERFORM fn_write_receipt(
        p_booking_id,
        'NO_DRIVER_AVAILABLE',
        v_status,
        'NO_DRIVER_AVAILABLE',
        p_actor,
        '{}'::jsonb
    );

    RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------
-- transition_booking : transitions simples gardées par la machine à
-- états. Chaque transition écrit son reçu R10. À la complétion, le
-- compteur de courses du client est incrémenté (customer_id lié dès
-- le commit : la jointure du workflow 03 avis fonctionne).
-- SECURITY DEFINER (P1-03) : aucun UPDATE direct sur bookings n'est
-- accordé aux rôles applicatifs ; toute transition passe par ici ou
-- par les RPC dédiées.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION transition_booking(
    p_booking_id UUID,
    p_to_state   ride_status,
    p_actor      TEXT,
    p_event_type TEXT DEFAULT 'STATE_TRANSITION'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from ride_status;
    v_ok   BOOLEAN;
BEGIN
    SELECT ride_status INTO v_from
      FROM bookings
     WHERE id = p_booking_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'booking % not found', p_booking_id;
    END IF;

    v_ok := CASE
        WHEN p_to_state = 'INTAKE_VALIDATED' THEN v_from = 'REQUESTED'
        WHEN p_to_state = 'DRIVER_EN_ROUTE'  THEN v_from = 'CONFIRMED_R10'
        WHEN p_to_state = 'COMPLETED'        THEN v_from = 'DRIVER_EN_ROUTE'
        WHEN p_to_state = 'CANCELLED'        THEN v_from IN (
            'REQUESTED',
            'INTAKE_VALIDATED',
            'LEASE_OFFERED_ATTEMPTED_UNKNOWN',
            'CONFIRMED_R10',
            'LEASE_EXPIRED_ESCALATED',
            'DRIVER_REJECTED',
            'NO_DRIVER_AVAILABLE'
        )
        ELSE FALSE
    END;

    IF NOT v_ok THEN
        RAISE EXCEPTION 'illegal transition % -> %', v_from, p_to_state;
    END IF;

    UPDATE bookings
       SET ride_status = p_to_state
     WHERE id = p_booking_id;

    IF p_to_state = 'COMPLETED' THEN
        UPDATE customers AS c
           SET total_rides = c.total_rides + 1
          FROM bookings AS b
         WHERE b.id = p_booking_id
           AND b.customer_id = c.id;
    END IF;

    PERFORM fn_write_receipt(
        p_booking_id, p_event_type, v_from, p_to_state, p_actor, '{}'::jsonb
    );

    RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------
-- set_payment_status : SEULE voie d'écriture du statut de paiement
-- (P1-03). Le workflow 04 ne fait plus de PATCH direct sur bookings.
-- Transitions gardées ; chaque application écrit un reçu R10.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_payment_status(
    p_booking_id UUID,
    p_to_status  payment_status,
    p_actor      TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from payment_status;
    v_ok   BOOLEAN;
BEGIN
    SELECT payment_status INTO v_from
      FROM bookings
     WHERE id = p_booking_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'booking % not found', p_booking_id;
    END IF;

    v_ok := CASE
        WHEN p_to_status = 'PAID'        THEN v_from IN ('PENDING', 'INVOICED_B2B')
        WHEN p_to_status = 'REFUNDED'    THEN v_from IN ('PAID', 'PENDING')
        WHEN p_to_status = 'INVOICED_B2B' THEN v_from = 'PENDING'
        ELSE FALSE
    END;

    IF NOT v_ok THEN
        RAISE EXCEPTION 'illegal payment transition % -> %', v_from, p_to_status;
    END IF;

    UPDATE bookings
       SET payment_status = p_to_status
     WHERE id = p_booking_id;

    PERFORM fn_write_receipt(
        p_booking_id, 'PAYMENT_UPDATED', NULL, NULL, p_actor,
        jsonb_build_object(
            'payment_from', v_from,
            'payment_to', p_to_status
        )
    );

    RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------
-- record_stripe_event : consommation IDEMPOTENTE d'un événement
-- Stripe (déduplication par event.id). Le premier appel enregistre
-- l'événement et applique le statut de paiement ; tout rejeu retourne
-- {duplicate: true} SANS réappliquer. La fraîcheur de la signature est
-- vérifiée en amont, côté n8n (tolérance 5 minutes).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_stripe_event(
    p_event_id      TEXT,
    p_event_type    TEXT,
    p_booking_id    UUID,
    p_target_status payment_status,
    p_actor         TEXT DEFAULT 'stripe-webhook'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted INTEGER;
BEGIN
    INSERT INTO stripe_events (event_id, event_type, booking_id, target_status)
    VALUES (p_event_id, p_event_type, p_booking_id, p_target_status)
    ON CONFLICT (event_id) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('duplicate', TRUE, 'applied', FALSE);
    END IF;

    IF p_booking_id IS NOT NULL AND p_target_status IS NOT NULL THEN
        PERFORM set_payment_status(p_booking_id, p_target_status, p_actor);
    END IF;

    RETURN jsonb_build_object('duplicate', FALSE, 'applied', TRUE);
END;
$$;

-- ---------------------------------------------------------------------
-- mark_review_requested : écriture ciblée du drapeau d'avis (P1-03 —
-- remplace le PATCH direct sur customers du workflow 03).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mark_review_requested(
    p_customer_id UUID,
    p_actor       TEXT DEFAULT 'n8n-03'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows INTEGER;
BEGIN
    UPDATE customers
       SET review_requested = TRUE
     WHERE id = p_customer_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
END;
$$;

-- ---------------------------------------------------------------------
-- Comptes partenaires (ADR-007) : AUCUNE auto-inscription.
-- request_partner_account crée le compte en PENDING_VALIDATION.
-- activate_partner_account est réservée au PROPRIÉTAIRE : elle n'est
-- accordée à aucun rôle applicatif (voir la section ACL — P1-03 : le
-- refus est désormais un contrôle de privilège, pas une procédure).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION request_partner_account(
    p_phone        TEXT,
    p_name         TEXT,
    p_email        TEXT,
    p_account_type account_type
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_account_type NOT IN ('HOSPITAL_PARTNER', 'CORPORATE') THEN
        RAISE EXCEPTION 'partner account type required, got %', p_account_type;
    END IF;

    INSERT INTO customers (phone, name, email, account_type, partner_status)
    VALUES (p_phone, p_name, p_email, p_account_type, 'PENDING_VALIDATION')
    ON CONFLICT (phone) DO UPDATE
        SET name  = COALESCE(EXCLUDED.name, customers.name),
            email = COALESCE(EXCLUDED.email, customers.email)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION activate_partner_account(
    p_customer_id UUID,
    p_actor       TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows INTEGER;
BEGIN
    UPDATE customers
       SET partner_status = 'ACTIVE'
     WHERE id = p_customer_id
       AND partner_status = 'PENDING_VALIDATION';

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        RAISE EXCEPTION
            'partner account % not pending validation (or not found)', p_customer_id;
    END IF;

    RETURN TRUE;
END;
$$;


-- ---------------------------------------------------------------------
-- Sécurité / ACL (audit P1-03 — section renforcée en V0.3) :
-- 1. RLS activée sur toutes les tables, aucune policy publique créée :
--    seul le rôle de service (Supabase service_role, qui contourne la
--    RLS) lit les données en V0.x, et uniquement en SELECT (voir 3).
-- 2. Fonctions : EXECUTE est retiré à PUBLIC / anon / authenticated
--    sur TOUTES les fonctions de cette migration (le défaut PostgreSQL
--    accorde EXECUTE à PUBLIC). Les fonctions métier sont SECURITY
--    DEFINER : elles s'exécutent avec les droits du propriétaire.
-- 3. Rôle de service — privilèges EXPLICITES ET MINIMAUX :
--    - EXECUTE sur les seules RPC appelées par les workflows ;
--    - SELECT sur les tables lues via REST (aucune écriture directe :
--      bookings ne peut plus être contourné par UPDATE direct,
--      internal_secrets n'a AUCUN grant) ;
--    - USAGE, SELECT sur TOUTES les séquences (dont celle des reçus
--      R10, workgraph_receipts_r10_seq_seq) — l'audit a reproduit
--      l'échec « permission denied for sequence » de la V0.2 ;
--    - activate_partner_account : AUCUN grant à service_role
--      (propriétaire uniquement) ; les fonctions internes fn_* :
--      aucun grant non plus.
-- 4. USAGE sur le schéma public pour service_role.
-- Tous les accès base des workflows n8n passent par des appels RPC
-- paramétrés (PostgREST) avec la clé de service — aucun SQL construit
-- par concaténation de valeurs externes.
-- ---------------------------------------------------------------------

ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_zones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE workgraph_receipts_r10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_secrets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_redemptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events          ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    v_role       TEXT;
    v_fn         TEXT;
    v_all_functions TEXT[] := ARRAY[
        'fn_r10_compute_hash()',
        'fn_r10_forbid_mutation()',
        'fn_touch_updated_at()',
        'fn_write_receipt(uuid,text,ride_status,ride_status,text,jsonb)',
        'get_quote(service_type,numeric,text)',
        'compute_waiting_charge(service_type,text,integer)',
        'fn_estimate_duration_minutes(numeric)',
        'fn_capacity_margin_minutes()',
        'fn_driver_conflict(uuid,timestamptz,timestamptz,uuid)',
        'fn_quote_secret()',
        'fn_b64url_encode(bytea)',
        'fn_b64url_decode_to_text(text)',
        'issue_quote_token(service_type,numeric,text,text,timestamptz,text)',
        'fn_verify_quote_token(text,service_type,text,text,timestamptz,numeric,text)',
        'upsert_customer_by_phone(text,text,text)',
        'commit_booking(text,text,service_type,text,text,timestamptz,text,text,text,numeric,text,text,text,text,integer)',
        'offer_driver_lease(uuid,text,text)',
        'confirm_driver_lease_r10(uuid,uuid,text)',
        'reject_driver_lease(uuid,uuid,text)',
        'resolve_booking_by_token(uuid)',
        'fn_authorize_driver_callback(uuid,bigint)',
        'confirm_driver_lease_by_token(uuid,bigint)',
        'reject_driver_lease_by_token(uuid,bigint)',
        'expire_driver_lease(uuid,text)',
        'mark_no_driver_available(uuid,text)',
        'transition_booking(uuid,ride_status,text,text)',
        'set_payment_status(uuid,payment_status,text)',
        'record_stripe_event(text,text,uuid,payment_status,text)',
        'mark_review_requested(uuid,text)',
        'request_partner_account(text,text,text,account_type)',
        'activate_partner_account(uuid,text)'
    ];
    -- RPC réellement appelées par les workflows n8n (clé de service).
    v_service_functions TEXT[] := ARRAY[
        'get_quote(service_type,numeric,text)',
        'issue_quote_token(service_type,numeric,text,text,timestamptz,text)',
        'commit_booking(text,text,service_type,text,text,timestamptz,text,text,text,numeric,text,text,text,text,integer)',
        'offer_driver_lease(uuid,text,text)',
        'confirm_driver_lease_by_token(uuid,bigint)',
        'reject_driver_lease_by_token(uuid,bigint)',
        'expire_driver_lease(uuid,text)',
        'mark_no_driver_available(uuid,text)',
        'resolve_booking_by_token(uuid)',
        'request_partner_account(text,text,text,account_type)',
        'set_payment_status(uuid,payment_status,text)',
        'record_stripe_event(text,text,uuid,payment_status,text)',
        'mark_review_requested(uuid,text)'
    ];
BEGIN
    -- Retrait des accès tables par défaut (PUBLIC + rôles Supabase web).
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC';
    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v_role) THEN
            EXECUTE format(
                'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', v_role);
            EXECUTE format(
                'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', v_role);
        END IF;
    END LOOP;

    -- Retrait d'EXECUTE par défaut sur chaque fonction (PUBLIC, anon,
    -- authenticated). activate_partner_account est aussi retirée à
    -- service_role ci-dessous : elle n'apparaît dans AUCUN grant.
    FOREACH v_fn IN ARRAY v_all_functions LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', v_fn);
        FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v_role) THEN
                EXECUTE format(
                    'REVOKE ALL ON FUNCTION public.%s FROM %I', v_fn, v_role);
            END IF;
        END LOOP;
    END LOOP;

    -- Le rôle de service reçoit le minimum explicite.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA public TO service_role';

        FOREACH v_fn IN ARRAY v_service_functions LOOP
            EXECUTE format(
                'GRANT EXECUTE ON FUNCTION public.%s TO service_role', v_fn);
        END LOOP;

        -- Lectures REST des workflows uniquement. AUCUNE écriture
        -- directe ; internal_secrets : délibérément ABSENT.
        EXECUTE 'GRANT SELECT ON customers, drivers, pricing_zones, '
             || 'bookings, fleet_logs, workgraph_receipts_r10, '
             || 'quote_redemptions, stripe_events TO service_role';

        -- Séquences : USAGE + SELECT explicites (audit P1-03).
        EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES '
             || 'IN SCHEMA public TO service_role';
    END IF;
END;
$$;

COMMIT;

-- =====================================================================
-- Fin de la migration V0.3.
-- Test de la boucle complète : voir test_loop_v03.sh / test_loop_v03.sql
-- (12 scénarios V0.2 adaptés + T13 idempotence, T14 capacité,
--  T15 SET ROLE service_role, T16 callback non autorisé).
-- Ordre d'application complet : voir README.md.
-- =====================================================================
