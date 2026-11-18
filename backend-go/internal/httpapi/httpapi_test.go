package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"vystudiocraft/internal/authx"
	"vystudiocraft/internal/config"
	"vystudiocraft/internal/store"
)

func newTestServer(t *testing.T, signupOpen bool) (*Server, *store.DB) {
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
		AppOrigin:   "http://localhost:8080",
		SessionDays: 30,
		UploadMaxMB: 10,
		DevMode:     true,
		SignupOpen:  signupOpen,
	}
	return New(db, cfg), db
}

func reqJSON(h http.Handler, method, path string, body any, cookies []*http.Cookie) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		_ = json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestBootstrapAdminAndClosedSignup(t *testing.T) {
	srv, _ := newTestServer(t, false)
	// First user succeeds (bootstrap)
	rec1 := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "admin@vystudiocraft.local", "password": "Password123", "name": "Admin",
	}, nil)
	if rec1.Code != http.StatusCreated {
		t.Fatalf("esperado 201 no bootstrap, obtido %d", rec1.Code)
	}
	// Second user blocked when SIGNUP_OPEN=false
	rec2 := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "outro@vystudiocraft.local", "password": "Password123", "name": "Outro",
	}, nil)
	if rec2.Code != http.StatusForbidden {
		t.Fatalf("esperado 403 com signup fechado, obtido %d", rec2.Code)
	}
}

func TestMFAAndPasswordReset(t *testing.T) {
	srv, db := newTestServer(t, true)
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "admin@vystudiocraft.local", "password": "Password123", "name": "Admin",
	}, nil)
	cookies := rec.Result().Cookies()

	// Reauth + MFA start + enroll
	_ = reqJSON(srv.Handler(), "POST", "/api/v1/auth/reauth", map[string]any{"password": "Password123"}, cookies)
	startRec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/start", nil, cookies)
	var startOut struct{ Secret string `json:"secret"` }
	_ = json.Unmarshal(startRec.Body.Bytes(), &startOut)
	code, _ := authx.TOTPCode(startOut.Secret, time.Now())
	enrollRec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/enroll", map[string]any{
		"secret": startOut.Secret, "code": code,
	}, cookies)
	if enrollRec.Code != http.StatusOK {
		t.Fatalf("enroll MFA falhou: %d %s", enrollRec.Code, enrollRec.Body.String())
	}

	// Login triggers MFA challenge, wrong code keeps ticket alive, right code succeeds
	loginRec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "admin@vystudiocraft.local", "password": "Password123",
	}, nil)
	var loginOut struct {
		MfaRequired bool   `json:"mfaRequired"`
		Ticket      string `json:"ticket"`
	}
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginOut)
	if !loginOut.MfaRequired || loginOut.Ticket == "" {
		t.Fatalf("esperado mfaRequired=true")
	}

	badRec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/login", map[string]any{
		"ticket": loginOut.Ticket, "code": "999999",
	}, nil)
	if badRec.Code != http.StatusUnauthorized && code != "999999" {
		t.Fatalf("código inválido deveria falhar")
	}
	if p, _ := db.GetPendingLogin(loginOut.Ticket); p == nil {
		t.Fatalf("ticket não deve ser consumido em tentativa errada")
	}

	goodRec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/login", map[string]any{
		"ticket": loginOut.Ticket, "code": code,
	}, nil)
	if goodRec.Code != http.StatusOK {
		t.Fatalf("MFA login válido falhou: %d", goodRec.Code)
	}
}

func TestDocsRBACFilesAndNoBilling(t *testing.T) {
	srv, _ := newTestServer(t, true)
	// Admin
	recAdm := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "admin@vystudiocraft.local", "password": "Password123", "name": "Admin",
	}, nil)
	admCookies := recAdm.Result().Cookies()

	// Regular user
	recUsr := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "user@vystudiocraft.local", "password": "Password123", "name": "User",
	}, nil)
	var usrOut struct{ User store.User `json:"user"` }
	_ = json.Unmarshal(recUsr.Body.Bytes(), &usrOut)
	usrCookies := recUsr.Result().Cookies()

	// Create doc + subcollection
	cr := reqJSON(srv.Handler(), "POST", "/api/v1/fs/usuarios/"+usrOut.User.ID+"/projetos", map[string]any{
		"data": map[string]any{"titulo": "Video 1", "views": 10},
	}, usrCookies)
	if cr.Code != http.StatusCreated {
		t.Fatalf("createDoc falhou: %d", cr.Code)
	}

	// Admin cannot be written by regular user in planos
	forb := reqJSON(srv.Handler(), "PUT", "/api/v1/fs/planos/catalogo", map[string]any{
		"data": map[string]any{"x": 1},
	}, usrCookies)
	if forb.Code != http.StatusForbidden {
		t.Fatalf("esperado 403 para usuário comum em planos, obtido %d", forb.Code)
	}

	// Files upload in both prefix list formats + isolation
	reqUp := httptest.NewRequest("PUT", "/api/v1/files/usuarios/"+usrOut.User.ID+"/nota.txt?name=nota.txt", strings.NewReader("conteudo"))
	for _, c := range usrCookies {
		reqUp.AddCookie(c)
	}
	recUp := httptest.NewRecorder()
	srv.Handler().ServeHTTP(recUp, reqUp)
	if recUp.Code != http.StatusCreated {
		t.Fatalf("upload falhou: %d", recUp.Code)
	}

	list1 := reqJSON(srv.Handler(), "GET", "/api/v1/files?prefix=usuarios/"+usrOut.User.ID, nil, admCookies)
	list2 := reqJSON(srv.Handler(), "GET", "/api/v1/files/?prefix=usuarios/"+usrOut.User.ID, nil, admCookies)
	if list1.Code != http.StatusOK || list2.Code != http.StatusOK {
		t.Fatalf("list files falhou: %d / %d", list1.Code, list2.Code)
	}

	// Feed invalid URL -> 400
	badFeed := reqJSON(srv.Handler(), "GET", "/api/feed?url=ftp://invalido", nil, usrCookies)
	if badFeed.Code != http.StatusBadRequest {
		t.Fatalf("esperado 400 para esquema inválido no feed, obtido %d", badFeed.Code)
	}

	// Billing routes must return 404
	bill := reqJSON(srv.Handler(), "GET", "/api/v1/billing/checkout", nil, admCookies)
	if bill.Code != http.StatusNotFound {
		t.Fatalf("esperado 404 para rota de billing inexistente, obtido %d", bill.Code)
	}
}

// TRN-R08: proxy RSS exige sessão válida
func TestFeedRequiresSession_TRN_R08(t *testing.T) {
	srv, _ := newTestServer(t, false)
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "u@vystudiocraft.local", "password": "Password123", "name": "U",
	}, nil)
	cookies := rec.Result().Cookies()

	anon := reqJSON(srv.Handler(), "GET", "/api/feed?url=https://example.com/rss", nil, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 sem sessão, obtido %d", anon.Code)
	}
	anon2 := reqJSON(srv.Handler(), "GET", "/feed?url=https://example.com/rss", nil, nil)
	if anon2.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401 sem sessão em /feed, obtido %d", anon2.Code)
	}
	// com sessão, a guarda passa e a validação de URL responde 400
	authed := reqJSON(srv.Handler(), "GET", "/api/feed?url=ftp://invalido", nil, cookies)
	if authed.Code != http.StatusBadRequest {
		t.Fatalf("esperado 400 autenticado com scheme inválido, obtido %d", authed.Code)
	}
}
