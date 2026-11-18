package httpapi

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func aiScriptTestCookies(t *testing.T, srv *Server) []*http.Cookie {
	t.Helper()
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "scripter@vystudiocraft.local", "password": "Password123", "name": "Scripter",
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup falhou: %d %s", rec.Code, rec.Body.String())
	}
	return rec.Result().Cookies()
}

// ROT-R06/ROT-R02: sessão, validação de entrada e config da IA.
func TestAIScriptValidation_ROT_R06(t *testing.T) {
	srv, _ := newTestServer(t, true)
	cookies := aiScriptTestCookies(t, srv)

	anon := reqJSON(srv.Handler(), "POST", "/api/v1/ai/script", map[string]any{
		"topic": "Tema", "format": "long",
	}, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 sem sessão, obtido %d", anon.Code)
	}

	miss := reqJSON(srv.Handler(), "POST", "/api/v1/ai/script", map[string]any{
		"format": "long",
	}, cookies)
	if miss.Code != http.StatusBadRequest {
		t.Fatalf("esperado 400 sem topic, obtido %d", miss.Code)
	}

	badFormat := reqJSON(srv.Handler(), "POST", "/api/v1/ai/script", map[string]any{
		"topic": "Tema", "format": "reels",
	}, cookies)
	if badFormat.Code != http.StatusBadRequest {
		t.Fatalf("esperado 400 para format inválido, obtido %d", badFormat.Code)
	}

	noKey := reqJSON(srv.Handler(), "POST", "/api/v1/ai/script", map[string]any{
		"topic": "Tema", "format": "long",
	}, cookies)
	if noKey.Code != http.StatusServiceUnavailable {
		t.Fatalf("esperado 503 sem GeminiKey, obtido %d", noKey.Code)
	}
}

// ROT-R06: integração com a API do Gemini (base URL trocada por httptest.Server).
func TestAIScriptGemini_ROT_R06(t *testing.T) {
	scriptJSON := `{"title":"Título Teste","thumbnailIdeas":["thumb A","thumb B"],"hook0to30":"Você sabia?","promise":"Promessa do vídeo.","chapters":[{"heading":"01 — Contexto","durationHint":"00:30 – 02:00","scriptText":"Texto do capítulo.","visualCue":"B-roll de arquivo."}],"retentionBeats":["beat 1"],"cta":"Inscreva-se.","estimatedDurationMin":8}`
	broken := false
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/v1beta/models/gemini-2.5-flash:generateContent") {
			t.Errorf("path inesperado: %s", r.URL.Path)
		}
		if r.URL.Query().Get("key") != "test-key" {
			t.Errorf("key ausente/errada: %s", r.URL.RawQuery)
		}
		reqBody, _ := io.ReadAll(r.Body)
		if !strings.Contains(string(reqBody), "Dark kitchens") {
			t.Errorf("prompt não contém o tópico enviado")
		}
		w.Header().Set("Content-Type", "application/json")
		text := "```json\n" + scriptJSON + "\n```"
		if broken {
			text = "isso não é json"
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"candidates": []any{
				map[string]any{
					"content": map[string]any{
						"parts": []any{map[string]any{"text": text}},
					},
				},
			},
		})
	}))
	defer fake.Close()

	old := geminiScriptBaseURL
	geminiScriptBaseURL = fake.URL
	t.Cleanup(func() { geminiScriptBaseURL = old })

	srv, _ := newTestServer(t, true)
	srv.cfg.GeminiKey = "test-key"
	cookies := aiScriptTestCookies(t, srv)

	rec := reqJSON(srv.Handler(), "POST", "/api/v1/ai/script", map[string]any{
		"topic": "Dark kitchens no Brasil", "channelName": "Canal X", "niche": "foodtech",
		"audience": "empreendedores", "format": "long", "tone": "didático",
		"durationMinutes": 8, "hookStyle": "pergunta provocativa", "partsCount": 1, "ppm": 140,
	}, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperado 200, obtido %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Script GeneratedScript `json:"script"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode falhou: %v", err)
	}
	s := out.Script
	if s.Title != "Título Teste" || s.Hook0to30 != "Você sabia?" || s.Promise == "" ||
		len(s.Chapters) != 1 || s.Chapters[0].ScriptText == "" || s.Chapters[0].VisualCue == "" ||
		len(s.RetentionBeats) != 1 || s.CTA == "" || s.EstimatedDurationMin != 8 {
		t.Fatalf("script parseado incorreto: %+v", s)
	}

	// Resposta malformada do Gemini -> 502
	broken = true
	bad := reqJSON(srv.Handler(), "POST", "/api/v1/ai/script", map[string]any{
		"topic": "Dark kitchens no Brasil", "format": "long",
	}, cookies)
	if bad.Code != http.StatusBadGateway {
		t.Fatalf("esperado 502 para JSON inválido do Gemini, obtido %d", bad.Code)
	}
}
