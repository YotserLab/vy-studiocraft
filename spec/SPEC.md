# Spec (gerado; não edite)

**Estúdio de produção para canais YouTube: radar de nichos, projetos Kanban, roteirista IA, comparador 30s, notícias RSS, biblioteca de mídia, publicidade e engine de templates Remotion.**  (porte G)

**Usuários:** visitante: não autenticado; acessa apenas login, cadastro (se aberto) e recuperação de senha; criador: usuário autenticado dono dos próprios dados sob usuarios/{uid}; admin: usuário com is_admin=true; lê/escreve tudo e acessa /admin e auditoria

**Escopo:** autenticação com MFA; documentos por usuário via API fs; upload de arquivos; radar de nichos; projetos com wizard e versões; roteirista e comparador via Gemini; notícias RSS; biblioteca de mídia; campanhas de publicidade; templates Remotion e renderização; painel admin com auditoria

**Fora de escopo:** pagamento/cobrança de assinatura; multi-tenant por organização; upload direto ao YouTube; notificações por e-mail/push; comentários/colaboração em tempo real multiusuário; app mobile nativo

## contas (CON) - Cadastro, login, sessões, MFA TOTP, reautenticação e recuperação de senha.
- **User**: id, email, pass_hash, display_name, email_verified, is_admin, mfa_secret
- **Session**: token, user_id, expires_at, reauth_at
- **PendingLogin**: ticket, user_id, purpose, expires_at
- **PasswordReset**: token, user_id, expires_at
- Estados User: nao_verificado -> verificado
- Estados PendingLogin: emitido -> consumido | expirado
- `CON-R01` Signup só é permitido se SIGNUP_OPEN=true ou se não existir nenhum usuário (bootstrap)
- `CON-R02` Cadastro exige e-mail não vazio e senha com mínimo de 6 caracteres
- `CON-R03` E-mail é normalizado (lowercase, trim) e único; duplicado retorna 409
- `CON-R04` Recebe is_admin o bootstrap (1º usuário) ou quem se cadastra com o e-mail de ADMIN_EMAIL
- `CON-R05` Login retorna 401 'Credenciais inválidas' para e-mail inexistente ou senha errada, sem distinguir
- `CON-R08` Sessão dura SESSION_DAYS dias (padrão 30); aceita cookie vysc_sess, Bearer ou ?token=
- `CON-R10` Reset de senha cria token de 1h e responde mensagem genérica mesmo se o e-mail não existir
- `CON-R11` Confirmar reset consome o token, atualiza a senha e apaga todas as sessões do usuário
- `CON-R12` Logout apaga a sessão atual no banco e expira o cookie vysc_sess
- `CON-R13` verify-email marca email_verified=true; link de debug só aparece com DEV_MODE=true
- `CON-R14` Cookie de sessão usa Secure apenas em HTTPS e SameSite=None em HTTPS, Lax em HTTP
- `CON-R15` Senha é persistida como PBKDF2-SHA256, 100k iterações, formato pbkdf2_sha256$iter$salt$hash
- `CON-R17` A identidade vem da sessão validada; uid enviado pelo cliente é ignorado
- `CON-R18` Cada usuário tem doc membros/{uid} com papel, plano e status gerenciados pelo admin

## mfa (MFA) - Autenticação de dois fatores TOTP: enrollment, tickets de uso único e reautenticação.
- **TotpSecret**: secret, owner
- **PendingLogin**: ticket, user_id, purpose, expires_at
- Estados PendingLogin: emitido -> consumido | expirado
- `MFA-R01` Com MFA ativo, login retorna mfaRequired e ticket de 5 minutos em vez de criar sessão
- `MFA-R02` Ticket MFA é de uso único, expira em 5 minutos e tem purpose 'login' ou 'reauth'
- `MFA-R03` mfa/start, mfa/enroll e mfa/unenroll exigem reautenticação feita nos últimos 10 minutos
- `MFA-R04` Código TOTP errado retorna 401 sem consumir o ticket; só código válido o consome
- `MFA-R05` mfa/enroll só grava o secret no usuário após validar um código TOTP correto
- `MFA-R06` mfa/start emite secret TOTP novo sem persistir; persistência ocorre só no enroll
- `MFA-R07` mfa/reauth com ticket e código válidos atualiza o reauth_at da sessão

