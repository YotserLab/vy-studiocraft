package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// fakeGemini devolve um httptest.Server que imita generateContent do Gemini,
// retornando o texto fornecido no primeiro part do primeiro candidate.
func fakeGemini(t *testing.T, replyText string) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, ":generateContent") {
			t.Errorf("path inesperado no fake Gemini: %s", r.URL.Path)
		}
		if r.URL.Query().Get("key") == "" {
			t.Errorf("esperado ?key= na chamada ao Gemini")
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"candidates": []any{
				map[string]any{
					"content": map[string]any{
						"parts": []any{map[string]any{"text": replyText}},
					},
				},
			},
		})
	}))
	t.Cleanup(srv.Close)
	return srv
}

func useFakeGemini(t *testing.T, srv *httptest.Server) {
	t.Helper()
	old := actionGeminiBaseURL
	actionGeminiBaseURL = srv.URL
	t.Cleanup(func() { actionGeminiBaseURL = old })
}

func signupCookies(t *testing.T, srv *Server, email string) []*http.Cookie {
	t.Helper()
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": email, "password": "Password123", "name": "User",
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup falhou: %d %s", rec.Code, rec.Body.String())
	}
	return rec.Result().Cookies()
}

func TestAIAction_TRN(t *testing.T) {
	// CAN-R04, RAD-R07, NOT-R04, MID-R07: ações tipadas via ai/action
	srv, _ := newTestServer(t, true)
	cookies := signupCookies(t, srv, "u@vystudiocraft.local")

	// Anônimo → 401
	anon := reqJSON(srv.Handler(), "POST", "/api/v1/ai/action", map[string]any{
		"action": "channel:analyze", "payload": map[string]any{},
	}, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 anônimo, obtido %d", anon.Code)
	}

	// Ação desconhecida → 400
	unk := reqJSON(srv.Handler(), "POST", "/api/v1/ai/action", map[string]any{
		"action": "noop:unknown", "payload": map[string]any{},
	}, cookies)
	if unk.Code != http.StatusBadRequest {
		t.Fatalf("esperado 400 para ação desconhecida, obtido %d (%s)", unk.Code, unk.Body.String())
	}

	// Sem GeminiKey → 503
	nokey := reqJSON(srv.Handler(), "POST", "/api/v1/ai/action", map[string]any{
		"action": "channel:analyze",
		"payload": map[string]any{
			"channel": map[string]any{"nome": "Canal X", "nicho": "tech"},
		},
	}, cookies)
	if nokey.Code != http.StatusServiceUnavailable {
		t.Fatalf("esperado 503 sem chave, obtido %d (%s)", nokey.Code, nokey.Body.String())
	}

	// Com chave + Gemini fake → 200 {"text": ...}
	gem := fakeGemini(t, "## Posicionamento\nAnálise do canal.")
	useFakeGemini(t, gem)
	srv.cfg.GeminiKey = "fake-key"
	ok := reqJSON(srv.Handler(), "POST", "/api/v1/ai/action", map[string]any{
		"action": "channel:analyze",
		"payload": map[string]any{
			"channel": map[string]any{"nome": "Canal X", "nicho": "tech"},
		},
	}, cookies)
	if ok.Code != http.StatusOK {
		t.Fatalf("esperado 200, obtido %d (%s)", ok.Code, ok.Body.String())
	}
	var out struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(ok.Body.Bytes(), &out); err != nil {
		t.Fatalf("resposta não é JSON: %v", err)
	}
	if !strings.Contains(out.Text, "Posicionamento") {
		t.Fatalf("texto da resposta vazio/inesperado: %q", out.Text)
	}
}

// IDE-R04: o assistente pode devolver uma ideaAction parseada do bloco JSON.
func TestAIChat_IDE_R04(t *testing.T) {
	srv, _ := newTestServer(t, true)
	cookies := signupCookies(t, srv, "u@vystudiocraft.local")

	// Anônimo → 401
	anon := reqJSON(srv.Handler(), "POST", "/api/v1/ai/chat", map[string]any{
		"messages": []any{map[string]any{"role": "user", "text": "oi"}},
	}, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 anônimo, obtido %d", anon.Code)
	}

	gem := fakeGemini(t, "Aqui vai uma ideia forte para o canal:\n\n{\"ideaAction\":{\"titulo\":\"Vídeo X\",\"hook\":\"Você não vai acreditar\",\"canal\":\"Tech\",\"categoria\":\"Tutoriais\"}}")
	useFakeGemini(t, gem)
	srv.cfg.GeminiKey = "fake-key"

	rec := reqJSON(srv.Handler(), "POST", "/api/v1/ai/chat", map[string]any{
		"messages": []any{
			map[string]any{"role": "user", "text": "me sugira uma ideia de vídeo"},
		},
	}, cookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperado 200, obtido %d (%s)", rec.Code, rec.Body.String())
	}
	var out struct {
		Reply      string `json:"reply"`
		IdeaAction *struct {
			Titulo string `json:"titulo"`
			Hook   string `json:"hook"`
		} `json:"ideaAction"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("resposta não é JSON: %v", err)
	}
	if out.Reply == "" || strings.Contains(out.Reply, "ideaAction") {
		t.Fatalf("reply inesperado: %q", out.Reply)
	}
	if out.IdeaAction == nil || out.IdeaAction.Titulo != "Vídeo X" {
		t.Fatalf("ideaAction não parseado: %+v", out.IdeaAction)
	}
}
