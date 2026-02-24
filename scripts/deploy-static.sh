#!/usr/bin/env bash

set -euo pipefail

# Root ovog projekta (DrusanyPortfolio)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Učitaj .env za FTP_* varijable (opcionalno)
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Pretpostavka: drusany-static je brat folder uz DrusanyPortfolio:
# /Users/icom4/Documents/VibeCode/DrusanyPortfolio
# /Users/icom4/Documents/VibeCode/drusany-static
STATIC_DIR="$(cd "$PROJECT_DIR/.." && pwd)/drusany-static"

# cPanel putanje – prilagodi ako koristiš drugi account:
# export CPANEL_DEPLOY_PATH=/home/tvoj_user/public_html
# export CPANEL_REPO_PATH=/home/tvoj_user/repositories/drusany-static

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
# cp -R out/. kopira SVE uključujući .htaccess (out/* ne uključuje dotfileove)
cp -R "$PROJECT_DIR/out"/. .
rm -rf uploads 2>/dev/null || true

# .cpanel.yml: jednostavan cp (kao prije) – export + cp -R * + eksplicitno .htaccess
CPANEL_DEPLOY_PATH="${CPANEL_DEPLOY_PATH:-/home/drusanyc/public_html}"
cat > .cpanel.yml << CPANEL_EOF
---
deployment:
  tasks:
    - export DEPLOYPATH=$CPANEL_DEPLOY_PATH
    - /bin/cp -f .htaccess \$DEPLOYPATH/ 2>/dev/null || true
    - /bin/cp -R * \$DEPLOYPATH
CPANEL_EOF

# Git commit + push (ako ima promjena)
if git diff --quiet && git diff --cached --quiet; then
  echo "ℹ️  Nema git promjena za commit."
else
  echo "▶️ Commit + push na drusany-static..."
  git add .
  git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
  git push
  echo "✅ Push završen."
fi

# rsync over SSH – preporučeno: samo promijenjene datoteke, brzo
if [ -n "${SSH_HOST:-}" ] && [ -n "${SSH_USER:-}" ]; then
  echo "▶️ rsync na server (samo promijenjene datoteke)..."
  SSH_PATH="${SSH_PATH:-/home/drusanyc/public_html}"
  SSH_OPTS=(-avz --exclude='uploads' --exclude='.DS_Store')
  if [ -n "${SSH_PORT:-}" ]; then
    SSH_OPTS+=(-e "ssh -p $SSH_PORT")
  fi
  rsync "${SSH_OPTS[@]}" "$PROJECT_DIR/out/" "$SSH_USER@$SSH_HOST:$SSH_PATH/"
  echo "✅ rsync deploy završen."
# FTP deploy – alternativa ako nemaš SSH
elif [ -n "${FTP_HOST:-}" ] && [ -n "${FTP_USER:-}" ] && [ -n "${FTP_PASS:-}" ]; then
  echo "▶️ FTP upload na server..."
  export FTP_REMOTE_PATH="${FTP_REMOTE_PATH:-/public_html}"
  node "$PROJECT_DIR/scripts/deploy-ftp.mjs" && echo "✅ FTP deploy završen."
else
  echo "➡️  U cPanelu (Git Version Control → drusany-static → Pull or Deploy):"
  echo "    1. Klikni 'Update from Remote' (povuče promjene s GitHuba)"
  echo "    2. Klikni 'Deploy HEAD Commit' (kopira u public_html)"
  echo ""
  echo "   Za rsync (samo promijenjene datoteke): postavi SSH_HOST, SSH_USER u .env"
fi
echo ""

