// api/instructions.js — Liste "Point Gaëtan", stockée dans Supabase.
//
// Format des données (clé 'instructions' dans Supabase) :
//   [ { id, text, author, done, prio, ts }, ... ]
// Identique à l'ancien format — seule la façon de stocker change.
// La logique de fusion (le client fait autorité, on récupère seulement
// les points ajoutés par d'autres) est conservée telle quelle.

import { dbGet, dbSet, dbGetOrSeed, fetchOldGithubJson, cors } from '../lib/db.js';

// Migration automatique depuis l'ancien fichier data/instructions.json
async function seedInstructions() {
  const old = await fetchOldGithubJson('instructions.json');
  return Array.isArray(old) ? old : [];
}

// Normalise un élément pour garantir une structure propre et sûre.
function normalizeItem(it) {
  return {
    id:     String(it.id),
    text:   typeof it.text   === 'string' ? it.text   : '',
    author: typeof it.author === 'string' ? it.author : '',
    done:   !!it.done,
    prio:   (it.prio == null ? '' : String(it.prio)),
    ts:     typeof it.ts === 'number' ? it.ts : Date.now()
  };
}

/**
 * Fusion "suppression prioritaire" (inchangée) :
 * - incomingItems : la liste envoyée par le client = SA vérité.
 * - knownIds : les ids que le client connaissait à sa dernière synchro.
 *   Permet de distinguer "j'ai supprimé cet élément" (id connu, absent
 *   de incoming → on NE le récupère PAS) de "je ne l'ai jamais vu"
 *   (id inconnu présent côté serveur → ajouté par un autre, on le garde).
 * - remoteItems : l'état actuellement stocké côté serveur.
 */
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
      const data = await dbGetOrSeed('instructions', seedInstructions);
      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const remote = await dbGet('instructions');
      const merged = mergeData(body.items, body.knownIds, remote);
      await dbSet('instructions', merged);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
