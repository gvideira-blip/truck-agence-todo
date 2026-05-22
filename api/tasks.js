// api/tasks.js
// Renommer ce fichier en api/tasks.js dans le repo

const GH_OWNER = 'gvideira-blip';
const GH_REPO  = 'truck-agence-todo';
const GH_PATH  = 'data/tasks.json';
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
    message: `update tasks ${new Date().toISOString()}`,
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
    // SHA conflict — retourner un code spécial pour que l'appelant retry
    return { conflict: true };
  }
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`);
  return { conflict: false };
}

function defaultData() {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 3 }, () => ({ text: '', done: false, prio: '' }))
  );
}

/**
 * Merge optimiste : fusionne les modifications entrantes avec l'état actuel sur GitHub.
 *
 * Stratégie cellule par cellule :
 * - Si la cellule entrante a du contenu et que la cellule distante est vide → on prend l'entrante
 * - Si la cellule entrante est vide et que la cellule distante a du contenu → on garde la distante
 * - Si les deux ont du contenu et sont différentes → on garde les DEUX (la distante en premier,
 *   l'entrante ajoutée à la ligne suivante disponible)
 * - Si identiques → rien à faire
 *
 * Pour prio et done : on prend la valeur la plus récente (entrante) si le texte correspond,
 * sinon on garde la valeur distante.
 */
function mergeData(incoming, remote) {
  // Normalise les dimensions : prend le max de lignes
  const COLS = 3;
  const maxRows = Math.max(incoming.length, remote.length, 10);

  // Étend les tableaux si nécessaire
  while (incoming.length < maxRows) incoming.push(Array.from({ length: COLS }, () => ({ text: '', done: false, prio: '' })));
  while (remote.length < maxRows) remote.push(Array.from({ length: COLS }, () => ({ text: '', done: false, prio: '' })));

  const merged = remote.map(row => row.map(cell => ({ ...cell })));

  for (let ci = 0; ci < COLS; ci++) {
    // Construire un index des textes distants pour déduplication
    const remoteTexts = new Set(
      remote.map(row => (row[ci]?.text || '').trim().toLowerCase()).filter(Boolean)
    );

    for (let ri = 0; ri < incoming.length; ri++) {
      const inc = incoming[ri]?.[ci];
      const rem = remote[ri]?.[ci];
      if (!inc) continue;

      const incText = (inc.text || '').trim();
      const remText = (rem?.text || '').trim();

      if (!incText) continue; // Cellule entrante vide → on garde l'état distant tel quel

      if (!remText) {
        // Case distante vide → on applique directement la valeur entrante
        merged[ri][ci] = { ...inc };
      } else if (incText.toLowerCase() === remText.toLowerCase()) {
        // Même texte → on met à jour prio et done avec la valeur entrante (plus récente)
        merged[ri][ci] = { ...rem, done: inc.done, prio: inc.prio };
      } else {
        // Conflit de contenu : le texte entrant n'est pas encore dans le distant → on l'ajoute
        if (!remoteTexts.has(incText.toLowerCase())) {
          // Chercher la première ligne vide dans cette colonne
          let inserted = false;
          for (let r2 = 0; r2 < merged.length; r2++) {
            if (!(merged[r2][ci]?.text || '').trim()) {
              merged[r2][ci] = { ...inc };
              remoteTexts.add(incText.toLowerCase());
              inserted = true;
              break;
            }
          }
          if (!inserted) {
            // Plus de place → étendre le tableau
            const newRow = Array.from({ length: COLS }, () => ({ text: '', done: false, prio: '' }));
            newRow[ci] = { ...inc };
            merged.push(newRow);
            remoteTexts.add(incText.toLowerCase());
          }
        } else {
          // Le texte entrant existe déjà côté distant → mettre à jour done/prio sur la bonne ligne
          for (let r2 = 0; r2 < merged.length; r2++) {
            if ((merged[r2][ci]?.text || '').trim().toLowerCase() === incText.toLowerCase()) {
              merged[r2][ci] = { ...merged[r2][ci], done: inc.done, prio: inc.prio };
              break;
            }
          }
        }
      }
    }
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
      const incoming = req.body;
      if (!Array.isArray(incoming)) {
        return res.status(400).json({ error: 'Format invalide' });
      }

      // Retry loop en cas de conflit SHA
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { data: remote, sha } = await ghGet();
        const base = remote || defaultData();

        // Fusion des données
        const merged = mergeData(
          JSON.parse(JSON.stringify(incoming)), // deep clone
          JSON.parse(JSON.stringify(base))
        );

        const result = await ghPut(merged, sha);
        if (!result.conflict) {
          return res.status(200).json({ ok: true, merged: attempt > 0 });
        }
        // SHA conflict → on relit et on retente
        await new Promise(r => setTimeout(r, 100 * (attempt + 1))); // backoff léger
      }

      return res.status(409).json({ error: 'Conflit persistant après plusieurs tentatives' });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
