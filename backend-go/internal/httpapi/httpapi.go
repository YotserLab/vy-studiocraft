package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"vystudiocraft/internal/authx"
	"vystudiocraft/internal/config"
	"vystudiocraft/internal/store"
)

const (
	cookieName   = "vysc_sess"
	reauthWindow = 10 * time.Minute
	feedMaxBytes = 2 * 1024 * 1024
)

type Server struct {
	db        *store.DB
	cfg       config.Config
	mux       *http.ServeMux
	feedMu    sync.RWMutex
	feedCache map[string]cachedFeed
}

type cachedFeed struct {
	body      []byte
	expiresAt time.Time
}

func New(db *store.DB, cfg config.Config) *Server {
	s := &Server{
		db:        db,
		cfg:       cfg,
		mux:       http.NewServeMux(),
		feedCache: make(map[string]cachedFeed),
	}
	s.routes()
	return s
}

func (s *Server) Handler() http.Handler {
	return s.mux
}

func (s *Server) routes() {
	// Auth
	s.mux.HandleFunc("POST /api/v1/auth/signup", s.handleSignup)
	s.mux.HandleFunc("POST /api/v1/auth/login", s.handleLogin)
	s.mux.HandleFunc("POST /api/v1/auth/logout", s.handleLogout)
	s.mux.HandleFunc("GET /api/v1/auth/me", s.handleMe)
	s.mux.HandleFunc("GET /api/v1/auth/token", s.handleToken)
	s.mux.HandleFunc("POST /api/v1/auth/verify-email", s.handleVerifyEmail)
	s.mux.HandleFunc("POST /api/v1/auth/reauth", s.handleReauth)
	s.mux.HandleFunc("POST /api/v1/auth/mfa/start", s.handleMFAStart)
	s.mux.HandleFunc("POST /api/v1/auth/mfa/enroll", s.handleMFAEnroll)
	s.mux.HandleFunc("POST /api/v1/auth/mfa/unenroll", s.handleMFAUnenroll)
	s.mux.HandleFunc("POST /api/v1/auth/mfa/login", s.handleMFALogin)
	s.mux.HandleFunc("POST /api/v1/auth/mfa/reauth", s.handleMFAReauth)
	s.mux.HandleFunc("POST /api/v1/auth/reset", s.handleResetRequest)
	s.mux.HandleFunc("POST /api/v1/auth/reset/confirm", s.handleResetConfirm)
	s.mux.HandleFunc("GET /api/v1/auth/config", s.handleAuthConfig)
	s.mux.HandleFunc("POST /api/v1/auth/profile", s.handleAuthProfile)

	// AI endpoints (Gemini via render-service ou GEMINI_API_KEY)
	s.mux.HandleFunc("POST /api/v1/ai/script", s.handleAIScript)
	s.mux.HandleFunc("POST /api/v1/ai/compare-30s", s.handleAICompare30s)
	s.mux.HandleFunc("POST /api/v1/ai/action", s.handleAIAction)
	s.mux.HandleFunc("POST /api/v1/ai/chat", s.handleAIChat)

	// Admin + Dev
	s.mux.HandleFunc("GET /api/v1/admin/audit", s.handleAdminAudit)
	s.mux.HandleFunc("POST /api/v1/dev/seed", s.handleDevSeed)

	// Docs + SSE
	s.mux.HandleFunc("GET /api/v1/fs/events", s.handleFSEvents)
	s.mux.HandleFunc("GET /api/v1/fs/{path...}", s.handleFSGet)
	s.mux.HandleFunc("POST /api/v1/fs/{path...}", s.handleFSCreate)
	s.mux.HandleFunc("PUT /api/v1/fs/{path...}", s.handleFSSet)
	s.mux.HandleFunc("PATCH /api/v1/fs/{path...}", s.handleFSPatch)
	s.mux.HandleFunc("DELETE /api/v1/fs/{path...}", s.handleFSDelete)

	// Files
	s.mux.HandleFunc("GET /api/v1/files", s.handleFilesList)
	s.mux.HandleFunc("PUT /api/v1/files/{path...}", s.handleFileUpload)
	s.mux.HandleFunc("GET /api/v1/files/{path...}", s.handleFileGet)
	s.mux.HandleFunc("DELETE /api/v1/files/{path...}", s.handleFileDelete)

	// RSS Feed
	s.mux.HandleFunc("GET /api/feed", s.handleFeed)
	s.mux.HandleFunc("GET /feed", s.handleFeed)

	// Render service proxy (Remotion/Gemini) — TRN-R09: exige sessão
	if rp := s.renderProxy(); rp != nil {
		s.mux.Handle("/api/render", s.requireSession(rp))
		s.mux.Handle("/api/rendered", s.requireSession(rp))
		s.mux.Handle("/api/gemini/", s.requireSession(rp))
	}

	// Guard unmatched /api/*
	s.mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Endpoint não encontrado."})
	})

	// SPA + Static
	s.mux.HandleFunc("/", s.handleSPA)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// requireSession devolve 401 JSON antes de delegar ao handler (TRN-R09).