## plataforma (PLA) - Modelo de dados por path: coleções, documentos, permissões, merge, sentinels e eventos.
- **Doc**: path, coll, parent, uid, data, created_at, updated_at
- **FileMeta**: path, uid, name, content_type, size, disk
- **AuditEvent**: id, user_id, action, detail, created_at
- `PLA-R02` Path de documento alterna coleção/doc; segmentos ímpares endereçam coleções
- `PLA-R03` Admin lê e escreve qualquer documento, coleção e arquivo do sistema
- `PLA-R04` Não-admin só lê/escreve docs sob usuarios/{seu-uid}/; planos e aulas são leitura autenticada
- `PLA-R05` Coleção erros aceita criação por qualquer autenticado, mas não leitura nem escrita posterior
- `PLA-R06` Documento membros/{uid} só pode ser escrito pelo próprio usuário dono do uid
- `PLA-R11` Listagem de coleção aceita where campo|op|valor, orderBy campo[:desc] e limit>0
- `PLA-R16` setDoc com merge:true faz merge profundo; sem merge o documento é substituído
- `PLA-R17` Sentinels: __del apaga o campo, __svts grava timestamp do servidor, __inc soma ao valor atual
- `PLA-R18` GET em documento inexistente retorna o doc com exists:false e HTTP 200
- `PLA-R19` IDs de documentos criados são tokens aleatórios gerados pelo backend (authx.Token(8))
- `PLA-R20` Permissões são avaliadas pela raiz do path; subcoleções herdam a regra do nível superior
- `PLA-R21` POST, PUT, PATCH e DELETE em docs publicam evento SSE com o path alterado

