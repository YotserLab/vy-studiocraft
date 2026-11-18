package httpapi

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"vystudiocraft/internal/authx"
	"vystudiocraft/internal/config"
	"vystudiocraft/internal/store"

	_ "modernc.org/sqlite"
)

// =============================================================
// Helpers exclusivos deste arquivo (prefixo authRules para não
// colidir com helpers de outros testes do pacote).
// =============================================================

// newAuthRulesServer sobe um Server com sqlite em arquivo temporário e devolve
// também o dbPath, para manipular linhas (expirar sessões/tickets) via SQL.
func newAuthRulesServer(t *testing.T, mutate func(*config.Config)) (*Server, *store.DB, string) {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")
	db, err := store.Open(dbPath)
	if err != nil {
		t.Fatalf("Open db falhou: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	cfg := config.Config{
		DataDir:     dir,
		WebDir:      dir,
		MediaDir:    dir,
		AdminEmail:  "admin@vystudiocraft.local",
		AppOrigin:   "http://localhost:34568",
		SessionDays: 30,
		UploadMaxMB: 10,
		DevMode:     true,
		SignupOpen:  true,
	}
	if mutate != nil {
		mutate(&cfg)
	}
	return New(db, cfg), db, dbPath
}

// authRulesExecSQL executa UPDATE/DELETE direto no sqlite do teste.
func authRulesExecSQL(t *testing.T, dbPath, query string, args ...any) {
	t.Helper()
	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("sql.Open falhou: %v", err)
	}
	defer func() { _ = conn.Close() }()
	if _, err := conn.Exec(query, args...); err != nil {
		t.Fatalf("exec %q falhou: %v", query, err)
	}
}

// authRulesQueryInt64 lê um int64 do sqlite do teste.
func authRulesQueryInt64(t *testing.T, dbPath, query string, args ...any) int64 {
	t.Helper()
	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("sql.Open falhou: %v", err)
	}
	defer func() { _ = conn.Close() }()
	var v int64
	if err := conn.QueryRow(query, args...).Scan(&v); err != nil {
		t.Fatalf("query %q falhou: %v", query, err)
	}
	return v
}

