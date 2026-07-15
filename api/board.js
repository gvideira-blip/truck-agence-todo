// api/board.js — Tableau blanc, stocké dans Supabase.
//
// Format des données (clé 'board' dans Supabase) : { strokes: [...] }
// Identique à l'ancien format — seule la façon de stocker change.

import { dbGetOrSeed, dbSet, fetchOldGithubJson, cors } from '../lib/db.js';

function defaultData() {
  return { strokes: [] };
}

// Migration automatique depuis l'ancien fichier data/board.json du repo
async function seedBoard() {
  const old = await fetchOldGithubJson('board.json');
  return (old && typeof old === 'object') ? old : defaultData();
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await dbGetOrSeed('board', seedBoard);
      return res.status(200).json(data || defaultData());
    }

    if (req.method === 'POST') {
      const body = (req.body && typeof req.body === 'object') ? req.body : defaultData();
      await dbSet('board', body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
