package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// compareGeminiBaseURL é var (não const) para que testes apontem a chamada ao
// Gemini para um httptest.Server.
var compareGeminiBaseURL = "https://generativelanguage.googleapis.com"

// compareHTTPClient limita o tempo total da chamada upstream.
var compareHTTPClient = &http.Client{Timeout: 60 * time.Second}

// comparisonCriterion espelha um item de Comparison30sResult.criteria (CMP-R02).
type comparisonCriterion struct {
	Name        string `json:"name"`
	AssessmentA string `json:"assessmentA"`
	AssessmentB string `json:"assessmentB"`
	Edge        string `json:"edge"`
}

// comparison30sResult espelha Comparison30sResult do frontend (dataClient.ts).
type comparison30sResult struct {
	Winner          string                `json:"winner"`
	Summary         string                `json:"summary"`
	Criteria        []comparisonCriterion `json:"criteria"`
	ImprovedHookA   string                `json:"improvedHookA"`
	ImprovedHookB   string                `json:"improvedHookB"`
	ActionChecklist []string              `json:"actionChecklist"`
}

// handleAICompare30s implementa POST /api/v1/ai/compare-30s (CMP-R04).
// Compara duas aberturas de 30 segundos via Gemini e devolve o veredito
// estruturado que alimenta o Playbook Editorial (actionChecklist).
func (s *Server) handleAICompare30s(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body struct {
		TitleA      string `json:"titleA"`
		HookA       string `json:"hookA"`
		VisualCutsA string `json:"visualCutsA"`
		TitleB      string `json:"titleB"`
		HookB       string `json:"hookB"`
		VisualCutsB string `json:"visualCutsB"`
		Niche       string `json:"niche"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	// CMP-R01: os seis campos de A/B + nicho são obrigatórios.
	required := map[string]string{
		"titleA":      body.TitleA,
		"hookA":       body.HookA,
		"visualCutsA": body.VisualCutsA,
		"titleB":      body.TitleB,
		"hookB":       body.HookB,
		"visualCutsB": body.VisualCutsB,
		"niche":       body.Niche,
	}
	for name, val := range required {
		if strings.TrimSpace(val) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Campo obrigatório vazio: " + name + "."})
			return
		}
	}
	if strings.TrimSpace(s.cfg.GeminiKey) == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "IA não configurada."})
		return
	}

	prompt := buildCompare30sPrompt(body.Niche, body.TitleA, body.HookA, body.VisualCutsA, body.TitleB, body.HookB, body.VisualCutsB)
	raw, err := callCompareGemini(r.Context(), s.cfg.GeminiKey, prompt)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": "Falha ao consultar a IA."})
		return
	}

	var result comparison30sResult
	if err := json.Unmarshal([]byte(stripCompareJSONFences(raw)), &result); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": "Resposta da IA malformada."})
		return
	}
	// CMP-R02: winner e edge ∈ {A, B, empate} — normaliza saída do modelo.
	result.Winner = normalizeCompareEdge(result.Winner)
	for i := range result.Criteria {
		result.Criteria[i].Edge = normalizeCompareEdge(result.Criteria[i].Edge)
	}
	if result.Criteria == nil {
		result.Criteria = []comparisonCriterion{}
	}
	if result.ActionChecklist == nil {
		result.ActionChecklist = []string{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"comparison": result})
}

// buildCompare30sPrompt monta o prompt pt-BR exigindo JSON estrito na saída.
func buildCompare30sPrompt(niche, titleA, hookA, cutsA, titleB, hookB, cutsB string) string {
	return fmt.Sprintf(`Você é um estrategista de retenção para YouTube, especialista nos primeiros 30 segundos de vídeos do nicho "%s".

Compare as duas propostas de abertura (00:00–00:30) abaixo e responda APENAS com JSON válido, sem markdown e sem blocos de código.

VARIANTE A
- Título: %s
- Gancho falado: %s
- Cortes visuais: %s

VARIANTE B
- Título: %s
- Gancho falado: %s
- Cortes visuais: %s

Formato exato da resposta:
{
  "winner": "A" | "B" | "empate",
  "summary": "resumo executivo da comparação em pt-BR",
  "criteria": [
    {"name": "nome do critério", "assessmentA": "avaliação da variante A", "assessmentB": "avaliação da variante B", "edge": "A" | "B" | "empate"}
  ],
  "improvedHookA": "versão melhorada do gancho da variante A",
  "improvedHookB": "versão melhorada do gancho da variante B",
  "actionChecklist": ["[categoria] regra acionável extraída da comparação"]
}

Regras:
- winner e edge devem ser exatamente "A", "B" ou "empate".
- Inclua de 3 a 5 critérios relevantes (ex.: clareza do gancho, força da promessa, ritmo visual, curiosidade aberta, CTA implícito).
- Cada linha de actionChecklist deve começar com [categoria] em minúsculas e sem acento, ex.: [retencao] Cortar a cada 3 segundos nos primeiros 10s.
- Todo o texto da resposta deve estar em português do Brasil.`, niche, titleA, hookA, cutsA, titleB, hookB, cutsB)
}

// callCompareGemini chama o endpoint generateContent do Gemini REST e devolve o
// texto bruto do primeiro candidato.
func callCompareGemini(ctx context.Context, apiKey, prompt string) (string, error) {
	reqBody := map[string]any{
		"contents": []map[string]any{
			{"parts": []map[string]any{{"text": prompt}}},
		},
		"generationConfig": map[string]any{"responseMimeType": "application/json"},
	}
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}
	endpoint := strings.TrimRight(compareGeminiBaseURL, "/") +
		"/v1beta/models/gemini-2.5-flash:generateContent?key=" + url.QueryEscape(apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := compareHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini status %d", resp.StatusCode)
	}
	var out struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &out); err != nil {
		return "", err
	}
	for _, cand := range out.Candidates {
		for _, part := range cand.Content.Parts {
			if strings.TrimSpace(part.Text) != "" {
				return part.Text, nil
			}
		}
	}
	return "", fmt.Errorf("gemini respondeu sem texto")
}

// stripCompareJSONFences remove cercas de markdown (```json ... ```) que o
// modelo pode emitir mesmo com responseMimeType=application/json.
func stripCompareJSONFences(s string) string {
	t := strings.TrimSpace(s)
	if strings.HasPrefix(t, "```") {
		if idx := strings.Index(t, "\n"); idx >= 0 {
			t = t[idx+1:]
		}
		t = strings.TrimSpace(t)
		if strings.HasSuffix(t, "```") {
			t = strings.TrimSpace(t[:len(t)-3])
		}
	}
	return t
}

// normalizeCompareEdge garante winner/edge ∈ {A, B, empate} (CMP-R02).
func normalizeCompareEdge(v string) string {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "a":
		return "A"
	case "b":
		return "B"
	default:
		return "empate"
	}
}
