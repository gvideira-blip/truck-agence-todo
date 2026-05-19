# Truck Agence — Todo

Tableau de tâches quotidien partagé pour l'équipe Truck Agence.

## Stack
- `index.html` — interface du tableau
- `api/tasks.js` — API serverless (lecture/écriture)
- Vercel KV — base de données partagée en temps réel

## Déploiement

### 1. Créer le repo GitHub
1. Va sur github.com → New repository
2. Nom : `truck-agence-todo`
3. Privé ou public (au choix)
4. Cloner le repo et y copier ces fichiers

### 2. Déployer sur Vercel
1. vercel.com → Add New Project → importer `truck-agence-todo`
2. Laisser tous les paramètres par défaut → Deploy

### 3. Activer Vercel KV
1. Dans le dashboard Vercel → ton projet → Storage → Create Database → KV
2. Nommer la base `tasks`
3. Connect to Project → sélectionner ton projet
4. Les variables d'environnement sont ajoutées automatiquement

### 4. Domaine personnalisé (optionnel)
1. Settings → Domains → Add `todo.truck-agence.fr`
2. Ajouter un enregistrement CNAME chez ton registrar : `todo` → `cname.vercel-dns.com`

## Fonctionnement
- Synchronisation automatique toutes les 5 secondes entre tous les appareils
- Indicateur de sync en haut à droite (vert = ok, orange = en cours, rouge = erreur)
- Reset remet toutes les cases à zéro sans effacer le texte
