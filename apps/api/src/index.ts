// BFF Liberty Ride (zéro dépendance, double runtime).
// Rôle : seul endroit côté apps où la clé service_role existe (serveur).
// Le navigateur ne voit JAMAIS cette clé : les apps appellent /api/*.
// n8n détient aussi la clé dans ses nœuds HTTP (inclure n8n dans toute rotation).
// Endpoints mappés sur la migration 003 V0.3 (RPC SECURITY DEFINER).
// Périmètres v1 (spec résolue) : public restreint, chauffeur identifié par
// téléphone, propriétaire par X-Owner-Key. Jamais de liste non scopée.
// Runtime : Bun.serve en local / Amd-PC, et fonction Vercel via
// apps/api/api/index.ts qui réutilise handleRequest (aucune API propre à Bun
// dans le handler — process.env et node:crypto passent sur les deux).

import { timingSafeEqual } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const OWNER_KEY = process.env.OWNER_KEY ?? '';
const PORT = Number(process.env.PORT ?? 3001);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Fail-closed : en production, sans origines déclarées, on ne démarre pas
// (l'ancien comportement reflétait n'importe quelle origine).
if (NODE_ENV === 'production' && ALLOWED.length === 0) {
  throw new Error('BFF: ALLOWED_ORIGINS vide en production — refus de démarrer');
}