// authRulesReq envia request JSON aceitando um mutator (headers, cookies...).
func authRulesReq(h http.Handler, method, path string, body any, mutate func(*http.Request)) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		_ = json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	if mutate != nil {
		mutate(req)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func authRulesCookie(token string) func(*http.Request) {
	return func(r *http.Request) {
		r.AddCookie(&http.Cookie{Name: cookieName, Value: token})
	}
}

func authRulesBearer(token string) func(*http.Request) {
	return func(r *http.Request) {
		r.Header.Set("Authorization", "Bearer "+token)
	}
}

// authRulesSignup cria usuário via POST /signup e devolve o token de sessão.
func authRulesSignup(t *testing.T, h http.Handler, email, password string) (string, *httptest.ResponseRecorder) {
	t.Helper()
	rec := reqJSON(h, "POST", "/api/v1/auth/signup", map[string]any{
		"email": email, "password": password, "name": "T",
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup %s falhou: %d %s", email, rec.Code, rec.Body.String())
	}
	var out struct {
		Token string `json:"token"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if out.Token == "" {
		t.Fatalf("signup %s não devolveu token", email)
	}
	return out.Token, rec
}

// authRulesSignupUser devolve o objeto user do response de signup.
func authRulesSignupUser(t *testing.T, rec *httptest.ResponseRecorder) store.User {
	t.Helper()
	var out struct {
		User store.User `json:"user"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("parse user do signup falhou: %v", err)
	}
	return out.User
}

// authRulesBadTOTP devolve um código de 6 dígitos inválido para o secret.
func authRulesBadTOTP(t *testing.T, secret string) string {
	t.Helper()
	for i := 0; i < 1000000; i++ {
		cand := fmt.Sprintf("%06d", i)
		if !authx.CheckTOTP(secret, cand, time.Now()) {
			return cand
		}
	}
	t.Fatalf("não encontrou TOTP inválido")
	return ""
}

// authRulesEnrollMFA faz reauth -> mfa/start -> mfa/enroll e devolve o secret.
func authRulesEnrollMFA(t *testing.T, h http.Handler, sessionToken, password string) string {
	t.Helper()
	re := authRulesReq(h, "POST", "/api/v1/auth/reauth",
		map[string]any{"password": password}, authRulesCookie(sessionToken))
	if re.Code != http.StatusOK {
		t.Fatalf("reauth falhou: %d %s", re.Code, re.Body.String())
	}
	st := authRulesReq(h, "POST", "/api/v1/auth/mfa/start", nil, authRulesCookie(sessionToken))
	if st.Code != http.StatusOK {
		t.Fatalf("mfa/start falhou: %d %s", st.Code, st.Body.String())
	}
	var startOut struct {
		Secret string `json:"secret"`
	}
	_ = json.Unmarshal(st.Body.Bytes(), &startOut)
	code, err := authx.TOTPCode(startOut.Secret, time.Now())
	if err != nil {
		t.Fatalf("TOTPCode falhou: %v", err)
	}
	en := authRulesReq(h, "POST", "/api/v1/auth/mfa/enroll",
		map[string]any{"secret": startOut.Secret, "code": code}, authRulesCookie(sessionToken))
	if en.Code != http.StatusOK {
		t.Fatalf("mfa/enroll falhou: %d %s", en.Code, en.Body.String())
	}
	return startOut.Secret
}

// authRulesMFALoginTicket faz login em conta com MFA e devolve o ticket.
func authRulesMFALoginTicket(t *testing.T, h http.Handler, email, password string) string {
	t.Helper()
	rec := reqJSON(h, "POST", "/api/v1/auth/login",
		map[string]any{"email": email, "password": password}, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("login falhou: %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		MfaRequired bool   `json:"mfaRequired"`
		Ticket      string `json:"ticket"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if !out.MfaRequired || out.Ticket == "" {
		t.Fatalf("esperado mfaRequired+ticket, obtido %s", rec.Body.String())
	}
	return out.Ticket
}

func authRulesSessionCookie(t *testing.T, rec *httptest.ResponseRecorder) *http.Cookie {
	t.Helper()
	for _, c := range rec.Result().Cookies() {
		if c.Name == cookieName {
			return c
		}
	}
	return nil
}

// =============================================================
// CON-R01: signup só se SIGNUP_OPEN=true ou bootstrap (0 usuários).
// Bootstrap + signup fechado já cobertos por TestBootstrapAdminAndClosedSignup;
// aqui cobrimos o braço SIGNUP_OPEN=true com usuários já existentes.
// =============================================================
func TestAuthRules_CONR01_SignupOpenBeyondBootstrap(t *testing.T) {
	srv, _, _ := newAuthRulesServer(t, nil) // SignupOpen=true
	authRulesSignup(t, srv.Handler(), "primeiro@x.dev", "123456")
	// Com SIGNUP_OPEN=true, cadastros subsequentes continuam permitidos.
	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "segundo@x.dev", "password": "123456",
	}, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("CON-R01: signup aberto deveria permitir 2º usuário, obtido %d", rec.Code)
	}
}

// =============================================================
// CON-R02: cadastro exige e-mail não vazio e senha >= 6.
// =============================================================
func TestAuthRules_CONR02_SignupValidation(t *testing.T) {
	srv, _, _ := newAuthRulesServer(t, nil)
	cases := []map[string]any{
		{"email": "", "password": "123456"},       // e-mail vazio
		{"email": "   ", "password": "123456"},    // e-mail só espaços
		{"password": "123456"},                    // e-mail ausente
		{"email": "a@b.dev", "password": "12345"}, // senha 5 chars
		{"email": "a@b.dev", "password": ""},      // senha vazia
		{"email": "a@b.dev"},                      // senha ausente
	}
	for i, body := range cases {
		rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", body, nil)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("CON-R02 caso %d: esperado 400, obtido %d (%s)", i, rec.Code, rec.Body.String())
		}
	}
	// Limite inferior: senha com exatamente 6 caracteres passa.
	ok := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "ok@x.dev", "password": "123456",
	}, nil)
	if ok.Code != http.StatusCreated {
		t.Fatalf("CON-R02: senha de 6 chars deveria passar, obtido %d", ok.Code)
	}
}

// =============================================================
// CON-R03: e-mail normalizado (lowercase+trim) e único; duplicado -> 409.
// =============================================================
func TestAuthRules_CONR03_EmailNormalizedUnique(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	_, rec := authRulesSignup(t, srv.Handler(), "  MiXeD@Case.Dev  ", "123456")
	u := authRulesSignupUser(t, rec)
	if u.Email != "mixed@case.dev" {
		t.Fatalf("CON-R03: e-mail deveria ser normalizado, obtido %q", u.Email)
	}
	stored, err := db.GetUserByEmail("MIXED@CASE.DEV")
	if err != nil || stored == nil {
		t.Fatalf("CON-R03: lookup por e-mail normalizado falhou: %v", err)
	}
	dup := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
		"email": "mixed@CASE.dev", "password": "654321",
	}, nil)
	if dup.Code != http.StatusConflict {
		t.Fatalf("CON-R03: duplicado deveria retornar 409, obtido %d", dup.Code)
	}
}

// =============================================================
// CON-R04: is_admin no bootstrap (1º usuário) ou e-mail == ADMIN_EMAIL.
// =============================================================
func TestAuthRules_CONR04_AdminAssignment(t *testing.T) {
	srv, _, _ := newAuthRulesServer(t, nil)
	signupIsAdmin := func(email string) bool {
		t.Helper()
		rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/signup", map[string]any{
			"email": email, "password": "123456",
		}, nil)
		if rec.Code != http.StatusCreated {
			t.Fatalf("signup %s falhou: %d", email, rec.Code)
		}
		return authRulesSignupUser(t, rec).IsAdmin
	}
	if !signupIsAdmin("comum1@x.dev") {
		t.Fatalf("CON-R04: bootstrap (1º usuário) deveria ser admin mesmo sem ADMIN_EMAIL")
	}
	if !signupIsAdmin("admin@vystudiocraft.local") {
		t.Fatalf("CON-R04: cadastro com ADMIN_EMAIL deveria receber is_admin")
	}
	if signupIsAdmin("comum2@x.dev") {
		t.Fatalf("CON-R04: usuário comum não-bootstrap não deveria ser admin")
	}
}

// =============================================================
// CON-R05: login 401 "Credenciais inválidas" indistinto para e-mail
// inexistente ou senha errada. Borda: reauth com senha errada -> 401.
// =============================================================
func TestAuthRules_CONR05_Login401Indistinct(t *testing.T) {
	srv, _, _ := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "user@x.dev", "Senha123")

	wrongPass := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "user@x.dev", "password": "Errada99",
	}, nil)
	noUser := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "ghost@x.dev", "password": "Senha123",
	}, nil)
	if wrongPass.Code != http.StatusUnauthorized || noUser.Code != http.StatusUnauthorized {
		t.Fatalf("CON-R05: esperado 401 em ambos, obtido %d / %d", wrongPass.Code, noUser.Code)
	}
	var e1, e2 map[string]any
	_ = json.Unmarshal(wrongPass.Body.Bytes(), &e1)
	_ = json.Unmarshal(noUser.Body.Bytes(), &e2)
	if e1["error"] != e2["error"] {
		t.Fatalf("CON-R05: respostas deveriam ser indistintas: %q vs %q", e1["error"], e2["error"])
	}

	// Borda: reauth com senha errada também retorna 401.
	re := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/reauth",
		map[string]any{"password": "Errada99"}, authRulesCookie(token))
	if re.Code != http.StatusUnauthorized {
		t.Fatalf("CON-R05 (reauth): esperado 401, obtido %d", re.Code)
	}
}

// =============================================================
// CON-R08: sessão dura SESSION_DAYS (30d); aceita cookie, Bearer ou ?token=.
// =============================================================
func TestAuthRules_CONR08_SessionTTLAndTransports(t *testing.T) {
	srv, db, dbPath := newAuthRulesServer(t, nil)
	token, rec := authRulesSignup(t, srv.Handler(), "s@x.dev", "123456")

	// TTL ~30 dias persistido em sessions.expires_at.
	sess, err := db.GetSession(token)
	if err != nil || sess == nil {
		t.Fatalf("CON-R08: sessão não encontrada: %v", err)
	}
	want := int64(30) * 24 * 3600 * 1000
	if delta := sess.ExpiresAt - time.Now().UnixMilli(); delta < want-60_000 || delta > want+60_000 {
		t.Fatalf("CON-R08: expires_at deveria ser ~30d, delta=%dms", delta)
	}
	// Cookie Max-Age espelha os 30 dias.
	c := authRulesSessionCookie(t, rec)
	if c == nil || c.MaxAge != 30*24*3600 {
		t.Fatalf("CON-R08: cookie MaxAge esperado %d, obtido %+v", 30*24*3600, c)
	}

	// Os três transportes de sessão autenticam o mesmo usuário.
	for name, rec := range map[string]*httptest.ResponseRecorder{
		"cookie": authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesCookie(token)),
		"bearer": authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesBearer(token)),
		"query":  authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me?token="+token, nil, nil),
	} {
		if rec.Code != http.StatusOK {
			t.Fatalf("CON-R08 (%s): esperado 200, obtido %d", name, rec.Code)
		}
		var out struct {
			User store.User `json:"user"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &out)
		if out.User.Email != "s@x.dev" {
			t.Fatalf("CON-R08 (%s): usuário errado %q", name, out.User.Email)
		}
	}

	// Token inválido -> 401.
	bad := authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesBearer("deadbeef"))
	if bad.Code != http.StatusUnauthorized {
		t.Fatalf("CON-R08: token inválido deveria dar 401, obtido %d", bad.Code)
	}

	// Sessão expirada -> 401 e linha removida do banco.
	authRulesExecSQL(t, dbPath,
		`UPDATE sessions SET expires_at = ? WHERE token = ?`,
		time.Now().UnixMilli()-1000, token)
	exp := authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesCookie(token))
	if exp.Code != http.StatusUnauthorized {
		t.Fatalf("CON-R08: sessão expirada deveria dar 401, obtido %d", exp.Code)
	}
	if s2, _ := db.GetSession(token); s2 != nil {
		t.Fatalf("CON-R08: sessão expirada deveria ser removida do banco")
	}
}

