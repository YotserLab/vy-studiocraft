# Spec — VYStudioCraft

> Especificação do sistema. Versão 1 — 2026-11-13.
> Sistema de gestão de canais YouTube para uso individual ou com usuários
> convidados: Radar de nichos, projetos kanban, roteirista IA, notícias,
> biblioteca de mídia e publicidade. **Sem billing** — não há vendas,
> assinaturas ou pagamentos.

## 1. Visão geral

```
Navegador (SPA web/index.html)
  ├─ camada de dados JS (web/js/data/*) — API de documentos, auth e
  │    arquivos falando com o backend:
  │    ├─ documentos → REST /api/v1/fs/* + SSE /api/v1/fs/events
  │    ├─ arquivos   → REST /api/v1/files*
  │    └─ auth       → REST /api/v1/auth/* (cookie de sessão)
  └─ roteador por caminho (deep links, history API, guards)
        │
        ▼ HTTP (mesma origem)
backend/cmd/vystudiocraft (Go, módulo `vystudiocraft`)
  ├─ internal/httpapi  — rotas, auth, docs, files, feed, estáticos
  ├─ internal/store    — SQLite (driver modernc; DSN compatível libSQL/Turso)
  ├─ internal/authx    — PBKDF2, tokens, TOTP
  ├─ internal/config   — variáveis de ambiente
  └─ migrations/       — SQL incremental (embed)
        │
        ├─ data/vystudiocraft.db      (SQLite; Turso em produção)
        └─ data/files/usuarios/…      (uploads em disco ou object storage)
```

Princípios:
- O browser **nunca** recebe credenciais de banco ou de administrador;
  todo acesso passa pela API com sessão validada no servidor.
- O usuário autenticado é derivado **do cookie de sessão**, nunca de um
  identificador enviado pelo cliente.
- `/api/*` nunca cai no fallback da SPA.
- Modelo de dados orientado a **documentos por path** (estilo banco de
  documentos: `usuarios/{uid}/ideias/{id}`), persistido em SQL — permite
  subcoleções e queries leves sem esquema por coleção.

## 2. Estrutura do repositório

| Caminho | Conteúdo |
|---|---|
| `web/` | SPA: `index.html`, `js/data/` (camada de dados), `manual/` (imagens de ajuda), `recuperar-senha/` |
| `backend/` | API Go (`cmd/vystudiocraft`, `internal/*`, `migrations/`) |
| `data/` | runtime: `vystudiocraft.db`, `files/`, binário — fora do git |
| `docs/` | esta spec, plano de migração, documentos de domínio |
| `diagram/` | fluxogramas do ciclo de produção |

## 3. Backend

### 3.1 Pacotes

- `internal/config` — carrega env (§9). Fallback `../web`, `../data`
  quando executado de `backend/`.
- `internal/store` — `DB` sobre `database/sql`; migrations embarcadas
  (`embed.FS`); CRUD de documentos por path, users, sessions,
  pending_logins, password_resets, files, audit.
- `internal/authx` — PBKDF2 (`HashPassword`/`CheckPassword`), `Token(n)`
  hex aleatório, TOTP base32 (`NewTOTPSecret`, `CheckTOTP`, `TOTPCode`).
- `internal/httpapi` — `http.ServeMux` com padrões Go 1.22+
  (`"GET /path"`), handlers por área.

### 3.2 Banco (migrations)

| Tabela | Chave | Propósito |
|---|---|---|
| `users` | `id` | email único, pass_hash, display_name, email_verified, is_admin, mfa_secret, timestamps |
| `sessions` | `token` | user_id (FK cascade), expires_at, reauth_at (janela de reautenticação p/ operações sensíveis) |
| `pending_logins` | `ticket` | desafios temporários (`purpose`: `login`/`reauth`), expira |
| `password_resets` | `token` | reset de senha, expira |
| `docs` | `path` | documentos: path completo, `coll`, `parent`, `uid`, `data` JSON, created/updated |
| `files` | `path` | metadados: uid, name, content_type, size, `disk` (caminho real), timestamps |
| `audit_events` | autoinc | user_id, action, detail |

Timestamps em milissegundos Unix (`INTEGER`).

### 3.3 Modelo de documentos

Cada documento é identificado pelo path completo (ex.:
`usuarios/{uid}/ideias/{id}`, `membros/{uid}`, `planos/catalogo`).
A tabela `docs` desnormaliza `coll` (path da coleção), `parent` e `uid`
(segundo segmento) para indexação. Documentos globais vivem em coleções
de raiz própria (`planos`, `aulas`, `erros`, `membros`).

## 4. Autenticação (`/api/v1/auth/*`)

Sessão por cookie `vysc_sess` (HttpOnly, SameSite=Lax), TTL
`SESSION_DAYS` (default 30d). Senha com PBKDF2-SHA256. Admin = usuário
cujo e-mail == `ADMIN_EMAIL`.

