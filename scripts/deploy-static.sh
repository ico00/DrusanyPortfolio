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
  SSH_PATH="${SSH_PATH:-/home/drusanyc/public_html}"
  SSH_CMD=(ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
  if [ -n "${SSH_PORT:-}" ]; then
    SSH_CMD+=(-p "${SSH_PORT}")
  fi
  if [ -n "${SSH_KEY:-}" ]; then
    SSH_CMD+=(-i "${SSH_KEY}")
  fi

  # Stari Next export je radio MAPU blog/foo.html/ s __next datotekama; novi export
  # ima DATOTEKU blog/foo.html. Rsync ne može zamijeniti direktorij datotekom →
  # "could not make way for new regular file". Isto može vrijediti za admin/blog/edit/*.html/.
  if [ "${SKIP_REMOTE_HTML_DIR_CLEANUP:-}" != "1" ]; then
    echo "▶️ SSH: uklanjam legacy direktorije blog/*.html i admin/blog/edit/*.html (samo type -d)…"
    "${SSH_CMD[@]}" "${SSH_USER}@${SSH_HOST}" bash -s -- "$SSH_PATH" << 'REMOTE_CLEANUP'
set -eu
cd "$1" || { echo "Remote: ne postoji $1"; exit 1; }
for base in blog admin/blog/edit; do
  [ -d "$base" ] || continue
  for d in "$base"/*.html; do
    [ -d "$d" ] || continue
    echo "  rm -rf $d"
    rm -rf "$d"
  done
done
REMOTE_CLEANUP
  else
    echo "ℹ️  Preskačem SSH cleanup (SKIP_REMOTE_HTML_DIR_CLEANUP=1)."
  fi

  echo "▶️ rsync na server (--delete uklanja ostatke starog exporta; uploads je isključen)…"
  # --exclude uploads: ne šaljemo lokalni uploads iz out/; isključeni path na receiveru
  # se po defaultu NE briše uz --delete (bez --delete-excluded).
  RSYNC_RSH="ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
  [ -n "${SSH_PORT:-}" ] && RSYNC_RSH+=" -p ${SSH_PORT}"
  [ -n "${SSH_KEY:-}" ] && RSYNC_RSH+=" -i ${SSH_KEY}"
  RSYNC_OPTS=(-avz --delete -e "$RSYNC_RSH" --exclude='uploads' --exclude='.DS_Store')
  rsync "${RSYNC_OPTS[@]}" "$PROJECT_DIR/out/" "$SSH_USER@$SSH_HOST:$SSH_PATH/"
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
  echo "   Ako deploy javlja 'could not make way for new regular file' za blog/*.html:"
  echo "   na serveru jednom: find public_html/blog -maxdepth 1 -type d -name '*.html' -exec rm -rf {} +"
  echo ""
  echo "   Za rsync + automatski SSH cleanup: postavi SSH_HOST, SSH_USER u .env (SSH_PATH, SSH_PORT, SSH_KEY opcionalno)"
fi
echo ""

