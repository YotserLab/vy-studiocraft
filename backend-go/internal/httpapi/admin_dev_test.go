package httpapi

import (
	"encoding/json"
	"net/http"
	"testing"
)

func signupTestUser(t *testing.T, srv *Server, email, name string) []*http.Cookie {
	t.Helper()
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": email, "password": "Password123", "name": name,
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup de %s falhou: %d %s", email, rec.Code, rec.Body.String())
	}
	return rec.Result().Cookies()
}

// PLA-R05: /api/v1/admin/audit exige sessão admin
func TestAdminAudit_PLA_R05(t *testing.T) {
	srv, db := newTestServer(t, true)

	anon := reqJSON(srv.Handler(), "GET", "/api/v1/admin/audit", nil, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 para anônimo, obtido %d", anon.Code)
	}

	admCookies := signupTestUser(t, srv, "admin@vystudiocraft.local", "Admin")
	usrCookies := signupTestUser(t, srv, "user@vystudiocraft.local", "User")

	forb := reqJSON(srv.Handler(), "GET", "/api/v1/admin/audit", nil, usrCookies)
	if forb.Code != http.StatusForbidden {
		t.Fatalf("esperado 403 para usuário comum, obtido %d", forb.Code)
	}

	// O store só grava auditoria via LogAudit (seed); insere uma linha direta
	// para garantir events não-vazio na resposta.
	db.LogAudit("usr_seed_01", "teste_audit", "detalhe do evento de teste")

	rec := reqJSON(srv.Handler(), "GET", "/api/v1/admin/audit?limit=50", nil, admCookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperado 200 para admin, obtido %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		Events []struct {
			ID        int64   `json:"id"`
			UserID    *string `json:"userId"`
			Action    string  `json:"action"`
			Detail    string  `json:"detail"`
			CreatedAt int64   `json:"createdAt"`
		} `json:"events"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("resposta inválida: %v", err)
	}
	if len(out.Events) == 0 {
		t.Fatalf("esperado ao menos 1 evento de auditoria")
	}
	found := false
	for _, ev := range out.Events {
		if ev.Action == "teste_audit" && ev.Detail == "detalhe do evento de teste" {
			found = true
			if ev.UserID == nil || *ev.UserID != "usr_seed_01" {
				t.Fatalf("userId incorreto no evento: %+v", ev)
			}
			if ev.ID <= 0 || ev.CreatedAt <= 0 {
				t.Fatalf("campos id/createdAt inválidos: %+v", ev)
			}
		}
	}
	if !found {
		t.Fatalf("evento inserido não encontrado na resposta: %s", rec.Body.String())
	}
}

// POST /api/v1/dev/seed: exige sessão admin e DEV_MODE
func TestDevSeed(t *testing.T) {
	srv, _ := newTestServer(t, true) // helper já cria server com DevMode=true

	anon := reqJSON(srv.Handler(), "POST", "/api/v1/dev/seed", nil, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 para anônimo, obtido %d", anon.Code)
	}

	admCookies := signupTestUser(t, srv, "admin@vystudiocraft.local", "Admin")
	usrCookies := signupTestUser(t, srv, "user@vystudiocraft.local", "User")

	forb := reqJSON(srv.Handler(), "POST", "/api/v1/dev/seed", nil, usrCookies)
	if forb.Code != http.StatusForbidden {
		t.Fatalf("esperado 403 para usuário comum, obtido %d", forb.Code)
	}

	rec := reqJSON(srv.Handler(), "POST", "/api/v1/dev/seed", nil, admCookies)
	if rec.Code != http.StatusOK {
		t.Fatalf("esperado 200 para admin em DEV_MODE, obtido %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		OK      bool   `json:"ok"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("resposta inválida: %v", err)
	}
	if !out.OK || out.Message != "Seed aplicado." {
		t.Fatalf("payload inesperado: %+v", out)
	}

	// Sem DEV_MODE, mesmo admin recebe 403
	srv.cfg.DevMode = false
	off := reqJSON(srv.Handler(), "POST", "/api/v1/dev/seed", nil, admCookies)
	if off.Code != http.StatusForbidden {
		t.Fatalf("esperado 403 com DEV_MODE desligado, obtido %d", off.Code)
	}
	var offOut struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(off.Body.Bytes(), &offOut); err != nil {
		t.Fatalf("resposta inválida: %v", err)
	}
	if offOut.Error != "Disponível apenas em DEV_MODE." {
		t.Fatalf("mensagem de erro inesperada: %q", offOut.Error)
	}
}
