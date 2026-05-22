// api/ventes.js

const GH_OWNER  = 'gvideira-blip';
const GH_REPO   = 'truck-agence-todo';
const GH_PATH   = 'data/ventes.json';
const GH_BRANCH = 'main';

const MAX_RETRIES = 3;

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
    message: `update ventes ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
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
  if (r.status === 409) return { conflict: true };
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`);
  return { conflict: false };
}

function defaultData() {
  return { ventes: [], objectif: 50000 };
}

/**
 * Merge optimiste pour les ventes.
 * Clé d'identité : immat (si remplie) ou acheteur+marque.
 * - Ligne présente dans les deux → on prend la version entrante (plus récente)
 * - Ligne présente uniquement dans l'entrante → on l'ajoute
 * - Ligne présente uniquement dans le distant → on la garde (ajoutée par un autre utilisateur)
 */
function getKey(v) {
  const immat = (v.immat || '').trim().toUpperCase();
  if (immat) return 'immat:' + immat;
  const combo = ((v.acheteur || '') + '|' + (v.marque || '')).trim().toUpperCase();
  if (combo !== '|') return 'combo:' + combo;
  return null; // Ligne vide, pas de clé
}

function mergeVentes(incoming, remote) {
  const incomingVentes = incoming.ventes || [];
  const remoteVentes   = remote.ventes   || [];

  // Index des ventes distantes par clé
  const remoteMap = new Map();
  remoteVentes.forEach((v, i) => {
    const k = getKey(v);
    if (k) remoteMap.set(k, { vente: v, idx: i });
  });

  // Index des ventes entrantes par clé
  const incomingMap = new Map();
  incomingVentes.forEach(v => {
    const k = getKey(v);
    if (k) incomingMap.set(k, v);
  });

  const merged = [];

  // 1. Parcourir les ventes distantes dans leur ordre
  for (const rv of remoteVentes) {
    const k = getKey(rv);
    if (k && incomingMap.has(k)) {
      // Ligne connue des deux → on prend la version entrante (opérateur plus récent)
      merged.push({ ...incomingMap.get(k) });
    } else {
      // Ligne uniquement distante (ajoutée par un autre) → on la garde
      merged.push({ ...rv });
    }
  }

  // 2. Ajouter les lignes entrantes qui n'existent pas dans le distant
  for (const iv of incomingVentes) {
    const k = getKey(iv);
    if (!k) continue; // Ligne vide, on saute
    if (!remoteMap.has(k)) {
      merged.push({ ...iv });
    }
  }

  // objectif : prendre la valeur entrante si elle a changé
  const objectif = incoming.objectif !== undefined
    ? incoming.objectif
    : (remote.objectif || 50000);

  return { ventes: merged, objectif };
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
      const incoming = req.body;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { data: remote, sha } = await ghGet();
        const base = remote || defaultData();

        const merged = mergeVentes(
          JSON.parse(JSON.stringify(incoming)),
          JSON.parse(JSON.stringify(base))
        );

        const result = await ghPut(merged, sha);
        if (!result.conflict) {
          return res.status(200).json({ ok: true, merged: attempt > 0 });
        }
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
      }

      return res.status(409).json({ error: 'Conflit persistant après plusieurs tentatives' });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
