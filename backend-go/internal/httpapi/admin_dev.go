package httpapi

import (
	"net/http"
	"strconv"

	"vystudiocraft/internal/store"
)

const (
	auditDefaultLimit = 100
	auditMaxLimit     = 500
)

// auditEventJSON serializa um evento de auditoria com userId null quando ausente.
type auditEventJSON struct {
	ID        int64   `json:"id"`
	UserID    *string `json:"userId"`
	Action    string  `json:"action"`
	Detail    string  `json:"detail"`
	CreatedAt int64   `json:"createdAt"`
}

// handleAdminAudit implementa GET /api/v1/admin/audit (PLA-R05: somente admin).
func (s *Server) handleAdminAudit(w http.ResponseWriter, r *http.Request) {
	// PLA-R05
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	if !u.IsAdmin {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	limit := auditDefaultLimit
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 {
			limit = n
		}
	}
	if limit > auditMaxLimit {
		limit = auditMaxLimit
	}
	events, err := s.db.ListAudit(limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Erro ao listar auditoria."})
		return
	}
	out := make([]auditEventJSON, 0, len(events))
	for _, ev := range events {
		item := auditEventJSON{
			ID:        ev.ID,
			Action:    ev.Action,
			Detail:    ev.Detail,
			CreatedAt: ev.CreatedAt,
		}
		if ev.UserID != "" {
			uid := ev.UserID
			item.UserID = &uid
		}
		out = append(out, item)
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": out})
}

// handleDevSeed implementa POST /api/v1/dev/seed (somente DEV_MODE + admin).
func (s *Server) handleDevSeed(w http.ResponseWriter, r *http.Request) {
	u, _ := s.currentSession(r)
	if u == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "Não autenticado."})
		return
	}
	if !u.IsAdmin {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Sem permissão."})
		return
	}
	if !s.cfg.DevMode {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "Disponível apenas em DEV_MODE."})
		return
	}
	if err := store.SeedIfEnabled(s.db, s.cfg); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "Falha ao aplicar seed."})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "message": "Seed aplicado."})
}
