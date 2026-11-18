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

// geminiScriptBaseURL é var para que testes possam trocar por um httptest.Server (ROT-R06).
var geminiScriptBaseURL = "https://generativelanguage.googleapis.com"

const geminiScriptModel = "gemini-2.5-flash"

// GeneratedScript espelha o contrato do frontend (dataClient.ts → GeneratedScript).
type GeneratedScript struct {
	Title                string          `json:"title"`
	ThumbnailIdeas       []string        `json:"thumbnailIdeas"`
	Hook0to30            string          `json:"hook0to30"`
	Promise              string          `json:"promise"`
	Chapters             []ScriptChapter `json:"chapters"`
	RetentionBeats       []string        `json:"retentionBeats"`
	CTA                  string          `json:"cta"`
	EstimatedDurationMin float64         `json:"estimatedDurationMin"`
}

// ScriptChapter é um capítulo do roteiro com dica de duração e direção visual.
type ScriptChapter struct {
	Heading      string `json:"heading"`
	DurationHint string `json:"durationHint"`
	ScriptText   string `json:"scriptText"`
	VisualCue    string `json:"visualCue"`
}

// aiScriptRequest é o payload de POST /api/v1/ai/script (ROT-R01, ROT-R07, ROT-R08).
type aiScriptRequest struct {
	Topic           string  `json:"topic"`
	ChannelName     string  `json:"channelName"`
	Niche           string  `json:"niche"`
	Audience        string  `json:"audience"`
	Format          string  `json:"format"`
	Tone            string  `json:"tone"`
	DurationMinutes float64 `json:"durationMinutes"`
	HookStyle       string  `json:"hookStyle"`
	Notes           string  `json:"notes,omitempty"`
	ProfilePrompt   string  `json:"profilePrompt,omitempty"`
	PartsCount      int     `json:"partsCount,omitempty"`
	PPM             int     `json:"ppm,omitempty"`
	Angle           string  `json:"angle,omitempty"`
	KnowledgeBase   string  `json:"knowledgeBase,omitempty"`
}

// handleAIScript implementa POST /api/v1/ai/script (ROT-R06).
func (s *Server) handleAIScript(w http.ResponseWriter, r *http.Request) {
	// ROT-R06: geração exige sessão e delega ao Gemini.
	if _, sess := s.currentSession(r); sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body aiScriptRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	if strings.TrimSpace(body.Topic) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Informe o tema do roteiro."})
		return
	}
	if f := strings.TrimSpace(body.Format); f != "long" && f != "shorts" { // ROT-R02
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Formato inválido (use 'long' ou 'shorts')."})
		return
	}
	if strings.TrimSpace(s.cfg.GeminiKey) == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"error": "IA não configurada."})
		return
	}
	script, err := s.generateScriptWithGemini(r.Context(), body)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": "Falha ao gerar roteiro com a IA."})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"script": script})
}

