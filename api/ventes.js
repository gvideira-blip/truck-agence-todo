// api/ventes.js — Suivi des ventes, stocké dans Supabase.
//
// Format des données (clé 'ventes' dans Supabase) :
//   {
//     ventes:     [...],   // le tableau du mois en cours
//     objectif:   50000,
//     historique: [ { mois: "2026-07", ventes: [...], objectif: 50000 }, ... ]
//   }
// L'historique est alimenté par le bouton « Clôturer le mois » de la page.

import { dbGet, dbGetOrSeed, dbSet, fetchOldGithubJson, cors } from '../lib/db.js';

function defaultData() {
  return { ventes: [], objectif: 50000, historique: [] };
}

// Migration automatique depuis l'ancien fichier data/ventes.json du repo
async function seedVentes() {
  const old = await fetchOldGithubJson('ventes.json');
  if (old && typeof old === 'object') {
    return {
      ventes: Array.isArray(old.ventes) ? old.ventes : [],
      objectif: old.objectif !== undefined ? old.objectif : 50000,
      historique: Array.isArray(old.historique) ? old.historique : []
    };
  }
  return defaultData();
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const data = await dbGetOrSeed('ventes', seedVentes) || defaultData();
      if (!Array.isArray(data.historique)) data.historique = [];
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const incoming = req.body || {};

      // L'état du client fait foi — suppressions incluses (comme avant).
      // Sécurité : si le client n'envoie pas d'historique (ex. : ancienne
      // version de la page encore en cache), on CONSERVE l'historique
      // stocké au lieu de l'écraser.
      let historique = incoming.historique;
      if (!Array.isArray(historique)) {
        const remote = await dbGet('ventes');
        historique = (remote && Array.isArray(remote.historique)) ? remote.historique : [];
      }

      const payload = {
        ventes:   Array.isArray(incoming.ventes) ? incoming.ventes : [],
        objectif: incoming.objectif !== undefined ? incoming.objectif : 50000,
        historique
      };
      await dbSet('ventes', payload);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
