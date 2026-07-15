// api/ventes.js — Suivi des ventes, stocké dans Supabase.
//
// Format des données (clé 'ventes' dans Supabase) :
//   { ventes: [...], objectif: 50000 }
// Identique à l'ancien format — seule la façon de stocker change.

import { dbGetOrSeed, dbSet, fetchOldGithubJson, cors } from '../lib/db.js';

function defaultData() {
  return { ventes: [], objectif: 50000 };
}

// Migration automatique depuis l'ancien fichier data/ventes.json du repo
async function seedVentes() {
  const old = await fetchOldGithubJson('ventes.json');
  if (old && typeof old === 'object') {
    return {
      ventes: Array.isArray(old.ventes) ? old.ventes : [],
      objectif: old.objectif !== undefined ? old.objectif : 50000
    };
  }
  return defaultData();
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await dbGetOrSeed('ventes', seedVentes);
      return res.status(200).json(data || defaultData());
    }

    if (req.method === 'POST') {
      const incoming = req.body || {};
      // L'état du client fait foi — suppressions incluses (comme avant).
      const payload = {
        ventes:   Array.isArray(incoming.ventes) ? incoming.ventes : [],
        objectif: incoming.objectif !== undefined ? incoming.objectif : 50000
      };
      await dbSet('ventes', payload);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