func (s *Server) requireSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, sess := s.currentSession(r); sess == nil {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) currentSession(r *http.Request) (*store.User, *store.Session) {
	var token string
	if c, err := r.Cookie(cookieName); err == nil && c.Value != "" {
		token = c.Value
	} else if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
		token = strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	} else if q := strings.TrimSpace(r.URL.Query().Get("token")); q != "" {
		token = q
	}
	if token == "" {
		return nil, nil
	}
	sess, err := s.db.GetSession(token)
	if err != nil || sess == nil {
		return nil, nil
	}
	u, err := s.db.GetUserByID(sess.UserID)
	if err != nil || u == nil {
		return nil, nil
	}
	return u, sess
}

func isHTTPSRequest(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	xf := strings.ToLower(r.Header.Get("X-Forwarded-Proto"))
	return strings.Contains(xf, "https")
}

func (s *Server) setSessionCookie(w http.ResponseWriter, r *http.Request, token string) {
	secure := isHTTPSRequest(r)
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   s.cfg.SessionDays * 24 * 60 * 60,
	})
}

func (s *Server) handleSignup(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	cnt, _ := s.db.CountUsers()
	isBootstrap := cnt == 0
	if !s.cfg.SignupOpen && !isBootstrap {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Cadastro fechado."})
		return
	}
	if strings.TrimSpace(body.Email) == "" || len(body.Password) < 6 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "E-mail e senha (mín. 6) obrigatórios."})
		return
	}
	if existing, _ := s.db.GetUserByEmail(body.Email); existing != nil {
		writeJSON(w, http.StatusConflict, map[string]any{"error": "E-mail já cadastrado."})
		return
	}
	hash, err := authx.HashPassword(body.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Falha ao processar senha."})
		return
	}
	cleanEmail := strings.ToLower(strings.TrimSpace(body.Email))
	isAdmin := cleanEmail == s.cfg.AdminEmail || isBootstrap
	u, err := s.db.CreateUser("", cleanEmail, hash, body.Name, s.cfg.DevMode, isAdmin)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Erro ao criar usuário."})
		return
	}
	tok, _ := authx.Token(32)
	_, _ = s.db.CreateSession(tok, u.ID, time.Duration(s.cfg.SessionDays)*24*time.Hour)
	s.setSessionCookie(w, r, tok)
	writeJSON(w, http.StatusCreated, map[string]any{"user": u, "token": tok})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	u, _ := s.db.GetUserByEmail(body.Email)
	if u == nil || !authx.CheckPassword(body.Password, u.PassHash) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Credenciais inválidas."})
		return
	}
	if u.MFASecret != nil && *u.MFASecret != "" {
		ticket, _ := authx.Token(24)
		_ = s.db.CreatePendingLogin(ticket, u.ID, "login", 5*time.Minute)
		writeJSON(w, http.StatusOK, map[string]any{
			"mfaRequired": true,
			"ticket":      ticket,
			"hints":       map[string]any{"email": u.Email},
		})
		return
	}
	tok, _ := authx.Token(32)
	_, _ = s.db.CreateSession(tok, u.ID, time.Duration(s.cfg.SessionDays)*24*time.Hour)
	s.setSessionCookie(w, r, tok)
	writeJSON(w, http.StatusOK, map[string]any{"user": u, "token": tok})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if _, sess := s.currentSession(r); sess != nil {
		_ = s.db.DeleteSession(sess.Token)
	}
	secure := isHTTPSRequest(r)
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: secure, SameSite: sameSite})
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": u, "token": sess.Token})
}

