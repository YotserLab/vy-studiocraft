# VYStudioCraft

Production studio for YouTube channels — niche radar, Kanban projects,
AI scriptwriting (Gemini), a 30-second video comparator, RSS news,
a media library, and a Remotion-based template/render engine.

## Architecture

Three services, orchestrated for dev and unified in production:

| Service | Stack | Dev port | Role |
|---|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 | `:34567` | SPA; proxies `/api` in dev |
| Backend | Go (`backend-go/`) | `:8080` | REST API `/api/v1/*`, SQLite store, serves the built SPA in prod |
| Render service | Node/tsx + Express + Remotion + Gemini | `:8090` | Renders parameterized video templates, serves generated media |

In production, a single Go binary serves the API and the static SPA.

## Getting started

Prerequisites: [bun](https://bun.sh), Go, and (for the render service) a
`GEMINI_API_KEY` — see `.env.example`.

```bash
bun install        # NFS mounts: use bun install --backend=copyfile
cp .env.example .env

make dev           # FE + BE + render service together (Ctrl+C stops all)
make prod          # vite build + go build, then serve on :34567
make start         # serve prod without rebuilding
```

Per-service dev commands: `bun run dev:fe`, `bun run dev:be`,
`bun run dev:render`.

## Project layout

```
backend-go/         Go API server (cmd/, internal/, migrations/)
render-service/     Express render service (Remotion + Gemini)
src/                React app (views/, components/, contexts/, lib/)
src/remotion-templates/  Parameterized Remotion compositions
scripts/            Dev orchestration
public/assets/      Static content bundles
```

## Commits

This repo follows [Conventional Commits](https://www.conventionalcommits.org):
`type(scope): imperative summary` — enforced by a `commit-msg` hook.