const SERVICE_TYPES = ['AIRPORT_CVG', 'MEDICAL_HOSPITAL', 'BUSINESS_EXEC', 'LOCAL_TAXI'] as const;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isOriginAllowed(origin: string): boolean {
  if (ALLOWED.length > 0) return ALLOWED.includes(origin);
  // Dev seulement : localhost.
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function withCors(req: Request, res: Response): Response {
  const origin = req.headers.get('Origin') ?? '';
  if (origin.length > 0 && isOriginAllowed(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Owner-Key');
  return res;
}

function requireKey(): Response | null {
  if (SUPABASE_URL.length === 0 || SERVICE_KEY.length === 0) {
    return json(
      { error: 'BFF non configuré : SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes' },
      503,
    );
  }
  return null;
}

function ownerKeyValid(req: Request): boolean {
  if (OWNER_KEY.length === 0) return false;
  const sent = req.headers.get('X-Owner-Key') ?? '';
  const a = Buffer.from(sent);
  const b = Buffer.from(OWNER_KEY);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function requireOwner(req: Request): Response | null {
  if (OWNER_KEY.length === 0) {
    return json({ error: 'Accès propriétaire non configuré (OWNER_KEY absent)' }, 503);
  }
  if (!ownerKeyValid(req)) return json({ error: 'Clé propriétaire invalide' }, 401);
  return null;
}

async function sb(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<{ status: number; body: unknown }> {
  return sb(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
}

function pickToken(rpcBody: unknown): string | null {
  if (rpcBody !== null && typeof rpcBody === 'object') {
    const o = rpcBody as Record<string, unknown>;
    for (const k of ['quote_token', 'token', 'b64', 'quoteToken']) {
      if (typeof o[k] === 'string' && (o[k] as string).length > 0) return o[k] as string;
    }
  }
  return null;
}

function pickFare(rpcBody: unknown): number | null {
  if (rpcBody !== null && typeof rpcBody === 'object') {
    const o = rpcBody as Record<string, unknown>;
    for (const k of ['fare', 'quoted_fare', 'total', 'estimated_fare']) {
      if (typeof o[k] === 'number') return o[k] as number;
    }
  }
  return null;
}

/** Normalisation téléphone : chiffres seuls, préfixe 1 US retiré si 11 chiffres. */
function normPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

interface DriverRow {
  driver_ref: string;
  display_name: string | null;
  phone: string | null;
  telegram_user_id: number | null;
}

/** Résolution chauffeur par driver_ref (serveur uniquement, jamais exposée). */
async function resolveDriverByRef(ref: string): Promise<DriverRow | null> {
  const q = new URLSearchParams({
    select: 'driver_ref,display_name,phone,telegram_user_id',
    driver_ref: `eq.${ref}`,
    is_active: 'eq.true',
  });
  const r = await sb(`/rest/v1/drivers?${q.toString()}`);
  if (r.status >= 400 || !Array.isArray(r.body) || r.body.length === 0) return null;
  return r.body[0] as DriverRow;
}

/** Identification par téléphone exact (normalisé) sur les lignes actives. */
async function identifyByPhone(phone: string): Promise<DriverRow | null> {
  const wanted = normPhone(phone);
  if (wanted.length < 10) return null;
  const q = new URLSearchParams({
    select: 'driver_ref,display_name,phone,telegram_user_id',
    is_active: 'eq.true',
  });
  const r = await sb(`/rest/v1/drivers?${q.toString()}`);
  if (r.status >= 400 || !Array.isArray(r.body)) return null;
  for (const row of r.body as DriverRow[]) {
    if (row.phone !== null && normPhone(row.phone) === wanted) return row;
  }
  return null;
}

function parseTotal(contentRange: string | null): number | null {
  if (contentRange === null) return null;
  const slash = contentRange.indexOf('/');
  if (slash < 0) return null;
  const total = Number(contentRange.slice(slash + 1));
  return Number.isFinite(total) ? total : null;
}

function rpcError(body: unknown): string {
  if (body !== null && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
  }
  return 'Erreur base de données';
}

export async function handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    if (req.method === 'OPTIONS') return withCors(req, new Response(null, { status: 204 }));

    const done = (r: Response) => withCors(req, r);

    if (path === '/api/health') return done(json({ ok: true, service: 'liberty-bff' }));

    if (path === '/') {
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">`
        + `<meta name="viewport" content="width=device-width, initial-scale=1">`
        + `<title>Liberty Ride API</title></head><body style="font-family:system-ui;max-width:640px;margin:48px auto;padding:0 16px">`
        + `<h1>Liberty Ride API</h1><p>Status: <strong>online</strong></p>`
        + `<p>This is the booking API. It has no homepage beyond this page.</p>`
        + `<ul><li><a href="/api/health">/api/health</a> — service check</li>`
        + `<li><a href="/api/pricing-zones">/api/pricing-zones</a> — fare zones</li></ul>`
        + `<p>Apps: <a href="https://liberty-ride-site.vercel.app">Site</a> · `
        + `<a href="https://liberty-ride-clients.vercel.app">Clients</a> · `
        + `<a href="https://liberty-ride-drivers.vercel.app">Drivers</a> · `
        + `<a href="https://liberty-ride-admin.vercel.app">Admin</a></p>`
        + `</body></html>`;
      return done(new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    }

    if (!path.startsWith('/api/')) return done(json({ error: 'Not found' }, 404));

    const missing = requireKey();
    if (missing !== null) return done(missing);

    try {
      // --- Public : zones actives (aucune donnée personnelle) ---
      if (path === '/api/pricing-zones' && req.method === 'GET') {
        const r = await sb('/rest/v1/pricing_zones?select=*&is_active=eq.true&order=service_type,zone_code');
        return done(json(r.body, r.status));
      }

      // --- Public : devis via get_quote (fonction pure, sans jeton) ---
      if (path === '/api/quote' && req.method === 'POST') {
        const b = (await req.json()) as Record<string, unknown>;
        const service = b.service_type;
        const miles = b.distance_miles;
        if (typeof service !== 'string' || !(SERVICE_TYPES as readonly string[]).includes(service)) {
          return done(json({ error: 'service_type invalide' }, 400));
        }
        if (typeof miles !== 'number' || !Number.isFinite(miles) || miles <= 0) {
          return done(json({ error: 'distance_miles requis (> 0)' }, 400));
        }
        const zone = typeof b.zone_code === 'string' && b.zone_code.length > 0 ? b.zone_code : null;
        const r = await rpc('get_quote', {
          p_service_type: service,
          p_distance_miles: miles,
          p_zone_code: zone,
        });
        if (r.status >= 400) return done(json({ error: 'Devis impossible', detail: r.body }, r.status));
        if (typeof r.body === 'number') return done(json({ fare: r.body }));
        return done(json({ fare: null, reason: 'no_matching_zone' }));
      }

      // --- Public : création de course (devis horodaté puis commit) ---
      if (path === '/api/bookings' && req.method === 'POST') {
        const b = (await req.json()) as Record<string, unknown>;
        const distance = b.distance_miles;
        if (typeof distance !== 'number' || !Number.isFinite(distance) || distance <= 0) {
          return done(json({ error: 'distance_miles requis (> 0)' }, 400));
        }
        const q = await rpc('issue_quote_token', {
          p_service_type: b.service_type,
          p_distance_miles: distance,
          p_pickup_address: b.pickup_address,
          p_dropoff_address: b.dropoff_address,
          p_pickup_datetime: b.pickup_datetime,
          p_zone_code: b.zone_code ?? null,
        });
        if (q.status >= 400) return done(json({ error: 'Devis impossible', detail: q.body }, q.status));
        const token = pickToken(q.body);
        const fare = pickFare(q.body);
        if (token === null) {
          return done(json({ error: 'Devis sans jeton exploitable', detail: q.body }, 502));
        }
        const c = await rpc('commit_booking', {
          p_customer_name: b.customer_name,
          p_customer_phone: b.customer_phone,
          p_service_type: b.service_type,
          p_pickup_address: b.pickup_address,
          p_dropoff_address: b.dropoff_address,
          p_pickup_datetime: b.pickup_datetime,
          p_flight_number: b.flight_number ?? null,
          p_special_needs: b.special_needs ?? null,
          p_quote_token: token,
          p_quoted_fare: fare,
          p_actor: 'web',
          p_zone_code: b.zone_code ?? null,
          p_idempotency_key: null,
          p_vapi_call_id: null,
          p_estimated_duration_minutes: null,
        });
        return done(json(c.body, c.status));
      }

      // --- Client : lecture d'une course par UUID (capabilité) ---
      // Le jeton de fencing ne sort JAMAIS par la lecture publique : seul le
      // chauffeur assigné le reçoit via sa liste, et le propriétaire via l'offre.
      const bookingId = path.match(/^\/api\/bookings\/([^/]+)$/);
      if (bookingId !== null && req.method === 'GET') {
        const q = new URLSearchParams({ select: '*', id: `eq.${bookingId[1]}` });
        const r = await sb(`/rest/v1/bookings?${q.toString()}`);
        if (r.status >= 400) return done(json(r.body, r.status));
        if (!Array.isArray(r.body) || r.body.length === 0) {
          return done(json({ error: 'Réservation introuvable' }, 404));
        }
        const { current_fencing_token: _fencing, ...safe } = r.body[0] as Record<string, unknown>;
        return done(json(safe));
      }

      // --- Client ou propriétaire : annulation (gardes transition_booking) ---
      const cancel = path.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
      if (cancel !== null && req.method === 'POST') {
        const isOwner = ownerKeyValid(req);
        const r = await rpc('transition_booking', {
          p_booking_id: cancel[1],
          p_to_state: 'CANCELLED',
          p_actor: isOwner ? 'owner' : 'web-client',
        });
        if (r.status >= 400) return done(json({ error: rpcError(r.body) }, r.status));
        return done(json({ ok: true }));
      }

      // --- Propriétaire : émettre une offre de bail (dispatch manuel) ---
      // Sert aussi au canary : l'offre Vapi (W1) est aujourd'hui bloquée par
      // la ref chauffeur codée en dur (placeholder Telegram) ; le dispatch
      // propriétaire contourne ce blocage sans toucher au workflow.
      const offer = path.match(/^\/api\/bookings\/([^/]+)\/offer$/);
      if (offer !== null && req.method === 'POST') {
        const ownerErr = requireOwner(req);
        if (ownerErr !== null) return done(ownerErr);
        const b = (await req.json()) as Record<string, unknown>;
        const ref = typeof b.driver_ref === 'string' ? b.driver_ref : '';
        if (ref.length === 0) return done(json({ error: 'driver_ref requis' }, 400));
        const r = await rpc('offer_driver_lease', {
          p_booking_id: offer[1],
          p_driver_ref: ref,
          p_actor: 'owner',
        });
        if (r.status >= 400) return done(json({ error: rpcError(r.body) }, r.status));
        return done(json({ ok: true, fencing_token: r.body }));
      }

      // --- Propriétaire : reçus R10 d'une course (audit, ordre chronologique) ---
      const receipts = path.match(/^\/api\/bookings\/([^/]+)\/receipts$/);
      if (receipts !== null && req.method === 'GET') {
        const ownerErr = requireOwner(req);
        if (ownerErr !== null) return done(ownerErr);
        const q = new URLSearchParams({
          select: 'seq,event_type,from_state,to_state,actor,payload,created_at,receipt_hash',
          booking_id: `eq.${receipts[1]}`,
          order: 'seq.asc',
        });
        const r = await sb(`/rest/v1/workgraph_receipts_r10?${q.toString()}`);
        return done(json(r.body, r.status));
      }

      // --- Chauffeur : en route / terminée (vérifie le chauffeur assigné) ---
      const step = path.match(/^\/api\/bookings\/([^/]+)\/(en-route|complete)$/);
      if (step !== null && req.method === 'POST') {
        const b = (await req.json()) as Record<string, unknown>;
        const ref = typeof b.driver_ref === 'string' ? b.driver_ref : '';
        if (ref.length === 0) return done(json({ error: 'driver_ref requis' }, 400));
        const q = new URLSearchParams({ select: 'assigned_driver_ref,ride_status', id: `eq.${step[1]}` });
        const cur = await sb(`/rest/v1/bookings?${q.toString()}`);
        if (cur.status >= 400 || !Array.isArray(cur.body) || cur.body.length === 0) {
          return done(json({ error: 'Réservation introuvable' }, 404));
        }
        const row = cur.body[0] as { assigned_driver_ref: string | null };
        if (row.assigned_driver_ref !== ref) {
          return done(json({ error: 'Cette course ne vous est pas assignée' }, 403));
        }
        const to = step[2] === 'en-route' ? 'DRIVER_EN_ROUTE' : 'COMPLETED';
        const r = await rpc('transition_booking', {
          p_booking_id: step[1],
          p_to_state: to,
          p_actor: 'driver',
        });
        if (r.status >= 400) return done(json({ error: rpcError(r.body) }, r.status));
        return done(json({ ok: true }));
      }

      // --- Chauffeur : identification par téléphone ---
      if (path === '/api/drivers/identify' && req.method === 'POST') {
        const b = (await req.json()) as Record<string, unknown>;
        const phone = typeof b.phone === 'string' ? b.phone : '';
        if (phone.length === 0) return done(json({ error: 'phone requis' }, 400));
        const driver = await identifyByPhone(phone);
        if (driver === null) {
          return done(json({ error: 'Unknown reference — contact the owner' }, 404));
        }
        return done(json({ ok: true, driver_ref: driver.driver_ref, display_name: driver.display_name }));
      }

      // --- Liste courses : chauffeur identifié OU propriétaire ---
      if (path === '/api/bookings' && req.method === 'GET') {
        const driverRef = url.searchParams.get('driver_ref');
        const status = url.searchParams.get('status');
        const rawLimit = Number(url.searchParams.get('limit') ?? '100');
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.floor(rawLimit)), 100) : 100;

        if (driverRef !== null) {
          const driver = await resolveDriverByRef(driverRef);
          if (driver === null) return done(json({ error: 'Chauffeur inconnu' }, 404));
          const q = new URLSearchParams({
            select: '*',
            assigned_driver_ref: `eq.${driverRef}`,
            order: 'lease_expires_at.asc.nullslast,created_at.desc',
            limit: String(limit),
          });
          if (status !== null) {
            const parts = status.split(',').map((s) => s.trim()).filter(Boolean);
            q.set('ride_status', parts.length > 1 ? `in.(${parts.join(',')})` : `eq.${parts[0]}`);
          }
          const r = await sb(`/rest/v1/bookings?${q.toString()}`);
          return done(json(r.body, r.status));
        }

        const ownerErr = requireOwner(req);
        if (ownerErr !== null) return done(ownerErr);
        const q = new URLSearchParams({
          select: '*',
          order: 'created_at.desc',
          limit: String(limit),
        });
        if (status !== null) {
          const parts = status.split(',').map((s) => s.trim()).filter(Boolean);
          q.set('ride_status', parts.length > 1 ? `in.(${parts.join(',')})` : `eq.${parts[0]}`);
        }
        const r = await sb(`/rest/v1/bookings?${q.toString()}`, {
          headers: { Prefer: 'count=exact' },
        });
        return done(json({ data: r.body, total: parseTotal(r.headers.get('content-range')) }, r.status));
      }

      // --- Chauffeurs : acceptation / refus (résolution interne du code) ---
      const lease = path.match(/^\/api\/leases\/([^/]+)\/(accept|reject)$/);
      if (lease !== null && req.method === 'POST') {
        const [, token, action] = lease;
        const b = (await req.json()) as Record<string, unknown>;
        const ref = typeof b.driver_ref === 'string' ? b.driver_ref : '';
        if (ref.length === 0) return done(json({ error: 'driver_ref requis' }, 400));
        const driver = await resolveDriverByRef(ref);
        if (driver === null || driver.telegram_user_id === null) {
          return done(json({ error: 'Chauffeur non résolvable pour ce bail' }, 400));
        }
        const fn = action === 'accept' ? 'confirm_driver_lease_by_token' : 'reject_driver_lease_by_token';
        const r = await rpc(fn, { p_fencing_token: token, p_telegram_user_id: driver.telegram_user_id });
        if (r.status >= 400) return done(json({ error: rpcError(r.body) }, r.status));
        return done(json(r.body, r.status));
      }

      // --- Propriétaire : liste chauffeurs (sans le code interne) ---
      if (path === '/api/drivers' && req.method === 'GET') {
        const ownerErr = requireOwner(req);
        if (ownerErr !== null) return done(ownerErr);
        const r = await sb('/rest/v1/drivers?select=driver_ref,display_name,phone,is_active,created_at&order=display_name');
        return done(json(r.body, r.status));
      }

      // --- Propriétaire : création chauffeur ---
      // Doctrine V0.3 : service_role n'a que SELECT en REST, AUCUNE écriture
      // directe — la création passe par la RPC create_driver (migration 004),
      // SECURITY DEFINER, comme upsert_customer_by_phone pour les clients.
      if (path === '/api/drivers' && req.method === 'POST') {
        const ownerErr = requireOwner(req);
        if (ownerErr !== null) return done(ownerErr);
        const b = (await req.json()) as Record<string, unknown>;
        const phone = typeof b.phone === 'string' ? b.phone : '';
        const displayName = typeof b.display_name === 'string' ? b.display_name : '';
        if (phone.length === 0 || displayName.length === 0) {
          return done(json({ error: 'phone et display_name requis' }, 400));
        }
        const ref = typeof b.driver_ref === 'string' && b.driver_ref.length > 0 ? b.driver_ref : phone;
        const digits = normPhone(phone);
        if (digits.length < 10) return done(json({ error: 'phone invalide' }, 400));
        const code = Number(digits);
        if (!Number.isSafeInteger(code)) return done(json({ error: 'phone invalide' }, 400));
        const r = await rpc('create_driver', {
          p_driver_ref: ref,
          p_display_name: displayName,
          p_phone: phone,
          p_telegram_user_id: code,
        });
        if (r.status >= 400) return done(json({ error: rpcError(r.body) }, r.status));
        return done(json({ ok: true, driver_id: r.body, driver_ref: ref }));
      }

      return done(json({ error: 'Not found' }, 404));
    } catch (e) {
      return done(json({ error: 'Erreur BFF', detail: String(e) }, 500));
    }
}

// Serveur local / Amd-PC uniquement : sous Vercel, ce module est importé
// par api/index.ts et ne doit PAS lier de port (Bun n'existe pas là-bas).
if (typeof (globalThis as unknown as { Bun?: unknown }).Bun !== 'undefined') {
  const server = Bun.serve({ port: PORT, fetch: handleRequest });
  console.log(`liberty-bff en écoute sur http://localhost:${server.port}`);
}