| Método/Path | Body | Resposta / efeito |
|---|---|---|
| POST `/signup` | `{email,password,name}` | **fechado por padrão** — só permite com `SIGNUP_OPEN=1` ou com o banco vazio (bootstrap do 1º usuário); fora isso → 403. Cria user (+admin se email==ADMIN_EMAIL), cookie, `{user}` |
| POST `/login` | `{email,password}` | `{user}`+cookie; se MFA: `{mfaRequired:true, ticket, hints}` |
| POST `/logout` | — | apaga sessão |
| GET `/me` | — | `{user}` ou 401 |
| GET `/token` | — | `{token}` (token cru da sessão p/ SSE/fetch sem cookie) |
| POST `/verify-email` | — | marca verificado; em `DEV_MODE` retorna link de debug |
| POST `/reauth` | `{password}` | renova `reauth_at`; se MFA: desafio (`mfaRequired`,`ticket`) |
| POST `/mfa/start` | — | exige reauth recente → `{secret}` base32 |
| POST `/mfa/enroll` | `{secret,code}` | valida TOTP e grava `mfa_secret` |
| POST `/mfa/unenroll` | — | remove MFA (reauth recente) |
| POST `/mfa/login` | `{ticket,code}` | conclui login com MFA → `{user}`+cookie |
| POST `/mfa/reauth` | `{ticket,code}` | conclui reauth com MFA |
| POST `/reset` | `{email}` | gera token; em `DEV_MODE` retorna `debugLink` para `/recuperar-senha/?token=` |
| POST `/reset/confirm` | `{token,password}` | troca senha, invalida sessões |

Detalhes de fluxo:
- MFA: o ticket em `pending_logins` só é **consumido após o código
  correto** (permite retry dentro do TTL).
- Operações sensíveis (enroll/unenroll MFA) exigem `reauth_at` recente.
- Reset gera link `{APP_ORIGIN}/recuperar-senha/?token=…` (página
  standalone em `web/recuperar-senha/`). Envio por e-mail/SMTP é
  responsabilidade da camada de notificação (hoje: log/`debugLink`).

## 5. Documentos (`/api/v1/fs/*`)

API REST de documentos inspirada em bancos orientados a documento:

| Operação | HTTP | Comportamento |
|---|---|---|
| get | GET `/api/v1/fs/{path}` | `{exists, id, path, data, createdAt, updatedAt}`; `exists:false` se ausente |
| list | GET `/api/v1/fs/{coll}` | `{docs:[…]}`; query params: `where=campo|op|valor`, `orderBy=campo[:desc]`, `limit=n` |
| create | POST `/api/v1/fs/{coll}` `{data}` | id aleatório |
| set | PUT `/api/v1/fs/{path}` `{data, merge?}` | overwrite ou merge profundo |
| patch | PATCH `/api/v1/fs/{path}` `{data}` | patch; chaves dot-path (`meta.x`); 404 se inexistente |
| delete | DELETE `/api/v1/fs/{path}` | remove |

- **Sentinels** do lado cliente serializam como `{"__del":1}`,
  `{"__inc":n}`, `{"__svts":1}` — resolvidos contra o valor atual
  **durante** o merge (delete campo, incremento atômico, timestamp do
  servidor), inclusive com `merge:true`.
- **where** suporta `==,!=,<,<=,>,>=,in,array-contains` (um predicado
  por request), `orderBy` asc/desc e `limit`.
- **Tempo real**: `GET /api/v1/fs/events?path={path}` — SSE
  (`text/event-stream`) com `{path}` a cada escrita que toca o
  path/coleção vigiada; keep-alive periódico.

### 5.1 Regras de acesso

Autenticação obrigatória em tudo (sem sessão → 401). Depois, por raiz:

| Raiz do path | Leitura | Escrita |
|---|---|---|
| `usuarios/{uid}/…` | dono ou admin | dono ou admin |
| `membros/{uid}` | **só admin** | dono ou admin |
| `planos/*`, `aulas/*` | qualquer autenticado | só admin |
| `erros/*` | só admin | create autenticado; demais admin |
| demais coleções | só admin | só admin |

Subcoleções herdam o path (ex.: `usuarios/{uid}/ideias/{id}/versoes/{v}`).

## 6. Arquivos (`/api/v1/files*`)

Uploads em `data/files/usuarios/{uid}/…` + metadados na tabela `files`.
Acesso: `usuarios/{uid}/…` → dono ou admin; qualquer outra raiz → 403.
Limite de upload `UPLOAD_MAX_MB` (default 512).

| Operação | HTTP |
|---|---|
| upload | PUT `/api/v1/files/{path}?name=&ct=` (body = bytes) → metadados + `url` `?download=1` |
| download | GET `/api/v1/files/{path}?download=1` ou `…/{path}/download` (bytes + content-type) |
| metadados | GET `/api/v1/files/{path}/meta` → `{name,fullPath,size,contentType,updated}` |
| listar | GET `/api/v1/files?prefix={path}` → `{items:[…filhos diretos], prefixes:[…subpastas]}` |
| apagar | DELETE `/api/v1/files/{path}` |