// =============================================================
// CON-R15: pass_hash persistido como pbkdf2_sha256$100000$salt$hash.
// (o formato da função em si também é coberto em authx/crypto_rules_test.go)
// =============================================================
func TestAuthRules_CONR15_StoredHashFormat(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	authRulesSignup(t, srv.Handler(), "hash@x.dev", "Segredo99")
	u, err := db.GetUserByEmail("hash@x.dev")
	if err != nil || u == nil {
		t.Fatalf("CON-R15: usuário não encontrado: %v", err)
	}
	parts := strings.Split(u.PassHash, "$")
	if len(parts) != 4 || parts[0] != "pbkdf2_sha256" || parts[1] != "100000" {
		t.Fatalf("CON-R15: formato de hash inesperado %q", u.PassHash)
	}
	if !authx.CheckPassword("Segredo99", u.PassHash) {
		t.Fatalf("CON-R15: senha correta deveria validar contra o hash persistido")
	}
}

// =============================================================
// CON-R17: identidade vem da sessão validada; uid enviado pelo
// cliente (no path) é ignorado para autorização.
// =============================================================
func TestAuthRules_CONR17_IdentityFromSession(t *testing.T) {
	srv, _, _ := newAuthRulesServer(t, nil)
	tokA, recA := authRulesSignup(t, srv.Handler(), "a@x.dev", "123456")
	uidA := authRulesSignupUser(t, recA).ID
	tokB, recB := authRulesSignup(t, srv.Handler(), "b@x.dev", "123456")
	uidB := authRulesSignupUser(t, recB).ID
	_ = tokA

	// /me identifica B pela sessão, não por parâmetro algum do cliente.
	me := authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesCookie(tokB))
	var meOut struct {
		User store.User `json:"user"`
	}
	_ = json.Unmarshal(me.Body.Bytes(), &meOut)
	if meOut.User.ID != uidB {
		t.Fatalf("CON-R17: /me deveria resolver a sessão de B")
	}
	// B não lê coleção de A mesmo com o uid de A no path.
	fs := authRulesReq(srv.Handler(), "GET", "/api/v1/fs/usuarios/"+uidA+"/projetos",
		nil, authRulesCookie(tokB))
	if fs.Code != http.StatusForbidden {
		t.Fatalf("CON-R17: esperado 403 lendo docs de outro uid, obtido %d", fs.Code)
	}
	// B não escreve arquivo no prefixo de A.
	up := authRulesReq(srv.Handler(), "PUT", "/api/v1/files/usuarios/"+uidA+"/n.txt",
		map[string]any{"x": 1}, authRulesCookie(tokB))
	if up.Code != http.StatusForbidden {
		t.Fatalf("CON-R17: esperado 403 em upload no prefixo de outro uid, obtido %d", up.Code)
	}
}

