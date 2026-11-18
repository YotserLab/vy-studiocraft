package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// actionGeminiBaseURL é a base da API REST do Gemini (sobrescrita em testes).
var actionGeminiBaseURL = "https://generativelanguage.googleapis.com"

const (
	actionGeminiModel   = "gemini-2.5-flash"
	actionGeminiTimeout = 60 * time.Second
)

// ---------- Gemini REST ------------------------------------------------------

type actionGeminiPart struct {
	Text string `json:"text"`
}

type actionGeminiContent struct {
	Parts []actionGeminiPart `json:"parts"`
}

type actionGeminiGenerationConfig struct {
	ResponseMIMEType string `json:"responseMimeType,omitempty"`
}

type actionGeminiRequest struct {
	Contents         []actionGeminiContent         `json:"contents"`
	GenerationConfig *actionGeminiGenerationConfig `json:"generationConfig,omitempty"`
}

type actionGeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// callActionGemini chama POST /v1beta/models/<model>:generateContent?key=<key>
// e devolve o texto concatenado dos parts do primeiro candidato.
func callActionGemini(ctx context.Context, apiKey, prompt string, jsonMode bool) (string, error) {
	reqBody := actionGeminiRequest{
		Contents: []actionGeminiContent{{Parts: []actionGeminiPart{{Text: prompt}}}},
	}
	if jsonMode {
		reqBody.GenerationConfig = &actionGeminiGenerationConfig{ResponseMIMEType: "application/json"}
	}
	buf, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	endpoint := fmt.Sprintf("%s/v1beta/models/%s:generateContent?key=%s",
		strings.TrimRight(actionGeminiBaseURL, "/"), actionGeminiModel, url.QueryEscape(apiKey))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(buf))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: actionGeminiTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini http %d", resp.StatusCode)
	}
	var out actionGeminiResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", err
	}
	if out.Error != nil && out.Error.Message != "" {
		return "", errors.New(out.Error.Message)
	}
	var sb strings.Builder
	for _, cand := range out.Candidates {
		for _, part := range cand.Content.Parts {
			sb.WriteString(part.Text)
		}
	}
	text := strings.TrimSpace(sb.String())
	if text == "" {
		return "", errors.New("resposta vazia do Gemini")
	}
	return text, nil
}

// ---------- Helpers de payload/JSON ------------------------------------------

func aiActionStr(p map[string]any, key string) string {
	if v, ok := p[key].(string); ok {
		return strings.TrimSpace(v)
	}
	return ""
}

func aiActionJSON(v any) string {
	if v == nil {
		return "{}"
	}
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return "{}"
	}
	return string(b)
}

// balancedJSONEnd devolve o índice (exclusivo) do fim do primeiro objeto/array
// JSON balanceado iniciado em s[start] ('{' ou '['), ou -1 se truncado.
func balancedJSONEnd(s string, start int) int {
	depth := 0
	inStr := false
	esc := false
	for i := start; i < len(s); i++ {
		c := s[i]
		if inStr {
			if esc {
				esc = false
				continue
			}
			if c == '\\' {
				esc = true
				continue
			}
			if c == '"' {
				inStr = false
			}
			continue
		}
		switch c {
		case '"':
			inStr = true
		case '{', '[':
			depth++
		case '}', ']':
			depth--
			if depth == 0 {
				return i + 1
			}
		}
	}
	return -1
}

// parseAIActionJSON extrai o primeiro valor JSON da resposta do modelo,
// tolerando code fences e texto ao redor.
func parseAIActionJSON(raw string) (any, error) {
	clean := strings.TrimSpace(raw)
	clean = strings.TrimPrefix(clean, "```json")
	clean = strings.TrimPrefix(clean, "```")
	clean = strings.TrimSuffix(clean, "```")
	clean = strings.TrimSpace(clean)
	var v any
	if err := json.Unmarshal([]byte(clean), &v); err == nil {
		return v, nil
	}
	start := strings.IndexAny(clean, "{[")
	if start < 0 {
		return nil, errors.New("sem JSON na resposta da IA")
	}
	end := balancedJSONEnd(clean, start)
	if end < 0 {
		return nil, errors.New("JSON truncado na resposta da IA")
	}
	if err := json.Unmarshal([]byte(clean[start:end]), &v); err != nil {
		return nil, err
	}
	return v, nil
}

