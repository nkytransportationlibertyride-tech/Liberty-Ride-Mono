// Adaptateur Vercel (Serverless Function) pour le BFF Liberty Ride.
// Réutilise handleRequest sans le modifier : la réécriture vercel.json
// /api/* -> /api/index préserve l'URL d'origine, le routage /api/*
// du handler s'applique tel quel. Aucune dépendance ajoutée.
// Variables d'environnement à poser dans le dashboard Vercel (jamais en code) :
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_KEY, ALLOWED_ORIGINS
// (les 4 URLs Vercel des apps, séparées par des virgules), NODE_ENV=production.
import { handleRequest } from '../src/index';

type NodeReq = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  [Symbol.asyncIterator]?: () => AsyncIterator<Buffer>;
};

type NodeRes = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

export default async function handler(req: NodeReq, res: NodeRes): Promise<void> {
  const host =
    typeof req.headers.host === 'string' ? req.headers.host : 'localhost';
  const url = `https://${host}${req.url ?? '/'}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
  }
  let body: BodyInit | undefined;
  if (
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    typeof req[Symbol.asyncIterator] === 'function'
  ) {
    const chunks: Buffer[] = [];
    for await (const c of req as unknown as AsyncIterable<Buffer>) chunks.push(c);
    if (chunks.length > 0) body = Buffer.concat(chunks) as unknown as BodyInit;
  }
  const webReq = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body,
  });
  const webRes = await handleRequest(webReq);
  res.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(await webRes.text());
}
