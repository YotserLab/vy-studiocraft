package httpapi

import "net/http"

// handleAuthConfig implementa GET /api/v1/auth/config (CFG-R05).
func (s *Server) handleAuthConfig(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}

// handleAuthProfile implementa POST /api/v1/auth/profile.
func (s *Server) handleAuthProfile(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}
