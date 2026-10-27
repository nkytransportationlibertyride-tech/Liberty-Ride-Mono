-- =====================================================================
-- Migration 004 — Liberty Ride : création chauffeur via RPC
-- ---------------------------------------------------------------------
-- Contexte : la migration 003 donne à service_role SELECT uniquement en
-- REST (« AUCUNE écriture directe »). La création chauffeur de l'app
-- admin (INSERT REST) est donc refusée (42501). Comme pour les clients
-- (upsert_customer_by_phone), la création passe par une fonction
-- SECURITY DEFINER, accordée explicitement à service_role.
-- Idempotente : ré-exécutable sans effet de bord.
-- =====================================================================

CREATE OR REPLACE FUNCTION create_driver(
    p_driver_ref       TEXT,
    p_display_name     TEXT,
    p_phone            TEXT,
    p_telegram_user_id BIGINT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO drivers (driver_ref, display_name, phone, telegram_user_id, is_active)
    VALUES (p_driver_ref, p_display_name, p_phone, p_telegram_user_id, true)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_driver(text, text, text, bigint) TO service_role;