// =============================================================
// CON-R10: reset cria token de 1h e responde mensagem genérica
// mesmo se o e-mail não existir.
// =============================================================
func TestAuthRules_CONR10_ResetRequestGeneric(t *testing.T) {
	srv, _, dbPath := newAuthRulesServer(t, nil)
	authRulesSignup(t, srv.Handler(), "reset@x.dev", "123456")

	recExists := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset", map[string]any{
		"email": "reset@x.dev",
	}, nil)
	recGhost := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset", map[string]any{
		"email": "ghost@x.dev",
	}, nil)
	if recExists.Code != http.StatusOK || recGhost.Code != http.StatusOK {
		t.Fatalf("CON-R10: esperado 200 em ambos, obtido %d / %d", recExists.Code, recGhost.Code)
	}
	var m1, m2 map[string]any
	_ = json.Unmarshal(recExists.Body.Bytes(), &m1)
	_ = json.Unmarshal(recGhost.Body.Bytes(), &m2)
	if m1["message"] != m2["message"] || m1["message"] == "" {
		t.Fatalf("CON-R10: mensagem genérica deveria ser idêntica: %q vs %q", m1["message"], m2["message"])
	}
	// Em DEV_MODE, o debugLink só sai para e-mail existente (comportamento atual).
	link, hasLink := m1["debugLink"].(string)
	if !hasLink || link == "" {
		t.Fatalf("CON-R10: DEV_MODE deveria incluir debugLink para e-mail cadastrado")
	}
	if _, has := m2["debugLink"]; has {
		t.Fatalf("CON-R10: e-mail inexistente não deveria gerar debugLink")
	}

	// Token persistido com TTL de ~1h.
	parsed, err := url.Parse(link)
	if err != nil {
		t.Fatalf("CON-R10: debugLink inválido %q: %v", link, err)
	}
	resetTok := parsed.Query().Get("token")
	if resetTok == "" {
		t.Fatalf("CON-R10: debugLink sem token: %q", link)
	}
	exp := authRulesQueryInt64(t, dbPath,
		`SELECT expires_at FROM password_resets WHERE token = ?`, resetTok)
	if delta := exp - time.Now().UnixMilli(); delta < 59*60_000 || delta > 61*60_000 {
		t.Fatalf("CON-R10: expires_at deveria ser ~1h, delta=%dms", delta)
	}

	// E-mail vazio -> 400.
	empty := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset", map[string]any{"email": "  "}, nil)
	if empty.Code != http.StatusBadRequest {
		t.Fatalf("CON-R10: e-mail vazio deveria dar 400, obtido %d", empty.Code)
	}

	// Sem DEV_MODE, não há debugLink nem para e-mail existente.
	srv2, _, _ := newAuthRulesServer(t, func(c *config.Config) { c.DevMode = false })
	authRulesSignup(t, srv2.Handler(), "r2@x.dev", "123456")
	rec2 := reqJSON(srv2.Handler(), "POST", "/api/v1/auth/reset", map[string]any{
		"email": "r2@x.dev",
	}, nil)
	var m3 map[string]any
	_ = json.Unmarshal(rec2.Body.Bytes(), &m3)
	if _, has := m3["debugLink"]; has {
		t.Fatalf("CON-R10: sem DEV_MODE não deveria haver debugLink")
	}
}

// =============================================================
// CON-R11: confirmar reset consome o token, troca a senha e apaga
// todas as sessões do usuário.
// =============================================================
func TestAuthRules_CONR11_ResetConfirm(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	oldToken, _ := authRulesSignup(t, srv.Handler(), "rc@x.dev", "OldPass1")

	// Segunda sessão do mesmo usuário (login) — todas devem cair.
	secondLogin := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "rc@x.dev", "password": "OldPass1",
	}, nil)
	var li struct {
		Token string `json:"token"`
	}
	_ = json.Unmarshal(secondLogin.Body.Bytes(), &li)
	secondToken := li.Token

	// Solicita reset e extrai o token do debugLink (DEV_MODE).
	req := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset", map[string]any{
		"email": "rc@x.dev",
	}, nil)
	var m map[string]any
	_ = json.Unmarshal(req.Body.Bytes(), &m)
	link, _ := m["debugLink"].(string)
	parsed, _ := url.Parse(link)
	resetTok := parsed.Query().Get("token")
	if resetTok == "" {
		t.Fatalf("CON-R11: não obteve token de reset")
	}

	// Senha curta -> 400 e NÃO consome o token.
	short := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset/confirm", map[string]any{
		"token": resetTok, "password": "12345",
	}, nil)
	if short.Code != http.StatusBadRequest {
		t.Fatalf("CON-R11: senha curta deveria dar 400, obtido %d", short.Code)
	}
	// Token inválido -> 400.
	bad := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset/confirm", map[string]any{
		"token": "nao-existe", "password": "NewPass9",
	}, nil)
	if bad.Code != http.StatusBadRequest {
		t.Fatalf("CON-R11: token inválido deveria dar 400, obtido %d", bad.Code)
	}
	// Confirmação válida -> 200.
	ok := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset/confirm", map[string]any{
		"token": resetTok, "password": "NewPass9",
	}, nil)
	if ok.Code != http.StatusOK {
		t.Fatalf("CON-R11: confirm válido deveria dar 200, obtido %d %s", ok.Code, ok.Body.String())
	}
	// Token é de uso único.
	reuse := reqJSON(srv.Handler(), "POST", "/api/v1/auth/reset/confirm", map[string]any{
		"token": resetTok, "password": "Outra123",
	}, nil)
	if reuse.Code != http.StatusBadRequest {
		t.Fatalf("CON-R11: reuso de token deveria dar 400, obtido %d", reuse.Code)
	}
	// Todas as sessões do usuário foram apagadas.
	for _, tok := range []string{oldToken, secondToken} {
		if s, _ := db.GetSession(tok); s != nil {
			t.Fatalf("CON-R11: sessão %s deveria ter sido apagada", tok)
		}
		me := authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesCookie(tok))
		if me.Code != http.StatusUnauthorized {
			t.Fatalf("CON-R11: sessão antiga deveria dar 401, obtido %d", me.Code)
		}
	}
	// Senha antiga não loga mais; a nova loga.
	oldLogin := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "rc@x.dev", "password": "OldPass1",
	}, nil)
	newLogin := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "rc@x.dev", "password": "NewPass9",
	}, nil)
	if oldLogin.Code != http.StatusUnauthorized || newLogin.Code != http.StatusOK {
		t.Fatalf("CON-R11: senhas pós-reset: old=%d new=%d", oldLogin.Code, newLogin.Code)
	}
}