// ---------- Prompts por ação -------------------------------------------------

// buildAIActionPrompt monta o prompt Gemini para cada action do frontend.
// Retorna (prompt, jsonMode, conhecida).
func buildAIActionPrompt(action string, p map[string]any) (string, bool, bool) {
	project := aiActionJSON(p["project"])

	switch action {
	// CAN-R04 — Análise estratégica do canal (ChannelsViews → canal.analiseIa)
	case "channel:analyze":
		return fmt.Sprintf(`Você é um estrategista sênior de canais de YouTube. Analise os dados do canal abaixo e produza uma ANÁLISE ESTRATÉGICA em markdown (PT-BR), direta e acionável.

Dados do canal (JSON):
%s

Estruture a resposta com seções "## Posicionamento", "## Pontos fortes", "## Lacunas e riscos", "## Plano de 90 dias" (bullets objetivos). Não use o título de nível 1 (#).`,
			aiActionJSON(p["channel"])), false, true

	// Projeto — briefing & packaging
	case "project:analyze_idea":
		return fmt.Sprintf(`Você é estrategista de conteúdo YouTube. Analise a ideia de vídeo abaixo.

Projeto (JSON):
%s

Responda em markdown (PT-BR) com exatamente estas seções "## Ângulo recomendado", "## Público e por que interessa", "## Potencial", "## Riscos", "## Próximos passos".`,
			project), false, true

	case "project:titles_20":
		return fmt.Sprintf(`Você é especialista em packaging de vídeos do YouTube. Gere 20 títulos alternativos para o projeto abaixo, em PT-BR, variando gatilhos (curiosidade, contraste, especificidade, urgência).

Projeto (JSON):
%s

Responda APENAS uma lista numerada de 1 a 20, um título por linha, sem seções nem comentários.`,
			project), false, true

	case "project:hooks_5":
		return fmt.Sprintf(`Você é roteirista de retenção para YouTube. Escreva 5 ganchos (hooks) diferentes para os primeiros 30 segundos do vídeo abaixo, em PT-BR.

Projeto (JSON):
%s

Responda em markdown com as seções "## Hook 1 — <estilo>", "## Hook 2 — <estilo>", "## Hook 3 — <estilo>", "## Hook 4 — <estilo>", "## Hook 5 — <estilo>"; sob cada título, escreva a narração do gancho.`,
			project), false, true

	case "project:desc_tags":
		return fmt.Sprintf(`Você é especialista em SEO do YouTube. Para o projeto abaixo, escreva descrição, palavras-chave e tags em PT-BR.

Projeto (JSON):
%s

Responda em markdown com exatamente as seções "## Descrição" (texto pronto para a descrição do vídeo), "## Palavras-chave" (linha única separada por vírgulas) e "## Tags" (linha única de tags separadas por vírgulas, até 500 caracteres).`,
			project), false, true

	// Projeto — roteiro
	case "project:script_retention":
		return fmt.Sprintf(`Você é editor de retenção. Analise o roteiro por capítulos abaixo e aponte riscos de queda de retenção e correções concretas.

Projeto (JSON):
%s

Responda em markdown (PT-BR): um bullet por achado, começando pelo trecho/capítulo afetado seguido da correção sugerida.`,
			project), false, true

	case "project:script_chapters":
		return fmt.Sprintf(`Você é roteirista de YouTube (~145 palavras por minuto). Reorganize o material do projeto abaixo em uma estrutura de capítulos com narração completa em PT-BR.

Projeto (JSON):
%s

Responda APENAS com seções markdown "## <título do capítulo>" seguidas do texto de narração de cada capítulo.`,
			project), false, true

	case "project:script_broll":
		return fmt.Sprintf(`Você é diretor de edição. Para cada parágrafo/capítulo do roteiro abaixo, sugira o B-roll ideal (o que mostrar na tela).

Projeto (JSON):
%s

Responda em markdown (PT-BR): um bullet por trecho, no formato "- <trecho curto>: <sugestão de B-roll>".`,
			project), false, true

	case "project:script_cta":
		return fmt.Sprintf(`Você é roteirista de YouTube. Escreva 3 opções de CTA final (call to action) para o vídeo abaixo, em PT-BR, com estilos distintos.

Projeto (JSON):
%s

Responda em markdown com as seções "## Opção 1 — <estilo>", "## Opção 2 — <estilo>", "## Opção 3 — <estilo>", cada uma contendo o texto do CTA.`,
			project), false, true

	case "project:script_revise":
		return fmt.Sprintf(`Você é revisor de roteiros de YouTube. Reescreva os capítulos do roteiro abaixo melhorando clareza, ritmo (~145 ppm) e naturalidade em PT-BR, sem mudar o conteúdo factual.

Projeto (JSON):
%s

Responda em markdown: uma seção "## <título do capítulo>" para cada capítulo revisado e, ao final, uma seção "## O que mudei" resumindo as alterações.`,
			project), false, true

	case "project:suno_chapter":
		return fmt.Sprintf(`Você é compositor que escreve prompts para o Suno (gerador de música). Crie um prompt de trilha sonora para o capítulo abaixo do vídeo "%s" do canal "%s".

Capítulo: %s
Trecho da narração:
%s

Responda em markdown (PT-BR) com as seções "## Prompt Suno" (prompt em inglês com estilo, instrumentos, BPM e mood) e "## Letra/observações" (opcional).`,
			aiActionStr(p, "titulo"), aiActionStr(p, "canal"), aiActionStr(p, "capituloTitulo"), aiActionStr(p, "trecho")), false, true

	// Projeto — pesquisa
	case "project:research_summary":
		return fmt.Sprintf(`Você é pesquisador. Resuma o que cada fonte do projeto abaixo comprova ou sustenta no roteiro.

Projeto (JSON):
%s

Responda em markdown (PT-BR): um bullet por fonte ou achado.`,
			project), false, true

	case "project:research_gaps":
		return fmt.Sprintf(`Você é pesquisador cético. Identifique lacunas de pesquisa do projeto abaixo: afirmações sem fonte, dados faltantes, ângulos não checados.

Projeto (JSON):
%s

Responda em markdown (PT-BR): um bullet por lacuna, direto e específico.`,
			project), false, true

	case "project:research_check":
		return fmt.Sprintf(`Você é fact-checker. Confronte o roteiro do projeto abaixo com as fontes registradas e sinalize o que está sustentado, frágil ou incorreto.

Projeto (JSON):
%s

Responda em markdown (PT-BR): um bullet por verificação, começando com a afirmação checada.`,
			project), false, true

	// Projeto — thumbnail
	case "project:thumb_concepts":
		return fmt.Sprintf(`Você é designer de thumbnails de YouTube focado em CTR. Proponha 5 conceitos visuais distintos para o vídeo abaixo.

Projeto (JSON):
%s

Responda em markdown com as seções "## Conceito 1 — <nome>", "## Conceito 2 — <nome>", "## Conceito 3 — <nome>", "## Conceito 4 — <nome>", "## Conceito 5 — <nome>"; sob cada uma descreva composição, emoção, contraste e texto na capa.`,
			project), false, true

	case "project:thumb_texts":
		return fmt.Sprintf(`Você é copywriter de thumbnails. Gere 15 textos curtos (2 a 5 palavras) para a capa do vídeo abaixo, em PT-BR.

Projeto (JSON):
%s

Responda APENAS uma lista numerada de 1 a 15, um texto por linha.`,
			project), false, true

	case "project:thumb_prompts":
		return fmt.Sprintf(`Você escreve prompts para geradores de imagem. Crie 5 prompts (em inglês) para gerar a thumbnail do vídeo abaixo.

Projeto (JSON):
%s

Responda em markdown com as seções "## Prompt 1 — <tema>", "## Prompt 2 — <tema>", "## Prompt 3 — <tema>", "## Prompt 4 — <tema>", "## Prompt 5 — <tema>", cada uma contendo o prompt completo.`,
			project), false, true

	// Projeto — pós-publicação
	case "project:post_analysis":
		return fmt.Sprintf(`Você é analista de performance de YouTube. Analise as métricas pós-publicação do projeto abaixo (incluindo observações da curva de retenção).

Projeto (JSON):
%s

Responda em markdown (PT-BR) com exatamente as seções "## O que funcionou", "## O que não funcionou", "## O que repetir" e "## O que evitar".`,
			project), false, true

	case "project:post_playbook":
		return fmt.Sprintf(`Você é estrategista que transforma resultados em regras reutilizáveis. Das métricas e lições do projeto abaixo, extraia regras para o playbook do canal.

Projeto (JSON):
%s

Responda APENAS uma lista markdown em que cada item segue o formato "- [categoria] regra acionável", usando categorias em minúsculo como titulo, hook, roteiro, thumbnail, retencao, publicacao.`,
			project), false, true

	case "project:post_next_video":
		return fmt.Sprintf(`Você é estrategista de canal YouTube. Com base no desempenho e no tema do projeto abaixo, proponha ideias para o próximo vídeo (sequências, desdobramentos, respostas a dúvidas).

Projeto (JSON):
%s

Responda em markdown com a seção "## Ideias para o próximo vídeo" contendo uma lista de ideias, uma por item.`,
			project), false, true

	case "project:edit_plan_json":
		return fmt.Sprintf(`Você é editor de vídeo. Transforme os capítulos do roteiro abaixo em um plano de edição (decupagem) com ritmo de ~145 palavras por minuto.

Projeto (JSON):
%s

Responda APENAS um array JSON de objetos com os campos "tempo" (ex.: "0:00-0:25"), "narracao" (trecho narrado), "visual" (imagem/B-roll), "sfx" (efeitos sonoros ou "") e "musica" (trilha ou "").`,
			project), true, true

	case "project:comment_reply":
		extra := ""
		if e := aiActionStr(p, "extraInstructions"); e != "" {
			extra = fmt.Sprintf("\nInstruções extras do criador: %s", e)
		}
		return fmt.Sprintf(`Você é o criador do canal respondendo um comentário no vídeo "%s".

Comentário de %s:
"%s"%s

Escreva APENAS a resposta a ser publicada — curta, humana, agradecida e em PT-BR, sem aspas nem prefixos.`,
			aiActionStr(p, "videoTitle"), aiActionStr(p, "authorDisplayName"), aiActionStr(p, "textDisplay"), extra), false, true

	// RAD-R07 — normalização dos nomes de clusters do Radar
	case "radar:cluster_names":
		return fmt.Sprintf(`Você organiza sinais de tendências de nichos do YouTube. Para cada grupo abaixo (lista de termos relacionados), gere um nome curto e claro de assunto, em PT-BR.

Grupos (JSON — array de arrays de termos):
%s

Responda APENAS um array JSON de strings com EXATAMENTE um nome por grupo, na mesma ordem.`,
			aiActionJSON(p["groups"])), true, true

	case "radar:dna":
		return fmt.Sprintf(`Você é analista de tendências do YouTube. Extraia o "DNA" da oportunidade de conteúdo abaixo.

Perfil do radar (JSON):
%s

Responda APENAS um objeto JSON com os campos "acontecendo" (o que está acontecendo), "assunto" (tema central), "formato" (formato que performa), "gatilho" (gatilho emocional), "titulo" (título modelo), "thumbnail" (conceito de capa), "narrativa" (arco narrativo dominante) e "porque_canal" (por que faz sentido para um canal BR).`,
			aiActionJSON(p)), true, true

	case "radar:pauta":
		return fmt.Sprintf(`Você é head de pauta de um canal YouTube BR. Gere uma pauta original de vídeo a partir dos sinais abaixo.

Dados (JSON — nome, nicho, sinais e opcionalmente o DNA já extraído):
%s

Responda APENAS um objeto JSON com os campos "titulo" (título forte PT-BR), "angulo" (abordagem original), "gancho" (texto do hook inicial), "estrutura" (array de 4 a 6 strings com as partes do vídeo) e "thumbnail" (conceito visual da capa).`,
			aiActionJSON(p)), true, true

	// NOT-R04 — curadoria e tradução de notícias RSS
	case "news:curate":
		return fmt.Sprintf(`Você é curador de pautas para um canal YouTube de tecnologia/negócios. Selecione as até 8 manchetes mais promissoras para virar vídeo.

Manchetes (JSON — array de {title, source}, índice 0-based):
%s

Responda APENAS um array JSON de objetos {"index": <índice numérico da manchete>, "reason": "<por que rende vídeo, em PT-BR>"} ordenados do mais promissor ao menos.`,
			aiActionJSON(p["headlines"])), true, true

	case "translate:news":
		return fmt.Sprintf(`Traduza para PT-BR os títulos e resumos de notícias abaixo, preservando os índices.

Itens (JSON — array de {i, t, s}):
%s

Responda APENAS um array JSON de objetos {"i": <mesmo índice>, "t": "<título em PT-BR>", "s": "<resumo em PT-BR>"}.`,
			aiActionJSON(p["items"])), true, true

	case "translate:article":
		return fmt.Sprintf(`Traduza para PT-BR a notícia abaixo.

Título: %s
Texto: %s

Responda APENAS um objeto JSON {"titulo": "<título em PT-BR>", "texto": "<texto em PT-BR>"}.`,
			aiActionStr(p, "title"), aiActionStr(p, "text")), true, true

	// MID-R07 — tradução em lote de títulos de vídeos salvos
	case "translate:titles":
		return fmt.Sprintf(`Traduza para PT-BR os títulos de vídeos abaixo, preservando os ids.

Itens (JSON — array de {id, title}):
%s

Responda APENAS um array JSON de objetos {"id": "<mesmo id>", "pt": "<título em PT-BR>"}.`,
			aiActionJSON(p["items"])), true, true
	}
	return "", false, false
}

