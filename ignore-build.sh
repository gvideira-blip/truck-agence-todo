#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Ignored Build Step pour Vercel.
#
# But : NE PAS redéployer quand un commit ne touche QUE le dossier
# data/ (sauvegardes de tasks.json / board.json / ventes.json).
# Ces commits sont générés automatiquement à chaque sauvegarde et
# n'ont aucun impact sur le code => inutile de redéployer.
#
# Codes de sortie attendus par Vercel :
#   exit 0  => build ANNULÉ (on ignore ce commit)
#   exit 1  => build LANCÉ  (vrai changement de code)
# ──────────────────────────────────────────────────────────────

# Sécurité : s'il n'y a pas de commit parent (premier commit de la
# branche), on ne peut pas comparer => on déploie par précaution.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "Pas de commit parent - build lance par securite"
  exit 1
fi

# Compare le commit courant à son parent, en EXCLUANT le dossier data/.
# --quiet : code 0 si AUCUNE différence hors data/, code 1 sinon.
if git diff HEAD^ HEAD --quiet -- ':!data/'; then
  echo "Seul data/ a change - build ignore"
  exit 0
else
  echo "Code modifie - build lance"
  exit 1
fi
