# Liberty Ride — Mono-repo front-end

Site, landing, applications clients, chauffeurs, administration, et le BFF
API qui les relie au backend existant (Supabase migration 003 V0.3 + n8n
8 workflows V0.3). Aucun chiffre d’exemple, aucune donnée inventée : quand
le backend n’est pas joignable, les apps l’affichent au lieu d’afficher
des zéros ou des faux chiffres.

## Arborescence

```
apps/
  site/      Site vitrine (services, tarifs, réservation, contact)
  landing/   Landing transfert aéroport CVG (estimation + appel)
  clients/   Réservation en ligne (demande → devis → commit)
  drivers/   Chauffeurs (bails proposés, accepter / refuser)
  admin/     Tableau de bord (courses, chauffeurs, grille, briefing)
  api/       BFF Bun (seul endroit où vit la clé service_role, serveur)
packages/
  types/     Types miroir de la migration 003 + grille publique + URLs
  supabase/  Client navigateur (clé anon, pour l’auth à venir)
  ui/        Composants partagés + thème
```

## Lancer

```bash
bun install
bun run dev:site      # :5173
bun run dev:landing   # :5174
bun run dev:clients   # :5175
bun run dev:drivers   # :5176
bun run dev:admin     # :5177
bun run api           # BFF :3001 (voir apps/api/.env.example)
bun run build         # build des 5 apps
bun run check         # tsc --noEmit des 5 apps
```

En développement, Vite proxie `/api` vers `http://localhost:3001`.
En production, servez les apps derrière le même domaine que le BFF
(ou renseignez l’origine dans `ALLOWED_ORIGINS`).

## Backend branché

- Supabase : `https://lgvusahqkdwargrjrmmy.supabase.co` (projet existant).
- Webhooks n8n publics (funnel) : `https://amd-pc-1.tail58ad16.ts.net/webhook/…`
  (`vapi/create-booking-commit`, `vapi/get-quote`, `stripe/events`,
  `internal/payment-link`, `b2b/account-request`).
- BFF `apps/api` : `GET /api/health|pricing-zones|drivers|bookings`,
  `POST /api/bookings` (devis `issue_quote_token` puis `commit_booking`),
  `POST /api/leases/:token/accept|reject` (`confirm|reject_driver_lease_by_token`).

## Configuration (serveur uniquement)

Copiez `apps/api/.env.example` vers `apps/api/.env` et renseignez
`SUPABASE_SERVICE_ROLE_KEY`. Cette clé ne doit JAMAIS apparaître dans le
navigateur, dans le repo, ni dans les apps. Sans elle, le BFF répond
`503 BFF non configuré` et les apps affichent cet état — c’est voulu.

## Limites honnêtes de cette v1

- L’authentification utilisateur (Supabase Auth) n’est pas encore branchée :
  l’app chauffeurs identifie le chauffeur par son identifiant Telegram
  (conservé sur l’appareil), l’admin n’a pas encore de contrôle d’accès.
  Décision 2026-10-25 : canal chauffeurs = appels vocaux Vapi sortants
  (Twilio/Telegram rayés du plan) — l’identifiant Telegram de l’app
  devra migrer vers l’identité d’appel Vapi.
  Ne pas exposer l’admin publiquement sans protection.
- La migration 004 (politiques RLS pour lectures authentifiées) reste à
  écrire : en attendant, les données passent par le BFF.
- Le tarif affiché dans les apps est une ESTIMATION (grille publique) ;
  le tarif final vient du RPC `get_quote` au moment du devis.