// ---------- Handler: POST /api/v1/ai/action ----------------------------------

// handleAIAction implementa POST /api/v1/ai/action (CAN-R04, RAD-R07, NOT-R04, MID-R07).
// Body: {"action": string, "payload": object} → {"text": string} ou {"data": any}.
func (s *Server) handleAIAction(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body struct {
		Action  string          `json:"action"`
		Payload json.RawMessage `json:"payload"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	payload := map[string]any{}
	if len(body.Payload) > 0 {
		if err := json.Unmarshal(body.Payload, &payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Payload inválido."})
			return
		}
	}
	// CAN-R04 / RAD-R07 / NOT-R04 / MID-R07: dispatch por nome de ação.
	prompt, jsonMode, known := buildAIActionPrompt(strings.TrimSpace(body.Action), payload)
	if !known {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Ação desconhecida."})
		return
	}
	if strings.TrimSpace(s.cfg.GeminiKey) == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "IA não configurada."})
		return
	}
	text, err := callActionGemini(r.Context(), s.cfg.GeminiKey, prompt, jsonMode)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": "Falha ao consultar o serviço de IA."})
		return
	}
	if jsonMode {
		data, err := parseAIActionJSON(text)
		if err != nil {
			writeJSON(w, http.StatusBadGateway, map[string]any{"error": "Resposta inválida do serviço de IA."})
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"data": data})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"text": text})
}

// ---------- Handler: POST /api/v1/ai/chat (IDE-R04) ---------------------------

// assistantIdeaAction espelha AssistantIdeaAction do frontend (dataClient.ts).
type assistantIdeaAction struct {
	Titulo    string `json:"titulo"`
	Hook      string `json:"hook,omitempty"`
	Resumo    string `json:"resumo,omitempty"`
	Porque    string `json:"porque,omitempty"`
	Canal     string `json:"canal,omitempty"`
	Categoria string `json:"categoria,omitempty"`
}

// extractChatIdeaAction localiza um bloco {"ideaAction":{...}} na resposta do
// modelo, remove-o do texto visível e devolve (reply, ideaAction|nil).
func extractChatIdeaAction(raw string) (string, *assistantIdeaAction) {
	const marker = `"ideaAction"`
	pos := 0
	for {
		idx := strings.Index(raw[pos:], marker)
		if idx < 0 {
			return strings.TrimSpace(raw), nil
		}
		idx += pos
		start := strings.LastIndex(raw[:idx], "{")
		if start < 0 {
			return strings.TrimSpace(raw), nil
		}
		if end := balancedJSONEnd(raw, start); end > 0 {
			var wrapper struct {
				IdeaAction *assistantIdeaAction `json:"ideaAction"`
			}
			if err := json.Unmarshal([]byte(raw[start:end]), &wrapper); err == nil && wrapper.IdeaAction != nil && wrapper.IdeaAction.Titulo != "" {
				reply := strings.TrimSpace(raw[:start])
				for {
					trimmed := strings.TrimSpace(reply)
					if strings.HasSuffix(trimmed, "```json") {
						reply = strings.TrimSpace(strings.TrimSuffix(trimmed, "```json"))
						continue
					}
					if strings.HasSuffix(trimmed, "```") {
						reply = strings.TrimSpace(strings.TrimSuffix(trimmed, "```"))
						continue
					}
					reply = trimmed
					break
				}
				if reply == "" {
					reply = "Sugestão de projeto gerada abaixo."
				}
				return reply, wrapper.IdeaAction
			}
		}
		pos = idx + len(marker)
	}
}

