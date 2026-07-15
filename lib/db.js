// lib/db.js — Accès Supabase partagé par toutes les fonctions API.
//
// Toutes les données de l'application sont stockées dans UNE seule table
// Supabase nommée "app_data" : une ligne par jeu de données.
//   key = 'tasks' | 'ventes' | 'instructions' | 'board' | 'config'
//   value = le contenu JSON
//
// Variables d'environnement requises (Vercel → Settings → Environment Variables) :
//   SUPABASE_URL          → l'URL du projet Supabase (https://xxxx.supabase.co)
//   SUPABASE_SERVICE_KEY  → la clé "service_role" (secrète, jamais côté navigateur)

const TABLE = 'app_data';

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      'Configuration manquante : ajoutez SUPABASE_URL et SUPABASE_SERVICE_KEY ' +
      'dans Vercel → Settings → Environment Variables, puis redéployez.'
    );
  }
  return { url: url.replace(/\/+$/, ''), key };
}

function baseHeaders(key) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

/** Lit une valeur. Retourne null si la clé n'existe pas encore. */
export async function dbGet(k) {
  const { url, key } = env();
  const r = await fetch(
    `${url}/rest/v1/${TABLE}?key=eq.${encodeURIComponent(k)}&select=value`,
    { headers: baseHeaders(key) }
  );
  if (!r.ok) throw new Error(`Supabase GET ${r.status}: ${await r.text()}`);
  const rows = await r.json();
  return rows.length ? rows[0].value : null;
}

/** Écrit (crée ou remplace) une valeur. */
export async function dbSet(k, value) {
  const { url, key } = env();
  const r = await fetch(`${url}/rest/v1/${TABLE}?on_conflict=key`, {
    method: 'POST',
    headers: {
      ...baseHeaders(key),
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([{ key: k, value, updated_at: new Date().toISOString() }])
  });
  if (!r.ok) throw new Error(`Supabase SET ${r.status}: ${await r.text()}`);
}

/**
 * Lit une valeur ; si elle n'existe pas encore, appelle seed() pour
 * fabriquer la valeur initiale, l'enregistre, puis la retourne.
 * → C'est la "migration automatique" : au premier appel après la mise
 *   en ligne, les anciennes données GitHub sont importées dans Supabase.
 */
export async function dbGetOrSeed(k, seed) {
  let v = await dbGet(k);
  if (v !== null && v !== undefined) return v;
  v = await seed();
  if (v !== null && v !== undefined) await dbSet(k, v);
  return v;
}

/**
 * Récupère un ancien fichier data/*.json depuis le repo GitHub public
 * (utilisé une seule fois, pour la migration automatique).
 */
export async function fetchOldGithubJson(file) {
  try {
    const r = await fetch(
      `https://raw.githubusercontent.com/gvideira-blip/truck-agence-todo/main/data/${file}?t=${Date.now()}`
    );
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

// ─── Configuration des commerciaux ───────────────────────────────────
// L'équipe au moment de la migration. Ensuite, la liste vit dans Supabase
// et se gère depuis la page Configuration de l'application.
export const DEFAULT_COMMERCIAUX = [
  { id: 'chloe',   nom: 'Chloé',   couleur: 0 },
  { id: 'camille', nom: 'Camille', couleur: 1 },
  { id: 'lila',    nom: 'Lila',    couleur: 2 },
  { id: 'celia',   nom: 'Célia',   couleur: 3 },
  { id: 'oceane',  nom: 'Océane',  couleur: 4 }
];

/** Lit la config (liste des commerciaux), en la créant au premier appel. */
export async function getConfig() {
  const cfg = await dbGetOrSeed('config', async () => ({ commerciaux: DEFAULT_COMMERCIAUX }));
  if (!cfg || !Array.isArray(cfg.commerciaux) || cfg.commerciaux.length === 0) {
    return { commerciaux: DEFAULT_COMMERCIAUX };
  }
  return cfg;
}

/** En-têtes CORS communs à toutes les API. */
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
