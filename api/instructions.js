// api/instructions.js
// Placer ce fichier dans le dossier api/ du repo (chemin : api/instructions.js)
//
// Même principe que api/tasks.js :
//  - stockage dans un fichier JSON du repo via l'API GitHub
//  - réessais en cas de conflit (SHA 409)  -> bug "deux personnes en même temps"
//  - fusion : le client fait autorité (suppressions incluses), on ne récupère
//    du serveur que les éléments AJOUTÉS par d'autres et jamais vus par le client
//    -> bug "la ligne supprimée revient"
//
// Différence : ici les données sont une LISTE d'objets identifiés par "id",
// au lieu d'une grille repérée par position. Le repère de fusion est donc l'id.

const GH_OWNER  = 'gvideira-blip';
const GH_REPO   = 'truck-agence-todo';
const GH_PATH   = 'data/instructions.json'; // case de stockage dédiée
const GH_BRANCH = 'main';

const MAX_RETRIES = 3; // Nombre de tentatives en cas de conflit (SHA périmé)

async function ghGet() {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}&t=${Date.now()}`;
  const r = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'truck-agence-todo',
      'Cache-Control': 'no-cache'
    }
  });
  if (r.status === 404) return { data: null, sha: null };
  if (!r.ok) throw new Error(`GitHub GET ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = Buffer.from(j.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: j.sha };
}

async function ghPut(data, sha) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
  const body = {
    message: `update instructions ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(data)).toString('base64'),
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'truck-agence-todo',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (r.status === 409) {
    // SHA conflict — on signale pour que l'appelant retente
    return { conflict: true };
  }
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`);
  return { conflict: false };
}

function defaultData() {
  return []; // une liste vide au départ
}

// Normalise un élément pour garantir une structure propre et sûre.
function normalizeItem(it) {
  return {
    id:     String(it.id),
    text:   typeof it.text   === 'string' ? it.text   : '',
    author: typeof it.author === 'string' ? it.author : '',
    done:   !!it.done,
    ts:     typeof it.ts === 'number' ? it.ts : Date.now()
  };
}

/**
 * Fusion "suppression prioritaire", version liste d'objets identifiés par id.
 *
 * - incomingItems : la liste que le client envoie = SA vérité (les éléments
 *   qu'il a supprimés sont simplement absents de cette liste).
 * - knownIds : les ids que le client connaissait lors de sa dernière synchro.
 *   C'est ce qui permet de distinguer "j'ai supprimé cet élément" (id connu,
 *   mais absent de incoming -> on NE le récupère PAS) de "je ne l'ai jamais vu"
 *   (id inconnu, présent côté serveur -> ajouté par quelqu'un d'autre, on le garde).
 * - remoteItems : l'état actuellement stocké côté serveur.
 */
function mergeData(incomingItems, knownIdsArr, remoteItems) {
  const incoming = (Array.isArray(incomingItems) ? incomingItems : [])
    .filter(it => it && it.id != null)
    .map(normalizeItem);

  const incomingIds = new Set(incoming.map(it => it.id));
  const knownIds    = new Set((Array.isArray(knownIdsArr) ? knownIdsArr : []).map(String));

  // 1. Base = ce que le client envoie (sa vérité, suppressions incluses).
  const merged = incoming.slice();

  // 2. On parcourt l'état distant pour récupérer UNIQUEMENT les éléments
  //    qu'une autre personne a ajoutés sans que le client les ait vus.
  for (const r of (Array.isArray(remoteItems) ? remoteItems : [])) {
    if (!r || r.id == null) continue;
    const id = String(r.id);
    if (incomingIds.has(id)) continue; // déjà dans la liste du client -> client fait autorité
    if (knownIds.has(id))    continue; // le client le connaissait et l'a supprimé -> on respecte
    merged.push(normalizeItem(r));     // jamais vu par le client -> ajout d'un autre, on garde
  }

  return merged;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { data } = await ghGet();
      return res.status(200).json(data || defaultData());
    }

    if (req.method === 'POST') {
      // Le client envoie { items: [...], knownIds: [...] }
      const payload = req.body || {};
      const incoming = payload.items;
      const knownIds = payload.knownIds;
      if (!Array.isArray(incoming)) {
        return res.status(400).json({ error: 'Format invalide' });
      }

      // Boucle de réessais en cas de conflit SHA (deux sauvegardes simultanées)
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { data: remote, sha } = await ghGet();
        const base = remote || defaultData();

        const merged = mergeData(
          JSON.parse(JSON.stringify(incoming)), // clone défensif
          knownIds,
          JSON.parse(JSON.stringify(base))
        );

        const result = await ghPut(merged, sha);
        if (!result.conflict) {
          return res.status(200).json({ ok: true, merged: attempt > 0 });
        }
        // Conflit -> petite pause puis nouvelle tentative
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
      }

      return res.status(409).json({ error: 'Conflit persistant après plusieurs tentatives' });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
