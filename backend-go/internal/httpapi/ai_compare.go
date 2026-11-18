package httpapi

import "net/http"

// handleAICompare30s implementa POST /api/v1/ai/compare-30s (CMP-R04).
func (s *Server) handleAICompare30s(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}
