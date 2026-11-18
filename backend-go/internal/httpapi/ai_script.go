package httpapi

import "net/http"

// handleAIScript implementa POST /api/v1/ai/script (ROT-R06).
func (s *Server) handleAIScript(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}
