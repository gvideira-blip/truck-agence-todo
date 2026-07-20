// api/idees.js — Boîte à idées, stockée dans Supabase.
//
// Format des données (clé 'idees' dans Supabase) :
//   [ { id, titre, texte, ts }, ... ]
// Même logique de fusion que "Point Gaëtan" (api/instructions.js) :
// le client fait autorité sur ce qu'il connaît (suppressions comprises),
// on ne récupère du serveur que les idées ajoutées par d'autres.

import { dbGet, dbSet, dbGetOrSeed, cors } from '../lib/db.js';

// Normalise un élément pour garantir une structure propre et sûre.
function normalizeItem(it) {
  return {
    id:    String(it.id),
    titre: typeof it.titre === 'string' ? it.titre : '',
    texte: typeof it.texte === 'string' ? it.texte : '',
    ts:    typeof it.ts === 'number' ? it.ts : Date.now()
  };
}

function mergeData(incomingItems, knownIdsArr, remoteItems) {
  const incoming = (Array.isArray(incomingItems) ? incomingItems : [])
    .filter(it => it && it.id != null)
    .map(normalizeItem);

  const incomingIds = new Set(incoming.map(it => it.id));
  const knownIds    = new Set((Array.isArray(knownIdsArr) ? knownIdsArr : []).map(String));

  const merged = incoming.slice();

  for (const r of (Array.isArray(remoteItems) ? remoteItems : [])) {
    if (!r || r.id == null) continue;
    const id = String(r.id);
    if (incomingIds.has(id)) continue; // le client fait autorité
    if (knownIds.has(id))    continue; // supprimé par le client → on respecte
    merged.push(normalizeItem(r));     // ajouté par quelqu'un d'autre → on garde
  }

  return merged;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await dbGetOrSeed('idees', async () => []);
      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const remote = await dbGet('idees');
      const merged = mergeData(body.items, body.knownIds, remote);
      await dbSet('idees', merged);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
