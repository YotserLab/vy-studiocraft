package main

import (
	"log"
	"net/http"

	"vystudiocraft/internal/config"
	"vystudiocraft/internal/httpapi"
	"vystudiocraft/internal/store"
)

func main() {
	cfg := config.Load()
	db, err := store.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("erro ao abrir banco: %v", err)
	}
	defer db.Close()

	if err := store.SeedIfEnabled(db, cfg); err != nil {
		log.Fatalf("erro ao executar seed: %v", err)
	}

	srv := httpapi.New(db, cfg)
	log.Printf("[VYStudioCraft Go] Servidor escutando em %s (DEV_MODE=%v, USE_MOCK_DATA=%v)", cfg.Addr, cfg.DevMode, cfg.UseMockData)
	if err := http.ListenAndServe(cfg.Addr, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}
