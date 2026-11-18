package httpapi

import "net/http"

// handleAIAction implementa POST /api/v1/ai/action (CAN-R04, RAD-R07, NOT-R04, MID-R07).
func (s *Server) handleAIAction(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}

// handleAIChat implementa POST /api/v1/ai/chat (IDE-R04).
func (s *Server) handleAIChat(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, map[string]any{"error": "Not implemented."})
}
