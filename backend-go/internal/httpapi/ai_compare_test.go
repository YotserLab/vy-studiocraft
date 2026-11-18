package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// CMP-R04: POST /api/v1/ai/compare-30s — sessão, validação, 503 sem chave e
// chamada ao Gemini com resposta parseada.
func TestAICompare30s_CMP_R04(t *testing.T) {
	srv, _ := newTestServer(t, false)

	validBody := map[string]any{
		"titleA":      "Título A",
		"hookA":       "Você sabia que...",
		"visualCutsA": "corte a cada 2s",
		"titleB":      "Título B",
		"hookB":       "Ninguém fala sobre...",
		"visualCutsB": "zoom lento",
		"niche":       "finanças",
	}

	// Anônimo -> 401
	anon := reqJSON(srv.Handler(), "POST", "/api/v1/ai/compare-30s", validBody, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 anônimo, obtido %d", anon.Code)
	}

	// Sessão via signup (bootstrap)
	sign := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "cmp@vystudiocraft.local", "password": "Password123", "name": "Cmp",
	}, nil)
	if sign.Code != http.StatusCreated {
		t.Fatalf("signup falhou: %d", sign.Code)
	}
	cookies := sign.Result().Cookies()

	// Campos obrigatórios ausentes -> 400 (CMP-R01)
	missing := reqJSON(srv.Handler(), "POST", "/api/v1/ai/compare-30s", map[string]any{
		"titleA": "só título",
	}, cookies)
	if missing.Code != http.StatusBadRequest {
		t.Fatalf("esperado 400 com campos faltando, obtido %d", missing.Code)
	}

	// Sem GEMINI_API_KEY -> 503
	noKey := reqJSON(srv.Handler(), "POST", "/api/v1/ai/compare-30s", validBody, cookies)
	if noKey.Code != http.StatusServiceUnavailable {
		t.Fatalf("esperado 503 sem GeminiKey, obtido %d", noKey.Code)
	}

	// Gemini fake via httptest — texto da resposta vem cercado por ```json
	inner := `{"winner":"A","summary":"A retém mais no início.","criteria":[{"name":"clareza","assessmentA":"direta","assessmentB":"vaga","edge":"a"}],"improvedHookA":"gancho A+","improvedHookB":"gancho B+","actionChecklist":["[retencao] corte a cada 3s"]}`
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("método esperado POST, veio %s", r.Method)
		}
		if !strings.HasSuffix(r.URL.Path, "/v1beta/models/gemini-2.5-flash:generateContent") {
			t.Errorf("path inesperado: %s", r.URL.Path)
		}
		if r.URL.Query().Get("key") != "test-key" {
			t.Errorf("api key não propagada: %s", r.URL.RawQuery)
		}
		w.Header().Set("Content-Type", "application/json")
		text, _ := json.Marshal("```json\n" + inner + "\n```")
		_, _ = w.Write([]byte(`{"candidates":[{"content":{"parts":[{"text":` + string(text) + `}]}}]}`))
	}))
	defer fake.Close()

	oldBase := compareGeminiBaseURL
	compareGeminiBaseURL = fake.URL
	t.Cleanup(func() { compareGeminiBaseURL = oldBase })
	srv.cfg.GeminiKey = "test-key"

	ok := reqJSON(srv.Handler(), "POST", "/api/v1/ai/compare-30s", validBody, cookies)
	if ok.Code != http.StatusOK {
		t.Fatalf("esperado 200 com Gemini fake, obtido %d: %s", ok.Code, ok.Body.String())
	}
	var out struct {
		Comparison comparison30sResult `json:"comparison"`
	}
	if err := json.Unmarshal(ok.Body.Bytes(), &out); err != nil {
		t.Fatalf("resposta não é JSON válido: %v", err)
	}
	if out.Comparison.Winner != "A" {
		t.Fatalf("winner esperado A, veio %q", out.Comparison.Winner)
	}
	if len(out.Comparison.Criteria) != 1 || out.Comparison.Criteria[0].Edge != "A" {
		t.Fatalf("criteria/edge não normalizados: %+v", out.Comparison.Criteria)
	}
	if len(out.Comparison.ActionChecklist) != 1 || !strings.HasPrefix(out.Comparison.ActionChecklist[0], "[retencao]") {
		t.Fatalf("actionChecklist inesperado: %+v", out.Comparison.ActionChecklist)
	}
	if out.Comparison.ImprovedHookA == "" || out.Comparison.ImprovedHookB == "" {
		t.Fatalf("improvedHooks vazios: %+v", out.Comparison)
	}
}