// =============================================================
// CON-R12: logout apaga a sessão no banco e expira o cookie vysc_sess.
// =============================================================
func TestAuthRules_CONR12_Logout(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "lo@x.dev", "123456")

	out := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/logout", nil, authRulesCookie(token))
	if out.Code != http.StatusOK {
		t.Fatalf("CON-R12: logout deveria dar 200, obtido %d", out.Code)
	}
	c := authRulesSessionCookie(t, out)
	if c == nil || c.Value != "" || c.MaxAge >= 0 {
		t.Fatalf("CON-R12: cookie deveria ser expirado (MaxAge<0), obtido %+v", c)
	}
	if s, _ := db.GetSession(token); s != nil {
		t.Fatalf("CON-R12: sessão deveria ter sido apagada do banco")
	}
	me := authRulesReq(srv.Handler(), "GET", "/api/v1/auth/me", nil, authRulesCookie(token))
	if me.Code != http.StatusUnauthorized {
		t.Fatalf("CON-R12: /me pós-logout deveria dar 401, obtido %d", me.Code)
	}
	// Logout sem sessão também responde 200 (comportamento existente).
	anon := reqJSON(srv.Handler(), "POST", "/api/v1/auth/logout", nil, nil)
	if anon.Code != http.StatusOK {
		t.Fatalf("CON-R12: logout anônimo deveria dar 200, obtido %d", anon.Code)
	}
}

// =============================================================
// CON-R13: verify-email marca email_verified; debugLink só em DEV_MODE.
// =============================================================
func TestAuthRules_CONR13_VerifyEmail(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil) // DevMode=true
	token, _ := authRulesSignup(t, srv.Handler(), "v@x.dev", "123456")

	anon := reqJSON(srv.Handler(), "POST", "/api/v1/auth/verify-email", nil, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("CON-R13: verify-email anônimo deveria dar 401, obtido %d", anon.Code)
	}

	rec := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/verify-email", nil, authRulesCookie(token))
	if rec.Code != http.StatusOK {
		t.Fatalf("CON-R13: verify-email deveria dar 200, obtido %d", rec.Code)
	}
	var m map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &m)
	if _, has := m["debugLink"]; !has {
		t.Fatalf("CON-R13: DEV_MODE deveria incluir debugLink")
	}
	var out struct {
		User store.User `json:"user"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if !out.User.EmailVerified {
		t.Fatalf("CON-R13: user.emailVerified deveria ser true")
	}
	u, _ := db.GetUserByEmail("v@x.dev")
	if u == nil || !u.EmailVerified {
		t.Fatalf("CON-R13: email_verified deveria estar persistido")
	}

	// Sem DEV_MODE: mesma flag, mas sem debugLink.
	srv2, db2, _ := newAuthRulesServer(t, func(c *config.Config) { c.DevMode = false })
	tok2, _ := authRulesSignup(t, srv2.Handler(), "v2@x.dev", "123456")
	rec2 := authRulesReq(srv2.Handler(), "POST", "/api/v1/auth/verify-email", nil, authRulesCookie(tok2))
	var m2 map[string]any
	_ = json.Unmarshal(rec2.Body.Bytes(), &m2)
	if _, has := m2["debugLink"]; has {
		t.Fatalf("CON-R13: sem DEV_MODE não deveria haver debugLink")
	}
	u2, _ := db2.GetUserByEmail("v2@x.dev")
	if u2 == nil || !u2.EmailVerified {
		t.Fatalf("CON-R13: email_verified deveria ser marcado mesmo sem DEV_MODE")
	}
}

// =============================================================
// CON-R14: cookie Secure só em HTTPS; SameSite=None em HTTPS, Lax em HTTP.
// =============================================================
func TestAuthRules_CONR14_CookieFlagsByScheme(t *testing.T) {
	srv, _, _ := newAuthRulesServer(t, nil)
	authRulesSignup(t, srv.Handler(), "c@x.dev", "123456")

	loginCookie := func(mutate func(*http.Request)) *http.Cookie {
		t.Helper()
		rec := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/login",
			map[string]any{"email": "c@x.dev", "password": "123456"}, mutate)
		if rec.Code != http.StatusOK {
			t.Fatalf("CON-R14: login falhou: %d", rec.Code)
		}
		return authRulesSessionCookie(t, rec)
	}

	plain := loginCookie(nil)
	if plain == nil {
		t.Fatalf("CON-R14: resposta de login sem cookie de sessão")
	}
	if plain.Secure {
		t.Fatalf("CON-R14: HTTP não deveria marcar Secure")
	}
	if plain.SameSite != http.SameSiteLaxMode {
		t.Fatalf("CON-R14: HTTP deveria usar SameSite=Lax, obtido %v", plain.SameSite)
	}
	if !plain.HttpOnly || plain.Path != "/" {
		t.Fatalf("CON-R14: cookie deveria ser HttpOnly com Path=/, obtido %+v", plain)
	}

	secure := loginCookie(func(r *http.Request) {
		r.Header.Set("X-Forwarded-Proto", "https")
	})
	if secure == nil {
		t.Fatalf("CON-R14: resposta HTTPS sem cookie de sessão")
	}
	if !secure.Secure {
		t.Fatalf("CON-R14: HTTPS deveria marcar Secure")
	}
	if secure.SameSite != http.SameSiteNoneMode {
		t.Fatalf("CON-R14: HTTPS deveria usar SameSite=None, obtido %v", secure.SameSite)
	}
}

// =============================================================
// CON-R18: cada usuário tem doc membros/{uid} com papel, plano e
// status gerenciados pelo admin (docs semeados por store.SeedIfEnabled;
// RBAC: admin escreve qualquer membros/{uid}, criador só o próprio
// e nem lê a coleção).
// =============================================================
func TestAuthRules_CONR18_MembrosDoc(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, func(c *config.Config) { c.UseMockData = true })
	if err := store.SeedIfEnabled(db, srv.cfg); err != nil {
		t.Fatalf("CON-R18: seed falhou: %v", err)
	}

	loginToken := func(email, password string) string {
		t.Helper()
		rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login",
			map[string]any{"email": email, "password": password}, nil)
		if rec.Code != http.StatusOK {
			t.Fatalf("login %s falhou: %d", email, rec.Code)
		}
		var out struct {
			Token string `json:"token"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &out)
		return out.Token
	}
	adminTok := loginToken("admin@vystudiocraft.local", "Admin@1234")
	creatorTok := loginToken("creator@vystudiocraft.local", "Creator@1234")

	// Doc membros/{uid} existe com papel/plano/status (leitura como admin).
	doc := authRulesReq(srv.Handler(), "GET", "/api/v1/fs/membros/usr_admin_01",
		nil, authRulesCookie(adminTok))
	if doc.Code != http.StatusOK {
		t.Fatalf("CON-R18: GET membros/usr_admin_01 falhou: %d", doc.Code)
	}
	var docOut store.Doc
	_ = json.Unmarshal(doc.Body.Bytes(), &docOut)
	if !docOut.Exists {
		t.Fatalf("CON-R18: doc membros/usr_admin_01 deveria existir")
	}
	for _, field := range []string{"papel", "plano", "status"} {
		if _, ok := docOut.Data[field]; !ok {
			t.Fatalf("CON-R18: doc membros sem campo %q: %v", field, docOut.Data)
		}
	}
	if docOut.Data["papel"] != "admin" || docOut.Data["status"] != "ativo" {
		t.Fatalf("CON-R18: papel/status inesperados: %v", docOut.Data)
	}

	// Criador não lê nem escreve doc de outro membro (gerenciado pelo admin).
	getAsCreator := authRulesReq(srv.Handler(), "GET", "/api/v1/fs/membros/usr_admin_01",
		nil, authRulesCookie(creatorTok))
	if getAsCreator.Code != http.StatusForbidden {
		t.Fatalf("CON-R18: criador lendo membros alheio deveria dar 403, obtido %d", getAsCreator.Code)
	}
	putAsCreator := authRulesReq(srv.Handler(), "PUT", "/api/v1/fs/membros/usr_admin_01",
		map[string]any{"data": map[string]any{"status": "suspenso"}, "merge": true},
		authRulesCookie(creatorTok))
	if putAsCreator.Code != http.StatusForbidden {
		t.Fatalf("CON-R18: criador escrevendo membros alheio deveria dar 403, obtido %d", putAsCreator.Code)
	}

	// Admin gerencia papel/plano/status de qualquer membro.
	putAsAdmin := authRulesReq(srv.Handler(), "PUT", "/api/v1/fs/membros/usr_creator_02",
		map[string]any{"data": map[string]any{"papel": "editor", "status": "suspenso"}, "merge": true},
		authRulesCookie(adminTok))
	if putAsAdmin.Code != http.StatusOK {
		t.Fatalf("CON-R18: admin escrevendo membros deveria dar 200, obtido %d", putAsAdmin.Code)
	}
	check := authRulesReq(srv.Handler(), "GET", "/api/v1/fs/membros/usr_creator_02",
		nil, authRulesCookie(adminTok))
	var checkOut store.Doc
	_ = json.Unmarshal(check.Body.Bytes(), &checkOut)
	if checkOut.Data["papel"] != "editor" || checkOut.Data["status"] != "suspenso" {
		t.Fatalf("CON-R18: update do admin não persistiu: %v", checkOut.Data)
	}
}

