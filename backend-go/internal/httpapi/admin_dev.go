package httpapi

import "net/http"

// handleAdminAudit implementa GET /api/v1/admin/audit (PLA-R05).
func (s *Server) handleAdminAudit(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}

// handleDevSeed implementa POST /api/v1/dev/seed.
func (s *Server) handleDevSeed(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}