func (s *Server) handleToken(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil || sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": sess.Token})
}

func (s *Server) handleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	_ = s.db.UpdateUserVerified(u.ID, true)
	updated, _ := s.db.GetUserByID(u.ID)
	resp := map[string]any{"ok": true, "user": updated}
	if s.cfg.DevMode {
		resp["debugLink"] = s.cfg.AppOrigin + "/configuracoes?verified=1"
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) handleReauth(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil || sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || !authx.CheckPassword(body.Password, u.PassHash) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Senha incorreta."})
		return
	}
	if u.MFASecret != nil && *u.MFASecret != "" {
		ticket, _ := authx.Token(24)
		_ = s.db.CreatePendingLogin(ticket, u.ID, "reauth", 5*time.Minute)
		writeJSON(w, http.StatusOK, map[string]any{"mfaRequired": true, "ticket": ticket})
		return
	}
	_ = s.db.TouchReauth(sess.Token)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func hasRecentReauth(sess *store.Session) bool {
	return sess != nil && time.Now().UnixMilli()-sess.ReauthAt <= reauthWindow.Milliseconds()
}

func (s *Server) handleMFAStart(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	if !hasRecentReauth(sess) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Reautenticação necessária."})
		return
	}
	sec, _ := authx.NewTOTPSecret()
	writeJSON(w, http.StatusOK, map[string]any{"secret": sec})
}

func (s *Server) handleMFAEnroll(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	if !hasRecentReauth(sess) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Reautenticação necessária."})
		return
	}
	var body struct {
		Secret string `json:"secret"`
		Code   string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || !authx.CheckTOTP(body.Secret, body.Code, time.Now()) {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Código TOTP inválido."})
		return
	}
	_ = s.db.UpdateUserMFA(u.ID, &body.Secret)
	updated, _ := s.db.GetUserByID(u.ID)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "user": updated})
}

func (s *Server) handleMFAUnenroll(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	if !hasRecentReauth(sess) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Reautenticação necessária."})
		return
	}
	_ = s.db.UpdateUserMFA(u.ID, nil)
	updated, _ := s.db.GetUserByID(u.ID)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "user": updated})
}

func (s *Server) handleMFALogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Ticket string `json:"ticket"`
		Code   string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	pending, _ := s.db.GetPendingLogin(body.Ticket)
	if pending == nil || pending.Purpose != "login" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Ticket MFA inválido ou expirado."})
		return
	}
	u, _ := s.db.GetUserByID(pending.UserID)
	if u == nil || u.MFASecret == nil || !authx.CheckTOTP(*u.MFASecret, body.Code, time.Now()) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Código TOTP incorreto."})
		return
	}
	_ = s.db.ConsumePendingLogin(body.Ticket)
	tok, _ := authx.Token(32)
	_, _ = s.db.CreateSession(tok, u.ID, time.Duration(s.cfg.SessionDays)*24*time.Hour)
	s.setSessionCookie(w, r, tok)
	writeJSON(w, http.StatusOK, map[string]any{"user": u})
}

func (s *Server) handleMFAReauth(w http.ResponseWriter, r *http.Request) {
	u, sess := s.currentSession(r)
	if u == nil || sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body struct {
		Ticket string `json:"ticket"`
		Code   string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	pending, _ := s.db.GetPendingLogin(body.Ticket)
	if pending == nil || pending.Purpose != "reauth" || pending.UserID != u.ID {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Ticket de reauth inválido."})
		return
	}
	if u.MFASecret == nil || !authx.CheckTOTP(*u.MFASecret, body.Code, time.Now()) {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Código TOTP incorreto."})
		return
	}
	_ = s.db.ConsumePendingLogin(body.Ticket)
	_ = s.db.TouchReauth(sess.Token)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleResetRequest(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Email) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Informe o e-mail."})
		return
	}
	resp := map[string]any{"ok": true, "message": "Se cadastrado, o link foi gerado."}
	if u, _ := s.db.GetUserByEmail(body.Email); u != nil {
		tok, _ := authx.Token(24)
		_ = s.db.CreatePasswordReset(tok, u.ID, time.Hour)
		if s.cfg.DevMode {
			resp["debugLink"] = s.cfg.AppOrigin + "/recuperar-senha/?token=" + tok
		}
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) handleResetConfirm(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || len(body.Password) < 6 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Token e senha (mín. 6) obrigatórios."})
		return
	}
	uid, _ := s.db.ConsumePasswordReset(body.Token)
	if uid == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Token inválido ou expirado."})
		return
	}
	hash, _ := authx.HashPassword(body.Password)
	_ = s.db.UpdateUserPassword(uid, hash)
	_ = s.db.DeleteUserSessions(uid)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// ===================================
