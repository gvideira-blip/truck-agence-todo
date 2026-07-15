// api/config.js — Liste des commerciaux (gérée depuis la page Configuration).
//
// Format des données (clé 'config' dans Supabase) :
//   { commerciaux: [ { id: 'chloe', nom: 'Chloé', couleur: 0 }, ... ] }
//
// - id      : identifiant technique stable (sert de clé pour la colonne
//             de tâches — il ne change jamais, même si on renomme).
// - nom     : le prénom affiché.
// - couleur : index de couleur (0 à 7) dans la palette partagée des pages.
//
// À la suppression d'un commercial, sa colonne de tâches est
// définitivement supprimée (la page Configuration prévient avant).

import { dbGet, dbSet, getConfig, cors } from '../lib/db.js';

const MAX_COMMERCIAUX = 12;

// Transforme un nom en identifiant technique : "Célia" → "celia"
function slugify(nom) {
  return nom
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'commercial';
}

function validateAndClean(list) {
  if (!Array.isArray(list)) return { error: 'Format invalide' };
  if (list.length === 0) return { error: 'Il faut au moins un commercial.' };
  if (list.length > MAX_COMMERCIAUX) return { error: `Maximum ${MAX_COMMERCIAUX} commerciaux.` };

  const usedIds = new Set();
  const usedColors = new Set();
  const clean = [];

  for (const item of list) {
    const nom = (item && typeof item.nom === 'string') ? item.nom.trim() : '';
    if (!nom) return { error: 'Chaque commercial doit avoir un prénom.' };
    if (nom.length > 30) return { error: 'Prénom trop long (30 caractères max).' };

    // id : on garde celui fourni s'il est valide, sinon on le fabrique
    let id = (item && typeof item.id === 'string' && /^[a-z0-9-]{1,40}$/.test(item.id))
      ? item.id : slugify(nom);
    let base = id, n = 2;
    while (usedIds.has(id)) { id = `${base}-${n}`; n++; }
    usedIds.add(id);

    let couleur = Number.isInteger(item && item.couleur) ? item.couleur : -1;
    if (couleur < 0 || couleur > 7) couleur = -1;
    clean.push({ id, nom, couleur });
  }

  // Attribue une couleur libre à ceux qui n'en ont pas
  clean.forEach(c => { if (c.couleur >= 0) usedColors.add(c.couleur); });
  for (const c of clean) {
    if (c.couleur < 0) {
      let k = 0;
      while (usedColors.has(k % 8) && k < 8) k++;
      c.couleur = k % 8;
      usedColors.add(c.couleur);
    }
  }

  return { clean };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const config = await getConfig();
      return res.status(200).json(config);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { clean, error } = validateAndClean(body.commerciaux);
      if (error) return res.status(400).json({ error });

      const config = { commerciaux: clean };
      await dbSet('config', config);

      // Nettoyage : on supprime les colonnes de tâches des commerciaux
      // qui ne font plus partie de la liste.
      const ids = new Set(clean.map(c => c.id));
      const tasksDoc = await dbGet('tasks');
      if (tasksDoc && tasksDoc.cols) {
        const cols = {};
        for (const [id, col] of Object.entries(tasksDoc.cols)) {
          if (ids.has(id)) cols[id] = col;
        }
        await dbSet('tasks', { cols });
      }

      return res.status(200).json({ ok: true, config });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