// buildAIChatPrompt monta o prompt do Assistente VYStudioCraft (IDE-R04).
func (s *Server) buildAIChatPrompt(userID, projectID string, messages []struct {
	Role string `json:"role"`
	Text string `json:"text"`
}) string {
	var sb strings.Builder
	sb.WriteString(`Você é o Assistente VYStudioCraft, copiloto de um estúdio de produção para canais de YouTube. Responda sempre em PT-BR, em markdown conciso e útil para um criador de conteúdo.

Quando fizer sentido sugerir a criação de um projeto/vídeo novo no Kanban do usuário, anexe ao FINAL da resposta um único objeto JSON exatamente neste formato (sem texto depois dele):
{"ideaAction":{"titulo":"...","hook":"...","resumo":"...","porque":"...","canal":"...","categoria":"..."}}
Só inclua esse bloco quando estiver propondo uma ideia de vídeo; do contrário, responda normalmente sem JSON.
`)
	if pid := strings.NewReplacer("/", "", "\\", "", "..", "").Replace(strings.TrimSpace(projectID)); pid != "" {
		if doc, err := s.db.GetDoc(fmt.Sprintf("usuarios/%s/projetos/%s", userID, pid)); err == nil && doc != nil && doc.Exists {
			ctxJSON := aiActionJSON(doc.Data)
			if len(ctxJSON) > 6000 {
				ctxJSON = ctxJSON[:6000] + "…"
			}
			sb.WriteString("\nContexto do projeto aberto pelo usuário (JSON):\n")
			sb.WriteString(ctxJSON)
			sb.WriteString("\n")
		}
	}
	sb.WriteString("\nHistórico da conversa:\n")
	for _, m := range messages {
		role := "Usuário"
		if m.Role == "assistant" {
			role = "Assistente"
		}
		text := m.Text
		if len(text) > 4000 {
			text = text[:4000] + "…"
		}
		sb.WriteString(role)
		sb.WriteString(": ")
		sb.WriteString(text)
		sb.WriteString("\n")
	}
	sb.WriteString("\nResponda à última mensagem do usuário.")
	return sb.String()
}

// handleAIChat implementa POST /api/v1/ai/chat (IDE-R04).
// Body: {"messages":[{"role":"user"|"assistant","text":string}], "projectId"?:string}
// → {"reply": string, "ideaAction": {titulo,hook?,resumo?,porque?,canal?,categoria?}|null}
func (s *Server) handleAIChat(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body struct {
		Messages []struct {
			Role string `json:"role"`
			Text string `json:"text"`
		} `json:"messages"`
		ProjectID string `json:"projectId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	if len(body.Messages) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Informe ao menos uma mensagem."})
		return
	}
	if strings.TrimSpace(s.cfg.GeminiKey) == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "IA não configurada."})
		return
	}
	prompt := s.buildAIChatPrompt(u.ID, body.ProjectID, body.Messages)
	text, err := callActionGemini(r.Context(), s.cfg.GeminiKey, prompt, false)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": "Falha ao consultar o serviço de IA."})
		return
	}
	reply, idea := extractChatIdeaAction(text)
	writeJSON(w, http.StatusOK, map[string]any{"reply": reply, "ideaAction": idea})
}