`/api/v1/files` e `/api/v1/files/` são equivalentes (ambas registradas;
o handler normaliza o prefixo sem depender da barra final).

## 7. Feed (`/api/feed`, `/feed`)

`GET ?url={rss}` — proxy RSS com cache em memória, limite de corpo
`FeedMaxBytes` (2MB), só esquemas `http/https`; URL inválida → 400.
Devolve o XML cru (alimenta a tela `/noticias`).

## 8. Frontend

### 8.1 Camada de dados (`web/js/data/`)

Biblioteca de acesso a dados que expõe à SPA operações de documentos
(get/set/patch/delete/list/query), observação em tempo real (via SSE),
auth (login/logout/cadastro/MFA/reset) e arquivos
(upload/download/list/meta/delete). Serializa sentinels e opções para o
formato REST da API.

### 8.2 Temas

A SPA é toda dirigida por variáveis CSS; temas são presets
`data-tema` em `index.html`, escolhidos em Configurações → Aparência e
persistidos por usuário (`config/app.tema`) e no `localStorage`.

Tema padrão: **"Claro" (Adminator)** — visual de painel admin claro,
paleta extraída do template de referência: fundo `#f0f4f8`, cards/sidebar
brancos, bordas `#e4e8ef`, primária `#2563eb` (hover `#1d4ed8`), texto
`#1e293b`/`#64748b`, sombras suaves. Também disponíveis: Azul (clássico
escuro), Escuro, Roxo, Tecnológico, YouTube.

### 8.3 Roteamento (`index.html`)

Rotas reais por caminho com `history.pushState`, deep links e refresh:

- Exatas: `/`, `/entrar`, `/cadastro`, `/radar`, `/visao-geral`,
  `/projetos`, `/videos-salvos`, `/aulas`, `/meus-canais`, `/canais`,
  `/explorar`, `/pesquisa`, `/biblioteca`, `/notas`, `/roteirista`,
  `/playbook`, `/comparar-30s`, `/noticias`, `/publicidade`,
  `/configuracoes`, `/ajuda`, `/admin`
- Prefixos: `/projetos/…`, `/canais/…`, `/admin/…`, `/radar/perfis/…`
- Públicas standalone: `/recuperar-senha/`, `/manual/`, `/js/…`
  (arquivos reais servidos do disco)

Qualquer rota fora dessa lista e sem arquivo correspondente → **404**.
Rotas privadas guardadas pela camada de auth com `returnTo` validado
(mesma origem, começa com `/`, sem `//`).

## 9. Configuração (env)

| Var | Default | Uso |
|---|---|---|
| `ADDR`/`PORT` | `:8080` | bind HTTP |
| `DATABASE_URL` | `data/vystudiocraft.db` | SQLite local ou DSN libSQL/Turso |
| `DATA_DIR` | `data` | uploads + db |
| `WEB_DIR` | `web` | estáticos |
| `ADMIN_EMAIL` | `admin@vystudiocraft.local` | define quem vira admin |
| `APP_ORIGIN` | `http://localhost:8080` | monta links (reset etc.) |
| `SESSION_DAYS` | `30` | TTL do cookie |
| `UPLOAD_MAX_MB` | `512` | limite de upload |
| `DEV_MODE` | `true` | auto-verifica e-mail, expõe `debugLink` |
| `SIGNUP_OPEN` | `false` | cadastro aberto p/ novos usuários (o 1º sempre é permitido p/ bootstrap) |

## 10. Seed

`internal/store/seed.go`: catálogo de planos (limites de uso), aulas,
registro de membros e dados de demonstração do admin (canais
monitorados, perfil de Radar com sinais/aceleração, projetos com
versões, ideias, notas). Executado pelo binário quando habilitado.

## 11. Testes

`cd backend && go test ./...` — 14 testes:

- `internal/httpapi/httpapi_test.go` (integração via `httptest`, DB
  SQLite em `t.TempDir`): auth/MFA/reset; CRUD de documentos com
  merge/sentinels/queries; matriz de regras de acesso; subcoleções;
  SSE; arquivos nos dois formatos de rota + isolamento entre usuários;
  rotas estáticas/404; feed; signup fechado + bootstrap do admin;
  endpoints de vendas inexistentes (404).
- `internal/authx/authx_test.go`: PBKDF2, TOTP, tokens.
- `internal/store/store_test.go`: migrations idempotentes, sessões,
  upsert/dedup de documentos.

## 12. Limitações conhecidas

- `where` limitado a um predicado + orderBy/limit.
- Notificações por e-mail (reset/verificação) sem SMTP — hoje log
  +`debugLink` em `DEV_MODE`.
- Convite de usuários: com `SIGNUP_OPEN` desligado só existe o admin;
  para múltiplos usuários ligue a flag (cadastro aberto) — não há fluxo
  de convite por link ainda.
- Turso remoto: DSN libSQL é aceito, mas só SQLite local foi validado.
- `DEV_MODE` deve ser desligado em produção.
- Telas internas legadas de cobrança ficam ocultas/inalcançáveis na SPA;
  remoção total do markup é refatoração futura.
