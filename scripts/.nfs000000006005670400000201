#!/usr/bin/env bash
# Sobe FE + BE + render service em modo dev na mesma sessão:
#   BE:     Go em :8080       (bun run dev:be)
#   RENDER: Node/tsx em :8090 (bun run dev:render) — Remotion/Gemini + mídia
#   FE:     Vite em :34567    (bun run dev:fe) — /api proxy -> :8080/:8090
# Ctrl+C encerra tudo: set -m coloca cada job em process group próprio e o
# trap mata o grupo inteiro (bun -> sh -> vite / go run -> binário compilado).
set -m

cleanup() {
  for pgid in $(jobs -p); do
    kill -TERM -- -"$pgid" 2>/dev/null
  done
}
trap cleanup INT TERM EXIT

bun run dev:be &
bun run dev:render &
bun run dev:fe &

# retorna quando o PRIMEIRO job morre -> EXIT trap derruba os outros também
wait -n
