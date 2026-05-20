#!/bin/bash
if git diff HEAD^ HEAD --quiet -- ':!data/'; then
  echo "Seul data/ a change - build ignore"
  exit 0
else
  echo "Code modifie - build lance"
  exit 1
fi