// =============================================================
// MFA-R01: com MFA ativo, login retorna mfaRequired + ticket de
// 5 minutos em vez de criar sessão.
// =============================================================
func TestMfaRules_MFAR01_LoginChallenge(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "mfa@x.dev", "Senha123")
	authRulesEnrollMFA(t, srv.Handler(), token, "Senha123")

	rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/login", map[string]any{
		"email": "mfa@x.dev", "password": "Senha123",
	}, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("MFA-R01: login deveria dar 200, obtido %d", rec.Code)
	}
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if out["mfaRequired"] != true {
		t.Fatalf("MFA-R01: esperado mfaRequired=true, obtido %s", rec.Body.String())
	}
	ticket, _ := out["ticket"].(string)
	if ticket == "" {
		t.Fatalf("MFA-R01: ticket ausente")
	}
	if _, has := out["token"]; has {
		t.Fatalf("MFA-R01: login com MFA não deveria devolver token de sessão")
	}
	if c := authRulesSessionCookie(t, rec); c != nil {
		t.Fatalf("MFA-R01: login com MFA não deveria setar cookie de sessão")
	}
	// Ticket persistido com purpose=login e TTL ~5min.
	p, err := db.GetPendingLogin(ticket)
	if err != nil || p == nil {
		t.Fatalf("MFA-R01: pending login não encontrado: %v", err)
	}
	if p.Purpose != "login" {
		t.Fatalf("MFA-R01: purpose esperado 'login', obtido %q", p.Purpose)
	}
	if delta := p.ExpiresAt - time.Now().UnixMilli(); delta < 4*60_000 || delta > 6*60_000 {
		t.Fatalf("MFA-R01: ticket deveria expirar em ~5min, delta=%dms", delta)
	}
}