// generateScriptWithGemini chama a REST API do Gemini e decodifica o roteiro (ROT-R06).
func (s *Server) generateScriptWithGemini(ctx context.Context, in aiScriptRequest) (*GeneratedScript, error) {
	payload := map[string]any{
		"contents": []any{
			map[string]any{"parts": []any{map[string]any{"text": buildAIScriptPrompt(in)}}},
		},
		"generationConfig": map[string]any{"responseMimeType": "application/json"},
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	endpoint := fmt.Sprintf("%s/v1beta/models/%s:generateContent?key=%s",
		strings.TrimRight(geminiScriptBaseURL, "/"), geminiScriptModel, url.QueryEscape(s.cfg.GeminiKey))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := (&http.Client{Timeout: 90 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gemini respondeu status %d", resp.StatusCode)
	}
	var gres struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &gres); err != nil {
		return nil, err
	}
	var text strings.Builder
	for _, c := range gres.Candidates {
		for _, p := range c.Content.Parts {
			text.WriteString(p.Text)
		}
		if text.Len() > 0 {
			break
		}
	}
	if strings.TrimSpace(text.String()) == "" {
		return nil, fmt.Errorf("gemini respondeu sem texto")
	}
	var script GeneratedScript
	if err := json.Unmarshal([]byte(stripJSONCodeFences(text.String())), &script); err != nil {
		return nil, err
	}
	return &script, nil
}

// buildAIScriptPrompt monta o prompt pt-BR pedindo JSON estrito no formato GeneratedScript.
func buildAIScriptPrompt(in aiScriptRequest) string {
	formato := "vídeo longo (horizontal 16:9)"
	if in.Format == "shorts" {
		formato = "Short/vídeo vertical (9:16)"
	}
	parts := in.PartsCount
	if parts <= 0 {
		parts = 4
	}
	if parts > 12 {
		parts = 12
	}
	ppm := in.PPM
	if ppm <= 0 {
		ppm = 140
	}
	dur := in.DurationMinutes
	if dur <= 0 {
		dur = 8
		if in.Format == "shorts" {
			dur = 0.5
		}
	}
	tone := strings.TrimSpace(in.Tone)
	if tone == "" {
		tone = "envolvente e claro"
	}
	hookStyle := strings.TrimSpace(in.HookStyle)
	if hookStyle == "" {
		hookStyle = "pergunta provocativa"
	}

	var b strings.Builder
	b.WriteString("Você é um roteirista sênior de YouTube em um estúdio de roteiros, escrevendo em português brasileiro.\n")
	fmt.Fprintf(&b, "Crie um roteiro estruturado para um %s.\n", formato)
	fmt.Fprintf(&b, "Canal: %s | Nicho: %s | Público-alvo: %s\n", in.ChannelName, in.Niche, in.Audience)
	fmt.Fprintf(&b, "Tema: %s\n", in.Topic)
	fmt.Fprintf(&b, "Tom: %s | Estilo de gancho: %s | Duração alvo: %.1f minutos\n", tone, hookStyle, dur)
	fmt.Fprintf(&b, "Estruture o conteúdo em %d capítulo(s), com ritmo aproximado de %d palavras por minuto.\n", parts, ppm)
	if v := strings.TrimSpace(in.Angle); v != "" {
		fmt.Fprintf(&b, "Ângulo/abordagem desejada: %s\n", v)
	}
	if v := strings.TrimSpace(in.ProfilePrompt); v != "" {
		fmt.Fprintf(&b, "Siga este perfil de redator: %s\n", v) // ROT-R07
	}
	if v := strings.TrimSpace(in.KnowledgeBase); v != "" {
		fmt.Fprintf(&b, "Base de conhecimento a respeitar:\n%s\n", v) // ROT-R07
	}
	if v := strings.TrimSpace(in.Notes); v != "" {
		fmt.Fprintf(&b, "Observações do criador: %s\n", v)
	}
	fmt.Fprintf(&b, `
Responda APENAS com JSON válido (sem markdown, sem texto fora do JSON) no formato exato:
{"title": string, "thumbnailIdeas": string[], "hook0to30": string, "promise": string, "chapters": [{"heading": string, "durationHint": string, "scriptText": string, "visualCue": string}], "retentionBeats": string[], "cta": string, "estimatedDurationMin": number}
Regras:
- "title": título chamativo e otimizado para CTR.
- "thumbnailIdeas": 2 a 4 ideias curtas de thumbnail.
- "hook0to30": roteiro falado dos primeiros 30 segundos (o gancho), no estilo "%s".
- "promise": a promessa do vídeo em 1-2 frases.
- "chapters": exatamente %d capítulo(s) APÓS o gancho; "durationHint" no formato "MM:SS – MM:SS"; "scriptText" é o texto falado; "visualCue" descreve B-roll/visuais.
- "retentionBeats": 3 a 5 momentos/táticas de retenção ao longo do vídeo.
- "cta": chamada para ação final alinhada ao canal.
- "estimatedDurationMin": número próximo de %.1f.
`, hookStyle, parts, dur)
	return b.String()
}

// stripJSONCodeFences remove cercas ```json ... ``` que o modelo possa devolver.
func stripJSONCodeFences(s string) string {
	s = strings.TrimSpace(s)
	if !strings.HasPrefix(s, "```") {
		return s
	}
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		s = s[i+1:]
	}
	s = strings.TrimSuffix(strings.TrimSpace(s), "```")
	return strings.TrimSpace(s)
}