// Documents (/api/v1/fs/*)
// ===================================

func parseListOpts(r *http.Request) store.ListOptions {
	var opts store.ListOptions
	if w := r.URL.Query().Get("where"); strings.Contains(w, "|") {
		parts := strings.SplitN(w, "|", 3)
		if len(parts) == 3 {
			opts.Where = &store.WhereClause{Field: strings.TrimSpace(parts[0]), Op: strings.TrimSpace(parts[1]), RawValue: parts[2]}
		}
	}
	if ob := strings.TrimSpace(r.URL.Query().Get("orderBy")); ob != "" {
		parts := strings.SplitN(ob, ":", 2)
		opts.OrderByField = parts[0]
		opts.OrderDesc = len(parts) == 2 && parts[1] == "desc"
	}
	if l := strings.TrimSpace(r.URL.Query().Get("limit")); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			opts.Limit = n
		}
	}
	return opts
}

func canListCollection(u *store.User, coll string) bool {
	if u == nil {
		return false
	}
	if u.IsAdmin {
		return true
	}
	parts := strings.Split(store.NormalizePath(coll), "/")
	if len(parts) == 0 {
		return false
	}
	switch parts[0] {
	case "usuarios":
		return len(parts) >= 2 && parts[1] == u.ID
	case "planos", "aulas":
		return true
	default:
		return false
	}
}

func (s *Server) handleFSEvents(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	watchPath := store.NormalizePath(r.URL.Query().Get("path"))
	segs := strings.Split(watchPath, "/")
	allowed := false
	if watchPath == "" {
		allowed = u.IsAdmin
	} else if len(segs)%2 == 1 {
		allowed = canListCollection(u, watchPath)
	} else {
		allowed = store.CanReadDoc(u, watchPath)
	}
	if !allowed {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Streaming não suportado."})
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	fmt.Fprintf(w, "event: connected\ndata: {\"path\":%q}\n\n", watchPath)
	flusher.Flush()

	ch, unsub := s.db.Subscribe()
	defer unsub()
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			fmt.Fprintf(w, ": keepalive %d\n\n", time.Now().UnixMilli())
			flusher.Flush()
		case changed := <-ch:
			if watchPath == "" || changed == watchPath || strings.HasPrefix(changed, watchPath+"/") {
				fmt.Fprintf(w, "event: change\ndata: {\"path\":%q}\n\n", changed)
				flusher.Flush()
			}
		}
	}
}

func (s *Server) handleFSGet(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if clean == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Path obrigatório."})
		return
	}
	segs := strings.Split(clean, "/")
	if len(segs)%2 == 1 {
		if !canListCollection(u, clean) {
			writeJSON(w, http.StatusForbidden, map[string]any{"error": "Acesso negado à coleção."})
			return
		}
		docs, err := s.db.ListDocs(clean, parseListOpts(r))
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		if docs == nil {
			docs = []store.Doc{}
		}
		writeJSON(w, http.StatusOK, map[string]any{"docs": docs})
		return
	}
	if !store.CanReadDoc(u, clean) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Acesso negado."})
		return
	}
	doc, err := s.db.GetDoc(clean)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, doc)
}

func (s *Server) handleFSCreate(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if clean == "" || len(strings.Split(clean, "/"))%2 == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Coleção inválida."})
		return
	}
	if !store.CanWriteDoc(u, clean+"/_new", true) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	var body struct {
		Data map[string]any `json:"data"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Data == nil {
		body.Data = map[string]any{}
	}
	doc, err := s.db.CreateDoc(clean, body.Data)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, doc)
}

func (s *Server) handleFSSet(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if clean == "" || len(strings.Split(clean, "/"))%2 != 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Documento inválido."})
		return
	}
	if !store.CanWriteDoc(u, clean, true) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	var body struct {
		Data  map[string]any `json:"data"`
		Merge bool           `json:"merge"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Data == nil {
		body.Data = map[string]any{}
	}
	doc, err := s.db.SetDoc(clean, body.Data, body.Merge)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, doc)
}

