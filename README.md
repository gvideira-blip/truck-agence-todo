# Truck Agence — Todo

Tableau de tâches quotidien partagé pour l'équipe Truck Agence.

## Pages

- `index.html` — tableau des tâches (une colonne par commercial)
- `ventes.html` — suivi des ventes
- `tableau-blanc.html` — tableau blanc partagé
- `instructions.html` — points à voir avec Gaëtan
- `config.html` — **configuration de l'équipe** (ajouter / renommer / supprimer un commercial)
- `login.html` — écran de code PIN (accès 12 h)

## Architecture

- **Hébergement** : Vercel, déployé automatiquement à chaque commit sur `main` (GitHub).
- **Base de données** : Supabase, une seule table `app_data` (une ligne par jeu de données) :
  - `tasks` — les colonnes de tâches, indexées par identifiant de commercial
  - `ventes` — la liste des ventes + l'objectif
  - `instructions` — la liste des points "Point Gaëtan"
  - `board` — les tracés du tableau blanc
  - `config` — la liste des commerciaux `{ id, nom, couleur }`
- **API** : fonctions serverless dans `api/` ; `lib/db.js` contient l'accès Supabase partagé.
- **Synchronisation** : chaque page relit les données toutes les 5 secondes ;
  les sauvegardes utilisent une fusion "le client fait autorité" pour éviter
  que les suppressions ne réapparaissent.

## Variables d'environnement (Vercel → Settings → Environment Variables)

| Nom | Contenu |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Clé secrète `service_role` du projet Supabase |

## Table Supabase

```sql
create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table app_data enable row level security;
```

## Migration automatique

Au premier appel après la mise en ligne, chaque API importe automatiquement
les anciennes données depuis les fichiers `data/*.json` du repo (l'ancien
système de stockage). Ces fichiers restent ensuite comme archive de
l'ancien système — ils ne sont plus mis à jour.

## Gérer l'équipe

Tout se fait depuis la page **⚙️ Configuration** de l'application :
ajouter un commercial crée sa colonne, le renommer conserve ses tâches,
le supprimer efface définitivement sa colonne (une confirmation est demandée).
