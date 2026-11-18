package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"vystudiocraft/internal/store"
)

var errProfileUpdateUnsupported = errors.New("atualização de perfil indisponível")

// updateUserDisplayName persiste o display_name do usuário via accessor do store.
// O store expõe updates granulares (UpdateUserVerified, UpdateUserMFA,
// UpdateUserPassword); o update de display name segue o mesmo padrão e é
// resolvido por interface para tolerar o nome do método definido no store.
func updateUserDisplayName(db *store.DB, id, displayName string) error {
	if u, ok := any(db).(interface {
		UpdateUserDisplayName(id string, displayName string) error
	}); ok {
		return u.UpdateUserDisplayName(id, displayName)
	}
	if u, ok := any(db).(interface {
		UpdateDisplayName(id string, displayName string) error
	}); ok {
		return u.UpdateDisplayName(id, displayName)
	}
	return errProfileUpdateUnsupported
}

// handleAuthConfig implementa GET /api/v1/auth/config.
// CFG-R05: endpoint público de configuração de runtime; adminEmailHint só em DEV_MODE.
func (s *Server) handleAuthConfig(w http.ResponseWriter, r *http.Request) {
	// CFG-R05
	cnt, err := s.db.CountUsers()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Erro ao ler configuração."})
		return
	}
	resp := map[string]any{
		"signupOpen":  s.cfg.SignupOpen,
		"hasUsers":    cnt > 0,
		"devMode":     s.cfg.DevMode,
		"useMockData": s.cfg.UseMockData,
	}
	if s.cfg.DevMode && s.cfg.AdminEmail != "" {
		resp["adminEmailHint"] = s.cfg.AdminEmail
	}
	writeJSON(w, http.StatusOK, resp)
}

// handleAuthProfile implementa POST /api/v1/auth/profile.
func (s *Server) handleAuthProfile(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	var body struct {
		DisplayName string `json:"displayName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "JSON inválido."})
		return
	}
	name := strings.TrimSpace(body.DisplayName)
	if name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Nome inválido."})
		return
	}
	if err := updateUserDisplayName(s.db, u.ID, name); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Erro ao atualizar perfil."})
		return
	}
	// CON-R18: mantém o doc membros/{uid} em sincronia (best effort).
	_, _ = s.db.PatchDoc("membros/"+u.ID, map[string]any{"nome": name})
	updated, err := s.db.GetUserByID(u.ID)
	if err != nil || updated == nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Erro ao atualizar perfil."})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": updated})
}
