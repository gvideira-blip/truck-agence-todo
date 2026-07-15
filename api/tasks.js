// api/tasks.js — Tableau des tâches, stocké dans Supabase.
//
// Nouveau format des données (clé 'tasks' dans Supabase) :
//   { cols: { <idCommercial>: [ {text, done, prio}, ... ], ... } }
// Une colonne par commercial (voir la page Configuration).
//
// L'ancien format GitHub (grille de 3 colonnes fixes) est importé
// automatiquement au premier appel après la mise en ligne.

import { dbGet, dbSet, dbGetOrSeed, fetchOldGithubJson, getConfig, cors } from '../lib/db.js';

const MIN_ROWS = 10;

// Correspondance ancien format → nouveaux identifiants
// (colonne 0 = Chloé, colonne 1 = Camille, colonne 2 = Lila)
const LEGACY_COLS = ['chloe', 'camille', 'lila'];

function blankCell() { return { text: '', done: false, prio: '' }; }

function normCell(c) {
  return {
    text: (c && typeof c.text === 'string') ? c.text : '',
    done: !!(c && c.done),
    prio: (c && c.prio != null) ? String(c.prio) : ''
  };
}

function padCol(arr) {
  const out = (Array.isArray(arr) ? arr : []).map(normCell);
  while (out.length < MIN_ROWS) out.push(blankCell());
  return out;
}

// Migration automatique depuis l'ancien fichier data/tasks.json du repo
async function seedTasks() {
  const old = await fetchOldGithubJson('tasks.json');
  const cols = {};
  if (Array.isArray(old)) {
    LEGACY_COLS.forEach((id, ci) => {
      cols[id] = old.map(row => normCell(row && row[ci]));
    });
  }
  return { cols };
}

/**
 * Fusion "suppression prioritaire", colonne par colonne (même principe
 * qu'avant) : le client fait autorité sur les lignes qu'il connaît,
 * suppressions comprises. On ne récupère du serveur que les lignes
 * AJOUTÉES par quelqu'un d'autre au-delà de ce que le client connaît.
 */
function mergeCol(incoming, remote) {
  const inc = (Array.isArray(incoming) ? incoming : []).map(normCell);
  const rem = (Array.isArray(remote) ? remote : []).map(normCell);
  const merged = inc.slice();
  for (let i = inc.length; i < rem.length; i++) {
    if ((rem[i].text || '').trim() !== '') merged.push(rem[i]);
  }
  while (merged.length < MIN_ROWS) merged.push(blankCell());
  return merged;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const config = await getConfig();
    const ids = config.commerciaux.map(c => c.id);

    if (req.method === 'GET') {
      const doc = await dbGetOrSeed('tasks', seedTasks) || { cols: {} };
      const stored = doc.cols || {};
      // On ne renvoie que les colonnes des commerciaux actuels,
      // chacune complétée à 10 lignes minimum.
      const cols = {};
      for (const id of ids) cols[id] = padCol(stored[id]);
      return res.status(200).json({ cols });
    }

    if (req.method === 'POST') {
      const incoming = (req.body && req.body.cols && typeof req.body.cols === 'object')
        ? req.body.cols : null;
      if (!incoming) return res.status(400).json({ error: 'Format invalide' });

      const remoteDoc = await dbGet('tasks') || { cols: {} };
      const remote = remoteDoc.cols || {};

      const cols = {};
      for (const id of ids) {
        cols[id] = mergeCol(incoming[id], remote[id]);
      }
      // Les colonnes de commerciaux supprimés ne sont pas conservées.
      await dbSet('tasks', { cols });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
