# Déploiement Vercel — Liberty Ride (interfaces + API)

État : **prêt à déployer, non déployé**. Les apps sont « deployables sur
Vercel au minimum » : builds vérifiés, API découplée par variable
d'environnement, fallback SPA en place. Le déploiement effectif demande un
compte Vercel + les variables ci-dessous (à poser dans le dashboard Vercel,
jamais dans le code ni dans le chat).

## Architecture : 5 projets Vercel

### API (1 projet) — le BFF
- **Root Directory : `apps/api`** (c'est là que vit `api/index.ts`).
- Aucune commande de build (fonctions uniquement). `api/index.ts` réutilise
  `handleRequest` de `src/index.ts` — le même code sert Bun (local / Amd-PC)
  et Vercel, sans duplication.
- Réécriture : `apps/api/vercel.json` route `/api/*` → `/api/index`.
- Variables (dashboard Vercel, production) :
  - `SUPABASE_URL` = https://lgvusahqkdwargrjrmmy.supabase.co
  - `SUPABASE_SERVICE_ROLE_KEY` = clé service_role (dashboard uniquement)
  - `OWNER_KEY` = clé propriétaire (à définir, à transmettre au propriétaire)
  - `ALLOWED_ORIGINS` = les 4 URLs Vercel des apps, séparées par des virgules
  - `NODE_ENV` = production
- Sécurité voulue : en production, sans `ALLOWED_ORIGINS`, le BFF **refuse
  de démarrer** (fail-closed). Sans `OWNER_KEY`, les routes propriétaire
  répondent 503. La clé service_role ne sort jamais vers le navigateur.

### Front-ends (4 projets) — site, clients, drivers, admin
- **Root Directory : racine du repo** (les apps importent les workspaces
  `@liberty/types` et `@liberty/ui`, l'install doit voir tout le mono-repo).
- Install Command : `bun install`
- Build Command : `cd apps/<app> && bun run build`
- Output Directory : `apps/<app>/dist`
- Variable : `VITE_API_BASE_URL` = URL du projet API (sans slash final).
  Sans cette variable, les apps appellent `/api` en même origine (déploiement
  Amd-PC actuel, proxy dev) — le comportement local est inchangé.
- Fallback SPA : `vercel.json` à la racine du repo réécrit tout vers
  `/index.html` (indispensable pour la route `/cvg` de l'app clients).

## Ordre de déploiement
1. Déployer le projet API, noter son URL.
2. Déployer les 4 front-ends avec `VITE_API_BASE_URL` = URL de l'API.
3. Vérifier : santé `https://<api>/api/health`, grille tarifaire, devis.
4. Couper le domaine public (`erlangertaxiservice.com`) = décision séparée
   du propriétaire (DNS), pas dans ce déploiement.

## Après Vercel : mobile
Les apps mobiles utiliseront la même API (mêmes routes, mêmes gardes).
Aucun changement BFF n'est nécessaire pour les accueillir ; le travail
mobile commence après la mise en ligne Vercel, comme décidé.
