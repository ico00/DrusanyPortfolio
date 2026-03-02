#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Otvori Terminal i pokreni dev server
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR && npm run dev\""

# 2. Čekaj da server starta (max 30 s)
echo "Čekam da dev server starta..."
for i in {1..30}; do
  if curl -s -o /dev/null "http://localhost:3000" 2>/dev/null; then
    echo "Server spreman."
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "⚠️ Timeout – otvaram Chrome anyway (server možda još starta)."
  fi
done

# 3. Otvori Chrome s 2 taba
open -a "Google Chrome" "http://localhost:3000" "http://localhost:3000/admin"