func (s *Server) handleFSPatch(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if clean == "" || len(strings.Split(clean, "/"))%2 != 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Documento inválido."})
		return
	}
	if !store.CanWriteDoc(u, clean, false) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	var body struct {
		Data map[string]any `json:"data"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	doc, err := s.db.PatchDoc(clean, body.Data)
	if errors.Is(err, store.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Documento não encontrado."})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, doc)
}

func (s *Server) handleFSDelete(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if clean == "" || len(strings.Split(clean, "/"))%2 != 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Documento inválido."})
		return
	}
	if !store.CanWriteDoc(u, clean, false) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	ok, err := s.db.DeleteDoc(clean)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": ok, "path": clean})
}

// ===================================
// Files (/api/v1/files*)
// ===================================

func (s *Server) handleFilesList(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	prefix := store.NormalizePath(r.URL.Query().Get("prefix"))
	if prefix == "" {
		prefix = "usuarios/" + u.ID
	}
	if !store.CanAccessFile(u, prefix) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Acesso negado."})
		return
	}
	items, prefixes, err := s.db.ListFiles(prefix)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "prefixes": prefixes})
}

func (s *Server) handleFileUpload(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if !store.CanAccessFile(u, clean) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Acesso negado."})
		return
	}
	maxBytes := s.cfg.UploadMaxMB * 1024 * 1024
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	data, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]any{"error": "Arquivo excede o limite."})
		return
	}
	parts := strings.Split(clean, "/")
	uid := parts[1]
	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		name = parts[len(parts)-1]
	}
	ct := strings.TrimSpace(r.URL.Query().Get("ct"))
	if ct == "" {
		ct = r.Header.Get("Content-Type")
	}
	if ct == "" {
		ct = "application/octet-stream"
	}
	disk := filepath.Join(s.cfg.DataDir, "files", filepath.FromSlash(clean))
	if err := os.MkdirAll(filepath.Dir(disk), 0o755); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	if err := os.WriteFile(disk, data, 0o644); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	saved, err := s.db.UpsertFileMeta(store.FileMeta{
		Path: clean, UID: uid, Name: name, ContentType: ct, Size: int64(len(data)), Disk: disk,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, saved)
}

func (s *Server) handleFileGet(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if clean == "" {
		// /api/v1/files/ com trailing slash equivale à listagem
		s.handleFilesList(w, r)
		return
	}
	mode := "meta"
	if r.URL.Query().Get("download") == "1" {
		mode = "download"
	}
	if strings.HasSuffix(clean, "/meta") {
		clean = strings.TrimSuffix(clean, "/meta")
		mode = "meta"
	} else if strings.HasSuffix(clean, "/download") {
		clean = strings.TrimSuffix(clean, "/download")
		mode = "download"
	}
	if !store.CanAccessFile(u, clean) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Acesso negado."})
		return
	}
	meta, err := s.db.GetFileMeta(clean)
	if err != nil || meta == nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Arquivo não encontrado."})
		return
	}
	if mode == "meta" {
		writeJSON(w, http.StatusOK, meta)
		return
	}
	w.Header().Set("Content-Type", meta.ContentType)
	http.ServeFile(w, r, meta.Disk)
}

func (s *Server) handleFileDelete(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	clean := store.NormalizePath(r.PathValue("path"))
	if !store.CanAccessFile(u, clean) {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Acesso negado."})
		return
	}
	removed, err := s.db.DeleteFileMeta(clean)
	if err != nil || removed == nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Arquivo não encontrado."})
		return
	}
	_ = os.Remove(removed.Disk)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "path": clean})
}

// ===================================
// RSS Feed (/api/feed, /feed)
// ===================================

func (s *Server) handleFeed(w http.ResponseWriter, r *http.Request) {
	// TRN-R08: proxy RSS exige sessão (SSRF fechado)
	if _, sess := s.currentSession(r); sess == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	rawURL := strings.TrimSpace(r.URL.Query().Get("url"))
	u, err := url.Parse(rawURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "URL RSS inválida."})
		return
	}
	s.feedMu.RLock()
	cached, ok := s.feedCache[u.String()]
	s.feedMu.RUnlock()
	if ok && time.Now().Before(cached.expiresAt) {
		w.Header().Set("Content-Type", "application/xml; charset=utf-8")
		_, _ = w.Write(cached.body)
		return
	}

	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Get(u.String())
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": err.Error()})
		return
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, feedMaxBytes+1))
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"error": err.Error()})
		return
	}
	if len(body) > feedMaxBytes {
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]any{"error": "Feed excede 2MB."})
		return
	}
	s.feedMu.Lock()
	s.feedCache[u.String()] = cachedFeed{body: body, expiresAt: time.Now().Add(5 * time.Minute)}
	s.feedMu.Unlock()

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	_, _ = w.Write(body)
}

// ===================================
// Static & SPA Routes
// ===================================

var exactSPARoutes = map[string]bool{
	"/": true, "/entrar": true, "/cadastro": true, "/radar": true,
	"/visao-geral": true, "/projetos": true, "/videos-salvos": true,
	"/aulas": true, "/meus-canais": true, "/canais": true,
	"/explorar": true, "/pesquisa": true, "/biblioteca": true,
	"/notas": true, "/roteirista": true, "/playbook": true,
	"/comparar-30s": true, "/noticias": true, "/publicidade": true,
	"/configuracoes": true, "/ajuda": true, "/admin": true,
	"/recuperar-senha": true, "/recuperar-senha/": true,
	"/templates": true, "/templates/ai-studio": true,
	"/templates/motion-library": true,
}

var prefixSPARoutes = []string{"/projetos/", "/canais/", "/admin/", "/radar/perfis/", "/templates/"}

func isKnownSPA(p string) bool {
	if exactSPARoutes[p] {
		return true
	}
	trimmed := p
	if len(trimmed) > 1 {
		trimmed = strings.TrimRight(trimmed, "/")
	}
	if exactSPARoutes[trimmed] {
		return true
	}
	for _, pref := range prefixSPARoutes {
		if strings.HasPrefix(p, pref) {
			return true
		}
	}
	return false
}

var renderProxyOnce struct {
	once  sync.Once
	proxy http.Handler
}

func (s *Server) renderProxy() http.Handler {
	renderProxyOnce.once.Do(func() {
		target, err := url.Parse(s.cfg.RenderURL)
		if err != nil {
			return
		}
		renderProxyOnce.proxy = httputil.NewSingleHostReverseProxy(target)
	})
	return renderProxyOnce.proxy
}

var mediaPrefixes = []string{"/rendered/", "/thumbnails/", "/previews/", "/rendercomp-thumbs/", "/cache/"}

func isMediaPath(p string) bool {
	for _, pref := range mediaPrefixes {
		if strings.HasPrefix(p, pref) {
			return true
		}
	}
	return false
}

func (s *Server) handleSPA(w http.ResponseWriter, r *http.Request) {
	// Mídia da feature remotion-templates vem de MEDIA_DIR (fora do dist/)
	if isMediaPath(r.URL.Path) {
		// TRN-R11: /cache/ guarda artefatos internos, exige sessão
		if strings.HasPrefix(r.URL.Path, "/cache/") {
			if _, sess := s.currentSession(r); sess == nil {
				writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
				return
			}
		}
		mediaTarget := filepath.Join(s.cfg.MediaDir, filepath.Clean(strings.TrimPrefix(r.URL.Path, "/")))
		if info, err := os.Stat(mediaTarget); err == nil && !info.IsDir() {
			http.ServeFile(w, r, mediaTarget)
			return
		}
	}
	diskTarget := filepath.Join(s.cfg.WebDir, filepath.Clean(r.URL.Path))
	if info, err := os.Stat(diskTarget); err == nil && !info.IsDir() {
		http.ServeFile(w, r, diskTarget)
		return
	}
	indexFile := filepath.Join(s.cfg.WebDir, "index.html")
	if !isKnownSPA(r.URL.Path) {
		w.WriteHeader(http.StatusNotFound)
	}
	if _, err := os.Stat(indexFile); err == nil {
		http.ServeFile(w, r, indexFile)
		return
	}
	if isKnownSPA(r.URL.Path) {
		w.WriteHeader(http.StatusOK)
	}
	_, _ = w.Write([]byte("VYStudioCraft API"))
}
