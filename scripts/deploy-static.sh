#!/usr/bin/env bash

set -euo pipefail

# Root ovog projekta (DrusanyPortfolio)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Pretpostavka: drusany-static je brat folder uz DrusanyPortfolio:
# /Users/icom4/Documents/VibeCode/DrusanyPortfolio
# /Users/icom4/Documents/VibeCode/drusany-static
STATIC_DIR="$(cd "$PROJECT_DIR/.." && pwd)/drusany-static"

if [ ! -d "$STATIC_DIR/.git" ]; then
  echo "❌ drusany-static repo nije pronađen u: $STATIC_DIR"
  echo "   Provjeri da postoji i da je git repo."
  exit 1
fi

echo "▶️ Buildam projekt u $PROJECT_DIR ..."
cd "$PROJECT_DIR"
npm run build

echo "▶️ Kopiram out/ u $STATIC_DIR (bez uploads)..."
cd "$STATIC_DIR"
rm -rf -- *
cp -R "$PROJECT_DIR/out/"* .
rm -rf uploads 2>/dev/null || true
cp "$PROJECT_DIR/out/.htaccess" . 2>/dev/null || true

# Ako nema promjena, ne radi commit
if git diff --quiet && git diff --cached --quiet; then
  echo "ℹ️  Nema promjena za deploy."
  exit 0
fi

echo "▶️ Commit + push na drusany-static..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
git push

echo
echo "✅ Gotovo: promjene su u drusany-static repou."
echo "➡️  U cPanelu (Git Version Control) klikni 'Deploy HEAD Commit' za drusany-static."