// =============================================================
// MFA-R02: ticket é de uso único, expira em 5min e tem purpose
// 'login' ou 'reauth' (ticket de um purpose não serve no outro).
// =============================================================
func TestMfaRules_MFAR02_TicketLifecycle(t *testing.T) {
	srv, db, dbPath := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "m2@x.dev", "Senha123")
	secret := authRulesEnrollMFA(t, srv.Handler(), token, "Senha123")

	t.Run("uso único", func(t *testing.T) {
		tk := authRulesMFALoginTicket(t, srv.Handler(), "m2@x.dev", "Senha123")
		code, err := authx.TOTPCode(secret, time.Now())
		if err != nil {
			t.Fatalf("TOTPCode: %v", err)
		}
		ok := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/login",
			map[string]any{"ticket": tk, "code": code}, nil)
		if ok.Code != http.StatusOK {
			t.Fatalf("MFA-R02: mfa/login válido deveria dar 200, obtido %d", ok.Code)
		}
		again := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/login",
			map[string]any{"ticket": tk, "code": code}, nil)
		if again.Code != http.StatusUnauthorized {
			t.Fatalf("MFA-R02: reuso de ticket deveria dar 401, obtido %d", again.Code)
		}
		if p, _ := db.GetPendingLogin(tk); p != nil {
			t.Fatalf("MFA-R02: ticket consumido deveria ser removido")
		}
	})

	t.Run("expira em 5 minutos", func(t *testing.T) {
		tk := authRulesMFALoginTicket(t, srv.Handler(), "m2@x.dev", "Senha123")
		authRulesExecSQL(t, dbPath,
			`UPDATE pending_logins SET expires_at = ? WHERE ticket = ?`,
			time.Now().UnixMilli()-1000, tk)
		code, _ := authx.TOTPCode(secret, time.Now())
		rec := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/login",
			map[string]any{"ticket": tk, "code": code}, nil)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("MFA-R02: ticket expirado deveria dar 401, obtido %d", rec.Code)
		}
	})

	t.Run("purpose errado", func(t *testing.T) {
		// Ticket 'reauth' não vale para mfa/login.
		re := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/reauth",
			map[string]any{"password": "Senha123"}, authRulesCookie(token))
		var reOut struct {
			Ticket string `json:"ticket"`
		}
		_ = json.Unmarshal(re.Body.Bytes(), &reOut)
		if reOut.Ticket == "" {
			t.Fatalf("MFA-R02: reauth de usuário MFA deveria devolver ticket")
		}
		code, _ := authx.TOTPCode(secret, time.Now())
		wrongPurpose := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/login",
			map[string]any{"ticket": reOut.Ticket, "code": code}, nil)
		if wrongPurpose.Code != http.StatusUnauthorized {
			t.Fatalf("MFA-R02: ticket 'reauth' em mfa/login deveria dar 401, obtido %d", wrongPurpose.Code)
		}
		// Ticket 'login' não vale para mfa/reauth.
		loginTk := authRulesMFALoginTicket(t, srv.Handler(), "m2@x.dev", "Senha123")
		wrongPurpose2 := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/reauth",
			map[string]any{"ticket": loginTk, "code": code}, authRulesCookie(token))
		if wrongPurpose2.Code != http.StatusUnauthorized {
			t.Fatalf("MFA-R02: ticket 'login' em mfa/reauth deveria dar 401, obtido %d", wrongPurpose2.Code)
		}
	})
}

// =============================================================
// MFA-R03: mfa/start, mfa/enroll e mfa/unenroll exigem reauth nos
// últimos 10 minutos.
// =============================================================
func TestMfaRules_MFAR03_RequiresRecentReauth(t *testing.T) {
	srv, _, dbPath := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "r3@x.dev", "Senha123")

	// Reauth "velho" (>10min): todas as operações MFA dão 403.
	stale := time.Now().UnixMilli() - 11*60*1000
	authRulesExecSQL(t, dbPath, `UPDATE sessions SET reauth_at = ? WHERE token = ?`, stale, token)
	for _, ep := range []string{"start", "enroll", "unenroll"} {
		var body any
		if ep == "enroll" {
			body = map[string]any{"secret": "ABCDEF", "code": "000000"}
		}
		rec := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/"+ep, body, authRulesCookie(token))
		if rec.Code != http.StatusForbidden {
			t.Fatalf("MFA-R03: mfa/%s com reauth velho deveria dar 403, obtido %d", ep, rec.Code)
		}
	}

	// Reauth recente volta a permitir (mfa/start -> 200).
	authRulesExecSQL(t, dbPath, `UPDATE sessions SET reauth_at = ? WHERE token = ?`,
		time.Now().UnixMilli(), token)
	ok := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/start", nil, authRulesCookie(token))
	if ok.Code != http.StatusOK {
		t.Fatalf("MFA-R03: mfa/start com reauth recente deveria dar 200, obtido %d", ok.Code)
	}

	// Sem sessão -> 401.
	anon := reqJSON(srv.Handler(), "POST", "/api/v1/auth/mfa/start", nil, nil)
	if anon.Code != http.StatusUnauthorized {
		t.Fatalf("MFA-R03: mfa/start anônimo deveria dar 401, obtido %d", anon.Code)
	}
}

// =============================================================
// MFA-R04: TOTP errado retorna 401 sem consumir o ticket; só o
// código válido consome. (lado mfa/reauth — o lado mfa/login já é
// coberto por TestMFAAndPasswordReset)
// =============================================================
func TestMfaRules_MFAR04_WrongTOTPKeepsTicket(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "r4@x.dev", "Senha123")
	secret := authRulesEnrollMFA(t, srv.Handler(), token, "Senha123")

	re := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/reauth",
		map[string]any{"password": "Senha123"}, authRulesCookie(token))
	var reOut struct {
		Ticket string `json:"ticket"`
	}
	_ = json.Unmarshal(re.Body.Bytes(), &reOut)
	if reOut.Ticket == "" {
		t.Fatalf("MFA-R04: reauth deveria devolver ticket para usuário MFA")
	}

	bad := authRulesBadTOTP(t, secret)
	badRec := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/reauth",
		map[string]any{"ticket": reOut.Ticket, "code": bad}, authRulesCookie(token))
	if badRec.Code != http.StatusUnauthorized {
		t.Fatalf("MFA-R04: TOTP errado deveria dar 401, obtido %d", badRec.Code)
	}
	if p, _ := db.GetPendingLogin(reOut.Ticket); p == nil {
		t.Fatalf("MFA-R04: ticket não deveria ser consumido em tentativa errada")
	}

	good, err := authx.TOTPCode(secret, time.Now())
	if err != nil {
		t.Fatalf("TOTPCode: %v", err)
	}
	ok := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/reauth",
		map[string]any{"ticket": reOut.Ticket, "code": good}, authRulesCookie(token))
	if ok.Code != http.StatusOK {
		t.Fatalf("MFA-R04: TOTP válido deveria dar 200, obtido %d", ok.Code)
	}
	if p, _ := db.GetPendingLogin(reOut.Ticket); p != nil {
		t.Fatalf("MFA-R04: ticket deveria ser consumido após código válido")
	}
}

