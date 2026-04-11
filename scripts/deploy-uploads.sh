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
  # --delete: uklanja sa servera datoteke kojih lokalno više nema (obrisane fotke iz galerije).
  # Bez --delete, stare slike ostaju zauvijek na serveru.
  if [ "${UPLOADS_DELETE:-1}" = "1" ]; then
    SSH_OPTS+=(--delete)
    echo "  rsync --delete → $SSH_USER@$SSH_HOST:$SSH_PATH/uploads/"
  else
    echo "  rsync (bez --delete) → $SSH_USER@$SSH_HOST:$SSH_PATH/uploads/"
  fi
  rsync "${SSH_OPTS[@]}" "$UPLOADS_DIR/" "$SSH_USER@$SSH_HOST:$SSH_PATH/uploads/"
  echo "✅ rsync uploads završen."

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
