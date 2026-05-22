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
 * Merge "suppression prioritaire".
 *
 * Le client fait autorité sur les lignes qu'il connaît (position par
 * position) : ce qu'il envoie est appliqué tel quel, suppressions
 * comprises. Effacer une case côté client = la case reste effacée.
 *
 * Le seul apport du merge : si une autre personne a AJOUTÉ des lignes
 * au-delà de ce que le client connaît, ces lignes sont conservées.
 *
 * Ce choix privilégie une suppression fiable. Le risque résiduel
 * (deux personnes éditant la même case à la même seconde) est
 * négligeable ici : chaque apprentie a sa propre colonne.
 */
function mergeData(incoming, remote) {
  const COLS = 3;

  // ── Principe (suppression prioritaire) ──────────────────────
  // Le CLIENT fait autorité sur les lignes qu'il connaît, position
  // par position. Effacer une case = la case reste effacée.
  //
  // Le merge ne sert qu'à UN seul cas réel de concurrence :
  // une autre personne a AJOUTÉ une ligne plus bas que tout ce que
  // le client connaît. Dans ce cas seulement, on récupère du distant.
  //
  // Concrètement :
  //  - Pour toutes les lignes 0..incoming.length-1  → on prend INCOMING
  //    (y compris les cases vides : c'est une suppression volontaire)
  //  - Pour les lignes au-delà (remote plus long)   → on ajoute le
  //    contenu distant non vide que le client n'a pas vu
  // ────────────────────────────────────────────────────────────

  // 1. Base = ce que le client envoie (sa vérité, suppressions incluses)
  const merged = incoming.map(row => {
    // Sécurité : normaliser chaque ligne sur COLS colonnes
    const safe = [];
    for (let ci = 0; ci < COLS; ci++) {
      const c = row && row[ci] ? row[ci] : { text: '', done: false, prio: '' };
      safe.push({
        text: c.text || '',
        done: !!c.done,
        prio: c.prio || ''
      });
    }
    return safe;
  });

  // 2. Récupérer UNIQUEMENT les lignes distantes que le client
  //    ne connaît pas (index >= incoming.length) et qui ont du contenu.
  //    C'est le seul cas où une autre personne a ajouté quelque chose
  //    sans que le client en ait connaissance.
  if (remote.length > incoming.length) {
    for (let ri = incoming.length; ri < remote.length; ri++) {
      const remoteRow = remote[ri];
      if (!remoteRow) continue;
      // La ligne distante a-t-elle au moins une case remplie ?
      const hasContent = remoteRow.some(c => (c?.text || '').trim() !== '');
      if (hasContent) {
        const safe = [];
        for (let ci = 0; ci < COLS; ci++) {
          const c = remoteRow[ci] || { text: '', done: false, prio: '' };
          safe.push({
            text: c.text || '',
            done: !!c.done,
            prio: c.prio || ''
          });
        }
        merged.push(safe);
      }
    }
  }

  // 3. Garantir un minimum de 10 lignes (cohérent avec blank())
  while (merged.length < 10) {
    merged.push(Array.from({ length: COLS }, () => ({ text: '', done: false, prio: '' })));
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
