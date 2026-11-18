package httpapi

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"testing"

	"vystudiocraft/internal/config"
	"vystudiocraft/internal/store"
)

// newTestServerProdLike monta um Server com DevMode=false (newTestServer sempre usa DevMode=true).
func newTestServerProdLike(t *testing.T, signupOpen bool) (*Server, *store.DB) {
	t.Helper()
	dir := t.TempDir()
	db, err := store.Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatalf("Open db falhou: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	cfg := config.Config{
		DataDir:     dir,
		WebDir:      dir,
		AdminEmail:  "admin@vystudiocraft.local",
		AppOrigin:   "http://localhost:34568",
		SessionDays: 30,
		UploadMaxMB: 10,
		DevMode:     false,
		SignupOpen:  signupOpen,
	}
	return New(db, cfg), db
}

// CFG-R05: GET /api/v1/auth/config é público e expõe flags de runtime.
func TestAuthConfig_CFG_R05(t *testing.T) {
	srv, _ := newTestServer(t, true)

	// Sem usuários: hasUsers=false, signupOpen reflete a flag do server.
	rec := reqJSON(srv.Handler(), "GET", "/api/v1/auth/config", nil, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperado 200 em auth/config, obtido %d", rec.Code)
	}
	var cfg map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &cfg); err != nil {
		t.Fatalf("JSON inválido em auth/config: %v", err)
	}
	if cfg["hasUsers"] != false {
		t.Fatalf("esperado hasUsers=false sem usuários, obtido %v", cfg["hasUsers"])
	}
	if cfg["signupOpen"] != true {
		t.Fatalf("esperado signupOpen=true, obtido %v", cfg["signupOpen"])
	}
	if cfg["devMode"] != true {
		t.Fatalf("esperado devMode=true no test server, obtido %v", cfg["devMode"])
	}
	// Em DevMode, adminEmailHint é exposto.
	if hint, _ := cfg["adminEmailHint"].(string); hint != "admin@vystudiocraft.local" {
		t.Fatalf("esperado adminEmailHint=admin@vystudiocraft.local em DevMode, obtido %v", cfg["adminEmailHint"])
	}

	// Após signup, hasUsers=true.
	if rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "u@vystudiocraft.local", "password": "Password123", "name": "U",
	}, nil); rec.Code != http.StatusCreated {
		t.Fatalf("signup falhou: %d", rec.Code)
	}
	rec2 := reqJSON(srv.Handler(), "GET", "/api/v1/auth/config", nil, nil)
	var cfg2 map[string]any
	_ = json.Unmarshal(rec2.Body.Bytes(), &cfg2)
	if cfg2["hasUsers"] != true {
		t.Fatalf("esperado hasUsers=true após signup, obtido %v", cfg2["hasUsers"])
	}

	// signupOpen reflete a flag do servidor.
	srvClosed, _ := newTestServer(t, false)
	recClosed := reqJSON(srvClosed.Handler(), "GET", "/api/v1/auth/config", nil, nil)
	var cfgClosed map[string]any
	_ = json.Unmarshal(recClosed.Body.Bytes(), &cfgClosed)
	if cfgClosed["signupOpen"] != false {
		t.Fatalf("esperado signupOpen=false, obtido %v", cfgClosed["signupOpen"])
	}
}

// CFG-R05: adminEmailHint nunca vaza fora de DevMode.
func TestAuthConfigAdminEmailHintProd_CFG_R05(t *testing.T) {
	srv, _ := newTestServerProdLike(t, true)
	rec := reqJSON(srv.Handler(), "GET", "/api/v1/auth/config", nil, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperado 200 em auth/config, obtido %d", rec.Code)
	}
	var cfg map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &cfg)
	if _, leaked := cfg["adminEmailHint"]; leaked {
		t.Fatalf("adminEmailHint não deve ser exposto com DevMode=false")
	}
	if cfg["devMode"] != false {
		t.Fatalf("esperado devMode=false, obtido %v", cfg["devMode"])
	}
}

func TestAuthProfile(t *testing.T) {
	srv, _ := newTestServer(t, true)

	// Anônimo -> 401.
	anon := reqJSON(srv.Handler(), "POST", "/api/v1/auth/profile", map[string]any{
		"displayName": "Novo Nome",
	}, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 sem sessão, obtido %d", anon.Code)
	}

	// Sessão válida.
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "u@vystudiocraft.local", "password": "Password123", "name": "Nome Original",
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup falhou: %d", rec.Code)
	}
	cookies := rec.Result().Cookies()

	// displayName vazio/whitespace -> 400.
	for _, bad := range []string{"", "   "} {
		res := reqJSON(srv.Handler(), "POST", "/api/v1/auth/profile", map[string]any{
			"displayName": bad,
		}, cookies)
		if res.Code != http.StatusBadRequest {
			t.Fatalf("esperado 400 para displayName %q, obtido %d", bad, res.Code)
		}
	}

	// displayName válido -> 200 e user.displayName atualizado.
	ok := reqJSON(srv.Handler(), "POST", "/api/v1/auth/profile", map[string]any{
		"displayName": "  Nome Atualizado  ",
	}, cookies)
	if ok.Code != http.StatusOK {
		t.Fatalf("esperado 200 no update de perfil, obtido %d (%s)", ok.Code, ok.Body.String())
	}
	var out struct {
		User store.User `json:"user"`
	}
	if err := json.Unmarshal(ok.Body.Bytes(), &out); err != nil {
		t.Fatalf("JSON inválido na resposta de profile: %v", err)
	}
	if out.User.DisplayName != "Nome Atualizado" {
		t.Fatalf("esperado displayName=%q, obtido %q", "Nome Atualizado", out.User.DisplayName)
	}

	// GET /api/v1/auth/me reflete o novo nome.
	me := reqJSON(srv.Handler(), "GET", "/api/v1/auth/me", nil, cookies)
	if me.Code != http.StatusOK {
		t.Fatalf("esperado 200 em auth/me, obtido %d", me.Code)
	}
	var meOut struct {
		User store.User `json:"user"`
	}
	_ = json.Unmarshal(me.Body.Bytes(), &meOut)
	if meOut.User.DisplayName != "Nome Atualizado" {
		t.Fatalf("auth/me não refletiu displayName atualizado: %q", meOut.User.DisplayName)
	}
}
