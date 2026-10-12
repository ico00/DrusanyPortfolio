#!/usr/bin/env bash

set -euo pipefail

# Root ovog projekta (DrusanyPortfolio)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPLOADS_DIR="$PROJECT_DIR/public/uploads"

# Učitaj .env za FTP_* / SSH_* varijable
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

if [ ! -d "$UPLOADS_DIR" ]; then
  echo "❌ public/uploads/ ne postoji: $UPLOADS_DIR"
  exit 1
fi

echo "▶️ Deploy uploads – šaljem samo promijenjene datoteke iz public/uploads/"

# rsync over SSH – preporučeno: samo promijenjene datoteke
if [ -n "${SSH_HOST:-}" ] && [ -n "${SSH_USER:-}" ]; then
  SSH_PATH="${SSH_PATH:-/home/drusanyc/public_html}"
  RSYNC_RSH="ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
  [ -n "${SSH_PORT:-}" ] && RSYNC_RSH+=" -p ${SSH_PORT}"
  [ -n "${SSH_KEY:-}" ] && RSYNC_RSH+=" -i ${SSH_KEY}"
  SSH_OPTS=(-avz -e "$RSYNC_RSH" --exclude='.DS_Store')
  # Namjerno bez --delete: sadržaj dignut ručno preko cPanela ne smije se brisati.
  echo "  rsync → $SSH_USER@$SSH_HOST:$SSH_PATH/uploads/"
  rsync "${SSH_OPTS[@]}" "$UPLOADS_DIR/" "$SSH_USER@$SSH_HOST:$SSH_PATH/uploads/"
  echo "✅ rsync uploads završen."

  # Brisanje samo onoga što je ova skripta sama poslala: usporedi popis datoteka iz
  # prošlog deploya (manifest) s trenutnim; sa servera se briše samo razlika.
  # Ručno dignut sadržaj nikad nije u manifestu pa ga skripta ne može dirnuti.
  MANIFEST="$PROJECT_DIR/scripts/.uploads-manifest"
  CURRENT="$(mktemp)"
  trap 'rm -f "$CURRENT"' EXIT
  (cd "$UPLOADS_DIR" && find . -type f ! -name '.DS_Store' | sed 's|^\./||' | LC_ALL=C sort) > "$CURRENT"
  if [ -f "$MANIFEST" ]; then
    REMOVED="$(LC_ALL=C comm -23 "$MANIFEST" "$CURRENT" | grep -v -e '^/' -e '\.\.' || true)"
    if [ -n "$REMOVED" ]; then
      echo "▶️ Brišem sa servera datoteke koje si obrisao lokalno:"
      echo "$REMOVED" | sed 's/^/  - /'
      SSH_CMD=(ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
      [ -n "${SSH_PORT:-}" ] && SSH_CMD+=(-p "${SSH_PORT}")
      [ -n "${SSH_KEY:-}" ] && SSH_CMD+=(-i "${SSH_KEY}")
      echo "$REMOVED" | "${SSH_CMD[@]}" "$SSH_USER@$SSH_HOST" \
        "cd '$SSH_PATH/uploads' && while IFS= read -r f; do rm -f -- \"\$f\"; done"
    else
      echo "ℹ️  Nema obrisanih datoteka za ukloniti sa servera."
    fi
  else
    echo "ℹ️  Prvi deploy s manifestom: ništa se ne briše, popis se samo sprema."
  fi
  cp "$CURRENT" "$MANIFEST"

# FTP deploy – alternativa ako nemaš SSH
elif [ -n "${FTP_HOST:-}" ] && [ -n "${FTP_USER:-}" ] && [ -n "${FTP_PASS:-}" ]; then
  echo "  FTP → uploads/"
  node "$PROJECT_DIR/scripts/deploy-uploads-ftp.mjs" && echo "✅ FTP uploads završen."

else
  echo "❌ Postavi SSH_HOST + SSH_USER ili FTP_HOST + FTP_USER + FTP_PASS u .env"
  echo ""
  echo "   rsync (preporučeno): SSH_HOST, SSH_USER, opcionalno SSH_PATH, SSH_PORT"
  echo "   FTP: FTP_HOST, FTP_USER, FTP_PASS, opcionalno FTP_REMOTE_PATH"
  exit 1
fi
