// Client Supabase NAVIGATEUR (clé anon = clé publique, RLS s'applique).
// État actuel (migration 003) : RLS activé, aucune politique publique —
// l'anon ne lit donc rien tant que la migration 004 (politiques
// utilisateurs authentifiés) n'est pas appliquée. Les lectures/écritures
// de données passent en attendant par le BFF apps/api (service_role
// côté serveur uniquement, jamais dans le navigateur).
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '@liberty/types';

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  anonKey != null && anonKey.length > 0
    ? createClient(SUPABASE_URL, anonKey)
    : null;

/** Vrai si le client navigateur est configuré (clé anon présente). */
export function isSupabaseBrowserConfigured(): boolean {
  return supabase !== null;
}