// =============================================================
// MFA-R05: mfa/enroll só grava o secret após validar um TOTP correto.
// =============================================================
func TestMfaRules_MFAR05_EnrollValidatesBeforePersist(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	token, rec := authRulesSignup(t, srv.Handler(), "r5@x.dev", "Senha123")
	uid := authRulesSignupUser(t, rec).ID

	secret, err := authx.NewTOTPSecret()
	if err != nil {
		t.Fatalf("NewTOTPSecret: %v", err)
	}
	bad := authRulesBadTOTP(t, secret)
	badEnroll := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/enroll",
		map[string]any{"secret": secret, "code": bad}, authRulesCookie(token))
	if badEnroll.Code != http.StatusBadRequest {
		t.Fatalf("MFA-R05: enroll com TOTP errado deveria dar 400, obtido %d", badEnroll.Code)
	}
	u, _ := db.GetUserByID(uid)
	if u == nil || u.MFASecret != nil {
		t.Fatalf("MFA-R05: secret não deveria ser gravado antes de validar TOTP")
	}

	good, err := authx.TOTPCode(secret, time.Now())
	if err != nil {
		t.Fatalf("TOTPCode: %v", err)
	}
	okEnroll := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/enroll",
		map[string]any{"secret": secret, "code": good}, authRulesCookie(token))
	if okEnroll.Code != http.StatusOK {
		t.Fatalf("MFA-R05: enroll com TOTP válido deveria dar 200, obtido %d", okEnroll.Code)
	}
	u2, _ := db.GetUserByID(uid)
	if u2 == nil || u2.MFASecret == nil || *u2.MFASecret != secret {
		t.Fatalf("MFA-R05: secret deveria estar persistido após enroll válido")
	}
}

// =============================================================
// MFA-R06: mfa/start emite secret novo sem persistir; persistência
// só ocorre no enroll.
// =============================================================
func TestMfaRules_MFAR06_StartDoesNotPersist(t *testing.T) {
	srv, db, _ := newAuthRulesServer(t, nil)
	token, rec := authRulesSignup(t, srv.Handler(), "r6@x.dev", "Senha123")
	uid := authRulesSignupUser(t, rec).ID

	readSecret := func() string {
		t.Helper()
		st := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/start", nil, authRulesCookie(token))
		if st.Code != http.StatusOK {
			t.Fatalf("MFA-R06: mfa/start falhou: %d", st.Code)
		}
		var out struct {
			Secret string `json:"secret"`
		}
		_ = json.Unmarshal(st.Body.Bytes(), &out)
		return out.Secret
	}

	s1 := readSecret()
	if s1 == "" {
		t.Fatalf("MFA-R06: mfa/start deveria devolver secret")
	}
	u, _ := db.GetUserByID(uid)
	if u == nil || u.MFASecret != nil || u.MFAEnabled {
		t.Fatalf("MFA-R06: mfa/start não deveria persistir secret")
	}
	s2 := readSecret()
	if s2 == "" || s2 == s1 {
		t.Fatalf("MFA-R06: cada start deveria emitir secret novo")
	}
	u2, _ := db.GetUserByID(uid)
	if u2 == nil || u2.MFASecret != nil {
		t.Fatalf("MFA-R06: secret continua não persistido após novo start")
	}
}

// =============================================================
// MFA-R07: mfa/reauth com ticket e código válidos atualiza o
// reauth_at da sessão.
// =============================================================
func TestMfaRules_MFAR07_ReauthUpdatesReauthAt(t *testing.T) {
	srv, db, dbPath := newAuthRulesServer(t, nil)
	token, _ := authRulesSignup(t, srv.Handler(), "r7@x.dev", "Senha123")
	secret := authRulesEnrollMFA(t, srv.Handler(), token, "Senha123")

	// Envelhece o reauth_at da sessão para provar a atualização depois.
	old := time.Now().UnixMilli() - 60*60*1000
	authRulesExecSQL(t, dbPath, `UPDATE sessions SET reauth_at = ? WHERE token = ?`, old, token)

	// Usuário com MFA: reauth por senha devolve ticket em vez de tocar reauth_at.
	re := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/reauth",
		map[string]any{"password": "Senha123"}, authRulesCookie(token))
	var reOut struct {
		MfaRequired bool   `json:"mfaRequired"`
		Ticket      string `json:"ticket"`
	}
	_ = json.Unmarshal(re.Body.Bytes(), &reOut)
	if !reOut.MfaRequired || reOut.Ticket == "" {
		t.Fatalf("MFA-R07: reauth de usuário MFA deveria exigir ticket, obtido %s", re.Body.String())
	}

	code, err := authx.TOTPCode(secret, time.Now())
	if err != nil {
		t.Fatalf("TOTPCode: %v", err)
	}
	ok := authRulesReq(srv.Handler(), "POST", "/api/v1/auth/mfa/reauth",
		map[string]any{"ticket": reOut.Ticket, "code": code}, authRulesCookie(token))
	if ok.Code != http.StatusOK {
		t.Fatalf("MFA-R07: mfa/reauth válido deveria dar 200, obtido %d", ok.Code)
	}
	sess, err := db.GetSession(token)
	if err != nil || sess == nil {
		t.Fatalf("MFA-R07: sessão não encontrada: %v", err)
	}
	if sess.ReauthAt <= old {
		t.Fatalf("MFA-R07: reauth_at não foi atualizado (%d <= %d)", sess.ReauthAt, old)
	}
	if time.Now().UnixMilli()-sess.ReauthAt > 60_000 {
		t.Fatalf("MFA-R07: reauth_at deveria ser recente, obtido %d", sess.ReauthAt)
	}
}