## transporte (TRN) - Camada HTTP da API: sessão, upload, proxy RSS, SSE, fallback SPA e endpoints públicos.
- **Request**: method, path, sessao
- `TRN-R01` Toda rota /api/v1/* de dados exige sessão válida; sem sessão retorna 401
- `TRN-R02` Arquivos existem apenas sob usuarios/{uid}/; acesso ao próprio uid ou admin
- `TRN-R03` Upload excedente a UPLOAD_MAX_MB (padrão 512MB) retorna 413
- `TRN-R04` GET /api/feed faz proxy de URL http(s) arbitrária: timeout 8s, corpo máx 2MB, cache 5min
- `TRN-R05` SSE /api/v1/fs/events exige permissão de leitura no path e envia keepalive a cada 25s
- `TRN-R06` Sessão pode vir do cookie vysc_sess, header Bearer ou query ?token (usado pelo SSE)
- `TRN-R07` Rota /api/* desconhecida retorna 404 JSON; rotas SPA desconhecidas servem index.html com 404
- `TRN-R08` GET /api/feed e /feed exigem sessão válida; sem sessão retorna 401
- `TRN-R09` Proxy /api/render, /api/rendered e /api/gemini/* exigem sessão; anônimo retorna 401
- `TRN-R10` Mídia /rendered/, /thumbnails/, /previews/, /rendercomp-thumbs/ é pública (catálogo /templates, P11)
- `TRN-R11` Mídia /cache/ exige sessão; anônimo retorna 401

## navegacao (NAV) - Rotas da SPA, guards de sessão, deep links, returnTo e fallback 404.
- **Rota**: path, view, privada
- `NAV-R01` Rota privada sem sessão redireciona para /entrar?returnTo=<path atual>
- `NAV-R02` returnTo só é aceito se começa com '/' e não contém '//' nem '://' (anti open redirect)
- `NAV-R03` Navegação interna usa history.pushState; voltar/avançar sincronizam tela e URL
- `NAV-R04` '/' exibe LandingView pública; usuário logado é redirecionado para /visao-geral
- `NAV-R05` /templates, /templates/ai-studio e /templates/motion-library são públicas (sem PrivateRoute)
- `NAV-R06` Rota desconhecida renderiza NotFoundView; backend serve index.html com status 404 (TRN-R07)
- `NAV-R07` Deep links /projetos/{id}, /canais/{id}, /radar/perfis/{id} e /templates/{id} abrem o recurso direto
- `NAV-R08` /admin/{tab} sincroniza a tab do painel com a URL (membros, aulas, planos, erros)
- `NAV-R09` Troca de rota lê query string; /pesquisa?q=<termo> sincroniza o campo de busca

## radar (RAD) - Perfis de monitoramento de nichos/temas com sinais, tópicos quentes e concorrência.
- **RadarPerfil**: nome, nicho, formato, aceleracao, taxaOutliers, viewsMedias7d, concorrencia, sinais, topicosQuentes, ultimoSinalAt
- `RAD-R01` Perfil do radar exige nome não vazio; nicho em branco assume 'Geral'
- `RAD-R02` Ao criar, taxaOutliers assume 2.0 e viewsMedias7d assume 25000 se não informados
- `RAD-R03` Todo perfil novo nasce com concorrencia 'Média'
- `RAD-R04` sinais recebe o sinal inicial informado ou o texto padrão de registro manual
- `RAD-R05` A lista de perfis se atualiza em tempo real via SSE na coleção radar_perfis
- `RAD-R06` Perfis ficam em usuarios/{uid}/radar_perfis — isolados por usuário (PLA-R04)
- `RAD-R07` Normalização de clusters agrupa sinais e tópicos chamando POST /api/v1/ai/action
- `RAD-R08` Busca filtra perfis por nome ou nicho contendo o termo, sem diferenciar maiúsculas
- `RAD-R09` Perfil pode virar origem de projeto via origemRadarId no wizard (ver PRJ-R07)

## projetos (PRJ) - Projetos de vídeo em Kanban com wizard de 4 etapas, checklist e versionamento.
- **Projeto**: titulo, canalNome, estagio, formato, prioridade, dataPublicacaoAlvo, ctrAlvo, conceitoThumbnail, ganchoResumo, origemRadarId, checklist, versaoAtual
- **ChecklistItem**: id, texto, feito
- **Versao**: versao, autor, resumoMudanca, conteudo
- Estados Projeto: ideacao -> roteiro -> gravacao -> edicao -> publicado
- `PRJ-R01` Projeto exige titulo não vazio; canalNome em branco assume 'Canal Principal'
- `PRJ-R02` Wizard de criação tem 4 etapas: Canal & Formato, Packaging & Gancho, Pipeline & Checklist, Revisão
- `PRJ-R03` ctrAlvo assume 8.0 quando vazio ou não numérico
- `PRJ-R04` Todo projeto nasce com versaoAtual=1 e doc versoes/v1 com autor e resumo da criação
- `PRJ-R05` Itens do checklist inicial viram chk_N sequenciais com feito=false
- `PRJ-R06` Projetos ficam em usuarios/{uid}/projetos — isolados por usuário (PLA-R04)
- `PRJ-R07` origemRadarId opcional vincula o projeto a um perfil do radar
- `PRJ-R08` estagio pertence a {ideacao, roteiro, gravacao, edicao, publicado} e muda via patch no Kanban
- `PRJ-R09` Exclusão de projeto é física (DELETE do documento), sem lixeira

## roteirista (ROT) - Geração de roteiros via Gemini com perfis de redator, capítulos e salvamento.
- **Roteiro**: title, summary, formato, canal, categoria, chapters, geradoEm
- **WriterProfile**: nome, tom, estilo, audiencia, prompt
- `ROT-R01` Geração exige topic, channelName, niche, audience, format, tone, durationMinutes e hookStyle
- `ROT-R02` O campo format aceita apenas 'long' ou 'shorts'
- `ROT-R03` Roteiro gerado abre com o capítulo de gancho '00 — Gancho (00:00 – 00:30)'
- `ROT-R04` Perfis de redator ficam em usuarios/{uid}/config/roteirista_perfis
- `ROT-R05` Roteiros salvos ficam em usuarios/{uid}/roteiros — isolados por usuário
- `ROT-R06` Geração usa POST /api/v1/ai/script no backend Go, que chama Gemini (gemini-2.5-flash)
- `ROT-R07` profilePrompt e knowledgeBase opcionais personalizam a saída do modelo
- `ROT-R08` partsCount e ppm controlam divisão em partes e ritmo (palavras por minuto)

## comparador (CMP) - Comparação A/B de ganchos de 30 segundos via Gemini, com resultado salvo.
- **Comparacao**: titleA, hookA, visualCutsA, titleB, hookB, visualCutsB, niche, winner, edge, analise
- `CMP-R01` Comparação exige titleA, hookA, visualCutsA, titleB, hookB, visualCutsB e niche
- `CMP-R02` Resultado declara winner e edge, cada um ∈ {A, B, empate}
- `CMP-R03` Comparações salvas ficam em usuarios/{uid}/comparacoes — isoladas por usuário
- `CMP-R04` Comparação usa POST /api/v1/ai/compare-30s no backend Go, que chama Gemini (gemini-2.5-flash)

## noticias (NOT) - Leitura de feeds RSS/Atom, tradução de artigos via IA e conversão em pautas.
- **FeedItem**: title, link, publishedAt, summary
- **Nota**: titulo, texto, origem
- `NOT-R01` Feed é buscado via GET /api/feed?url= no proxy do backend, não direto pelo cliente (TRN-R04)
- `NOT-R02` Parser aceita itens RSS <item> e entradas Atom <entry>; título ausente vira 'Sem título'
- `NOT-R03` Resumo vem de description ou content:encoded do item do feed
- `NOT-R04` Tradução de artigo usa POST /api/v1/ai/action 'translate:article'
- `NOT-R05` Converter notícia em pauta cria doc em usuarios/{uid}/ideias com título 'Pauta Notícia: <título>' (IDE-R03)
- `NOT-R06` Feed maior que 2MB é rejeitado com 413 e URL sem http/https com 400 (TRN-R04)

## midia (MID) - Biblioteca de mídia: upload/listagem/download/exclusão de arquivos e vídeos salvos de referência.
- **FileMeta**: path, uid, name, content_type, size, disk, created_at
- **VideoSalvo**: titulo, tituloPt, canal, url, duracao, motivoSalvo, categoria
- `MID-R01` Upload é PUT /api/v1/files/{path} somente sob usuarios/{uid}/ (TRN-R02)
- `MID-R02` content_type usa ?ct=, depois Content-Type do request, senão 'application/octet-stream'
- `MID-R03` GET /api/v1/files/{path} retorna metadados; ?download=1 ou sufixo /download serve o binário
- `MID-R04` DELETE /api/v1/files/{path} remove o metadado e apaga o arquivo do disco
- `MID-R05` GET /api/v1/files?prefix= lista items e prefixes; prefixo vazio assume usuarios/{uid}
- `MID-R06` Vídeo salvo exige titulo não vazio; canal em branco assume 'Referência'
- `MID-R07` Tradução em lote grava tituloPt nos vídeos salvos via ai.action 'translate:titles'

## biblioteca (BIB) - Navegador de arquivos do usuário: pastas, upload, download e organização da mídia.
- **Pasta**: prefix
- **FileItem**: path, name, contentType, size
- `BIB-R01` Biblioteca navega o prefixo usuarios/{uid} via /api/v1/files?prefix= (MID-R05)
- `BIB-R02` Subpastas são criadas implicitamente pelo path do upload
- `BIB-R03` Upload na pasta atual usa PUT /api/v1/files/{prefix}/{nome} (MID-R01)
- `BIB-R04` Listagem separa arquivos (items) de subpastas (prefixes)

## canais (CAN) - Canais próprios e de referência com métricas e análise estratégica via IA.
- **Canal**: nome, handle, nicho, tipo, inscritos, views30d, ctrMedio, retencaoMedia, frequenciaSemanal, descricao, analiseIa
- `CAN-R01` Canal tem tipo 'proprio' ou 'referencia'; /meus-canais filtra tipo diferente de 'referencia'
- `CAN-R02` Canais ficam em usuarios/{uid}/canais — isolados por usuário (PLA-R04)
- `CAN-R03` Métricas do canal: inscritos, views30d, ctrMedio, retencaoMedia e frequenciaSemanal
- `CAN-R04` Análise estratégica usa POST /api/v1/ai/action 'channel:analyze' e grava o resultado em analiseIa
- `CAN-R05` /canais lista todos os canais do usuário; /canais/{id} abre o detalhe (NAV-R07)

## ideias (IDE) - Banco de ideias de vídeo alimentado por notícias, assistente IA e registro manual (/explorar).
- **Ideia**: titulo, nicho, potencial, origem, notas
- `IDE-R01` Ideia registra titulo, nicho, potencial, origem e notas
- `IDE-R02` Ideias ficam em usuarios/{uid}/ideias — isoladas por usuário (PLA-R04)
- `IDE-R03` Notícia convertida vira ideia com titulo 'Pauta Notícia: <título>', origem 'Notícias RSS', potencial 'alto'
- `IDE-R04` O assistente IA pode criar ideias via ação da conversa (AssistantIdeaAction)
- `IDE-R05` Tela /explorar é a visão de ideias do usuário

## notas (NTA) - Notas livres do estúdio com categoria e marcação de fixada.
- **Nota**: titulo, categoria, conteudo, fixada
- `NTA-R01` Nota exige titulo não vazio para ser salva
- `NTA-R02` Nota nasce com fixada=false
- `NTA-R03` Notas ficam em usuarios/{uid}/notas — isoladas por usuário (PLA-R04)
- `NTA-R04` Exclusão de nota é física (DELETE do documento), sem lixeira

## playbook (PLY) - Playbook editorial: regras de retenção extraídas de comparações 30s e organizadas por categoria.
- **Regra**: categoria, titulo, regra, impacto
- `PLY-R01` Cada linha '[categoria] regra' do checklist de uma comparação 30s vira um doc de playbook
- `PLY-R02` Linha sem prefixo '[categoria]' é classificada como 'retencao'
- `PLY-R03` Regra salva guarda titulo '<CATEGORIA> — Comparativo 30s (<nicho>)' e impacto citando os lados A e B
- `PLY-R04` Regras ficam em usuarios/{uid}/playbook — isoladas por usuário (PLA-R04)

## pesquisa (PES) - Busca global client-side sobre projetos, canais, notas e perfis do radar (/pesquisa).
- **Resultado**: tipo, titulo, subtitulo, to
- `PES-R01` Busca cobre 4 coleções: projetos, canais, notas e radar_perfis do usuário
- `PES-R02` Cada resultado leva tipo (Projeto|Canal|Nota|Radar), titulo, subtitulo e link para a rota da entidade
- `PES-R03` Filtro é case-insensitive e casa titulo, subtitulo ou tipo
- `PES-R04` Query string ?q= sincroniza o termo da busca com a URL (NAV-R09)
- `PES-R05` Busca vazia lista todos os itens das 4 coleções

## publicidade (PUB) - Registro de campanhas de publicidade e patrocínio por canal, com status de negociação.
- **Campanha**: marca, canalNome, status, formato, valorAcordado, prazoEntrega, entregaveis
- `PUB-R01` Campanha exige marca não vazia para ser registrada
- `PUB-R02` Toda campanha nova nasce com status 'negociacao'
- `PUB-R03` valorAcordado em branco assume 'A definir'
- `PUB-R04` Status da campanha é atualizado via PATCH no documento
- `PUB-R05` Campanhas ficam em usuarios/{uid}/publicidade — isoladas por usuário (PLA-R04)
- `PUB-R06` Lista vazia exibe estado 'Nenhuma campanha de publicidade cadastrada'

## configuracoes (CFG) - Preferências do usuário (tema visual) e configuração de runtime da aplicação.
- **PrefDoc**: tema
- **RuntimeConfig**: campos expostos por /api/v1/auth/config
- `CFG-R01` Tema do usuário é gravado em usuarios/{uid}/config/app no campo tema
- `CFG-R02` Tema só é aplicado se existir no registro TEMAS; valor inválido cai para 'claro'
- `CFG-R03` Sem login ou sem doc, o tema vem do localStorage 'vysc_tema' com fallback 'claro'
- `CFG-R04` Ao logar, o tema do doc remoto sobrescreve o localStorage
- `CFG-R05` Config de runtime vem de GET /api/v1/auth/config — público; adminEmailHint só em DEV_MODE

## dashboard (DSH) - Visão geral (/visao-geral): agregações de canais, projetos, publicidade e radar.
- **Overview**: canais, projetos, publicidade, radar_perfis
- `DSH-R01` Visão geral agrega as coleções canais, projetos, publicidade e radar_perfis do usuário
- `DSH-R02` meusCanais exclui canais com tipo 'referencia' das somas
- `DSH-R03` totalInscritos e totalViews30d somam os campos dos canais próprios
- `DSH-R04` projetosAtivos são projetos com estagio diferente de 'publicado'
- `DSH-R05` publisPendentes são campanhas com status diferente de 'concluida'
- `DSH-R06` A visão geral abre o wizard de criação de projeto (PRJ-R02)

## render (REN) - Serviço de renderização Remotion + Gemini: templates parametrizados viram mp4 e mídia.
- **RenderJob**: templateId, compositionId, props, resolution, codec
- **RenderedVideo**: filename, videoUrl, sizeBytes, createdAt
- **TemplateFamily**: id, registry, componente
- Estados RenderJob: recebido -> renderizando -> concluido | falho
- `REN-R01` POST /api/render aceita templateId ou compositionId, props, resolution e codec (default h264)
- `REN-R02` resolution '720p' usa --scale=0.6666666666666666, '4K' usa --scale=2, demais sem escala
- `REN-R03` compositionId desconhecido cai em fallback: 'Shorts' -> TornDocumentClipShorts, senão StepProcessInfographic
- `REN-R04` Saída é render_<compositionId>_<timestamp>.mp4 em MEDIA_DIR/rendered, servida em /rendered/
- `REN-R05` Se o arquivo de saída não for gerado, retorna 500 com o stderr do render
- `REN-R06` GET /api/rendered lista os mp4 ordenados por createdAt decrescente
- `REN-R07` /api/gemini/generate-script exige topic e produz JSON de cenas com gemini-2.5-flash
- `REN-R08` Backend Go proxifica /api/render, /api/rendered e /api/gemini/* para RENDER_SERVICE_URL
- `REN-R09` Go serve mídia de MEDIA_DIR nos prefixos /rendered/ /thumbnails/ /previews/ /rendercomp-thumbs/ /cache/
- `REN-R10` Render invoca bunx @remotion/cli com timeout de 600s e concurrency=8
- `REN-R11` Biblioteca tem ~100 famílias de templates em src/remotion-templates/remotion/families

## Não funcionais
- `NF01` Backend Go serve API + SPA num único binário; banco SQLite local via DATABASE_URL
- `NF02` Feed RSS: timeout 8s, corpo máx 2MB, cache em memória por 5min
- `NF03` Upload de arquivo limitado a UPLOAD_MAX_MB MB (padrão 512)
- `NF04` Render Remotion executado por serviço separado (:8090), timeout 600s, saída mp4 em MEDIA_DIR/rendered
- `NF05` SSE keepalive a cada 25s; eventos de mudança em docs propagados por path
- `NF06` Sessão via cookie HttpOnly + Bearer; token de sessão de 32 bytes, SESSION_DAYS dias (padrão 30)
- `NF07` Backend Go testado com `go test ./...` em backend-go antes de cada entrega
- `NF08` Consultas ao banco usam SQL parametrizado; respostas da API são JSON
- `NF09` Erros de API respondem JSON {error: mensagem} com código HTTP semântico

## Premissas (assumidas, não confirmadas)
- `P01` Endpoints de IA exigem GEMINI_API_KEY no backend; sem a chave respondem 503
- `P02` Instância single-user ou poucos usuários (SIGNUP_OPEN=false por padrão; primeiro cadastro vira admin)
- `P03` LGPD aplicável apenas a e-mail/nome de conta; app não coleta dados sensíveis nem é voltado a menores
- `P04` Gemini chamado via @google/genai com GEMINI_API_KEY de ambiente; modelo gemini-2.5-flash
- `P05` Datas persistidas como epoch ms UTC; exibição formatada no cliente
- `P06` Migrações SQL embutidas rodam no boot do binário Go (migrations/ embed)
- `P07` FKs com ON DELETE CASCADE ligam sessões, tickets MFA e resets ao usuário
- `P08` UI em pt-BR sem i18n; formatos localizados no cliente
- `P09` DEV_MODE/USE_MOCK_DATA semeia dados demo no boot (seed.go), incluindo admin
- `P10` Índices em docs(coll), docs(parent), docs(uid) e files(uid) para listagens
- `P11` Pastas públicas de mídia misturam assets do catálogo e renders de usuário; separação por uid fica como dívida

---
Status do portão: OK
