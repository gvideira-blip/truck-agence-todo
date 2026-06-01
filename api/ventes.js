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
      const incoming = req.body || {};

      // L'état du client fait foi — suppressions incluses.
      // On écrit exactement ce qu'il envoie, sans merge :
      // c'est le merge qui ressuscitait les ventes supprimées.
      const payload = {
        ventes:   Array.isArray(incoming.ventes) ? incoming.ventes : [],
        objectif: incoming.objectif !== undefined ? incoming.objectif : 50000
      };

      // Verrou optimiste : on récupère le SHA courant juste avant d'écrire.
      // Si le fichier a changé entre-temps (409), on relit le SHA et on retente.
      // Dernier qui écrit gagne (comme la page Tâches).
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { sha } = await ghGet();
        const result = await ghPut(payload, sha);
        if (!result.conflict) {
          return res.status(200).json({ ok: true });
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
